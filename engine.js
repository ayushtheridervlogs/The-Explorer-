/* ============================================================
   CAFE ATLAS v3 — state, data engine, SVG charts
   ============================================================ */
const state = {city:'all', zone:'all', cat:'all', range:'all', page:0};
let lang = (()=>{ try{ return localStorage.getItem('cafeAtlasLang') || 'en'; }catch(e){ return 'en'; } })();
if(!I18N[lang]) lang = 'en';
const t = k => (I18N[lang][k] ?? I18N.en[k] ?? k);

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtINR = n => '₹' + Math.round(n).toLocaleString('en-IN');
const fmtNum = n => Math.round(n).toLocaleString('en-IN');
const fmt1 = n => n==null ? '—' : n.toFixed(1);
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const median = a => { if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y); const m=s.length>>1; return s.length%2 ? s[m] : (s[m-1]+s[m])/2; };
const stdev = a => { if(a.length<2) return 0; const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)**2))); };
function pearson(x,y){
  const n=x.length; if(n<3) return null;
  const mx=mean(x), my=mean(y); let num=0, dx=0, dy=0;
  for(let i=0;i<n;i++){ num+=(x[i]-mx)*(y[i]-my); dx+=(x[i]-mx)**2; dy+=(y[i]-my)**2; }
  return (dx&&dy) ? num/Math.sqrt(dx*dy) : null;
}
const monthKey = d => `${d.getFullYear()}-${d.getMonth()}`;
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const mapUrl = (lat,lng) => `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lng.toFixed(5)}`;
const avgPt = arr => ({lat: avgArr(arr.map(x=>x.lat)), lng: avgArr(arr.map(x=>x.lng))});
const INDIA_CENTER = {lat:22.9, lng:79.6};
const emptyMsg = () => `<div class="empty">${t('empty')}</div>`;

/* ---------- scope helpers ---------- */
const cityInScope = z => state.city==='all' || z.city===state.city;
function scopedZones(){
  return ZONE_LIST.filter(z => cityInScope(z) && (state.zone==='all' || z.id===state.zone));
}

/* ---------- main computation: every figure derives from BUS/REV ---------- */
function compute(){
  const cutoff = state.range==='all' ? null
    : new Date(NOW.getFullYear(), NOW.getMonth()-Number(state.range), NOW.getDate());
  const inDate = x => !cutoff || x >= cutoff;

  const catBase = BUS.filter(b => state.cat==='all' || b.cat===state.cat);
  const base = catBase.filter(b => (state.city==='all' || b.city===state.city) && (state.zone==='all' || b.zid===state.zone));
  const ids = new Set(base.map(b=>b.id));
  const revAll = REV.filter(r => ids.has(r.bid));
  const revs = revAll.filter(r => inDate(r.date));
  const bizCut = base.filter(b => inDate(b.created));

  const rmap = {};
  revs.forEach(r => (rmap[r.bid] ??= []).push(r.rating));
  const biz = bizCut.map(b => {
    const rs = rmap[b.id] || [];
    return {...b, reviews: rs.length, rating: rs.length ? mean(rs) : null};
  });
  return {catBase, base, biz, revs, revAll, cutoff, inDate};
}

function zoneStats(biz, revs){
  const bizZid = {}; biz.forEach(b => bizZid[b.id] = b.zid);
  return scopedZones().map(z => {
    const bs = biz.filter(b => b.zid===z.id);
    const rs = revs.filter(r => bizZid[r.bid]===z.id).map(r=>r.rating);
    const cc = {}; bs.forEach(b => cc[b.cuisine] = (cc[b.cuisine]||0)+1);
    const top = Object.entries(cc).sort((a,b)=>b[1]-a[1])[0];
    return {
      id: z.id, name: z.name, cityName: z.cityName, lat: z.lat, lng: z.lng,
      total: bs.length,
      cafe: bs.filter(b=>b.cat==='cafe').length,
      restaurant: bs.filter(b=>b.cat==='restaurant').length,
      street: bs.filter(b=>b.cat==='street').length,
      avgPrice: mean(bs.map(b=>b.price)),
      avgRating: rs.length ? mean(rs) : null,
      reviews: rs.length,
      topCuisine: top ? top[0] : '—',
      density: bs.length / z.locCount
    };
  });
}

/* ---------- SVG charts (animated via CSS classes) ---------- */
function hbars(items, f=fmtNum, max0=null){
  if(!items.length) return emptyMsg();
  const W=600, LW=170, RH=32;
  const max=Math.max(...items.map(i=>i.value), max0||1, 1);
  const H=items.length*RH+8;
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  items.forEach((it,i)=>{
    const y=i*RH+4, bw=(W-LW-90)*it.value/max, d=i*90;
    const open = it.pt ? `<a href="${mapUrl(it.pt.lat,it.pt.lng)}" target="_blank" rel="noopener">` : '';
    const close = it.pt ? '</a>' : '';
    s+=`${open}<text x="0" y="${y+15}" font-size="12.5" fill="#242824">${esc(it.label)}</text>
        <rect class="hbar" style="--d:${d}" x="${LW}" y="${y+3}" width="${bw}" height="17" rx="5" fill="${it.color||'#183D32'}"/>
        <text class="bar-label" style="--d:${d}" x="${LW+bw+6}" y="${y+16}" font-size="12" fill="#6b6f68">${f(it.value)}</text>${close}`;
  });
  return s+'</svg>';
}

function vbars(items, f=fmtNum){
  if(!items.length) return emptyMsg();
  const W=600, H=240, pad=34, max=Math.max(...items.map(i=>i.value),1);
  const bw=(W-pad*2)/items.length;
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  items.forEach((it,i)=>{
    const h=(H-pad-30)*it.value/max, x=pad+i*bw+bw*0.2, w=bw*0.6, y=H-30-h, d=i*110;
    s+=`<rect class="bar" style="--d:${d}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${it.color||'#C58B52'}"/>
        <text class="bar-label" style="--d:${d}" x="${x+w/2}" y="${y-6}" font-size="12" text-anchor="middle" fill="#242824">${f(it.value)}</text>
        <text x="${x+w/2}" y="${H-10}" font-size="11" text-anchor="middle" fill="#6b6f68">${esc(it.label)}</text>`;
  });
  return s+'</svg>';
}

function donut(items){
  const total=items.reduce((s,i)=>s+i.value,0);
  if(!total) return emptyMsg();
  const C=2*Math.PI*70; let cum=0;
  let s=`<svg viewBox="0 0 200 200" width="200" role="img">
    <circle cx="100" cy="100" r="70" fill="none" stroke="#f1eadc" stroke-width="24"/>`;
  items.forEach((it,i)=>{
    const frac=it.value/total; if(!frac) return;
    s+=`<circle class="seg" style="--d:${i*250}" cx="100" cy="100" r="70" fill="none" stroke="${it.color}" stroke-width="24"
          stroke-dasharray="${frac*C} ${C}" stroke-dashoffset="${-cum*C}" transform="rotate(-90 100 100)"/>`;
    cum+=frac;
  });
  s+=`<text x="100" y="98" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="#183D32">${fmtNum(total)}</text>
      <text x="100" y="118" text-anchor="middle" font-size="10" letter-spacing="2" fill="#6b6f68">${t('k1').toUpperCase()}</text></svg>`;
  return s;
}

function lineChart(labels, a, b){
  const W=600, H=240, pad=36, n=labels.length;
  const max=Math.max(...a,...b,1);
  const X=i=>pad+i*(W-pad*2)/Math.max(n-1,1);
  const Y=v=>H-pad-(H-pad*2)*v/max;
  let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  for(let g=0;g<=4;g++){
    const v=max*g/4, y=Y(v);
    s+=`<line x1="${pad}" x2="${W-pad}" y1="${y}" y2="${y}" stroke="#efe6d4"/>
        <text x="${pad-6}" y="${y+4}" font-size="10" text-anchor="end" fill="#6b6f68">${fmtNum(v)}</text>`;
  }
  const pa=a.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
  const pb=b.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
  s+=`<polyline class="trend-a" pathLength="1" points="${pa}" fill="none" stroke="#183D32" stroke-width="2.8" stroke-linejoin="round"/>
      <polyline class="trend-b" pathLength="1" points="${pb}" fill="none" stroke="#C58B52" stroke-width="2.8" stroke-linejoin="round"/>`;
  a.forEach((v,i)=>s+=`<circle class="dotpt" cx="${X(i)}" cy="${Y(v)}" r="4" fill="#183D32"/>`);
  b.forEach((v,i)=>s+=`<circle class="dotpt" cx="${X(i)}" cy="${Y(v)}" r="4" fill="#C58B52"/>`);
  labels.forEach((l,i)=>s+=`<text x="${X(i)}" y="${H-12}" font-size="10" text-anchor="middle" fill="#6b6f68">${esc(l)}</text>`);
  return s+'</svg>';
}
