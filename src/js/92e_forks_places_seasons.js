// ======================= Развилки сюжета, подводный и небесный уровни, сезонные праздники =======================
let airT = 40, airTick1 = 0, gust = null, gustCd = 6, skyBolts = [], skyBoltCd = 5, fest = null, festCd = 40, festFlash = 0, forkNpcLock = false;
const AIR_MAX = 40;

// ---------- 7. развилки сюжета ----------
const FORKS = [
  {id:'f1', need:1, title:'Раненый разбойник', q:'У ворот Лиссарена сидит раненый разбойник. Стража уже идёт. Он просит не выдавать его — клянётся, что завяжет с ремеслом.',
   A:{t:'Перевязать и отпустить', r:'+10 к макс. здоровью, эликсир. Засады на дорогах станут слабее.', f:()=>{ player.maxHp += 10; player.hp += 10; giveElix(); }, e:'Вы отпустили разбойника. Он сказал, что дороги теперь будут чуточку спокойнее.'},
   B:{t:'Сдать страже', r:'+150 ◆.', f:()=>{ player.gold += 150; }, e:'Стража забрала разбойника. Награда звенит в кошельке.'}},
  {id:'f2', need:3, title:'Спор мельников и рыбаков', q:'Две общины делят речной берег и просят вас рассудить их. Мельникам нужна плотина, рыбакам — свободное течение.',
   A:{t:'Поддержать мельников', r:'+1 очко навыков.', f:()=>{ player.sp += 1; }, e:'Мельники построили плотину и научили вас кое-чему о выносливости.'},
   B:{t:'Поддержать рыбаков', r:'+400 ◆ и 6 рыб.', f:()=>{ player.gold += 400; player.mats.fish = (player.mats.fish||0)+6; }, e:'Рыбаки щедро расплатились уловом и золотом.'}},
  {id:'f3', need:5, title:'Артефакт из пещеры', q:'В вашем рюкзаке оказался странный артефакт, источающий холод. Мудрецы просят отдать его на хранение, а скупщик предлагает кучу золота.',
   A:{t:'Разбить артефакт', r:'+3 к атаке. Мощь вырвется наружу.', f:()=>{ player.atk += 3; }, e:'Артефакт рассыпался, и часть его силы перетекла в ваши руки.'},
   B:{t:'Отдать мудрецам', r:'+25 к макс. здоровью и редкий предмет.', f:()=>{ player.maxHp += 25; player.hp += 25; if(player.bag.length<BAG_MAX){ const g = makeGear(5,1); player.bag.push(g); addNote('🎒 Получено: '+g.name, RAR[g.rar].c); } }, e:'Мудрецы благословили вас и подарили редкую вещь.'}}
];
function giveElix(){ const k = ELIX_KEYS[rnd(0,4)]; if(player.elix[k]<ELIX_MAX){ player.elix[k]++; addNote('⚗ Получено: '+ELIX[k].name.toLowerCase(), ELIX[k].col); } }
function forkState(){ if(!player.forks) player.forks = {}; return player.forks; }
function forkNext(){ const S = forkState(); return FORKS.find(f=>!S[f.id] && f.need<=storyStage()) || null; }
function forkTalk(n){
  const S = forkState(), f = forkNext(), done = FORKS.filter(q=>S[q.id]).length;
  if(!f){
    const left = FORKS.find(q=>!S[q.id]);
    choiceBox(n.name, done>=FORKS.length ? '— Ты прошёл все три развилки. Твой путь: «'+forkPath()+'». Дороги Эльдории помнят твои решения.' : '— Пока я ничего не прошу. Вернись, когда победишь следующего стража (жду решения: '+(done+1)+' из '+FORKS.length+').', [['Хорошо', null]]);
    return;
  }
  choiceBox(f.title, '— '+f.q, [
    [f.A.t+' ('+f.A.r+')', ()=>forkChoose(f,'A')],
    [f.B.t+' ('+f.B.r+')', ()=>forkChoose(f,'B')],
    ['Подумать', null]
  ]);
}
function forkChoose(f, k){
  const S = forkState(); if(S[f.id]) return;
  S[f.id] = k; f[k].f(); bump('forks'); SFX.play('levelup');
  addNote('⚖ Решение принято: '+f[k].t, '#ffd34a'); addNote(f[k].e, '#e0c96a'); achCheck(); saveGame();
}
function forkPath(){
  const S = forkState(), a = Object.values(S).filter(v=>v==='A').length, b = Object.values(S).filter(v=>v==='B').length;
  return a>b ? 'Милосердный' : b>a ? 'Расчётливый' : 'Равновесие';
}
function renderForkSection(){
  const S = forkState();
  jHead('Решения героя');
  const lines = FORKS.map(f=>S[f.id] ? '✔ '+f.title+': '+f[S[f.id]].t : '… '+f.title+(f.need<=storyStage() ? ' — ждёт вашего решения у Хранителя дорог в городе' : ' — откроется после стража №'+f.need));
  jRow('Путь героя: '+(Object.keys(S).length ? forkPath() : 'не выбран'), lines.join('\n'), []);
}
function ensureForkNpc(wd){
  const T = wd.town; if(!T) return; const N = npcsOf(T);
  if(!N.some(n=>n.fn==='fork')) N.push({sid:'_meta', fn:'fork', role:'npc', name:'Хранитель дорог Эйрин', col:'#4a6a9a', x:23*TILE+4, y:27*TILE+8, w:14, h:14, face:1});
}

// ---------- 8. подводный и небесный уровни ----------
function genOpen(W, H, ex, pocket){
  const grid = makeGrid(W,H,'#'); for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++) grid[y][x] = '.';
  grid[H-2][ex] = '<'; return grid;
}
function connectedAll(grid, W, H, sx, sy){
  const seen = floodFrom(grid, sx, sy, '#B~^S'); let floor = 0, got = 0;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(grid[y][x]!=='#'){ floor++; if(seen[x+y*W]) got++; }
  return floor===got;
}
function placeEnemiesOn(L, roster, n, lv, keepOut){
  const T = TILE; let tries = 0;
  while(n>0 && tries++<500){
    const x = rnd(2, L.width-3), y = rnd(2, L.height-3);
    if(L.grid[y][x]!=='.' || Math.hypot(x-keepOut.x, y-keepOut.y)<7) continue;
    if(L.enemies.some(e=>Math.hypot(e.x/T-x, e.y/T-y)<2.5)) continue;
    L.enemies.push(makeEnemy(roster[rnd(0,roster.length-1)], x*T+3, y*T+3, lv)); n--;
  }
}
function generateDeep(){
  const W = 28, H = 19, ex = 14, T = TILE, grid = genOpen(W,H,ex);
  const L = { type:'dungeon', level:4, pal:13, deep:true, title:'Жемчужный Провал', secrets:true, noRespawn:true, reqStage:2, reqText:'Пучина слишком опасна: сначала победите второго стража.',
    grid, width:W, height:H, enemies:[], items:[], boss:null, portal:null, spawn:{x:ex*T+5, y:(H-3)*T}, exit:{tx:ex, ty:H-2} };
  for(let k=0;k<22;k++){
    const x = rnd(2,W-4), y = rnd(2,H-5), w = rnd(1,2), h = rnd(1,2);
    if(Math.hypot(x-ex,y-(H-3))<5) continue;
    const save = []; for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++){ save.push([xx,yy,grid[yy][xx]]); grid[yy][xx] = '#'; }
    if(!connectedAll(grid,W,H,ex,H-3)) for(const [xx,yy,c] of save) grid[yy][xx] = c;
  }
  const spots = [[2,2],[W-3,2],[W>>1,2],[2,H-4],[W-3,H-4]];
  let ci = 0; for(const [x,y] of spots){ if(grid[y][x]!=='.') continue; if(ci<3){ L.items.push(mkChest(x,y,false)); ci++; } }
  L.vents = []; for(const [x,y] of [[6,6],[21,6],[8,13],[19,13],[14,9]]) if(grid[y][x]==='.') L.vents.push({x:x*T+16, y:y*T+16});
  placeEnemiesOn(L, ['slime','spider','cobra','scorpion'], 10, 4, {x:ex,y:H-3});
  return L;
}
function generateSky(){
  const W = 32, H = 22, T = TILE, grid = makeGrid(W,H,'#'), isl = [[16,18,3],[7,14,3],[24,13,3],[14,8,3],[6,4,3],[25,4,3]];
  const carve = (x,y)=>{ if(x>0&&y>0&&x<W-1&&y<H-1) grid[y][x] = '.'; };
  for(const [cx,cy,r] of isl) for(let y=-r-1;y<=r+1;y++) for(let x=-r-1;x<=r+1;x++) if(x*x+y*y<=r*r+1) carve(cx+x,cy+y);
  const bridge = (a,b)=>{ let [x,y] = [a[0],a[1]]; while(x!==b[0]){ x += Math.sign(b[0]-x); carve(x,y); carve(x,y+1); } while(y!==b[1]){ y += Math.sign(b[1]-y); carve(x,y); carve(x+1,y); } };
  bridge(isl[0],isl[1]); bridge(isl[0],isl[2]); bridge(isl[1],isl[3]); bridge(isl[2],isl[3]); bridge(isl[3],isl[4]); bridge(isl[3],isl[5]);
  const ex = 16, ey = 20; grid[ey][ex] = '<'; carve(ex-1,ey); carve(ex+1,ey); carve(ex,ey-1);
  const L = { type:'dungeon', level:6, pal:14, sky:true, title:'Небесные Террасы', secrets:true, noRespawn:true, reqStage:4, reqText:'Ветра Террас сметут слабого: сначала победите четвёртого стража.',
    grid, width:W, height:H, enemies:[], items:[], boss:null, portal:null, spawn:{x:ex*T+5, y:(ey-1)*T}, exit:{tx:ex, ty:ey} };
  for(const [x,y] of [[5,3],[26,3],[14,7]]) L.items.push(mkChest(x,y,false));
  placeEnemiesOn(L, ['bat','imp','frostwraith','wraith'], 11, 6, {x:ex,y:ey-1});
  for(const e of L.enemies) if(!connectedAll(grid,W,H,ex,ey-1)) e.hp = 0;
  return L;
}
function ensureAirWater(w){
  const ow = w.overworld;
  for(const [id,gen] of [['deep',generateDeep],['sky',generateSky]]){
    if(!w[id]) w[id] = gen();
    if(ow && !ow.entrances.some(e=>e.dungeon===id)) placeSecretEntrance(ow, id);
  }
}
function entranceGate(id){
  const d = world[id]; if(d && d.reqStage && storyStage()<d.reqStage){ addNote('🚫 '+d.reqText, '#e07f7f'); SFX.play('deny'); transitionCooldown = 2500; return true; }
  return false;
}
function placesTickB(dt){
  const ms = dt*1000;
  if(loc.deep && gameState==='playing'){
    let near = false; for(const v of (loc.vents||[])) if(Math.hypot(player.x+player.w/2-v.x, player.y+player.h/2-v.y)<46) near = true;
    airT = near ? Math.min(AIR_MAX, airT+dt*24) : Math.max(0, airT-dt);
    if(airT<=0){ airTick1 -= dt; if(airTick1<=0){ airTick1 = 1; hurtPlayer(Math.max(4, Math.round(player.maxHp*0.06))); addNote('🫧 Нечем дышать! Найдите пузырьки воздуха', '#e07f7f'); } }
    else airTick1 = 0;
  } else airT = AIR_MAX;
  if(loc.sky && gameState==='playing'){
    gustCd -= dt;
    if(!gust && gustCd<=0){ const d = [[1,0],[-1,0],[0,1],[0,-1]][rnd(0,3)]; gust = {dx:d[0], dy:d[1], warn:900, t:1500}; addNote('💨 Порыв ветра!', '#cfe8ff'); }
    if(gust){
      if(gust.warn>0) gust.warn -= ms;
      else { gust.t -= ms; tryMove(player, gust.dx*130*dt, gust.dy*130*dt, loc); if(gust.t<=0){ gust = null; gustCd = 6+Math.random()*4; } }
    }
    skyBoltCd -= dt;
    if(skyBoltCd<=0){ skyBoltCd = 5+Math.random()*3; skyBolts.push({x:player.x+player.w/2+rnd(-30,30), y:player.y+player.h/2+rnd(-30,30), t:1300}); }
    for(let i=skyBolts.length-1;i>=0;i--){
      const b = skyBolts[i]; b.t -= ms;
      if(b.t<=0){
        burst(b.x, b.y, 18, {colors:['#ffffff','#ffe27a','#9ad0ff'], sp:140, up:30, g:0, life:420, size:3}); shakeT = Math.max(shakeT, 120); SFX.play('boss');
        if(Math.hypot(player.x+player.w/2-b.x, player.y+player.h/2-b.y)<38) hurtPlayer(14+player.level);
        skyBolts.splice(i,1);
      }
    }
  } else { gust = null; skyBolts.length = 0; }
}
function drawPlaces(camX, camY){
  const t = Date.now()/1000, cw = canvas.width, ch = canvas.height;
  if(loc.deep){
    for(const v of (loc.vents||[])){
      const x = v.x-camX, y = v.y-camY; if(!onScreen(x-40,y-80,80,120)) continue;
      ctx.fillStyle = 'rgba(160,230,255,0.18)'; ctx.beginPath(); ctx.arc(x,y,46,0,6.283); ctx.fill();
      for(let k=0;k<6;k++){ const p = (t*0.5+k/6)%1; ctx.fillStyle = 'rgba(220,250,255,'+(0.8*(1-p))+')'; ctx.beginPath(); ctx.arc(x+Math.sin(k*2.1+t*2)*8, y+8-p*60, 2+k%3, 0, 6.283); ctx.fill(); }
    }
    ctx.fillStyle = 'rgba(20,90,150,0.28)'; ctx.fillRect(0,0,cw,ch);
    for(let k=0;k<14;k++){ const p = (t*0.12+k*0.071)%1, x = (k*97+Math.sin(t+k)*14)%cw, y = ch-p*ch; ctx.fillStyle = 'rgba(210,245,255,0.35)'; ctx.beginPath(); ctx.arc(x,y,1.5+k%3,0,6.283); ctx.fill(); }
  }
  if(loc.sky){
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0,0,cw,ch);
    for(let k=0;k<7;k++){ const x = ((t*(14+k*5)+k*170)%(cw+240))-120, y = (k*83)%ch; ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x,y,70,16,0,0,6.283); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+26,y-9,40,13,0,0,6.283); ctx.fill(); }
    if(gust){ ctx.strokeStyle = 'rgba(255,255,255,'+(gust.warn>0 ? 0.25 : 0.55)+')'; ctx.lineWidth = 2; for(let k=0;k<16;k++){ const x = (k*61+t*(gust.dx*500))%cw, y = (k*47+t*(gust.dy*500))%ch, X = (x+cw)%cw, Y = (y+ch)%ch; ctx.beginPath(); ctx.moveTo(X,Y); ctx.lineTo(X+gust.dx*34, Y+gust.dy*34); ctx.stroke(); } }
    for(const b of skyBolts){ const x = b.x-camX, y = b.y-camY, p = 1-b.t/1300; ctx.strokeStyle = 'rgba(255,230,120,'+(0.4+0.5*p)+')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x,y,38,0,6.283); ctx.stroke(); ctx.fillStyle = 'rgba(255,240,150,'+(0.1+0.25*p)+')'; ctx.beginPath(); ctx.arc(x,y,38*p,0,6.283); ctx.fill(); }
  }
}
function drawPlacesHUD(){
  if(gameState!=='playing' || !loc.deep) return;
  const w = 160, x = canvas.width/2-w/2, y = 96; ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x-2,y-2,w+4,12); ctx.fillStyle = airT>10 ? '#7ad8ff' : '#ff6a6a'; ctx.fillRect(x,y,w*airT/AIR_MAX,8);
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; const s = '🫧 Воздух: '+Math.ceil(airT)+' с'; ctx.strokeText(s, canvas.width/2, y+22); ctx.fillText(s, canvas.width/2, y+22); ctx.restore();
}

// ---------- 9. сезонные праздники ----------
const FEST_DEF = {
  spring:{ico:'🌸', n:'Фестиваль цветов', d:'Соберите все цветы на поляне', ms:150000, bit:1},
  summer:{ico:'☀', n:'Жаркий полдень',   d:'Одолейте солнечных гостей (враги, ×3 золота)', ms:120000, bit:2},
  autumn:{ico:'🎃', n:'Жатва',           d:'Разбейте все тыквы ударом', ms:150000, bit:4},
  winter:{ico:'❄', n:'Ледяной дух',      d:'Победите ледяного духа', ms:150000, bit:8}
};
function festStart(){
  if(!loc || currentLocId!=='overworld' || loc.arena) return false;
  const id = seasonId(), D = FEST_DEF[id], c = pickEventSpot(); if(!D || !c){ festCd = 10; return false; }
  const cx = (c[0]+0.5)*TILE, cy = (c[1]+0.5)*TILE, lv = Math.min(4, 1+Math.floor(player.level/5));
  fest = {id, t:D.ms, items:[], mobs:[], total:0, got:0, cx, cy};
  const spot = (w,r0,r1)=>freeSpotAround(cx, cy, w, w, r0, r1, 80);
  if(id==='spring' || id==='autumn'){
    const n = id==='spring' ? 8 : 6;
    for(let i=0;i<n;i++){ const p = spot(16,30,190); if(p) fest.items.push({x:p.x, y:p.y, w:16, h:16, ph:Math.random()*6}); }
    fest.total = fest.items.length;
  } else if(id==='summer'){
    const roster = LEVEL_ROSTER[0] || ['wolf'];
    for(let i=0;i<6;i++){ const ty = roster[rnd(0,roster.length-1)], sz = ENEMY_BASE[ty].size, p = spot(sz,60,200); if(!p) continue; const e = makeEnemy(ty,p.x,p.y,lv); e.fest = true; e.aggro = 1200; e.gold = (e.gold||2)*3; loc.enemies.push(e); fest.mobs.push(e); }
    fest.total = fest.mobs.length;
  } else {
    const p = spot(24,60,200) || {x:cx, y:cy}, e = makeEnemy('frostwraith', p.x, p.y, lv);
    e.hp *= 5; e.maxHp *= 5; e.dmg = Math.round(e.dmg*0.8); e.xp *= 4; e.gold = (e.gold||10)*6; e.fest = true; e.aggro = 1400; loc.enemies.push(e); fest.mobs.push(e); fest.total = 1;
  }
  if(!fest.total){ fest = null; festCd = 10; return false; }
  addNote(D.ico+' '+D.n+'! '+D.d+' — на карте отмечено стрелкой', '#ffd34a'); SFX.play('levelup');
  return true;
}
function festEnd(ok){
  const D = FEST_DEF[fest.id], id = fest.id; const hadMobs = fest.mobs.slice(); fest = null; festCd = 150+Math.random()*120;
  for(const e of hadMobs) if(e.hp>0 && loc) loc.enemies = loc.enemies.filter(q=>q!==e);
  if(!ok){ addNote(D.ico+' '+D.n+' закончился', '#c8c8c8'); return; }
  let txt = '';
  if(id==='spring'){ player.gold += 120; giveElix(); player.buff.might = Math.max(player.buff.might||0, ELIX.might.dur); txt = '+120 ◆, эликсир и благословение силы'; }
  else if(id==='summer'){ player.gold += 160; player.mats.crystal = (player.mats.crystal||0)+1; txt = '+160 ◆ и кристалл'; }
  else if(id==='autumn'){ player.gold += 100; player.mats.herb = (player.mats.herb||0)+3; player.potions += 2; txt = '+100 ◆, 3 травы и 2 эликсира здоровья'; }
  else { player.gold += 250; if(player.bag.length<BAG_MAX){ const g = makeGear(5,1); player.bag.push(g); txt = '+250 ◆ и «'+g.name+'»'; } else txt = '+250 ◆ (рюкзак полон)'; }
  player.stat.fest = (player.stat.fest||0)+1; player.stat.festMask = (player.stat.festMask||0)|D.bit;
  addNote(D.ico+' '+D.n+' пройден! '+txt, '#ffd34a'); SFX.play('levelup'); achCheck(); saveGame();
}
function festKill(e){ if(!fest || !e.fest) return; fest.mobs = fest.mobs.filter(q=>q!==e); fest.got++; if(!fest.mobs.length) festEnd(true); }
function festTick(dt){
  if(currentLocId!=='overworld' || gameState!=='playing') return;
  if(!fest){ festCd -= dt; if(festCd<=0 && !(player.fx && player.fx.freeze>0)) festStart(); return; }
  fest.t -= dt*1000; if(fest.t<=0){ festEnd(false); return; }
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  if(fest.id==='spring'){
    fest.items = fest.items.filter(it=>{ if(Math.hypot(it.x+8-pcx, it.y+8-pcy)<24){ fest.got++; SFX.play('pickup'); burst(it.x+8,it.y+8,8,{colors:['#ffb3d9','#fff','#ffe27a'],sp:70,up:20,g:-20,life:500,size:2.6}); return false; } return true; });
    if(!fest.items.length) festEnd(true);
  } else if(fest.id==='autumn' && player.attacking){
    const h = attackHitbox(1.4);
    fest.items = fest.items.filter(it=>{ if(overlap(it,h) || Math.hypot(it.x+8-pcx, it.y+8-pcy)<30){ fest.got++; SFX.play('hit'); burst(it.x+8,it.y+8,12,{colors:['#ff9a2a','#ffd34a','#6a4a1a'],sp:90,up:30,g:120,life:520,size:2.8}); if(Math.random()<0.5) player.gold += 8; return false; } return true; });
    if(!fest.items.length) festEnd(true);
  }
}
function drawFest(camX, camY){
  if(!fest || currentLocId!=='overworld') return;
  const D = FEST_DEF[fest.id], t = Date.now()/1000;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '20px serif';
  for(const it of fest.items){
    const x = it.x+8-camX, y = it.y+8-camY; if(!onScreen(x-20,y-24,40,44)) continue;
    const bob = Math.sin(t*3+it.ph)*2;
    ctx.fillStyle = 'rgba(255,230,120,'+(0.18+0.12*Math.sin(t*4+it.ph))+')'; ctx.beginPath(); ctx.arc(x,y,16,0,6.283); ctx.fill();
    ctx.fillText(D.ico, x, y+bob);
  }
  ctx.restore();
  if(festFlash>0) festFlash = 0;
}
function festTarget(){
  if(!fest) return null; let best = null, bd = 1e9; const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  const pts = fest.items.map(i=>[i.x+8,i.y+8]).concat(fest.mobs.filter(e=>e.hp>0).map(e=>[e.x+e.w/2,e.y+e.h/2]));
  for(const p of pts){ const d = Math.hypot(p[0]-pcx,p[1]-pcy); if(d<bd){ bd = d; best = p; } }
  return best ? {x:best[0], y:best[1], d:bd} : null;
}
function drawFestHUD(){
  if(!fest || gameState!=='playing' || currentLocId!=='overworld') return;
  const D = FEST_DEF[fest.id], W = canvas.width, left = Math.ceil(fest.t/1000), prog = fest.id==='winter' ? '' : ' '+fest.got+'/'+fest.total;
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 13px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.fillStyle = '#ffe9a0';
  const s = D.ico+' '+D.n+prog+' • '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0'); ctx.strokeText(s, W/2, 160); ctx.fillText(s, W/2, 160);
  const tg = festTarget();
  if(tg){
    const pcx = player.x+player.w/2, pcy = player.y+player.h/2, a = Math.atan2(tg.y-pcy, tg.x-pcx);
    if(tg.d>150){ const r = 70, x = W/2+Math.cos(a)*r, y = canvas.height/2+Math.sin(a)*r; ctx.translate(x,y); ctx.rotate(a); ctx.fillStyle = '#ffd34a'; ctx.strokeStyle = '#2a1a06'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-6,-7); ctx.lineTo(-3,0); ctx.lineTo(-6,7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
function tickE(dt){ placesTickB(dt); festTick(dt); }
function enterE(){ if(fest){ fest = null; festCd = 30; } skyBolts.length = 0; gust = null; airT = AIR_MAX; }
ACH.push(
  {id:'deep',  i:'🫧', n:'Покоритель глубин', d:'Дойти до сундука в Жемчужном Провале.', g:200, t:()=>!!(world.deep && world.deep.items.some(i=>i.type==='chest' && i.open))},
  {id:'sky',   i:'☁', n:'Покоритель небес',  d:'Дойти до сундука в Небесных Террасах.', g:250, t:()=>!!(world.sky && world.sky.items.some(i=>i.type==='chest' && i.open))},
  {id:'forks', i:'⚖', n:'Хозяин судьбы',     d:'Принять решение на всех трёх развилках сюжета.', g:250, t:()=>Object.keys(player.forks||{}).length>=3, p:()=>[Object.keys(player.forks||{}).length,3]},
  {id:'fest1', i:'🎉', n:'Душа праздника',    d:'Пройти сезонный праздник.', g:80, t:()=>(player.stat.fest||0)>=1},
  {id:'fest4', i:'🎊', n:'Круглый год',       d:'Пройти праздники всех четырёх сезонов.', g:400, t:()=>((player.stat.festMask||0)&15)===15}
);
