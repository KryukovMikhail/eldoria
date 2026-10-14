// ---------- Журнал, стрелка-указатель, быстрый перенос ----------
// Граф переходов между локациями: из doorsOf() видно, куда ведёт каждая дверь/спуск/выход и где она находится.
function ensureNewPlayerFields(){
  if(!player.visited) player.visited = {overworld:1};
  if(!player.track) player.track = 'main';
  if(!player.stories) player.stories = {};
  if(!player.mats) player.mats = {scrap:0, essence:0, crystal:0};
  player.mats = Object.assign({scrap:0, essence:0, crystal:0}, player.mats);
  if(!player.sb) player.sb = {};
  player.visited[currentLocId] = 1;
}
function doorsOf(id){
  const L = world[id], out = []; if(!L) return out;
  const c = (tx,ty)=>({x:(tx+0.5)*TILE, y:(ty+0.5)*TILE});
  if(L.type==='overworld'){
    for(const en of (L.entrances||[])){ if(en.hidden && !en.found) continue; out.push(Object.assign({to:en.dungeon}, c(en.tx,en.ty))); }
    for(const d of (L.doors||[])) out.push(Object.assign({to:d.to}, c(d.tx,d.ty)));
  } else {
    for(const d of (L.doors||[])) out.push(Object.assign({to:d.to}, c(d.tx,d.ty)));
    if(L.exit) out.push(Object.assign({to: L.backTo ? L.backTo.loc : (PREV_LOC[id] || 'overworld')}, c(L.exit.tx,L.exit.ty)));
    if(L.portal && L.portal.open && NEXT_LOC[id]) out.push(Object.assign({to:NEXT_LOC[id]}, c(L.portal.tx,L.portal.ty)));
  }
  return out;
}
// кратчайший путь по локациям: возвращает {path:[ids], first:дверь в текущей локации} или null
function routeInfo(targetId, fromId){
  fromId = fromId || currentLocId;
  if(fromId===targetId || !world[targetId]) return null;
  const prev = {[fromId]:null}, firstDoor = {}, q = [fromId];
  while(q.length){
    const id = q.shift();
    for(const d of doorsOf(id)){
      if(!world[d.to] || d.to in prev) continue;
      prev[d.to] = id; firstDoor[d.to] = id===fromId ? d : firstDoor[id];
      if(d.to===targetId){ const path = [targetId]; let p = prev[targetId]; while(p!==null){ path.unshift(p); p = prev[p]; } return {path, first:firstDoor[targetId]}; }
      q.push(d.to);
    }
  }
  return null;
}
function locLabel(id){ const L = world[id]; return L ? getLocName(L) : id; }
function routeText(targetId){
  if(currentLocId===targetId) return 'Вы уже здесь: '+locLabel(targetId)+'.';
  const r = routeInfo(targetId); if(!r) return 'Путь пока неизвестен.';
  return r.path.map(locLabel).join(' → ');
}
function merchantLoc(){
  let best = null, bd = 1e9;
  for(const id of Object.keys(world)){ if(!world[id].merchant) continue; const r = id===currentLocId ? {path:[id]} : routeInfo(id); if(r && r.path.length<bd){ bd = r.path.length; best = id; } }
  return best;
}
// куда идти по выбранному заданию: {loc, x, y, label} (x,y — только если это текущая локация и точка известна)
function trackSpec(){
  const tr = player.track || 'main';
  const main = ()=>{
    const st = storyStage();
    if(st>=LAIR_ORDER.length){
      const L = world.lair10; if(currentLocId==='lair10'){ const t = loc.items.find(i=>i.type==='treasure'); if(t) return {loc:'lair10', x:t.x+8, y:t.y+8, label:'Сердце'}; }
      return {loc:'lair10', label:'Сердце Эльдории'};
    }
    return lairSpec(LAIR_ORDER[st]);
  };
  if(tr==='quest' && player.quest){
    const q = player.quest, d = QUESTS[q.id];
    if(q.done){ const m = merchantLoc(); if(m){ if(m===currentLocId && loc.merchant) return {loc:m, x:loc.merchant.x+loc.merchant.w/2, y:loc.merchant.y+loc.merchant.h/2, label:'Торговец'}; return {loc:m, label:'Торговец'}; } }
    else if(d && BOSS_TYPES.includes(d.type)){ const lid = Object.keys(LAIR).find(k=>LAIR[k].boss===d.type); if(lid) return lairSpec(lid); }
    return main();
  }
  if(tr.startsWith('story:')){ const s = storyTarget(tr.slice(6)); if(s) return s; }
  return main();
}
function lairSpec(lid){
  if(currentLocId===lid){
    const b = loc.boss || loc.enemies.find(e=>BOSS_TYPES.includes(e.type) && e.hp>0);
    if(b && b.hp>0) return {loc:lid, x:b.x+b.w/2, y:b.y+b.h/2, label:'Босс'};
    if(loc.portal) return {loc:lid, x:(loc.portal.tx+0.5)*TILE, y:(loc.portal.ty+0.5)*TILE, label:'Спуск'};
  }
  return {loc:lid, label:LAIR[lid].title};
}
// точка на экране-карте, к которой ведёт стрелка (в текущей локации) или null
function trackPoint(){
  const s = trackSpec(); if(!s) return null;
  if(s.loc===currentLocId && s.x!==undefined) return {x:s.x, y:s.y, label:s.label};
  if(s.loc===currentLocId){ return null; }
  const r = routeInfo(s.loc); if(!r) return null;
  return {x:r.first.x, y:r.first.y, label:'→ '+locLabel(r.first.to)};
}
function drawTrackArrow(camX, camY){
  if(gameState!=='playing') return;
  const p = trackPoint(); if(!p) return;
  const px = p.x-camX, py = p.y-camY, W = canvas.width, H = canvas.height, m = 30, t = Date.now()/1000;
  const inside = px>m && py>m && px<W-m && py<H-m;
  ctx.save(); ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  if(inside){
    const bob = Math.sin(t*4)*3;
    ctx.fillStyle = '#ffd34a'; ctx.strokeStyle = '#3a2a06'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px,py-18+bob); ctx.lineTo(px-7,py-30+bob); ctx.lineTo(px+7,py-30+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(p.label){ ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; ctx.strokeText(p.label,px,py-34+bob); ctx.fillStyle = '#ffe9a0'; ctx.fillText(p.label,px,py-34+bob); }
  } else {
    const cx = W/2, cy = H/2, dx = px-cx, dy = py-cy;
    const k = Math.min((cx-m-UI.r)/Math.max(Math.abs(dx),1e-6), (cy-m-UI.b)/Math.max(Math.abs(dy),1e-6));
    const ax = cx+dx*k, ay = cy+dy*k, pulse = 1+Math.sin(t*5)*0.12;
    ctx.translate(ax,ay); ctx.rotate(Math.atan2(dy,dx)); ctx.scale(pulse,pulse);
    ctx.fillStyle = '#ffd34a'; ctx.strokeStyle = '#3a2a06'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(-8,-10); ctx.lineTo(-3,0); ctx.lineTo(-8,10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(-Math.atan2(dy,dx)); ctx.scale(1/pulse,1/pulse);
    const dist = Math.round(Math.hypot(dx,dy)/TILE);
    const txt = (p.label ? p.label+' · ' : '')+dist+' кл.';
    const tw = ctx.measureText(txt).width, lx = Math.max(tw/2+6, Math.min(W-tw/2-6, ax))-ax;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; ctx.strokeText(txt, lx, ay<cy ? 26 : -16); ctx.fillStyle = '#ffe9a0'; ctx.fillText(txt, lx, ay<cy ? 26 : -16);
  }
  ctx.restore();
}

// ---------- Быстрый перенос ----------
function travelList(){
  const ids = ['overworld','town'].concat(CHAIN).filter(id=>world[id] && player.visited && player.visited[id]);
  return ids;
}
function travelCost(id){ return id==='overworld' ? 25 : id==='town' ? 20 : 20+10*Math.max(0,CHAIN.indexOf(id)); }
function travelBlock(){
  if(LAIR[currentLocId] && loc.boss && loc.boss.hp>0) return 'Пока жив страж логова, уйти нельзя.';
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  if(!loc.safe && loc.enemies.some(e=>e.hp>0 && Math.hypot(e.x+e.w/2-pcx, e.y+e.h/2-pcy)<240)) return 'Враги слишком близко — отойдите подальше.';
  if(currentLocId.startsWith('house')) return 'Выйдите из дома на улицу.';
  return null;
}
function doTravel(id){
  const why = travelBlock(); if(why){ renderJournal(why); SFX.play('deny'); return; }
  const cost = travelCost(id); if(player.gold<cost){ renderJournal('Не хватает золота: нужно '+cost+'.'); SFX.play('deny'); return; }
  player.gold -= cost; closeJournal(true);
  const L = world[id]; goTo(id, L.spawn.x, L.spawn.y, 'Вы перенеслись: '+locLabel(id)+' (−'+cost+' ◆)');
  burst(player.x+player.w/2, player.y+player.h/2, 24, {colors:['#c9a8ff','#ffffff','#7ad4ff'], sp:110, up:40, g:-30, life:700, size:3});
  ensureNewPlayerFields(); saveGame();
}

// ---------- Экран журнала ----------
const questScreen = document.getElementById('questScreen'), questList = document.getElementById('questList'), questTabsEl = document.getElementById('questTabs'), questBtn = document.getElementById('questBtn');
let journalTab = 'journal';
function jRow(title, desc, buttons, color){
  const row = document.createElement('div'); row.className = 'shopItem';
  const info = document.createElement('div'); info.className = 'shopInfo';
  const nm = document.createElement('b'); nm.textContent = title; if(color) nm.style.color = color;
  const ds = document.createElement('span'); ds.textContent = desc; info.append(nm, ds);
  const box = document.createElement('div'); box.className = 'shopBtns'; (buttons||[]).forEach(b=>box.appendChild(b));
  row.append(info, box); questList.appendChild(row);
}
function jHead(text){ const h = document.createElement('div'); h.style.cssText = 'width:100%;text-align:left;color:#e0c23a;font-weight:bold;font-size:13px;margin-top:6px'; h.textContent = text; questList.appendChild(h); }
function trackBtn(key, label){
  const on = (player.track||'main')===key;
  return shopButton(on ? '📌 Отслеживается' : '📌 Следить', ()=>{ player.track = key; renderJournal('Стрелка на экране указывает: '+label+'.'); }, on);
}
function renderJournal(msg){
  document.getElementById('questMsg').textContent = msg || '';
  ensureNewPlayerFields();
  document.getElementById('questInfo').textContent = journalTab==='travel' ? 'Золото: '+player.gold+' ◆' : 'Убито стражей: '+storyStage()+' из '+LAIR_ORDER.length;
  questTabsEl.innerHTML = '';
  [['journal','📜 Задания'],['travel','🧭 Перенос']].forEach(([id,label])=>{
    const t = document.createElement('button'); t.className = 'tabBtn'+(journalTab===id?' active':''); t.textContent = label;
    t.addEventListener('click', ()=>{ journalTab = id; renderJournal(''); }); questTabsEl.appendChild(t);
  });
  questList.innerHTML = '';
  if(journalTab==='travel'){
    const why = travelBlock();
    if(why) jRow('Сейчас перенос недоступен', why, []);
    const ids = travelList();
    for(const id of ids){
      const here = id===currentLocId, cost = travelCost(id);
      jRow(locLabel(id), here ? 'Вы здесь.' : 'Появитесь у входа. Стоимость — '+cost+' ◆.', [shopButton(here ? 'Вы здесь' : 'Перенестись — '+cost+' ◆', ()=>doTravel(id), here || !!why || player.gold<cost)]);
    }
    if(ids.length<=2) jRow('Новые места', 'Места появляются в списке, когда вы там побываете.', []);
    return;
  }
  const st = storyStage();
  jHead('Главная цель');
  jRow(goalText().replace('Цель: ',''), 'Путь: '+routeText(trackMainLoc()), [trackBtn('main','главная цель')], '#ffd34a');
  if(player.quest && QUESTS[player.quest.id]){
    const q = player.quest, d = QUESTS[q.id];
    jHead('Поручение торговца');
    jRow(d.name, d.desc+(q.done ? ' Выполнено — вернитесь к торговцу за наградой.' : ' Прогресс: '+q.progress+'/'+d.target+'.'), [trackBtn('quest','задание «'+d.name+'»')], q.done ? '#7fe07f' : '#e0c96a');
  }
  const act = Object.keys(STORIES).filter(id=>storyState(id)==='active'), avail = Object.keys(STORIES).filter(id=>storyState(id)==='avail');
  if(act.length){ jHead('Истории'); for(const id of act) jRow(STORIES[id].title, storyJournalText(id), [trackBtn('story:'+id, '«'+STORIES[id].title+'»')], '#9ad0ff'); }
  if(avail.length){ jHead('Слухи'); for(const id of avail) jRow('❔ '+STORIES[id].rumor, 'Поговорите с жителем в городе: '+locLabel('town')+'.', []); }
  const done = Object.keys(STORIES).filter(id=>storyState(id)==='done'), qd = Object.keys(player.questsDone||{}).filter(k=>QUESTS[k]);
  if(done.length || qd.length || st>0){
    jHead('Выполнено');
    for(let i=0;i<st && i<LAIR_ORDER.length;i++) jRow('✔ '+(BOSS_NAME_BY_STAGE[i]||'Страж')+' побеждён', LAIR[LAIR_ORDER[i]].title, [], '#7fe07f');
    for(const id of done) jRow('✔ '+STORIES[id].title, STORIES[id].doneText, [], '#7fe07f');
    for(const k of qd) jRow('✔ '+QUESTS[k].name, 'Поручение торговца выполнено.', [], '#7fe07f');
  }
}
function trackMainLoc(){ const st = storyStage(); return st>=LAIR_ORDER.length ? 'lair10' : LAIR_ORDER[st]; }
function openJournal(tab){
  if(gameState!=='playing') return;
  for(const k in keys) keys[k] = false;
  journalTab = tab || 'journal'; gameState = 'journal'; renderJournal(''); questScreen.classList.remove('hidden');
}
function closeJournal(silent){
  questScreen.classList.add('hidden'); if(gameState==='journal') gameState = 'playing'; for(const k in keys) keys[k] = false; if(!silent) saveGame();
}
document.getElementById('questClose').addEventListener('click', ()=>closeJournal());
questBtn.addEventListener('click', ()=>{ if(gameState==='playing') openJournal(); else if(gameState==='journal') closeJournal(); });
window.addEventListener('keydown', e=>{
  if(e.code==='KeyJ'){ if(gameState==='playing') openJournal('journal'); else if(gameState==='journal') closeJournal(); }
  else if(e.code==='KeyT'){ if(gameState==='playing') openJournal('travel'); else if(gameState==='journal') closeJournal(); }
});
