// ---------- окно диалога ----------
const dialogScreen = document.getElementById('dialogScreen'), dlgTitle = document.getElementById('dlgTitle'), dlgText = document.getElementById('dlgText'), dlgBtn = document.getElementById('dlgBtn');
let dlgPages = [], dlgIdx = 0, dlgLast = 'Закрыть', dlgDone = null;
function renderDialogPage(){
  dlgText.textContent = dlgPages[dlgIdx];
  dlgBtn.textContent = dlgIdx < dlgPages.length-1 ? 'Дальше' : dlgLast;
}
function showDialog(title, pages, lastBtn, done){
  dlgPages = pages.slice(); dlgIdx = 0; dlgLast = lastBtn || 'Закрыть'; dlgDone = done || null;
  for(const k in keys) keys[k] = false;
  gameState = 'dialog'; dlgTitle.textContent = title; renderDialogPage();
  dialogScreen.classList.remove('hidden'); SFX.play('shopOpen');
}
dlgBtn.addEventListener('click', ()=>{
  if(dlgIdx < dlgPages.length-1){ dlgIdx++; renderDialogPage(); return; }
  dialogScreen.classList.add('hidden');
  if(gameState==='dialog') gameState = 'playing';
  const f = dlgDone; dlgDone = null; if(f) f();
});
function newGameWithIntro(){ beginNewGame(); showDialog('Легенды Эльдории', STORY_INTRO, 'В путь!'); }

// ---------- ключи и сундуки ----------
let chestLoot = [];
function mkChest(tx, ty, locked){ return {type:'chest', x:tx*TILE+4, y:ty*TILE+8, w:24, h:20, locked:!!locked, open:false}; }
function openChest(it){
  it.open = true; SFX.play('levelup');
  const lv = loc.level||1, mul = it.locked ? 2.2 : 1;
  const gold = Math.round(rnd(25,60)*(1+lv*0.4)*mul);
  player.gold += gold;
  const parts = ['+'+gold+' золота'];
  const spot = ()=>({x:it.x+4+rnd(-26,26), y:it.y+26+rnd(0,12), w:16, h:16});
  if(Math.random() < (it.locked ? 1 : 0.5)){ chestLoot.push(Object.assign(spot(), {type:'potion', value:1})); parts.push('эликсир'); }
  if(Math.random() < (it.locked ? 0.8 : 0.35)){ chestLoot.push(Object.assign(spot(), {type:'elixir', kind:ELIX_KEYS[rnd(1,4)], value:1})); parts.push('зелье'); }
  if(Math.random() < (it.locked ? 1 : 0.2)){ chestLoot.push(Object.assign(spot(), {type:'gear', gear:makeGear(loc.level||0, it.locked ? 1 : undefined)})); parts.push('снаряжение'); }
  addNote('📦 Сундук открыт: '+parts.join(', '), '#ffd34a');
}
function placeSecrets(L){
  L.secrets = true;
  const W = L.width, H = L.height, T = TILE;
  const sx = Math.floor(L.spawn.x/T), sy = Math.floor(L.spawn.y/T);
  const bad = L.type==='overworld' ? '~^#SB' : '#LSB';
  const seen = floodFrom(L.grid, sx, sy, bad);
  const open8 = (x,y)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const t = L.grid[y+dy] && L.grid[y+dy][x+dx]; if(!t || bad.includes(t) || 'v<>D'.includes(t)) return false; } return true; };
  const far = (x,y,p,d)=> !p || Math.hypot(x-p.tx,y-p.ty)>=d;
  const cells = [];
  for(let y=3;y<H-4;y++) for(let x=3;x<W-4;x++){
    if(L.grid[y][x]!=='.' || !seen[x+y*W] || !open8(x,y) || Math.hypot(x-sx,y-sy)<12) continue;
    if(!far(x,y,L.portal,6) || !far(x,y,L.shop,7) || !far(x,y,L.exit,8)) continue;
    if(L.entrances && L.entrances.some(e=>Math.hypot(x-e.tx,y-e.ty)<8)) continue;
    cells.push([x,y]);
  }
  const used = [];
  const pick = (minD, from)=>{
    let c = [];
    for(const sp of [8,4]){ c = cells.filter(c=> used.every(u=>Math.hypot(c[0]-u[0],c[1]-u[1])>=sp) && (!from || Math.hypot(c[0]-from[0],c[1]-from[1])>=minD)); if(c.length) break; }
    if(!c.length) return null; const p = c[rnd(0,c.length-1)]; used.push(p); return p;
  };
  const nFree = L.type==='overworld' ? 6 : L.width>=80 ? 4 : 3;
  for(let i=0;i<nFree;i++){ const p = pick(); if(p) L.items.push(mkChest(p[0],p[1],false)); }
  const lp = pick(18,[sx,sy]) || pick(10,[sx,sy]) || pick(0);
  if(lp){
    L.items.push(mkChest(lp[0],lp[1],true));
    const kp = pick(14,lp) || pick(8,lp) || pick(0,lp);
    if(!kp){ const lc = L.items.find(i=>i.type==='chest' && i.locked); if(lc) lc.locked = false; }
    else {
      L.items.push({type:'key', x:kp[0]*T+8, y:kp[1]*T+8, w:16, h:16, value:1});
      const roster = LEVEL_ROSTER[L.type==='overworld' ? 0 : (L.level||1)] || ['wolf'];
      for(const dx of [-2,2]){ const gx = kp[0]+dx, gy = kp[1]; if(L.grid[gy] && L.grid[gy][gx]==='.') L.enemies.push(makeEnemy(roster[rnd(0,roster.length-1)], gx*T+3, gy*T+3, L.level||1)); }
    }
  }
}
function generateSecret(id){
  const sage = id==='secret1', W = sage ? 17 : 23, H = sage ? 12 : 15, T = TILE;
  const grid = makeGrid(W,H,'#');
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++) grid[y][x] = '.';
  const ex = sage ? 8 : 11;
  grid[H-2][ex] = '<';
  const L = { type:'dungeon', level: sage ? 1 : 2, title: sage ? 'Грот Мудреца Орбина' : 'Тайник Забытых Эхо', secrets:true, noRespawn:true, grid, width:W, height:H,
    enemies:[], items:[], boss:null, portal:null, spawn:{x:ex*T+5, y:(H-3)*T}, exit:{tx:ex, ty:H-2} };
  if(sage){
    L.safe = true; L.nofog = true; L.fog = '9'.repeat(W*H);
    L.items.push(mkChest(3,3,false), mkChest(13,3,false));
    L.sage = {x:8*T+5, y:3*T, w:22, h:26, met:false};
  } else {
    for(const [x,y] of [[6,8],[16,8]]) grid[y][x] = '#';
    L.items.push(mkChest(4,2,false), mkChest(11,2,true), mkChest(18,2,false));
    L.items.push({type:'key', x:11*T+8, y:6*T+8, w:16, h:16, value:1});
    for(const [t,x,y] of [['skeleton',8,5],['skeleton',14,5],['zombie',11,4]]) L.enemies.push(makeEnemy(t, x*T+3, y*T+3, 2));
  }
  return L;
}
function placeSecretEntrance(ow, id){
  const grid = ow.grid, W = ow.width, H = ow.height, cx = W>>1, cy = H>>1;
  const seen = floodFrom(grid, cx, cy, '~^#SB');
  let p = null;
  for(let t=0; t<900 && !p; t++){
    const x = rnd(8,W-9), y = rnd(8,H-9);
    if(grid[y][x]!=='.' || !seen[x+y*W] || !seen[x+(y+2)*W]) continue;
    if(ow.entrances.some(e=>Math.hypot(x-e.tx,y-e.ty)<(t<450?30:14))) continue;
    if(ow.shop && Math.hypot(x-ow.shop.tx,y-ow.shop.ty)<16) continue;
    if(Math.hypot(x-cx,y-cy)<16) continue;
    p = {x,y};
  }
  if(!p) return;
  ow.entrances.push({tx:p.x, ty:p.y, dungeon:id, hidden:true, found:false, back:{x:p.x*TILE, y:(p.y+2)*TILE}});
}
function ensureSecrets(w){
  const ow = w.overworld;
  for(const id of ['secret1','secret2']){
    if(!w[id]) w[id] = generateSecret(id);
    if(ow && !ow.entrances.some(e=>e.dungeon===id)) placeSecretEntrance(ow, id);
  }
  for(const id of ['overworld', ...CHAIN]){ const L = w[id]; if(L && !L.secrets && !LAIR[id]) placeSecrets(L); }
}

// ---------- мини-события на поверхности ----------
const ev = {timer:50, npcs:[], ambush:null};
let evShopLock = false, shopMode = null, sageLock = false;
function eventsReset(){ ev.timer = 45+Math.random()*40; ev.npcs = []; ev.ambush = null; evShopLock = false; shopMode = null; sageLock = false; }
function pickEventSpot(){
  const ptx = Math.floor((player.x+player.w/2)/TILE), pty = Math.floor((player.y+player.h/2)/TILE);
  const D = bfsDist(ptx, pty, 70), W = loc.width, c = [];
  for(let y=4;y<loc.height-4;y++) for(let x=4;x<W-4;x++){
    const d = D[x+y*W]; if(d<20 || d>60 || loc.grid[y][x]!=='.') continue;
    let ok = true; for(let dy=-1;dy<=1&&ok;dy++) for(let dx=-1;dx<=1;dx++) if('~^#SB'.includes(loc.grid[y+dy][x+dx])){ ok = false; break; }
    if(!ok) continue;
    if((loc.entrances||[]).some(e=>Math.hypot(x-e.tx,y-e.ty)<9) || (loc.shop && Math.hypot(x-loc.shop.tx,y-loc.shop.ty)<8) || (loc.exit && Math.hypot(x-loc.exit.tx,y-loc.exit.ty)<9) || (loc.portal && Math.hypot(x-loc.portal.tx,y-loc.portal.ty)<8)) continue;
    c.push([x,y]);
  }
  return c.length ? c[rnd(0,c.length-1)] : null;
}
function spawnAmbush(){
  const pl = player.level, pool = pl<8 ? ['bandit','bandit','boar'] : pl<14 ? ['bandit','bandit','wolf','boar'] : ['bandit','bandit','darkknight'];
  const n = 3 + (pl>=10?1:0) + (pl>=18?1:0), lv = Math.min(4, 1+Math.floor(pl/5));
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  if((loc.entrances||[]).some(e=>Math.hypot(pcx/TILE-e.tx, pcy/TILE-e.ty)<14)) return false;
  if(loc.exit && Math.hypot(pcx/TILE-loc.exit.tx, pcy/TILE-loc.exit.ty)<12) return false;
  let made = 0;
  for(let t=0; t<90 && made<n; t++){
    const a = Math.random()*6.283, d = (5+Math.random()*2.5)*TILE, x = pcx+Math.cos(a)*d-12, y = pcy+Math.sin(a)*d-12;
    if(isBlocked(loc, x, y, 24, 24)) continue;
    const e = makeEnemy(pool[rnd(0,pool.length-1)], x, y, lv); e.aggro = 480; e.ambush = true; e.gold = Math.round(e.gold*2.5)+4;
    loc.enemies.push(e); made++;
    burst(x+12, y+12, 8, {colors:['#3a6a2a','#6a8a4a','#ffffff'], sp:60, up:20, g:-20, life:400, size:2.4});
  }
  if(made<2) return false;
  ev.ambush = {n:made, done:'⚔ Засада отбита! +%g золота за разбойников'}; addNote('⚠ Засада! Разбойники выскочили из зарослей!', '#ff6a4a'); SFX.play('hit'); shakeT = Math.max(shakeT, 300);
  return true;
}
// события по локациям: что может случиться на поверхности и на открытых уровнях
const HORDES = {
  boars:   {types:['boar'],               n:[6,9], text:'🐗 Из чащи выбежало стадо кабанов!',        done:'🐗 Стадо кабанов разбежалось! +%g золота'},
  wolves:  {types:['wolf'],               n:[5,7], text:'🐺 Волчья стая учуяла вас!',               done:'🐺 Стая отбита! +%g золота'},
  scorp:   {types:['scorpion'],           n:[6,8], text:'🦂 Из-под песка полезли скорпионы!',        done:'🦂 Нашествие отбито! +%g золота'},
  vultures:{types:['vulture'],            n:[4,5], text:'🦅 Над вами закружила стая грифов!',        done:'🦅 Грифы разлетелись! +%g золота'},
  icewolves:{types:['icewolf'],           n:[5,6], text:'🐺 Метельная стая выскочила из снега!',     done:'🐺 Метельная стая отбита! +%g золота'},
  spirits: {types:['banshee','ghoul'],    n:[4,5], text:'👻 Из тумана выплыла призрачная процессия!', done:'👻 Процессия рассеялась! +%g золота'},
  panthers:{types:['panther'],            n:[3,4], text:'🐆 Стая пантер вышла на охоту!',            done:'🐆 Охота пантер сорвана! +%g золота'},
  patrol:  {types:['crossbowman','darkknight'], n:[4,5], text:'⚔ Тёмный дозор перекрыл улицу!',      done:'⚔ Дозор разбит! +%g золота'}
};
const EVENT_TABLE = {
  overworld:[['ambush',3],['boars',3],['wolves',2],['caravan',3],['healer',2]],
  desert:   [['caravan',4],['scorp',3],['vultures',3],['healer',1]],
  ice:      [['icewolves',3],['caravan',3],['healer',1]],
  grave:    [['spirits',3],['healer',2],['caravan',2]],
  jungle:   [['panthers',3],['caravan',3],['healer',2]],
  city:     [['patrol',3],['caravan',3],['healer',2]]
};
function spawnHorde(key){
  const H = HORDES[key]; if(!H) return false;
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2, n = rnd(H.n[0],H.n[1]);
  if((loc.entrances||[]).some(e=>Math.hypot(pcx/TILE-e.tx, pcy/TILE-e.ty)<12)) return false;
  if(loc.exit && Math.hypot(pcx/TILE-loc.exit.tx, pcy/TILE-loc.exit.ty)<12) return false;
  const lv = Math.min(4, 1+Math.floor(player.level/5)) + (currentLocId==='overworld' ? 0 : Math.max(0,(loc.level||1)-1));
  let made = 0;
  for(let t=0; t<120 && made<n; t++){
    const a = Math.random()*6.283, d = (6+Math.random()*3.5)*TILE, x = pcx+Math.cos(a)*d-12, y = pcy+Math.sin(a)*d-12;
    if(isBlocked(loc, x, y, 24, 24)) continue;
    const e = makeEnemy(H.types[rnd(0,H.types.length-1)], x, y, lv); e.aggro = 560; e.ambush = true; e.gold = Math.round(e.gold*1.8)+3;
    loc.enemies.push(e); made++;
    burst(x+12, y+12, 6, {colors:['#6a6a50','#a09a7a','#ffffff'], sp:50, up:20, g:-20, life:400, size:2.2});
  }
  if(made<2) return false;
  ev.ambush = {n:made, done:H.done}; addNote(H.text, '#ff8a4a'); SFX.play('hit'); shakeT = Math.max(shakeT, 260);
  return true;
}
function spawnEvent(){
  const tab = EVENT_TABLE[currentLocId]; if(!tab) return;
  const tot = tab.reduce((a,e)=>a+e[1],0); let r = Math.random()*tot, key = tab[0][0];
  for(const [k,w] of tab){ if(r<w){ key = k; break; } r -= w; }
  if(key==='ambush'){ if(!ev.ambush) spawnAmbush(); return; }
  if(HORDES[key]){ if(!ev.ambush) spawnHorde(key); return; }
  if(ev.npcs.some(n=>n.loc===currentLocId)) return;
  const spot = pickEventSpot(); if(!spot) return;
  const kind = key;
  ev.npcs.push({kind, loc:currentLocId, x:spot[0]*TILE+2, y:spot[1]*TILE+2, w:28, h:28, ttl: kind==='caravan' ? 240000 : 180000, used:false});
  const mapped = currentLocId==='overworld';
  addNote(kind==='caravan' ? (currentLocId==='desert' ? '🐪 В песках остановился караван — там продают сапоги-скороходы' : '🛒 Неподалёку остановился Караванщик Хазим'+(mapped?' — он отмечен на карте':'')) : '✚ Неподалёку бродит целительница Айлун'+(mapped?' — он отмечен на карте':''), '#ffd34a');
}
function eventsTick(dt){
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  if(loc.sage){                                                    // старец
    const sg = loc.sage, d = Math.hypot(pcx-(sg.x+sg.w/2), pcy-(sg.y+sg.h/2));
    if(d>140) sageLock = false;
    else if(d<70 && !sageLock){
      sageLock = true; const st = Math.min(10, storyStage());
      if(!sg.met){
        sg.met = true;
        showDialog('Мудрец Орбин', [
          'Я ждал тебя, путник. Тьма пришла из Обители Пустых Зеркал на краю мира: там Эфирий прячет Сердце Эльдории.',
          'Десять стражей держат его врата. Каждый из них падёт, если знать его слабость — заходи ко мне, я подскажу.',
          'Возьми это: ключ и большой эликсир. Ключи открывают запертые сундуки — их разбросано немало по всему свету.',
          STORY_LORE[st]
        ], 'Спасибо', ()=>{ player.vkeys++; player.elix.big = Math.min(ELIX_MAX, player.elix.big+1); addNote('Мудрец Орбин дал вам ключ и большой эликсир', '#ffd34a'); saveGame(); });
      } else showDialog('Мудрец Орбин', [STORY_LORE[st]], 'Спасибо');
      return;
    }
  }
  if(!EVENT_TABLE[currentLocId] || loc.safe) return;
  for(const n of ev.npcs) if(n.loc===currentLocId) n.ttl -= dt*1000;
  ev.npcs = ev.npcs.filter(n=>n.ttl>0);
  if(ev.ambush && !loc.enemies.some(e=>e.ambush && e.hp>0)){
    const g = Math.round((30+player.level*6)*Math.max(1,(ev.ambush.n||3)/3)); const msg = (ev.ambush.done||'⚔ Засада отбита! +%g золота').replace('%g', g); ev.ambush = null; player.gold += g;
    addNote(msg, '#7fe07f'); SFX.play('coin');
  }
  ev.timer -= dt;
  if(ev.timer<=0){ ev.timer = 70+Math.random()*70; spawnEvent(); }
  for(const n of ev.npcs){
    if(n.loc!==currentLocId) continue;
    const d = Math.hypot(pcx-(n.x+n.w/2), pcy-(n.y+n.h/2));
    if(n.kind==='healer' && !n.used && d<50){
      n.used = true; n.ttl = Math.min(n.ttl, 8000);
      if(player.hp<player.maxHp || player.slowT>0 || player.fx.burn>0 || player.fx.poison>0){ player.hp = player.maxHp; player.slowT = 0; player.fx.burn = 0; player.fx.poison = 0; player.fx.freeze = 0; SFX.play('levelup'); addNote('✚ Целительница Айлун исцелила вас: здоровье восстановлено', '#7fe07f'); }
      else { player.elix.big = Math.min(ELIX_MAX, player.elix.big+1); addNote('✚ Лекарь: «Вы здоровы — возьмите про запас». +большой эликсир', '#7fe07f'); SFX.play('pickup'); }
      burst(n.x+14, n.y+10, 16, {colors:['#7fe0a0','#ffffff'], sp:70, up:50, g:-30, life:700, size:2.6});
    }
    if(n.kind==='caravan'){
      if(d>135) evShopLock = false;
      else if(d<95 && !evShopLock){ shopMode = 'caravan'; openShop(); return; }
    }
  }
}
function drawEvents(camX, camY){
  if(!EVENT_TABLE[currentLocId]) return;
  const now = Date.now()/1000;
  for(const n of ev.npcs){
    if(n.loc!==currentLocId) continue;
    const sx = n.x-camX, sy = n.y-camY; if(!onScreen(sx-30,sy-40,90,80)) continue;
    const cx = sx+14, cy = sy+14, bob = Math.sin(now*2+n.x)*1.2;
    ctx.save(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#1a0e06'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(cx,cy+15,18,4.4); ctx.fill();
    if(n.kind==='caravan' && n.loc==='desert'){
      const w2 = Math.sin(now*2+n.x)*1.2;
      ctx.fillStyle = '#b8864a'; ell(cx-4,cy+2,17,8.5); ctx.fill(); ctx.stroke();
      for(const hx of [-9,3]){ ctx.fillStyle = '#c8965a'; ell(cx+hx,cy-7,5.4,6.4); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#a02a2a'; rrect(cx-14,cy-6,22,5,2); ctx.fill(); ctx.stroke(); ctx.fillStyle='#e8c040'; ctx.fillRect(cx-14,cy-4,22,1.4);
      ctx.fillStyle = '#b8864a'; ctx.beginPath(); ctx.moveTo(cx+10,cy-2); ctx.quadraticCurveTo(cx+18,cy-12,cx+17,cy-17+w2); ctx.lineTo(cx+21,cy-16+w2); ctx.quadraticCurveTo(cx+22,cy-6,cx+14,cy+2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8965a'; ell(cx+22,cy-16+w2,4.6,3.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1a0e06'; circ(cx+21,cy-17+w2,0.9); ctx.fill();
      ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 2.4; for(const lx of [-14,-9,4,9]){ ctx.beginPath(); ctx.moveTo(cx+lx,cy+8); ctx.lineTo(cx+lx+(lx<0?-1:1)*Math.sin(now*3+lx)*1.4,cy+17); ctx.stroke(); }
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#1a0e06';
      ctx.fillStyle = '#3a6a8a'; rrect(cx-21,cy-2+w2*0.3,8,16,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8c9a0'; circ(cx-17,cy-6+w2*0.3,4.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8e0cc'; ctx.beginPath(); ctx.arc(cx-17,cy-7+w2*0.3,5.4,Math.PI,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if(n.kind==='caravan'){
      ctx.fillStyle = '#7a4a22'; rrect(cx-21,cy-3,34,13,2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(cx-19,cy-3); ctx.quadraticCurveTo(cx-18,cy-24,cx-4,cy-24); ctx.quadraticCurveTo(cx+11,cy-24,cx+11,cy-3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(170,60,50,0.8)'; ctx.lineWidth = 2; for(const x of [-12,-5,2,8]){ ctx.beginPath(); ctx.moveTo(cx+x,cy-3); ctx.lineTo(cx+x*0.9,cy-21); ctx.stroke(); }
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#1a0e06';
      for(const x of [-12,6]){ ctx.fillStyle = '#4a3016'; circ(cx+x,cy+11,5.6); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#a07840'; ctx.beginPath(); ctx.moveTo(cx+x-5,cy+11); ctx.lineTo(cx+x+5,cy+11); ctx.moveTo(cx+x,cy+6); ctx.lineTo(cx+x,cy+16); ctx.stroke(); ctx.strokeStyle = '#1a0e06'; }
      ctx.fillStyle = '#3a6a8a'; rrect(cx+15,cy-7+bob*0.4,9,17,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8c9a0'; circ(cx+19.5,cy-11+bob*0.4,4.4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a2a2a'; ctx.beginPath(); ctx.moveTo(cx+14,cy-12+bob*0.4); ctx.lineTo(cx+19.5,cy-20+bob*0.4); ctx.lineTo(cx+25,cy-12+bob*0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      const gl = ctx.createRadialGradient(cx,cy-4,2,cx,cy-4,26); gl.addColorStop(0,'rgba(140,255,190,'+(n.used?0.15:0.35)+')'); gl.addColorStop(1,'rgba(140,255,190,0)'); ctx.fillStyle = gl; circ(cx,cy-4,26); ctx.fill();
      ctx.translate(0,bob);
      ctx.fillStyle = '#eef4ec'; ctx.beginPath(); ctx.moveTo(cx-6,cy-6); ctx.lineTo(cx+6,cy-6); ctx.lineTo(cx+10,cy+13); ctx.lineTo(cx-10,cy+13); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4aa86a'; ctx.fillRect(cx-1.4,cy-4,2.8,14); ctx.fillRect(cx-5,cy+1,10,2.8);
      ctx.fillStyle = '#e8c9a0'; circ(cx,cy-11,5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#eef4ec'; ctx.beginPath(); ctx.arc(cx,cy-12,6.4,Math.PI,0); ctx.lineTo(cx+6.4,cy-8); ctx.lineTo(cx-6.4,cy-8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx+13,cy+14); ctx.lineTo(cx+13,cy-12); ctx.stroke();
      ctx.fillStyle = '#7fffb0'; circ(cx+13,cy-14,3.4); ctx.fill();
    }
    ctx.restore();
    if(!n.used){ ctx.fillStyle = '#ffd34a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', cx, sy-14+Math.sin(now*4)*2); ctx.textAlign = 'left'; }
  }
}
function drawSage(camX, camY){
  const sg = loc.sage; if(!sg) return;
  const sx = sg.x-camX, sy = sg.y-camY, cx = sx+11, now = Date.now()/1000;
  ctx.save(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#1a0e06'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(cx,sy+26,11,3.4); ctx.fill();
  const gl = ctx.createRadialGradient(cx,sy+12,2,cx,sy+12,40); gl.addColorStop(0,'rgba(190,150,255,0.28)'); gl.addColorStop(1,'rgba(190,150,255,0)'); ctx.fillStyle = gl; circ(cx,sy+12,40); ctx.fill();
  ctx.fillStyle = '#5a4a8a'; ctx.beginPath(); ctx.moveTo(cx-6,sy+6); ctx.lineTo(cx+6,sy+6); ctx.lineTo(cx+11,sy+26); ctx.lineTo(cx-11,sy+26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a7ac0'; ctx.fillRect(cx-6,sy+14,12,3);
  ctx.fillStyle = '#e8c9a0'; circ(cx,sy+3,5.2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.moveTo(cx-4.6,sy+4); ctx.quadraticCurveTo(cx,sy+17,cx+4.6,sy+4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a4a8a'; ctx.beginPath(); ctx.moveTo(cx-7,sy+1); ctx.lineTo(cx,sy-12); ctx.lineTo(cx+7,sy+1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx+14,sy+27); ctx.lineTo(cx+14,sy-8); ctx.stroke();
  ctx.fillStyle = 'rgba(190,150,255,'+(0.6+0.3*Math.sin(now*3))+')'; circ(cx+14,sy-10,3.6); ctx.fill();
  ctx.restore();
  if(!sg.met || storyStage()>=0){ ctx.fillStyle = '#ffd34a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(sg.met ? '…' : '!', cx, sy-18+Math.sin(now*4)*2); ctx.textAlign = 'left'; }
}
function drawLootChest(sx, sy, it){
  const x = sx-4, y = sy-8;
  ctx.save(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#1a0e06';
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(x+17,y+29,13,4); ctx.fill();
  const body = it.locked ? '#5a4a52' : '#7a4a22', lid = it.locked ? '#6e5a66' : '#8a5a2a', band = it.locked ? '#c0c8d8' : '#c8962a';
  ctx.fillStyle = body; rrect(x+3,y+13,26,15,2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = band; ctx.fillRect(x+3,y+18,26,3);
  if(it.open){
    ctx.fillStyle = '#5a3416'; ctx.beginPath(); ctx.moveTo(x+3,y+13); ctx.lineTo(x+6,y+2); ctx.lineTo(x+26,y+2); ctx.lineTo(x+29,y+13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a0e06'; ctx.fillRect(x+5,y+14,22,5);
  } else {
    ctx.fillStyle = lid; rrect(x+3,y+5,26,10,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = band; ctx.fillRect(x+3,y+9,26,3);
    if(it.locked){ ctx.fillStyle = '#e8c040'; rrect(x+12,y+12,8,8,1.5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#e8c040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x+16,y+12,3.4,Math.PI,0); ctx.stroke(); }
    else { ctx.fillStyle = band; ctx.fillRect(x+14,y+12,4,6); }
    const p = 0.5+0.5*Math.sin(Date.now()/320); ctx.fillStyle = (it.locked ? 'rgba(160,200,255,' : 'rgba(255,230,120,')+(0.18+0.2*p)+')'; ctx.beginPath(); ctx.arc(x+16,y+14,18,0,6.283); ctx.fill();
  }
  ctx.restore();
}
function drawKeyItem(sx, sy){
  const t = Date.now()/1000, bob = Math.sin(t*3+sx*0.05)*1.6, cx = sx+8, cy = sy+8+bob;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(cx,sy+15,6,2.2); ctx.fill();
  const gl = ctx.createRadialGradient(cx,cy,1,cx,cy,16); gl.addColorStop(0,'rgba(255,230,110,0.7)'); gl.addColorStop(1,'rgba(255,230,110,0)'); ctx.fillStyle = gl; circ(cx,cy,16); ctx.fill();
  ctx.save(); ctx.translate(cx,cy); ctx.rotate(-0.6); ctx.lineWidth = 1.4; ctx.strokeStyle = '#4a3208'; ctx.fillStyle = '#ffd34a';
  ctx.beginPath(); ctx.arc(-4,0,3.6,0,6.283); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a2a06'; circ(-4,0,1.3); ctx.fill();
  ctx.fillStyle = '#ffd34a'; ctx.fillRect(-0.6,-1.2,10,2.4); ctx.strokeRect(-0.6,-1.2,10,2.4); ctx.fillRect(6,1.2,2,3.2); ctx.fillRect(3,1.2,2,2.4);
  ctx.restore();
}

function resetGame(){
  world = buildWorld();
  Object.assign(world, makeTownSet()); eventsReset(); folk = []; folkLoc = null; bedLock = false; restFade = 0;
  currentLocId = 'overworld';
  loc = world.overworld;
  player.x = loc.spawn.x; player.y = loc.spawn.y;
  player.hp=100; player.maxHp=100; player.atk=16; player.level=1; player.xp=0; player.xpNext=50;
  player.gold=0; player.potions=3; player.invuln=0; player.dir='down';
  player.weapon='sword'; player.owned={sword:true}; player.armor='none'; player.ownedArmor={none:true}; player.quest=null; player.questsDone={}; shopLock=false;
  notifications = [];
  transitionCooldown = 0;
  fullInvNoticeTimer = 0;
  resetHero();
  resetEnv();
  ensureMapExtras(world); storiesEnsure();
}

// старые сохранения: достраиваем новые уровни и спуск из Провала

// ======================= Новые места: дом в лесу, пирамида, склепы и др. =======================
// look: house/pyramid/cave/crypt/temple — отдельное строение на открытой карте; arch — потайная дверь в стене подземелья
const POI_DEFS = [
  {id:'poi_cabin',   parent:'overworld', look:'house',   w:5, h:4, wall:'#b08a5a', roof:'#6a3a22', trim:'#3a2210', title:'Хижина Мшистого Корня',        msg:'Вы входите в Хижину Мшистого Корня', cabin:true},
  {id:'poi_nest',    parent:'dungeon1',  look:'arch',    glow:'#dfeeff', title:'Гнездо Шелибы',    msg:'Вы пробираетесь в Гнездо Шелибы…'},
  {id:'poi_grotto',  parent:'dungeon3',  look:'arch',    glow:'#c88aff', title:'Грот Звенящих Кристаллов', msg:'Вы входите в Грот Звенящих Кристаллов'},
  {id:'poi_forge',   parent:'lava',      look:'arch',    glow:'#ff8a2a', title:'Кузня Забытого Горна', msg:'Вы входите в заброшенную Кузню Забытого Горна'},
  {id:'poi_pyramid', parent:'desert',    look:'pyramid', w:7, h:5, title:'Пирамида Хар-Нефет',     msg:'Вы входите в Пирамиду Хар-Нефет', size:42, rooms:8},
  {id:'poi_icecave', parent:'ice',       look:'cave',    w:5, h:3, glow:'#9fe0ff', rock:'#7a9ab8', title:'Пещера Сизого Инея', msg:'Вы входите в Пещеру Сизого Инея'},
  {id:'poi_crypt',   parent:'grave',     look:'crypt',   w:4, h:3, title:'Склеп Безымянных',                 msg:'Вы спускаетесь в склеп…'},
  {id:'poi_temple',  parent:'jungle',    look:'temple',  w:6, h:5, title:'Храм Ксилотара',         msg:'Вы входите в Храм Ксилотара'},
  {id:'poi_prison',  parent:'city',      look:'house',   w:6, h:4, wall:'#8a8a92', roof:'#4a4a54', trim:'#1c1c22', bars:true, title:'Тюрьма Вельмора', msg:'Вы входите в Тюрьму Вельмора'},
  {id:'poi_library', parent:'manor',     look:'arch',    glow:'#8affd8', title:'Библиотека Шёпота', msg:'Вы входите в Библиотеку Шёпота'}
];
function poiMask(look, w, h){          // какие клетки основания занимает строение (пирамида и храм сужаются кверху)
  const m = [];
  for(let y=0;y<h;y++){
    const row = [];
    for(let x=0;x<w;x++){
      let on = true;
      if(look==='pyramid'||look==='temple'){ const hw = (w-1)/2*(look==='pyramid' ? y/(h-1) : 0.45+0.55*y/(h-1)); on = Math.abs(x-(w-1)/2) <= hw+0.01; }
      else if(look==='cave'){ on = !(y===0 && (x===0||x===w-1)); }
      row.push(on);
    }
    m.push(row);
  }
  return m;
}
function generatePOIInterior(def, parent){
  if(def.cabin){
    const L = generateHouse('inn'); L.title = def.title; L.isPoi = true; L.noRespawn = true;
    return L;
  }
  const T = TILE, lvl = parent.level||1, size = def.size||34, W = size, H = size, nRooms = def.rooms||6;
  const grid = makeGrid(W,H,'#');
  const rooms = [];
  for(let tries=0; tries<1200 && rooms.length<nRooms; tries++){
    const rw = rnd(5,8), rh = rnd(5,7), rx = rnd(2,W-rw-3), ry = rnd(2,H-rh-3), cx = rx+(rw>>1), cy = ry+(rh>>1);
    const minD = tries<400 ? 9 : tries<800 ? 7 : 6; // если места мало, комнаты можно ставить чуть теснее
    if(rooms.some(r=>Math.hypot(r.cx-cx,r.cy-cy)<minD)) continue;
    rooms.push({x:rx,y:ry,w:rw,h:rh,cx,cy});
  }
  for(const r of rooms) for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) grid[y][x] = '.';
  const flr = (x,y)=>{ if(x>0&&y>0&&x<W-1&&y<H-1) grid[y][x] = '.'; };
  for(let i=1;i<rooms.length;i++){
    const a = rooms[i-1], b = rooms[i];
    for(let x=Math.min(a.cx,b.cx); x<=Math.max(a.cx,b.cx); x++){ flr(x,a.cy); flr(x,a.cy+1); }
    for(let y=Math.min(a.cy,b.cy); y<=Math.max(a.cy,b.cy); y++){ flr(b.cx,y); flr(b.cx+1,y); }
  }
  const en = rooms[0], last = rooms[rooms.length-1];
  grid[en.cy][en.cx] = '<';
  const roster = LEVEL_ROSTER[lvl] || LEVEL_ROSTER[1];
  const enemies = [], items = [];
  const guard = (r,n)=>{ for(let i=0;i<n;i++){ const x = r.cx+(i%2?2:-2), y = r.cy+(i>1?1:-1); if(grid[y][x]==='.') enemies.push(makeEnemy(roster[rnd(0,roster.length-1)], x*T+3, y*T+3, lvl)); } };
  for(let i=1;i<rooms.length-1;i++) guard(rooms[i], i%2 ? 2 : 3);
  // хранитель сокровищницы: сильный страж
  { const e = makeEnemy(roster[rnd(0,roster.length-1)], (last.cx+2)*T+3, last.cy*T+3, lvl+1);
    e.hp *= 2.4; e.maxHp = e.hp; e.dmg = Math.round(e.dmg*1.35); e.xp = Math.round(e.xp*3); e.gold = Math.round(e.gold*4); e.elite = true; enemies.push(e); }
  items.push(mkChest(last.cx-2,last.cy,true));
  const mid = rooms[Math.min(2,rooms.length-2)];
  items.push({type:'key', x:mid.cx*T+8, y:(mid.cy+1)*T+8, w:16, h:16, value:1});
  for(let i=1;i<rooms.length-1;i++){
    if(i!==Math.min(2,rooms.length-2)) items.push(mkChest(rooms[i].cx-(i%2?2:0), rooms[i].cy-1, false));
    if(i%2===0) items.push(makeItem('potion', rooms[i].cx*T+10, rooms[i].cy*T+10+T));
  }
  return { type:'dungeon', level:lvl, pal:(parent.pal||parent.level), title:def.title, isPoi:true, secrets:true, noRespawn:true,
    grid, width:W, height:H, enemies, items, boss:null, portal:null, spawn:{x:en.cx*T, y:(en.cy+1)*T}, exit:{tx:en.cx, ty:en.cy} };
}
function reachCount(L, from){
  const bad = L.type==='overworld' ? '~^#SB' : '#LSB';
  const seen = floodFrom(L.grid, from[0], from[1], bad); let n = 0; for(let i=0;i<seen.length;i++) n += seen[i]; return [n, seen];
}
function placePOI(parent, def, interior){
  const W = parent.width, H = parent.height, T = TILE, g = parent.grid;
  const sx = Math.floor(parent.spawn.x/T), sy = Math.floor(parent.spawn.y/T);
  const [n0, seen] = reachCount(parent, [sx,sy]);
  const farFrom = (x,y,p,d)=> !p || Math.hypot(x-p.tx,y-p.ty)>=d;
  const okSpot = (x,y)=> farFrom(x,y,parent.portal,10) && farFrom(x,y,parent.shop,10) && farFrom(x,y,parent.exit,10) && Math.hypot(x-sx,y-sy)>=10 &&
    !(parent.entrances && parent.entrances.some(e=>Math.hypot(x-e.tx,y-e.ty)<10)) && !(parent.poi && parent.poi.some(p=>Math.hypot(x-p.tx,y-p.ty)<14));
  let rec = null;
  if(def.look==='arch'){
    const cand = [];
    for(let y=3;y<H-3;y++) for(let x=3;x<W-3;x++){
      if(g[y][x]!=='#' || g[y+1][x]!=='.' || g[y][x-1]!=='#' || g[y][x+1]!=='#' || g[y-1][x]!=='#' || !seen[x+(y+1)*W]) continue;
      if(!okSpot(x,y)) continue;
      cand.push([x,y]);
    }
    if(!cand.length) return false;
    const [x,y] = cand[rnd(0,cand.length-1)];
    g[y][x] = 'D';
    rec = {id:def.id, look:'arch', tx:x, ty:y, w:1, h:1, door:{tx:x,ty:y}, glow:def.glow, title:def.title};
  } else {
    const mask = poiMask(def.look, def.w, def.h), fw = def.w, fh = def.h;
    const dx0 = (fw-1)>>1;
    let done = false;
    for(let tries=0; tries<2500 && !done; tries++){
      const x = rnd(4,W-fw-4), y = rnd(4,H-fh-5);
      let ok = true;
      for(let yy=-1;yy<=fh+1 && ok;yy++) for(let xx=-1;xx<=fw && ok;xx++){
        const t = g[y+yy][x+xx];
        const inside = yy>=0 && yy<fh && xx>=0 && xx<fw;
        if(inside && !mask[yy][xx]) { if('~^SB>vD<'.includes(t)) ok = false; continue; }
        if(inside || (yy>=fh)){ if(t!=='.') ok = false; }       // основание и полоса перед дверью — только свободная земля
        else if('~^SB>vD<'.includes(t)) ok = false;
      }
      if(!ok || !okSpot(x+dx0,y+fh-1)) continue;
      if(parent.items.some(i=>{ if(i.type!=='chest' && i.type!=='key') return false; const tx = Math.floor((i.x+i.w/2)/T), ty = Math.floor((i.y+i.h/2)/T); return tx>=x-1 && tx<=x+fw && ty>=y-1 && ty<=y+fh+1; })) continue;
      if(!seen[(x+dx0)+(y+fh)*W]) continue;
      // ставим и проверяем, что основание не перерезало карту
      const saved = [];
      for(let yy=0;yy<fh;yy++) for(let xx=0;xx<fw;xx++) if(mask[yy][xx]){ saved.push([x+xx,y+yy,g[y+yy][x+xx]]); g[y+yy][x+xx] = 'B'; }
      g[y+fh-1][x+dx0] = 'D';
      const [n1] = reachCount(parent, [sx,sy]);
      const portalOk = !parent.portal || reachCount(parent,[sx,sy])[1][parent.portal.tx+parent.portal.ty*W];
      if(n0-n1 > saved.length+8 || !portalOk){ for(const [a,b,c] of saved) g[b][a] = c; continue; }
      rec = {id:def.id, look:def.look, tx:x, ty:y, w:fw, h:fh, door:{tx:x+dx0,ty:y+fh-1}, def:{wall:def.wall, roof:def.roof, trim:def.trim, bars:!!def.bars, glow:def.glow, rock:def.rock}, title:def.title};
      done = true;
    }
    if(!done) return false;
    // убираем врагов и предметы, оказавшиеся на постройке
    const inR = (px,py)=>{ const tx = Math.floor(px/T), ty = Math.floor(py/T); return tx>=rec.tx-1 && tx<=rec.tx+rec.w && ty>=rec.ty-1 && ty<=rec.ty+rec.h+1; };
    parent.enemies = parent.enemies.filter(e=>!inR(e.x+e.w/2,e.y+e.h/2));
    parent.items = parent.items.filter(i=>!inR(i.x+i.w/2,i.y+i.h/2));
  }
  (parent.poi = parent.poi||[]).push(rec);
  (parent.doors = parent.doors||[]).push({tx:rec.door.tx, ty:rec.door.ty, to:def.id, msg:def.msg});
  interior.backTo = {loc:null, x:rec.door.tx*T+5, y:(rec.door.ty+1)*T+4, msg:'Вы выходите наружу'};
  return rec;
}

// ---------- Отрисовка мест (постройки и потайные двери) ----------
function drawPOIs(camX,camY){
  if(!loc.poi) return;
  for(const p of loc.poi){
    const x = p.tx*TILE-camX, y = p.ty*TILE-camY, w = p.w*TILE, h = p.h*TILE;
    if(x>canvas.width+8 || y>canvas.height+8 || x+w<-8 || y+h<-8) continue;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const D = p.def || {};
    const door = (dx,dy,dw,dh,col)=>{ ctx.fillStyle = col||'#1a0e06'; ctx.beginPath(); ctx.moveTo(dx,dy+dh); ctx.lineTo(dx,dy+dw/2); ctx.arc(dx+dw/2,dy+dw/2,dw/2,Math.PI,0); ctx.lineTo(dx+dw,dy+dh); ctx.closePath(); ctx.fill(); };
    const shadow = ()=>{ ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x+w/2, y+h-2, w*0.55, 7, 0, 0, 6.283); ctx.fill(); };
    const now = Date.now()/1000;
    if(p.look==='house'){
      shadow();
      const by = y+h*0.38;
      ctx.fillStyle = D.wall; ctx.strokeStyle = D.trim; ctx.lineWidth = 2; ctx.fillRect(x+6,by,w-12,h*0.62-3); ctx.strokeRect(x+6,by,w-12,h*0.62-3);
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; for(let i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(x+7,by+i*10); ctx.lineTo(x+w-7,by+i*10); ctx.stroke(); }
      ctx.fillStyle = D.roof; ctx.strokeStyle = D.trim; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x+1,by+4); ctx.lineTo(x+w*0.18,y+3); ctx.lineTo(x+w*0.82,y+3); ctx.lineTo(x+w-1,by+4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; for(let i=1;i<5;i++){ ctx.beginPath(); ctx.moveTo(x+4+i*3,by+4-i*4); ctx.lineTo(x+w-4-i*3,by+4-i*4); ctx.stroke(); }
      ctx.fillStyle = D.trim; ctx.fillRect(x+w*0.72,y-6,9,14);
      const sm = (now*0.6)%1; ctx.fillStyle='rgba(220,220,230,'+(0.4*(1-sm))+')'; ctx.beginPath(); ctx.arc(x+w*0.72+4+sm*6,y-10-sm*18,3+sm*5,0,6.283); ctx.fill();
      const dx = p.door.tx*TILE-camX, dy = p.door.ty*TILE-camY;
      door(dx+5,dy+4,TILE-10,TILE-4,'#2a1a0c'); ctx.strokeStyle=D.trim; ctx.lineWidth=1.6; ctx.stroke();
      ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(dx+TILE-9,dy+TILE*0.62,1.4,0,6.283); ctx.fill();
      for(const wx of [x+w*0.17, x+w*0.68]){
        ctx.fillStyle = D.bars ? '#14161c' : 'rgba(255,214,120,'+(0.85+0.1*Math.sin(now*3+wx))+')'; ctx.strokeStyle=D.trim; ctx.lineWidth=1.6;
        ctx.fillRect(wx,by+9,18,15); ctx.strokeRect(wx,by+9,18,15);
        ctx.beginPath(); if(D.bars){ ctx.strokeStyle='#8a8a92'; for(const q of [5,9,13]){ ctx.moveTo(wx+q,by+9); ctx.lineTo(wx+q,by+24); } } else { ctx.moveTo(wx+9,by+9); ctx.lineTo(wx+9,by+24); ctx.moveTo(wx,by+16.5); ctx.lineTo(wx+18,by+16.5); } ctx.stroke();
      }
    } else if(p.look==='pyramid'){
      shadow();
      const gr = ctx.createLinearGradient(x,y,x+w,y+h); gr.addColorStop(0,'#e8c878'); gr.addColorStop(1,'#b8904a');
      ctx.fillStyle = gr; ctx.strokeStyle = '#6a4a1c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x+w/2,y-4); ctx.lineTo(x+w-2,y+h-2); ctx.lineTo(x+2,y+h-2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(90,60,20,0.32)'; ctx.beginPath(); ctx.moveTo(x+w/2,y-4); ctx.lineTo(x+w-2,y+h-2); ctx.lineTo(x+w/2,y+h-2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(90,60,20,0.45)'; ctx.lineWidth = 1;
      for(let i=1;i<6;i++){ const yy = y-4+(h+2)*i/6, hw = (w/2-2)*i/6; ctx.beginPath(); ctx.moveTo(x+w/2-hw,yy); ctx.lineTo(x+w/2+hw,yy); ctx.stroke(); }
      ctx.fillStyle = '#ffd34a'; ctx.strokeStyle='#7a5a10'; ctx.beginPath(); ctx.moveTo(x+w/2,y-4); ctx.lineTo(x+w/2+8,y+11); ctx.lineTo(x+w/2-8,y+11); ctx.closePath(); ctx.fill(); ctx.stroke();
      const dx = p.door.tx*TILE-camX, dy = p.door.ty*TILE-camY;
      ctx.fillStyle='#e8d098'; ctx.fillRect(dx-5,dy+2,TILE+10,TILE-2); ctx.strokeStyle='#6a4a1c'; ctx.lineWidth=1.5; ctx.strokeRect(dx-5,dy+2,TILE+10,TILE-2);
      door(dx+4,dy+5,TILE-8,TILE-5,'#0a0602');
      ctx.fillStyle='#2a6ab0'; ctx.fillRect(dx-3,dy+5,3,9); ctx.fillRect(dx+TILE,dy+5,3,9);
    } else if(p.look==='cave'){
      shadow();
      ctx.fillStyle = D.rock||'#7a9ab8'; ctx.strokeStyle = '#1c3048'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x+3,y+h-2); ctx.quadraticCurveTo(x-2,y+h*0.45,x+w*0.22,y+8); ctx.quadraticCurveTo(x+w*0.5,y-8,x+w*0.78,y+8); ctx.quadraticCurveTo(x+w+2,y+h*0.45,x+w-3,y+h-2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(x+w*0.4,y+10,w*0.2,5,-0.2,0,6.283); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+w*0.7,y+18,10,4,0.2,0,6.283); ctx.fill();
      const dx = p.door.tx*TILE-camX, dy = p.door.ty*TILE-camY, gl = 0.5+0.3*Math.sin(now*2.4);
      ctx.fillStyle='rgba(159,224,255,'+gl*0.5+')'; ctx.beginPath(); ctx.arc(dx+TILE/2,dy+TILE/2,TILE*0.9,0,6.283); ctx.fill();
      door(dx+3,dy-6,TILE-6,TILE+4,'#06101c');
      ctx.fillStyle='#e8f6ff'; for(const [ix,iy] of [[x+8,y+h-6],[x+w-12,y+h-8]]){ ctx.beginPath(); ctx.moveTo(ix,iy); ctx.lineTo(ix+3,iy-12); ctx.lineTo(ix+6,iy); ctx.closePath(); ctx.fill(); }
    } else if(p.look==='crypt'){
      shadow();
      ctx.fillStyle = '#7a827c'; ctx.strokeStyle = '#1a1e1c'; ctx.lineWidth = 2;
      ctx.fillRect(x+4,y+h*0.32,w-8,h*0.68-3); ctx.strokeRect(x+4,y+h*0.32,w-8,h*0.68-3);
      ctx.fillStyle = '#5a625c'; ctx.beginPath(); ctx.moveTo(x,y+h*0.36); ctx.lineTo(x+w/2,y+2); ctx.lineTo(x+w,y+h*0.36); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1; for(let i=1;i<5;i++){ ctx.beginPath(); ctx.moveTo(x+5,y+h*0.32+i*9); ctx.lineTo(x+w-5,y+h*0.32+i*9); ctx.stroke(); }
      ctx.fillStyle = '#c8d0ca'; ctx.fillRect(x+w/2-2,y-8,4,16); ctx.fillRect(x+w/2-7,y-3,14,4);
      ctx.fillStyle='rgba(60,110,60,0.5)'; ctx.beginPath(); ctx.ellipse(x+12,y+h-12,10,5,0.3,0,6.283); ctx.fill();
      const dx = p.door.tx*TILE-camX, dy = p.door.ty*TILE-camY, gl = 0.5+0.3*Math.sin(now*2.2);
      door(dx+3,dy+2,TILE-6,TILE-2,'#04100a'); ctx.fillStyle='rgba(120,255,150,'+gl*0.35+')'; ctx.fillRect(dx+6,dy+10,TILE-12,TILE-10);
      ctx.fillStyle='#d8d3bd'; ctx.beginPath(); ctx.arc(x+8,y+h-6,3.2,0,6.283); ctx.fill(); ctx.fillRect(x+6.4,y+h-4,3.2,3);
    } else if(p.look==='temple'){
      shadow();
      const tiers = 4;
      for(let i=0;i<tiers;i++){
        const ty = y+i*(h-6)/tiers, th = (h-6)/tiers+2, hw = (w/2)*(0.5+0.5*(i+1)/tiers);
        ctx.fillStyle = i%2 ? '#6a7a58' : '#7a8a66'; ctx.strokeStyle = '#1c2614'; ctx.lineWidth = 2; ctx.fillRect(x+w/2-hw,ty,hw*2,th); ctx.strokeRect(x+w/2-hw,ty,hw*2,th);
      }
      ctx.fillStyle='#4a8a30'; for(const [vx,vy,vr] of [[x+10,y+30,9],[x+w-14,y+50,10],[x+w/2-30,y+h-24,8],[x+w/2+34,y+20,7]]){ ctx.beginPath(); ctx.arc(vx,vy,vr,0,6.283); ctx.fill(); }
      ctx.fillStyle='#ffd34a'; ctx.beginPath(); ctx.arc(x+w/2,y+6,5,0,6.283); ctx.fill();
      const dx = p.door.tx*TILE-camX, dy = p.door.ty*TILE-camY, gl = 0.5+0.3*Math.sin(now*2);
      ctx.fillStyle='#4a5a3a'; ctx.fillRect(dx-6,dy+1,TILE+12,TILE-1);
      door(dx+3,dy+2,TILE-6,TILE-2,'#04100a'); ctx.fillStyle='rgba(190,255,90,'+gl*0.35+')'; ctx.fillRect(dx+8,dy+12,TILE-16,TILE-12);
    } else if(p.look==='arch'){
      const gl = 0.55+0.3*Math.sin(now*2.6+p.tx);
      ctx.fillStyle = p.glow||'#fff'; ctx.globalAlpha = gl*0.45; ctx.beginPath(); ctx.arc(x+16,y+20,26,0,6.283); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#3a3a44'; ctx.strokeStyle = '#0c0c10'; ctx.lineWidth = 2; ctx.fillRect(x+1,y+2,TILE-2,TILE-2); ctx.strokeRect(x+1,y+2,TILE-2,TILE-2);
      door(x+6,y+6,TILE-12,TILE-6,'#05050a');
      ctx.strokeStyle = p.glow||'#fff'; ctx.lineWidth = 2; ctx.globalAlpha = gl; ctx.beginPath(); ctx.moveTo(x+6,y+TILE-2); ctx.lineTo(x+6,y+14); ctx.arc(x+16,y+14,10,Math.PI,0); ctx.lineTo(x+TILE-6,y+TILE-2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}

function ensurePOIs(w){
  for(const def of POI_DEFS){
    const parent = w[def.parent]; if(!parent) continue;
    if(w[def.id] && parent.poi && parent.poi.some(p=>p.id===def.id)) continue;
    if(w[def.id] && !(parent.poi && parent.poi.some(p=>p.id===def.id))) delete w[def.id];
    const interior = generatePOIInterior(def, parent);
    if(!placePOI(parent, def, interior)) continue;
    interior.backTo.loc = def.parent;
    w[def.id] = interior;
  }
}

function ensureWorldExtras(){
  if(!world.town || !world.house1 || !world.house2) Object.assign(world, makeTownSet());
  if(world.overworld && !world.overworld.entrances.some(en=>en.dungeon==='town')) placeTownGate(world.overworld, world.overworld.entrances[0]);
  for(const id of CHAIN) if(!world[id]) world[id] = genLoc(id);
  ensureSecrets(world); ensurePOIs(world); ensureMapExtras(world);
}

const CHAIN = ['lair1','dungeon1','lair2','dungeon3','lair3','lava','lair4','desert','lair5','ice','lair6','grave','lair7','jungle','lair8','city','lair9','manor','lair10'];
const LAIR = {
  lair1: {boss:'boss',        level:1,  pal:2, title:'Логово Мортракса'},
  lair2: {boss:'spiderqueen', level:2,  pal:2, title:'Логово Шелибы'},
  lair3: {boss:'shadowlord',  level:3,  title:'Логово Ноктурна'},
  lair4: {boss:'lavalord',    level:4,  title:'Логово Игнаррока'},
  lair5: {boss:'pharaoh',     level:5,  title:'Логово Хар-Атепа'},
  lair6: {boss:'frostking',   level:6,  title:'Логово Криомира'},
  lair7: {boss:'lich',        level:7,  title:'Логово Морвейна'},
  lair8: {boss:'treant',      level:8,  title:'Логово Ольхарона'},
  lair9: {boss:'warlord',     level:11, title:'Логово Вархаала'},
  lair10:{boss:'phantom',     level:12, title:'Логово Эфирия', last:true}
};
const NEXT_LOC = {}, PREV_LOC = {};
CHAIN.forEach((id,i)=>{ if(i<CHAIN.length-1) NEXT_LOC[id] = CHAIN[i+1]; if(i>0) PREV_LOC[id] = CHAIN[i-1]; });
const LOC_NAME = {dungeon1:'Грот Шорохов', dungeon3:'Провал Безмолвия', lava:'Кузни Гхарраш', desert:'Пустошь Зарахаб', ice:'Край Белого Эха', grave:'Погост Увядших Звёзд', jungle:'Дебри Ксилотара', city:'Град Вельмор', manor:'Обитель Пустых Зеркал'};
for(const id in LAIR) LOC_NAME[id] = LAIR[id].title;
const ENTER_MSG = {
  dungeon1:'Вы проходите в Грот Шорохов...', dungeon3:'Вы спускаетесь в Провал Безмолвия...', lava:'Жар обжигает лицо — вы в Кузнях Гхарраш!', desert:'Раскалённый ветер встречает вас: Пустошь Зарахаб',
  ice:'Мороз пробирает до костей: Край Белого Эха', grave:'Холодный туман стелется над могилами: Погост Увядших Звёзд', jungle:'Влажный воздух звенит от птиц: Дебри Ксилотара',
  city:'Гулкое эхо на брусчатке: Град Вельмор, захваченный тенями', manor:'Скрип половиц и ледяной сквозняк: Обитель Пустых Зеркал' };
const BACK_MSG = {};
for(const id of CHAIN){ if(LAIR[id]) ENTER_MSG[id] = '⚔ '+LAIR[id].title+': здесь вас ждёт могучий враг'; BACK_MSG[id] = 'Вы возвращаетесь: '+LOC_NAME[id]; }
const PORTAL_KIND = { lair1:'dungeon1', dungeon1:'dungeon2', lair2:'abyss', dungeon3:'dungeon2', lair3:'lavaGate', lava:'dungeon2', lair4:'tomb', desert:'dungeon2', lair5:'iceGate', ice:'dungeon2',
  lair6:'graveGate', grave:'dungeon2', lair7:'jungleGate', jungle:'dungeon2', lair8:'cityGate', city:'dungeon2', lair9:'manorGate', manor:'dungeon2' };
ENTER_MSG.secret1 = 'Вы входите в Грот Мудреца Орбина...'; ENTER_MSG.secret2 = 'Вы спускаетесь в Тайник Забытых Эхо...';
const BOSS_TYPES = ['boss','shadowlord','lavalord','pharaoh','frostking','lich','treant','spiderqueen','warlord','phantom'];
const BOSS_LABEL = { boss:'МОРТРАКС', shadowlord:'НОКТУРН', lavalord:'ИГНАРРОК', pharaoh:'ХАР-АТЕП', frostking:'КРИОМИР', lich:'МОРВЕЙН', treant:'ОЛЬХАРОН', spiderqueen:'ШЕЛИБА', warlord:'ВАРХААЛ', phantom:'ЭФИРИЙ' };
const BOSS_NOTE = {
  boss:'☠ Мортракс повержен! В глубине логова открылся проход в Грот Шорохов.',
  spiderqueen:'☠ Шелиба повержена! Паутина расступилась — открылся спуск в Провал Безмолвия.',
  shadowlord:'☠ Ноктурн повержен! В его зале открылся спуск в Кузни Гхарраш.',
  lavalord:'☠ Игнаррок повержен! Открылся спуск в Пустошь Зарахаб.',
  pharaoh:'☠ Хар-Атеп повержен! Открылся путь в Край Белого Эха.',
  frostking:'☠ Криомир повержен! Открылся путь на Погост Увядших Звёзд.',
  lich:'☠ Морвейн повержен! Открылась тропа в Дебри Ксилотара.',
  treant:'☠ Ольхарон повержен! Открылась дорога в Град Вельмор.',
  warlord:'☠ Вархаал повержен! Открылась дверь в Обитель Пустых Зеркал.',
  phantom:'☠ Эфирий повержен! Заберите Сердце Эльдории, чтобы завершить поход.'
};

function goTo(locId, x, y, message){
  const prevLoc = loc;
  currentLocId = locId;
  loc = world[locId];
  // большие карты кешируются в крупные холсты: при уходе на другой большой уровень освобождаем память (важно для iOS)
  if(prevLoc && prevLoc!==loc && loc.width*loc.height>=2000){
    for(const m of [groundLayers, dungeonLayers, waterLayers]){ const c = m.get(prevLoc); if(c){ if(c.getContext){ c.width = 1; c.height = 1; } m.delete(prevLoc); } }
  }
  player.x = x; player.y = y;
  transitionCooldown = 700;
  clearFx(); SFX.play('portal');
  if(player.visited) player.visited[locId] = 1;
  storiesEnsure();
  if(loc.npcs) for(const n of loc.npcs) n.lock = false;
  if(message) addNote(message);
  if(LAIR[locId] && loc.boss && loc.boss.hp>0 && LAIR_TAUNT[locId]) addNote(LAIR_TAUNT[locId], '#ff9f4a');
  saveGame(); // контрольная точка при каждом переходе
}

