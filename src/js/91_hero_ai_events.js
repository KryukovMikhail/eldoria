// ---------- Кузнец ----------
const FORGE_MAX = 5, ENCH_COST = 160;
function forgeCost(id, lvl){ const base = WEAPONS[id].price||40; return Math.round((base*0.6+40)*(lvl+1)*1.3); }
function renderForge(){
  for(const id of Object.keys(WEAPONS)){
    if(!player.owned[id]) continue;
    const W = WEAPONS[id], lvl = player.wLvl[id]||0, en = player.ench[id];
    const cost = forgeCost(id,lvl);
    const up = shopButton(lvl>=FORGE_MAX ? 'Максимум' : 'Улучшить — '+cost+' ◆', ()=>{
      if(player.gold<cost){ renderShop('Не хватает золота: нужно '+cost+', у вас '+player.gold+'.'); return; }
      player.gold -= cost; player.wLvl[id] = lvl+1; saveGame(); renderShop(W.name+' улучшено до +'+(lvl+1)+'.');
    }, lvl>=FORGE_MAX);
    shopRow(W.name+(lvl ? ' +'+lvl : ''), `Каждый уровень даёт +12% урона (сейчас +${lvl*12}%, максимум +${FORGE_MAX*12}%).`, [up]);
    const btns = Object.keys(ENCH).map(k=>shopButton(ENCH[k].icon+' '+ENCH_COST, ()=>{
      if(player.gold<ENCH_COST){ renderShop('Не хватает золота: нужно '+ENCH_COST+', у вас '+player.gold+'.'); return; }
      player.gold -= ENCH_COST; player.ench[id] = k; saveGame(); renderShop(W.name+' зачаровано: '+ENCH[k].n+'.');
    }, en===k));
    shopRow('Зачарование: '+W.name, en ? 'Сейчас: '+ENCH[en].n+' — '+ENCH[en].desc+'.' : '🔥 огонь — поджигает; ❄ лёд — замедляет; ☠ яд — отравляет. Новое зачарование заменяет старое.', btns);
  }
}

// ======================= Бой, мир, сложность, звук (v2) =======================
// ---------- Сложность ----------
const DIFFS = {
  easy:   {name:'Лёгкая',     dmg:0.6,  hp:0.75, reward:0.9,  spd:1,    desc:'Враги слабее и бьют мягче.'},
  normal: {name:'Нормальная', dmg:1,    hp:1,    reward:1,    spd:1,    desc:''},
  hard:   {name:'Трудная',    dmg:1.8,  hp:1.6,  reward:1.3,  spd:1.06, desc:'Враги крепче, быстрее и бьют почти вдвое сильнее, награда выше.'},
  nightmare:{name:'Кошмар',   dmg:3,    hp:3.2,  reward:1.9,  spd:1.16, desc:'Для тех, кому мало. Враги втрое крепче, быстрее и бьют в три раза сильнее — ошибки не прощаются.'}
};
let difficulty = 'normal';
try{ const d = localStorage.getItem('eldoria_diff'); if(DIFFS[d]) difficulty = d; }catch(e){}
function diffMul(k){ return DIFFS[difficulty][k]; }
function setDifficulty(d){ if(!DIFFS[d]) return; difficulty = d; try{ localStorage.setItem('eldoria_diff', d); }catch(e){} renderDiff(); }
function renderDiff(){
  const locked = hasActiveGame && gameState!=='dead' && gameState!=='won';
  for(const [bid,did] of [['diffBtns','diffDesc'],['diffBtns2','diffDesc2'],['diffBtns3','diffDesc3']]){
    const box = document.getElementById(bid); if(!box) continue;
    box.innerHTML = '';
    for(const id of Object.keys(DIFFS)){
      const b = document.createElement('button'); b.className = 'tabBtn'+(difficulty===id ? ' active' : ''); b.textContent = DIFFS[id].name;
      b.disabled = locked && difficulty!==id; if(b.disabled) b.style.opacity = '.45';
      b.addEventListener('click', ()=>{ if(!locked) setDifficulty(id); });
      box.appendChild(b);
    }
    document.getElementById(did).textContent = locked ? 'Уровень сложности можно выбрать только при запуске новой игры' : DIFFS[difficulty].desc;
  }
}

// ---------- Видимость и поиск пути ----------
const LOS_BLOCK = new Set(['#','^','S','B']);
function hasLOS(x1,y1,x2,y2){
  const d = Math.hypot(x2-x1,y2-y1), n = Math.ceil(d/8);
  for(let i=1;i<n;i++){
    const t = i/n, tx = Math.floor((x1+(x2-x1)*t)/TILE), ty = Math.floor((y1+(y2-y1)*t)/TILE);
    if(tx<0||ty<0||tx>=loc.width||ty>=loc.height) return false;
    if(LOS_BLOCK.has(loc.grid[ty][tx])) return false;
  }
  return true;
}
function bfsDist(tx,ty,maxD){
  const W = loc.width, H = loc.height, dist = new Int16Array(W*H).fill(-1), bl = blockedTiles(loc.type);
  if(tx<0||ty<0||tx>=W||ty>=H) return dist;
  const q = [tx+ty*W]; dist[tx+ty*W] = 0;
  for(let h=0; h<q.length; h++){
    const c = q[h], x = c%W, y = (c/W)|0, d = dist[c]; if(d>=maxD) continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x+dx, ny = y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue;
      const k = nx+ny*W; if(dist[k]>=0 || bl.has(loc.grid[ny][nx])) continue;
      dist[k] = d+1; q.push(k);
    }
  }
  return dist;
}
const flow = {loc:null, t:0, dist:null};
function updateFlow(dt){
  flow.t -= dt;
  if(flow.t>0 && flow.loc===loc) return;
  flow.t = 0.35; flow.loc = loc;
  flow.dist = bfsDist(Math.floor((player.x+player.w/2)/TILE), Math.floor((player.y+player.h/2)/TILE), 60);
}
// направление к игроку в обход стен (по полю расстояний)
function flowDir(e){
  const W = loc.width, D = flow.dist; if(!D) return null;
  const tx = Math.floor((e.x+e.w/2)/TILE), ty = Math.floor((e.y+e.h/2)/TILE);
  if(tx<0||ty<0||tx>=W||ty>=loc.height) return null;
  const cur = D[tx+ty*W]; if(cur<0) return null;
  let best = null, bd = cur;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const nx = tx+dx, ny = ty+dy; if(nx<0||ny<0||nx>=W||ny>=loc.height) continue;
    const d = D[nx+ny*W]; if(d<0 || d>=bd) continue;
    if(dx&&dy && (D[(tx+dx)+ty*W]<0 || D[tx+(ty+dy)*W]<0)) continue;   // по диагонали — только если оба соседа свободны
    bd = d; best = [nx,ny];
  }
  if(!best) return null;
  const px = (best[0]+0.5)*TILE-(e.x+e.w/2), py = (best[1]+0.5)*TILE-(e.y+e.h/2), l = Math.hypot(px,py)||1;
  return [px/l, py/l];
}
// если крупный враг оказался «вмурован» в стену — выталкиваем на ближайшее свободное место
function unstick(e){
  if(!isBlocked(loc,e.x,e.y,e.w,e.h)) return;
  const tx0 = Math.floor((e.x+e.w/2)/TILE), ty0 = Math.floor((e.y+e.h/2)/TILE);
  for(let r=0;r<=14;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
    const nx = (tx0+dx)*TILE+TILE/2-e.w/2, ny = (ty0+dy)*TILE+TILE/2-e.h/2;
    if(!isBlocked(loc,nx,ny,e.w,e.h)){ e.x = nx; e.y = ny; return; }
  }
}

// ---------- Урон: ближе — больнее; сильный удар при удержании ----------
function distMul(d){ return 1.45 - 0.7*clamp((d-14)/34,0,1); }          // вплотную ×1.45, на краю удара ×0.75
const CHARGE_MS = 700;
function meleeStrike(hb, mult, push){
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(const e of loc.enemies){
    if(e.hp<=0 || !overlap(hb,e)) continue;
    const ex = e.x+e.w/2, ey = e.y+e.h/2;
    if(!hasLOS(pcx,pcy,ex,ey)) continue;                                // через деревья и стены бить нельзя
    const d = Math.hypot(ex-pcx,ey-pcy), dm = distMul(d);
    damageEnemy(e, Math.round(playerDamage()*mult*dm));
    SFX.play('hit');
    burst(ex,ey,dm>1.25 ? 9 : 5,{colors:dm>1.25?['#ffffff','#ffe28a','#ff9a3a']:['#fff6c8','#ffd34a','#ffffff'], sp:90, up:20, g:200, life:260, size:dm>1.25?2.4:1.8});
    const l = d||1; tryPush(e, (ex-pcx)/l*push, (ey-pcy)/l*push, loc);
    if(e.hp<=0) killEnemy(e);
  }
}
function heavyAttack(){
  const W = WEAPONS[player.weapon];
  player.attackTimer = Math.round(W.cooldown*1.7);
  player.attacking = true; setTimeout(()=>{ player.attacking=false; }, 260);
  SFX.play(WEAPON_SFX[player.weapon] || 'swing'); SFX.play('boss');
  if(W.ranged){ fireArrow(true); return; }
  const hb = attackHitbox(1.6);
  player.heavyFx = 340; player.heavyAt = {x:hb.x+hb.w/2, y:hb.y+hb.h/2};
  shakeT = Math.max(shakeT, 180);
  meleeStrike(hb, 2.3, 34);
  burst(hb.x+hb.w/2, hb.y+hb.h/2, 16, {colors:['#fff6c8','#ffd34a','#ff9a3a'], sp:150, up:10, g:60, life:380, size:2.6});
}
function drawChargeFx(sx,sy){
  const cx = sx+player.w/2, cy = sy+player.h/2, t = Date.now()/1000;
  if(player.chargeT>200){
    const p = Math.min(1, player.chargeT/CHARGE_MS), ready = p>=1;
    ctx.strokeStyle = ready ? 'rgba(255,255,255,'+(0.7+0.3*Math.sin(t*20))+')' : 'rgba(255,211,74,0.9)';
    ctx.lineWidth = ready ? 4 : 3; ctx.beginPath(); ctx.arc(cx,cy,19,-Math.PI/2,-Math.PI/2+6.283*p); ctx.stroke();
    if(ready){ ctx.fillStyle = 'rgba(255,220,120,'+(0.18+0.1*Math.sin(t*20))+')'; ctx.beginPath(); ctx.arc(cx,cy,24,0,6.283); ctx.fill(); }
  }
  if(player.heavyFx>0 && player.heavyAt){
    const p = 1-player.heavyFx/340, hx = player.heavyAt.x-player.x-player.w/2+cx, hy = player.heavyAt.y-player.y-player.h/2+cy;
    ctx.strokeStyle = 'rgba(255,230,150,'+(1-p)+')'; ctx.lineWidth = 3+6*(1-p); ctx.beginPath(); ctx.arc(hx,hy,12+34*p,0,6.283); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,'+(0.8*(1-p))+')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx,hy,6+22*p,0,6.283); ctx.stroke();
  }
}

// ---------- Новые враги, когда прежних перебили ----------
const LEVEL_ROSTER = {
  0:['wolf','wolf','boar','bandit','ram'],
  1:['slime','slime','bat','spider','skeleton','giantrat','giantrat','gelcube','gelcube'], 2:['skeleton','skeleton','zombie','spider','webspider','bat','slime','gelcube','vampbat'],
  3:['wraith','wraith','darkknight','webspider','skeleton','zombie','gargoyle','gargoyle','shieldbearer','necromancer','vampbat'], 4:['imp','lavaslime','lavaslime','golem','imp','salamander','salamander','cinderhound','cinderhound','pyromancer','emberbomb','emberbomb'],
  5:['scorpion','mummy','cobra','scorpion','mummy','cobra','vulture','vulture','dunepriest','dunepriest'], 6:['icewolf','yeti','frostwraith','icewolf','frostwraith','icegolem','frostmite','frostmite','blizzardmage','snowstalker','snowstalker'],
  7:['ghoul','banshee','zombie','darkknight','ghoul','banshee','skelarcher','skelarcher','necromancer','shieldbearer'], 8:['panther','shroom','gorilla','cobra','webspider','panther','shroom','webspider','hunter','hunter','venomtoad','venomtoad','rhino','rhino'],
  11:['darkknight','darkknight','ghoul','banshee','zombie','webspider','golem','crossbowman','crossbowman','shieldbearer','bombardier','bombardier'], 12:['wraith','banshee','ghoul','webspider','darkknight','zombie','banshee','cursedbook','cursedbook','vampbat','necromancer','bombardier']
};
const respawnTimers = new WeakMap();
let respawnAcc = 0;
function respawnTick(dt){
  respawnAcc += dt; if(respawnAcc<1) return; respawnAcc = 0;
  if(loc.safe || loc.noRespawn) return;
  const alive = loc.enemies.filter(e=>e.hp>0 && !BOSS_TYPES.includes(e.type) && !e.minion).length;
  if(alive>0){ respawnTimers.delete(loc); return; }
  let t = respawnTimers.get(loc);
  if(t===undefined){ respawnTimers.set(loc, 25); return; }
  t -= 1; if(t>0){ respawnTimers.set(loc, t); return; }
  respawnTimers.delete(loc); spawnWave();
}
function spawnWave(){
  const roster = LEVEL_ROSTER[loc.type==='overworld' ? 0 : (loc.level||1)] || ['wolf'];
  const want = loc.type==='overworld' ? 18 : loc.width>=80 ? 15 : loc.width>=56 ? 11 : 8;
  loc.enemies = loc.enemies.filter(e=>e.hp>0 || BOSS_TYPES.includes(e.type));       // чистим павших
  const W = loc.width, H = loc.height, ptx = Math.floor((player.x+player.w/2)/TILE), pty = Math.floor((player.y+player.h/2)/TILE);
  const D = bfsDist(ptx, pty, 400), bl = blockedTiles(loc.type), minD = W>=56 ? 14 : 10;
  const boss = loc.enemies.find(e=>BOSS_TYPES.includes(e.type) && e.hp>0);
  const open8 = (x,y)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const t = loc.grid[y+dy] && loc.grid[y+dy][x+dx]; if(!t || bl.has(t)) return false; } return true; };
  let made = 0;
  for(let tries=0; tries<1800 && made<want; tries++){
    const soft = tries>=900 && made<3;                           // тесная карта: смягчаем ограничения
    const x = rnd(2,W-3), y = rnd(2,H-3);
    if(loc.grid[y][x]!=='.' || D[x+y*W]<0 || (!soft && !open8(x,y))) continue;
    if(Math.hypot(x-ptx,y-pty)<(soft ? 7 : minD)) continue;
    if(loc.exit && Math.hypot(x-loc.exit.tx,y-loc.exit.ty)<(soft ? 6 : 11)) continue;
    if(loc.entrances && loc.entrances.some(en=>Math.hypot(x-en.tx,y-en.ty)<(soft ? 6 : 11))) continue;
    if(loc.shop && Math.hypot(x-loc.shop.tx,y-loc.shop.ty)<8) continue;
    if(boss && Math.hypot(x-(boss.x+boss.w/2)/TILE,y-(boss.y+boss.h/2)/TILE)<6) continue;
    loc.enemies.push(makeEnemy(roster[rnd(0,roster.length-1)], x*TILE+3, y*TILE+3, loc.level||1)); made++;
  }
  if(made) addNote('⚠ Из теней появились новые враги…', '#e0a03a');
  return made;
}

// ---------- Звук на iOS ----------
const AudioFix = {
  el:null,
  prime(){
    try{ if(navigator.audioSession){ navigator.audioSession.type = 'playback'; return; } }catch(e){}
    if(typeof isIOS!=='undefined' && !isIOS) return;
    if(this.el) { if(this.el.paused) this.el.play().catch(()=>{}); return; }
    try{                                                                // беззвучный <audio>: переводит iOS в режим «воспроизведение», звук игры больше не глушится кнопкой «Без звука»
      const n = 8000, buf = new Uint8Array(44+n), dv = new DataView(buf.buffer);
      const w = (o,s)=>{ for(let i=0;i<s.length;i++) buf[o+i] = s.charCodeAt(i); };
      w(0,'RIFF'); dv.setUint32(4,36+n,true); w(8,'WAVE'); w(12,'fmt '); dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true);
      dv.setUint32(24,8000,true); dv.setUint32(28,8000,true); dv.setUint16(32,1,true); dv.setUint16(34,8,true); w(36,'data'); dv.setUint32(40,n,true);
      buf.fill(128,44);
      const a = new Audio(URL.createObjectURL(new Blob([buf],{type:'audio/wav'})));
      a.loop = true; a.setAttribute('playsinline',''); a.preload = 'auto'; a.volume = 1;
      this.el = a; a.play().catch(()=>{});
    }catch(e){}
  }
};

renderDiff(); renderQuality();
