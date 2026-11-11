/* ============================================================
   CAFE ATLAS v3 — motion, background, chatbot, export, wiring
   ============================================================ */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHAT_ENDPOINT = '/api/chat';   // server route that holds the OpenAI key

/* ---------- roadmap reveal, counters, spine ---------- */
let revealObs = null;
function observeStops(){
  if(revealObs) revealObs.disconnect();
  revealObs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); revealObs.unobserve(e.target); } });
  },{threshold:0.18, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.stop').forEach(s=>revealObs.observe(s));
}
function countUp(el){
  const target = parseFloat(el.dataset.count); if(isNaN(target)) return;
  const isDec = !Number.isInteger(target);
  if(reduceMotion) return;
  const dur=1400, t0=performance.now();
  const step = now => {
    const p=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-p,3), v=target*e;
    el.textContent = isDec ? v.toFixed(2) : fmtNum(v);
    if(p<1) requestAnimationFrame(step); else el.textContent = isDec ? target.toFixed(2) : fmtNum(target);
  };
  requestAnimationFrame(step);
}
function updateSpine(){
  const j=document.getElementById('journey');
  if(!j) return;
  const rect=j.getBoundingClientRect(), vh=window.innerHeight;
  const p=clamp((vh*0.55 - rect.top)/Math.max(rect.height,1),0,1);
  document.getElementById('spine').style.height = (p*(j.offsetHeight-40))+'px';
  const docP = window.scrollY/Math.max(1,document.documentElement.scrollHeight-vh);
  document.getElementById('progress').style.width = (clamp(docP,0,1)*100)+'%';
}
function clamp(v,lo,hi){ return Math.min(hi,Math.max(lo,v)); }
function afterRender(){
  observeStops();
  document.querySelectorAll('[data-count]').forEach(countUp);
  updateSpine();
}

/* ---------- animated background: floating gold dust + coffee steam ---------- */
(function background(){
  const cv=document.getElementById('bg'); if(!cv || reduceMotion) return;
  const ctx=cv.getContext('2d'); let W,H,dpr,parts=[];
  function resize(){
    dpr=Math.min(2,window.devicePixelRatio||1);
    W=cv.width=innerWidth*dpr; H=cv.height=innerHeight*dpr;
    cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px';
    parts=[];
    const dust = Math.round(Math.min(90, innerWidth/16));
    for(let i=0;i<dust;i++) parts.push({k:'dust',x:Math.random()*W,y:Math.random()*H,r:(Math.random()*2.2+.6)*dpr,
      vy:-(Math.random()*.15+.04)*dpr,vx:(Math.random()-.5)*.08*dpr,ph:Math.random()*6.28,a:Math.random()*.5+.2});
    for(let i=0;i<7;i++) parts.push({k:'steam',x:Math.random()*W,y:H*(0.6+Math.random()*0.5),
      sp:(Math.random()*.25+.12)*dpr,ph:Math.random()*6.28,w:(Math.random()*50+40)*dpr});
  }
  function frame(t){
    ctx.clearRect(0,0,W,H);
    for(const p of parts){
      if(p.k==='dust'){
        p.x+=p.vx+Math.sin(t/1800+p.ph)*0.12*dpr; p.y+=p.vy;
        if(p.y<-10*dpr){ p.y=H+10*dpr; p.x=Math.random()*W; }
        const al=p.a*(0.6+0.4*Math.sin(t/1200+p.ph));
        ctx.beginPath(); ctx.fillStyle=`rgba(197,139,82,${al*0.55})`; ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill();
      } else {
        p.y-=p.sp; if(p.y< -260*dpr){ p.y=H+80*dpr; p.x=Math.random()*W; }
        ctx.beginPath();
        for(let j=0;j<=28;j++){
          const yy=p.y-j*9*dpr, amp=p.w*0.22*(j/28);
          const xx=p.x+Math.sin(t/900+p.ph+j*0.35)*amp;
          j ? ctx.lineTo(xx,yy) : ctx.moveTo(xx,yy);
        }
        ctx.strokeStyle='rgba(24,61,50,0.09)'; ctx.lineWidth=7*dpr; ctx.lineCap='round'; ctx.stroke();
      }
    }
    requestAnimationFrame(frame);
  }
  resize(); window.addEventListener('resize',resize); requestAnimationFrame(frame);
})();

/* ---------- Ask Atlas chatbot ---------- */
function buildSummary(d){
  const {biz, revs} = d;
  const zs = zoneStats(biz, revs).filter(z=>z.total);
  const byCity = {};
  biz.forEach(b=>byCity[b.cityName]=(byCity[b.cityName]||0)+1);
  const prices = biz.map(b=>b.price);
  return {
    totals:{businesses:biz.length, reviews:revs.length,
      cafes:biz.filter(b=>b.cat==='cafe').length, restaurants:biz.filter(b=>b.cat==='restaurant').length,
      street:biz.filter(b=>b.cat==='street').length, avgRating: revs.length?+mean(revs.map(r=>r.rating)).toFixed(2):null,
      meanPriceINR: Math.round(mean(prices)), medianPriceINR: Math.round(median(prices))},
    byCity,
    zones: zs.map(z=>({zone:z.name, city:z.cityName, total:z.total, avgRating:z.avgRating==null?null:+z.avgRating.toFixed(2), avgPriceINR:Math.round(z.avgPrice)}))
  };
}

function localAnswer(q, d){
  const s=q.toLowerCase(), {biz, revs}=d;
  if(!biz.length) return 'No businesses match the current filters.';
  const zs = zoneStats(biz, revs).filter(z=>z.total);
  const rated = biz.filter(b=>b.reviews>=3);
  if(/cheap|afford|lowest price|budget/.test(s)){
    const z=[...zs].sort((a,b)=>a.avgPrice-b.avgPrice)[0];
    const locs = {}; biz.forEach(b=>{(locs[b.locality]??=[]).push(b.price)});
    const l=Object.entries(locs).filter(([,v])=>v.length>=2).map(([k,v])=>[k,mean(v)]).sort((a,b)=>a[1]-b[1])[0];
    return `The cheapest zone on average is ${z.name} (${fmtINR(z.avgPrice)} per person).` + (l?` The most affordable locality with at least two listings is ${l[0]} (${fmtINR(l[1])}).`:'');
  }
  if(/best|top|highest rated|rating|rated/.test(s)){
    const b=[...rated].sort((a,b)=>b.rating-a.rating || b.reviews-a.reviews)[0];
    return b ? `The highest-rated business with at least 3 reviews is ${b.name} in ${b.locality}, ${b.cityName} (${b.rating.toFixed(1)} from ${b.reviews} reviews).` : 'Not enough reviewed businesses yet.';
  }
  if(/popular|most review|most reviewed/.test(s)){
    const b=[...biz].sort((a,b)=>b.reviews-a.reviews)[0];
    return `${b.name} in ${b.locality}, ${b.cityName} has the most reviews (${b.reviews}).`;
  }
  if(/compare|city|cities|india/.test(s)){
    const c={}; biz.forEach(b=>c[b.cityName]=(c[b.cityName]||0)+1);
    const list=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(', ');
    return `Listings by city in the current selection: ${list}.`;
  }
  if(/cafe/.test(s) && /where|which|most|best/.test(s)){
    const locs={}; biz.filter(b=>b.cat==='cafe').forEach(b=>{const k=`${b.cityName} · ${b.locality}`; locs[k]=(locs[k]||0)+1});
    const top=Object.entries(locs).sort((a,b)=>b[1]-a[1])[0];
    return top ? `${top[0]} has the most listed cafes (${top[1]}).` : 'There are no cafes in the current selection.';
  }
  if(/how many|total|count|number/.test(s)){
    const cafes=biz.filter(b=>b.cat==='cafe').length;
    return `There are ${biz.length} businesses in the current selection, including ${cafes} cafes, and ${revs.length} reviews.`;
  }
  return 'I can answer about totals, prices, ratings, cities and popular places in the current selection. Try asking "where are the cheapest cafes?" or "compare cities".';
}

const LANG_NAME = {en:'English', hi:'Hindi', mr:'Marathi'};
const SYSTEM_PROMPT = 'You are Ask Atlas, an assistant for The Explorer analytics dashboard. ' +
  'Answer only from the JSON summary provided. The data is fictional demo data; say so when relevant. ' +
  'Reply in the language named in "lang". Keep answers under 80 words. If the summary does not contain the answer, say so.';

function chatPayload(q, d){
  return {lang: LANG_NAME[lang], question: q,
    filters:{city:state.city, zone:state.zone, category:state.cat, period:state.range},
    summary: buildSummary(d)};
}

async function openAIDirect(q, d, key){
  const r = await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json', 'Authorization':'Bearer '+key},
    body:JSON.stringify({model:'gpt-4o-mini', temperature:0.2, messages:[
      {role:'system', content:SYSTEM_PROMPT},
      {role:'user', content:JSON.stringify(chatPayload(q,d))}]})
  });
  if(!r.ok){
    const err = await r.json().catch(()=>({}));
    throw new Error(err?.error?.message || ('HTTP '+r.status));
  }
  const j = await r.json();
  return (j.choices?.[0]?.message?.content || '').trim() || 'No answer was returned.';
}

async function askAtlas(q){
  const d = compute();
  const typed = (document.getElementById('apiKey')?.value || '').trim();
  if(typed) sessionStorage.setItem('atlasKey', typed);
  const key = typed || sessionStorage.getItem('atlasKey') || '';

  if(key){
    try{ return {answer: await openAIDirect(q, d, key), notice:''}; }
    catch(e){ return {answer: localAnswer(q,d), notice: 'OpenAI could not answer: ' + e.message + '. Showing a dashboard answer instead.'}; }
  }
  try{
    const r = await fetch(CHAT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(chatPayload(q,d))});
    if(!r.ok) throw new Error('server '+r.status);
    const j = await r.json();
    if(j.answer) return {answer: j.answer, notice:''};
  }catch(e){ /* no server route; fall through */ }
  return {answer: localAnswer(q,d), notice: t('chatLocalNotice')};
}

function addMsg(role, text){
  const box=document.getElementById('chatMsgs');
  const div=document.createElement('div');
  div.className='msg '+role; div.textContent=text;
  box.appendChild(div); box.scrollTop=box.scrollHeight;
}
function renderChips(){
  document.getElementById('chatChips').innerHTML = t('chips').map(c=>`<button class="chip">${esc(c)}</button>`).join('');
}
async function sendChat(q){
  q=(q||'').trim(); if(!q) return;
  addMsg('user', q);
  document.getElementById('chatInput').value='';
  const typing=document.createElement('div'); typing.className='msg bot typing'; typing.innerHTML='<span></span><span></span><span></span>';
  document.getElementById('chatMsgs').appendChild(typing);
  try{
    const {answer, notice} = await askAtlas(q);
    typing.remove();
    if(notice) addMsg('notice', notice);
    addMsg('bot', answer);
  }catch(e){ typing.remove(); addMsg('bot', t('chatError')); }
}
function initChat(){
  const fab=document.getElementById('chatFab'), panel=document.getElementById('chatPanel');
  fab.addEventListener('click',()=>{
    const open = panel.hidden;
    panel.hidden = !open;
    if(open && !document.getElementById('chatMsgs').children.length) addMsg('bot', t('chatWelcome'));
    if(open) document.getElementById('chatInput').focus();
  });
  document.getElementById('chatClose').addEventListener('click',()=>panel.hidden=true);
  document.getElementById('chatForm').addEventListener('submit',e=>{ e.preventDefault(); sendChat(document.getElementById('chatInput').value); });
  document.getElementById('chatChips').addEventListener('click',e=>{
    const c=e.target.closest('.chip'); if(c) sendChat(c.textContent);
  });
  renderChips();
}

/* ---------- CSV export (local dates, no timezone drift) ---------- */
function exportCSV(){
  const {biz} = compute();
  const cols=['id','name','city','category','cuisine','veg','zone','locality','price_inr','avg_rating','review_count','is_demo','created'];
  const rows=biz.map(b=>[b.id,b.name,b.cityName,CATS[b.cat].label||b.cat,b.cuisine,b.veg?'yes':'no',b.zone,b.locality,b.price,
    b.rating==null?'':b.rating.toFixed(2),b.reviews,'true',ymd(b.created)]);
  const csv=[cols,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download=`cafe_atlas_demo_export_${ymd(NOW)}.csv`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

/* ---------- wiring ---------- */
function setLang(code){
  if(!I18N[code]) return;
  lang=code;
  try{ localStorage.setItem('cafeAtlasLang', code); }catch(e){}
  applyStatic(); renderChips(); render();
}
function initWiring(){
  document.querySelector('.langs').addEventListener('click',e=>{
    const b=e.target.closest('button[data-lang]'); if(b) setLang(b.dataset.lang);
  });
  const onFilter=()=>{
    state.city=document.getElementById('fCity').value;
    state.zone=document.getElementById('fZone').value;
    state.cat=document.getElementById('fCat').value;
    state.range=document.getElementById('fRange').value;
    state.page=0;
    buildFilterOptions();
    render();
  };
  ['fCity','fZone','fCat','fRange'].forEach(id=>document.getElementById(id).addEventListener('change',onFilter));
  document.getElementById('app').addEventListener('click',e=>{
    const btn=e.target.closest('button[data-action]'); if(!btn) return;
    const a=btn.dataset.action;
    if(a==='prev'&&state.page>0){state.page--;render();}
    if(a==='next'){state.page++;render();}
    if(a==='csv') exportCSV();
  });
  let ticking=false;
  window.addEventListener('scroll',()=>{
    if(!ticking){ requestAnimationFrame(()=>{updateSpine();ticking=false;}); ticking=true; }
  },{passive:true});
  window.addEventListener('resize',updateSpine);
}

initWiring();
initChat();
applyStatic();
render();
