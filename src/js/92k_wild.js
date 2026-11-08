// ======================= Дикие земли: бесконечный мир из соседних краёв =======================
// Врата на поверхности (открываются после победы над Мортраксом) ведут в Дикие земли. Это сетка краёв во все стороны:
// каждый край создаётся из зерна мира и своих координат, поэтому при возвращении он тот же. Проходы в середине каждой
// стороны ведут к соседям. Чем дальше от врат, тем сильнее враги и богаче добыча. В центре каждого края — тропа домой.
const WILD_W = 72, WILD_H = 60;
const WILD_BIOMES = {
  jungle:{name:'Зелёная Чаща',     lvl:8, col:'#4f9a3a', wx:'jungle', rost:[['wolf','boar','spider','slime','giantrat'], ['spider','webspider','cobra','goblin','boar'], null]},
  desert:{name:'Пески Миражей',    lvl:5, col:'#d8b46a', wx:'desert', rost:[['wolf','bandit','giantrat','boar'], ['scorpion','vulture','bandit','cobra'], null]},
  ice:   {name:'Стылые Равнины',   lvl:6, col:'#bfe2f4', wx:'ice',    rost:[['wolf','boar','bandit','giantrat'], ['icewolf','frostmite','wolf','bandit'], null]},
  grave: {name:'Курганы Предков',  lvl:7, col:'#7a8a7a', wx:'grave',  rost:[['skeleton','bat','zombie','giantrat'], ['zombie','skeleton','ghoul','skelarcher','wraith'], null]},
  ash:   {name:'Пепельные Пустоши',lvl:4, col:'#a8503a', wx:'lava',   rost:[['slime','bat','skeleton','goblin'], ['imp','lavaslime','salamander','skeleton'], ['cinderhound','pyromancer','golem','imp','lavaslime','salamander']]}
};
const WILD_BIOME_KEYS = Object.keys(WILD_BIOMES);
const WILD_BOSS_ORDER = ['boss','spiderqueen','shadowlord','lavalord','pharaoh','frostking','lich','treant','warlord','phantom'];
const WILD_STRUCT = { camp:'Лагерь разбойников', ruins:'Древние руины', shrine:'Святилище', trader:'Странствующий торговец', lair:'Логово зверя' };
OUTDOOR.wild = true;
GLOW_COL.wild = [255,214,120];
ENTER_MSG.wild = '🌄 Вы выходите в Дикие земли — чем дальше от врат, тем опаснее';

// ---------- случайность из зерна ----------
function wHash(a, b, c){
  let h = (a|0) ^ 0x9e3779b9; h = Math.imul(h ^ (b|0), 0x85ebca6b); h ^= h>>>13; h = Math.imul(h ^ (c|0), 0xc2b2ae35); h ^= h>>>16;
  return h>>>0;
}
function wRng(seed){ let s = seed>>>0; return ()=>{ s = (s+0x6D2B79F5)>>>0; let t = s; t = Math.imul(t ^ t>>>15, t|1); t ^= t + Math.imul(t ^ t>>>7, t|61); return ((t ^ t>>>14)>>>0)/4294967296; }; }
function wUnit(seed, x, y, salt){ return wHash(seed+salt*7919, x, y)/4294967296; }
function wNoise(seed, x, y, salt){                     // плавный шум по координатам краёв: соседние края похожи
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x-x0, fy = y-y0, sx = fx*fx*(3-2*fx), sy = fy*fy*(3-2*fy);
  const a = wUnit(seed,x0,y0,salt), b = wUnit(seed,x0+1,y0,salt), c = wUnit(seed,x0,y0+1,salt), d = wUnit(seed,x0+1,y0+1,salt);
  return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;
}
function wildBiomeAt(seed, rx, ry){
  if(rx===0 && ry===0) return 'jungle';
  const t = wNoise(seed, rx/2.6, ry/2.6, 11), m = wNoise(seed, rx/2.3+50, ry/2.3-30, 23);
  if(t<0.33) return 'ice';
  if(t>0.7) return 'ash';
  if(m<0.38) return 'desert';
  if(m>0.62) return 'jungle';
  return 'grave';
}
function wildDist(rx, ry){ return Math.max(Math.abs(rx), Math.abs(ry)); }
function wildMul(dist){ return 1+0.35*dist; }
function wildStructAt(seed, rx, ry){
  if(rx===0 && ry===0) return 'trader';
  const u = wUnit(seed, rx, ry, 77), d = wildDist(rx, ry);
  if(d>=1 && u<0.24) return 'lair';
  if(u<0.42) return 'camp';
  if(u<0.56) return 'ruins';
  if(u<0.68) return 'shrine';
  if(u<0.76) return 'trader';
  return null;
}
function wildKey(rx, ry){ return rx+','+ry; }
function wildUnlocked(){ return sandboxOn() || storyStage()>=1; }

// ---------- генерация края ----------
function wildGen(seed, rx, ry){
  const old = Math.random; Math.random = wRng(wHash(seed, rx*31+7, ry*17+3));
  try{ return wildGenInner(seed, rx, ry); } finally { Math.random = old; }
}
function wildGenInner(seed, rx, ry){
  const W = WILD_W, H = WILD_H, cx = Math.floor(W/2), cy = Math.floor(H/2), my = cy, mx = cx;
  const biome = wildBiomeAt(seed, rx, ry), B = WILD_BIOMES[biome], dist = wildDist(rx, ry), mul = wildMul(dist);
  const key = wildKey(rx, ry), done = (player.wild && player.wild.done && player.wild.done[key]) || {};
  const grid = makeGrid(W, H, '.');
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x<2||y<2||x>=W-2||y>=H-2) grid[y][x] = '#';
  const inb = (x,y)=>x>=2&&y>=2&&x<W-2&&y<H-2;
  for(let i=0;i<Math.round(W*H/52);i++){                                     // скалы, рощи, надгробные курганы
    const bx = rnd(3,W-4), by = rnd(3,H-4), r = rnd(1,3);
    for(let y=by-r;y<=by+r;y++) for(let x=bx-r;x<=bx+r;x++) if(inb(x,y) && Math.hypot(x-bx,y-by)<=r+0.2) grid[y][x] = '#';
  }
  if(biome==='ash') for(let i=0;i<10;i++){                                    // лавовые озёра
    const bx = rnd(6,W-7), by = rnd(6,H-7), r = rnd(1,2);
    for(let y=by-r;y<=by+r;y++) for(let x=bx-r;x<=bx+r;x++) if(inb(x,y) && Math.hypot(x-bx,y-by)<=r+0.3) grid[y][x] = 'L';
  }
  const clearC = (x0,y0,r)=>{ for(let y=y0-r;y<=y0+r;y++) for(let x=x0-r;x<=x0+r;x++) if(inb(x,y) && Math.hypot(x-x0,y-y0)<=r) grid[y][x] = '.'; };
  // проходы к соседям — посередине каждой стороны, к центру ведут дороги
  const gates = [{dir:'W', tx:0, ty:my}, {dir:'E', tx:W-1, ty:my}, {dir:'N', tx:mx, ty:0}, {dir:'S', tx:mx, ty:H-1}];
  for(const g of gates){
    const horiz = g.dir==='W' || g.dir==='E';
    for(let k=0;k<=3;k++) for(let d=-1;d<=1;d++){ const x = horiz ? (g.dir==='W' ? k : W-1-k) : mx+d, y = horiz ? my+d : (g.dir==='N' ? k : H-1-k); grid[y][x] = '.'; }
  }
  const road = (x0,y0,x1,y1)=>{ for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++) for(let d=-1;d<=1;d++){ if(inb(x,y0+d)) grid[y0+d][x] = '.'; } for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++) for(let d=-1;d<=1;d++){ if(inb(x1+d,y)) grid[y][x1+d] = '.'; } };
  road(2, my, W-3, my); road(mx, 2, mx, H-3);
  clearC(cx, cy, 4); grid[cy][cx] = '<';
  // постройка края
  const kind = wildStructAt(seed, rx, ry);
  const qx = (wUnit(seed,rx,ry,5)<0.5 ? -1 : 1), qy = (wUnit(seed,rx,ry,6)<0.5 ? -1 : 1);
  const sx = cx+qx*Math.round(W*0.27), sy = cy+qy*Math.round(H*0.27);
  const L = { type:'dungeon', level:B.lvl, biome:(biome==='ash' ? 'ash' : biome), title:B.name+' ('+rx+', '+ry+')', grid, width:W, height:H,
    enemies:[], items:[], boss:null, portal:null, noRespawn:true, wildGates:gates,
    spawn:{x:cx*TILE+5, y:(cy+2)*TILE}, exit:{tx:cx, ty:cy},
    wild:{seed, rx, ry, biome, dist, kind, sx, sy, key} };
  if(kind) clearC(sx, sy, kind==='lair' ? 7 : 5);
  road(mx, sy, sx, sy);
  const tier = dist<=1 ? 0 : dist<=3 ? 1 : 2;
  const roster = ((B.rost[tier] || LEVEL_ROSTER[B.lvl]) || ['wolf']).filter(t=>ENEMY_BASE[t]);
  const mk = (t, x, y, elite)=>{
    if(!grid[y] || grid[y][x]!=='.'){ let best = null; for(let r=1;r<=3 && !best;r++) for(let dy=-r;dy<=r && !best;dy++) for(let dx=-r;dx<=r && !best;dx++) if(grid[y+dy] && grid[y+dy][x+dx]==='.') best = [x+dx, y+dy]; if(best){ x = best[0]; y = best[1]; } }
    const e = makeEnemy(t, x*TILE+3, y*TILE+3, 1);
    e.hp *= mul; e.maxHp = e.hp; e.dmg = Math.round(e.dmg*(1+0.3*dist)); e.xp = Math.round(e.xp*(1+0.3*dist)); e.gold = Math.round(e.gold*(1+0.3*dist));
    if(elite){ e.hp *= 2.4; e.maxHp = e.hp; e.dmg = Math.round(e.dmg*1.35); e.xp *= 3; e.gold *= 4; e.elite = true; }
    L.enemies.push(e); return e;
  };
  if(kind==='camp'){
    L.wild.tents = [[sx-3,sy-2],[sx+3,sy-2],[sx,sy+3]];
    for(const [tx,ty] of L.wild.tents) grid[ty][tx] = 'B';
    if(!done.c) L.items.push(mkChest(sx-2, sy+1));
    const n = 3+Math.min(3, dist); for(let i=0;i<n;i++){ const a = i/n*6.283; mk(roster[rnd(0,roster.length-1)], Math.round(sx+Math.cos(a)*3.5), Math.round(sy+Math.sin(a)*3), i===0); }
  } else if(kind==='ruins'){
    for(let k=0;k<10;k++){ if(k%3===1) continue; const a = k/10*6.283; const px = Math.round(sx+Math.cos(a)*4.5), py = Math.round(sy+Math.sin(a)*3.8); if(inb(px,py)) grid[py][px] = '#'; }
    if(!done.c) L.items.push(mkChest(sx, sy));
    mk(roster[rnd(0,roster.length-1)], sx-2, sy, true); mk(roster[rnd(0,roster.length-1)], sx+2, sy, true);
  } else if(kind==='shrine'){
    L.wild.shrine = {x:(sx+0.5)*TILE, y:(sy+0.5)*TILE, used:!!done.s};
    grid[sy][sx] = 'B';
  } else if(kind==='trader'){
    const fs = fieldShop(grid, sx, sy); L.shop = fs.shop; L.merchant = fs.merchant;
  } else if(kind==='lair'){
    const idx = clamp(dist-1+(wUnit(seed,rx,ry,9)<0.5 ? 0 : 1), 0, WILD_BOSS_ORDER.length-1), bt = WILD_BOSS_ORDER[idx];
    L.wild.bossType = bt; L.wild.bossDone = !!done.b;
    if(!done.b){
      const sz = ENEMY_BASE[bt].size, b = makeEnemy(bt, sx*TILE+TILE/2-sz/2, sy*TILE+TILE/2-sz/2, 1);
      const bm = 0.6+0.14*dist; b.hp *= bm; b.maxHp = b.hp; b.dmg = Math.round(b.dmg*(0.75+0.06*dist));
      b.wildBoss = true; b.label = 'Зверь: '+BOSS_LABEL[bt]; L.enemies.push(b); L.boss = b;
      for(let i=0;i<3;i++){ const a = i/3*6.283+0.5; mk(roster[rnd(0,roster.length-1)], Math.round(sx+Math.cos(a)*5), Math.round(sy+Math.sin(a)*4), false); }
    }
  }
  // достижимость: всё, что не связано с центром, засыпаем
  const seen = floodFrom(grid, cx, cy+1, '#LSB');
  for(let y=2;y<H-2;y++) for(let x=2;x<W-2;x++) if(grid[y][x]==='.' && !seen[x+y*W]) grid[y][x] = '#';
  const cells = [];
  const nearKey = (x,y)=> Math.hypot(x-cx,y-cy)<10 || gates.some(g=>Math.hypot(x-g.tx,y-g.ty)<8) || (kind && Math.hypot(x-sx,y-sy)<7);
  const open8 = (x,y)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(grid[y+dy][x+dx]!=='.') return false; return true; };
  for(let y=3;y<H-3;y++) for(let x=3;x<W-3;x++) if(seen[x+y*W] && grid[y][x]==='.' && open8(x,y) && !nearKey(x,y)) cells.push([x,y]);
  const nEn = Math.min(40, 22+dist*3);
  for(let i=0;i<nEn && cells.length;i++){ const c = cells[rnd(0,cells.length-1)]; mk(roster[rnd(0,roster.length-1)], c[0], c[1], dist>=2 && Math.random()<0.06); }
  for(let i=0;i<12 && cells.length;i++){ const c = cells[rnd(0,cells.length-1)]; const pt = pickupType(0.22); if(pt){ const it = makeItem(pt, c[0]*TILE+10, c[1]*TILE+10); if(pt==='gold') it.value = Math.round(it.value*(1+0.4*dist)); L.items.push(it); } }
  ensureMapExtras({wild:L}); ensureBiomeHazards(L, 'wild');
  if(biome==='jungle') ensureHerbs({wild:L});
  return L;
}

// ---------- ворота на поверхности и переходы ----------
function placeWildGate(ow){
  const grid = ow.grid, W = ow.width, H = ow.height, cx = Math.floor(W/2), cy = Math.floor(H/2);
  let p = null;
  for(let t=0; t<800 && !p; t++){
    const x = rnd(8,W-9), y = rnd(8,H-9);
    if(grid[y][x]!=='.' || Math.hypot(x-cx,y-cy)<16) continue;
    if(ow.entrances.some(e=>Math.hypot(x-e.tx,y-e.ty)<(t<500 ? 16 : 9))) continue;
    if(ow.shop && Math.hypot(x-ow.shop.tx,y-ow.shop.ty)<12) continue;
    if(ow.poi && ow.poi.some(q=>Math.hypot(x-q.tx,y-q.ty)<10)) continue;
    p = {x,y};
  }
  if(!p) p = {x:Math.max(8, cx-20), y:Math.max(8, cy-16)};
  clearArea(grid, p.x, p.y, 2, '.'); grid[p.y][p.x] = '>';
  if(!floodFrom(grid, cx, cy, '~^#SB')[p.x+(p.y+1)*W]) carveRoad(grid, p.x, p.y+2, cx, cy);
  ow.entrances.push({tx:p.x, ty:p.y, dungeon:'wild', back:{x:p.x*TILE, y:(p.y+2)*TILE}});
  ow.enemies = ow.enemies.filter(e=>Math.hypot(e.x/TILE-p.x, e.y/TILE-p.y)>=9);
}
function ensureWildWorld(wd){
  const ow = wd.overworld; if(!ow) return;
  if(!ow.entrances.some(e=>e.dungeon==='wild')) placeWildGate(ow);
  if(!wd.wild){
    const seed = (player.wild && player.wild.seed) || ((Math.random()*2147483647)|0);
    wd.wild = wildGen(seed, 0, 0);
  }
  wd.wild.reqStage = 1; wd.wild.reqText = 'Врата Диких земель запечатаны. Победите Мортракса, первого стража.';
}
function wildEnsurePlayer(){
  if(!player.wild || typeof player.wild!=='object') player.wild = {};
  const P = player.wild;
  if(!P.seen) P.seen = {}; if(!P.done) P.done = {}; if(!P.bosses) P.bosses = 0;
  if(world.wild && world.wild.wild) P.seed = world.wild.wild.seed;
  return P;
}
function wildSeenCount(){ return player.wild && player.wild.seen ? Object.keys(player.wild.seen).length : 0; }
function wildRecord(L){
  if(!L || !L.wild) return;
  const P = wildEnsurePlayer(), W = L.wild, d = P.done[W.key] || {};
  const before = JSON.stringify(d);
  if((W.kind==='camp' || W.kind==='ruins') && L.items.some(i=>i.type==='chest' && i.open)) d.c = 1;
  if(W.shrine && W.shrine.used) d.s = 1;
  if(W.kind==='lair' && W.bossDone) d.b = 1;
  if(JSON.stringify(d)!==before || P.done[W.key]) P.done[W.key] = d;
  if(!Object.keys(d).length) delete P.done[W.key];
}
function wildRegion(rx, ry){
  const P = wildEnsurePlayer(), seed = P.seed || (world.wild && world.wild.wild.seed) || 1;
  const L = wildGen(seed, rx, ry);
  L.reqStage = 1; L.reqText = world.wild ? world.wild.reqText : '';
  return L;
}
function wildEnter(){                                // из песочницы и с поверхности — всегда в край у врат
  if(world.wild && world.wild.wild && (world.wild.wild.rx || world.wild.wild.ry)){ wildRecord(world.wild); world.wild = wildRegion(0, 0); }
  wildMark(world.wild);
  goTo('wild', world.wild.spawn.x, world.wild.spawn.y, ENTER_MSG.wild);
  wildWeather();
}
function wildMark(L){
  const P = wildEnsurePlayer(), k = L.wild.key;
  if(!P.seen[k]){ P.seen[k] = WILD_BIOME_KEYS.indexOf(L.wild.biome)+1; return true; }
  return false;
}
function wildWeather(){
  if(!loc || !loc.wild) return;
  const B = WILD_BIOMES[loc.wild.biome];
  WEATHER_OPTS.wild = WEATHER_OPTS[B.wx] || [['clear',100]];
  const b = env.b.wild || (env.b.wild = {name:'clear', amt:1, next:null, timer:40, opts:true});
  b.opts = B.wx!=='lava';
  if(!WEATHER_OPTS.wild.some(o=>o[0]===b.name)) { b.name = B.wx==='lava' ? 'embers' : WEATHER_OPTS.wild[0][0]; b.next = null; b.amt = 1; }
}
function wildGo(dx, dy){
  const W = loc.wild, nx = W.rx+dx, ny = W.ry+dy;
  wildRecord(loc);
  const L = wildRegion(nx, ny); world.wild = L;
  const g = L.wildGates.find(q=>q.dir===(dx<0 ? 'E' : dx>0 ? 'W' : dy<0 ? 'S' : 'N'));
  const px = (g.dir==='W' ? 3 : g.dir==='E' ? L.width-4 : g.tx)*TILE+5, py = (g.dir==='N' ? 3 : g.dir==='S' ? L.height-4 : g.ty)*TILE+5;
  const fresh = wildMark(L), B = WILD_BIOMES[L.wild.biome];
  goTo('wild', px, py, '🧭 '+B.name+' ('+nx+', '+ny+') · опасность '+wildStars(L.wild.dist)+(fresh ? ' · новый край!' : ''));
  if(L.wild.kind && fresh) addNote('✦ Здесь: '+WILD_STRUCT[L.wild.kind]+(L.wild.kind==='lair' && L.boss ? ' — '+BOSS_LABEL[L.wild.bossType] : ''), '#ffd34a');
  wildWeather();
}
function wildStars(d){ const n = Math.min(5, 1+Math.floor(d/1.5)); return '★'.repeat(n)+'☆'.repeat(5-n); }
let wildAcc = 0, wildShrineLock = false;
function wildTick(dt){
  if(currentLocId==='overworld' && world.wild && world.wild.wild && (world.wild.wild.rx || world.wild.wild.ry)){ wildRecord(world.wild); world.wild = wildRegion(0,0); }
  if(!loc.wild){ return; }
  wildEnsurePlayer();
  if(!loc.wild.seenMarked){ loc.wild.seenMarked = true; wildMark(loc); wildWeather(); }
  const W = loc.wild, pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  // хозяин логова повержен
  if(W.kind==='lair' && !W.bossDone && loc.boss && loc.boss.hp<=0){
    W.bossDone = true; player.wild.bosses++;
    const bx = Math.floor((loc.boss.x+loc.boss.w/2)/TILE), by = Math.floor((loc.boss.y+loc.boss.h/2)/TILE);
    const ch = mkChest(bx, by+1); loc.items.push(ch);
    const g = Math.round((120+60*W.dist)*(1+0.1*(player.ngp||0))); player.gold += g;
    addNote('☠ Зверь Диких земель повержен! +'+g+' ◆ — у логова остался сундук', '#ff9f4a'); SFX.play('win');
    wildRecord(loc); saveGame();
  }
  // святилище: полное здоровье и сила на время
  if(W.shrine){
    const d = Math.hypot(pcx-W.shrine.x, pcy-W.shrine.y);
    if(d>90) wildShrineLock = false;
    else if(d<40 && !wildShrineLock){
      wildShrineLock = true;
      if(W.shrine.used) addNote('⛩ Святилище молчит: его сила уже отдана вам', '#c8c8c8');
      else {
        W.shrine.used = true; player.hp = player.maxHp; player.buff.might = Math.max(player.buff.might, ELIX.might.dur*2); player.fx.burn = 0; player.fx.poison = 0;
        addNote('⛩ Святилище даровало силу: здоровье восполнено, урон +50% на время', '#ffd34a'); SFX.play('levelup');
        burst(W.shrine.x, W.shrine.y-10, 24, {colors:['#ffe89a','#ffffff','#9fd8ff'], sp:90, up:80, g:-40, life:900, size:2.6});
        wildRecord(loc); saveGame();
      }
    }
  }
  wildAcc += dt; if(wildAcc>1){ wildAcc = 0; wildRecord(loc); }
  if(transitionCooldown>0 || gameState!=='playing') return;
  const tx = Math.floor(pcx/TILE), ty = Math.floor(pcy/TILE);
  if(tx<=0) wildGo(-1,0); else if(tx>=loc.width-1) wildGo(1,0); else if(ty<=0) wildGo(0,-1); else if(ty>=loc.height-1) wildGo(0,1);
}

// ---------- отрисовка ----------
function drawWild(camX, camY){
  if(!loc.wild) return;
  const W = loc.wild, now = Date.now()/1000, cw = canvas.width, ch = canvas.height;
  const on = (x,y,m)=>x>-m && y>-m && x<cw+m && y<ch+m;
  // указатели у проходов: куда ведёт дорога
  for(const g of loc.wildGates){
    const dx = g.dir==='W' ? -1 : g.dir==='E' ? 1 : 0, dy = g.dir==='N' ? -1 : g.dir==='S' ? 1 : 0;
    const px = (g.dir==='W' ? 4 : g.dir==='E' ? loc.width-5 : g.tx+2.5)*TILE-camX, py = (g.dir==='N' ? 4 : g.dir==='S' ? loc.height-5 : g.ty-1.6)*TILE-camY;
    if(!on(px,py,60)) continue;
    const nb = WILD_BIOMES[wildBiomeAt(W.seed, W.rx+dx, W.ry+dy)];
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(px+2, py+14, 8, 3); ctx.fill();
    ctx.fillStyle = '#6a4a26'; ctx.fillRect(px-2, py-14, 4, 28);
    ctx.save(); ctx.translate(px, py-10); ctx.fillStyle = '#b08850'; ctx.strokeStyle = '#4a3016'; ctx.lineWidth = 1.2;
    ctx.beginPath(); const s = dx||(dy ? 0.0001 : 1); const fl = dx<0 ? -1 : 1;
    ctx.moveTo(-14*fl,-6); ctx.lineTo(10*fl,-6); ctx.lineTo(16*fl,0); ctx.lineTo(10*fl,6); ctx.lineTo(-14*fl,6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1a08'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(dy<0 ? '▲' : dy>0 ? '▼' : dx<0 ? '◀' : '▶', 0, 0.5); ctx.restore();
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(nb.name, px, py-22); ctx.fillStyle = '#ffe8b0'; ctx.fillText(nb.name, px, py-22);
    void s;
  }
  // табличка у тропы домой
  { const x = (loc.exit.tx+0.5)*TILE-camX, y = (loc.exit.ty-1.4)*TILE-camY;
    if(on(x,y,60)){ ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText('Тропа домой', x, y); ctx.fillStyle = '#fff4be'; ctx.fillText('Тропа домой', x, y); } }
  const S = (W.sx+0.5)*TILE-camX, T = (W.sy+0.5)*TILE-camY;
  if(W.tents) for(const [tx,ty] of W.tents){
    const x = (tx+0.5)*TILE-camX, y = (ty+0.5)*TILE-camY; if(!on(x,y,50)) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(x+2, y+12, 18, 5); ctx.fill();
    ctx.fillStyle = '#8a5a3a'; ctx.strokeStyle = '#3a2210'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x-17,y+12); ctx.lineTo(x,y-16); ctx.lineTo(x+17,y+12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.moveTo(x-4,y+12); ctx.lineTo(x,y-2); ctx.lineTo(x+4,y+12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c8a070'; ctx.beginPath(); ctx.moveTo(x,y-16); ctx.lineTo(x,y-22); ctx.stroke(); ctx.fillStyle = '#b02a2a'; ctx.fillRect(x, y-22, 7, 4);
  }
  if(W.kind==='camp' && on(S,T,40)){
    const fl = 0.85+0.15*Math.sin(now*11);
    ctx.fillStyle = 'rgba(255,150,50,0.18)'; circ(S+28, T-6, 26); ctx.fill();
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S+20,T); ctx.lineTo(S+36,T-6); ctx.moveTo(S+20,T-6); ctx.lineTo(S+36,T); ctx.stroke();
    ctx.fillStyle = 'rgba(255,110,30,0.9)'; ctx.beginPath(); ctx.moveTo(S+22,T-2); ctx.quadraticCurveTo(S+28,T-18-6*fl,S+34,T-2); ctx.closePath(); ctx.fill();
  }
  if(W.shrine){
    const x = W.shrine.x-camX, y = W.shrine.y-camY;
    if(on(x,y,60)){
      const p = 0.5+0.5*Math.sin(now*2.4), lit = !W.shrine.used;
      if(lit){ const g = ctx.createRadialGradient(x,y-10,2,x,y-10,46); g.addColorStop(0,'rgba(255,240,160,'+(0.45+0.25*p)+')'); g.addColorStop(1,'rgba(255,240,160,0)'); ctx.fillStyle = g; circ(x,y-10,46); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ell(x+2,y+12,16,5); ctx.fill();
      ctx.fillStyle = '#9a9488'; ctx.strokeStyle = '#3a3630'; ctx.lineWidth = 1.4; ctx.fillRect(x-13, y+2, 26, 10); ctx.strokeRect(x-13, y+2, 26, 10);
      ctx.fillStyle = '#b8b2a4'; ctx.beginPath(); ctx.moveTo(x-6,y+2); ctx.lineTo(x-4,y-24); ctx.lineTo(x+4,y-24); ctx.lineTo(x+6,y+2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = lit ? 'rgba(255,230,120,'+(0.7+0.3*p)+')' : '#5a5650'; circ(x, y-14, 3.4); ctx.fill();
    }
  }
  if(W.kind==='lair'){
    if(on(S,T,120)){
      ctx.strokeStyle = W.bossDone ? 'rgba(120,110,100,0.35)' : 'rgba(180,40,30,'+(0.35+0.2*Math.sin(now*3))+')'; ctx.lineWidth = 3; ctx.setLineDash([10,8]);
      ctx.beginPath(); ctx.ellipse(S, T, 6.5*TILE, 5.5*TILE, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      for(let i=0;i<8;i++){ const a = i/8*6.283, bx = S+Math.cos(a)*6.2*TILE, by = T+Math.sin(a)*5.2*TILE; ctx.strokeStyle = '#e6e1cf'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx-5,by-2); ctx.lineTo(bx+5,by+2); ctx.stroke(); ctx.lineCap = 'butt'; ctx.fillStyle = '#e6e1cf'; circ(bx-5,by-2,1.8); ctx.fill(); circ(bx+5,by+2,1.8); ctx.fill(); }
    }
  }
}
function drawWildMap(){
  if(!loc.wild) return;
  const W = loc.wild, P = player.wild || {seen:{}, done:{}}, R = 3, cell = 13, n = R*2+1;
  const mx = UI.l+hudW()+18, my = UI.t+10, size = n*cell;
  ctx.save(); ctx.fillStyle = 'rgba(10,8,4,0.55)'; ctx.fillRect(mx-3, my-3, size+6, size+22);
  ctx.strokeStyle = 'rgba(92,68,21,0.9)'; ctx.lineWidth = 1; ctx.strokeRect(mx-3, my-3, size+6, size+22);
  for(let j=-R;j<=R;j++) for(let i=-R;i<=R;i++){
    const rx = W.rx+i, ry = W.ry+j, k = wildKey(rx, ry), x = mx+(i+R)*cell, y = my+(j+R)*cell;
    const seen = P.seen && P.seen[k];
    ctx.fillStyle = seen ? WILD_BIOMES[WILD_BIOME_KEYS[seen-1]].col : 'rgba(60,56,50,0.7)'; ctx.globalAlpha = seen ? 0.85 : 0.6;
    ctx.fillRect(x+1, y+1, cell-2, cell-2); ctx.globalAlpha = 1;
    if(!seen){ ctx.fillStyle = 'rgba(200,190,170,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x+cell/2, y+cell/2+0.5); }
    else {
      const st = wildStructAt(W.seed, rx, ry), d = (P.done && P.done[k]) || {};
      if(st==='lair'){ ctx.fillStyle = d.b ? '#6a6a6a' : '#b02a1a'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☠', x+cell/2, y+cell/2+0.5); }
      else if(st==='trader'){ ctx.fillStyle = '#e02a2a'; circ(x+cell/2, y+cell/2, 2.4); ctx.fill(); }
    }
    if(rx===0 && ry===0){ ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 1.4; ctx.strokeRect(x+1.5, y+1.5, cell-3, cell-3); }
  }
  const pulse = 0.5+0.5*Math.sin(Date.now()/250), px = mx+R*cell+cell/2, py = my+R*cell+cell/2;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(mx+R*cell+0.5, my+R*cell+0.5, cell-1, cell-1);
  ctx.fillStyle = 'rgba(255,255,255,'+(0.5+0.5*pulse)+')'; circ(px + (player.x/loc.width/TILE-0.5)*(cell-4), py + (player.y/loc.height/TILE-0.5)*(cell-4), 2); ctx.fill();
  ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffe8b0';
  ctx.fillText('('+W.rx+', '+W.ry+') '+wildStars(W.dist), mx, my+size+3);
  ctx.restore();
}

// ---------- общие точки входа новых систем ----------
function extTick(dt){
  devTick(dt); biomeHazardsTick(dt); if(gameState!=='playing') return;
  mercsTick(dt); genQuestTick(dt); wildTick(dt);
}
function extDraw(camX, camY){ drawBiomeHazards(camX, camY); drawWild(camX, camY); drawMercs(camX, camY); }
function extHUD(){ drawWildMap(); drawColdHUD(); drawSandboxTag(); }
function extEnsureWorld(wd){ ensureWildWorld(wd); ensureBiomeHazardsAll(wd); }
