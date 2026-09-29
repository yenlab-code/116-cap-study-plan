# 會考小熊讀書室：家庭共用進度開通

這個網站仍由 GitHub Pages 提供公開的讀書任務。學生的勾選、耗時、未完成原因、每日簡記存到私人 Firestore；登入後家長即時唯讀。網站本身不存密碼、服務帳戶金鑰或教材 PDF。

## 開通順序

1. 由監護人擁有的 Google 帳號建立 Firebase 專案，新增 Web app，啟用 **Authentication → Email/Password** 與 **Cloud Firestore → Production mode**。可先用 Spark 方案；本站這一版沒有部署收費的 Cloud Functions。請確認專案資料位置及帳務條款後再建立。
2. 先部署本資料夾的 `firestore.rules`。使用 Firebase CLI 時，在本資料夾執行 `firebase login`、`firebase use --add` 選正確專案、`firebase deploy --only firestore:rules`。若用控制台貼上規則，日後再用 CLI 部署會覆蓋控制台中的規則，請保留單一版本。
3. 在 Authentication 的 Users 建立**兩個不同帳號**，記下其 UID。密碼由使用者自行設定，勿放進 GitHub 或傳給 ChatGPT。
4. 在 Firestore 控制台手動建立 `families/cap116-family` 文件；再建立子集合 `members`，以各人的 UID 當文件 ID。姪女的文件只有 `role: "student"`，家長的文件只有 `role: "parent"`。網站使用者不能自行建立成員文件。請勿在成員文件寫真實姓名、成績或密碼。
5. 將 Firebase 控制台提供的 Web app 設定逐字填入 `firebase-config.js`，把 `enabled` 設為 `true`，連同網站檔案更新至 GitHub。這些 Web 設定是公開識別資料；真正的保護依靠上述 Firestore 規則，**服務帳戶金鑰與 OpenAI API 金鑰絕不能放到此檔**。
6. 用學生帳號在第一個瀏覽器更新一筆勾選及時間；用家長帳號在另一個瀏覽器開同一網址，確認「最近更新」出現該筆且不能編輯。再用未列入 `members` 的帳號確認無法讀取。若舊網站已有紀錄，先匯出備份，再以學生帳號登入、明確匯入一次。

## 排程界線

- 每次開啟網站與收到共用紀錄變更時，依**台灣日期**重算任務。原始計畫日期與教材內容不會被覆寫；畫面會標示移動來源。學生、家長看到相同回報與計算結果。
- 只搬動已過期、明確標註「作業或小考超時／臨時行程／份量太多」且尚未完成的任務。觀念或解題不會的項目留在原日期並提示帶原作答到本科專案。未填紀錄不推定為未完成。先放既有任務，再在未來 14 天的空位補進度；第一次段考前的當前課程與段考項目不排到 10/14 以後。
- 「當天可用的大滿貫時間」起初留白，代表尚未記錄；清空後也維持留白。改排時若留白，仍依作息估計：週一、三 0 分、週二／四／五 75 分、週末 90 分；從 2027/2/28 起週日預估 0 分。填入 0 分代表當天不安排補進度。學校作業仍優先，並保留晚間休息與 23:00 就寢。
- 這一版只含 **2026/10/1～10/7** 已核對的任務。其後的新教材任務仍需依學校進度、教材與回報建立。排程在有人開啟網頁時運作，**沒有在網站關閉時的午夜背景工作，也沒有呼叫 ChatGPT 改寫教材任務**。如果要固定時間背景運作或由 AI 提議新任務，需另開受保護的伺服器程序並確認費用與審核方式。

## 故障與備份

- 未完成 Firebase 設定時網站仍可使用本機紀錄，但不會同步。啟用共用設定後，私人紀錄須登入才顯示，家長唯讀。
- 若資料庫無法寫入，畫面會回復該筆變更並顯示失敗；不要把失敗提示當成同步成功。
- 每週從「調整與回報」匯出備份、帶回總控專案。各科專案的作答證據仍須由使用者自行帶回，網站的三個勾選只是自評。

官方參考：[Firebase Web 設定](https://firebase.google.com/docs/web/setup)、[Authentication 電郵密碼](https://firebase.google.com/docs/auth/web/password-auth)、[Firestore 規則](https://firebase.google.com/docs/firestore/security/rules-conditions)。
