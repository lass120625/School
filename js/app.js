/*
  App：
  - 本機 DEMO 或 Firebase（可選）
  - 貼紙（常駐、不飄走）＋ 輕微動態
  - 剪綵前不顯示名字與 QR；剪綵後才顯示＆生成 QR
  - 每次重新整理都清空名字與剪綵狀態（測試模式）
*/
const App = (() => {
  const state = { role: 'screen', useFirebase: false, db: null, cut:false, queue:[] };
  const LS_KEY = 'songqiang_names_v2';
  const CUT_KEY = 'songqiang_cut_v1';
  // 可選：固定 QR 基底，避免掃到 localhost；結尾一定是 '/'
  const FORCE_QR_BASE = 'http://127.0.0.1:5500/';

  // ---------------- Init ----------------
  function init({ role }){
    state.role = role;

    // 測試：每次重新整理都從零開始
    try { localStorage.removeItem(LS_KEY); localStorage.removeItem(CUT_KEY); } catch(e){}

    state.useFirebase = !!(window.FIREBASE_CONFIG);
    if (state.useFirebase) initFirebase();

    if (role === 'screen') {
      state.cut = localStorage.getItem(CUT_KEY) === '1'; // 這行會被上面清掉，所以預設 false
      const stage = document.getElementById('stage');
      if (state.cut) { stage?.classList.add('after-cut'); const r=document.getElementById('ribbon'); r?.classList.add('cut'); }
      // if (!state.useFirebase) loadLocalToScreen();
    } else if (role === 'guest') {
      bindGuestForm();
    }
  }

  // ---------------- Firebase ----------------
  function initFirebase(){
    const app = firebase.initializeApp(window.FIREBASE_CONFIG);
    state.db = firebase.database();
    if (state.role === 'screen') {
      state.db.ref('names').on('child_added', snap => {
        const val = snap.val();
        const item = (val && typeof val === 'object' && val.name) ? val : { name: val, pos: null };
        if (state.cut) { spawnSticker(item.name, item.pos); }
        else { state.queue.push(item); }
      });
    }
  }

  // ---------------- Local DEMO ----------------
  // function loadLocalToScreen(){
  //   const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  //   arr.forEach(item => {
  //     const it = (typeof item === 'string') ? { name:item, pos:null } : item;
  //     if (state.cut) spawnSticker(it.name, it.pos); else state.queue.push(it);
  //   });
  //   // 儲存同步（同一台不同分頁）
  //   window.addEventListener('storage', (e)=>{
  //     if (e.key === LS_KEY) {
  //       const latest = JSON.parse(e.newValue || '[]');
  //       latest.forEach(it=>{
  //         const obj = (typeof it === 'string') ? { name:it, pos:null } : it;
  //         if (state.cut) spawnSticker(obj.name, obj.pos); else state.queue.push(obj);
  //       });
  //     }
  //   });
  // }
  // function saveLocal(name){
  //   const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  //   const pos = randomPos();
  //   arr.push({ name, pos });
  //   localStorage.setItem(LS_KEY, JSON.stringify(arr));
  //   return pos;
  // }


  // ---------------- Guest Submit ----------------
  function bindGuestForm(){
    const form = document.getElementById('nameForm');
    const input = document.getElementById('nameInput');
    const msg = document.getElementById('msg');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = input.value.trim();
      if (!name) return;
      const pos = randomPos();
      state.db.ref('names').push({ name, pos });

      input.value = '';
      msg.textContent = '已送出！請抬頭看大螢幕 🎈';
      setTimeout(()=> msg.textContent = '', 3500);
    });
  }

  // ---------------- Stickers ----------------
  function randomPos() {
    const x = Math.round(Math.random()*84 + 6); // left 6~90%
    const y = Math.round(Math.random()*74 + 8); // top 8~82%
    return {x, y};
  }
  function spawnSticker(name, pos) {
    const layer = document.getElementById('balloon-layer');
    if (!layer) return;
    const el = document.createElement('div');
    const motions = ['motion-bob','motion-sway','motion-breathe'];
    const chosen = motions.filter(()=> Math.random()<0.7);
    el.className = 'sticker ' + chosen.join(' ');
    el.dataset.c = Math.floor(Math.random()*4);
    const p = pos || randomPos();
    el.style.left = p.x + '%'; el.style.top = p.y + '%';
    const rot = (Math.random()*6-3).toFixed(2) + 'deg';
    el.style.setProperty('--rot', rot);
    el.style.setProperty('--dur1', (2.8 + Math.random()*1.6).toFixed(2)+'s');
    el.style.setProperty('--dur2', (3.6 + Math.random()*2.2).toFixed(2)+'s');
    el.style.setProperty('--dur3', (5.0 + Math.random()*2.4).toFixed(2)+'s');
    el.textContent = name;
    layer.appendChild(el);
    return p;
  }

  // 建立 keyframes（備用）
  const style = document.createElement('style');
  style.textContent = `@keyframes floatUp { from { transform: translateY(0); } to { transform: translateY(-120vh); } }`;
  document.head.appendChild(style);

  // ---------------- QR after cut ----------------
  function makeGuestUrl() {
    if (FORCE_QR_BASE) return FORCE_QR_BASE + 'guest.html';
    const url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/[^\/]*$/, '') + 'guest.html';
    return url.toString();
  }
  function showQR() {
    const el = document.getElementById('qrcode');
    if (el) { el.innerHTML = ''; new QRCode(el, { text: makeGuestUrl(), width: 140, height: 140 }); }
  }

  // ---------------- Ribbon Cut ----------------
  function cutRibbon(){
    const r = document.getElementById('ribbon');
    if (!r || r.classList.contains('cut')) return;
    r.classList.add('cut');
    const stage = document.getElementById('stage'); stage?.classList.add('after-cut');
    state.cut = true; try{ localStorage.setItem(CUT_KEY,'1'); }catch(e){}
    // 顯示排隊名單
    state.queue.forEach(item=> spawnSticker(item.name, item.pos));
    state.queue.length = 0;
    // 剪綵後才生成 QR
    showQR();
    // confetti
    confetti({ spread: 70, particleCount: 160, origin: { y: 0.6 } });
  }

  // 管理熱鍵：R=重置、C=清空名字
  window.addEventListener('keydown', (e)=>{
    if (state.role !== 'screen') return;
    if (e.key.toLowerCase() === 'r') {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(CUT_KEY);
      location.reload();
    }
    if (e.key.toLowerCase() === 'c') {
      localStorage.removeItem(LS_KEY);
      document.querySelectorAll('#balloon-layer .sticker').forEach(el=> el.remove());
    }
  });

  return { init, cutRibbon };
})();
