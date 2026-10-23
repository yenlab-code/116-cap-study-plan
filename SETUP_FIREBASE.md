# 會考小熊讀書室：家庭共用設定（v2.9.0）

網站由 GitHub Pages 提供，私人紀錄保存在 Firebase Authentication 與 Cloud Firestore。網頁不保存密碼或服務帳戶金鑰。

1. Firebase 專案使用現有 `cap-study-plan`，Firestore 家庭路徑為 `families/cap116-family`。不要為本次更新另建家庭或覆寫私人紀錄。
2. Authentication 的學生與家長使用不同帳號；`members/{uid}` 文件保存 `role: "student"` 或 `role: "parent"`。成員名單禁止由網站自行更改。
3. 部署本版本的 `firestore.rules`，再發布對應網站。規則更新必須成功後才能宣稱日期權限生效；單純隱藏日期欄位不足以限制權限。
4. 指定日期更正者為 `phonics.playlist@gmail.com`，且必須已有家長成員角色。其他家長仍唯讀。家長只可更正已完成任務日期，不能代勾選或改備註。
5. 學生新完成時間由伺服器寫入。家長更正以原子交易寫入日期與不可改寫的更正紀錄；原始完成時間不會覆寫。日期皆以台灣時間解讀。
6. 未變更的舊紀錄相容讀取；不自動推算其完成日期。學生匯入備份不會回填受保護的日期，更正須由指定家長確認。先匯出備份再處理既有資料。

網站會依日期與已排任務計算獎勵，仍不是網站關閉後執行的背景 AI。私人教材、學生紀錄、密碼及金鑰不可上傳公開儲存庫。Firebase Web 設定屬公開識別資訊，實際權限由規則控管。

開發驗證包含學生不能回填過去日期、其他家長拒絕更正、指定帳號限改日期、原始時間保留及更正紀錄。正式驗證不應代替學生勾選真實任務。

官方文件：[Firebase Web 設定](https://firebase.google.com/docs/web/setup)、[電子郵件密碼登入](https://firebase.google.com/docs/auth/web/password-auth)、[Firestore 規則](https://firebase.google.com/docs/firestore/security/rules-conditions)。
