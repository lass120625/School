/*
  App：
  - Firebase（雲端同步）
  - 貼紙（常駐、不飄走）＋ 輕微動態
  - 剪綵前不顯示名字與 QR；剪綵後才顯示＆生成 QR
  - 每次重新整理都清空名字與剪綵狀態（測試模式）
*/
const App = (() => {
  const state = { role: 'screen', useFirebase: false, db: null, cut:false, queue:[] };
  const LS_KEY = 'songqiang_names_v2';
  const CUT_KEY = 'songqiang_cut_v1';
  // 可選：固定 QR 基底，避免掃到 localhost；結尾一定是 '/'
  // 例：'https://<你的帳號>.github.io/School/' 或 'http://192.168.x.x:5500/'
  const FORCE_QR_BASE = 'https://lass120625.github.io/School/';



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
      // Firebase-only，不載入本地資料
    } else if (role === 'guest') {
      bindGuestForm();
    }
  }

  // ---------------- Firebase ----------------
  function initFirebase(){
    const app = firebase.initializeApp(window.FIREBASE_CONFIG);
    state.db = firebase.database();
    if (state.role === 'screen') {
      // 主畫面啟動先清空，再掛監聽
      state.db.ref('names').remove().finally(() => {
        state.db.ref('names').on('child_added', snap => {
          const val = snap.val();
          const item = (val && typeof val === 'object' && val.name) ? val : { name: val, pos: null };
          if (state.cut) spawnSticker(item.name, item.pos);
          else state.queue.push(item);
        });
      });
    }
  }

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
      // Firebase-only：直接寫雲端
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
  
    // 容器
    const el = document.createElement('div');
    el.className = 'balloon';
  
    // 隨機氣球顏色
    const svgs = ['紅.svg','粉紅.svg','紫.svg','橘.svg','藍.svg'];
    const pick = svgs[Math.floor(Math.random()*svgs.length)];
    const img = document.createElement('img');
    img.src = 'assets/' + pick;
    img.alt = 'balloon';
  
    // 文字標籤
    const label = document.createElement('div');
    label.className = 'balloon-label';
    label.textContent = name;
  
    el.appendChild(img);
    el.appendChild(label);
  
    // 定位
    const p = pos || randomPos();
    el.style.left = p.x + '%';
    el.style.top  = p.y + '%';
  
    // 輕微漂浮
    el.style.setProperty('--floatDur', (5 + Math.random()*2).toFixed(2)+'s');
  
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
   
   
    const duration = 2000; // 撒 2 秒
    const end = Date.now() + duration;
    
    (function frame() {
      confetti({
        spread: 120,                  // 更大角度
        startVelocity: 40,            // 初始速度
        gravity: 0.8,                 // 下墜感
        particleCount: 40,            // 每次少一點，持續多次
        origin: {
          x: Math.random(),           // 隨機水平位置
          y: Math.random() * 0.5      // 隨機從上半部噴出
        },
        colors: ['#ff6b8b','#ff9ec1','#f7b267','#c7a6ff','#7fd1ae','#ffd700','#00cfff']
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    

    // 顯示排隊名單
    state.queue.forEach(item=> spawnSticker(item.name, item.pos));
    state.queue.length = 0;
    // 剪綵後才生成 QR
    showQR();

  }

  // 管理熱鍵：R=重置（含清 Firebase）、C=只清畫面
  window.addEventListener('keydown', (e)=>{
    if (state.role !== 'screen') return;
    if (e.key.toLowerCase() === 'r') {
      // 先清 Firebase 名單
      try { state.db && state.db.ref('names').remove(); } catch(err){}
      // 清畫面與狀態
      document.querySelectorAll('#balloon-layer .sticker').forEach(el=> el.remove());
      localStorage.removeItem(CUT_KEY);
      location.reload();
    }
    if (e.key.toLowerCase() === 'c') {
      document.querySelectorAll('#balloon-layer .sticker').forEach(el=> el.remove());
    }
  });

  return { init, cutRibbon };
})();
