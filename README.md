# Voice Chat Application

一個基於 Cloudflare Workers 和 React 的語音聊天應用程式，支援多種 AI 提供商。

## 專案結構

```
voice-chat/
├── frontend/          # React 前端應用
│   ├── src/
│   │   ├── App.jsx
│   │   ├── VoiceChat.jsx
│   │   └── Settings.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/           # Cloudflare Workers 後端
│   ├── src/
│   │   └── index.js
│   ├── public/        # 前端打包後的靜態文件
│   ├── wrangler.toml
│   └── package.json
└── package.json       # 根目錄工作區配置
```

## 功能特色

- 🎤 **語音輸入**: 支援瀏覽器語音辨識
- 🔊 **語音播報**: 自動語音回應，多種語音風格
- 🤖 **AI 整合**: 支援 Cloudflare AI 和 Anthropic Claude
- ⚡ **快速部署**: 一鍵部署到 Cloudflare Workers
- 📱 **響應式設計**: 支援手機和桌面設備

## 技術棧

### 前端

- **React 18**: 用戶界面框架
- **Vite**: 構建工具和開發服務器
- **Tailwind CSS**: 樣式框架
- **react-speech-recognition**: 語音辨識
- **Web Speech API**: 語音合成

### 後端

- **Cloudflare Workers**: 無服務器運行環境 (使用 Web API 標準)
- **Wrangler 4**: 部署和開發工具
- **Cloudflare AI**: 內建 AI 服務
- **Anthropic Claude**: 外部 AI 服務

**重要**: 不使用 Express 或其他 Node.js 框架，因為 Cloudflare Workers 不支援 Node.js 模組，必須使用 Web API 標準。

## 快速開始

### 1. 安裝依賴

```bash
npm run install:all
```

### 2. 本地開發

```bash
# 同時啟動前端和後端開發服務器
npm run dev

# 或者分別啟動
npm run dev:frontend  # 前端開發服務器 (http://localhost:5173)
npm run dev:backend   # 後端開發服務器 (http://localhost:8787)
```

### 3. 構建專案

```bash
npm run build
```

## 部署到 Cloudflare Workers

### 1. 安裝 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登入 Cloudflare

```bash
wrangler login
```

### 3. 配置環境變數

```bash
# 如果使用 Anthropic Claude
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put ANTHROPIC_MODEL

# 設置 AI 提供商
wrangler secret put AI_PROVIDER
```

### 4. 部署

```bash
# 部署到生產環境
npm run deploy

# 部署到測試環境
npm run deploy:staging
```

## 配置選項

### AI 提供商

在 `backend/wrangler.toml` 中配置：

```toml
[vars]
AI_PROVIDER = "cloudflare"  # 或 "anthropic"
```

### 環境變數

- `AI_PROVIDER`: AI 提供商 (`cloudflare` 或 `anthropic`)
- `ANTHROPIC_API_KEY`: Anthropic API 金鑰 (僅在使用 Anthropic 時需要)
- `ANTHROPIC_MODEL`: Anthropic 模型名稱 (預設: `claude-3-haiku-20240307`)

## 開發指南

### 前端開發

前端使用 React + Vite + Tailwind CSS：

```bash
cd frontend
npm run dev
```

### 後端開發

後端使用 Cloudflare Workers：

```bash
cd backend
npm run dev
```

### 添加新的 AI 提供商

1. 在 `backend/src/index.js` 中添加新的處理函數
2. 在 `handleMessages` 函數中添加新的條件分支
3. 更新 `wrangler.toml` 配置

## 故障排除

### 語音辨識不工作

- 確保使用 HTTPS 或 localhost
- 檢查瀏覽器是否支援 Web Speech API
- 確認麥克風權限已授予

### AI 回應錯誤

- 檢查 API 金鑰是否正確設置
- 確認網路連接正常
- 查看 Cloudflare Workers 日誌

## 授權

MIT License
