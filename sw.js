const CACHE='orchid-schedule-v12';
const ASSETS=['./manifest.json','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(ASSETS);await self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));

const PATCH=`
<script>
(()=>{
  const KEY='orchid-calendar-filters-v2';
  const types=['work','clinic','trip','date','personal','todo'];
  const labels={work:'📰 三立',clinic:'🏥 櫃台',trip:'✈️ 旅遊',date:'❤️ 約會／聚餐',personal:'🐾 個人',todo:'✅ 待辦'};
  let selected;
  try{selected=JSON.parse(localStorage.getItem(KEY))||types.slice()}catch{selected=types.slice()}
  const save=()=>localStorage.setItem(KEY,JSON.stringify(selected));
  window.toggleCalendarFilter=function(k){
    if(k==='all'){selected=selected.length===types.length?[]:types.slice()}
    else selected=selected.includes(k)?selected.filter(x=>x!==k):[...selected,k];
    save();cal();
  };
  window.cal=function(){
    let first=new Date(2026,month,1),s=new Date(first);s.setDate(1-((first.getDay()+6)%7));let cells='';
    for(let i=0;i<42;i++){
      let d=new Date(s);d.setDate(s.getDate()+i);let ds=ymd(d);
      let ls=sortEvents(events.filter(e=>inRange(e,ds)&&selected.includes(e.type)));
      cells+=`<div class="day \${d.getMonth()===month?'':'out'}"><div class="dn">\${d.getDate()}</div>\${H[ds]?`<div class="holiday">\${H[ds]}</div>`:''}\${ls.slice(0,4).map(e=>`<button class="chip" style="background:\${T[e.type].c}" onclick="edit('\${e.id}')"><span class="ci">\${e.icon||T[e.type].i}</span><span class="ct">\${esc(eventTime(e,ds))}\${e.title?' '+esc(e.title.replace(/^.*?｜/,'')):''}</span></button>`).join('')}</div>`;
    }
    const allOn=selected.length===types.length;
    const hint=selected.length===0?'未選擇任何分類':allOn?'全部分類':selected.map(k=>labels[k].replace(/^\S+\s/,'' )).join('、');
    calendarEl.innerHTML=`<div class="calendarhead"><div><div class="muted">🐈 Monthly calendar</div><div class="monthtitle">2026年 \${month===8?'9':'10'}月</div><div class="calendarFilterHint">顯示：\${hint}</div></div><div><button class="btn" onclick="chg(-1)">←</button> <button class="btn" onclick="chg(1)">→</button></div></div><div class="calendarFilters"><button class="\${allOn?'active':''}" onclick="toggleCalendarFilter('all')">✨ 全部</button>\${types.map(k=>`<button class="\${selected.includes(k)?'active':''}" onclick="toggleCalendarFilter('\${k}')">\${labels[k]}</button>`).join('')}</div><div class="calendar">\${['一','二','三','四','五','六','日'].map(x=>`<div class="wd">週\${x}</div>`).join('')}\${cells}</div>`;
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