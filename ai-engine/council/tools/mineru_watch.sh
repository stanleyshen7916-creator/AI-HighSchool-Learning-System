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

    # 2026-11-18 AHS-UP2 P1-0c：nice 降低優先權，解析期間電腦其餘工作仍能回應。
    if nice -n 10 mineru -p "${f}" -o "${OUTPUT_DIR}" -b pipeline -m ocr -l ch > "${job_dir}/mineru.log" 2>&1; then
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
