# 教材上傳引擎（原 AI-Study-Council agent-runner）。
# 執行時整個學習平台 repo 掛載在 /platform（見 docker-compose.yml），
# 引擎才能把教材包寫入 /platform/docs/TeachingMaterials 並提供 upload.html。
FROM node:20-slim

WORKDIR /platform/ai-engine/council

COPY package*.json ./
RUN npm ci --omit=dev

CMD ["node", "server.js"]
