/* ============================================================
   CAFE ATLAS v3 — rendering: filters, navigation, chapters
   ============================================================ */
const COLORS = {cafe:'#183D32', restaurant:'#4A3028', street:'#C58B52'};

function kpi(label, value, count){
  const attr = count!=null ? ` data-count="${count}"` : '';
  return `<div class="kpi"><div class="v"${attr}>${value}</div><div class="l">${label}</div></div>`;
}
function card(title, note, body, extra=''){
  return `<div class="card ${extra}"><h3>${title}</h3><div class="card-rule"></div>${note?`<p class="note">${note}</p>`:''}${body}</div>`;
}
function chapter(n, inner){
  return `<section class="stop" id="ch${n}" data-chapter="${n}">
    <div class="node">${n}</div>
    <div class="stop-body">
      <div class="chapter">
        <div class="eyebrow">${t('chEyebrow')} ${n} · ${t('ch'+n)}</div>
        <h2>${t('t'+n)}</h2>
        <p class="lede">${t('l'+n)}</p>
      </div>
      <div class="grid">${inner}</div>
    </div>
  </section>`;
}
const nameLink = b => `<a class="maplink" href="${mapUrl(b.lat,b.lng)}" target="_blank" rel="noopener" title="${t('openMap')}">${esc(b.name)}</a>`;

/* ---------- static UI translation + filter/nav builders ---------- */
function buildFilterOptions(){
  const cSel = document.getElementById('fCity');
  cSel.innerHTML = `<option value="all">${t('allIndia')}</option>` +
    CITY_DEFS.map(c=>`<option value="${c.key}">${esc(c.name)}</option>`).join('');
  cSel.value = state.city;

  const zSel = document.getElementById('fZone');
  const groups = CITY_DEFS.filter(c=>state.city==='all' || c.key===state.city);
  zSel.innerHTML = `<option value="all">${t('allZones')}</option>` +
    groups.map(c=>`<optgroup label="${esc(c.name)}">` +
      ZONE_LIST.filter(z=>z.city===c.key).map(z=>`<option value="${esc(z.id)}">${esc(z.name)}</option>`).join('') +
      `</optgroup>`).join('');
  zSel.value = state.zone;
  if(zSel.value!==state.zone){ state.zone='all'; zSel.value='all'; }
}

function buildNav(){
  document.getElementById('navbar').innerHTML =
    `<span class="nav-label">${t('navLabel')}</span>` +
    [1,2,3,4,5,6,7,8].map(n=>`<a href="#ch${n}" class="nav-link"><b>${n}</b>${t('ch'+n)}</a>`).join('');
}

function applyStatic(){
  document.documentElement.lang = lang;
  document.body.classList.toggle('indic', lang!=='en');
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('.langs button').forEach(b => b.classList.toggle('active', b.dataset.lang===lang));
  document.getElementById('chatInput').placeholder = t('chatPlaceholder');
  buildFilterOptions();
  buildNav();
}

/* ---------- main render ---------- */
function render(){
  const d = compute();
  const {biz, revs, catBase, inDate} = d;
  const zs = zoneStats(biz, revs);

  const cafes=biz.filter(b=>b.cat==='cafe').length;
  const rests=biz.filter(b=>b.cat==='restaurant').length;
  const street=biz.filter(b=>b.cat==='street').length;
  const citiesCovered = new Set(biz.map(b=>b.city)).size;
  const citiesTotal = state.city==='all' ? CITY_DEFS.length : 1;
  const zonesCovered = new Set(biz.map(b=>b.zid)).size;
  const avgRating = revs.length ? mean(revs.map(r=>r.rating)) : null;

  // Chapter 1 — KPIs
  const kpis = `<div class="kpis kpis-wide">
    ${kpi(t('k1'), fmtNum(biz.length), biz.length)}
    ${kpi(t('k2'), fmtNum(cafes), cafes)}
    ${kpi(t('k3'), fmtNum(rests), rests)}
    ${kpi(t('k4'), fmtNum(street), street)}
    ${kpi(t('k5'), `${citiesCovered}<span class="of"> / ${citiesTotal}</span>`)}
    ${kpi(t('k6'), `${zonesCovered}<span class="of"> / ${zs.length}</span>`)}
    ${kpi(t('k7'), avgRating==null?'—':avgRating.toFixed(2), avgRating==null?null:avgRating.toFixed(2))}
    ${kpi(t('k8'), fmtNum(revs.length), revs.length)}
  </div>`;

  // Chapter 2 — distribution, zones, cities
  const distribution = vbars([
    {label:t('cafes'), value:cafes, color:COLORS.cafe},
    {label:t('restaurants'), value:rests, color:COLORS.restaurant},
    {label:t('street'), value:street, color:COLORS.street}
  ]);
  const zoneSorted = [...zs].sort((a,b)=>b.total-a.total);
  const zoneItems = (zoneSorted.length>15 ? zoneSorted.slice(0,15) : zoneSorted)
    .map(z=>({label: state.city==='all' ? `${z.name} · ${z.cityName}` : z.name, value:z.total, pt:{lat:z.lat,lng:z.lng}}));
  const zoneCount = hbars(zoneItems);
  const cityItems = CITY_DEFS.map(c=>{
    const n = catBase.filter(b=>b.city===c.key && inDate(b.created)).length;
    const cz = ZONE_LIST.filter(z=>z.city===c.key);
    return {label:c.name, value:n, pt:avgPt(cz.map(z=>({lat:z.lat,lng:z.lng}))), color:'#4A3028'};
  }).filter(i=> state.city==='all' || i.label===CITY_DEFS.find(c=>c.key===state.city).name)
    .sort((a,b)=>b.value-a.value);
  const cityCmp = hbars(cityItems);

  // Chapter 3 — ratings
  const rated = biz.filter(b=>b.rating!=null);
  const buckets = [
    {label:'<3.0', lo:0, hi:3}, {label:'3.0–3.4', lo:3, hi:3.5}, {label:'3.5–3.9', lo:3.5, hi:4},
    {label:'4.0–4.4', lo:4, hi:4.5}, {label:'4.5–5.0', lo:4.5, hi:5.01}
  ].map(bk=>({label:bk.label, value:rated.filter(b=>b.rating>=bk.lo && b.rating<bk.hi).length}));
  const ratingDist = vbars(buckets, v=>v);
  const topRated = [...biz].filter(b=>b.reviews>=3).sort((a,b)=>b.rating-a.rating || b.reviews-a.reviews).slice(0,10);
  const mostReviewed = [...biz].sort((a,b)=>b.reviews-a.reviews).slice(0,10);
  const miniTable = rows => rows.length ? `<div class="table-wrap"><table>
    <thead><tr><th>${t('thBiz')}</th><th>${t('thLoc')}</th><th class="num">${t('thRating')}</th><th class="num">${t('thReviews')}</th></tr></thead>
    <tbody>${rows.map(b=>`<tr><td>${nameLink(b)}</td><td>${esc(b.locality)}</td><td class="num">${fmt1(b.rating)}</td><td class="num">${b.reviews}</td></tr>`).join('')}</tbody></table></div>` : emptyMsg();

  // Chapter 4 — price
  const priceItems = zs.filter(z=>z.total).map(z=>({label:z.name, value:z.avgPrice, pt:{lat:z.lat,lng:z.lng}}));
  const priceByZone = hbars(priceItems, fmtINR);
  const catDonut = `${donut([
      {value:cafes, color:COLORS.cafe},{value:rests, color:COLORS.restaurant},{value:street, color:COLORS.street}])}
    <div class="legend legend-center">
      <span><i class="dot" style="background:${COLORS.cafe}"></i>${t('cafes')} ${cafes}</span>
      <span><i class="dot" style="background:${COLORS.restaurant}"></i>${t('restaurants')} ${rests}</span>
      <span><i class="dot" style="background:${COLORS.street}"></i>${t('street')} ${street}</span>
    </div>`;
  const prices = biz.map(b=>b.price);
  const pr = pearson(rated.map(b=>b.price), rated.map(b=>b.rating));
  const corrText = pr==null ? 'n/a' : pr.toFixed(2);
  const sKey = pr==null ? null : Math.abs(pr)<0.1 ? 'none' : Math.abs(pr)<0.3 ? 'weak' : Math.abs(pr)<0.5 ? 'moderate' : 'strong';
  const dKey = pr==null ? null : pr>=0 ? 'pos' : 'neg';
  const stats = `<div class="stats">
    <div class="stat"><div class="v">${fmtINR(mean(prices))}</div><div class="l">${t('stMean')}</div></div>
    <div class="stat"><div class="v">${fmtINR(median(prices))}</div><div class="l">${t('stMedian')}</div></div>
    <div class="stat"><div class="v">${fmtINR(stdev(prices))}</div><div class="l">${t('stSd')}</div></div>
    <div class="stat"><div class="v">${corrText}</div><div class="l">${t('stCorr')}</div></div>
  </div>
  <p class="note stat-note">${pr==null ? t('notEnoughCorr') : t('corrLine')(t('str')[sKey], t('str')[dKey], corrText)}</p>`;

  const locGroups = {};
  biz.forEach(b=>{ const k=`${b.city}|${b.locality}`; (locGroups[k] ??= {list:[], city:b.cityName, loc:b.locality}).list.push(b); });
  const affordable = Object.values(locGroups)
    .filter(g=>g.list.length>=2)
    .map(g=>({label: state.city==='all' ? `${g.loc}, ${g.city}` : g.loc,
              value: mean(g.list.map(b=>b.price)), pt: avgPt(g.list), _name:g.loc, _pt:avgPt(g.list)}))
    .sort((a,b)=>a.value-b.value).slice(0,8);

  // Chapter 5 — monthly trend
  const months=[];
  for(let i=11;i>=0;i--) months.push(new Date(NOW.getFullYear(), NOW.getMonth()-i, 1));
  const labels = months.map(m=>m.toLocaleString(lang==='en'?'en-US':lang==='hi'?'hi-IN':'mr-IN',{month:'short',year:'2-digit'}));
  const addedPerMonth = months.map(m=>d.base.filter(b=>monthKey(b.created)===monthKey(m)).length);
  const reviewsPerMonth = months.map(m=>d.revAll.filter(r=>monthKey(r.date)===monthKey(m)).length);
  const trend = lineChart(labels, addedPerMonth, reviewsPerMonth);

  // Chapter 6 — zone table
  const zoneTable = `<div class="table-wrap"><table>
    <thead><tr><th>${t('thZone')}</th><th>${t('thCity')}</th><th class="num">${t('thTotal')}</th><th class="num">${t('thCafes')}</th><th class="num">${t('thRest')}</th><th class="num">${t('thStreet')}</th><th class="num">${t('thAvgR')}</th><th class="num">${t('thAvgP')}</th><th class="num">${t('thReviews')}</th><th>${t('thTopC')}</th></tr></thead>
    <tbody>${zs.map(z=>`<tr>
      <td><a class="maplink" href="${mapUrl(z.lat,z.lng)}" target="_blank" rel="noopener">${esc(z.name)}</a></td><td>${esc(z.cityName)}</td>
      <td class="num">${z.total}</td><td class="num">${z.cafe}</td><td class="num">${z.restaurant}</td><td class="num">${z.street}</td>
      <td class="num">${fmt1(z.avgRating)}</td><td class="num">${z.total?fmtINR(z.avgPrice):'—'}</td><td class="num">${z.reviews}</td><td>${esc(z.topCuisine)}</td>
    </tr>`).join('')}</tbody></table></div>`;

  // Chapter 7 — insights (each carries a map point)
  const insItems = buildInsights(biz, zs, rated, pr, sKey, dKey, corrText, affordable, cafes);
  const insights = insItems.length
    ? `<ul class="ins">${insItems.map(i=>`<li><a class="ins-link" href="${mapUrl(i.pt.lat,i.pt.lng)}" target="_blank" rel="noopener"><span>${i.html}</span><span class="go">📍 ${t('openMap')} →</span></a></li>`).join('')}</ul>`
    : emptyMsg();

  // Chapter 8 — records
  const sorted=[...biz].sort((a,b)=>b.reviews-a.reviews || a.name.localeCompare(b.name));
  const pages=Math.max(1,Math.ceil(sorted.length/PER_PAGE));
  if(state.page>=pages) state.page=0;
  const slice=sorted.slice(state.page*PER_PAGE,(state.page+1)*PER_PAGE);
  const records = `
    <div class="toolbar">
      <span class="note" style="margin:0">${t('showing')} ${sorted.length?state.page*PER_PAGE+1:0}–${Math.min((state.page+1)*PER_PAGE,sorted.length)} ${t('of')} ${fmtNum(sorted.length)} · ${t('page')} ${state.page+1} / ${pages}</span>
      <div class="btn-row">
        <button class="btn ghost" data-action="prev" ${state.page===0?'disabled':''}>${t('prev')}</button>
        <button class="btn ghost" data-action="next" ${state.page>=pages-1?'disabled':''}>${t('next')}</button>
        <button class="btn" data-action="csv" ${sorted.length?'':'disabled'}>${t('exportCsv')}</button>
      </div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>${t('thBiz')}</th><th>${t('thCity')}</th><th>${t('thCat')}</th><th>${t('thCuisine')}</th><th>${t('thZone')}</th><th>${t('thLoc')}</th><th class="num">${t('thPrice')}</th><th class="num">${t('thRating')}</th><th class="num">${t('thReviews')}</th></tr></thead>
      <tbody>${slice.map(b=>`<tr>
        <td>${nameLink(b)} <span class="pill pill-sm">${t('demo')}</span></td>
        <td>${esc(b.cityName)}</td><td>${t(b.cat==='cafe'?'cafes':b.cat==='restaurant'?'restaurants':'street')}</td>
        <td>${esc(b.cuisine)}</td><td>${esc(b.zone)}</td><td>${esc(b.locality)}</td>
        <td class="num">${fmtINR(b.price)}</td><td class="num">${fmt1(b.rating)}</td><td class="num">${b.reviews}</td>
      </tr>`).join('') || `<tr><td colspan="9" class="empty">${t('noMatch')}</td></tr>`}</tbody>
    </table></div>`;

  const chapters = [
    chapter(1, kpis),
    chapter(2,
      card(t('cDist'), t('nDist'), distribution) +
      card(t('cZone'), t('nZone'), zoneCount, 'wide') +
      card(t('cCity'), t('nCity'), cityCmp)),
    chapter(3,
      card(t('cRating'), t('nRating'), ratingDist) +
      card(t('cTopRated'), t('nTopRated'), miniTable(topRated)) +
      card(t('cMostRev'), t('nMostRev'), miniTable(mostReviewed), 'wide')),
    chapter(4,
      card(t('cPrice'), t('nPrice'), priceByZone) +
      card(t('cMix'), t('nMix'), `<div class="donut-wrap">${catDonut}</div>`) +
      card(t('cStats'), t('nStats'), stats) +
      card(t('cAfford'), t('nAfford'), hbars(affordable.map(a=>({label:a.label,value:a.value,pt:a.pt})), fmtINR), 'wide')),
    chapter(5,
      card(t('cTrend'), t('nTrend'),
        `${trend}<div class="legend"><span><i class="dot" style="background:#183D32"></i>${t('legAdded')}</span><span><i class="dot" style="background:#C58B52"></i>${t('legRev')}</span></div>`,'wide')),
    chapter(6, card(t('cZoneTbl'), t('nZoneTbl'), zoneTable, 'wide')),
    chapter(7, card(t('cIns'), t('nIns'), insights, 'wide')),
    chapter(8, card(t('cRecords'), t('nRecords'), records, 'wide'))
  ].join('');

  document.getElementById('app').innerHTML = chapters;
  document.getElementById('upd').textContent = new Date().toLocaleString(lang==='en'?'en-IN':lang==='hi'?'hi-IN':'mr-IN',{dateStyle:'medium',timeStyle:'short'});
  afterRender();
}

/* ---------- insights: generated from results, each with a map point ---------- */
function buildInsights(biz, zs, rated, pr, sKey, dKey, corrText, affordable, cafes){
  const I = t('ins'), out = [];
  if(!biz.length) return out;

  const byLoc = {};
  biz.filter(b=>b.cat==='cafe').forEach(b=>{ const k=`${b.city}|${b.locality}`; (byLoc[k] ??= {list:[], loc:b.locality}).list.push(b); });
  const topLoc = Object.values(byLoc).sort((a,b)=>b.list.length-a.list.length)[0];
  if(topLoc) out.push({html: I.cafeTop(esc(topLoc.loc), topLoc.list.length), pt: avgPt(topLoc.list)});

  const ranked = zs.filter(z=>z.avgRating!=null && z.reviews>=3);
  if(ranked.length>=2){
    const hi=[...ranked].sort((a,b)=>b.avgRating-a.avgRating)[0];
    const lo=[...ranked].sort((a,b)=>a.avgRating-b.avgRating)[0];
    out.push({html: I.rating(esc(hi.name), fmt1(hi.avgRating), esc(lo.name), fmt1(lo.avgRating)), pt:{lat:hi.lat,lng:hi.lng}});
  }
  const cheap = zs.filter(z=>z.total).sort((a,b)=>a.avgPrice-b.avgPrice)[0];
  if(cheap) out.push({html: I.cheap(esc(cheap.name), fmtINR(cheap.avgPrice)), pt:{lat:cheap.lat,lng:cheap.lng}});
  const dense = [...zs].sort((a,b)=>b.density-a.density)[0];
  if(dense && dense.total) out.push({html: I.dense(esc(dense.name), dense.density.toFixed(1)), pt:{lat:dense.lat,lng:dense.lng}});
  out.push({html: I.share(biz.length ? Math.round(cafes/biz.length*100) : 0), pt: state.city==='all' ? INDIA_CENTER : (()=>{const z=ZONE_LIST.filter(z=>z.city===state.city); return avgPt(z.map(x=>({lat:x.lat,lng:x.lng})));})()});
  if(affordable[0]) out.push({html: I.afford(esc(affordable[0].label), fmtINR(affordable[0].value)), pt: affordable[0].pt});
  if(pr!=null) out.push({html: t('corrLine')(t('str')[sKey], t('str')[dKey], corrText), pt: avgPt(biz.map(b=>({lat:b.lat,lng:b.lng})))});
  return out;
}
