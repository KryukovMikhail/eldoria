// ---------- Экспорт и импорт сохранений файлом ----------
function exportSaves(){
  const bundle = {format:'eldoria-saves', v:1, build:'D001.031', t:Date.now(), saves:{}};
  let n = 0;
  for(const k of [SAVE_KEY, ...SLOT_KEYS]){ let v = null; try{ v = localStorage.getItem(k); }catch(e){} if(v){ bundle.saves[k] = v; n++; } }
  if(!n){ renderSaves('Нечего экспортировать: сохранений пока нет.'); return; }
  const d = new Date(), pad = x=>String(x).padStart(2,'0');
  const name = 'eldoria-saves-'+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+'.json';
  const blob = new Blob([JSON.stringify(bundle)], {type:'application/json'});
  try{
    const file = new File([blob], name, {type:'application/json'});
    if(isTouchDevice && navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file], title:'Сохранения Легенд Эльдории'}).then(()=>renderSaves('Файл передан: '+name), ()=>renderSaves('Отправка отменена.'));
      return;
    }
  }catch(e){}
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  renderSaves('Сохранения ('+n+') выгружены в файл '+name);
}
function importSaves(file){
  const rd = new FileReader();
  rd.onerror = ()=>renderSaves('Не удалось прочитать файл.');
  rd.onload = ()=>{
    let b; try{ b = JSON.parse(rd.result); }catch(e){ renderSaves('Файл повреждён: это не файл сохранений.'); return; }
    if(!b || b.format!=='eldoria-saves' || !b.saves){ renderSaves('Это не файл сохранений Легенд Эльдории.'); return; }
    const allowed = new Set([SAVE_KEY, ...SLOT_KEYS]); let ok = 0, bad = 0;
    for(const k of Object.keys(b.saves)){
      if(!allowed.has(k)){ bad++; continue; }
      try{ const d = JSON.parse(b.saves[k]); if(!d || !d.player || !d.world) throw 0; localStorage.setItem(k, b.saves[k]); ok++; }catch(e){ bad++; }
    }
    renderSaves(ok ? 'Загружено сохранений: '+ok+(bad?' (пропущено: '+bad+')':'')+'. Теперь выберите «Загрузить».' : 'В файле нет подходящих сохранений.');
    refreshSaveUI();
  };
  rd.readAsText(file);
}
document.getElementById('expBtn').addEventListener('click', exportSaves);
document.getElementById('impBtn').addEventListener('click', ()=>{ if(!storageOK){ renderSaves('Хранилище браузера недоступно.'); return; } document.getElementById('impFile').click(); });
document.getElementById('impFile').addEventListener('change', e=>{ const f = e.target.files[0]; e.target.value = ''; if(f) importSaves(f); });

// ---------- Карта мира: все уровни, локации и переходы ----------
const mapScreen = document.getElementById('mapScreen');
function mapTitle(id){
  if(id==='overworld') return 'Оверворлд';
  if(id==='town') return 'Город Лиссарен';
  if(id==='house1') return 'Трактир «Дремлющий Грифон»';
  if(id==='house2') return 'Лавка «Дымный Тигель»';
  if(id==='secret1') return 'Грот Мудреца Орбина';
  if(id==='secret2') return 'Тайник Забытых Эхо';
  const pd = POI_DEFS.find(d=>d.id===id); if(pd) return pd.title;
  return LOC_NAME[id] || id;
}
function renderMap(){
  const box = document.getElementById('mapBox'), stage = (world && world.lair1) ? storyStage() : 0;
  const W = 340, SHOPS = {overworld:1, desert:1, ice:1, grave:1, jungle:1};
  const cur = hasActiveGame ? currentLocId : null;
  const mainIds = ['overworld', ...CHAIN];
  const lairsBefore = id=>{ let n = 0; for(const c of CHAIN){ if(c===id) break; if(LAIR[c]) n++; } return n; };
  const subs = {overworld:['poi_cabin','town','secret1','secret2']};
  for(const pd of POI_DEFS) if(pd.parent!=='overworld') subs[pd.parent] = [pd.id];
  const esc = t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const rnd = (i,k)=>hash2(i,k,777);
  // раскладка: дорога вьётся вниз
  const pos = {}; let y = 78;
  mainIds.forEach((id,i)=>{ pos[id] = [170+80*Math.sin(i*0.92+0.5), y]; y += 54 + (subs[id] ? 12+16*subs[id].length : 0) * (LAIR[id]?0:1); });
  const H = y + 70;
  // --- значки рельефа ---
  const ink = '#4a3418';
  const tree = (x,yy,sc=1,c='#6a9a46')=>`<g transform="translate(${x},${yy}) scale(${sc})"><rect x="-1" y="2" width="2" height="4" fill="#5a3a1a"/><circle r="5.2" cy="-1" fill="${c}" stroke="#2e4a1e" stroke-width=".9"/><circle r="2.4" cx="-1.5" cy="-2.5" fill="#fff" opacity=".18"/></g>`;
  const peak = (x,yy,sc,c1,c2)=>`<g transform="translate(${x},${yy}) scale(${sc})"><path d="M-9 6 L0 -10 L9 6Z" fill="${c1}" stroke="${ink}" stroke-width=".9" stroke-linejoin="round"/><path d="M0 -10 L9 6 L2 6 L1 -3Z" fill="${c2}" opacity=".8"/></g>`;
  const snow = (x,yy,sc)=>`<g transform="translate(${x},${yy}) scale(${sc})"><path d="M-9 6 L0 -11 L9 6Z" fill="#c8dcec" stroke="#4a6a8a" stroke-width=".9" stroke-linejoin="round"/><path d="M-3.6 -3 L0 -11 L3.6 -3 L1.5 -4.5 L0 -2.5 L-1.5 -4.5Z" fill="#fff"/></g>`;
  const cross = (x,yy)=>`<g transform="translate(${x},${yy})"><path d="M-3 6 V-2 a3 3 0 0 1 6 0 V6Z" fill="#a8aea8" stroke="#3a403a" stroke-width=".8"/><path d="M0 -3 V2 M-1.8 -1 H1.8" stroke="#3a403a" stroke-width=".8"/></g>`;
  const palm = (x,yy,sc=1)=>`<g transform="translate(${x},${yy}) scale(${sc})"><path d="M0 5 Q1 -2 0 -5" stroke="#5a3a1a" stroke-width="1.4" fill="none"/>${[0,1,2,3,4].map(k=>`<path d="M0 -5 Q${5*Math.cos(k*1.26)} ${-8+4*Math.sin(k*1.26)} ${8*Math.cos(k*1.26)} ${-5+6*Math.sin(k*1.26)}" stroke="#2f7a34" stroke-width="2" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
  const dune = (x,yy,sc)=>`<path d="M${x-14*sc} ${yy} Q${x-5*sc} ${yy-9*sc} ${x} ${yy-3*sc} Q${x+6*sc} ${yy-10*sc} ${x+14*sc} ${yy}" stroke="#a8782e" stroke-width="1.1" fill="none"/>`;
  const pyr = (x,yy,sc)=>`<g transform="translate(${x},${yy}) scale(${sc})"><path d="M-10 6 L0 -9 L10 6Z" fill="#e0b860" stroke="${ink}" stroke-width=".9" stroke-linejoin="round"/><path d="M0 -9 L10 6 L3 6Z" fill="#b8883a"/></g>`;
  const cactus = (x,yy)=>`<g transform="translate(${x},${yy})" stroke="#2e6a2a" stroke-width="2" stroke-linecap="round" fill="none"><path d="M0 5 V-5 M0 1 H-3 V-2 M0 -1 H3 V-4"/></g>`;
  const house = (x,yy,sc=1,c='#c8a878')=>`<g transform="translate(${x},${yy}) scale(${sc})"><rect x="-5" y="-2" width="10" height="7" fill="${c}" stroke="${ink}" stroke-width=".8"/><path d="M-6.5 -2 L0 -8 L6.5 -2Z" fill="#a8442a" stroke="${ink}" stroke-width=".8" stroke-linejoin="round"/></g>`;
  const mansion = (x,yy,sc=1)=>`<g transform="translate(${x},${yy}) scale(${sc})"><rect x="-12" y="-4" width="24" height="10" fill="#8a7a96" stroke="${ink}" stroke-width=".9"/><rect x="-14" y="-12" width="6" height="18" fill="#6a5a76" stroke="${ink}" stroke-width=".9"/><rect x="8" y="-12" width="6" height="18" fill="#6a5a76" stroke="${ink}" stroke-width=".9"/><path d="M-15 -12 L-11 -19 L-7 -12Z M7 -12 L11 -19 L15 -12Z M-9 -4 L0 -12 L9 -4Z" fill="#3a2a46" stroke="${ink}" stroke-width=".8" stroke-linejoin="round"/><rect x="-2" y="0" width="4" height="6" fill="#1a1020"/></g>`;
  const volc = (x,yy,sc)=>`<g transform="translate(${x},${yy}) scale(${sc})"><path d="M-12 7 L-4 -8 L4 -8 L12 7Z" fill="#7a4a3a" stroke="${ink}" stroke-width=".9" stroke-linejoin="round"/><path d="M-4 -8 Q0 -5 4 -8 Q2 -13 0 -11 Q-2 -14 -4 -8Z" fill="#ff7a1a" stroke="#8a2a08" stroke-width=".6"/></g>`;
  const pool = (x,yy,c)=>`<ellipse cx="${x}" cy="${yy}" rx="8" ry="4" fill="${c}" stroke="${ink}" stroke-width=".7" opacity=".9"/>`;
  const deadtree = (x,yy)=>`<g transform="translate(${x},${yy})" stroke="#4a3a2a" stroke-width="1.3" fill="none" stroke-linecap="round"><path d="M0 6 V-4 M0 0 L-4 -4 M0 -2 L4 -6"/></g>`;
  const DECOR = {
    overworld:(x,yy,i)=>{ let o = `<ellipse cx="${x+(rnd(i,1)<.5?-52:52)}" cy="${yy+14}" rx="26" ry="14" fill="#8ab8d8" stroke="#3a6a8a" stroke-width="1"/>`; for(let k=0;k<12;k++) o += tree(x+(rnd(i,k+2)-.5)*150, yy+(rnd(i,k+30)-.5)*54, .9+rnd(i,k+60)*.5); return o; },
    dungeon1:(x,yy,i)=>{ let o=''; for(let k=0;k<7;k++) o += peak(x+(rnd(i,k+2)-.5)*150, yy+(rnd(i,k+30)-.5)*46, .9+rnd(i,k+60)*.5,'#b0a89a','#6a6258'); return o; },
    dungeon3:(x,yy,i)=>{ let o=`<path d="M${x-60} ${yy+6} L${x-30} ${yy-4} L${x-10} ${yy+8} L${x+14} ${yy-6} L${x+40} ${yy+6} L${x+64} ${yy-2}" stroke="#1a1020" stroke-width="6" fill="none" stroke-linejoin="round"/>`; for(let k=0;k<6;k++) o += peak(x+(rnd(i,k+2)-.5)*150, yy+(rnd(i,k+30)-.5)*52, .8+rnd(i,k+60)*.4,'#8a7ea0','#4a3e62'); return o; },
    lava:(x,yy,i)=>{ let o=''; for(let k=0;k<3;k++) o += volc(x+(rnd(i,k+2)-.5)*140, yy+(rnd(i,k+30)-.5)*40, .9+rnd(i,k+60)*.4); for(let k=0;k<4;k++) o += pool(x+(rnd(i,k+9)-.5)*140, yy+(rnd(i,k+19)-.5)*50,'#ff8a2a'); return o; },
    desert:(x,yy,i)=>{ let o=''; for(let k=0;k<7;k++) o += dune(x+(rnd(i,k+2)-.5)*150, yy+(rnd(i,k+30)-.5)*52, .8+rnd(i,k+60)*.6); o += pyr(x+(rnd(i,3)<.5?-58:58), yy-8, 1.3)+pyr(x+(rnd(i,3)<.5?-40:40), yy+14, .9); for(let k=0;k<3;k++) o += cactus(x+(rnd(i,k+70)-.5)*140, yy+(rnd(i,k+80)-.5)*50); return o; },
    ice:(x,yy,i)=>{ let o=''; for(let k=0;k<7;k++) o += snow(x+(rnd(i,k+2)-.5)*150, yy+(rnd(i,k+30)-.5)*50, .9+rnd(i,k+60)*.5); for(let k=0;k<8;k++) o += `<circle cx="${x+(rnd(i,k+90)-.5)*160}" cy="${yy+(rnd(i,k+100)-.5)*60}" r="1.3" fill="#fff"/>`; return o; },
    grave:(x,yy,i)=>{ let o=''; for(let k=0;k<8;k++) o += cross(x+(rnd(i,k+2)-.5)*150, yy+(rnd(i,k+30)-.5)*50); for(let k=0;k<3;k++) o += deadtree(x+(rnd(i,k+70)-.5)*150, yy+(rnd(i,k+80)-.5)*46); return o; },
    jungle:(x,yy,i)=>{ let o=''; for(let k=0;k<10;k++) o += palm(x+(rnd(i,k+2)-.5)*154, yy+(rnd(i,k+30)-.5)*52, .9+rnd(i,k+60)*.4); return o; },
    city:(x,yy,i)=>{ let o=`<rect x="${x-70}" y="${yy-26}" width="140" height="52" rx="6" fill="none" stroke="#6a5a4a" stroke-width="2.2" stroke-dasharray="7 3"/>`; for(let k=0;k<8;k++) o += house(x+(rnd(i,k+2)-.5)*120, yy+(rnd(i,k+30)-.5)*38, .85+rnd(i,k+60)*.3,'#b8a898'); return o; },
    manor:(x,yy,i)=>{ let o=''; o += mansion(x+(rnd(i,2)<.5?-50:50), yy-6, 1.5); for(let k=0;k<5;k++) o += deadtree(x+(rnd(i,k+70)-.5)*150, yy+(rnd(i,k+80)-.5)*50); return o; }
  };
  const TINT = {overworld:'#78b050', dungeon1:'#9a8e7a', dungeon3:'#7a6a9a', lava:'#e0602a', desert:'#e8b850', ice:'#a8d0ec', grave:'#7a8a7a', jungle:'#3a9a4a', city:'#b0a090', manor:'#8a6a9a'};
  let back = '', decor = '', road = '', nodes = '', labels = '';
  mainIds.forEach((id,i)=>{ if(LAIR[id]) return;
    const [x,yy] = pos[id], req = id==='overworld' ? 0 : lairsBefore(id), locked = stage<req;
    back += `<ellipse cx="${x}" cy="${yy}" rx="118" ry="40" fill="url(#t_${id})" />`;
    decor += `<g ${locked?'opacity=".5" filter="url(#fade)"':''}>${DECOR[id](x,yy,i)}</g>`;
  });
  let defs = `<filter id="fade"><feColorMatrix type="saturate" values=".25"/></filter>`;
  for(const id of mainIds) if(TINT[id]) defs += `<radialGradient id="t_${id}"><stop offset="0" stop-color="${TINT[id]}" stop-opacity=".42"/><stop offset=".7" stop-color="${TINT[id]}" stop-opacity=".16"/><stop offset="1" stop-color="${TINT[id]}" stop-opacity="0"/></radialGradient>`;
  // дорога
  const P = mainIds.map(id=>pos[id]); let d = `M${P[0][0]} ${P[0][1]}`;
  for(let i=1;i<P.length;i++){ const mx = (P[i-1][0]+P[i][0])/2, my = (P[i-1][1]+P[i][1])/2; d += ` Q${P[i-1][0]} ${(P[i-1][1]+my)/2+ (my-P[i-1][1])*0.5} ${mx} ${my}`; }
  d += ` T${P[P.length-1][0]} ${P[P.length-1][1]}`;
  let dd = `M${P[0][0]} ${P[0][1]}`; for(let i=1;i<P.length;i++){ const [x0,y0]=P[i-1],[x1,y1]=P[i]; dd += ` C${x0} ${y0+(y1-y0)*0.55} ${x1} ${y1-(y1-y0)*0.55} ${x1} ${y1}`; }
  road = `<path d="${dd}" fill="none" stroke="#6a4a20" stroke-opacity=".55" stroke-width="11" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="#f3e2b0" stroke-width="7" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="#a07a3a" stroke-width="1.3" stroke-dasharray="3 4"/>`;
  const halo = 'paint-order="stroke" stroke="#f0deaa" stroke-width="3.2" stroke-linejoin="round"';
  const SERIF = "font-family=\"Georgia,'Times New Roman',serif\"";
  mainIds.forEach((id,i)=>{
    const [x,yy] = pos[id], isL = !!LAIR[id], req = id==='overworld' ? 0 : lairsBefore(id);
    const locked = id!=='overworld' && stage<req, beaten = isL && stage>=(LAIR_ORDER.indexOf(id)+1);
    const side = x<170 ? 1 : -1, anc = side>0 ? 'start' : 'end', lx = x+side*(isL?17:22), op = locked ? .55 : 1;
    if(cur===id) nodes += `<circle cx="${x}" cy="${yy}" r="${isL?15:17}" fill="none" stroke="#c8321a" stroke-width="3"><animate attributeName="r" values="${isL?12:14};${isL?19:21};${isL?12:14}" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle>`;
    if(isL){
      nodes += `<g opacity="${op}"><circle cx="${x}" cy="${yy}" r="10" fill="${beaten?'#5a8a3a':'#a8322a'}" stroke="#3a0c06" stroke-width="2"/><circle cx="${x}" cy="${yy}" r="7" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/></g><text x="${x}" y="${yy+4.2}" text-anchor="middle" font-size="11" fill="#fff" opacity="${op}">${beaten?'✔':locked?'🔒':'⚔'}</text>`;
      labels += `<text x="${lx}" y="${yy+4}" text-anchor="${anc}" font-size="11" font-style="italic" ${SERIF} fill="${locked?'#7a6a4a':'#6a1a0e'}" ${halo}>${esc(mapTitle(id))}</text>`;
    } else {
      nodes += `<g opacity="${op}"><circle cx="${x}" cy="${yy}" r="13" fill="${TINT[id]}" stroke="#2a1a08" stroke-width="2.2"/><circle cx="${x}" cy="${yy}" r="9.5" fill="#f3e2b0" stroke="#2a1a08" stroke-width="1"/><circle cx="${x}" cy="${yy}" r="4" fill="${id==='overworld'?'#3a7a2a':'#2a1a08'}"/></g>`;
      if(locked) nodes += `<text x="${x}" y="${yy+4.5}" text-anchor="middle" font-size="12">🔒</text>`;
      labels += `<text x="${lx}" y="${yy-1}" text-anchor="${anc}" font-size="14" font-weight="bold" ${SERIF} fill="${locked?'#7a6a4a':'#2e1a06'}" ${halo}>${esc(mapTitle(id))}${SHOPS[id]?' 🛒':''}</text>`;
      let sy = yy+13;
      for(const sid of (subs[id]||[])){
        const sx = lx, sec = sid.startsWith('secret'), twn = sid==='town';
        const ico = sec ? `<path d="M${sx+(side>0?-6:6)-3} ${sy-3} l6 6 m0 -6 l-6 6" stroke="#b02a14" stroke-width="2" stroke-linecap="round"/>` : twn ? house(sx+(side>0?-6:6),sy-1,.9,'#d8b878') : `<circle cx="${sx+(side>0?-6:6)}" cy="${sy-1}" r="3.2" fill="#7a5a2a" stroke="#2a1a08" stroke-width=".8"/>`;
        labels += `<g opacity="${locked?.55:1}">${ico}</g><text x="${sx+(side>0?2:-2)}" y="${sy+2}" text-anchor="${anc}" font-size="10.5" ${SERIF} fill="#3a2410" ${halo}>${esc(mapTitle(sid))}${twn?' · трактир, лавка':''}</text>`;
        pos[sid] = [sx,sy]; sy += 15;
      }
    }
    if(cur && cur===id) labels += `<text x="${x}" y="${yy-(isL?15:20)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#c8321a" ${halo}>вы здесь</text>`;
  });
  if(cur && !mainIds.includes(cur) && pos[cur]){ const q = pos[cur]; nodes += `<circle cx="${q[0]+(q[0]<170?-6:6)}" cy="${q[1]-1}" r="9" fill="none" stroke="#c8321a" stroke-width="2.5"><animate attributeName="opacity" values="1;.2;1" dur="1.5s" repeatCount="indefinite"/></circle>`; }
  const fin = pos[mainIds[mainIds.length-1]];
  const finale = `<g transform="translate(${fin[0]},${fin[1]+38})"><path d="M0 -9 L8 -2 L0 9 L-8 -2Z" fill="#6ae0e8" stroke="#1a5a6a" stroke-width="1.4"/><path d="M-8 -2 H8 M0 -9 L-3 -2 L0 9 M0 -9 L3 -2 L0 9" stroke="#1a5a6a" stroke-width=".7" fill="none"/></g><text x="${fin[0]}" y="${fin[1]+58}" text-anchor="middle" font-size="11.5" font-style="italic" ${SERIF} fill="#6a1a0e" ${halo}>Сердце Эльдории</text>`;
  const compass = `<g transform="translate(300,30)"><circle r="17" fill="#f3e2b0" fill-opacity=".7" stroke="#4a3418" stroke-width="1"/><path d="M0 -15 L4 0 L0 15 L-4 0Z" fill="#a8322a" stroke="#4a3418" stroke-width=".8"/><path d="M-15 0 L0 -4 L15 0 L0 4Z" fill="#e8d29a" stroke="#4a3418" stroke-width=".8"/><text y="-19" text-anchor="middle" font-size="9" font-weight="bold" fill="#4a3418">С</text></g>`;
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${back}${decor}${road}${nodes}${labels}${finale}${compass}</svg>`;
  const cp = cur && pos[cur];
  setTimeout(()=>{ const sc = box.closest('.scrollIn'); if(sc) sc.scrollTop = cp ? Math.max(0, box.offsetTop + cp[1]*box.clientWidth/W - sc.clientHeight/2) : 0; }, 40);
}
function openMap(){ startScreenEl.classList.add('hidden'); renderMap(); mapScreen.classList.remove('hidden'); }
function closeMap(){ mapScreen.classList.add('hidden'); startScreenEl.classList.remove('hidden'); }
document.getElementById('mapBtn').addEventListener('click', openMap);
document.getElementById('mapBack').addEventListener('click', closeMap);

// ---------- PWA: установка и офлайн-режим (работает, когда игра открыта по https и рядом лежат sw.js и manifest) ----------
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstall = e; const b = document.getElementById('installBtn'); if(b && !isStandalone) b.classList.remove('hidden'); });
window.addEventListener('appinstalled', ()=>{ deferredInstall = null; document.getElementById('installBtn').classList.add('hidden'); });
document.getElementById('installBtn').addEventListener('click', ()=>{ if(!deferredInstall) return; deferredInstall.prompt(); deferredInstall = null; document.getElementById('installBtn').classList.add('hidden'); });
// ---------- плашка «Доступна новая версия» ----------
const updateBar = document.createElement('div');
updateBar.id = 'updateBar'; updateBar.className = 'hidden';
updateBar.innerHTML = '<span>🔄 Доступна новая версия игры</span><button id="updateNow" type="button">Обновить</button><button id="updateLater" type="button" title="Позже">✕</button>';
document.getElementById('gameWrap').appendChild(updateBar);
let swReloading = false, swWanted = false;
function showUpdateBar(worker){
  updateBar.classList.remove('hidden');
  document.getElementById('updateNow').onclick = ()=>{
    try{ if(gameState==='playing') saveGame(); }catch(e){}
    document.getElementById('updateNow').textContent = 'Обновляю…'; swWanted = true;
    if(worker) worker.postMessage('skipWaiting'); else location.reload();
  };
  document.getElementById('updateLater').onclick = ()=>updateBar.classList.add('hidden');
}
try{
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('sw.js').then(reg=>{
        const watch = w=>{ if(!w) return; w.addEventListener('statechange', ()=>{ if(w.state==='installed' && navigator.serviceWorker.controller) showUpdateBar(w); }); };
        if(reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg.waiting);
        reg.addEventListener('updatefound', ()=>watch(reg.installing));
        const check = ()=>{ try{ reg.update().catch(()=>{}); }catch(e){} };
        setInterval(check, 30*60*1000);
        document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) check(); });
      }).catch(()=>{});
    });
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{ if(!swWanted || swReloading) return; swReloading = true; location.reload(); });
  }
}catch(e){}
loadBtn.addEventListener('click', ()=>{ loadGame(latestSaveKey()); });
refreshSaveUI();
document.getElementById('restartBtn').addEventListener('click', newGameWithIntro);
document.getElementById('restartBtn2').addEventListener('click', newGameWithIntro);
resumeBtn.addEventListener('click', resumeGame);
menuBtn.addEventListener('click', exitToMenu);
window.addEventListener('keydown', e=>{
  if(e.code==='Escape' && !mapScreen.classList.contains('hidden')){ closeMap(); } else if(e.code==='Escape'){ if(gameState==='shop') closeShop(); else if(gameState==='hero') closeHero(); else if(gameState==='codex') closeCodex(); else exitToMenu(); }
});


// ---------- Оформление меню: вьющаяся лоза по краям (бесшовная лента, рисуется один раз) ----------
function makeVineStrip(mirror){
  const PW = 112, PH = 512, cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
  const g = cv.getContext('2d');
  if(mirror){ g.translate(PW,0); g.scale(-1,1); }
  g.lineCap = 'round'; g.lineJoin = 'round';
  const xs = (y,ph,A,cx)=> cx + A*Math.sin(y/PH*Math.PI*4 + ph);          // два полных витка на ленту
  const stem = (ph,A,cx,w,col,hi)=>{
    for(const [lw,c] of [[w+2.4,'#0e2008'],[w,col],[Math.max(1,w*0.35),hi]]){
      g.strokeStyle = c; g.lineWidth = lw; g.beginPath();
      for(let y=-20;y<=PH+20;y+=4){ const x = xs(y,ph,A,cx); if(y===-20) g.moveTo(x,y); else g.lineTo(x,y); }
      g.stroke();
    }
  };
  const leaf = (x,y,ang,len,col,col2)=>{
    g.save(); g.translate(x,y); g.rotate(ang);
    g.fillStyle = col; g.strokeStyle = '#0e2008'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(len*0.45,-len*0.42,len,0); g.quadraticCurveTo(len*0.45,len*0.42,0,0); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = col2; g.lineWidth = 1; g.beginPath(); g.moveTo(len*0.06,0); g.lineTo(len*0.82,0); g.stroke();
    g.restore();
  };
  const curl = (x,y,dir,r)=>{                                               // завиток-усик
    g.strokeStyle = '#2d5a24'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x,y);
    for(let a=0;a<=Math.PI*3.1;a+=0.2){ const rr = r*(1-a/(Math.PI*3.6)); g.lineTo(x+dir*(Math.sin(a)*rr+a*1.2*dir*dir), y-(1-Math.cos(a))*rr*0.9-a*0.4); }
    g.stroke();
  };
  const flower = (x,y,r,c)=>{
    g.fillStyle = c; g.strokeStyle = '#4a3410'; g.lineWidth = 1;
    for(let k=0;k<5;k++){ const a = k/5*6.283+0.3; g.beginPath(); g.arc(x+Math.cos(a)*r*0.8,y+Math.sin(a)*r*0.8,r*0.62,0,6.283); g.fill(); g.stroke(); }
    g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(x,y,r*0.55,0,6.283); g.fill(); g.stroke();
  };
  // фоновая тонкая лоза со сдвигом фазы, потом основная
  stem(Math.PI*0.9,13,50,2.6,'#2c5224','#4a8a38');
  const dec = (fn)=>{ for(const o of [-PH,0,PH]) fn(o); };                      // бесшовный повтор
  const items = [];
  for(let i=0;i<14;i++){ const y = (i+0.5)*PH/14; items.push({y, i}); }
  for(const it of items){
    dec(o=>{
      const y = it.y+o, x = xs(y,0,22,34), side = it.i%2 ? 1 : -1, dy = Math.cos(y/PH*Math.PI*4)*0.7;
      const ang = Math.atan2(dy,1)+ (side>0 ? 0.55 : -0.55) + (side>0?0:0);
      leaf(x,y,(side>0?0.5:-0.5)+(side>0?0:Math.PI)*0+ (side>0?0:Math.PI), 20+(it.i%3)*4, it.i%3===0?'#4f8f34':'#3d7a2c', '#a8d878');
    });
  }
  stem(0,22,34,4.2,'#2f6a26','#7ab85a');
  for(const it of items){
    dec(o=>{
      const y = it.y+o, x = xs(y,0,22,34);
      if(it.i%5===1) curl(x,y,1,14);
      if(it.i%5===3) curl(x,y,-1,12);
      if(it.i%7===2) flower(x+(it.i%2?9:-9), y+3, 5.2, '#e8c873');
      if(it.i%7===5){ g.fillStyle='#c0392b'; g.strokeStyle='#4a0e0a'; g.lineWidth=1; for(const [bx,by] of [[8,0],[13,5],[5,7]]){ g.beginPath(); g.arc(x+bx,y+by,2.8,0,6.283); g.fill(); g.stroke(); } }
    });
  }
  // верхний слой: несколько листьев поверх стебля
  for(const it of items) if(it.i%2===0) dec(o=>{ const y = it.y+o+PH/28, x = xs(y,0,22,34); leaf(x,y,(it.i%4===0?-1:1)*0.9+Math.PI/2*0, 14, '#5a9a3c', '#c8f0a0'); });
  return cv.toDataURL('image/png');
}
try{
  const root = document.documentElement.style;
  root.setProperty('--vineL','url('+makeVineStrip(false)+')');
  root.setProperty('--vineR','url('+makeVineStrip(true)+')');
}catch(err){}

requestAnimationFrame(loop);
