# 116 會考小熊讀書室

公開網站：https://yenlab-code.github.io/116-cap-study-plan/

本版 v2.2 提供 2026/10/1～10/7 的教材任務卡、勾選與每日簡記、最近更新頁面，以及依未完成原因與可用時間重新分配首週任務的規則。空白紀錄不當成未完成，觀念或解題不會則提醒帶原作答到本科專案。

Firebase 家庭共用儲存已於 2026/9/29 啟用。學生以 Email/Password 帳號更新私人 Firestore 紀錄，家長以另一個帳號查看同一份紀錄；家長畫面的編輯欄位停用。兩個登入環境已驗證學生更新會即時出現在家長畫面。Firestore 存取規則見 [firestore.rules](firestore.rules)，設定與帳號建立方式見 [SETUP_FIREBASE.md](SETUP_FIREBASE.md)。網站仍由 GitHub Pages 公開提供；私人紀錄須登入才能讀取。舊瀏覽器的本機紀錄不會自動上傳，應先匯出備份，再以學生帳號明確匯入。不要在公開儲存庫放私人紀錄、教材 PDF、密碼或服務帳戶金鑰。

重新排程在開啟網站時依台灣日期計算，並非網站關閉時的背景 AI 工作；首週以外的詳細任務仍需依學習回報與教材建立。執行純排程測試：`node tests/scheduler.test.cjs`。
