/* 登入後才讀寫家庭私人紀錄。網頁設定不是存取權限；Firestore 規則才是。 */
const settings = window.CAP_FIREBASE;
if (settings?.enabled && settings.config?.apiKey && settings.config?.projectId && settings.config?.appId) {
  try {
  const VERSION = '12.19.0';
  const [{initializeApp}, authSDK, dbSDK] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore.js`)
  ]);
  const app = initializeApp(settings.config);
  const auth = authSDK.getAuth(app), db = dbSDK.getFirestore(app);
  const root = ['families', settings.familyId];
  const ui = window.capUI;
  const form = document.querySelector('#signInForm');
  const label = document.querySelector('#accountStatus');
  const signOutButton = document.querySelector('#signOut');
  let unsubscribers = [], role = null, remote = {records:{},days:{}};

  function leave() {
    for (const unsub of unsubscribers) unsub();
    unsubscribers = [];
    role = null;
    remote = {records:{},days:{}};
    ui.cloudState('signedOut', remote);
    form.classList.remove('hidden');
    signOutButton.classList.add('hidden');
    label.textContent = '尚未登入；個人紀錄不顯示。';
  }
  function listen(user, memberRole) {
    role = memberRole;
    form.classList.add('hidden');
    signOutButton.classList.remove('hidden');
    label.textContent = `${memberRole === 'student' ? '學生' : '家長唯讀'}：${user.email || '已登入'}，正在載入共用紀錄…`;
    let recordsReady = false, daysReady = false;
    const publish = () => {
      if (!recordsReady || !daysReady) return;
      ui.cloudState(role, remote);
      label.textContent = `${role === 'student' ? '學生可編輯' : '家長唯讀'}：${user.email || '已登入'}｜共用資料已同步`;
    };
    const failed = err => {
      label.textContent = `讀取失敗：${err.message}`;
      ui.cloudState('loading', {records:{},days:{}});
    };
    unsubscribers.push(dbSDK.onSnapshot(dbSDK.collection(db, ...root, 'records'), snapshot => {
      remote.records = Object.fromEntries(snapshot.docs.map(d => [d.id, d.data()]));
      recordsReady = true; publish();
    }, failed));
    unsubscribers.push(dbSDK.onSnapshot(dbSDK.collection(db, ...root, 'days'), snapshot => {
      remote.days = Object.fromEntries(snapshot.docs.map(d => [d.id, d.data()]));
      daysReady = true; publish();
    }, failed));
  }
  authSDK.onAuthStateChanged(auth, async user => {
    leave();
    if (!user) return;
    ui.cloudState('loading', remote);
    try {
      const member = await dbSDK.getDoc(dbSDK.doc(db, ...root, 'members', user.uid));
      const memberRole = member.data()?.role;
      if (!['student','parent'].includes(memberRole)) throw Error('這個帳號尚未加入家庭成員名單。');
      listen(user, memberRole);
    } catch(err) {
      label.textContent = `無法開啟家庭資料：${err.message}`;
      await authSDK.signOut(auth);
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = form.elements.email.value.trim(), password = form.elements.password.value;
    label.textContent = '登入中…';
    try { await authSDK.signInWithEmailAndPassword(auth, email, password); form.reset(); }
    catch(err) { label.textContent = '登入失敗。請檢查帳號與密碼，或請管理者確認成員權限。'; }
  });
  signOutButton.addEventListener('click', () => authSDK.signOut(auth));

  async function write(kind, id, patch) {
    if (role !== 'student' || !auth.currentUser) throw Error('只有學生登入後可修改紀錄');
    const ref = dbSDK.doc(db, ...root, kind, id);
    await dbSDK.runTransaction(db, async tx => {
      const old = await tx.get(ref);
      const base = kind === 'records'
        ? {read:false, practice:false, correct:false, minutes:'', reason:'', note:''}
        : {homeworkDone:false, hw:'', listen:'', anki:'', availableMinutes:''};
      tx.set(ref, {...base, ...(old.exists() ? old.data() : {}), ...patch, updatedAt:dbSDK.serverTimestamp()});
    });
  }
  window.capCloud = {
    writeRecord:(id, patch) => write('records', id, patch),
    writeDay:(date, patch) => write('days', date, patch),
    role:() => role
  };
  } catch (error) {
    window.capUI.cloudState('loading', {records:{},days:{}});
    document.querySelector('#accountStatus').textContent = '共用服務載入失敗，請檢查網路或通知管理者。';
  }
} else {
  document.querySelector('#accountStatus').textContent = '共用儲存尚未設定；目前只保存在此瀏覽器。';
}
