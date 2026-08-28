const CACHE='orchid-schedule-v7';
const ASSETS=['./manifest.json','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(ASSETS);await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));

const PATCH=`
<style>
.nav{overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;touch-action:pan-x;overscroll-behavior-x:contain;padding-bottom:2px}.nav::-webkit-scrollbar{display:none}.nav button{flex:0 0 auto;white-space:nowrap;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.completion-cat{margin:12px 0 4px;padding:14px 16px;border:1px solid #efd8df;border-radius:18px;background:linear-gradient(135deg,#fff9ef,#ffeaf0);display:flex;align-items:center;gap:12px;animation:catPop .35s ease}.completion-cat .face{font-size:38px;line-height:1}.completion-cat b{display:block;margin-bottom:2px}.completion-cat span{font-size:12px;color:#9b848c}@keyframes catPop{0%{transform:scale(.94);opacity:0}100%{transform:scale(1);opacity:1}}
</style>
<script>
(()=>{
 function decorateCompletion(){
   document.querySelectorAll('.progressBox').forEach(box=>{
     const label=box.querySelector('.progressLabel');if(!label)return;
     const full=/100%/.test(label.textContent);
     let cat=box.querySelector('.completion-cat');
     if(full&&!cat){cat=document.createElement('div');cat.className='completion-cat';cat.innerHTML='<div class="face">😸</div><div><b>全部完成啦！</b><span>小貓咪也替你開心 ฅ^•ﻌ•^ฅ</span></div>';box.appendChild(cat)}
     if(!full&&cat)cat.remove();
   });
 }
 const mo=new MutationObserver(decorateCompletion);mo.observe(document.body,{childList:true,subtree:true,characterData:true});decorateCompletion();
})();
<\/script>`;

self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/20260828/')){
   e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{let html=await r.text();html=html.replace('</body>',PATCH+'</body>');return new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}).catch(()=>caches.match('./index.html')));return;
 }
 e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});