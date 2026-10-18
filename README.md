# 數獨個人網站

純靜態網站（HTML / CSS / JS），不需要建置，可直接放上 GitHub Pages。

- `index.html` 首頁，三個主題卡片
- `strategies/` 主題一：27 種解題策略動畫（3Blue1Brown 風格）
- `topic-2/`、`topic-3/` 預留主題
- `js/config.js` **先改這個**：名字、帳號、連結、三個主題的標題與簡介
- `js/scenes.js` 策略內容（文字、圖、每一步的說明）

## 部署到 GitHub Pages

1. 在 GitHub 建立公開專案。要用 `https://帳號.github.io/` 當網址，專案名稱必須是 `帳號.github.io`。
2. 把這個資料夾裡的所有檔案（含 `.nojekyll`）放到專案根目錄並推上去：
   ```bash
   git init && git add . && git commit -m "init site"
   git branch -M main
   git remote add origin https://github.com/帳號/帳號.github.io.git
   git push -u origin main
   ```
3. 專案頁面 → Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `(root)`，儲存。
4. 約一兩分鐘後即可開啟 `https://帳號.github.io/`。

路徑全為相對路徑，所以放在子路徑（`https://帳號.github.io/專案名/`）也能正常運作。

## 本機預覽

```bash
python3 -m http.server 8000
```
然後開 http://localhost:8000

## 新增或修改內容

- 修改策略說明：編輯 `js/scenes.js`。每個場景有 `caps`（每一步一句說明）與 `steps`（每一步亮起哪些種類的格子）。
- 啟用主題二／三：改 `topic-2/index.html`，並在 `config.js` 把 `status` 設為 `"live"`。

字型使用 Google Fonts（STIX Two Text、Noto Serif TC），離線時自動退回系統襯線字。
