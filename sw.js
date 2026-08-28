const CACHE='orchid-schedule-v10';
const ASSETS=['./manifest.json','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(ASSETS);await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));

const PATCH=`
<style>
.calendarFilters{display:flex;gap:7px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:8px 0 12px;padding-bottom:2px}.calendarFilters::-webkit-scrollbar{display:none}.calendarFilters button{flex:0 0 auto;white-space:nowrap;border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:16px;padding:8px 11px;touch-action:manipulation}.calendarFilters button.active{background:var(--accent);color:#fff}.calendarFilterHint{font-size:11px;color:var(--muted);margin-top:3px}
</style>
<script>
(()=>{
  const FILTER_KEY='orchid-calendar-filter-v1';
  let calendarFilter=localStorage.getItem(FILTER_KEY)||'all';
  const labels={all:'✨ 全部',work:'📰 三立',clinic:'🏥 櫃台',trip:'✈️ 旅遊',date:'❤️ 約會／聚餐',personal:'🐾 個人',todo:'✅ 待辦'};
  window.setCalendarFilter=function(k){calendarFilter=k;localStorage.setItem(FILTER_KEY,k);cal()};
  window.cal=function(){
    let first=new Date(2026,month,1),s=new Date(first);s.setDate(1-((first.getDay()+6)%7));let cells='';
    for(let i=0;i<42;i++){
      let d=new Date(s);d.setDate(s.getDate()+i);let ds=ymd(d);
      let ls=sortEvents(events.filter(e=>inRange(e,ds)&&(calendarFilter==='all'||e.type===calendarFilter)));
      cells+=`<div class="day \${d.getMonth()===month?'':'out'}"><div class="dn">\${d.getDate()}</div>\${H[ds]?`<div class="holiday">\${H[ds]}</div>`:''}\${ls.slice(0,4).map(e=>`<button class="chip" style="background:\${T[e.type].c}" onclick="edit('\${e.id}')"><span class="ci">\${e.icon||T[e.type].i}</span><span class="ct">\${esc(eventTime(e,ds))}\${e.title?' '+esc(e.title.replace(/^.*?｜/,'')):''}</span></button>`).join('')}</div>`;
    }
    calendarEl.innerHTML=`<div class="calendarhead"><div><div class="muted">🐈 Monthly calendar</div><div class="monthtitle">2026年 \${month===8?'9':'10'}月</div><div class="calendarFilterHint">顯示：\${labels[calendarFilter]}</div></div><div><button class="btn" onclick="chg(-1)">←</button> <button class="btn" onclick="chg(1)">→</button></div></div><div class="calendarFilters">\${Object.keys(labels).map(k=>`<button class="\${calendarFilter===k?'active':''}" onclick="setCalendarFilter('\${k}')">\${labels[k]}</button>`).join('')}</div><div class="calendar">\${['一','二','三','四','五','六','日'].map(x=>`<div class="wd">週\${x}</div>`).join('')}\${cells}</div>`;
  };
  cal();
})();
<\/script>`;

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/20260828/')){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(async r=>{let html=await r.text();html=html.replace('</body>',PATCH+'</body>');return new Response(html,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})}).catch(()=>caches.match('./index.html')));return;
  }
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});