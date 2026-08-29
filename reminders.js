(()=>{
const FIRED_KEY='orchid-reminder-fired-v1';
const MAX_REMINDERS=3;
let todoEditingId=null;
function escReminder(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function addStyles(){
  if(document.getElementById('orchidReminderStyle')) return;
  const s=document.createElement('style');
  s.id='orchidReminderStyle';
  s.textContent=`
  .reminderBox{grid-column:1/-1;border:1px solid var(--line);border-radius:16px;padding:12px;background:#fffafc}
  .reminderHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
  .reminderToggle{display:flex;align-items:center;gap:7px;font-size:13px}
  .reminderTimes{display:grid;grid-template-columns:1fr;gap:8px}
  .reminderTimes input{width:100%;border:1px solid var(--line);background:white;border-radius:13px;padding:10px}
  .reminderHint{font-size:11px;color:var(--muted);line-height:1.5;margin-top:7px}
  .reminderBell{border:1px solid var(--line);background:white;border-radius:12px;padding:7px 9px}
  .reminderBell.on{background:#fff1c9}
  .reminderModal{display:none;position:fixed;inset:0;z-index:40;background:#0005;align-items:flex-end;justify-content:center}
  .reminderModal.open{display:flex}
  .reminderSheet{width:min(620px,100%);background:#fffaf9;border-radius:24px 24px 0 0;padding:18px;max-height:88vh;overflow:auto}
  .notifyFab{position:fixed;right:88px;bottom:22px;z-index:15;border:1px solid var(--line);background:#fffefa;border-radius:50%;width:52px;height:52px;box-shadow:0 6px 18px #765b6530;font-size:21px}
  @media(max-width:760px){.notifyFab{right:84px;bottom:22px}}
  `;
  document.head.appendChild(s);
}
function normalizeReminderList(item){
  if(!item) return [];
  if(!Array.isArray(item.reminders)) item.reminders=[];
  return item.reminders.filter(x=>x&&x.at).slice(0,MAX_REMINDERS);
}
function addEventReminderFields(){
  const grid=document.querySelector('#form .grid');
  if(!grid || document.getElementById('eventReminderBox')) return;
  const box=document.createElement('div');
  box.className='reminderBox';
  box.id='eventReminderBox';
  box.innerHTML=`
    <div class="reminderHead"><b>🔔 提醒</b><label class="reminderToggle"><input id="eventReminderEnabled" type="checkbox"> 開啟提醒</label></div>
    <div class="reminderTimes"><input id="eventReminder1" type="datetime-local" aria-label="提醒時間 1"><input id="eventReminder2" type="datetime-local" aria-label="提醒時間 2"><input id="eventReminder3" type="datetime-local" aria-label="提醒時間 3"></div>
    <div class="reminderHint">最多 3 個提醒時間。提醒會跟著共用空間同步。</div>`;
  grid.appendChild(box);
  const toggle=document.getElementById('eventReminderEnabled');
  toggle.addEventListener('change',syncEventFields);
  syncEventFields();
}
function syncEventFields(){
  const on=document.getElementById('eventReminderEnabled')?.checked;
  for(let i=1;i<=MAX_REMINDERS;i++){const el=document.getElementById('eventReminder'+i);if(el) el.disabled=!on;}
}
function setEventReminderForm(item){
  addEventReminderFields();
  const list=normalizeReminderList(item);
  const enabled=item?.reminderEnabled===true || list.length>0;
  const tog=document.getElementById('eventReminderEnabled');if(tog) tog.checked=enabled;
  for(let i=1;i<=MAX_REMINDERS;i++){const el=document.getElementById('eventReminder'+i);if(el) el.value=list[i-1]?.at||'';}
  syncEventFields();
}
function readEventReminderForm(){
  const enabled=!!document.getElementById('eventReminderEnabled')?.checked;
  const reminders=[];
  if(enabled){for(let i=1;i<=MAX_REMINDERS;i++){const v=document.getElementById('eventReminder'+i)?.value;if(v) reminders.push({at:v});}}
  return {reminderEnabled:enabled,reminders};
}
function wrapEventModal(){
  if(typeof openNew==='function' && !window.__remOpenWrapped){const oldOpen=openNew;openNew=function(){oldOpen();setEventReminderForm(null)};window.__remOpenWrapped=true;}
  if(typeof edit==='function' && !window.__remEditWrapped){const oldEdit=edit;edit=function(id){oldEdit(id);const item=typeof events!=='undefined'?events.find(x=>x.id===id):null;setEventReminderForm(item)};window.__remEditWrapped=true;}
  const f=document.getElementById('form');
  if(f && !f.dataset.reminderWrapped){
    const oldSubmit=f.onsubmit;
    f.onsubmit=function(ev){
      const editingId=document.getElementById('eid')?.value||'';
      const reminderData=readEventReminderForm();
      const draftDate=document.getElementById('date')?.value||'';
      const draftTitle=document.getElementById('title')?.value||'';
      const result=oldSubmit.call(this,ev);
      setTimeout(()=>{
        if(typeof events==='undefined') return;
        let item=editingId?events.find(x=>x.id===editingId):null;
        if(!item)item=[...events].reverse().find(x=>x.date===draftDate&&x.title===draftTitle);
        if(item){item.reminderEnabled=reminderData.reminderEnabled;item.reminders=reminderData.reminders;if(typeof persist==='function') persist();}
      },0);
      return result;
    };
    f.dataset.reminderWrapped='1';
  }
}
function ensureTodoReminderModal(){
  if(document.getElementById('todoReminderModal')) return;
  const m=document.createElement('div');m.id='todoReminderModal';m.className='reminderModal';
  m.innerHTML=`<div class="reminderSheet"><div class="sectionhead"><h3>🔔 待辦提醒</h3><button class="btn" id="todoReminderClose">✕</button></div><p id="todoReminderTitle" class="muted"></p><label class="reminderToggle" style="margin:10px 0"><input id="todoReminderEnabled" type="checkbox"> 開啟提醒</label><div class="reminderTimes"><input id="todoReminder1" type="datetime-local"><input id="todoReminder2" type="datetime-local"><input id="todoReminder3" type="datetime-local"></div><div class="reminderHint">最多 3 個提醒時間。</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn" id="todoReminderCancel">取消</button><button class="primary" id="todoReminderSave">儲存提醒</button></div></div>`;
  document.body.appendChild(m);
  document.getElementById('todoReminderClose').onclick=closeTodoReminder;
  document.getElementById('todoReminderCancel').onclick=closeTodoReminder;
  m.addEventListener('click',e=>{if(e.target===m)closeTodoReminder()});
  document.getElementById('todoReminderEnabled').addEventListener('change',syncTodoFields);
  document.getElementById('todoReminderSave').onclick=saveTodoReminder;
}
function syncTodoFields(){const on=document.getElementById('todoReminderEnabled')?.checked;for(let i=1;i<=MAX_REMINDERS;i++){const el=document.getElementById('todoReminder'+i);if(el)el.disabled=!on;}}
function openTodoReminder(id){
  ensureTodoReminderModal();if(typeof todos==='undefined')return;const item=todos.find(x=>x.id===id);if(!item)return;todoEditingId=id;
  const list=normalizeReminderList(item);document.getElementById('todoReminderTitle').textContent=item.text||'待辦事項';document.getElementById('todoReminderEnabled').checked=item.reminderEnabled===true||list.length>0;
  for(let i=1;i<=MAX_REMINDERS;i++)document.getElementById('todoReminder'+i).value=list[i-1]?.at||'';syncTodoFields();document.getElementById('todoReminderModal').classList.add('open');
}
function closeTodoReminder(){document.getElementById('todoReminderModal')?.classList.remove('open');todoEditingId=null;}
function saveTodoReminder(){
  if(typeof todos==='undefined'||!todoEditingId)return;const item=todos.find(x=>x.id===todoEditingId);if(!item)return;const enabled=document.getElementById('todoReminderEnabled').checked,list=[];
  if(enabled){for(let i=1;i<=MAX_REMINDERS;i++){const v=document.getElementById('todoReminder'+i).value;if(v)list.push({at:v});}}
  item.reminderEnabled=enabled;item.reminders=list;localStorage.setItem('orchid-todos-v1',JSON.stringify(todos));closeTodoReminder();if(typeof renderTodo==='function')renderTodo();
}
function decorateTodoList(){
  if(typeof todos==='undefined')return;const list=document.querySelector('.todoList');if(!list)return;const rows=[...list.querySelectorAll('.todoItem')];
  rows.forEach((row,i)=>{const item=todos[i];if(!item||row.querySelector('.reminderBell'))return;const b=document.createElement('button');b.type='button';b.className='reminderBell'+((item.reminderEnabled&&normalizeReminderList(item).length)?' on':'');b.textContent=(item.reminderEnabled&&normalizeReminderList(item).length)?'🔔':'🔕';b.title='設定提醒';b.onclick=()=>openTodoReminder(item.id);const del=row.querySelector('button.btn');if(del)row.insertBefore(b,del);else row.appendChild(b);});
}
function wrapTodoRender(){if(typeof renderTodo==='function'&&!window.__remTodoWrapped){const old=renderTodo;renderTodo=function(){const r=old();setTimeout(decorateTodoList,0);return r};window.__remTodoWrapped=true;renderTodo();}}
async function requestNotify(){
  if(!('Notification' in window)){alert("這台裝置目前不支援網頁通知。iPhone 建議先把 Orchid's Schedule 加到主畫面後再開啟提醒。");return;}
  try{const p=await Notification.requestPermission();if(p==='granted'){alert('提醒通知已開啟 🔔');updateNotifyButton();}else alert('尚未允許通知。可以稍後從瀏覽器／系統設定開啟。');}catch{alert('目前無法要求通知權限。iPhone 請先將網站加入主畫面，再從主畫面開啟。');}
}
function addNotifyButton(){if(document.getElementById('orchidNotifyBtn'))return;const b=document.createElement('button');b.id='orchidNotifyBtn';b.className='notifyFab';b.type='button';b.onclick=requestNotify;document.body.appendChild(b);updateNotifyButton();}
function updateNotifyButton(){const b=document.getElementById('orchidNotifyBtn');if(!b)return;b.textContent=('Notification' in window&&Notification.permission==='granted')?'🔔':'🔕';b.title='通知設定';}
function firedMap(){try{return JSON.parse(localStorage.getItem(FIRED_KEY)||'{}')}catch{return {}}}
function saveFired(x){localStorage.setItem(FIRED_KEY,JSON.stringify(x))}
async function notify(title,body,tag){if(!('Notification' in window)||Notification.permission!=='granted')return;try{if('serviceWorker'in navigator){const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,{body,tag,icon:'icon.svg',badge:'icon.svg',data:{url:location.href}});}else new Notification(title,{body,tag});}catch{}}
function checkReminders(){
  const now=Date.now(),fired=firedMap(),items=[];
  if(typeof events!=='undefined')for(const e of events)items.push({id:e.id,title:e.title||'行程提醒',kind:'行程',enabled:e.reminderEnabled,list:normalizeReminderList(e)});
  if(typeof todos!=='undefined')for(const t of todos)items.push({id:t.id,title:t.text||'待辦提醒',kind:'待辦',enabled:t.reminderEnabled,list:normalizeReminderList(t)});
  let changed=false;
  for(const item of items){if(!item.enabled)continue;for(const r of item.list){const when=new Date(r.at).getTime();if(!Number.isFinite(when))continue;const key=item.kind+'|'+item.id+'|'+r.at;if(!fired[key]&&when<=now&&when>=now-120000){fired[key]=now;changed=true;notify('🔔 '+item.kind+'提醒',item.title,key);}}}
  const cutoff=now-1000*60*60*24*60;for(const k of Object.keys(fired))if(fired[k]<cutoff){delete fired[k];changed=true;}if(changed)saveFired(fired);
}
function init(){addStyles();addEventReminderFields();wrapEventModal();ensureTodoReminderModal();wrapTodoRender();addNotifyButton();checkReminders();setInterval(checkReminders,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminders()});}
window.addEventListener('load',()=>setTimeout(init,0),{once:true});
})();