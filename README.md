# LedgerLens

LedgerLens 是一個現代化的財務記帳應用程式，旨在透過直觀的介面與強大的 AI 分析功能，協助使用者輕鬆管理個人財務。使用者只需上傳 CSV 格式的交易紀錄，即可自動生成視覺化報表，並透過 AI 進行深入的趨勢分析與智慧查詢。

## 功能特色

- **首頁與檔案上傳**
  - 支援拖拉或點擊選擇 CSV 檔案進行上傳。
  - 簡潔的 Header 與 Footer 設計，提供流暢的使用者體驗。

- **總覽看板 (Dashboard)**
  - 視覺化呈現財務摘要，包含本月支出、收入、交易筆數。
  - 提供支出分類圓餅圖與近六個月支出趨勢圖，財務狀況一目瞭然。

- **交易明細管理**
  - 完整條列上傳的交易紀錄，預設依時間降冪排序。
  - **強大篩選功能**：支援關鍵字搜尋，以及依收支類型、分類、日期範圍、金額範圍進行進階篩選。

- **AI 趨勢分析**
  - **月環比分析**：深入比較本月與上個月的收支變化。
  - **年同比分析**：對比今年與去年同期的財務表現，掌握長期趨勢。

- **AI 智慧搜尋**
  - 內建對話式介面，串接 AI API。
  - 使用者可使用自然語言提問（如「上週餐飲花費多少？」），系統將根據交易紀錄提供精準回答。

## 技術架構

本專案採用前後端分離架構，確保系統的可維護性與擴充性。

### 後端技術 (Backend)

後端採用高效能的 **Go** 語言開發，專注於提供穩定且快速的 API 服務。

- **核心語言**: **Go (Golang)** - 兼具效能與開發效率的現代化語言。
- **Web 框架**: **Gin** - 輕量級且高效能的 HTTP Web 框架。
- **資料庫**: **PostgreSQL** - 強大且穩定的開源關聯式資料庫。
- **ORM 工具**: **GORM** - 優秀的 Go 語言 ORM 函式庫，簡化資料庫操作。
- **遷移工具**: **golang-migrate** - 嚴謹的資料庫版本控制與遷移工具。

## 前端開發指南

本專案前端使用 **Angular 21** 框架開發。

### 環境準備與安裝

請確保您的環境已安裝 Node.js，並依照以下步驟啟動專案：

1. **進入前端目錄**
   ```bash
   cd frontend
   ```

2. **安裝相依套件**
   ```bash
   npm install --legacy-peer-deps
   ```

## 啟動方式說明

### 前端（Angular）

1. **Node.js 版本需求**：請使用 Node.js v22 以上
2. 安裝依賴：
   ```sh
   cd frontend
   npm install
   ```
3. 啟動開發伺服器：
   ```sh
   npm start
   # 或
   ng serve
   ```

### 後端（Go）

1. 安裝依賴：
   ```sh
   cd backend
   go mod tidy
   ```
2. 啟動伺服器：
   ```sh
   go run main.go
   ```

---

## 資料庫 Migration 管理（golang-migrate）

本專案使用 [`golang-migrate`](https://github.com/golang-migrate/migrate) 來管理 PostgreSQL schema 版本。

### migration 檔案命名規則

- 檔案放在 `db/migrations/` 目錄下
- 命名格式為：
  ```
  [順序]_[描述].up.sql
  [順序]_[描述].down.sql
  ```
- `.up.sql`：升級（建立/修改資料表）
- `.down.sql`：降級（還原/刪除資料表）

### 常用 migrate 指令

**升級（執行所有 up migration）**
```sh
migrate -path db/migrations -database "postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=disable" up
```

**降級（回滾一個 migration）**
```sh
migrate -path db/migrations -database "postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=disable" down 1
```

**指定步數升級/降級**
```sh
# 升級 2 步
migrate -path db/migrations -database "postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=disable" up 2
# 降級 2 步
migrate -path db/migrations -database "postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=disable" down 2
```

**更多用法請參考官方文件：** https://github.com/golang-migrate/migrate

---
