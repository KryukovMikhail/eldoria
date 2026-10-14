// ---------- Игровой цикл ----------
let lastTime = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now-lastTime)/1000);
  autoQualityTick(now-lastTime, gameState==='playing' && !document.hidden);
  lastTime = now;
  update(dt);
  draw();
  heroBtn.classList.toggle('hidden', gameState!=='playing' && gameState!=='hero');
  codexBtn.classList.toggle('hidden', gameState!=='playing' && gameState!=='codex');
  questBtn.classList.toggle('hidden', gameState!=='playing' && gameState!=='journal');
  requestAnimationFrame(loop);
}

const menuBtn = document.getElementById('menuBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const startScreenEl = document.getElementById('startScreen');
const resumeBtn = document.getElementById('resumeBtn');
const touchControls = document.getElementById('touchControls');
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const fsSupported = !!(gameWrap.requestFullscreen || gameWrap.webkitRequestFullscreen);
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
const isStandalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
// iPhone: Safari не умеет Fullscreen API для страниц — предлагаем запуск с иконки «Домой»
if(isIOS && !fsSupported && !isStandalone) document.getElementById('iosHint').classList.remove('hidden');
// иконка для «На экран Домой»
try{
  const c=document.createElement('canvas'); c.width=c.height=180; const g=c.getContext('2d');
  g.fillStyle='#1a140a'; g.fillRect(0,0,180,180); g.strokeStyle='#5c4415'; g.lineWidth=10; g.strokeRect(8,8,164,164);
  g.font='100px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('⚔️',90,96);
  const l=document.createElement('link'); l.rel='apple-touch-icon'; l.href=c.toDataURL('image/png'); document.head.appendChild(l);
}catch(e){}
let hasActiveGame = false;

function enterPlaying(){
  clearFx(); renderDiff();
  hasActiveGame = true;
  gameState='playing';
  startScreenEl.classList.add('hidden'); savesScreen.classList.add('hidden');
  document.getElementById('deathScreen').classList.add('hidden');
  document.getElementById('winScreen').classList.add('hidden');
  document.getElementById('shopScreen').classList.add('hidden');
  heroScreen.classList.add('hidden'); document.getElementById('codexScreen').classList.add('hidden'); document.getElementById('questScreen').classList.add('hidden'); refreshSkillUI();
  menuBtn.classList.remove('hidden');
  if(fsSupported) fullscreenBtn.classList.remove('hidden');
  if(isTouchDevice) touchControls.classList.remove('hidden');
}
function beginNewGame(){
  resetGame();
  enterPlaying();
}
function exitToMenu(){
  if(gameState!=='playing') return;
  saveGame();
  gameState='start';
  menuBtn.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
  touchControls.classList.add('hidden');
  resumeBtn.classList.toggle('hidden', !hasActiveGame);
  refreshSaveUI();
  renderDiff(); startScreenEl.classList.remove('hidden');
}
function resumeGame(){
  if(!hasActiveGame) return;
  gameState='playing';
  startScreenEl.classList.add('hidden');
  menuBtn.classList.remove('hidden');
  if(fsSupported) fullscreenBtn.classList.remove('hidden');
  if(isTouchDevice) touchControls.classList.remove('hidden');
}

// ======================= Герой: навыки, снаряжение, кузнец, бои с боссами =======================
const SKILLS = {
  dash:   { name:'Рывок',   icon:'⚡', key:'Shift', code:'ShiftLeft', desc:l=>`Быстрый бросок вперёд на ${80+24*l} px, на время рывка вы неуязвимы (${(0.25+0.1*l).toFixed(2)} с). Перезарядка ${((4500-700*l)/1000).toFixed(1)} с.` },
  spin:   { name:'Вихрь',   icon:'🌀', key:'Q', code:'KeyQ',      desc:l=>`Круговой удар по всем врагам вокруг: радиус ${58+8*l} px, урон ${Math.round((0.9+0.4*l)*100)}% от обычного. Перезарядка ${((8000-1000*l)/1000).toFixed(0)} с.` },
  shield: { name:'Щит',     icon:'🛡', key:'R', code:'KeyR',      desc:l=>`Магический щит гасит 80% урона на ${(3+0.8*l).toFixed(1)} с. Перезарядка ${((18000-2000*l)/1000).toFixed(0)} с.` },
  might:  { name:'Мощь',    icon:'💪', key:'—', code:null,        desc:l=>`Пассивно: +${6*l}% к урону.` }
};
const SKILL_MAX = 3;
function resetHero(){
  player.codex = {e:{},a:{},k:{}};
  player.sp = 0; player.vkeys = 0; player.skills = {dash:0,spin:0,shield:0,might:0};
  player.gear = {helm:null,ring:null,amulet:null}; player.bag = []; player.wLvl = {}; player.ench = {};
  player.cd = {dash:0,spin:0,shield:0}; player.shield = 0; player.dashT = 0; player.dvx = 0; player.dvy = 0; player.spinFx = 0; player.spinR = 0; player.vamp = 0;
  player.elix = {big:0,speed:0,might:0,guard:0,swim:0}; player.buff = {speed:0,might:0,guard:0,swim:0}; player.slowT = 0; player.boots = false; player.fx = {freeze:0,freezeImm:0,burn:0,burnDps:0,poison:0,poisonDps:0,acc:0};
  aoes.length = 0;
  player.sb = {}; player.mats = {scrap:0,essence:0,crystal:0}; player.visited = {overworld:1}; player.track = 'main'; player.stories = {}; player.dashHit = [];
}
function gearStat(k){
  let v = 0; for(const s in player.gear){ const g = player.gear[s]; if(g && g.stats[k]) v += g.stats[k]; }
  return k==='spd' ? Math.min(30,v) : k==='vamp' ? Math.min(20,v) : v;
}
function spdNow(){ return player.speed*(1+gearStat('spd')/100)*(player.buff.speed>0 ? 1.4 : 1)*(player.slowT>0 ? 0.6 : 1)*(player.boots ? 1.18 : 1)*(onWater() ? 0.7 : 1)*weatherSpeedMul()*(fordAt(player.x+player.w/2, player.y+player.h/2) ? 0.85 : 1); }
function weaponMul(){ return 1+0.12*((player.wLvl||{})[player.weapon]||0); }

// ---------- Снаряжение ----------
const BAG_MAX = 12;
const RAR = [{n:'Обычный',c:'#c8c8c8',m:1,k:1},{n:'Редкий',c:'#4aa8ff',m:1.35,k:2},{n:'Эпический',c:'#c06aff',m:1.8,k:3}];
const GEAR_SLOTS = {
  helm:  {n:'Шлем',   names:['Шлем','Шишак','Капюшон'], pool:['hp','def','hp','dmg']},
  ring:  {n:'Кольцо', names:['Кольцо','Перстень'],      pool:['dmg','vamp','spd','dmg']},
  amulet:{n:'Амулет', names:['Амулет','Талисман'],      pool:['hp','dmg','def','vamp','spd']}
};
const STAT_INFO = {
  hp:  {base:10, per:5,   txt:v=>`+${v} к здоровью`},
  dmg: {base:4,  per:1.4, txt:v=>`+${v}% к урону`},
  def: {base:3,  per:0.9, txt:v=>`+${v}% к защите`},
  spd: {base:3,  per:0.5, txt:v=>`+${v}% к скорости`},
  vamp:{base:2,  per:0.45,txt:v=>`+${v}% урона возвращается здоровьем`}
};
const STAT_SUFFIX = {hp:'жизни', dmg:'ярости', def:'стража', spd:'ветра', vamp:'кровопийцы'};
function makeGear(L, minRar){
  L = L||0;
  let r = Math.random(); const bump = Math.min(0.15, L*0.02);
  let rar = r < 0.04+bump*0.4 ? 2 : r < 0.26+bump ? 1 : 0;
  if(minRar!==undefined) rar = Math.max(rar, minRar);
  const slot = ['helm','ring','amulet'][rnd(0,2)], S = GEAR_SLOTS[slot];
  const stats = {}, want = RAR[rar].k;
  let guard = 0;
  while(Object.keys(stats).length<want && guard++<40){
    const k = S.pool[rnd(0,S.pool.length-1)]; if(stats[k]) continue;
    const I = STAT_INFO[k], raw = (I.base+I.per*L)*RAR[rar].m*(0.85+Math.random()*0.3);
    stats[k] = k==='hp' ? Math.max(1,Math.round(raw)) : Math.round(raw*10)/10;
  }
  const first = Object.keys(stats)[0];
  return { slot, rar, L, stats, name: S.names[rnd(0,S.names.length-1)]+' '+STAT_SUFFIX[first] };
}
function gearSellPrice(g){ return Math.round((10+g.L*8)*(g.rar+1)*(g.rar+1)); }
function gearLines(g){ return Object.keys(g.stats).map(k=>STAT_INFO[k].txt(g.stats[k])).join(', '); }
function applyGearHp(g, sign){
  const h = g.stats.hp||0; if(!h) return;
  player.maxHp += sign*h; if(sign>0) player.hp += h;
  player.hp = Math.max(1, Math.min(player.hp, player.maxHp));
}
function equipGear(i){
  const g = player.bag[i]; if(!g) return false;
  const old = player.gear[g.slot];
  player.bag.splice(i,1);
  if(old){ applyGearHp(old,-1); player.bag.push(old); }
  player.gear[g.slot] = g; applyGearHp(g,1);
  return true;
}
function unequipGear(slot){
  const g = player.gear[slot]; if(!g || player.bag.length>=BAG_MAX) return false;
  applyGearHp(g,-1); player.gear[slot] = null; player.bag.push(g); return true;
}
function sellGear(i){ const g = player.bag[i]; if(!g) return 0; const p = gearSellPrice(g); player.bag.splice(i,1); player.gold += p; return p; }
function maybeDropGear(e){
  if(e.minion) return;
  const boss = BOSS_TYPES.includes(e.type) || !!e.elite;
  if(!boss && Math.random()>0.085) return;
  const g = makeGear(loc.level||0, boss ? (Math.random()<0.35 ? 2 : 1) : undefined);
  loc.items.push({type:'gear', x:e.x+e.w/2-8, y:e.y+e.h/2-8, w:16, h:16, gear:g});
}
function drawGearItem(sx,sy,g){
  const col = RAR[g.rar].c, t = Date.now()/1000, bob = Math.sin(t*3+sx*0.05)*1.5;
  if(g.rar>0){ const a = 0.18+0.1*Math.sin(t*3); const gr = ctx.createLinearGradient(0,sy-38,0,sy+8); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,col); ctx.globalAlpha = a+0.12; ctx.fillStyle = gr; ctx.fillRect(sx+3,sy-38,10,46); ctx.globalAlpha = 1; }
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(sx+8,sy+15,6,2.2,0,0,6.283); ctx.fill();
  const gl = ctx.createRadialGradient(sx+8,sy+8+bob,1,sx+8,sy+8+bob,16); gl.addColorStop(0,col); gl.addColorStop(1,'rgba(0,0,0,0)'); ctx.globalAlpha = 0.45; ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sx+8,sy+8+bob,16,0,6.283); ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(sx+8,sy+8+bob); ctx.lineWidth = 1.6; ctx.strokeStyle = '#1a1208'; ctx.fillStyle = col;
  if(g.slot==='helm'){ ctx.beginPath(); ctx.arc(0,1,6.5,Math.PI,0); ctx.lineTo(6.5,6); ctx.lineTo(-6.5,6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(-4,-3,3,2); }
  else if(g.slot==='ring'){ ctx.beginPath(); ctx.arc(0,1,5.5,0,6.283); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#1a1208'; ctx.beginPath(); ctx.arc(0,1,7.1,0,6.283); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0,-5,2.6,0,6.283); ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(6,0); ctx.lineTo(0,8); ctx.lineTo(-6,0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillRect(-1.5,-5,3,4); }
  ctx.restore();
}

// ---------- Урон по врагам: единая точка (вампиризм, зачарования) ----------
const ENCH = {
  fire:  {n:'Огонь', icon:'🔥', col:['#ff9a2a','#ffd34a','#ff4a1a'], desc:'поджигает врага: 60% урона удара за 3 с'},
  frost: {n:'Лёд',   icon:'❄',  col:['#bfeaff','#7ad4ff','#ffffff'], desc:'замедляет врага на 2,5 с'},
  venom: {n:'Яд',    icon:'☠',  col:['#b8e84a','#7ac22a','#f4ffd0'], desc:'отравляет: 80% урона удара за 5 с'}
};
function damageEnemy(e, dmg){
  if(player.sb && player.sb.might==='a' && Math.random()<0.12){ dmg *= 2; burst(e.x+e.w/2, e.y+e.h/2, 8, {colors:['#ffd34a','#ffffff','#ff7a2a'], sp:120, up:30, g:100, life:380, size:2.4}); }
  const raw = dmg; dmg = dmg/diffMul('hp');
  if(guardBlocks(e)){
    dmg *= 0.25; e.ai.gf = 220; burst(e.x+e.w/2+Math.cos(e.ai.g)*12, e.y+e.h/2+Math.sin(e.ai.g)*9, 5, {colors:['#ffffff','#cfd8e8','#ffd34a'], sp:90, up:20, g:60, life:300, size:2});
    SFX.play('clang');
    if(!guardHint){ guardHint = true; addNote('🛡 Щит гасит удар — заходите сбоку и со спины или отскочите рывком', '#9ad0ff'); }
  }
  e.hp -= dmg; e.hitFlash = 150;
  const v = gearStat('vamp');
  if(v>0){ player.vamp = (player.vamp||0)+raw*v/100; const h = Math.floor(player.vamp); if(h>=1){ player.vamp -= h; player.hp = Math.min(player.maxHp, player.hp+h); } }
  const en = (player.ench||{})[player.weapon];
  if(en && e.hp>0){
    const d = ENCH[en];
    if(en==='fire') e.dot = {t:3000, dps:dmg*0.6/3, col:d.col, fire:true};
    else if(en==='venom') e.dot = {t:5000, dps:dmg*0.8/5, col:d.col};
    else e.slow = 2500, e.slowCol = d.col;
    burst(e.x+e.w/2, e.y+e.h/2, 4, {colors:d.col, sp:60, up:20, g:-30, life:420, size:2.2});
  }
}

// ---------- Навыки ----------
const aoes = [];
const skillLatch = {dash:false, spin:false, shield:false};
function useSkill(name, mx, my){
  const lvl = player.skills[name]; if(!lvl || player.cd[name]>0) return false;
  if(name==='dash'){
    let dx = mx, dy = my;
    if(!dx && !dy){ dx = player.dir==='left'?-1:player.dir==='right'?1:0; dy = player.dir==='up'?-1:player.dir==='down'?1:0; }
    const l = Math.hypot(dx,dy)||1, dB = player.sb.dash==='b', dist = (80+24*lvl)*(dB?1.25:1), T = 0.16;
    player.dashHit = [];
    player.dvx = dx/l*dist/T; player.dvy = dy/l*dist/T; player.dashT = T*1000;
    player.invuln = Math.max(player.invuln, 250+100*lvl);
    player.cd.dash = (4500-700*lvl)*(dB?0.7:1); SFX.play('swing');
  } else if(name==='spin'){
    const sA = player.sb.spin==='a', sB = player.sb.spin==='b', R = (58+8*lvl)*(sA?1.35:1), mult = 0.9+0.4*lvl, pcx = player.x+player.w/2, pcy = player.y+player.h/2; let healed = 0;
    breakPropsRadius(pcx, pcy, R); player.spinFx = 380; player.spinR = R; player.cd.spin = 8000-1000*lvl; SFX.play('swing');
    for(const e of loc.enemies){
      if(e.hp<=0) continue;
      const ex = e.x+e.w/2, ey = e.y+e.h/2, d = Math.hypot(ex-pcx,ey-pcy);
      if(d > R+e.w/2) continue;
      damageEnemy(e, Math.round(playerDamage()*mult));
      SFX.play('hit'); burst(ex,ey,5,{colors:['#fff6c8','#ffd34a','#ffffff'],sp:90,up:20,g:200,life:260,size:1.8});
      const l = d||1; tryPush(e, (ex-pcx)/l*(sA?40:22), (ey-pcy)/l*(sA?40:22), loc);
      if(sB && healed<4){ healed++; player.hp = Math.min(player.maxHp, player.hp+player.maxHp*0.04); burst(pcx,pcy,3,{colors:['#d02a4a','#ff7a8a'],sp:50,up:40,g:-40,life:450,size:2.2}); }
      if(e.hp<=0) killEnemy(e);
    }
  } else if(name==='shield'){
    const bB = player.sb.shield==='b'; player.shield = (3000+800*lvl)*(bB?1.5:1); player.cd.shield = 18000-2000*lvl; SFX.play('levelup');
    if(bB) player.hp = Math.min(player.maxHp, player.hp+player.maxHp*0.2);
  }
  return true;
}
function skillTick(dt, mx, my){
  for(const k in player.cd) player.cd[k] = Math.max(0, player.cd[k]-dt*1000);
  player.shield = Math.max(0, player.shield-dt*1000);
  player.spinFx = Math.max(0, player.spinFx-dt*1000);
  for(const k of ['dash','spin','shield']){
    const on = keys[SKILLS[k].code] || (k==='dash' && keys['ShiftRight']);
    if(on && !skillLatch[k]){ skillLatch[k] = true; useSkill(k, mx, my); }
    if(!on) skillLatch[k] = false;
  }
}
function drawSkillFx(sx,sy){
  const cx = sx+player.w/2, cy = sy+player.h/2, t = Date.now()/1000;
  if(player.shield>0){
    const a = Math.min(1, player.shield/500), p = 0.5+0.5*Math.sin(t*6);
    ctx.fillStyle = 'rgba(120,200,255,'+(0.13*a)+')'; ctx.strokeStyle = 'rgba(170,225,255,'+((0.5+0.2*p)*a)+')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx,cy,21+p,24+p,0,0,6.283); ctx.fill(); ctx.stroke();
  }
  if(player.slowT>0){
    ctx.strokeStyle = 'rgba(235,240,250,'+(0.55+0.3*Math.min(1,player.slowT/600))+')'; ctx.lineWidth = 1;
    for(let a=0;a<6;a++){ ctx.beginPath(); ctx.moveTo(cx,cy+6); ctx.lineTo(cx+Math.cos(a*1.047)*17,cy+6+Math.sin(a*1.047)*10); ctx.stroke(); }
    for(const r of [8,15]){ ctx.beginPath(); for(let a=0;a<=6;a++){ const px=cx+Math.cos(a*1.047)*r, py=cy+6+Math.sin(a*1.047)*r*0.6; if(a) ctx.lineTo(px,py); else ctx.moveTo(px,py); } ctx.stroke(); }
  }
  if(player.spinFx>0){
    const p = 1-player.spinFx/380, R = player.spinR*(0.35+0.65*p);
    ctx.strokeStyle = 'rgba(255,240,180,'+(1-p)+')'; ctx.lineWidth = 2+6*(1-p);
    ctx.beginPath(); ctx.arc(cx,cy,R,0,6.283); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,'+(0.9*(1-p))+')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx,cy,R*0.8,p*12,p*12+2.2); ctx.stroke();
  }
}
function drawSkillBar(){
  if(isTouchDevice) return;
  const list = ['dash','spin','shield'].filter(k=>player.skills[k]>0); if(!list.length) return;
  const sz = 38, gap = 8, w = list.length*sz+(list.length-1)*gap;
  let x = canvas.width/2-w/2, y = canvas.height-UI.b-sz-12;
  for(const k of list){
    const S = SKILLS[k], cd = player.cd[k], tot = (k==='dash'?4500-700*player.skills[k]:k==='spin'?8000-1000*player.skills[k]:18000-2000*player.skills[k]);
    ctx.fillStyle='rgba(10,8,4,0.7)'; ctx.fillRect(x,y,sz,sz); ctx.strokeStyle = cd>0 ? '#5c4415' : '#e8c873'; ctx.lineWidth = 2; ctx.strokeRect(x,y,sz,sz);
    ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.fillText(S.icon, x+sz/2, y+sz/2+6);
    if(cd>0){ ctx.fillStyle='rgba(0,0,0,0.6)'; const h = sz*Math.min(1,cd/tot); ctx.fillRect(x,y+sz-h,sz,h); ctx.fillStyle='#fff'; ctx.font='bold 12px sans-serif'; ctx.fillText((cd/1000).toFixed(cd<10000?1:0), x+sz/2, y+sz/2+4); }
    ctx.fillStyle='#e8c873'; ctx.font='bold 10px sans-serif'; ctx.fillText(S.key, x+sz/2, y+sz+10);
    x += sz+gap;
  }
  ctx.textAlign='left';
}

// ---------- Бои с боссами: фазы, призыв помощников, удары по площади ----------
const BOSS_ADD = {spiderqueen:'webspider', warlord:'darkknight', phantom:'banshee', boss:'skeleton', shadowlord:'wraith', lavalord:'imp', pharaoh:'scorpion', frostking:'icewolf', lich:'ghoul', treant:'panther'};
function bossPhaseUp(e, ph){
  addNote('⚠ '+BOSS_LABEL[e.type]+(ph===2 ? ' разъярён!' : ' в бешенстве!'), '#ff6a4a');
  shakeT = Math.max(shakeT, 600); SFX.play('boss');
  e.dmg = Math.round(e.dmg*1.15); e.speed *= 1.12;
  if(e.shoot) e.shoot = Object.assign({}, e.shoot, {cd:Math.round(e.shoot.cd*0.75)});
  const cx = e.x+e.w/2, cy = e.y+e.h/2;
  burst(cx,cy,30,{colors:[e.color,'#ff5a3a','#ffffff'],sp:170,up:20,g:0,life:600,size:3.4});
  const alive = loc.enemies.filter(m=>m.minion && m.hp>0).length, want = Math.min(ph===2 ? 2 : 3, 6-alive);
  for(let i=0, tries=0; i<want && tries<40; tries++){
    const a = Math.random()*6.283, d = 56+Math.random()*50;
    const m = makeEnemy(BOSS_ADD[e.type]||'skeleton', cx+Math.cos(a)*d-12, cy+Math.sin(a)*d-12, loc.level||1);
    if(isBlocked(loc, m.x, m.y, m.w, m.h)) continue;
    m.minion = true; m.xp = Math.round(m.xp*0.4); m.gold = 0; loc.enemies.push(m); i++;
    burst(m.x+m.w/2, m.y+m.h/2, 8, {colors:[e.color,'#ffffff'], sp:60, up:20, g:-20, life:400, size:2.4});
  }
}
function bossTick(e, dt, dist, pcx, pcy){
  const r = e.hp/e.maxHp, ph = r<=0.25 ? 3 : r<=0.5 ? 2 : 1;
  if(e.phase===undefined) e.phase = ph;
  else if(ph>e.phase){ e.phase = ph; bossPhaseUp(e, ph); }
  if(dist < e.aggro){
    e.slamCd = (e.slamCd===undefined ? 2600 : e.slamCd) - dt*1000;
    if(e.slamCd<=0){
      e.slamCd = [0,6500,4800,3400][e.phase];
      const R = 54+6*e.phase;
      aoes.push({x:pcx, y:pcy, r:R, t:0, dur:1150, dmg:Math.round(e.dmg*1.2), col:e.color});
      if(e.phase>=3){ const a = Math.random()*6.283; aoes.push({x:pcx+Math.cos(a)*90, y:pcy+Math.sin(a)*90, r:R, t:-250, dur:1150, dmg:Math.round(e.dmg*1.2), col:e.color}); }
    }
  }
}
function updateAoes(dt){
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  for(let i=aoes.length-1;i>=0;i--){
    const a = aoes[i]; a.t += dt*1000;
    if(a.t>=a.dur){
      if(Math.hypot(pcx-a.x,pcy-a.y)<a.r) hurtPlayer(a.dmg);
      burst(a.x,a.y,22,{colors:[a.col,'#ffd34a','#ffffff'],sp:150,up:20,g:60,life:520,size:3.2});
      shakeT = Math.max(shakeT, 260); SFX.play('hit');
      aoes.splice(i,1);
    }
  }
}
function drawAoes(camX,camY){
  const t = Date.now()/1000;
  for(const a of aoes){
    if(a.t<0) continue;
    const x = a.x-camX, y = a.y-camY, p = Math.min(1,a.t/a.dur);
    ctx.fillStyle = 'rgba(255,50,30,'+(0.12+0.1*Math.sin(t*14))+')'; ctx.beginPath(); ctx.arc(x,y,a.r,0,6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,70,40,'+(0.18+0.25*p)+')'; ctx.beginPath(); ctx.arc(x,y,a.r*p,0,6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,90,60,0.95)'; ctx.lineWidth = 2; ctx.setLineDash([6,5]); ctx.beginPath(); ctx.arc(x,y,a.r,0,6.283); ctx.stroke(); ctx.setLineDash([]);
  }
}


// ======================= Энциклопедия =======================
// [значок, название, где встречается, описание]
const ENEMY_INFO = {
  wolf:['🐺','Серошкур','Поверхность','Стайный хищник лесов. Быстро настигает, но слаб в одиночку.'],
  boar:['🐗','Щетинистый Рвач','Поверхность','Бросается в лоб и бьёт клыками. Бегает быстрее волка, но не стреляет.'],
  bandit:['🗡️','Тенекрад','Поверхность','Прячется под капюшоном и метает ножи с расстояния. Держится на дистанции — подойдите вплотную.'],
  slime:['🟢','Зелёный Хлюп','Лаз Мортракса','Медленный и мягкий. Хорошая цель для новичка.'],
  bat:['🦇','Крылошорох','Пещеры','Порхает зигзагами, сложно поймать в удар. Слабая, но назойливая.'],
  spider:['🕷️','Тёмный Прядун','Пещеры','Быстрый и кусачий. Любит подкрадываться в тесных коридорах.'],
  skeleton:['💀','Хрустун','Пещеры, погост','Лёгкая нежить с ржавым клинком.'],
  giantrat:['🐀','Хвостогрыз','Грот Шорохов','Стайная грызунья подземелий. Быстрая и злая, но хрупкая.'],
  zombie:['🧟','Гнилоступ','Пещеры, Град, Обитель','Медленный, но очень живучий и тяжёлый на удар.'],
  webspider:['🕸️','Липкопряд','Пещеры, дебри','Плюёт липкой паутиной: замедляет героя. Зелье скорости снимает замедление.'],
  wraith:['👻','Вуальник','Провал Безмолвия, Обитель','Парит над полом и быстро сокращает расстояние.'],
  darkknight:['🛡️','Железный Скорбник','Провал, Град','Закованный в сталь страж: много здоровья и тяжёлый удар.'],
  gargoyle:['🗿','Клювокрыл','Провал Безмолвия','Каменный крылатый страж. Медлительна, но очень крепка и больно бьёт.'],
  imp:['😈','Искроплюй','Кузни Гхарраш','Мечет огненные шарики издалека и держит дистанцию.'],
  lavaslime:['🔥','Магмохлюп','Кузни Гхарраш','Горячая густая жижа. Обжигает при касании.'],
  golem:['🪨','Базальтоид','Кузни Гхарраш, город','Каменная глыба: невероятно крепкий, но медленный.'],
  salamander:['🦎','Пеплоящер','Кузни Гхарраш','Огненная ящерица: быстро бегает и плюётся огнём на короткую дистанцию.'],
  scorpion:['🦂','Песчаное Жало','Пустошь Зарахаб','Проворный охотник песков с ядовитым жалом.'],
  mummy:['🧻','Бинтоход','Пустошь Зарахаб','Древний страж гробниц: крепкая и неторопливая.'],
  cobra:['🐍','Шипящий Шаймар','Пустошь, дебри','Стремительный бросок и очень сильный укус.'],
  vulture:['🦅','Стервокрыл','Пустошь Зарахаб','Кружит над добычей и пикирует рывками. Сложно попасть, зато хрупкий.'],
  icewolf:['🐺','Белоклык','Край Белого Эха','Быстрый хищник вечной мерзлоты.'],
  yeti:['🦣','Снеговей','Край Белого Эха','Огромный и сильный снежный великан.'],
  frostwraith:['❄️','Инеелик','Край Белого Эха','Стреляет ледяными осколками, держась на расстоянии.'],
  icegolem:['🧊','Льдеглыб','Край Белого Эха','Глыба вечного льда: очень медленный, но огромный запас здоровья.'],
  ghoul:['🧛','Могилоед','Погост, Град','Быстрый и свирепый падальщик.'],
  banshee:['😱','Плакуша','Погост, Обитель','Призрачная плакальщица: её вопль ранит издалека.'],
  skelarcher:['🏹','Костострел','Погост Увядших Звёзд','Стреляет стрелами с расстояния. Сближайтесь рывком, прячьтесь за деревьями.'],
  panther:['🐆','Тенепард','Дебри Ксилотара','Очень быстрая и сильная хищница.'],
  shroom:['🍄','Спорошляп','Дебри Ксилотара','Неподвижно стоит и выпускает споры.'],
  gorilla:['🦍','Лианобой','Дебри Ксилотара','Грозный силач джунглей.'],
  hunter:['🪃','Дротикарь','Дебри Ксилотара','Метает отравленные дротики и ловко уходит от удара.'],
  crossbowman:['🎯','Болтомёт','Град Вельмор','Тяжёлый стрелок городской стражи: стреляет болтами издалека.'],
  cursedbook:['📕','Шепчущий Фолиант','Обитель Пустых Зеркал','Парит и швыряет проклятия. Хрупкая, но летает непредсказуемо.'],
  frostmite:['🧊','Инеёж','Край Белого Эха','Колючий ледяной клещ. Укус замораживает: герой на миг теряет подвижность.'],
  cinderhound:['🐕','Пеплолай','Кузни Гхарраш','Тлеющая гончая. Её укус поджигает — здоровье убывает, пока горение не угаснет. Вода тушит.'],
  pyromancer:['🔥','Жаровержец','Кузни Гхарраш','Маг огня: бросает пару огненных шаров и поджигает цель.'],
  blizzardmage:['🌨️','Метелун','Край Белого Эха','Чародей вьюги: ледяной снаряд замораживает героя. Щит и зелье стойкости защищают.'],
  venomtoad:['🐸','Ядожаб','Дебри Ксилотара','Жаба с едкой слизью: отравляет — здоровье убывает некоторое время.'],
  ram:['🐏','Бодун','Поверхность','Замирает, трясёт головой — и бросается тараном. Отскочите в сторону: после броска он долго не бегает, это время для удара.'],
  rhino:['🦏','Рогонос','Дебри Ксилотара','Тяжёлый таран джунглей: долгий разбег, сокрушительный удар. Обходите по дуге.'],
  gelcube:['🧊','Студень','Лаз Мортракса, пещеры','Прозрачный желейный куб. Когда его убивают, распадается на две юркие капельки.'],
  slimelet:['💧','Капелька','Рождается из Студня','Мелкая и быстрая, но с одного удара. Награды почти нет.'],
  shieldbearer:['🛡️','Заслонник','Провал, Погост, Град','Держит щит перед собой: удар в лоб почти не наносит урона. Заходите сбоку и со спины или отскочите рывком — щит поворачивается медленно.'],
  necromancer:['🧙','Костезов','Провал, Погост, Обитель','Держится на расстоянии и поднимает скелетов (до двух). Убейте его — призванные рассыплются.'],
  emberbomb:['💣','Жаропуск','Кузни Гхарраш','Мчится к герою и вспыхивает: через мгновение взрывается по площади. Убейте издалека или отбегите.'],
  dunepriest:['🔮','Пескожрец','Пустошь Зарахаб','Лечит раненых сородичей рядом и швыряет песок. Убивайте первым.'],
  snowstalker:['🌬️','Метельный Скиталец','Край Белого Эха','Исчезает в метели и появляется рядом с героем. Укус на миг замораживает.'],
  vampbat:['🧛','Кровокрыл','Пещеры, Провал, Обитель','Мечется зигзагами и лечится, кусая героя. Слаб — добивайте быстро.'],
  bombardier:['💥','Бомбардир','Град Вельмор, Обитель','Обстреливает из миномёта: на земле вспыхивает круг, через секунду в нём рвётся снаряд. Не стойте в круге.'],
  boss:['👑','Мортракс','Пещера на поверхности','Страж №1. Бьёт по площади, не стойте на месте.'],
  spiderqueen:['🕷️','Шелиба','Логово в Гроте Шорохов','Страж №2. Плюётся паутиной, замедляющей героя.'],
  shadowlord:['🌑','Ноктурн','Логово Провала','Страж №3. Питается страхом, окружён тёмными шарами.'],
  lavalord:['🌋','Игнаррок','Логово Кузен Гхарраш','Страж №4. Мечет тройные огненные залпы.'],
  pharaoh:['🏺','Хар-Атеп','Логово Пустоши','Страж №5. Бросает песчаные заряды.'],
  frostking:['🥶','Криомир','Логово Края Белого Эха','Страж №6. Мечет ледяные осколки веером.'],
  lich:['☠️','Морвейн','Логово Погоста','Страж №7. Колдует тройные проклятия.'],
  treant:['🌳','Ольхарон','Логово Дебрей','Страж №8. Околдованный дух леса: выпускает споры.'],
  warlord:['⚔️','Вархаал','Логово Града','Страж №9. Предводитель стражи, мечет огненные шары.'],
  phantom:['🎭','Эфирий','Логово Обители','Страж №10. Хозяин Обители, похитивший Сердце Эльдории.']
};
const ARTIFACT_INFO = (()=>{
  const A = {};
  for(const id of Object.keys(WEAPONS)) A['w:'+id] = {i:'🗡️', n:WEAPONS[id].name, d:'Оружие. Урон ×'+WEAPONS[id].mult+'. '+WEAPONS[id].desc};
  for(const id of Object.keys(ARMORS)) if(id!=='none') A['a:'+id] = {i:'🛡️', n:ARMORS[id].name, d:'Броня. Гасит '+Math.round(ARMORS[id].reduce*100)+'% урона. '+ARMORS[id].desc};
  A['potion'] = {i:'🧪', n:'Эликсир здоровья', d:'Эликсир: восстанавливает здоровье. Выпадает из врагов и сундуков, продаётся в лавке.'};
  for(const k of Object.keys(ELIX)) A['e:'+k] = {i:'⚗️', n:ELIX[k].name, d:(k==='big'?'Эликсир. ':'Зелье. ')+ELIX[k].desc};
  A['boots'] = {i:'👢', n:'Сапоги-скороходы', d:'Скорость передвижения +18%. Продаются только караванщиками.'};
  A['key'] = {i:'🗝', n:'Ключ', d:'Открывает запертый сундук в тайнике.'};
  A['heart'] = {i:'💎', n:'Сердце Эльдории', d:'Древний камень света, похищенный Эфирием. Хранится в Обители Пустых Зеркал.'};
  return A;
})();
const codexScreen = document.getElementById('codexScreen'), codexList = document.getElementById('codexList'), codexTabsEl = document.getElementById('codexTabs'), codexBtn = document.getElementById('codexBtn');
let codexTab = 'enemies', codexAcc = 0;
function codexEnsure(){ if(!player.codex) player.codex = {e:{},a:{},k:{}}; return player.codex; }
function codexAddEnemy(type){
  const c = codexEnsure(); if(c.e[type] || !ENEMY_INFO[type]) return;
  c.e[type] = 1; addNote('📖 Энциклопедия: '+ENEMY_INFO[type][1], '#8ad8ff');
}
function codexAddArt(key, info){
  const c = codexEnsure(); if(c.a[key]) return;
  const a = info || ARTIFACT_INFO[key]; if(!a) return;
  c.a[key] = {i:a.i, n:a.n, d:a.d, c:a.c||null}; addNote('📖 Энциклопедия: '+a.n, '#8ad8ff');
}
function codexTick(dt){
  codexAcc += dt; if(codexAcc<0.4) return; codexAcc = 0;
  if(!player.codex) codexEnsure();
  const px = player.x+player.w/2, py = player.y+player.h/2;
  for(const e of loc.enemies){
    if(e.hp<=0 || player.codex.e[e.type]) continue;
    const lim = BOSS_TYPES.includes(e.type) ? 420 : 250;
    if(Math.hypot(e.x+e.w/2-px, e.y+e.h/2-py) < lim) codexAddEnemy(e.type);
  }
  for(const id of Object.keys(player.owned||{})) if(player.owned[id]) codexAddArt('w:'+id);
  for(const id of Object.keys(player.ownedArmor||{})) if(player.ownedArmor[id] && id!=='none') codexAddArt('a:'+id);
  if(player.potions>0) codexAddArt('potion');
  for(const k of Object.keys(player.elix||{})) if(player.elix[k]>0) codexAddArt('e:'+k);
  if(player.vkeys>0) codexAddArt('key');
  if(player.boots) codexAddArt('boots');
  const gl = [...(player.bag||[]), ...Object.values(player.gear||{}).filter(Boolean)];
  for(const g of gl) codexAddArt('g:'+g.name+':'+g.rar, {i:g.slot==='helm'?'⛑️':g.slot==='ring'?'💍':'📿', n:g.name, d:'Снаряжение ('+GEAR_SLOTS[g.slot].n.toLowerCase()+'), '+RAR[g.rar].n.toLowerCase()+'. '+gearLines(g)+'.', c:RAR[g.rar].c});
  for(const it of loc.items) if(it.type==='treasure' && Math.hypot(it.x-px,it.y-py)<300) codexAddArt('heart');
}
function codexRow(icon, title, desc, color, known){
  const row = document.createElement('div'); row.className = 'shopItem'; if(!known) row.style.opacity = '0.55';
  const info = document.createElement('div'); info.className = 'shopInfo';
  const nm = document.createElement('b'); nm.textContent = icon+' '+title; if(color) nm.style.color = color;
  const ds = document.createElement('span'); ds.textContent = desc; info.append(nm, ds);
  row.appendChild(info); codexList.appendChild(row);
}
function renderCodex(){
  const c = codexEnsure();
  const enemyKeys = Object.keys(ENEMY_INFO), artKeys = Object.keys(ARTIFACT_INFO);
  const eN = enemyKeys.filter(k=>c.e[k]).length;
  const dyn = Object.keys(c.a).filter(k=>!ARTIFACT_INFO[k]);
  const aN = artKeys.filter(k=>c.a[k]).length + dyn.length;
  codexTabsEl.innerHTML = '';
  [['enemies','👾 Враги ('+eN+'/'+enemyKeys.length+')'],['arts','✦ Артефакты ('+aN+(dyn.length?'':'/'+artKeys.length)+')']].forEach(([id,label])=>{
    const t = document.createElement('button'); t.className = 'tabBtn'+(codexTab===id?' active':''); t.textContent = label;
    t.addEventListener('click', ()=>{ codexTab = id; renderCodex(); }); codexTabsEl.appendChild(t);
  });
  document.getElementById('codexInfo').textContent = codexTab==='enemies' ? 'Открыто записей: '+eN+' из '+enemyKeys.length : 'Открыто записей: '+aN;
  codexList.innerHTML = '';
  if(codexTab==='enemies'){
    for(const k of enemyKeys){
      const I = ENEMY_INFO[k];
      if(c.e[k]){
        const B = ENEMY_BASE[k], kills = c.k[k]||0;
        codexRow(I[0], I[1], 'Где: '+I[2]+'. '+I[3]+' Здоровье ≈'+B.hp+', урон ≈'+B.dmg+(B.shoot?', стреляет':'')+'. Побеждено: '+kills+'.', BOSS_TYPES.includes(k)?'#ff9f4a':null, true);
      } else codexRow('❔','???','Не встречен.', null, false);
    }
  } else {
    for(const k of artKeys){
      if(c.a[k]) codexRow(c.a[k].i, c.a[k].n, c.a[k].d, null, true);
      else codexRow('❔','???','Ещё не найден.', null, false);
    }
    for(const k of dyn) codexRow(c.a[k].i, c.a[k].n, c.a[k].d, c.a[k].c, true);
  }
}
function openCodex(){
  if(gameState!=='playing') return;
  for(const k in keys) keys[k] = false;
  codexTick(1); gameState = 'codex'; renderCodex(); codexScreen.classList.remove('hidden');
}
function closeCodex(){
  codexScreen.classList.add('hidden'); gameState = 'playing'; for(const k in keys) keys[k] = false; saveGame();
}
document.getElementById('codexClose').addEventListener('click', closeCodex);
codexBtn.addEventListener('click', ()=>{ if(gameState==='playing') openCodex(); else if(gameState==='codex') closeCodex(); });
window.addEventListener('keydown', e=>{ if(e.code==='KeyK'){ if(gameState==='playing') openCodex(); else if(gameState==='codex') closeCodex(); } });

// ---------- Экран «Герой»: снаряжение и навыки ----------
const heroScreen = document.getElementById('heroScreen'), heroList = document.getElementById('heroList'), heroTabsEl = document.getElementById('heroTabs');
let heroTab = 'gear';
function heroRow(title, desc, buttons, color){
  const row = document.createElement('div'); row.className = 'shopItem';
  const info = document.createElement('div'); info.className = 'shopInfo';
  const nm = document.createElement('b'); nm.textContent = title; if(color) nm.style.color = color;
  const ds = document.createElement('span'); ds.textContent = desc; info.append(nm, ds);
  const box = document.createElement('div'); box.className = 'shopBtns'; buttons.forEach(b=>box.appendChild(b));
  row.append(info, box); heroList.appendChild(row);
}
function renderHero(msg){
  document.getElementById('heroMsg').textContent = msg || '';
  document.getElementById('heroInfo').textContent = heroTab==='skills'
    ? `★ Очков навыков: ${player.sp}  (по 1 за новый уровень)`
    : `Сумка: ${player.bag.length}/${BAG_MAX}  •  Золото: ${player.gold}  •  ${matsText()}`;
  heroTabsEl.innerHTML = '';
  [['gear','🎒 Снаряжение'],['skills','★ Навыки'+(player.sp>0?' ('+player.sp+')':'')]].forEach(([id,label])=>{
    const t = document.createElement('button'); t.className = 'tabBtn'+(heroTab===id?' active':''); t.textContent = label;
    t.addEventListener('click', ()=>{ heroTab = id; renderHero(''); }); heroTabsEl.appendChild(t);
  });
  heroList.innerHTML = '';
  if(heroTab==='skills'){
    if(heroPick){ renderBranchPick(); return; }
    for(const k of ['dash','spin','shield','might']){
      const S = SKILLS[k], l = player.skills[k];
      const cur = l>0 ? 'Сейчас: '+S.desc(l) : 'Не изучено.';
      const nxt = l<SKILL_MAX ? ' Следующий уровень: '+S.desc(l+1) : ' Максимальный уровень.';
      const key = S.code ? ' Клавиша: '+S.key+'.' : '';
      const br = branchOf(k), brTxt = br ? ' Ветка «'+br.n+'»: '+br.d+'.' : (l===1 ? ' На 2 уровне — выбор ветки развития.' : '');
      const b = shopButton(l>=SKILL_MAX ? 'Макс.' : (l ? 'Улучшить' : 'Изучить')+' — 1 ★', ()=>skillUpgrade(k), player.sp<1 || l>=SKILL_MAX);
      heroRow(S.icon+' '+S.name+'  ['+l+'/'+SKILL_MAX+']', cur+nxt+key+brTxt, [b]);
    }
  } else {
    const sum = ['hp','dmg','def','spd','vamp'].filter(k=>gearStat(k)>0).map(k=>STAT_INFO[k].txt(Math.round(gearStat(k)*10)/10)).join('; ');
    heroRow('Итого от снаряжения', sum || 'Пока ничего не надето. Предметы выпадают из врагов, у боссов — всегда.', []);
    for(const slot of ['helm','ring','amulet']){
      const g = player.gear[slot];
      if(g) heroRow(GEAR_SLOTS[slot].n+': '+g.name, RAR[g.rar].n+'. '+gearLines(g), [shopButton('Снять', ()=>{ if(!unequipGear(slot)){ renderHero('Сумка полна.'); return; } saveGame(); renderHero('Снято: '+g.name+'.'); })], RAR[g.rar].c);
      else heroRow(GEAR_SLOTS[slot].n+': пусто', 'Слот свободен.', []);
    }
    player.bag.forEach((g,i)=>{
      const cur = player.gear[g.slot];
      const eq = shopButton('Надеть', ()=>{ equipGear(i); saveGame(); SFX.play('buy'); renderHero('Надето: '+g.name+'.'); });
      const price = gearSellPrice(g);
      const sell = shopButton('Продать — '+price+' ◆', ()=>{ sellGear(i); saveGame(); SFX.play('buy'); renderHero('Продано: '+g.name+' (+'+price+' ◆).'); });
      const dis = shopButton('Разобрать → '+yieldText(dismantleYield(g)), ()=>{ const y = dismantleGear(i); saveGame(); SFX.play('buy'); renderHero('Разобрано: '+g.name+' ('+yieldText(y)+').'); });
      heroRow(g.name+(g.up ? ' +'+g.up : '')+'  ('+GEAR_SLOTS[g.slot].n.toLowerCase()+')', RAR[g.rar].n+'. '+gearLines(g)+(cur ? '  Сейчас надето: '+cur.name+'.' : ''), [eq, dis, sell], RAR[g.rar].c);
    });
  }
}
function openHero(){
  if(gameState!=='playing') return;
  heroPick = null;
  for(const k in keys) keys[k] = false;
  gameState = 'hero'; heroTab = player.sp>0 ? 'skills' : 'gear'; renderHero(''); heroScreen.classList.remove('hidden');
}
function closeHero(){
  heroScreen.classList.add('hidden'); gameState = 'playing'; for(const k in keys) keys[k] = false; saveGame();
}
document.getElementById('heroClose').addEventListener('click', closeHero);
const heroBtn = document.getElementById('heroBtn');
heroBtn.addEventListener('click', ()=>{ if(gameState==='playing') openHero(); else if(gameState==='hero') closeHero(); });
window.addEventListener('keydown', e=>{
  if(e.code==='KeyI'){ if(gameState==='playing') openHero(); else if(gameState==='hero') closeHero(); }
});
function refreshSkillUI(){
  for(const [id,k] of [['dashBtn','dash'],['spinBtn','spin'],['shieldBtn','shield']]){
    const el = document.getElementById(id); if(el) el.classList.toggle('hidden', !(player.skills && player.skills[k]>0));
  }
}
let _skillTxt = {};
function updateSkillButtons(){
  for(const [id,k] of [['dashBtn','dash'],['spinBtn','spin'],['shieldBtn','shield']]){
    const el = document.getElementById(id); if(!el || !player.cd) continue;
    const cd = player.cd[k], txt = cd>0 ? String(Math.ceil(cd/1000)) : SKILLS[k].icon;
    if(_skillTxt[id]!==txt){ _skillTxt[id] = txt; el.textContent = txt; el.style.opacity = cd>0 ? '0.5' : '1'; }
  }
  const badge = player.sp>0 ? '🎒★' : '🎒'; if(heroBtn.textContent!==badge) heroBtn.textContent = badge;
}
function bindSkillButtons(){
  for(const [id,k] of [['dashBtn','dash'],['spinBtn','spin'],['shieldBtn','shield']]){
    const el = document.getElementById(id), code = SKILLS[k].code;
    el.addEventListener('pointerdown', e=>{ e.preventDefault(); keys[code] = true; });
    for(const ev of ['pointerup','pointercancel','pointerleave']) el.addEventListener(ev, ()=>{ keys[code] = false; });
  }
}
bindSkillButtons();

