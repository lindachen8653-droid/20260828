const CACHE='orchid-schedule-v4';
const ASSETS=['./manifest.json','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil((async()=>{await caches.open(CACHE).then(c=>c.addAll(ASSETS));await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));

const PATCH=`
<style>
.memo-wrap{margin:14px 0}.memo-card{position:relative;background:linear-gradient(145deg,#fffdf5,#fff2d7);border:1px solid #f0dfbd;border-radius:24px;padding:20px;box-shadow:0 8px 22px #9a765014}.memo-card:before{content:'🐾';position:absolute;right:18px;top:13px;font-size:30px;opacity:.34}.memo-card h2{margin:0 0 5px}.memo-card textarea{width:100%;min-height:360px;margin-top:14px;padding:18px;border:1px dashed #ddbfa4;border-radius:18px;background:#fffdf8;color:#55434a;line-height:1.8;resize:vertical;outline:none}.memo-card textarea:focus{border-color:#c99e9e;box-shadow:0 0 0 3px #f4dedb88}.memo-tools{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px}.memo-status{font-size:12px;color:#987f88}.memo-clear{border:1px solid #e9c8c3;background:#fff8f7;color:#a75d66;border-radius:14px;padding:8px 11px}.memo-cat{font-size:13px;color:#987f88;margin-top:2px}
</style>
<script>
(()=>{
  const modal=document.getElementById('modal');
  const closeBtn=document.getElementById('close');
  const cancelBtn=document.getElementById('cancel');
  const hideModal=()=>modal&&modal.classList.remove('open');
  if(closeBtn){closeBtn.onclick=null;closeBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();hideModal()})}
  if(cancelBtn){cancelBtn.onclick=null;cancelBtn.addEventListener('click',e=>{e.preventDefault();hideModal()})}
  if(modal)modal.addEventListener('click',e=>{if(e.target===modal)hideModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideModal()});

  const nav=document.getElementById('nav');
  const main=document.querySelector('main');
  if(nav&&main&&!document.querySelector('[data-page="memo"]')){
    const b=document.createElement('button');
    b.dataset.page='memo';b.textContent='📝 備忘錄';nav.appendChild(b);
    const s=document.createElement('section');
    s.id='memo';s.className='page';
    s.innerHTML='<div class="memo-wrap"><div class="memo-card"><h2>📝 Orchid’s Memo</h2><div class="memo-cat">想到什麼就先記下來喵 ฅ^•ﻌ•^ฅ</div><textarea id="memoText" placeholder="例如：\\n・要買的東西\\n・旅遊想去的店\\n・工作提醒\\n・臨時想到的事情…"></textarea><div class="memo-tools"><span class="memo-status" id="memoStatus">自動儲存</span><button class="memo-clear" id="memoClear">清空備忘錄</button></div></div></div>';
    main.appendChild(s);
    const KEY='orchid-schedule-memo-v1';
    const ta=s.querySelector('#memoText'),st=s.querySelector('#memoStatus'),cl=s.querySelector('#memoClear');
    ta.value=localStorage.getItem(KEY)||'';
    let timer;
    ta.addEventListener('input',()=>{localStorage.setItem(KEY,ta.value);st.textContent='儲存中…';clearTimeout(timer);timer=setTimeout(()=>{st.textContent='✓ 已自動儲存'},450)});
    cl.addEventListener('click',()=>{if(confirm('要清空整份備忘錄嗎？')){ta.value='';localStorage.removeItem(KEY);st.textContent='已清空'}});
  }
})();
<\/script>`;

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/20260828/')){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{
      let html=await r.text();
      html=html.replace('</body>',PATCH+'</body>');
      return new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});