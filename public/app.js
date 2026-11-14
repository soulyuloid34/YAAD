function goto(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const target = document.getElementById('view-'+id);
  target.classList.add('active');
  document.getElementById('phone').scrollTop = 0;
  const content = target.querySelector('.content');
  if(content) content.scrollTop = 0;
  animateBars(target);
}

function animateBars(scope){
  const fills = scope.querySelectorAll('.bar-fill');
  fills.forEach(f=>{
    f.style.width='0%';
    const pct = f.getAttribute('data-pct');
    requestAnimationFrame(()=>{ setTimeout(()=>{ f.style.width = pct+'%'; }, 60); });
  });
}

let fontStep = 0;
const fontSizes = ['17px','19px','21px'];
function cycleFont(){
  fontStep = (fontStep+1) % fontSizes.length;
  document.documentElement.style.fontSize = fontSizes[fontStep];
}

function toggleLang(){
  document.body.classList.toggle('lang-hi');
}

function pickMood(btn){
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('moodNote').classList.add('show');
}

function pickChoice(btn){
  const parent = btn.parentElement;
  parent.querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('picked'));
  btn.classList.add('picked');
  document.getElementById('step1-next').disabled = false;
}

function showStep(n){
  for(let i=1;i<=3;i++){ document.getElementById('game-step-'+i).style.display = (i===n) ? 'block':'none'; }
}

function startListening(){
  const btn = document.getElementById('micBtn');
  const status = document.getElementById('micStatus');
  btn.classList.add('listening');
  status.textContent = 'Listening...';
  setTimeout(()=>{
    btn.classList.remove('listening');
    status.textContent = 'Got it!';
    document.getElementById('answerBubble').classList.add('show');
    document.getElementById('step2-next').disabled = false;
  }, 1500);
}

function toggleChip(chip){
  chip.classList.toggle('on');
}

function showToast(id){
  const t = document.getElementById(id);
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 3200);
}

function generateActivity(){
  const btn = document.getElementById('genBtn');
  const result = document.getElementById('activityResult');
  btn.textContent = '✨ Creating...';
  btn.disabled = true;
  result.classList.remove('show');
  setTimeout(()=>{
    btn.textContent = '✨ Generate activity';
    btn.disabled = false;
    result.classList.add('show');
  }, 900);
}

function toggleCapsule(tile){
  tile.classList.toggle('added');
  const anyAdded = document.querySelectorAll('.capsule-tile.added').length > 0;
  document.getElementById('capsuleBtn').disabled = !anyAdded;
}

function generateCapsule(){
  const btn = document.getElementById('capsuleBtn');
  btn.textContent = '✨ Creating...';
  setTimeout(()=>{
    btn.textContent = '✨ Create activity from this';
    document.getElementById('capsuleResult').classList.add('show');
  }, 800);
}

/* ===== Tier 1: persistence, linked roles, names, games ===== */
const DB={
  get(k,d){try{const v=localStorage.getItem('yaad:'+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem('yaad:'+k,JSON.stringify(v))}catch(e){}}
};
let ELDER=DB.get('elder',null), CARE=DB.get('care',null);
const OLD_E=/Grandma Rekha|Grandpa Verma|Rekha|Verma/g, OLD_C=/Priya/g;
function personalise(root){
  if(!ELDER||!CARE) return;
  const w=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
  let n; while(n=w.nextNode()){ const t=n.nodeValue; if(OLD_E.test(t)||OLD_C.test(t)){ OLD_E.lastIndex=0;OLD_C.lastIndex=0; n.nodeValue=t.replace(OLD_E,ELDER).replace(OLD_C,CARE);} OLD_E.lastIndex=0;OLD_C.lastIndex=0;}
  document.querySelectorAll('input[type=text]').forEach(i=>{ if(OLD_E.test(i.value)){i.value=ELDER} OLD_E.lastIndex=0;});
}
function enter(view){ (ELDER&&CARE)?(goto(view),personalise()):(window._after=view,goto('setup')); }
function finishSetup(){
  const e=document.getElementById('setElder').value.trim(), c=document.getElementById('setCare').value.trim();
  if(!e||!c){ alert('Please enter both names.'); return; }
  ELDER=e;CARE=c;DB.set('elder',e);DB.set('care',c);
  personalise(); goto(window._after||'elder-home'); personalise();
}

/* stats + streak */
function stats(){return DB.get('stats',{plays:{},days:[]});}
function record(game,pct){
  const st=stats(); const g=st.plays[game]||{n:0,best:0,last:0};
  g.n++; g.last=pct; g.best=Math.max(g.best,pct); st.plays[game]=g;
  const today=new Date().toISOString().slice(0,10);
  if(!st.days.includes(today)) st.days.push(today);
  DB.set('stats',st);
}
function streak(){
  const d=new Set(stats().days); let n=0; const t=new Date();
  while(d.has(t.toISOString().slice(0,10))){n++;t.setDate(t.getDate()-1);} return n;
}
function avg(keys){const p=stats().plays;const v=keys.filter(k=>p[k]).map(k=>p[k].last);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null;}
function liveBars(){
  const set=(cls,v)=>{ if(v==null)return; document.querySelectorAll('.'+cls+' .bar-fill').forEach(f=>f.setAttribute('data-pct',v)); };
  set('bar-mem',avg(['match','cricket','decisions','photo'])); set('bar-att',avg(['trail']));
  set('bar-lang',avg(['sort','cricket'])); set('bar-con',Math.min(100,streak()*15));
  const today=new Date().toISOString().slice(0,10), played=stats().days.includes(today)?1:0;
  document.querySelectorAll('.stat-box b').forEach(b=>{ if(/days?/.test(b.textContent)) b.textContent=streak()+' days'; });
}
const _goto=goto;
goto=function(id){ if(id==='elder-play') renderSent(); if(id==='elder-family') renderMems(); liveBars(); _goto(id); personalise(); };

/* mood */
const _pm=pickMood;
pickMood=function(btn){ _pm(btn); const all=[...document.querySelectorAll('.mood-btn')]; const log=DB.get('moods',[]); log.push({t:Date.now(),m:all.indexOf(btn)}); DB.set('moods',log); };

/* profile chips persist */
function saveChips(){ DB.set('chips',[...document.querySelectorAll('#view-caregiver-profile .chip')].map(c=>c.classList.contains('on'))); }
function loadChips(){ const v=DB.get('chips',null); if(!v)return; document.querySelectorAll('#view-caregiver-profile .chip').forEach((c,i)=>c.classList.toggle('on',!!v[i])); }
const _tc=toggleChip;
toggleChip=function(c){ _tc(c); if(c.closest('#view-caregiver-profile')) saveChips(); };
// profile Language: single choice, Hindi switches elder UI text
document.querySelectorAll('#view-caregiver-profile .form-group').forEach(g=>{
  if(/language/i.test(g.querySelector('label')?.textContent||'')){
    g.querySelectorAll('.chip').forEach(ch=>ch.addEventListener('click',()=>{ g.querySelectorAll('.chip').forEach(o=>{ if(o!==ch)o.classList.remove('on'); }); ch.classList.add('on'); saveChips(); document.body.classList.toggle('lang-hi',/hindi/i.test(ch.textContent)); }));
  }
});

/* caregiver -> elder link */
function generateActivity(){
  const btn=document.getElementById('genBtn'),res=document.getElementById('activityResult');
  btn.disabled=true; btn.textContent='Creating...'; res.classList.remove('show');
  const picks=[...document.querySelectorAll('#view-caregiver-builder .chip.on')].map(c=>c.textContent.trim());
  const mem=(document.querySelector('#view-caregiver-builder input[type=text]')||{}).value||'a happy memory';
  const hobby=picks[0]||'Memories';
  const act=Object.assign({id:Date.now(),from:CARE||'Family'},localGenerate(picks,mem,CUR));
  window._pending=act;
  setTimeout(()=>{
    btn.disabled=false; btn.textContent='Generate activity';
    const h=res.querySelector('h3'),p=res.querySelector('p');
    if(h)h.textContent=act.title; if(p)p.textContent='Two gentle questions: "'+act.q[0]+'" and "'+act.q[1]+'"';
    res.classList.add('show');
  },700);
}
function sendActivity(){
  if(!window._pending)return; const l=DB.get('inbox',[]); l.unshift(window._pending); DB.set('inbox',l); showToast('sendToast');
}
function renderSent(){
  const box=document.getElementById('sentList'); if(!box)return;
  box.innerHTML=DB.get('inbox',[]).map(a=>`<div class="list-row" onclick="playSent(${a.id})"><div class="ico" style="background:var(--sage-soft)">&#127775;</div><div class="info"><b>${esc(a.title)}<span class="badge">New</span></b><span>From ${esc(a.from)}</span></div><button class="pill-btn">Play</button></div>`).join('');
}
function esc(t){return String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function playSent(id){
  const a=DB.get('inbox',[]).find(x=>x.id===id); if(!a)return;
  const ans=[]; let i=0;
  const card=document.getElementById('decCard'); goto('elder-decisions');
  (function ask(){
    if(i>=a.q.length){ card.innerHTML=`<div class="art">&#127881;</div><h3>Wonderful, ${esc(ELDER)}!</h3><p style="font-size:.88rem;color:var(--ink-soft)">${esc(a.from)} will love hearing your answers.</p><button class="next-btn" onclick="goto('elder-play')">Back to Play</button>`; record('cricket',100); DB.set('answers',[...DB.get('answers',[]),{act:a.title,ans,t:Date.now()}]); return; }
    card.innerHTML=`<h3>${esc(a.q[i])}</h3><textarea id="sa" rows="3" style="width:100%;border-radius:12px;border:1px solid var(--border);padding:10px;font:inherit"></textarea><button class="next-btn" onclick="window._sa()">Next</button>`;
    window._sa=()=>{ans.push(document.getElementById('sa').value);i++;ask();};
  })();
}
function addCapsuleMemory(){
  const types=[...document.querySelectorAll('.capsule-tile.added')].map(t=>({e:t.querySelector('.emoji').textContent,n:t.textContent.trim()}));
  const m=DB.get('mems',[]); types.forEach(t=>m.push({e:t.e,n:t.n,by:CARE})); DB.set('mems',m); showToast('capsuleToast');
}
function renderMems(){
  const box=document.getElementById('userMems'); if(!box)return;
  box.innerHTML=DB.get('mems',[]).map(m=>`<div class="memory-tile"><div class="thumb mem-user">${m.e}</div><div class="cap"><b>${esc(m.n)}</b><span>Added by ${esc(m.by)}</span></div></div>`).join('');
}
document.querySelectorAll('#view-caregiver-builder .pill-btn').forEach(b=>{ if(/^send/i.test(b.textContent.trim())) b.onclick=sendActivity; });
document.querySelectorAll('#view-caregiver-capsule .pill-btn').forEach(b=>{ if(/^send/i.test(b.textContent.trim())) b.onclick=addCapsuleMemory; });
const saveBtn=document.querySelector('#view-caregiver-profile .save-btn'); if(saveBtn) saveBtn.addEventListener('click',saveChips);

/* Cricket Memories saves answer */
const _ss=showStep; showStep=function(n){ _ss(n); if(n===3) record('cricket',100); };

/* Number Trail */
let trailNext=1,trailT0=0;
function startTrail(){
  const g=document.getElementById('trailGrid'); g.innerHTML=''; trailNext=1; trailT0=Date.now(); document.getElementById('trailFb').textContent='';
  const spots=[]; while(spots.length<TRAIL_N){ const p={x:Math.random()*78+2,y:Math.random()*76+2}; if(spots.every(q=>Math.hypot((q.x-p.x)*3,(q.y-p.y)*3)>22)) spots.push(p); }
  spots.forEach((p,i)=>{ const b=document.createElement('button'); b.className='trail-dot'; b.textContent=i+1; b.style.left=p.x+'%'; b.style.top=p.y+'%';
    b.onclick=()=>{ const fb=document.getElementById('trailFb'); if(i+1===trailNext){ b.classList.add('done'); fb.className='feedback'; fb.textContent=''; trailNext++; if(trailNext>TRAIL_N){ const sec=Math.round((Date.now()-trailT0)/1000); record('trail',Math.max(40,Math.min(100,100-Math.max(0,sec-20)*2))); fb.textContent=tf('Well done! {n} seconds.',{n:sec}); } } else { fb.className='feedback no'; fb.textContent=tf('Look for number {n}',{n:trailNext}); } };
    g.appendChild(b); });
}

/* Sort It */
const SORT=[['🍳','kitchen'],['👕','clothes'],['🌷','garden'],['🥄','kitchen'],['🧦','clothes'],['🪴','garden'],['🍚','kitchen'],['🧣','clothes'],['🚿','garden']];
let sortI=0,sortOk=0,sortOrder=[];
function startSort(){ sortOrder=SORT.slice().sort(()=>Math.random()-.5).slice(0,6); sortI=0;sortOk=0; showSort(); }
function showSort(){ document.getElementById('sortFb').textContent=''; document.getElementById('sortItem').textContent=sortOrder[sortI][0]; }
function pickSort(c){
  const fb=document.getElementById('sortFb'),ok=c===sortOrder[sortI][1]; if(ok)sortOk++;
  fb.className='feedback'+(ok?'':' no'); fb.textContent=ok?t('Yes!'):tf('Nearly. It goes in the {x}.',{x:t(sortOrder[sortI][1][0].toUpperCase()+sortOrder[sortI][1].slice(1)).toLowerCase()});
  setTimeout(()=>{ sortI++; if(sortI>=sortOrder.length){ record('sort',Math.round(sortOk/sortOrder.length*100)); document.getElementById('sortItem').textContent='🎉'; document.getElementById('sortQ').textContent=tf('You got {n} of {m}',{n:sortOk,m:sortOrder.length}); fb.textContent=''; setTimeout(()=>goto('elder-play'),1800);} else showSort(); },900);
}
/* Everyday Decisions */
const DEC=[['It is raining outside. What should you take?',['An umbrella','Sunglasses','A football'],0],['You feel hungry before lunch. A good choice?',['A banana','Skip until dinner','A cold soda'],0],['The doorbell rings unexpectedly. What first?',['Ask who it is','Open at once','Ignore it'],0]];
let decI=0,decOk=0;
function startDec(){decI=0;decOk=0;showDec();}
function showDec(){
  const c=document.getElementById('decCard');
  if(decI>=DEC.length){ record('decisions',Math.round(decOk/DEC.length*100)); c.innerHTML=`<div class="art">&#127881;</div><h3>Well done, ${esc(ELDER||'friend')}!</h3><p>${esc(tf('You chose well {n} of {m} times.',{n:decOk,m:DEC.length}))}</p><button class="next-btn" onclick="goto('elder-play')">Back to Play</button>`; return; }
  const d=DEC[decI]; c.innerHTML='<h3>'+esc(d[0])+'</h3>'+d[1].map((o,i)=>`<button class="choice-btn" onclick="pickDec(${i})">${esc(o)}</button>`).join('')+'<div class="feedback" id="decFb"></div>';
}
function pickDec(i){ const ok=i===DEC[decI][2]; if(ok)decOk++; const f=document.getElementById('decFb'); f.className='feedback'+(ok?'':' no'); f.textContent=ok?t('Good choice!'):tf('The safest choice was: {x}',{x:DEC[decI][1][DEC[decI][2]]}); setTimeout(()=>{decI++;showDec();},1100); }

/* Memory Match (3 pairs = 6 cards, 3x2 grid) */
let mFirst=null,mLock=false,mMoves=0,mFound=0;
function startMatch(){
  const sym=['🌼','🏏','🪔']; const deck=[...sym,...sym].sort(()=>Math.random()-.5); mFirst=null;mLock=false;mMoves=0;mFound=0;
  const g=document.getElementById('matchGrid'); g.innerHTML='';
  deck.forEach(s=>{ const b=document.createElement('button'); b.className='match-card'; b.textContent=s; b.dataset.s=s; b.onclick=()=>flip(b); g.appendChild(b); });
  document.getElementById('mMoves').textContent=tf('Moves: {n}',{n:0}); document.getElementById('mFound').textContent=tf('Found: {n} / 3',{n:0});
}
function flip(b){
  if(mLock||b.classList.contains('up')||b.classList.contains('ok'))return; b.classList.add('up');
  if(!mFirst){mFirst=b;return;}
  mMoves++; document.getElementById('mMoves').textContent=tf('Moves: {n}',{n:mMoves});
  if(mFirst.dataset.s===b.dataset.s){ mFirst.classList.replace('up','ok'); b.classList.replace('up','ok'); mFound++; document.getElementById('mFound').textContent=tf('Found: {n} / 3',{n:mFound}); mFirst=null; if(mFound===3) record('match',Math.max(40,100-(mMoves-3)*12)); }
  else { mLock=true; const a=mFirst; mFirst=null; setTimeout(()=>{a.classList.remove('up');b.classList.remove('up');mLock=false;},900); }
}

/* Caregiver snapshot: live mood + streak */
function snapshot(){
  const moods=DB.get('moods',[]), face=['😊','🙂','😐','😔'];
  document.querySelectorAll('.mini-stats div').forEach(d=>{ const b=d.querySelector('b'); if(!b)return; const l=d.textContent.toLowerCase();
    if(l.includes('streak')) b.textContent=streak()+'🔥'; if(l.includes('mood')&&moods.length) b.textContent=face[moods[moods.length-1].m]; });
}
const _g2=goto; goto=function(id){ _g2(id); if(id.startsWith('caregiver')) snapshot(); };

/* restore on load */
loadChips(); personalise(); liveBars();
if(ELDER&&CARE){ const f=document.getElementById('setElder'); if(f)f.value=ELDER; const c=document.getElementById('setCare'); if(c)c.value=CARE; }

/* ===== Tier 2 (part 1): translations, read-aloud, speech, photos, AI hook ===== */
const LANGS={en:{v:'en-IN'},hi:{v:'hi-IN'},ta:{v:'ta-IN'},te:{v:'te-IN'},kn:{v:'kn-IN'},bn:{v:'bn-IN'},mr:{v:'mr-IN'}};
let CUR=DB.get('lang','en');
const norm=t=>{let x=t.trim(); if(ELDER) x=x.split(ELDER).join('{e}'); if(CARE) x=x.split(CARE).join('{c}'); return x;};
const t=k=>(CUR!=='en'&&I18N[k]&&I18N[k][CUR])||k;
function setDate(){ const e=document.querySelector('#view-elder-home .date'); if(e) e.textContent=new Date().toLocaleDateString(LANGS[CUR].v,{weekday:'long',day:'numeric',month:'long'}); }
const tf=(k,v={})=>t(k).replace(/\{(\w+)\}/g,(m,x)=>x==='e'?ELDER:x==='c'?CARE:(v[x]!==undefined?v[x]:m));
function applyLang(){
  const w=document.createTreeWalker(document.getElementById('phone'),NodeFilter.SHOW_TEXT); let n;
  const find=r=>{ const f=norm(r); if(I18N[f]) return [f,'']; const m=/^([^\p{L}\p{N}{"]+)(.*)$/su.exec(f); return m&&I18N[m[2]]?[m[2],m[1]]:null; };
  while(n=w.nextNode()){
    const raw=n.__en!==undefined?n.__en:n.nodeValue, hit=find(raw);
    if(!hit){ if(n.__en!==undefined) n.nodeValue=n.__en; continue; }
    if(n.__en===undefined) n.__en=raw;
    const d=I18N[hit[0]];
    n.nodeValue=CUR==='en'?raw:raw.replace(raw.trim(),hit[1]+(d[CUR]||hit[0]).replace(/\{e\}/g,ELDER).replace(/\{c\}/g,CARE));
  }
}
const _al=applyLang; applyLang=function(){ _al(); setDate(); if(typeof statusLine==='function') statusLine(); };
['decCard','photoCard'].forEach(id=>{const e=document.getElementById(id); if(e) new MutationObserver(()=>applyLang()).observe(e,{childList:true});});
function setLang(c){
  CUR=c; DB.set('lang',c); document.getElementById('langSel').value=c;
  document.body.classList.toggle('lang-hi',c==='hi'); document.documentElement.lang=c; applyLang();
}
const _g3=goto; goto=function(id){ _g3(id); applyLang(); };
document.querySelectorAll('#view-caregiver-profile .chip').forEach(ch=>ch.addEventListener('click',()=>{
  const m={hindi:'hi',english:'en',tamil:'ta',telugu:'te',kannada:'kn',bengali:'bn',marathi:'mr'}[ch.textContent.trim().toLowerCase()]; if(m&&ch.classList.contains('on')) setLang(m);
}));

/* read aloud */
function readScreen(){
  if(!('speechSynthesis' in window)){ alert('Read aloud is not supported in this browser.'); return; }
  speechSynthesis.cancel();
  const v=document.querySelector('.view.active'); if(!v)return;
  const txt=[...v.querySelectorAll('.greeting h2,.subtitle,.game-card:not([style*="none"]) h3,.list-row .info b,.big-tile .label,.tl-row')].map(e=>e.textContent.replace(/\s+/g,' ').trim()).filter(Boolean).join('. ');
  const u=new SpeechSynthesisUtterance(txt); u.lang=LANGS[CUR].v; u.rate=.85; speechSynthesis.speak(u);
}

/* real speech recognition with typed fallback */
function saveAns(t){ const a=DB.get('answers',[]); a.push({act:'Cricket Memories',ans:[t],t:Date.now()}); DB.set('answers',a); }
startListening=function(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const btn=document.getElementById('micBtn'),st=document.getElementById('micStatus'),bub=document.getElementById('answerBubble');
  const done=t=>{ btn.classList.remove('listening'); st.textContent=tf('Got it!'); bub.textContent=tf('You said: "{x}"',{x:t}); bub.classList.add('show'); document.getElementById('step2-next').disabled=false; saveAns(t); };
  const typed=()=>{ const t=prompt(tf('Type your answer')); if(t) done(t); else { btn.classList.remove('listening'); st.textContent=tf('Tap the mic and speak'); } };
  if(!SR){ typed(); return; }
  const r=new SR(); r.lang=LANGS[CUR].v; btn.classList.add('listening'); st.textContent=tf('Listening...');
  r.onresult=e=>done(e.results[0][0].transcript);
  r.onerror=()=>{ st.textContent=tf('Could not hear you. Please type instead.'); typed(); };
  r.onend=()=>btn.classList.remove('listening');
  try{ r.start(); }catch(e){ typed(); }
};

/* photo upload in Memory Capsule */
const _tcap=toggleCapsule;
toggleCapsule=function(t){ _tcap(t); if(t.dataset.type==='photo'&&t.classList.contains('added')) document.getElementById('photoIn').click(); };
document.getElementById('photoIn').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f)return; const img=new Image(), rd=new FileReader();
  rd.onload=()=>{ img.onload=()=>{ const c=document.createElement('canvas'),k=360/Math.max(img.width,img.height,360); c.width=img.width*k; c.height=img.height*k; c.getContext('2d').drawImage(img,0,0,c.width,c.height); window._photo=c.toDataURL('image/jpeg',.7); }; img.src=rd.result; };
  rd.readAsDataURL(f); e.target.value='';
});
addCapsuleMemory=function(){
  const m=DB.get('mems',[]);
  document.querySelectorAll('.capsule-tile.added').forEach(t=>{ const o={e:t.querySelector('.emoji').textContent,n:t.textContent.trim(),by:CARE}; if(t.dataset.type==='photo'&&window._photo){o.img=window._photo;window._photo=null;o.label=(document.getElementById('photoLabel').value||'').trim();document.getElementById('photoLabel').value='';} m.push(o); });
  DB.set('mems',m); showToast('capsuleToast');
};
renderMems=function(){
  const box=document.getElementById('userMems'); if(!box)return;
  box.innerHTML=DB.get('mems',[]).map(m=>`<div class="memory-tile">${m.img?'<img class="mem-img" alt="'+esc(m.n)+'" src="'+m.img+'">':'<div class="thumb mem-user">'+m.e+'</div>'}<div class="cap"><b>${esc(m.n)}</b><span>Added by ${esc(m.by)}</span></div></div>`).join('');
};

/* optional AI: set window.YAAD_AI_URL to your own backend that proxies an LLM */
const _ga=generateActivity;
generateActivity=async function(){
  _ga(); if(!window.YAAD_AI_URL) return;
  try{
    const picks=[...document.querySelectorAll('#view-caregiver-builder .chip.on')].map(c=>c.textContent.trim());
    const mem=document.querySelector('#view-caregiver-builder input[type=text]').value;
    const r=await fetch(window.YAAD_AI_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interests:picks,memory:mem,language:CUR})});
    const j=await r.json();
    if(j.title&&Array.isArray(j.q)){ window._pending=Object.assign({},window._pending,{title:j.title,q:j.q});
      setTimeout(()=>{ const res=document.getElementById('activityResult'); const h=res.querySelector('h3'),p=res.querySelector('p'); if(h)h.textContent=j.title; if(p)p.textContent=j.q.join(' / '); },900); }
  }catch(e){}
};
setLang(CUR);

/* ===== Tier 2 (part 2): backend URL, voice notes, adaptive trail, alerts, journal ===== */
if(location.protocol.startsWith('http')) window.YAAD_AI_URL=window.YAAD_AI_URL||'/api/activity';

let TRAIL_N=DB.get('lvl:trail',6);
const _rec=record;
record=function(game,pct){
  _rec(game,pct);
  if(game==='trail'){ TRAIL_N=Math.max(4,Math.min(12,TRAIL_N+(pct>=85?1:pct<=50?-1:0))); DB.set('lvl:trail',TRAIL_N); }
};
const _st=startTrail;
startTrail=function(){ const h=document.getElementById('trailH'); if(h) h.textContent=tf('Tap the numbers from 1 to {n}',{n:TRAIL_N}); _st(); };

/* voice notes (caregiver records, elder plays) */
let MR=null,chunks=[],recTimer=null;
async function toggleRec(){
  const btn=document.getElementById('recBtn'),fb=document.getElementById('recFb');
  if(MR&&MR.state==='recording'){ MR.stop(); return; }
  if(!navigator.mediaDevices||!window.MediaRecorder){ fb.className='feedback no'; fb.textContent='Recording is not supported in this browser.'; return; }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    MR=new MediaRecorder(stream); chunks=[];
    MR.ondataavailable=e=>chunks.push(e.data);
    MR.onstop=()=>{
      clearTimeout(recTimer); stream.getTracks().forEach(t=>t.stop()); btn.innerHTML='&#127897;&#65039; Record voice message';
      const rd=new FileReader(); rd.onload=()=>{ try{ localStorage.setItem('yaad:voice',JSON.stringify({url:rd.result,by:CARE,t:Date.now()})); syncPush('voice'); fb.className='feedback'; fb.textContent='Saved. It is now on the Family screen.'; }catch(e){ fb.className='feedback no'; fb.textContent='Too long to save. Try a shorter message.'; } };
      rd.readAsDataURL(new Blob(chunks,{type:MR.mimeType}));
    };
    MR.start(); btn.textContent='Stop recording'; fb.className='feedback'; fb.textContent='Recording. It stops by itself after 30 seconds.';
    recTimer=setTimeout(()=>MR.state==='recording'&&MR.stop(),30000);
  }catch(e){ fb.className='feedback no'; fb.textContent='Microphone access was blocked. Allow it in your browser settings.'; }
}
let audioEl=null;
function playVoice(){
  const v=DB.get('voice',null); if(!v){ return; }
  if(audioEl&&!audioEl.paused){ audioEl.pause(); return; }
  audioEl=new Audio(v.url); audioEl.play();
  const fill=document.querySelector('#view-elder-family .bars-fill'); if(fill){ audioEl.ontimeupdate=()=>fill.style.width=(audioEl.currentTime/(audioEl.duration||1)*100)+'%'; }
}
document.querySelectorAll('#view-elder-family .play-circle').forEach(b=>b.onclick=playVoice);
function voiceCard(){
  const v=DB.get('voice',null); if(!v) return;
  const who=document.querySelector('#view-elder-family .voice-card .who'), q=document.querySelector('#view-elder-family .voice-card blockquote');
  if(who) who.textContent=t('\uD83C\uDF99\uFE0F Voice message from {c}').replace('{c}',v.by);
  if(q) q.textContent='Recorded '+new Date(v.t).toLocaleDateString()+'. Tap play to listen.';
}

/* computed alert + answer journal for the caregiver */
function daysSince(){ const d=stats().days; if(!d.length) return null; const last=new Date(d[d.length-1]); return Math.floor((new Date(new Date().toISOString().slice(0,10))-last)/864e5); }
function caregiverLive(){
  const b=document.querySelector('#view-caregiver-home .alert-banner'), n=daysSince();
  if(b){ const t=b.querySelector('div'); if(n===null){ b.style.display='flex'; if(t) t.textContent='No activity yet. Send a first activity from Activity Builder.'; }
    else if(n>=2){ b.style.display='flex'; if(t) t.textContent=tf('No activity for {n} days. A quick call might help.',{n:n}); } else b.style.display='none'; }
  const host=document.querySelector('#view-caregiver-progress .content'); if(!host) return;
  let j=document.getElementById('journal'); if(!j){ j=document.createElement('div'); j.id='journal'; host.appendChild(j); }
  const a=DB.get('answers',[]).slice(-5).reverse();
  j.innerHTML='<h3 style="font-size:1rem;margin:18px 0 10px">Recent answers</h3>'+(a.length?a.map(x=>`<div class="q-row"><div><b>${esc(x.act)}</b><br>${x.ans.map(esc).join(' / ')||'(no answer)'}<br><span style="font-size:.72rem;color:var(--ink-soft)">${new Date(x.t).toLocaleString()}</span></div></div>`).join(''):'<p class="setup-note">Answers will appear here after '+esc(ELDER||'they')+' plays Cricket Memories or an activity you sent.</p>');
}
const _g4=goto; goto=function(id){ _g4(id); if(id==='elder-family') voiceCard(); if(id.startsWith('caregiver')) caregiverLive(); };

/* ===== On-device activity generator (no API key needed) ===== */
const BANK={
 cricket:{en:["Which match do you remember best?","Who was your favourite player, and why?","Who did you watch cricket with?","What sounds or snacks do you remember from match days?"],
          hi:["कौन-सा मैच आपको सबसे अच्छी तरह याद है?","आपका पसंदीदा खिलाड़ी कौन था और क्यों?","आप किसके साथ क्रिकेट देखते थे?"]},
 garden:{en:["Which flowers or plants did you love most?","What did your garden smell like in the morning?","Who helped you in the garden?","What is the best thing you ever grew?"],
          hi:["कौन-से फूल या पौधे आपको सबसे प्यारे थे?","सुबह आपके बगीचे की खुशबू कैसी होती थी?","बगीचे में आपकी मदद कौन करता था?"]},
 cook:{en:["What dish were you known for?","Who taught you to cook it?","What did the kitchen smell like when you made it?","Which festival food do you remember most?"],
          hi:["आप कौन-सा व्यंजन बनाने के लिए मशहूर थीं?","आपको यह बनाना किसने सिखाया?","त्योहार का कौन-सा पकवान आपको सबसे याद है?"]},
 song:{en:["Which old song makes you smile?","Where were you when you first heard it?","Who used to sing or hum it with you?","Was there a special song for festivals at home?"],
          hi:["कौन-सा पुराना गाना सुनकर आप मुस्कुरा देते हैं?","पहली बार यह गाना सुनते समय आप कहाँ थे?","इसे आपके साथ कौन गुनगुनाता था?"]},
 read:{en:["What story did you love when you were young?","Who read to you, or whom did you read to?","Which book would you tell a child to read?"],
          hi:["बचपन की कौन-सी कहानी आपको पसंद थी?","आपको कौन पढ़कर सुनाता था?","बच्चे को कौन-सी किताब पढ़ने को कहेंगे?"]},
 place:{en:["What was your street or neighbourhood like?","Which market or place did you visit often?","Which festival was biggest in your area?"],
          hi:["आपकी गली या मोहल्ला कैसा था?","आप किस बाज़ार या जगह अक्सर जाते थे?","आपके इलाके में सबसे बड़ा त्योहार कौन-सा था?"]},
 any:{en:["What is a happy day you remember?","Who was with you?","What did you enjoy doing most?"],
          hi:["कोई खुशी का दिन जो आपको याद हो?","उस दिन आपके साथ कौन था?","आपको सबसे ज़्यादा क्या करना अच्छा लगता था?"]}
};
const KEYS=[['cricket','cricket'],['garden','garden'],['cook','cook'],['song','song'],['music','song'],['read','read'],['delhi','place'],['village','place'],['city','place']];
function localGenerate(picks,mem,lang){
  const L=lang==='hi'?'hi':'en';
  const topics=[...new Set(picks.map(p=>{const k=KEYS.find(([w])=>p.toLowerCase().includes(w));return k?k[1]:null;}).filter(Boolean))];
  if(!topics.length) topics.push('any');
  const q=[]; const m=(mem||'').trim();
  if(m) q.push(L==='hi'?'इस याद के बारे में बताइए: '+m:'Tell me about this memory: '+m);
  const pools=topics.map(t=>BANK[t][L].slice().sort(()=>Math.random()-.5));
  for(let i=0;q.length<3&&i<12;i++){ const pool=pools[i%pools.length]; if(pool.length) q.push(pool.pop()); }
  const first=picks[0]||'';
  return {title:L==='hi'?(first?first+' की यादें':'यादें'):(first?first+' Memories':'Memories'),q:q.slice(0,3)};
}

/* ===== Photo Memory game (uses caregiver-labelled photos) ===== */
let photoDeck=[],photoI=0,photoOk=0;
function startPhoto(){
  photoDeck=DB.get('mems',[]).filter(m=>m.img&&m.label).sort(()=>Math.random()-.5).slice(0,5); photoI=0; photoOk=0; showPhoto();
}
function showPhoto(){
  const c=document.getElementById('photoCard');
  if(!photoDeck.length){ c.innerHTML='<div class="art">&#128247;</div><h3>No photos yet</h3><p style="font-size:.88rem;color:var(--ink-soft)">Ask your family to add a photo with a name in Memory Capsule.</p><button class="next-btn" onclick="goto(\'elder-play\')">Back to Play</button>'; return; }
  if(photoI>=photoDeck.length){ record('photo',Math.round(photoOk/photoDeck.length*100)); c.innerHTML=`<div class="art">&#127881;</div><h3>Lovely memories, ${esc(ELDER||'friend')}!</h3><p style="font-size:.88rem;color:var(--ink-soft)">${esc(tf('You named {n} of {m}.',{n:photoOk,m:photoDeck.length}))}</p><button class="next-btn" onclick="goto('elder-play')">Back to Play</button>`; return; }
  const cur=photoDeck[photoI], all=DB.get('mems',[]).map(m=>m.label).filter(l=>l&&l!==cur.label);
  const generic=['A neighbour','A cousin','An old friend','A family member'];
  const wrong=[...new Set(all)].sort(()=>Math.random()-.5).concat(generic).slice(0,2);
  const opts=[cur.label,...wrong].sort(()=>Math.random()-.5);
  c.innerHTML=`<img alt="A family photo" src="${cur.img}" style="width:100%;border-radius:14px;max-height:240px;object-fit:cover"><h3 style="margin-top:14px">Who or what is in this photo?</h3>`+
    opts.map(o=>`<button class="choice-btn" data-o="${esc(o)}">${esc(o)}</button>`).join('')+'<div class="feedback" id="photoFb" role="status"></div>';
  c.querySelectorAll('.choice-btn').forEach(b=>b.onclick=()=>{
    const ok=b.dataset.o===cur.label; if(ok)photoOk++; const f=document.getElementById('photoFb');
    f.className='feedback'+(ok?'':' no'); f.textContent=ok?tf('Yes, that is right!'):tf('It was: {x}. What a lovely photo.',{x:cur.label});
    c.querySelectorAll('.choice-btn').forEach(x=>x.disabled=true); setTimeout(()=>{photoI++;showPhoto();},1600);
  });
}

/* ===== Tier 3: PIN, routine + reminders, mood week, contrast, PWA ===== */
function askPin(){
  const pin=DB.get('pin',null);
  if(!pin){ const n=prompt('Create a 4-digit caregiver PIN. It keeps the settings area separate from the player.'); if(!/^\d{4}$/.test(n||'')){ alert('Please enter exactly 4 digits.'); return false; } DB.set('pin',n); return true; }
  const t=prompt('Enter caregiver PIN'); if(t===pin) return true; if(t!==null) alert('That PIN is not correct.'); return false;
}
const _enter=enter; enter=function(v){ if(v==='caregiver-home'&&!askPin()) return; _enter(v); };

/* routine */
const DEF_ROUTINE=[{t:'07:00',w:'Wake up & stretch'},{t:'08:00',w:'Breakfast'},{t:'09:30',w:'Short walk'},{t:'13:00',w:'Lunch'},{t:'18:00',w:'Call with family'}];
const routine=()=>DB.get('routine',DEF_ROUTINE);
const fmt=t=>{const [h,m]=t.split(':');return ((+h)%12||12)+':'+m;};
const today=()=>new Date().toISOString().slice(0,10);
const rid=r=>r.t+'|'+r.w;
function renderRoutine(){
  const box=document.querySelector('#view-elder-day .timeline'); if(!box) return;
  const done=DB.get('done:'+today(),[]);
  box.innerHTML=routine().map((r,i)=>`<div class="tl-row${done.includes(rid(r))?' done':''}"><button class="tick" aria-pressed="${done.includes(rid(r))}" aria-label="Mark done: ${esc(r.w)}" onclick="tickRoutine(${i})">${done.includes(rid(r))?'\u2713':''}</button><div class="time">${fmt(r.t)}</div><div class="what">${esc(r.w)}</div></div>`).join('');
  applyLang();
}
function tickRoutine(i){ const r=routine()[i], k='done:'+today(); let d=DB.get(k,[]); d=d.includes(rid(r))?d.filter(x=>x!==rid(r)):[...d,rid(r)]; DB.set(k,d); renderRoutine(); }
function renderRoutineEd(){
  const h=document.getElementById('routineList'); if(!h) return;
  h.innerHTML=routine().map((r,i)=>`<div class="r-row"><b>${fmt(r.t)}</b> ${esc(r.w)}<button onclick="delRoutine(${i})" aria-label="Remove ${esc(r.w)}">&times;</button></div>`).join('');
}
function addRoutine(){ const t=document.getElementById('rTime').value, w=document.getElementById('rWhat').value.trim(); if(!t||!w){ alert('Add a time and a name for the task.'); return; }
  DB.set('routine',[...routine(),{t,w}].sort((a,b)=>a.t.localeCompare(b.t))); document.getElementById('rWhat').value=''; renderRoutineEd(); }
function delRoutine(i){ const r=routine().slice(); r.splice(i,1); DB.set('routine',r); renderRoutineEd(); }
(function(){ const c=document.querySelector('#view-caregiver-profile .content'), b=c&&c.querySelector('.save-btn'); if(!c) return;
  const d=document.createElement('div'); d.className='form-group'; d.innerHTML='<label>Daily routine (shown on My Day, with reminders)</label><div id="routineList"></div><div class="r-add"><input type="time" id="rTime" aria-label="Time"><input type="text" id="rWhat" placeholder="e.g. Take medicine" style="flex:1;min-width:0" aria-label="Task"><button class="pill-btn" type="button" onclick="addRoutine()">Add</button></div>';
  c.insertBefore(d,b); renderRoutineEd(); })();

/* reminders: banner + spoken, while the app is open */
function remind(w){ const b=document.getElementById('reminder'); b.textContent=tf('Time for: {x}',{x:w})+' ('+t('tap to close')+')'; b.style.display='block'; setTimeout(()=>b.style.display='none',30000);
  if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(tf('Time for: {x}',{x:w})); u.lang=LANGS[CUR].v; speechSynthesis.speak(u); } }
setInterval(()=>{ if(!ELDER) return; const d=new Date(), hm=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'), k=today()+hm;
  const hit=routine().find(r=>r.t===hm); if(hit&&DB.get('lastRem','')!==k){ DB.set('lastRem',k); remind(hit.w); } },20000);

/* mood week for caregiver */
function renderMoodWeek(){
  const host=document.querySelector('#view-caregiver-progress .content'); if(!host) return;
  let el=document.getElementById('moodWeek'); if(!el){ el=document.createElement('div'); el.id='moodWeek'; host.insertBefore(el,document.getElementById('journal')); }
  const face=['😊','🙂','😐','😔'], by={}; DB.get('moods',[]).forEach(m=>by[new Date(m.t).toISOString().slice(0,10)]=m.m);
  let cells=''; for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10); cells+=`<div aria-label="${k}">${by[k]!==undefined?face[by[k]]:'\u2013'}<span>${d.toLocaleDateString(undefined,{weekday:'short'})}</span></div>`; }
  el.innerHTML='<h3 style="font-size:1rem;margin:18px 0 10px">Mood this week</h3><div class="week">'+cells+'</div>';
}
const _g5=goto; goto=function(id){ _g5(id); if(id==='elder-day') renderRoutine(); if(id==='caregiver-progress') renderMoodWeek(); };

/* accessibility */
function toggleHC(on){ const v=typeof on==='boolean'?on:!document.body.classList.contains('hc'); document.body.classList.toggle('hc',v); document.getElementById('hcBtn').setAttribute('aria-pressed',v); DB.set('hc',v); }
toggleHC(DB.get('hc',false));
['Very happy','Happy','Okay','Sad'].forEach((l,i)=>{ const b=document.querySelectorAll('.mood-btn')[i]; if(b) b.setAttribute('aria-label',l); });
document.querySelectorAll('.toast,.mood-note').forEach(e=>e.setAttribute('role','status'));
const _pm2=pickMood; pickMood=function(b){ _pm2(b); document.querySelectorAll('.mood-btn').forEach(x=>x.setAttribute('aria-pressed',x===b)); };

/* installable + offline */
if('serviceWorker' in navigator&&location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
renderRoutine();

/* ===== Care Connect: real contacts + appointments, and the elder Help screen from them ===== */
const contacts=()=>DB.get('contacts',[{n:'Dr. Sharma',r:'Cognitive therapist',p:''},{n:CARE||'Caregiver',r:'Primary caregiver',p:''}]);
const appts=()=>DB.get('appts',[]);
const cleanPhone=v=>{const x=String(v||'').replace(/[\s-]/g,'');return /^\+?\d{5,15}$/.test(x)?x:'';};
function renderConnect(){
  const c=document.querySelector('#view-caregiver-connect .content'); if(!c) return;
  if(!document.getElementById('contactList')){
    c.querySelectorAll('.connect-row,.add-contact-btn').forEach(e=>e.remove());
    const w=document.createElement('div'); w.innerHTML='<div id="contactList"></div><div class="connect-row"><b>Add a contact</b><div class="cc-form"><input id="ccN" placeholder="Name" aria-label="Name"><input id="ccR" placeholder="Role, e.g. Neighbour" aria-label="Role"><input id="ccP" type="tel" placeholder="Phone, e.g. +91 98765 43210" aria-label="Phone"><button class="pill-btn" type="button" onclick="addContact()">Save contact</button></div></div><h3 style="font-size:1rem;margin:18px 0 10px">Appointments</h3><div id="apptList"></div><div class="connect-row"><div class="cc-form"><input id="apD" type="datetime-local" aria-label="Date and time"><input id="apW" placeholder="e.g. Check-up with Dr. Sharma" aria-label="Appointment"><button class="pill-btn" type="button" onclick="addAppt()">Add appointment</button></div></div>';
    while(w.firstChild) c.insertBefore(w.firstChild,c.querySelector('.lang-note'));
  }
  document.getElementById('contactList').innerHTML=contacts().map((x,i)=>`<div class="connect-row"><b>${esc(x.n)}</b><span class="role">${esc(x.r||'')}</span><div class="actions">${x.p?`<a class="pill-btn" href="tel:${x.p}">Call</a><a class="pill-btn ghost" href="sms:${x.p}">Message</a>`:'<span class="role">Add a phone number to call</span>'}<button class="pill-btn ghost" onclick="delContact(${i})">Remove</button></div></div>`).join('');
  document.getElementById('apptList').innerHTML=appts().map((a,i)=>`<div class="r-row"><b>${new Date(a.d).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}</b> ${esc(a.w)}<button onclick="delAppt(${i})" aria-label="Remove appointment">&times;</button></div>`).join('')||'<p class="setup-note">No appointments yet.</p>';
}
function addContact(){ const n=ccN.value.trim(), p=cleanPhone(ccP.value); if(!n){alert('Please enter a name.');return;} if(ccP.value.trim()&&!p){alert('Please enter a valid phone number, digits only with an optional +.');return;}
  DB.set('contacts',[...contacts(),{n,r:ccR.value.trim(),p}]); ccN.value=ccR.value=ccP.value=''; renderConnect(); }
function delContact(i){ const c=contacts().slice(); c.splice(i,1); DB.set('contacts',c); renderConnect(); }
function addAppt(){ if(!apD.value||!apW.value.trim()){alert('Add a date, time and a description.');return;} DB.set('appts',[...appts(),{d:apD.value,w:apW.value.trim()}].sort((a,b)=>a.d.localeCompare(b.d))); apW.value=''; renderConnect(); }
function delAppt(i){ const a=appts().slice(); a.splice(i,1); DB.set('appts',a); renderConnect(); }
function renderHelp(){
  const c=document.querySelector('#view-elder-help .content'), note=c&&c.querySelector('.lang-note'); if(!c) return;
  c.querySelectorAll('.help-row').forEach(e=>e.remove());
  const rows=contacts().filter(x=>x.p).map(x=>[x.n,x.r||'',x.p]).concat([['Emergency contact','For urgent situations','112']]);
  rows.forEach(([n,r,p])=>{ const d=document.createElement('div'); d.className='help-row'; d.innerHTML=`<div class="ico">${p==='112'?'&#128680;':'&#128222;'}</div><div class="info"><b>${esc(n)}</b><span>${esc(r)}</span></div><a class="call-btn" href="tel:${p}" aria-label="Call ${esc(n)}">&#128222;</a>`; c.insertBefore(d,note); });
}
const _g6=goto; goto=function(id){ _g6(id); if(id==='caregiver-connect') renderConnect(); if(id==='elder-help') renderHelp(); applyLang(); };

function statusLine(){
  const el=[...document.querySelectorAll('#view-caregiver-home *')].find(e=>!e.children.length&&e.textContent.trim().startsWith('\u25CF'));
  if(!el) return; const n=daysSince();
  el.textContent=n===0?tf('\u25CF Active today'):n===null?tf('\u25CF No activity yet'):tf('\u25CF Last active {n} days ago',{n:n});
}

/* ===== Cross-device sync (family code + polling) ===== */
const SYNC_KEYS=/^(elder|care|inbox|mems|voice|answers|moods|stats|routine|contacts|appts|chips|done:\d{4}-\d{2}-\d{2})$/;
const SY={
  code:()=>localStorage.getItem('yaad:syncCode')||'',
  url:()=>(localStorage.getItem('yaad:syncUrl')||(location.protocol.startsWith('http')?location.origin:'')).replace(/\/$/,''),
  since:()=>+(localStorage.getItem('yaad:syncSince')||0)
};
let pushQ={}, pushT=null, syncOk=null;
function syncDot(){ const b=document.getElementById('syncBtn'); if(b) b.textContent='Sync '+(!SY.code()?'\u25CB':syncOk===false?'!':'\u25CF'); }
function syncPush(key){ if(!SY.code()||!SYNC_KEYS.test(key)) return; pushQ[key]=1; clearTimeout(pushT); pushT=setTimeout(flushSync,700); }
const _dbset=DB.set; DB.set=function(k,v){ _dbset.call(DB,k,v); syncPush(k); };
async function flushSync(){
  for(const k of Object.keys(pushQ)){
    const v=localStorage.getItem('yaad:'+k); if(v===null){ delete pushQ[k]; continue; }
    try{ const r=await fetch(SY.url()+'/api/sync/'+SY.code()+'/'+encodeURIComponent(k),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({v})}); if(!r.ok) throw 0; delete pushQ[k]; syncOk=true; }
    catch(e){ syncOk=false; }
  }
  syncDot();
}
async function pollSync(){
  if(!SY.code()) return;
  try{
    const r=await fetch(SY.url()+'/api/sync/'+SY.code()+'?since='+SY.since()); if(!r.ok) throw 0; const d=await r.json();
    let changed=false, max=SY.since();
    for(const [k,it] of Object.entries(d.items||{})){ max=Math.max(max,it.ts); if(pushQ[k]) continue; if(localStorage.getItem('yaad:'+k)!==it.v){ localStorage.setItem('yaad:'+k,it.v); changed=true; } }
    localStorage.setItem('yaad:syncSince',String(max)); syncOk=true; syncDot();
    if(changed){ ELDER=DB.get('elder',null); CARE=DB.get('care',null); personalise();
      if(!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')){ const v=document.querySelector('.view.active'); if(v) goto(v.id.replace('view-','')); } }
    if(Object.keys(pushQ).length) flushSync();
  }catch(e){ syncOk=false; syncDot(); }
}
setInterval(pollSync,6000); document.addEventListener('visibilitychange',()=>{ if(!document.hidden) pollSync(); });

function openSync(){ if(!askPin()) return; const p=document.getElementById('syncPanel'); document.getElementById('syncUrlIn').value=localStorage.getItem('yaad:syncUrl')||SY.url(); renderSync(); p.style.display='block'; }
function closeSync(){ document.getElementById('syncPanel').style.display='none'; }
function renderSync(){
  const c=SY.code(); document.getElementById('syncCodeBox').textContent=c;
  document.getElementById('syncInfo').textContent=c?(syncOk===false?'Cannot reach the server. Check the address and your connection.':'Syncing. Enter this code on the other device. Anyone with the code can see this data, so share it only with family.'):(location.protocol.startsWith('http')||SY.url()?'Create a code on one device, then join with it on the other.':'Open the app from your server address, or type the server address below.');
}
function saveUrl(){ const u=document.getElementById('syncUrlIn').value.trim().replace(/\/$/,''); if(u&&!/^https?:\/\//.test(u)){ alert('The server address must start with http:// or https://'); return false; } if(u) localStorage.setItem('yaad:syncUrl',u); return !!SY.url()||(alert('Please enter the server address.'),false); }
function createSync(){
  if(!saveUrl()) return;
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r=crypto.getRandomValues(new Uint8Array(8)); let code=''; r.forEach(x=>code+=A[x%A.length]);
  localStorage.setItem('yaad:syncCode',code); localStorage.setItem('yaad:syncSince','0');
  Object.keys(localStorage).filter(k=>k.startsWith('yaad:')&&SYNC_KEYS.test(k.slice(5))).forEach(k=>pushQ[k.slice(5)]=1);
  flushSync().then(()=>{ renderSync(); });
  renderSync();
}
async function joinSync(){
  if(!saveUrl()) return; const code=document.getElementById('syncJoinIn').value.trim().toUpperCase();
  if(!/^[A-Z2-9]{8}$/.test(code)){ alert('A family code has 8 letters and numbers.'); return; }
  if(!confirm('Joining replaces the shared data on this device with the family data. Continue?')) return;
  localStorage.setItem('yaad:syncCode',code); localStorage.setItem('yaad:syncSince','0'); pushQ={};
  await pollSync(); renderSync(); closeSync();
}
function stopSync(){ localStorage.removeItem('yaad:syncCode'); localStorage.removeItem('yaad:syncSince'); pushQ={}; syncOk=null; syncDot(); renderSync(); }
syncDot(); pollSync();
