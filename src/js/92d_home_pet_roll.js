// ======================= Дом и сундук, питомцы, новое оружие, испытания дня, перекат и комбо =======================
const REC_KEY = 'eldoria_records', HOME_PRICE = 600, STASH_MAX = 30;
let rollLatch = false, tameLatch = false, petObj = null, stashLock = false, stashOpen = false, comboVis = 0, tameTarget = null;

// ---------- маленькое окно выбора ----------
const choiceScreen = document.createElement('div');
choiceScreen.id = 'choiceScreen'; choiceScreen.className = 'overlay hidden';
document.getElementById('gameWrap').appendChild(choiceScreen);
let choicePrev = 'playing';
function choiceBox(title, text, opts){
  choicePrev = gameState; for(const k in keys) keys[k] = false; gameState = 'dialog';
  choiceScreen.innerHTML = ''; const h = document.createElement('h2'); h.textContent = title; choiceScreen.appendChild(h);
  const p = document.createElement('div'); p.style.cssText = 'max-width:420px;text-align:center;font-size:14px;line-height:1.45;margin:6px 14px 10px'; p.textContent = text; choiceScreen.appendChild(p);
  for(const [label, fn, off] of opts){
    const b = document.createElement('button'); b.className = 'startBtn'; b.textContent = label; if(off) b.disabled = true;
    b.addEventListener('click', ()=>{ closeChoice(); if(fn) fn(); }); choiceScreen.appendChild(b);
  }
  choiceScreen.classList.remove('hidden');
}
function closeChoice(){ choiceScreen.classList.add('hidden'); if(gameState==='dialog') gameState = choicePrev==='dialog' ? 'playing' : choicePrev; }

// ---------- дом ----------
function homeGate(dr){
  if(dr.to!=='home' || player.home) return false;
  choiceBox('Дом в Лиссарене', 'Просторный домик с кроватью и сундуком для вещей. Цена — '+HOME_PRICE+' ◆. У вас: '+player.gold+' ◆.', [
    ['Купить за '+HOME_PRICE+' ◆', ()=>{ if(player.gold>=HOME_PRICE){ player.gold -= HOME_PRICE; player.home = true; SFX.play('buy'); addNote('🏠 Дом куплен! Дверь теперь открыта', '#7fe07f'); saveGame(); achCheck(); } }, player.gold<HOME_PRICE],
    ['Не сейчас', null]
  ]);
  return true;
}
function stashEnsure(){ if(!player.stash) player.stash = []; }
function openStash(){
  stashEnsure(); stashOpen = true;
  choicePrev = 'playing'; for(const k in keys) keys[k] = false; gameState = 'dialog';
  choiceScreen.innerHTML = ''; const h = document.createElement('h2'); h.textContent = '📦 Сундук ('+player.stash.length+'/'+STASH_MAX+')'; choiceScreen.appendChild(h);
  const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:5px;width:min(520px,94%);max-height:62%;overflow:auto;font-size:12px';
  const row = (g, label, fn, off)=>{
    const d = document.createElement('div'); d.className = 'shopItem'; const i = document.createElement('div'); i.className = 'shopInfo';
    const b = document.createElement('b'); b.textContent = g.name+' ('+RAR[g.rar].n.toLowerCase()+')'; b.style.color = RAR[g.rar].c; const s = document.createElement('span'); s.textContent = gearLines(g); i.append(b, s);
    const bx = document.createElement('div'); bx.className = 'shopBtns'; bx.appendChild(shopButton(label, fn, off)); d.append(i, bx); wrap.appendChild(d);
  };
  const hd = t=>{ const x = document.createElement('div'); x.style.cssText = 'color:#e0c23a;font-weight:bold;margin-top:4px'; x.textContent = t; wrap.appendChild(x); };
  hd('В рюкзаке ('+player.bag.length+'/'+BAG_MAX+')');
  if(!player.bag.length){ const e = document.createElement('div'); e.textContent = 'Пусто.'; wrap.appendChild(e); }
  player.bag.forEach((g,idx)=>row(g, 'В сундук', ()=>{ if(player.stash.length>=STASH_MAX) return; player.bag.splice(idx,1); player.stash.push(g); SFX.play('pickup'); saveGame(); openStash(); }, player.stash.length>=STASH_MAX));
  hd('В сундуке');
  if(!player.stash.length){ const e = document.createElement('div'); e.textContent = 'Пусто.'; wrap.appendChild(e); }
  player.stash.forEach((g,idx)=>row(g, 'Забрать', ()=>{ if(player.bag.length>=BAG_MAX) return; player.stash.splice(idx,1); player.bag.push(g); SFX.play('pickup'); saveGame(); openStash(); }, player.bag.length>=BAG_MAX));
  choiceScreen.appendChild(wrap);
  const c = document.createElement('button'); c.className = 'startBtn'; c.textContent = 'Закрыть'; c.addEventListener('click', ()=>{ stashOpen = false; closeChoice(); }); choiceScreen.appendChild(c);
  choiceScreen.classList.remove('hidden');
}
function homeTick(){
  if(currentLocId!=='home' || !loc.chest || gameState!=='playing') { if(currentLocId!=='home') stashLock = false; return; }
  const d = Math.hypot(player.x+player.w/2-(loc.chest.tx+0.5)*TILE, player.y+player.h/2-(loc.chest.ty+0.5)*TILE);
  if(d>110) stashLock = false;
  else if(d<58 && !stashLock){ stashLock = true; openStash(); }
}
function ensureHomeWorld(wd){
  const T = wd.town; if(!T) return;
  if(!wd.home) wd.home = generateHouse('home');
  if(!T.doors.some(d=>d.to==='home')){
    const h = T.houses.find(q=>q.x===14 && q.y===4 && !q.to);
    if(h){ h.to = 'home'; h.sign = 'home'; h.kind = 'home'; T.grid[h.y+3][h.x+3] = 'D'; T.doors.push({tx:h.x+3, ty:h.y+3, to:'home', msg:'Вы входите в свой дом'}); }
  }
  const d = T.doors.find(q=>q.to==='home');
  if(d) wd.home.backTo = {loc:'town', x:d.tx*TILE+5, y:(d.ty+1)*TILE+5, msg:'Вы выходите на улицу'};
}

// ---------- перекат и серия ударов ----------
function rollMove(dt, mx, my){
  player.rollCd = Math.max(0,(player.rollCd||0)-dt*1000);
  player.counterT = Math.max(0,(player.counterT||0)-dt*1000);
  player.comboT = Math.max(0,(player.comboT||0)-dt*1000); if(player.comboT<=0) player.comboN = 0;
  const press = !!keys['KeyV'] && !rollLatch; rollLatch = !!keys['KeyV'];
  if(press && !(player.rollT>0) && player.rollCd<=0 && gameState==='playing' && !(player.fx.freeze>0) && !fish && !onWater()){
    let dx = mx, dy = my; if(!dx && !dy){ dx = player.dir==='left'?-1:player.dir==='right'?1:0; dy = player.dir==='up'?-1:player.dir==='down'?1:0; }
    const l = Math.hypot(dx,dy)||1; player.rvx = dx/l; player.rvy = dy/l;
    player.rollT = 340; player.rollCd = 1100; player.rollHit = false; SFX.play('swing');
    burst(player.x+player.w/2, player.y+player.h+2, 6, {colors:['#cdbf9a','#ffffff'], sp:50, up:12, g:20, life:420, size:2.6});
  }
  if(player.rollT>0){
    player.rollT -= dt*1000; const sp = 330, n = Math.ceil(sp*dt/8)||1;
    for(let i=0;i<n;i++) tryMove(player, player.rvx*sp*dt/n, player.rvy*sp*dt/n, loc);
    if(Math.random()<0.5) burst(player.x+player.w/2, player.y+player.h, 1, {colors:['#d8cba8'], sp:20, up:6, g:10, life:380, size:2.4});
    if(player.rollT<=0) player.invuln = Math.max(player.invuln, 120);
    return true;
  }
  return false;
}
function rollDodged(){
  if(player.rollHit) return; player.rollHit = true; player.counterT = 2500; bump('dodges');
  addNote('✨ Идеальный уклон: следующий удар +50% урона', '#ffe27a'); SFX.play('coin');
  burst(player.x+player.w/2, player.y+player.h/2, 14, {colors:['#fff6c8','#ffd34a','#ffffff'], sp:110, up:30, g:0, life:500, size:2.6});
}
function comboStep(){
  const wp = player.weapon;
  player.comboN = (player.comboN||0)+1; player.comboT = 1100;
  const n = player.comboN, fin = n%3===0, st = Math.min(0.2, 0.02*(n-1)), dag = wp==='dagger';
  comboVis = 1600;
  if(n>(player.stat.combo||0)) player.stat.combo = n;
  return {mult:(fin ? 1.35 : 1)*(1+st), scale:fin ? 1.25 : 1, push:fin ? 24 : 14, cdMul: dag ? (fin ? 1.1 : 0.95) : (fin ? 1.18 : 0.97), fin};
}
function comboFx(cs){
  if(cs.fin){
    const cx = player.x+player.w/2, cy = player.y+player.h/2, v = player.dir==='left'?-1:player.dir==='right'?1:0, w = player.dir==='up'?-1:player.dir==='down'?1:0;
    burst(cx+v*26, cy+w*26, 10, {colors:['#ffe27a','#ffffff','#ffb84a'], sp:100, up:20, g:0, life:380, size:2.8});
    shakeT = Math.max(shakeT, 70);
  }
}
function meleeCrit(e){ return player.weapon==='dagger' && player.comboN%4===0 ? 2 : 1; }
function meleeHitFx(e, mult){
  if(player.weapon==='hammer'){
    e.stun = Math.max(e.stun||0, e.boss||e.big||e.maxHp>400 ? 500 : 1500);
    burst(e.x+e.w/2, e.y+e.h/2, 8, {colors:['#ffd34a','#ffffff'], sp:80, up:30, g:100, life:400, size:2.8});
    shakeT = Math.max(shakeT, 90);
  } else if(player.weapon==='dagger' && player.comboN%4===0){
    burst(e.x+e.w/2, e.y+e.h/2, 8, {colors:['#ff6a4a','#ffffff'], sp:90, up:20, g:80, life:360, size:2.4});
  }
}
function orbSplash(a, hitE){
  const r = 52; burst(a.x, a.y, 16, {colors:['#b9a2ff','#ffffff','#7a5aff'], sp:110, up:20, g:0, life:420, size:3});
  for(const e of loc.enemies){
    if(e===hitE || e.hp<=0) continue;
    if(Math.hypot(e.x+e.w/2-a.x, e.y+e.h/2-a.y)<r){ damageEnemy(e, Math.round(a.dmg*0.55)); if(e.hp<=0) killEnemy(e); }
  }
}
// ---- рисование нового оружия ----
function heldNew(kind, hx, hy, side){
  ctx.strokeStyle = '#2a2e34'; ctx.lineWidth = 1;
  if(kind==='hammer'){
    ctx.translate(hx,hy); if(side) ctx.rotate(-0.6);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(side?-3:-1, side?-1:-18, side?20:2, side?2:26);
    ctx.fillStyle = '#9aa0aa'; if(side){ ctx.fillRect(13,-6,9,12); ctx.strokeRect(13,-6,9,12); } else { ctx.fillRect(-6,-22,12,8); ctx.strokeRect(-6,-22,12,8); }
  } else if(kind==='dagger'){
    ctx.translate(hx,hy); if(side) ctx.rotate(-0.4);
    ctx.fillStyle = '#e4e8ee'; ctx.beginPath(); if(side){ ctx.moveTo(2,-1.5); ctx.lineTo(13,0); ctx.lineTo(2,1.5); } else { ctx.moveTo(-1.5,0); ctx.lineTo(0,-12); ctx.lineTo(1.5,0); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5a2a'; if(side) ctx.fillRect(-1,-2.5,3,5); else ctx.fillRect(-3,0,6,2);
  } else {
    ctx.translate(hx,hy); if(side) ctx.rotate(-0.5);
    ctx.strokeStyle = '#6a4a8a'; ctx.lineWidth = 2.4; ctx.beginPath(); if(side){ ctx.moveTo(-4,0); ctx.lineTo(20,0); } else { ctx.moveTo(0,5); ctx.lineTo(0,-22); } ctx.stroke();
    const t = Date.now()/300; ctx.fillStyle = 'rgba(170,140,255,'+(0.75+0.2*Math.sin(t))+')'; ctx.beginPath(); ctx.arc(side?21:0, side?0:-24, 4, 0, 6.283); ctx.fill();
  }
}
function newAttackFx(cx,cy,vx,vy,ang){
  const w = player.weapon; if(w!=='dagger' && w!=='hammer' && w!=='staff') return false;
  if(w==='dagger'){
    ctx.strokeStyle = 'rgba(235,245,255,0.95)'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.arc(cx,cy,22,ang-0.8,ang+0.8); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx,cy,17,ang-0.6,ang+0.9); ctx.stroke();
  } else if(w==='hammer'){
    const fin = player.comboN%3===0;
    ctx.strokeStyle = 'rgba(255,214,120,0.9)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx+vx*8,cy+vy*8,33*(fin?1.2:1),ang-1.0,ang+1.0); ctx.stroke();
    ctx.fillStyle = 'rgba(255,236,170,0.35)'; ctx.beginPath(); ctx.arc(cx+vx*30,cy+vy*30,18,0,6.283); ctx.fill();
    ctx.fillStyle = '#9aa0aa'; ctx.save(); ctx.translate(cx+vx*30,cy+vy*30); ctx.rotate(ang); ctx.fillRect(-4,-9,10,18); ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(190,160,255,0.55)'; ctx.beginPath(); ctx.arc(cx+vx*18,cy+vy*18,8,0,6.283); ctx.fill();
  }
  return true;
}

// ---------- испытания дня и рекорды ----------
const DAILY_MODS = [
  {id:'glass',  n:'Стеклянная пушка', d:'Ваш урон ×1,5, но и урон по вам ×1,5.'},
  {id:'nopot',  n:'Сухой закон',      d:'Эликсиры здоровья на арене запрещены.'},
  {id:'swift',  n:'Быстрые враги',    d:'Все враги быстрее на 30%.'},
  {id:'armor',  n:'Бронированные',    d:'Здоровье врагов ×1,5.'},
  {id:'frail',  n:'Хрупкие, но злые', d:'Здоровье врагов ×0,6, их урон ×1,3.'}
];
function todayKey(){ const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function dailyMod(){ const k = todayKey(); let h = 0; for(let i=0;i<k.length;i++) h = (h*31+k.charCodeAt(i))>>>0; return DAILY_MODS[h%DAILY_MODS.length]; }
function dailyOn(){ return !!(loc && loc.arena && loc.run && loc.run.daily); }
function dailyMul(kind){
  if(!dailyOn()) return 1;
  const m = dailyMod().id;
  if(m==='glass') return 1.5;
  return 1;
}
function potionBlocked(){ return dailyOn() && dailyMod().id==='nopot'; }
function dailyEnemy(e){
  if(!dailyOn()) return;
  const m = dailyMod().id;
  if(m==='swift') e.speed *= 1.3;
  else if(m==='armor'){ e.hp *= 1.5; e.maxHp *= 1.5; }
  else if(m==='frail'){ e.hp *= 0.6; e.maxHp *= 0.6; e.dmg = Math.round(e.dmg*1.3); }
}
function dailyState(){ const k = todayKey(); if(!player.daily || player.daily.day!==k) player.daily = {day:k, done:false, best:0}; return player.daily; }
function recLoad(){ try{ return JSON.parse(localStorage.getItem(REC_KEY)||'{}') || {}; }catch(e){ return {}; } }
function recSave(r){ try{ localStorage.setItem(REC_KEY, JSON.stringify(r)); }catch(e){} }
function dailyProgress(wave){
  const R = loc.run, r = recLoad(); r.best = Math.max(r.best||0, wave);
  if(R && R.daily){
    const st = dailyState(); st.best = Math.max(st.best||0, wave);
    r.days = r.days || {}; const k = todayKey(); r.days[k] = {wave:Math.max((r.days[k]&&r.days[k].wave)||0, wave), mod:dailyMod().n};
    const keys2 = Object.keys(r.days).sort().slice(-10); const nd = {}; for(const q of keys2) nd[q] = r.days[q]; r.days = nd;
    if(wave>=6 && !st.done){
      st.done = true; player.gold += 300; player.mats.crystal = (player.mats.crystal||0)+2; bump('dailies');
      addNote('📅 Испытание дня выполнено! +300 ◆, 2 кристалла', '#ffd34a'); SFX.play('levelup'); achCheck();
    }
  }
  recSave(r);
}
function arenaChoice(n){
  const m = dailyMod(), st = dailyState();
  choiceBox(n.name, '— Обычное испытание или «Испытание дня»? Сегодня: «'+m.n+'» — '+m.d+' Дойди до 6-й волны: 300 ◆ и 2 кристалла'+(st.done ? ' (уже получено сегодня).' : '.'), [
    ['Обычное испытание', ()=>arenaStart(false)],
    ['Испытание дня: '+m.n, ()=>arenaStart(true)],
    ['Отмена', null]
  ]);
}
function renderRecords(){
  const r = recLoad(), st = dailyState(), m = dailyMod();
  jHead('Испытание дня');
  jRow('Сегодня: '+m.n, m.d+' Цель — 6-я волна. '+(st.done ? 'Награда получена ✔' : 'Лучшая сегодня: '+(st.best||0)+'.'), [], '#ffd34a');
  jHead('Рекорды на этом устройстве');
  const days = Object.keys(r.days||{}).sort().reverse();
  jRow('Лучшая волна арены: '+(r.best||0), days.length ? 'Последние дни: '+days.slice(0,5).map(d=>d.slice(5)+' — '+r.days[d].wave+' ('+r.days[d].mod+')').join('; ') : 'Испытаний дня ещё не было.', []);
  jRow('Лучшая серия ударов: '+(player.stat.combo||0), 'Идеальных уклонов: '+(player.stat.dodges||0)+'. Выполнено испытаний дня: '+(player.stat.dailies||0)+'.', []);
}

// ---------- питомец ----------
const PETS = {
  wolf:{name:'Волчонок', col:'#9c9c9c'}, icewolf:{name:'Ледяной волчонок', col:'#b4cbe0'}, spider:{name:'Паучок', col:'#4a2e5a'},
  bat:{name:'Летучая мышь', col:'#5a4370'}, scorpion:{name:'Скорпиончик', col:'#b8742e'}, cobra:{name:'Кобра', col:'#8a9a30'}, slime:{name:'Слизень', col:'#4fd15b'}
};
const petNeed = L=>20+16*L;
function petStats(){ const p = player.pet, L = p.lvl; return {dmg:Math.round(4+2.4*L), cd:Math.max(420, 850-18*L), speed:118+3*L, name:PETS[p.type].name}; }
function tameCandidate(){
  if(!player || gameState!=='playing' || loc.arena || loc.safe) return null;
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2; let best = null, bd = 80;
  for(const e of loc.enemies){
    if(e.hp<=0 || !PETS[e.type] || e.arenaMob || e.big || e.secret) continue;
    const d = Math.hypot(e.x+e.w/2-pcx, e.y+e.h/2-pcy);
    if(d<bd){ bd = d; best = e; }
  }
  return best;
}
function tryTame(e){
  if(e.hp>e.maxHp*0.4){ addNote('🍖 Зверь ещё слишком силён — ослабьте его до 40% здоровья', '#e0c96a'); SFX.play('deny'); return; }
  if((player.mats.fish||0)>0) player.mats.fish--; else if(player.gold>=40) player.gold -= 40; else { addNote('🍖 Нужна рыба или 40 ◆ на угощение', '#e07f7f'); SFX.play('deny'); return; }
  const old = player.pet;
  player.pet = {type:e.type, lvl:1, xp:0}; petObj = null; e.hp = 0; loc.enemies = loc.enemies.filter(q=>q!==e);
  burst(e.x+e.w/2, e.y+e.h/2, 18, {colors:['#ff8fb4','#ffffff','#ffd34a'], sp:90, up:40, g:-30, life:800, size:3});
  addNote('🐾 '+PETS[e.type].name+' теперь ваш питомец!'+(old ? ' (прежний ушёл на волю)' : ''), '#7fe07f'); SFX.play('levelup'); bump('tamed'); achCheck(); saveGame();
}
function petXp(e){
  const p = player.pet; if(!p || p.lvl>=20) return;
  p.xp += Math.max(2, Math.round(e.xp*0.25));
  while(p.lvl<20 && p.xp>=petNeed(p.lvl)){ p.xp -= petNeed(p.lvl); p.lvl++; addNote('🐾 '+PETS[p.type].name+' достиг уровня '+p.lvl+'!', '#7fe07f'); SFX.play('levelup'); }
}
function petSpawn(){
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2, p = freeSpotAround(pcx, pcy, 18, 18, 30, 70, 30) || {x:pcx+30, y:pcy};
  petObj = {x:p.x, y:p.y, w:18, h:18, walkT:0, face:'right', cd:0, st:0, hit:0};
}
function petTick(dt){
  tameTarget = tameCandidate();
  const tb = document.getElementById('tameBtn'); if(tb) tb.classList.toggle('hidden', !tameTarget);
  const press = !!keys['KeyG'] && !tameLatch; tameLatch = !!keys['KeyG'];
  if(press && tameTarget) tryTame(tameTarget);
  if(player.hitFlash>200) player.comboN = 0;
  if(comboVis>0) comboVis -= dt*1000;
  const pet = player.pet; if(!pet){ petObj = null; return; }
  if(!petObj) petSpawn();
  const o = petObj, S = petStats(), ms = dt*1000;
  o.cd -= ms; o.hit = Math.max(0,o.hit-ms);
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2, ocx = o.x+o.w/2, ocy = o.y+o.h/2, dp = Math.hypot(pcx-ocx, pcy-ocy);
  let tg = null, bd = 150;
  for(const e of loc.enemies){ if(e.hp<=0) continue; const d = Math.hypot(e.x+e.w/2-pcx, e.y+e.h/2-pcy); if(d<bd){ bd = d; tg = e; } }
  let tx = pcx, ty = pcy, stopD = 46, spd = S.speed;
  if(tg){
    tx = tg.x+tg.w/2; ty = tg.y+tg.h/2; stopD = 4;
    if(o.cd<=0 && overlap(tg, {x:o.x-5, y:o.y-5, w:o.w+10, h:o.h+10})){
      o.cd = S.cd; damageEnemy(tg, S.dmg); SFX.play('bite'); burst(tx, ty, 3, {colors:['#fff6c8','#ffd34a'], sp:70, up:15, g:150, life:220, size:1.8});
      if(tg.hp<=0) killEnemy(tg);
    }
  } else if(dp>240) spd *= 1.4;
  if(dp>480){ const p = freeSpotAround(pcx, pcy, o.w, o.h, 30, 70, 30); if(p){ o.x = p.x; o.y = p.y; } return; }
  const dx = tx-ocx, dy = ty-ocy, d = Math.hypot(dx,dy)||1;
  if(d>stopD){
    const x0 = o.x, y0 = o.y; let mx = dx/d, my = dy/d;
    if(!hasLOS(ocx,ocy,tx,ty)){ const fd = loc===flow.loc && flow.dist ? flowDir(o) : null; if(fd){ mx = fd[0]; my = fd[1]; } }
    tryMove(o, mx*spd*dt, my*spd*dt, loc);
    if(Math.abs(o.x-x0)+Math.abs(o.y-y0) < spd*dt*0.2){ o.st += dt; if(o.st>0.5) tryMove(o, -my*spd*dt, mx*spd*dt, loc); if(o.st>1.2){ o.st = 0; const q = freeSpotAround(pcx, pcy, o.w, o.h, 30, 70, 30); if(q){ o.x = q.x; o.y = q.y; } } } else o.st = 0;
    o.walkT += dt*10;
  }
  if(Math.abs(dx)>3) o.face = dx<0 ? 'left' : 'right';
}
function drawPet(camX, camY){
  const pet = player.pet; if(!pet || !petObj) return;
  const o = petObj, x = o.x-camX+o.w/2, y = o.y-camY+o.h/2, C = PETS[pet.type].col, fl = o.face==='left' ? -1 : 1, sw = Math.sin(o.walkT)*1.6;
  if(x<-30||y<-30||x>canvas.width+30||y>canvas.height+30) return;
  ctx.save(); ctx.translate(x, y+5); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(0,4,7,2.4); ctx.fill(); ctx.scale(fl,1);
  const t = pet.type;
  if(t==='bat'){
    const f = Math.sin(Date.now()/70)*5; ctx.fillStyle = C; ell(0,-9,5,4); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3,-9); ctx.lineTo(-12,-13+f); ctx.lineTo(-8,-7); ctx.fill(); ctx.beginPath(); ctx.moveTo(3,-9); ctx.lineTo(12,-13-f); ctx.lineTo(8,-7); ctx.fill();
    ctx.fillStyle = '#ffd34a'; circ(2,-10,1); ctx.fill();
  } else if(t==='slime'){
    ctx.fillStyle = C; ctx.beginPath(); ctx.ellipse(0,-4,8,6+sw*0.3,0,Math.PI,0); ctx.lineTo(8,-4); ctx.lineTo(-8,-4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; circ(-2,-6,1); ctx.fill(); circ(3,-6,1); ctx.fill();
  } else if(t==='spider'){
    ctx.strokeStyle = C; ctx.lineWidth = 1.5; for(let i=-1;i<=1;i+=2) for(let k=0;k<3;k++){ ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(i*(8+k*1.2),-8+k*3+sw*i*0.6); ctx.lineTo(i*(10+k),-1); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1; ctx.fillStyle = C; circ(0,-6,5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e33'; circ(3,-8,1); ctx.fill();
  } else if(t==='cobra'){
    ctx.strokeStyle = C; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9,-1); ctx.quadraticCurveTo(-4,-6+sw,0,-1); ctx.quadraticCurveTo(4,-8,5,-13); ctx.stroke();
    ctx.fillStyle = C; circ(6,-14,3.4); ctx.fill(); ctx.fillStyle = '#111'; circ(7.4,-14.6,0.8); ctx.fill();
  } else if(t==='scorpion'){
    ctx.fillStyle = C; ell(0,-4,7,4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = C; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6,-5); ctx.quadraticCurveTo(-11,-14,-4,-14); ctx.stroke();
    ctx.fillRect(5,-6,5,2); ctx.fillRect(5,-3,5,2);
  } else {
    ctx.fillStyle = C; ell(0,-5,8,4.6); ctx.fill(); ctx.stroke(); ctx.fillRect(-5+sw*0.4,-2,2.5,5); ctx.fillRect(3-sw*0.4,-2,2.5,5);
    ctx.beginPath(); ctx.moveTo(-7,-7); ctx.lineTo(-12,-10+sw*0.3); ctx.lineTo(-7,-4); ctx.fill();
    ctx.fillStyle = C; circ(7,-8,4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(5,-11); ctx.lineTo(6,-15); ctx.lineTo(9,-11); ctx.fill();
    ctx.fillStyle = '#111'; circ(9,-8.5,0.9); ctx.fill();
  }
  ctx.restore();
  ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.fillStyle = '#9fe8a8';
  ctx.strokeText('ур.'+pet.lvl, x, y-18); ctx.fillText('ур.'+pet.lvl, x, y-18); ctx.restore();
}
function renderPetSection(){
  jHead('Питомец');
  const p = player.pet;
  if(p){ const S = petStats(); jRow(S.name+' — ур. '+p.lvl+(p.lvl>=20 ? ' (макс.)' : ''), 'Урон '+S.dmg+', опыт '+p.xp+'/'+(p.lvl>=20 ? '—' : petNeed(p.lvl))+'. Растёт, когда вы побеждаете врагов.', [shopButton('Отпустить', ()=>{ player.pet = null; petObj = null; saveGame(); renderJournal('Питомец ушёл на волю.'); })], '#9fe8a8'); }
  else jRow('Питомца нет', 'Ослабьте дикого зверя (волк, паук, змея…) до 40% здоровья, подойдите и нажмите G (кнопка 🍖). Угощение: рыба или 40 ◆.', []);
}
function drawComboHUD(){
  if(gameState!=='playing') return;
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 15px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  const say = (t,y,c)=>{ ctx.strokeText(t, canvas.width/2, y); ctx.fillStyle = c; ctx.fillText(t, canvas.width/2, y); };
  if(player.comboN>=2 && comboVis>0) say('Серия ×'+player.comboN+(player.comboN%3===2 ? ' — следующий удар сильный!' : ''), 118, '#ffe27a');
  if(player.counterT>0) say('✨ Контрудар: +50% урона', 138, '#ffd34a');
  if(tameTarget) say(tameTarget.hp<=tameTarget.maxHp*0.4 ? '🍖 G — приручить '+PETS[tameTarget.type].name : '🐾 Ослабьте зверя до 40% здоровья', canvas.height-150, '#9fe8a8');
  if((player.rollCd||0)>0){ const rb = document.getElementById('rollBtn'); if(rb) rb.style.opacity = '0.45'; } else { const rb = document.getElementById('rollBtn'); if(rb) rb.style.opacity = ''; }
  ctx.restore();
}
function homeAchTick(){}
function tickD(dt){ homeTick(); petTick(dt); }
ACH.push(
  {id:'home',   i:'🏠', n:'Домовладелец', d:'Купить дом в Лиссарене.', g:100, t:()=>!!player.home},
  {id:'tame',   i:'🐾', n:'Укротитель',   d:'Приручить зверя.', g:120, t:()=>(player.stat.tamed||0)>=1},
  {id:'pet10',  i:'🐺', n:'Верный друг',  d:'Прокачать питомца до 10 уровня.', g:250, t:()=>!!(player.pet && player.pet.lvl>=10), p:()=>[player.pet?player.pet.lvl:0,10]},
  {id:'dodge10',i:'🤸', n:'Ловкач',       d:'Совершить 10 идеальных уклонов.', g:150, t:()=>(player.stat.dodges||0)>=10, p:()=>[player.stat.dodges||0,10]},
  {id:'combo9', i:'🔥', n:'Мастер серий', d:'Провести серию из 9 ударов.', g:150, t:()=>(player.stat.combo||0)>=9, p:()=>[player.stat.combo||0,9]},
  {id:'daily3', i:'📅', n:'Постоянство',  d:'Выполнить 3 испытания дня.', g:300, t:()=>(player.stat.dailies||0)>=3, p:()=>[player.stat.dailies||0,3]}
);
