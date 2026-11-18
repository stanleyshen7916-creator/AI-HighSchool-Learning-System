#!/usr/bin/env bash
# MinerU 佇列處理迴圈：持續監看 /data/inputs，逐一（非平行）處理新檔案，
# 寫入 /data/outputs/<stem>/ 並用 .done／.error sentinel 檔標示完成狀態，
# 供 server.js（agent-runner 容器）輪詢讀取結果。
#
# 不平行處理：這台機器只有一組 CPU 資源配額（docker-compose.agent.yml 的
# cpus 限制），同時跑多個 mineru 行程只會互搶資源、拖慢每一個工作，
# 不會真的加速整體吞吐量。
set -uo pipefail

INPUT_DIR=/data/inputs
OUTPUT_DIR=/data/outputs

# 2026-11-18 AHS-UP2 P1-0c-2：多頁 PDF 依頁數分段解析。24 頁一次解析的記憶體高峰太大（這台電腦當機過一次，
# 主機可用記憶體本來就只剩 3 GB 左右）。每段 MINERU_CHUNK_PAGES 頁（預設 8），段與段之間依序執行、
# 記憶體隨段釋放；解析完把各段的 md／圖片／content_list.json 合併成與單次解析相同的輸出結構。
CHUNK_PAGES="${MINERU_CHUNK_PAGES:-8}"

# $1=檔案 $2=輸出目錄 $3=起始頁（0 起算，可省略） $4=結束頁（含，可省略）
mineru_once() {
  # nice 降低優先權，解析期間電腦其餘工作仍能回應（P1-0c）。
  nice -n 10 mineru -p "$1" -o "$2" -b pipeline -m ocr -l ch ${3:+-s "$3"} ${4:+-e "$4"}
}

# $1=檔案 $2=工作目錄 $3=stem；成功回傳 0
run_mineru() {
  local f="$1" job_dir="$2" stem="$3" log="$2/mineru.log" pages=0
  case "${f,,}" in
    *.pdf) pages="$(python -c "import sys, pypdfium2 as p; print(len(p.PdfDocument(sys.argv[1])))" "${f}" 2>>"${log}" || echo 0)" ;;
  esac
  if [ "${pages}" -le "${CHUNK_PAGES}" ]; then
    mineru_once "${f}" "${OUTPUT_DIR}" > "${log}" 2>&1
    return $?
  fi
  echo "[chunk] ${pages} pages, ${CHUNK_PAGES} pages per chunk" > "${log}"
  local s=0 k=0 e
  while [ "${s}" -lt "${pages}" ]; do
    e=$(( s + CHUNK_PAGES - 1 ))
    [ "${e}" -ge "${pages}" ] && e=$(( pages - 1 ))
    echo "[chunk ${k}] pages ${s}-${e}" >> "${log}"
    mineru_once "${f}" "${job_dir}/_chunk_${k}" "${s}" "${e}" >> "${log}" 2>&1 || return 1
    s=$(( e + 1 ))
    k=$(( k + 1 ))
  done
  python - "${job_dir}" "${stem}" "${k}" "${CHUNK_PAGES}" >> "${log}" 2>&1 <<'PY' || return 1
import json, os, shutil, sys
job, stem, k, chunk = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
out = os.path.join(job, 'ocr')
os.makedirs(os.path.join(out, 'images'), exist_ok=True)
md, content = [], []
for i in range(k):
    d = os.path.join(job, '_chunk_%d' % i, stem, 'ocr')
    md.append(open(os.path.join(d, stem + '.md'), encoding='utf8').read().strip())
    cj = os.path.join(d, stem + '_content_list.json')
    if os.path.exists(cj):
        for item in json.load(open(cj, encoding='utf8')):
            if isinstance(item.get('page_idx'), int):
                item['page_idx'] += i * chunk
            content.append(item)
    img = os.path.join(d, 'images')
    if os.path.isdir(img):
        for name in os.listdir(img):
            shutil.copy2(os.path.join(img, name), os.path.join(out, 'images', name))
open(os.path.join(out, stem + '.md'), 'w', encoding='utf8').write('\n\n'.join(md) + '\n')
json.dump(content, open(os.path.join(out, stem + '_content_list.json'), 'w', encoding='utf8'), ensure_ascii=False)
print('[merge] %d chunks, %d images' % (k, len(os.listdir(os.path.join(out, 'images')))))
PY
  rm -rf "${job_dir}"/_chunk_*
  return 0
}

echo "[mineru-watch] watching ${INPUT_DIR}"

while true; do
  # 心跳：server.js 的 runMinerU() 靠這個檔案的 mtime 判斷 watch loop 是否還活著，
  # 沒看到近期心跳就直接放棄等待、改走 Tesseract fallback，不會整個請求卡住空等逾時。
  date +%s > "${OUTPUT_DIR}/.heartbeat"

  shopt -s nullglob
  for f in "${INPUT_DIR}"/*.pdf "${INPUT_DIR}"/*.png "${INPUT_DIR}"/*.jpg "${INPUT_DIR}"/*.jpeg; do
    base="$(basename "${f}")"
    stem="${base%.*}"
    job_dir="${OUTPUT_DIR}/${stem}"
    lock="${job_dir}/.lock"
    done_marker="${job_dir}/.done"
    error_marker="${job_dir}/.error"

    # 已經處理過（成功／失敗）或正在處理中：略過，避免重複工作。
    if [ -e "${done_marker}" ] || [ -e "${error_marker}" ] || [ -e "${lock}" ]; then
      continue
    fi

    mkdir -p "${job_dir}"
    touch "${lock}"
    echo "[mineru-watch] processing ${base}"

    # 2026-11-16 A12：照片依 EXIF 方向自動轉正後再辨識（手機照片常被存成橫向／上下顛倒）。
    case "${f,,}" in
      *.jpg|*.jpeg|*.png)
        python - "${f}" <<'PY' >> "${job_dir}/mineru.log" 2>&1 || true
import sys
from PIL import Image, ImageOps
p = sys.argv[1]
im = Image.open(p)
if im.getexif().get(0x0112, 1) != 1:
    ImageOps.exif_transpose(im).save(p, quality=95)
    print('[orient] exif_transpose applied')
PY
        ;;
    esac

    if run_mineru "${f}" "${job_dir}" "${stem}"; then
      touch "${done_marker}"
      echo "[mineru-watch] done ${base}"
    else
      echo "FAILED" > "${error_marker}"
      echo "[mineru-watch] FAILED ${base}（詳見 ${job_dir}/mineru.log）"
    fi

    rm -f "${lock}"
    # 來源檔只是佇列用的暫存副本（server.js 自己在 uploads/ 還留著原始檔），
    # 處理完（無論成功失敗）就清掉，避免下一輪迴圈重複掃到同一份。
    rm -f "${f}"
  done
  sleep 2
done
