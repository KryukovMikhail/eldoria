// ======================= Достижения и «Новая игра+», арена, напарник, рыбалка, травы и варка =======================
let ngpKeep = 0, lairHit = false, achAcc = 0, herbAcc = 0;
const NGP_KEY = 'eldoria_ngp';
const NGP_KEYS = ['maxHp','atk','level','xp','xpNext','gold','potions','weapon','owned','armor','ownedArmor','sp','skills','gear','bag','wLvl','ench','elix','codex','boots','sb','mats','ach','stat','comp','stash','home','pet','daily'];
function ngMul(){ return 1+0.4*(player.ngp||0); }

function ensureMetaFields(){
  if(!player.ach) player.ach = {};
  player.stat = Object.assign({kills:0, bosses:0, barrels:0, potions:0, runPotions:0, herbs:0, fish:0, brewed:0, arena:0, hired:0}, player.stat||{});
  if(!player.ngp) player.ngp = 0;
  if(player.comp===undefined) player.comp = null;
  if(!player.secrets) player.secrets = {};
  if(!player.stash) player.stash = [];
  if(player.home===undefined) player.home = false;
  if(player.pet===undefined) player.pet = null;
  if(!player.daily) player.daily = {};
}
function bump(k, n){ if(!player.stat) ensureMetaFields(); player.stat[k] = (player.stat[k]||0)+(n===undefined ? 1 : n); }

// ---------- достижения ----------
const stDone = ()=>Object.keys(STORIES).filter(id=>storyState(id)==='done').length;
const ACH = [
  {id:'first',   i:'⚔', n:'Первая кровь',      d:'Победить первого врага.',                       g:20,  t:()=>player.stat.kills>=1},
  {id:'hunter',  i:'🏹', n:'Охотник',           d:'Победить 100 врагов.',                          g:100, t:()=>player.stat.kills>=100, p:()=>[player.stat.kills,100]},
  {id:'slayer',  i:'💀', n:'Истребитель',       d:'Победить 500 врагов.',                          g:300, t:()=>player.stat.kills>=500, p:()=>[player.stat.kills,500]},
  {id:'boss1',   i:'👑', n:'Охотник на стражей', d:'Победить первого стража логова.',               g:80,  t:()=>player.stat.bosses>=1},
  {id:'boss5',   i:'🛡', n:'Покоритель логов',   d:'Победить 5 стражей.',                           g:200, t:()=>player.stat.bosses>=5, p:()=>[player.stat.bosses,5]},
  {id:'boss10',  i:'🏰', n:'Конец тьмы',         d:'Победить всех 10 стражей за один поход.',        g:400, t:()=>storyStage()>=LAIR_ORDER.length, p:()=>[storyStage(),LAIR_ORDER.length]},
  {id:'untouched',i:'✨', n:'Без единой царапины', d:'Победить стража логова, ни разу не получив урон.', g:250, t:()=>false},
  {id:'barrels', i:'🛢', n:'Разгром',            d:'Разбить 50 бочек и ящиков.',                     g:60,  t:()=>player.stat.barrels>=50, p:()=>[player.stat.barrels,50]},
  {id:'herbs',   i:'🌿', n:'Травник',            d:'Собрать 30 трав.',                               g:70,  t:()=>player.stat.herbs>=30, p:()=>[player.stat.herbs,30]},
  {id:'fish',    i:'🎣', n:'Рыбак',              d:'Поймать 20 рыб.',                                g:70,  t:()=>player.stat.fish>=20, p:()=>[player.stat.fish,20]},
  {id:'brew',    i:'⚗', n:'Алхимик',            d:'Сварить 10 зелий и эликсиров.',                  g:90,  t:()=>player.stat.brewed>=10, p:()=>[player.stat.brewed,10]},
  {id:'arena5',  i:'🏟', n:'Гладиатор',          d:'Дойти до 5-й волны на арене.',                   g:150, t:()=>player.stat.arena>=5, p:()=>[player.stat.arena,5]},
  {id:'arena10', i:'🏆', n:'Чемпион арены',      d:'Дойти до 10-й волны на арене.',                  g:350, t:()=>player.stat.arena>=10, p:()=>[player.stat.arena,10]},
  {id:'comp',    i:'🤝', n:'Не один в поле',     d:'Нанять напарника в трактире.',                   g:40,  t:()=>player.stat.hired>=1},
  {id:'story',   i:'📖', n:'Добрая душа',        d:'Завершить все истории жителей.',               g:200, t:()=>stDone()>=Object.keys(STORIES).length, p:()=>[stDone(),Object.keys(STORIES).length]},
  {id:'veteran', i:'🎖', n:'Ветеран',            d:'Достичь 15-го уровня.',                          g:150, t:()=>player.level>=15, p:()=>[player.level,15]},
  {id:'rich',    i:'💰', n:'Богач',              d:'Накопить 5000 золота.',                          g:0,   t:()=>player.gold>=5000, p:()=>[Math.min(player.gold,5000),5000]},
  {id:'win',     i:'🌟', n:'Герой Эльдории',     d:'Забрать Сердце Эльдории.',                       g:500, t:()=>false},
  {id:'noelix',  i:'🧪', n:'Без эликсиров',      d:'Пройти игру, не выпив ни одного эликсира здоровья.', g:500, t:()=>false},
  {id:'ngp',     i:'🔁', n:'Новый круг',         d:'Начать «Новую игру+».',                          g:100, t:()=>(player.ngp||0)>=1}
];
function unlockAch(id){
  if(!player.ach || player.ach[id]) return;
  const a = ACH.find(x=>x.id===id); if(!a) return;
  player.ach[id] = 1; if(a.g) player.gold += a.g;
  addNote('🏅 Достижение: «'+a.n+'»'+(a.g ? ' (+'+a.g+' ◆)' : ''), '#ffd34a'); SFX.play('ach');
}
function achCheck(){ if(!player.stat) return; for(const a of ACH) if(!player.ach[a.id] && a.t()) unlockAch(a.id); }
function renderAchTab(){
  const got = ACH.filter(a=>player.ach[a.id]).length;
  document.getElementById('questInfo').textContent = 'Получено: '+got+' из '+ACH.length+(player.ngp ? '  •  Новая игра+'+player.ngp : '');
  for(const a of ACH){
    const ok = !!player.ach[a.id], pr = !ok && a.p ? a.p() : null;
    jRow((ok ? '✔ ' : '🔒 ')+a.i+' '+a.n, a.d+(pr ? ' ('+pr[0]+'/'+pr[1]+')' : '')+(a.g ? ' Награда: '+a.g+' ◆.' : ''), [], ok ? '#7fe07f' : '#b8ad88');
  }
  jRow('🍃 Сезон: '+seasonLabel().replace(/^\S+\s/,''), SEASONS[seasonIdx()].d+' Сезон меняется каждые '+SEASON_DAYS+' игровых суток.', [], '#9ad0ff');
  for(const h of secretHints()) jRow((h.st===2 ? '✔ ' : '❔ ')+h.S.name, h.st===2 ? 'Секретный босс повержен.' : h.S.hint, [], h.st===2 ? '#7fe07f' : '#e0c98a');
}
function metaHurt(){ if(LAIR[currentLocId]) lairHit = true; }
function metaPotion(){ bump('potions'); bump('runPotions'); }
function metaKill(e){
  bump('kills'); extraKill(e);
  if(BOSS_TYPES.includes(e.type) && !loc.arena){ bump('bosses'); if(LAIR[currentLocId] && !lairHit) unlockAch('untouched'); }
  achCheck();
}
function metaWin(){
  unlockAch('win'); if(!player.stat.runPotions) unlockAch('noelix'); achCheck();
  try{ const o = {ngp:player.ngp||0}; for(const k of NGP_KEYS) o[k] = player[k]; localStorage.setItem(NGP_KEY, JSON.stringify(o)); }catch(e){}
  refreshNgpUI();
}

// ---------- Новая игра+ ----------
function hasNgp(){ try{ return !!localStorage.getItem(NGP_KEY); }catch(e){ return false; } }
function refreshNgpUI(){
  const b = document.getElementById('ngpBtn'); if(b) b.classList.toggle('hidden', !hasNgp());
}
function startNgp(){
  let snap = null; try{ snap = JSON.parse(localStorage.getItem(NGP_KEY)); }catch(e){}
  if(!snap) return false;
  ngpKeep = (snap.ngp||0)+1; player.ngp = ngpKeep;
  beginNewGame();
  for(const k of NGP_KEYS) if(k in snap) player[k] = snap[k];
  player.ngp = ngpKeep; ngpKeep = 0;
  player.hp = player.maxHp; player.potions = Math.max(player.potions||0, 3);
  ensureNewPlayerFields(); ensureMetaFields(); player.stat.runPotions = 0;
  if(player.comp) player.comp.hp = compStats(player.comp.type).maxHp;
  refreshSkillUI(); storiesEnsure(); achCheck();
  addNote('🔁 Новая игра+'+player.ngp+': враги сильнее на '+Math.round(player.ngp*40)+'%, герой остался с вами', '#ffd34a'); SFX.play('levelup');
  saveGame();
  return true;
}
document.getElementById('ngpBtn').addEventListener('click', startNgp);
document.getElementById('ngpBtn2').addEventListener('click', startNgp);
refreshNgpUI();

// ---------- арена ----------
function generateArena(){
  const W = 24, H = 17, grid = makeGrid(W,H,'.');
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x===0||y===0||x===W-1||y===H-1) grid[y][x] = '#';
  for(const [px,py] of [[6,4],[16,4],[6,11],[16,11]]) for(let dy=0;dy<2;dy++) for(let dx=0;dx<2;dx++) grid[py+dy][px+dx] = '#';
  return { type:'dungeon', level:5, biome:'arena', arena:true, title:'Арена Лиссарена', safe:false, noRespawn:true, noSafeZone:true, nofog:true, fog:'9'.repeat(W*H),
    grid, width:W, height:H, enemies:[], items:[], portal:null, run:null, npcs:[], spawn:{x:12*TILE+5, y:12*TILE}, exit:{tx:12, ty:H-2} };
}
function ensureMetaWorld(wd){
  const T = wd.town; if(!T || !wd.house1) return;
  if(!wd.arena) wd.arena = generateArena();
  ensureHomeWorld(wd); ensureForkNpc(wd);
  if(!T.doors.some(d=>d.to==='arena')){
    const h = T.houses.find(q=>q.x===26 && q.y===4 && !q.to);
    if(h){ h.to = 'arena'; h.sign = 'arena'; h.kind = 'arena'; T.grid[h.y+3][h.x+3] = 'D'; T.doors.push({tx:h.x+3, ty:h.y+3, to:'arena', msg:'Вы входите на арену Лиссарена'}); }
  }
  const d2 = T.doors.find(d=>d.to==='arena');
  if(d2) wd.arena.backTo = {loc:'town', x:d2.tx*TILE+5, y:(d2.ty+1)*TILE+5, msg:'Вы выходите на улицу'};
  const A = npcsOf(wd.arena); if(!A.some(n=>n.fn==='arena')) A.push({sid:'_meta', fn:'arena', role:'npc', name:'Распорядитель Тарвос', col:'#8a2a2a', x:12*TILE-7+16, y:3*TILE+10});
  const I = npcsOf(wd.house1); if(!I.some(n=>n.fn==='recruit')) I.push({sid:'_meta', fn:'recruit', role:'npc', name:'Трактирщик Бруно', col:'#9a5a2a', x:9*TILE+9, y:3*TILE+9});
}
function arenaStart(daily){
  loc.run = {wave:0, state:'rest', t:3500, daily:daily===true}; loc.enemies = [];
  addNote('🏟 Испытание началось! Первая волна через несколько секунд', '#ff9f4a'); SFX.play('horn');
}
function arenaSpawn(n){
  const lv = Math.min(12, 1+Math.floor((n-1)/2)), roster = LEVEL_ROSTER[lv] || LEVEL_ROSTER[1];
  const cnt = Math.min(14, 3+Math.floor(n*0.9)), boss = n%5===0;
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2, list = [];
  if(boss) list.push(BOSS_TYPES[(n/5-1)%BOSS_TYPES.length]);
  for(let i=0;i<(boss ? Math.ceil(cnt/2) : cnt);i++) list.push(roster[rnd(0,roster.length-1)]);
  for(const ty of list){
    const sz = ENEMY_BASE[ty].size;
    const p = freeSpotAround(pcx, pcy, sz, sz, 150, 340, 40) || {x:pcx+120, y:pcy};
    const e = makeEnemy(ty, p.x, p.y, lv); e.aggro = 2000; e.arenaMob = true; dailyEnemy(e); loc.enemies.push(e);
    burst(p.x+sz/2, p.y+sz/2, 8, {colors:['#ff9f4a','#ffd34a','#ffffff'], sp:70, up:30, g:-20, life:500, size:2.4});
  }
  SFX.play(boss ? 'boss' : 'horn');
  addNote((boss ? '☠ Волна '+n+': появился страж!' : '⚔ Волна '+n+': врагов — '+list.length), boss ? '#ff6a4a' : '#ff9f4a');
}
function arenaReward(n){
  const k = 1+0.1*(player.ngp||0), boss = n%5===0, gold = Math.round((18+10*n)*(boss ? 2 : 1)*k);
  const m = {scrap:1+Math.floor(n/2)}; if(n%3===0) m.essence = 1; if(boss) m.crystal = 1;
  player.gold += gold; for(const q in m) player.mats[q] = (player.mats[q]||0)+m[q];
  addNote('🏟 Волна '+n+' пройдена: +'+gold+' ◆, '+yieldText(m), '#e0c96a');
}
function arenaTick(dt){
  if(!loc.arena || !loc.run) return;
  const R = loc.run, ms = dt*1000;
  if(R.state==='rest'){
    R.t -= ms;
    if(R.t<=0){ R.wave++; loc.enemies = loc.enemies.filter(e=>e.hp>0); arenaSpawn(R.wave); R.state = 'wave'; }
  } else if(R.state==='wave'){
    if(!loc.enemies.some(e=>e.hp>0)){
      arenaReward(R.wave); dailyProgress(R.wave); if(R.wave>player.stat.arena){ player.stat.arena = R.wave; addNote('🏟 Новый рекорд арены: волна '+R.wave, '#ffd34a'); }
      player.hp = Math.min(player.maxHp, player.hp+player.maxHp*0.25); achCheck();
      R.state = 'rest'; R.t = 5000; SFX.play('levelup'); saveGame();
    }
  }
}
function drawMetaHUD(){
  drawComboHUD(); drawPlacesHUD(); drawFestHUD();
  const W = canvas.width; ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 14px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  const say = (t,y,c)=>{ ctx.strokeText(t, W/2, y); ctx.fillStyle = c; ctx.fillText(t, W/2, y); };
  if(loc.arena && loc.run){
    const R = loc.run, alive = loc.enemies.filter(e=>e.hp>0).length;
    ctx.textAlign = 'left'; const sl = (t,y,c)=>{ ctx.strokeText(t, 16, y); ctx.fillStyle = c; ctx.fillText(t, 16, y); };
    sl('🏟 Арена — '+(R.state==='rest' ? 'волна '+(R.wave+1)+' через '+Math.ceil(R.t/1000)+' с' : 'волна '+R.wave+' • врагов: '+alive), 214, '#ffd9a0');
    ctx.textAlign = 'center';
  }
  if(gameState==='playing'){
    if(fish){
      if(fish.ph==='bite') say('❗ ТЯНИТЕ! (F)', canvas.height-130, '#ff6a4a');
      else say('🎣 Ждите поклёвку… (F — вытянуть, шаг — отмена)', canvas.height-130, '#cfe8ff');
    } else if(nearWater()) say('🎣 F — закинуть удочку', canvas.height-130, '#cfe8ff');
  }
  ctx.restore();
}

// ---------- напарник ----------
const COMP = {
  knight:{name:'Наёмный воин', price:150, col:'#9aa4b4', hp:[70,14], dmg:[6,2.4], speed:98, range:22, cd:750, size:22, desc:'Крепкий боец ближнего боя: держит врагов на себе.'},
  archer:{name:'Лучница',      price:180, col:'#4a8a4a', hp:[45,9],  dmg:[5,2.0], speed:102, range:190, cd:1100, size:20, desc:'Стреляет издалека и держит дистанцию.'},
  hound: {name:'Боевой пёс',   price:90,  col:'#8a5a2a', hp:[40,8],  dmg:[4,1.5], speed:140, range:20, cd:450, size:20, desc:'Быстрый и дешёвый: кусает часто, но хрупок.'}
};
let compObj = null;
function compStats(type){
  const C = COMP[type], L = player.level;
  return {name:C.name, col:C.col, maxHp:Math.round(C.hp[0]+C.hp[1]*L), dmg:Math.round(C.dmg[0]+C.dmg[1]*L), speed:C.speed, range:C.range, cd:C.cd, size:C.size};
}
function hireComp(type){
  const C = COMP[type]; if(!C || player.gold<C.price) return false;
  player.gold -= C.price; player.comp = {type, hp:compStats(type).maxHp, down:0}; compObj = null; bump('hired'); achCheck(); SFX.play('buy');
  addNote('🤝 '+C.name+' теперь с вами', '#7fe07f'); saveGame(); return true;
}
function dismissComp(){ if(player.comp){ addNote('Вы распустили напарника: '+COMP[player.comp.type].name, '#c8c8c8'); player.comp = null; compObj = null; saveGame(); } }
function renderPartyTab(){
  document.getElementById('questInfo').textContent = 'Золото: '+player.gold+' ◆';
  const c = player.comp;
  renderPetSection();
  jHead('Ваш напарник');
  if(c){
    const S = compStats(c.type);
    jRow(COMP[c.type].name+' — ур. '+player.level, (c.down>0 ? 'Повержен, вернётся через '+Math.ceil(c.down/1000)+' с.' : 'Здоровье '+Math.round(c.hp)+'/'+S.maxHp+', урон '+S.dmg+'.')+' Растёт вместе с вами.', [shopButton('Распустить', ()=>{ dismissComp(); renderJournal('Напарник распущен.'); })], '#7fe07f');
  } else jRow('Напарника нет', 'Наймите бойца в трактире «Дремлющий Грифон» у трактирщика Бруно.', []);
  jHead(currentLocId==='house1' ? 'Нанять в трактире' : 'Найм — только в трактире');
  for(const k of Object.keys(COMP)){
    const C = COMP[k], S = compStats(k), here = currentLocId==='house1';
    jRow(C.name+' — '+C.price+' ◆', C.desc+' Здоровье '+S.maxHp+', урон '+S.dmg+'.'+(c ? ' Новый наёмник заменит текущего.' : ''), [shopButton(here ? 'Нанять — '+C.price+' ◆' : 'В трактире', ()=>{ if(hireComp(k)) renderJournal('Наёмник теперь с вами.'); }, !here || player.gold<C.price || (c && c.type===k))]);
  }
  renderRecords(); renderForkSection();
}
function compSpawn(){
  const S = compStats(player.comp.type), pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  const p = freeSpotAround(pcx, pcy, S.size, S.size, 30, 70, 30) || {x:player.x, y:player.y};
  compObj = {x:p.x, y:p.y, w:S.size, h:S.size, cd:600, walkT:0, face:'right', hit:0, tracer:null, st:0};
}
function compTarget(S){
  let best = null, bd = 1e9; const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(const e of loc.enemies){
    if(e.hp<=0) continue;
    const ex = e.x+e.w/2, ey = e.y+e.h/2;
    if(Math.hypot(ex-pcx,ey-pcy)>260) continue;
    const d = Math.hypot(ex-(compObj.x+compObj.w/2), ey-(compObj.y+compObj.h/2));
    if(d<bd){ bd = d; best = e; }
  }
  return best;
}
function compTick(dt){
  const c = player.comp; if(!c){ compObj = null; return; }
  const ms = dt*1000, S = compStats(c.type);
  if(c.down>0){ c.down -= ms; if(c.down<=0){ c.down = 0; c.hp = S.maxHp; addNote('🛡 '+S.name+' вернулся в строй', '#7fe07f'); } return; }
  if(!compObj) compSpawn();
  const o = compObj, pcx = player.x+player.w/2, pcy = player.y+player.h/2, ocx = o.x+o.w/2, ocy = o.y+o.h/2;
  o.cd -= ms; o.hit = Math.max(0, o.hit-ms); if(o.tracer){ o.tracer.t -= ms; if(o.tracer.t<=0) o.tracer = null; }
  c.hp = Math.min(S.maxHp, c.hp+dt*S.maxHp*0.01);
  // получает урон от касаний врагов
  for(const e of loc.enemies){
    if(e.hp<=0 || e.dmg<=0) continue;
    e.cCd = Math.max(0,(e.cCd||0)-ms);
    if(e.cCd<=0 && overlap(e, o)){
      e.cCd = 900; c.hp -= e.dmg*0.55; o.hit = 200; burst(ocx, ocy, 4, {colors:['#d02a2a','#ffffff'], sp:60, up:20, g:100, life:300, size:2});
      if(c.hp<=0){ c.hp = 0; c.down = 30000; addNote('💔 '+S.name+' повержен — вернётся через 30 с', '#e07f7f'); burst(ocx, ocy, 14, {colors:['#cccccc','#999999'], sp:90, up:30, g:200, life:500, size:2.6}); compObj = null; return; }
    }
  }
  const tg = compTarget(S), dp = Math.hypot(pcx-ocx, pcy-ocy);
  let tx = pcx, ty = pcy, stopD = 52, spd = S.speed, flee = false;
  if(tg){
    const gx = tg.x+tg.w/2, gy = tg.y+tg.h/2, d = Math.hypot(gx-ocx, gy-ocy);
    if(c.type==='archer'){
      tx = gx; ty = gy; stopD = 150; if(d<95) flee = true;
      if(o.cd<=0 && d<S.range && hasLOS(ocx,ocy,gx,gy)){
        o.cd = S.cd; o.tracer = {x1:ocx, y1:ocy, x2:gx, y2:gy, t:140}; damageEnemy(tg, S.dmg); SFX.play('bow'); burst(gx, gy, 3, {colors:['#fff6c8','#ffd34a'], sp:60, up:10, g:100, life:240, size:1.8}); if(tg.hp<=0) killEnemy(tg);
      }
    } else {
      tx = gx; ty = gy; stopD = 6;
      if(o.cd<=0 && overlap(tg, {x:o.x-4, y:o.y-4, w:o.w+8, h:o.h+8})){
        o.cd = S.cd; damageEnemy(tg, S.dmg); SFX.play(c.type==='hound' ? 'bite' : 'hit'); burst(gx, gy, 4, {colors:['#fff6c8','#ffd34a','#ffffff'], sp:80, up:20, g:200, life:240, size:1.8}); if(tg.hp<=0) killEnemy(tg);
      }
    }
  } else if(dp>260) spd *= 1.35;
  if(dp>480){ const p = freeSpotAround(pcx, pcy, o.w, o.h, 30, 70, 30); if(p){ o.x = p.x; o.y = p.y; } return; }   // отстал — телепорт к герою
  const dx = tx-ocx, dy = ty-ocy, d = Math.hypot(dx,dy)||1;
  if(flee){ tryMove(o, -dx/d*spd*dt, -dy/d*spd*dt, loc); o.walkT += dt*9; }
  else if(d>stopD){
    const x0 = o.x, y0 = o.y; let mx = dx/d, my = dy/d;
    if(!hasLOS(ocx,ocy,tx,ty)){ const fd = loc===flow.loc && flow.dist ? flowDir(o) : null; if(fd){ mx = fd[0]; my = fd[1]; } }
    tryMove(o, mx*spd*dt, my*spd*dt, loc);
    if(Math.abs(o.x-x0)+Math.abs(o.y-y0) < spd*dt*0.2){ o.st += dt; if(o.st>0.5){ const px = -my, py = mx; tryMove(o, px*spd*dt, py*spd*dt, loc); } if(o.st>1.2){ o.st = 0; const q = freeSpotAround(pcx, pcy, o.w, o.h, 30, 70, 30); if(q){ o.x = q.x; o.y = q.y; } } } else o.st = 0;
    o.walkT += dt*9;
  }
  if(Math.abs(dx)>3) o.face = dx<0 ? 'left' : 'right';
}
function drawCompanion(camX, camY){
  const c = player.comp; if(!c || !compObj || c.down>0) return;
  const o = compObj, x = o.x-camX+o.w/2, y = o.y-camY+o.h/2, S = compStats(c.type);
  if(x<-40||y<-40||x>canvas.width+40||y>canvas.height+40) return;
  const sw = Math.sin(o.walkT)*2, fl = o.face==='left' ? -1 : 1;
  ctx.save(); ctx.translate(x, y+6); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(0,5,9,3); ctx.fill();
  if(o.hit>0){ ctx.globalAlpha = 0.65; }
  if(c.type==='hound'){
    ctx.scale(fl,1);
    ctx.fillStyle = S.col; ell(0,-5,10,5.5); ctx.fill(); ctx.stroke();
    ctx.fillRect(-7+sw*0.5,-2,3,6); ctx.fillRect(4-sw*0.5,-2,3,6);
    ctx.beginPath(); ctx.moveTo(-9,-7); ctx.lineTo(-14,-11+sw*0.4); ctx.lineTo(-9,-4); ctx.fill();
    ctx.fillStyle = '#a06a34'; circ(9,-9,4.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(8,-13); ctx.lineTo(10,-17); ctx.lineTo(12,-12); ctx.fill();
    ctx.fillStyle = '#111'; circ(11,-9.5,0.9); ctx.fill(); circ(13.4,-8,1.1); ctx.fill();
  } else {
    ctx.fillStyle = '#3a2c20'; ctx.fillRect(-4,-4+sw*0.3,3,5); ctx.fillRect(1,-4-sw*0.3,3,5);
    ctx.fillStyle = S.col; rrect(-5.5,-14,11,12,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0b890'; circ(0,-19,5); ctx.fill(); ctx.stroke();
    if(c.type==='knight'){
      ctx.fillStyle = '#c8cfd8'; ctx.beginPath(); ctx.arc(0,-20,5.4,Math.PI,0); ctx.fill(); ctx.fillRect(-5.4,-20,10.8,2); ctx.fillStyle = '#a02a2a'; ctx.fillRect(-0.8,-27,1.6,4);
      ctx.save(); ctx.scale(fl,1); ctx.strokeStyle = '#e8eef4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(7,-8); ctx.lineTo(7,-20); ctx.stroke(); ctx.fillStyle = '#7a5a2a'; ctx.fillRect(4.5,-9,5,2); ctx.restore();
    } else {
      ctx.fillStyle = '#2f6a2f'; ctx.beginPath(); ctx.arc(0,-20,5.6,Math.PI,0); ctx.lineTo(5,-16); ctx.lineTo(-5,-16); ctx.fill();
      ctx.save(); ctx.scale(fl,1); ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(7,-11,7,-1.2,1.2); ctx.stroke(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(8.6,-17); ctx.lineTo(8.6,-5); ctx.stroke(); ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  if(c.hp<S.maxHp-1){ ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-11,-28,22,3); ctx.fillStyle = '#6ad06a'; ctx.fillRect(-11,-28,22*Math.max(0,c.hp/S.maxHp),3); }
  ctx.restore();
  if(o.tracer){ ctx.strokeStyle = 'rgba(255,240,170,0.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(o.tracer.x1-camX, o.tracer.y1-camY); ctx.lineTo(o.tracer.x2-camX, o.tracer.y2-camY); ctx.stroke(); }
}

// ---------- рыбалка ----------
let fish = null, fishLatch = false, fishHint = false;
function nearWater(){
  if(loc.type!=='overworld' || onWater()) return null;
  const tx = Math.floor((player.x+player.w/2)/TILE), ty = Math.floor((player.y+player.h/2)/TILE); let best = null, bd = 1e9;
  for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){
    const r = loc.grid[ty+dy]; if(!r || r[tx+dx]!=='~') continue;
    const d = Math.hypot(dx,dy); if(d<bd){ bd = d; best = {x:(tx+dx+0.5)*TILE, y:(ty+dy+0.5)*TILE}; }
  }
  return bd<=2.3 ? best : null;
}
function fishCatch(){
  const r = Math.random(); let n = 0;
  if(r<0.60){ n = 1; addNote('🐟 Поймана рыбка', '#9fd8ff'); }
  else if(r<0.85){ n = 2; addNote('🐠 Крупный улов: две рыбы!', '#9fd8ff'); }
  else if(r<0.93){ const g = rnd(20,60); player.gold += g; addNote('👛 На крючке — размокший кошелёк: +'+g+' ◆', '#e0c96a'); }
  else addNote('👢 Старый башмак… не повезло', '#a89d78');
  if(n){ player.mats.fish = (player.mats.fish||0)+n; bump('fish', n); }
  SFX.play(n ? 'splash' : 'coin'); achCheck();
}
function fishTick(dt){
  const fb = document.getElementById('fishBtn');
  const nw = gameState==='playing' ? nearWater() : null;
  if(fb){ const hide = !nw && !fish; if(fb.classList.contains('hidden')!==hide) fb.classList.toggle('hidden', hide); }
  const press = !!keys['KeyF'] && !fishLatch; fishLatch = !!keys['KeyF'];
  if(fish){
    if(Math.hypot(player.x-fish.px, player.y-fish.py)>8 || player.hitFlash>150 || !nw){ fish = null; addNote('Рыбалка прервана', '#a89d78'); return; }
    fish.t -= dt*1000;
    if(fish.ph==='wait'){
      if(press){ fish = null; addNote('Рано! Рыба испугалась', '#e0a03a'); return; }
      if(fish.t<=0){ fish.ph = 'bite'; fish.t = 950; SFX.play('splash'); }
    } else {
      if(press){ fish = null; fishCatch(); return; }
      if(fish.t<=0){ fish = null; addNote('Сорвалась…', '#e0a03a'); }
    }
  } else if(press && nw){
    fish = {ph:'wait', t:rnd(2200,5500)*seasonMul('fish'), bx:nw.x, by:nw.y, px:player.x, py:player.y}; SFX.play('cast');
    if(!fishHint){ fishHint = true; addNote('🎣 Дождитесь поклёвки и нажмите F, когда поплавок нырнёт', '#9fd0ff'); }
  }
}
function drawFishing(camX, camY){
  if(!fish) return;
  const bx = fish.bx-camX, by = fish.by-camY, px = player.x+player.w/2-camX, py = player.y+player.h/2-camY, t = Date.now()/1000, bite = fish.ph==='bite';
  ctx.strokeStyle = 'rgba(240,240,240,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px,py-6); ctx.quadraticCurveTo((px+bx)/2, Math.min(py,by)-24, bx, by+(bite ? 3 : 0)); ctx.stroke();
  const rr = (bite ? 7 : 4)+((t*(bite ? 8 : 2))%1)*8;
  ctx.strokeStyle = 'rgba(255,255,255,'+(0.6-0.5*((t*(bite ? 8 : 2))%1))+')'; ctx.beginPath(); ctx.ellipse(bx,by+2,rr,rr*0.45,0,0,6.283); ctx.stroke();
  const dy = bite ? 3+Math.sin(t*30)*1.5 : Math.sin(t*2.5)*0.8;
  ctx.fillStyle = '#e8e8e8'; circ(bx,by-2+dy,3.2); ctx.fill(); ctx.fillStyle = '#d02a2a'; ctx.beginPath(); ctx.arc(bx,by-2+dy,3.2,Math.PI,0); ctx.fill();
  if(bite){ ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; ctx.strokeText('!',px,py-34); ctx.fillStyle = '#ff6a4a'; ctx.fillText('!',px,py-34); }
}

// ---------- травы ----------
const HERB_TARGET = {overworld:34, jungle:14};
let herbSeenFor = null, herbSeen = null;
function herbSpot(L, avoid){
  if(herbSeenFor!==L){ const T = TILE; herbSeen = floodFrom(L.grid, Math.floor(L.spawn.x/T), Math.floor(L.spawn.y/T), L.type==='overworld' ? '~^#SBo' : '#LSBo'); herbSeenFor = L; }
  for(let k=0;k<300;k++){
    const x = rnd(2,L.width-3), y = rnd(2,L.height-3);
    if(L.grid[y][x]!=='.' || !herbSeen[x+y*L.width]) continue;
    const px = x*TILE+TILE/2, py = y*TILE+TILE/2;
    if(avoid && Math.hypot(px-avoid.x, py-avoid.y)<avoid.r) continue;
    if(L.props && L.props.some(p=>Math.hypot(p.x-px,p.y-py)<24)) continue;
    return {x:px-7, y:py-7};
  }
  return null;
}
function ensureHerbs(wd){
  for(const id in wd){
    const L = wd[id]; if(!L || L.herbsInit || !L.grid) continue;
    const tgt = L.type==='overworld' ? HERB_TARGET.overworld : L.biome==='jungle' ? HERB_TARGET.jungle : 0;
    L.herbsInit = 1; if(!tgt) continue;
    for(let i=0;i<tgt;i++){ const p = herbSpot(L); if(p) L.items.push({type:'herb', x:p.x, y:p.y, w:14, h:14}); }
  }
}
function herbTick(dt){
  herbAcc += dt; if(herbAcc<20/seasonMul('herb')) return; herbAcc = 0;
  const tgt = loc.type==='overworld' ? HERB_TARGET.overworld : loc.biome==='jungle' ? HERB_TARGET.jungle : 0; if(!tgt) return;
  const have = loc.items.filter(i=>i.type==='herb').length; if(have>=tgt*0.7) return;
  const p = herbSpot(loc, {x:player.x, y:player.y, r:420}); if(p) loc.items.push({type:'herb', x:p.x, y:p.y, w:14, h:14});
}
function metaHerb(){ player.mats.herb = (player.mats.herb||0)+1; bump('herbs'); SFX.play('pickup'); if(player.stat.herbs===1) addNote('🌿 Травы нужны для варки эликсиров в лавке «Дымный Тигель»', '#9fe08f'); achCheck(); }
function drawHerb(sx, sy, it){
  const t = Date.now()/1000, sw = Math.sin(t*1.6+it.x)*1.2;
  ctx.save(); ctx.translate(sx+8, sy+13);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ell(0,1,6,2); ctx.fill();
  ctx.strokeStyle = '#2c6a2a'; ctx.lineWidth = 1.6; ctx.fillStyle = '#58b848';
  for(const [a,l] of [[-0.7,8],[0,11],[0.7,8],[-0.3,9],[0.35,9]]){ ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(Math.sin(a)*l*0.5+sw*0.4, -l*0.6, Math.sin(a)*l+sw, -Math.cos(a)*l); ctx.stroke(); ctx.beginPath(); ctx.ellipse(Math.sin(a)*l+sw, -Math.cos(a)*l, 2.2, 3.4, a, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = '#f4f08a'; circ(sw,-11,1.6); ctx.fill();
  ctx.restore();
}

// ---------- варка (в лавке «Дымный Тигель») ----------
const RECIPES = [
  {n:'Целебный отвар',    d:'+1 эликсир здоровья',          c:{herb:3},                 full:()=>player.potions>=8,            f:()=>{ player.potions++; }},
  {n:'Большой эликсир',   d:'большой эликсир здоровья',     c:{herb:5, essence:1},      full:()=>player.elix.big>=ELIX_MAX,    f:()=>{ player.elix.big++; }},
  {n:'Зелье скорости',    d:'зелье скорости',               c:{herb:2, fish:1},         full:()=>player.elix.speed>=ELIX_MAX,  f:()=>{ player.elix.speed++; }},
  {n:'Зелье силы',        d:'зелье силы',                   c:{herb:3, fish:2},         full:()=>player.elix.might>=ELIX_MAX,  f:()=>{ player.elix.might++; }},
  {n:'Зелье стойкости',   d:'зелье стойкости',              c:{herb:2, scrap:2},        full:()=>player.elix.guard>=ELIX_MAX,  f:()=>{ player.elix.guard++; }},
  {n:'Зелье водохода',    d:'зелье хождения по воде',       c:{herb:1, fish:3},         full:()=>player.elix.swim>=ELIX_MAX,   f:()=>{ player.elix.swim++; }}
];
function canCook(c){ for(const k in c) if((player.mats[k]||0)<c[k]) return false; return true; }
function cook(r){ if(r.full() || !canCook(r.c)) return false; for(const k in r.c) player.mats[k] -= r.c[k]; r.f(); bump('brewed'); achCheck(); return true; }
function renderBrewing(){
  shopRow('Варка', 'Травы 🌿 растут на поверхности, рыбу 🐟 можно поймать на берегу озёр (клавиша F). У вас: 🌿 '+(player.mats.herb||0)+'  🐟 '+(player.mats.fish||0)+'.', []);
  for(const r of RECIPES){
    const cost = Object.keys(r.c).map(k=>MAT_INFO[k].icon+r.c[k]).join(' '), full = r.full();
    shopRow('⚗ '+r.n, 'Результат: '+r.d+'.', [shopButton(full ? 'Запас полон' : 'Сварить — '+cost, ()=>{ if(cook(r)){ saveGame(); SFX.play('buy'); renderShop('Сварено: '+r.n+'.'); } }, full || !canCook(r.c))]);
  }
  const nf = player.mats.fish||0;
  shopRow('🐟 Продать улов', 'Рыбу берут по 7 ◆ за штуку.', [shopButton('Продать '+nf+' — '+nf*7+' ◆', ()=>{ player.gold += nf*7; player.mats.fish = 0; saveGame(); SFX.play('coin'); renderShop('Продано рыбы: '+nf+' (+'+nf*7+' ◆).'); }, nf<=0)]);
}

// ---------- разговоры и вход в локацию ----------
function metaTalk(n){
  if(n.fn==='fork'){ forkTalk(n); return; }
  if(n.fn==='recruit'){ openJournal('party'); return; }
  if(n.fn==='arena'){
    const best = (player.stat && player.stat.arena)||0;
    if(loc.run) showDialog(n.name, ['— Испытание идёт! Не стой столбом: волна '+(loc.run.wave||1)+'.'], 'К бою');
    else showDialog(n.name, ['— Добро пожаловать на арену Лиссарена! Волны врагов, каждая сильнее прежней, а каждая пятая — со стражем.','— За каждую волну платят золотом и материалами для кузнеца. Выйдешь с арены — испытание закончится, но награды останутся.'+(best ? ' Твой рекорд: волна '+best+'.' : '')], 'Начать испытание', ()=>arenaChoice(n));
  }
}
function metaEnter(prev){
  fish = null; compObj = null; lairHit = false; enterE();
  if(prev && prev.arena && prev.run){ prev.run = null; prev.enemies.length = 0; addNote('🏟 Испытание закончено', '#c8c8c8'); }
}
function metaTick(dt){
  achAcc += dt; if(achAcc>1){ achAcc = 0; achCheck(); }
  arenaTick(dt); compTick(dt); fishTick(dt); herbTick(dt); extraTick(dt);
}
function drawMeta(camX, camY){ drawSeason(); drawCompanion(camX, camY); drawFishing(camX, camY); drawExtra(camX, camY); }
