// ======================= Отряд наёмников =======================
// Кроме постоянного напарника в трактире можно нанять отряд: щитоносца, копейщицу, целительницу, мага и арбалетчика.
// Размер отряда растёт с уровнем героя. Наёмники смертны: павший боец уходит из отряда навсегда.
const MERC = {
  shield:  {name:'Щитоносец',    price:220, col:'#6a7a8c', hp:[120,20], dmg:[4,1.6], speed:92,  range:22,  cd:900,  size:24, desc:'Принимает удары на себя: пока он рядом, враги бьют героя на 15% слабее.'},
  spear:   {name:'Копейщица',    price:200, col:'#a8743a', hp:[70,12],  dmg:[7,2.8], speed:100, range:46,  cd:800,  size:22, desc:'Бьёт копьём на полторы клетки, достаёт врага из-за спины героя.'},
  healer:  {name:'Целительница', price:260, col:'#ece4f4', hp:[50,8],   dmg:[0,0],   speed:100, range:0,   cd:2500, size:20, desc:'Не сражается: каждые 2,5 с лечит героя, напарника и отряд.'},
  mage:    {name:'Боевой маг',   price:320, col:'#5a4ab0', hp:[45,8],   dmg:[8,3.2], speed:96,  range:200, cd:1700, size:20, desc:'Огненный шар взрывается и ранит всех врагов вокруг цели.'},
  crossbow:{name:'Арбалетчик',   price:240, col:'#56663a', hp:[55,10],  dmg:[9,3.0], speed:98,  range:230, cd:1700, size:20, desc:'Стрелок с мощными болтами: держится позади и бьёт издалека.'}
};
const MERC_NAMES = { shield:['Бронк','Торвальд','Гуннар'], spear:['Рольфа','Ингрид','Вейла'], healer:['Лиана','Мирта','Эйлин'], mage:['Аркан','Зорвен','Мелькор'], crossbow:['Ивар','Дарен','Кестрел'] };
const mercObjs = new Map();
function mercCap(){ return Math.min(4, 1+Math.floor(player.level/4)); }
function mercStats(type){
  const M = MERC[type], L = player.level;
  return {name:M.name, col:M.col, maxHp:Math.round(M.hp[0]+M.hp[1]*L), dmg:Math.round(M.dmg[0]+M.dmg[1]*L), speed:M.speed, range:M.range, cd:M.cd, size:M.size};
}
function ensureMercs(){ if(!Array.isArray(player.mercs)) player.mercs = []; return player.mercs; }
function partyAlive(){ return ensureMercs().filter(m=>m.hp>0); }
function hireMerc(type){
  const M = MERC[type], list = ensureMercs();
  if(!M || player.gold<M.price || list.length>=mercCap()) return false;
  player.gold -= M.price;
  const used = new Set(list.map(m=>m.name)), names = MERC_NAMES[type].filter(n=>!used.has(n));
  const m = {id:'m'+Date.now().toString(36)+rnd(100,999), type, name:(names[0]||MERC_NAMES[type][0]), hp:mercStats(type).maxHp};
  list.push(m); bump('mercs'); SFX.play('buy');
  addNote('⚔ '+m.name+' ('+M.name.toLowerCase()+') вступает в отряд', '#7fe07f'); saveGame();
  return m;
}
function dismissMerc(id){
  const list = ensureMercs(), i = list.findIndex(m=>m.id===id); if(i<0) return;
  const m = list[i]; list.splice(i,1); mercObjs.delete(id);
  addNote(m.name+' покидает отряд', '#c8c8c8'); saveGame();
}
// щитоносец рядом с героем гасит часть урона
function partyGuardMul(){
  for(const m of ensureMercs()){
    if(m.type!=='shield' || m.hp<=0) continue;
    const o = mercObjs.get(m.id); if(o && Math.hypot(o.x-player.x, o.y-player.y)<120) return 0.85;
  }
  return 1;
}
function mercSpawnObj(m, S){
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  const p = freeSpotAround(pcx, pcy, S.size, S.size, 34, 90, 30) || {x:player.x, y:player.y};
  const o = {x:p.x, y:p.y, w:S.size, h:S.size, cd:600+rnd(0,500), walkT:0, face:'right', hit:0, tracer:null, st:0, heal:0, slot:ensureMercs().indexOf(m)};
  mercObjs.set(m.id, o); return o;
}
function mercTarget(o, S){
  let best = null, bd = 1e9; const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(const e of loc.enemies){
    if(e.hp<=0) continue;
    const ex = e.x+e.w/2, ey = e.y+e.h/2;
    if(Math.hypot(ex-pcx,ey-pcy)>270) continue;
    const d = Math.hypot(ex-(o.x+o.w/2), ey-(o.y+o.h/2));
    if(d<bd){ bd = d; best = e; }
  }
  return best;
}
function mercDie(m, o){
  const ox = o ? o.x+o.w/2 : player.x, oy = o ? o.y+o.h/2 : player.y;
  burst(ox, oy, 16, {colors:['#cccccc','#999999','#d02a2a'], sp:90, up:30, g:200, life:560, size:2.6});
  addNote('💔 '+m.name+' ('+MERC[m.type].name.toLowerCase()+') пал(а) в бою и покидает отряд', '#e07f7f'); SFX.play('death');
  const list = ensureMercs(), i = list.indexOf(m); if(i>=0) list.splice(i,1); mercObjs.delete(m.id); bump('mercLost'); saveGame();
}
function mercHealTick(o, S){
  if(o.cd>0) return;
  const hurt = player.hp<player.maxHp || (player.comp && player.comp.hp<compStats(player.comp.type).maxHp && !(player.comp.down>0)) || ensureMercs().some(q=>q.hp>0 && q.hp<mercStats(q.type).maxHp);
  if(!hurt){ o.cd = 400; return; }
  o.cd = S.cd; o.heal = 600;
  const amt = Math.max(5, Math.round(player.maxHp*0.05 + player.level));
  if(player.hp<player.maxHp && gameState==='playing'){ player.hp = Math.min(player.maxHp, player.hp+amt); fxHealAt(player.x+player.w/2, player.y+player.h/2); }
  if(player.comp && !(player.comp.down>0)){ const cs = compStats(player.comp.type); player.comp.hp = Math.min(cs.maxHp, player.comp.hp+cs.maxHp*0.1); }
  for(const q of ensureMercs()){ if(q.hp<=0) continue; const qs = mercStats(q.type); q.hp = Math.min(qs.maxHp, q.hp+qs.maxHp*0.1); const qo = mercObjs.get(q.id); if(qo && q!==o.m) fxHealAt(qo.x+qo.w/2, qo.y+qo.h/2); }
  SFX.play('drink');
}
function fxHealAt(x, y){ burst(x, y, 6, {colors:['#7fe07f','#c8ffc8','#ffffff'], sp:30, up:40, g:-40, life:600, size:2}); }
function mercAttack(m, o, S, tg){
  const ocx = o.x+o.w/2, ocy = o.y+o.h/2, gx = tg.x+tg.w/2, gy = tg.y+tg.h/2, d = Math.hypot(gx-ocx, gy-ocy);
  if(o.cd>0) return;
  if(m.type==='mage' || m.type==='crossbow'){
    if(d<S.range && hasLOS(ocx,ocy,gx,gy)){
      o.cd = S.cd; o.tracer = {x1:ocx, y1:ocy, x2:gx, y2:gy, t:m.type==='mage' ? 220 : 140, k:m.type};
      if(m.type==='mage'){
        SFX.play('cast'); burst(gx, gy, 14, {colors:['#ff9a2a','#ffd34a','#c88aff'], sp:110, up:30, g:60, life:420, size:2.6});
        for(const e of loc.enemies){ if(e.hp<=0) continue; if(Math.hypot(e.x+e.w/2-gx, e.y+e.h/2-gy) < 46+e.w/2){ damageEnemy(e, S.dmg*(e===tg ? 1 : 0.6)); if(e.hp<=0) killEnemy(e); } }
      } else { SFX.play('bow'); damageEnemy(tg, S.dmg); burst(gx, gy, 3, {colors:['#dfe4ea','#ffffff'], sp:60, up:10, g:100, life:240, size:1.8}); if(tg.hp<=0) killEnemy(tg); }
    }
  } else if(d < S.range+tg.w/2+o.w/2-4){
    o.cd = S.cd; o.tracer = m.type==='spear' ? {x1:ocx, y1:ocy, x2:gx, y2:gy, t:120, k:'spear'} : null;
    damageEnemy(tg, S.dmg); SFX.play(m.type==='shield' ? 'clang' : 'hit');
    burst(gx, gy, 4, {colors:['#fff6c8','#ffd34a','#ffffff'], sp:80, up:20, g:200, life:240, size:1.8}); if(tg.hp<=0) killEnemy(tg);
  }
}
function mercsTick(dt){
  const list = ensureMercs(); if(!list.length){ mercObjs.clear(); return; }
  if(loc.safe && loc.biome==='house') { /* в домах отряд ждёт снаружи */ return; }
  const ms = dt*1000, pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(const m of list.slice()){
    const S = mercStats(m.type); if(m.hp>S.maxHp) m.hp = S.maxHp;
    const o = mercObjs.get(m.id) || mercSpawnObj(m, S); o.m = m;
    o.cd -= ms; o.hit = Math.max(0, o.hit-ms); o.heal = Math.max(0, o.heal-ms);
    if(o.tracer){ o.tracer.t -= ms; if(o.tracer.t<=0) o.tracer = null; }
    m.hp = Math.min(S.maxHp, m.hp+dt*S.maxHp*0.004);
    let dead = false;
    for(const e of loc.enemies){
      if(e.hp<=0 || e.dmg<=0) continue;
      const k = 'mCd_'+m.id; e[k] = Math.max(0,(e[k]||0)-ms);
      if(e[k]<=0 && overlap(e, o)){
        e[k] = 900; m.hp -= e.dmg*(m.type==='shield' ? 0.4 : 0.6); o.hit = 200;
        burst(o.x+o.w/2, o.y+o.h/2, 4, {colors:['#d02a2a','#ffffff'], sp:60, up:20, g:100, life:300, size:2});
        if(m.hp<=0){ mercDie(m, o); dead = true; break; }
      }
    }
    if(dead) continue;
    if(m.type==='healer') mercHealTick(o, S);
    const ocx = o.x+o.w/2, ocy = o.y+o.h/2, dp = Math.hypot(pcx-ocx, pcy-ocy);
    const tg = m.type==='healer' ? null : mercTarget(o, S);
    // место в строю: бойцы вокруг героя, у каждого своя сторона
    const ang = (o.slot%4)*Math.PI/2+0.8, fx = pcx+Math.cos(ang)*46, fy = pcy+Math.sin(ang)*40;
    let tx = fx, ty = fy, stopD = 18, spd = S.speed, flee = false;
    if(tg){
      const gx = tg.x+tg.w/2, gy = tg.y+tg.h/2, d = Math.hypot(gx-ocx, gy-ocy);
      tx = gx; ty = gy;
      if(m.type==='mage' || m.type==='crossbow'){ stopD = S.range*0.7; if(d<90) flee = true; }
      else stopD = m.type==='spear' ? S.range*0.8 : 6;
      mercAttack(m, o, S, tg);
    } else if(dp>260) spd *= 1.35;
    if(dp>480){ const p = freeSpotAround(pcx, pcy, o.w, o.h, 34, 90, 30); if(p){ o.x = p.x; o.y = p.y; } continue; }
    const dx = tx-ocx, dy = ty-ocy, d = Math.hypot(dx,dy)||1;
    if(flee){ tryMove(o, -dx/d*spd*dt, -dy/d*spd*dt, loc); o.walkT += dt*9; }
    else if(d>stopD){
      const x0 = o.x, y0 = o.y; let mx = dx/d, my = dy/d;
      if(!hasLOS(ocx,ocy,tx,ty)){ const fd = loc===flow.loc && flow.dist ? flowDir(o) : null; if(fd){ mx = fd[0]; my = fd[1]; } }
      tryMove(o, mx*spd*dt, my*spd*dt, loc);
      if(Math.abs(o.x-x0)+Math.abs(o.y-y0) < spd*dt*0.2){ o.st += dt; if(o.st>0.5){ tryMove(o, -my*spd*dt, mx*spd*dt, loc); } if(o.st>1.2){ o.st = 0; const q = freeSpotAround(pcx, pcy, o.w, o.h, 34, 90, 30); if(q){ o.x = q.x; o.y = q.y; } } } else o.st = 0;
      o.walkT += dt*9;
    }
    if(Math.abs(dx)>3) o.face = dx<0 ? 'left' : 'right';
  }
}
function drawMercs(camX, camY){
  for(const m of ensureMercs()){
    const o = mercObjs.get(m.id); if(!o || m.hp<=0) continue;
    const S = mercStats(m.type), x = o.x-camX+o.w/2, y = o.y-camY+o.h/2;
    if(o.tracer){
      const t = o.tracer;
      if(t.k==='mage'){ const p = 1-t.t/220, qx = t.x1+(t.x2-t.x1)*p-camX, qy = t.y1+(t.y2-t.y1)*p-camY; ctx.fillStyle = 'rgba(255,160,40,0.9)'; circ(qx,qy,5); ctx.fill(); ctx.fillStyle = '#fff3b0'; circ(qx,qy,2.4); ctx.fill(); }
      else { ctx.strokeStyle = t.k==='spear' ? 'rgba(230,230,230,0.8)' : 'rgba(220,226,234,0.9)'; ctx.lineWidth = t.k==='spear' ? 2.4 : 1.6; ctx.beginPath(); ctx.moveTo(t.x1-camX, t.y1-camY); ctx.lineTo(t.x2-camX, t.y2-camY); ctx.stroke(); }
    }
    if(x<-40||y<-40||x>canvas.width+40||y>canvas.height+40) continue;
    const sw = Math.sin(o.walkT)*2, fl = o.face==='left' ? -1 : 1;
    ctx.save(); ctx.translate(x, y+6); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(0,5,9,3); ctx.fill();
    if(o.heal>0){ ctx.fillStyle = 'rgba(127,224,127,'+(0.3*o.heal/600)+')'; circ(0,-10,22); ctx.fill(); }
    if(o.hit>0) ctx.globalAlpha = 0.65;
    const robe = m.type==='healer' || m.type==='mage';
    ctx.fillStyle = '#3a2c20'; if(!robe){ ctx.fillRect(-4,-4+sw*0.3,3,5); ctx.fillRect(1,-4-sw*0.3,3,5); }
    ctx.fillStyle = S.col;
    if(robe){ ctx.beginPath(); ctx.moveTo(-7,1); ctx.lineTo(-4.5,-14); ctx.lineTo(4.5,-14); ctx.lineTo(7,1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { rrect(-5.5,-14,11,12,3); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#e0b890'; circ(0,-19,5); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.scale(fl,1);
    if(m.type==='shield'){
      ctx.fillStyle = '#9aa4b4'; ctx.beginPath(); ctx.arc(0,-20,5.4,Math.PI,0); ctx.fill();
      ctx.fillStyle = '#7a3a2a'; ctx.strokeStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(4,-16); ctx.lineTo(12,-16); ctx.lineTo(12,-6); ctx.quadraticCurveTo(8,0,8,0); ctx.quadraticCurveTo(4,-4,4,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#e0c060'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(8,-15); ctx.lineTo(8,-3); ctx.moveTo(5,-11); ctx.lineTo(11,-11); ctx.stroke();
    } else if(m.type==='spear'){
      ctx.fillStyle = '#c8743a'; ctx.beginPath(); ctx.arc(0,-21,5.2,Math.PI*0.9,Math.PI*2.1); ctx.fill();
      ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(6,-2); ctx.lineTo(9,-30); ctx.stroke();
      ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(9,-36); ctx.lineTo(11,-29); ctx.lineTo(7,-29); ctx.closePath(); ctx.fill();
    } else if(m.type==='healer'){
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0,-20,5.8,Math.PI,0); ctx.lineTo(5,-15); ctx.lineTo(-5,-15); ctx.fill();
      ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(7,0); ctx.lineTo(7,-24); ctx.stroke();
      ctx.fillStyle = 'rgba(127,255,140,'+(0.6+0.3*Math.sin(Date.now()/250))+')'; circ(7,-26,3); ctx.fill();
      ctx.fillStyle = '#4ab04a'; ctx.fillRect(-1.2,-11,2.4,6); ctx.fillRect(-3,-9.2,6,2.4);
    } else if(m.type==='mage'){
      ctx.fillStyle = '#3a2a8a'; ctx.beginPath(); ctx.moveTo(-6.5,-20); ctx.lineTo(6.5,-20); ctx.lineTo(2,-33); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd34a'; circ(1.5,-26,1); ctx.fill();
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(7,0); ctx.lineTo(7,-22); ctx.stroke();
      ctx.fillStyle = 'rgba(255,140,40,'+(0.7+0.3*Math.sin(Date.now()/180))+')'; circ(7,-24,3.2); ctx.fill();
    } else {
      ctx.fillStyle = '#3a4a22'; ctx.beginPath(); ctx.arc(0,-20,5.6,Math.PI,0); ctx.lineTo(5,-17); ctx.lineTo(-5,-17); ctx.fill();
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4,-10); ctx.lineTo(13,-10); ctx.stroke();
      ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(11,-15); ctx.quadraticCurveTo(14,-10,11,-5); ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
    if(m.hp<S.maxHp-1){ ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-11,-30,22,3); ctx.fillStyle = '#6ad06a'; ctx.fillRect(-11,-30,22*Math.max(0,m.hp/S.maxHp),3); }
    ctx.restore();
  }
}
function renderMercSection(){
  const list = ensureMercs(), here = currentLocId==='house1', cap = mercCap();
  jHead('Отряд наёмников — '+list.length+' из '+cap+' (мест больше с уровнем героя: +1 каждые 4 уровня)');
  if(!list.length) jRow('В отряде пока никого', 'Наёмники сражаются рядом с вами и растут вместе с героем, но смертны: павший боец уходит навсегда.', []);
  for(const m of list){
    const S = mercStats(m.type);
    jRow(m.name+' — '+MERC[m.type].name.toLowerCase(), 'Здоровье '+Math.round(m.hp)+'/'+S.maxHp+(S.dmg ? ', урон '+S.dmg : '')+'. '+MERC[m.type].desc,
      [shopButton('Распустить', ()=>{ dismissMerc(m.id); renderJournal('Боец покинул отряд.'); })], '#7fe07f');
  }
  jHead(here ? 'Нанять бойца в отряд' : 'Найм отряда — у трактирщика Бруно в трактире «Дремлющий Грифон»');
  for(const k of Object.keys(MERC)){
    const M = MERC[k], S = mercStats(k), full = list.length>=cap;
    jRow(M.name+' — '+M.price+' ◆', M.desc+' Здоровье '+S.maxHp+(S.dmg ? ', урон '+S.dmg : '')+'.'+(full ? ' Отряд полон.' : ''),
      [shopButton(here ? 'Нанять — '+M.price+' ◆' : 'В трактире', ()=>{ if(hireMerc(k)) renderJournal('Боец вступил в отряд.'); else renderJournal('Не получилось: не хватает золота или отряд полон.'); }, !here || full || player.gold<M.price)]);
  }
}
