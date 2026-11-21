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

# 2026-11-21：OCR 參數可由 docker-compose 的環境變數覆寫（預設值與過去寫死的完全相同）。
#   MINERU_BACKEND  pipeline（CPU）｜vlm-*／hybrid-*（需另外安裝對應依賴與 GPU）
#   MINERU_METHOD   ocr｜txt｜auto（掃描／拍照頁用 ocr；PDF 有可靠文字層時 auto 較快）
#   MINERU_LANG     ch（中英）｜chinese_cht（繁體）｜japan｜korean｜en … 見 mineru --help
#   MINERU_FORMULA  true｜false（解析公式；關閉可加速純文字教材）
#   MINERU_TABLE    true｜false（解析表格）
MINERU_BACKEND="${MINERU_BACKEND:-pipeline}"
MINERU_METHOD="${MINERU_METHOD:-ocr}"
MINERU_LANG="${MINERU_LANG:-ch}"
MINERU_FORMULA="${MINERU_FORMULA:-true}"
MINERU_TABLE="${MINERU_TABLE:-true}"

echo "[mineru-watch] watching ${INPUT_DIR}（backend=${MINERU_BACKEND} method=${MINERU_METHOD} lang=${MINERU_LANG} formula=${MINERU_FORMULA} table=${MINERU_TABLE}）"

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

    if mineru -p "${f}" -o "${OUTPUT_DIR}" -b "${MINERU_BACKEND}" -m "${MINERU_METHOD}" -l "${MINERU_LANG}" -f "${MINERU_FORMULA}" -t "${MINERU_TABLE}" > "${job_dir}/mineru.log" 2>&1; then
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
