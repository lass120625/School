# Songqiang Ceremony – 使用說明（含 Firebase）

## 快速執行（本機 DEMO）
1. 用 VS Code 的 Live Server 或在資料夾開終端機：
   - macOS/Linux: `python3 -m http.server 8000`
   - Windows: `py -m http.server 8000`
2. 瀏覽器開 `http://localhost:8000` → `index.html`
3. 手機掃右下角 QR 開 `guest.html`，輸入名字，主螢幕會看到氣球（單機 Demo 模式）。

## 取得 Firebase 設定（讓所有裝置即時同步）
1. 前往 https://console.firebase.google.com 登入 Google 帳號。
2. 建立新專案（可關閉 Google Analytics）。
3. 左側選單 **Build → Realtime Database**：建立資料庫（地區任選），先選 **測試模式**（活動後請改規則）。
4. 點左上專案名稱旁的齒輪 **Project settings** → 往下找到 **Your apps**：新增 **Web 應用程式 (</>)**，取名後按下一步。
5. 會看到一段 JavaScript，裡面有：`apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId`，這一段稱為 **Firebase 設定**。

## 貼上 Firebase 設定
- 打開 `index.html` 與 `guest.html`，把檔案中「Firebase（可選）」區塊解除註解，並把你的設定貼到 `window.FIREBASE_CONFIG = { ... }` 中。
- 兩個檔案都要貼，範例如下：

```html
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"></script>
<script>
  window.FIREBASE_CONFIG = {
    apiKey: "你的 apiKey",
    authDomain: "xxx.firebaseapp.com",
    databaseURL: "https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "xxx",
    storageBucket: "xxx.appspot.com",
    messagingSenderId: "xxxxxxxxxxxx",
    appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxx"
  };
</script>
```

儲存後重新整理主螢幕與手機頁面，即可跨裝置同步。
