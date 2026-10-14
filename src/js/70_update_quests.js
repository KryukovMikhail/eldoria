// ---------- Обновление ----------
function attackHitbox(scale){
  const s = (player.weapon==='axe' ? 46 : 34)*(scale||1);
  if(player.dir==='up')    return {x:player.x+player.w/2-s/2, y:player.y-s+6, w:s, h:s};
  if(player.dir==='down')  return {x:player.x+player.w/2-s/2, y:player.y+player.h-6, w:s, h:s};
  if(player.dir==='left')  return {x:player.x-s+6, y:player.y+player.h/2-s/2, w:s, h:s};
  return {x:player.x+player.w-6, y:player.y+player.h/2-s/2, w:s, h:s};
}

// ---------- Снаряды врагов ----------
const eshots = [];
const SHOT_COL = { web:['#eef2fa','#aab4c8','#ffffff'], wail:['#d8b8ff','#9a6aff','#ffffff'], curse:['#7aff9a','#2fd06a','#e8ffe8'], spore:['#b8e84a','#7ac22a','#f4ffd0'], fire:['#ff9a2a','#ffd34a','#ff4a1a'], ice:['#bfeaff','#7ad4ff','#ffffff'], sand:['#e8c878','#c9a050','#fff0c0'], knife:['#dfe4ea','#9aa2ae','#ffffff'], arrow:['#caa86a','#8a6a3a','#f4e4b0'], dart:['#8aff6a','#3f9a2a','#e8ffd8'], bolt:['#dfe4ea','#7a7f8c','#ffffff'] };
function hurtPlayer(d){
  if(player.invuln>0 || gameState!=='playing') return false;
  player.hp -= incomingDamage(d); player.invuln = 700; player.hitFlash = 250;
  SFX.play('hurt');
  if(player.hp<=0){ player.hp=0; onPlayerDeath(); }
  return true;
}
function enemyShoot(e,dx,dy){
  const sh = e.shoot, base = Math.atan2(dy,dx);
  const offs = sh.n>=3 ? [-0.3,0,0.3] : sh.n===2 ? [-0.12,0.12] : [0];
  for(const o of offs){
    const a = base+o;
    eshots.push({ x:e.x+e.w/2, y:e.y+e.h/2, vx:Math.cos(a)*sh.speed, vy:Math.sin(a)*sh.speed, kind:sh.kind, dmg:Math.round(e.dmg*0.8), life:2600 });
  }
  SFX.play('shoot');
}
function updateEnemyShots(dt){
  for(let i=eshots.length-1;i>=0;i--){
    const sh = eshots[i];
    sh.x += sh.vx*dt; sh.y += sh.vy*dt; sh.life -= dt*1000;
    let rm = sh.life<=0, hit = false;
    if(!rm){
      const tx = Math.floor(sh.x/TILE), ty = Math.floor(sh.y/TILE);
      if(tx<0||ty<0||tx>=loc.width||ty>=loc.height) rm = true;
      else { const t = loc.grid[ty][tx]; if(t==='#'||t==='^'){ rm = true; hit = true; } }
    }
    if(!rm && sh.x>player.x && sh.x<player.x+player.w && sh.y>player.y && sh.y<player.y+player.h){ const hurt = hurtPlayer(sh.dmg); if(sh.kind==='web') applyWebSlow(); else if(hurt && SHOT_FX[sh.kind] && Math.random()<SHOT_FX[sh.kind][2]) inflictStatus(SHOT_FX[sh.kind][0], SHOT_FX[sh.kind][1], sh.dmg); rm = true; hit = true; }
    if(hit) burst(sh.x, sh.y, 6, {colors:SHOT_COL[sh.kind], sp:70, up:10, g:60, life:320, size:1.8});
    if(rm) eshots.splice(i,1);
  }
}
function drawEnemyShots(camX,camY){
  const now = Date.now()/1000;
  for(const sh of eshots){
    const x = sh.x-camX, y = sh.y-camY, c = SHOT_COL[sh.kind], p = 0.5+0.5*Math.sin(now*18+sh.x*0.1);
    ctx.fillStyle = c[2]; ctx.globalAlpha = 0.28; circ(x,y,9+p*2); ctx.fill();
    ctx.globalAlpha = 1;
    if(sh.kind==='web'){
      ctx.save(); ctx.translate(x,y); ctx.rotate(now*3);
      ctx.strokeStyle = 'rgba(245,248,255,0.95)'; ctx.lineWidth = 1.1;
      for(let a=0;a<6;a++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a*1.047)*8,Math.sin(a*1.047)*8); ctx.stroke(); }
      for(const r of [3.4,6.2]){ ctx.beginPath(); for(let a=0;a<=6;a++){ const px=Math.cos(a*1.047)*r, py=Math.sin(a*1.047)*r; if(a) ctx.lineTo(px,py); else ctx.moveTo(px,py); } ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0,0,1.6,0,6.283); ctx.fill();
      ctx.restore();
    } else if(sh.kind==='ice'){
      ctx.save(); ctx.translate(x,y); ctx.rotate(now*4);
      ctx.fillStyle = c[1]; ctx.strokeStyle = c[2]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,-6.5); ctx.lineTo(4,0); ctx.lineTo(0,6.5); ctx.lineTo(-4,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if(sh.kind==='knife'||sh.kind==='arrow'||sh.kind==='dart'||sh.kind==='bolt'){
      ctx.save(); ctx.translate(x,y); ctx.rotate(Math.atan2(sh.vy,sh.vx));
      if(sh.kind==='knife'){ ctx.rotate(now*20); ctx.fillStyle=c[0]; ctx.beginPath(); ctx.moveTo(-5,-1.6); ctx.lineTo(6,0); ctx.lineTo(-5,1.6); ctx.closePath(); ctx.fill(); ctx.fillStyle='#5a3a22'; ctx.fillRect(-8,-1.2,4,2.4); }
      else { ctx.strokeStyle=c[1]; ctx.lineWidth=sh.kind==='bolt'?2.4:1.5; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(5,0); ctx.stroke(); ctx.fillStyle=c[0]; ctx.beginPath(); ctx.moveTo(4,-2.6); ctx.lineTo(10,0); ctx.lineTo(4,2.6); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    } else {
      ctx.fillStyle = c[0]; circ(x,y,5); ctx.fill();
      ctx.fillStyle = c[1]; circ(x-0.6,y-0.6,3.2); ctx.fill();
      ctx.fillStyle = c[2]; circ(x-1,y-1,1.4); ctx.fill();
    }
  }
}

function playerLevelUp(){
  player.level++;
  player.xp -= player.xpNext;
  player.xpNext = Math.round(player.xpNext*1.35);
  player.maxHp += 18; player.atk += 4; player.sp++;
  player.hp = player.maxHp;
  addNote(`✦ Новый уровень: ${player.level}! Здоровье и урон возросли.`, '#7fe07f');
  addNote('★ +1 очко навыков — откройте «Герой» (кнопка 🎒 или клавиша I)', '#ffd34a');
  SFX.play('levelup');
  saveGame();
}

// ---------- Задания торговца ----------
const QUESTS = {
  wolves:    { name:'Волчья угроза',      desc:'Волки в округе пугают путников. Убейте 5 волков.',       type:'wolf',     target:5, gold:60,  potions:1 },
  slimes:    { name:'Слизь из пещер',     desc:'Слизни портят припасы в погребах. Убейте 6 слизней.',    type:'slime',    target:6, gold:70,  potions:1 },
  skeletons: { name:'Костяной дозор',     desc:'Скелеты бродят по подземельям. Убейте 6 скелетов.',      type:'skeleton', target:6, gold:130, potions:2 },
  king:      { name:'Конец тирана',       desc:'Победите Мортракса в его логове.',                type:'boss',     target:1, gold:220, potions:2 },
  wraiths:   { name:'Охота на призраков', desc:'В Провале Безмолвия бродят призраки. Убейте 5 призраков.',    type:'wraith',   target:5, gold:260, potions:3 },
  bats:      { name:'Летучая напасть',    desc:'Летучие мыши тревожат путников. Убейте 6 мышей.',         type:'bat',      target:6, gold:80,  potions:1 },
  goblins:   { name:'Гоблинский налёт',   desc:'Гоблины грабят дороги. Убейте 5 гоблинов.',                type:'goblin',   target:5, gold:110, potions:1 },
  imps:      { name:'Огненные бесы',      desc:'В недрах земли пляшут бесы. Убейте 5 бесов.',              type:'imp',      target:5, gold:300, potions:2 },
  lavalord:  { name:'Конец пламени',      desc:'Победите Игнаррока в Кузнях Гхарраш.',            type:'lavalord', target:1, gold:420, potions:3 },
  mummies:   { name:'Проклятие песков',   desc:'Мумии стерегут пустыню. Убейте 5 мумий.',                  type:'mummy',    target:5, gold:360, potions:2 },
  ghouls:    { name:'Кладбищенская стража', desc:'Упыри бродят среди могил. Убейте 5 упырей.',            type:'ghoul',    target:5, gold:520, potions:3 },
  lichq:     { name:'Конец Морвейна',   desc:'Победите Морвейна на Погосте Увядших Звёзд.',        type:'lich',     target:1, gold:800, potions:3 },
  panthers:  { name:'Тени джунглей',      desc:'Чёрные пантеры скрываются в чаще. Убейте 5 пантер.',      type:'panther',  target:5, gold:600, potions:3 },
  treantq:   { name:'Сердце леса',        desc:'Победите Ольхарона в Дебрях Ксилотара.',      type:'treant',   target:1, gold:1200, potions:4 },
  icewolves: { name:'Ледяная стая',       desc:'Белые волки рыщут во льдах. Убейте 6 ледяных волков.',     type:'icewolf',  target:6, gold:440, potions:3 },
  queenq:    { name:'Конец Шелибы', desc:'Победите Шелибу в её логове.',               type:'spiderqueen', target:1, gold:380,  potions:3 },
  marshalq:  { name:'Падение Вархаала',    desc:'Победите Вархаала в Граде Вельмор.',       type:'warlord',  target:1, gold:1600, potions:4 },
  phantomq:  { name:'Изгнание Эфирия',        desc:'Изгоните Эфирия из Обители Пустых Зеркал.',     type:'phantom',  target:1, gold:2000, potions:5 },
  weavers:   { name:'Паутина',            desc:'Пауки-плеватели замедляют путников. Убейте 5 пауков-плевателей.', type:'webspider', target:5, gold:340, potions:2 }
};
function questKill(type){
  const q = player.quest; if(!q || q.done) return;
  const d = QUESTS[q.id]; if(!d || d.type!==type) return;
  q.progress = Math.min(d.target, q.progress+1);
  if(q.progress>=d.target){ q.done = true; addNote('📜 Задание выполнено: «'+d.name+'». Вернитесь к торговцу!', '#7fe07f'); SFX.play('levelup'); }
  else addNote('📜 '+d.name+': '+q.progress+'/'+d.target, '#e0c96a');
}

function killEnemy(e){
  startDeathFx(e); onEnemyDeath(e); dropMats(e);
  const gx = Math.round(e.xp*diffMul('reward')), gg = Math.round(e.gold*diffMul('reward'));
  player.xp += gx; player.gold += gg;
  questKill(e.type); if(player.codex){ player.codex.e[e.type] = 1; player.codex.k[e.type] = (player.codex.k[e.type]||0)+1; }
  maybeDropGear(e); maybeDropElixir(e);
  addNote(`Повержен враг: +${gx} опыта, +${gg} золота`, '#e0c96a');
  if(BOSS_TYPES.includes(e.type)){
    if(e.type==='phantom') loc.items.push(makeItem('treasure', e.x, e.y));
    else if(loc.portal){
      loc.grid[loc.portal.ty][loc.portal.tx]='v'; loc.portal.open=true;
      transitionCooldown = 1500; // чтобы случайно не провалиться сразу
    }
    addNote(BOSS_NOTE[e.type], '#ff9f4a');
    saveGame();
  }
  while(player.xp >= player.xpNext) playerLevelUp();
}

function update(dt){
  if(gameState!=='playing'){ player.chargeT = 0; return; }
  updateFx(dt);
  updateArrows(dt);
  updateEnemyShots(dt);
  updateEnv(dt);
  updateFog();
  transitionCooldown = Math.max(0, transitionCooldown-dt*1000);
  saveFlash = Math.max(0, saveFlash-dt*1000);
  fullInvNoticeTimer = Math.max(0, fullInvNoticeTimer-dt*1000);
  player.invuln = Math.max(0, player.invuln-dt*1000);
  player.hitFlash = Math.max(0, player.hitFlash-dt*1000);

  // движение
  let mx=0,my=0;
  if(keys['KeyW']||keys['ArrowUp']){ my=-1; player.dir='up'; }
  if(keys['KeyS']||keys['ArrowDown']){ my=1; player.dir='down'; }
  if(keys['KeyA']||keys['ArrowLeft']){ mx=-1; player.dir='left'; }
  if(keys['KeyD']||keys['ArrowRight']){ mx=1; player.dir='right'; }
  const vDist = Math.hypot(virtualMove.x, virtualMove.y);
  let usingVirtual = false;
  if(vDist > 0.15){
    mx = clamp(virtualMove.x, -1, 1); my = clamp(virtualMove.y, -1, 1);
    usingVirtual = true;
    if(Math.abs(virtualMove.x) > Math.abs(virtualMove.y)) player.dir = virtualMove.x>0?'right':'left';
    else player.dir = virtualMove.y>0?'down':'up';
  }
  if(!usingVirtual && mx!==0 && my!==0){ mx*=0.7071; my*=0.7071; }
  if(player.fx.freeze>0){ mx = 0; my = 0; player.dashT = 0; }
  if(player.dashT>0){
    player.dashT -= dt*1000;
    const n = Math.ceil(Math.hypot(player.dvx,player.dvy)*dt/8)||1;
    for(let i=0;i<n;i++) tryMove(player, player.dvx*dt/n, player.dvy*dt/n, loc);
    burst(player.x+player.w/2, player.y+player.h/2, 2, {colors:['#cfe8ff','#ffffff'], sp:15, up:0, g:0, life:280, size:3.2});
    dashDamage();
  } else tryMove(player, mx*spdNow()*dt*(player.chargeT>200?0.8:1), my*spdNow()*dt*(player.chargeT>200?0.8:1), loc);
  if(mx!==0||my!==0){ player.walkT=(player.walkT||0)+dt*11; stepT -= dt; if(stepT<=0){ SFX.play('step'); footstep(); stepT = 0.3; } } else { player.walkT=0; stepT = 0; }

  // атака
  player.attackTimer = Math.max(0, player.attackTimer-dt*1000);
  if(keys['Space'] && !attackKeyLatch && player.attackTimer<=0){
    attackKeyLatch = true;
    player.attackTimer = WEAPONS[player.weapon].cooldown;
    player.attacking = true;
    setTimeout(()=>{ player.attacking=false; }, player.weapon==='axe' ? 230 : 140);
    SFX.play(WEAPON_SFX[player.weapon] || 'swing');
    if(WEAPONS[player.weapon].ranged) fireArrow();
    if(!WEAPONS[player.weapon].ranged) meleeStrike(attackHitbox(), 1, 14);
  }
  if(keys['Space']) player.chargeT = (player.chargeT||0)+dt*1000;
  else { if(player.chargeT>=CHARGE_MS && player.attackTimer<=0) heavyAttack(); player.chargeT = 0; }
  player.heavyFx = Math.max(0,(player.heavyFx||0)-dt*1000);
  if(!keys['Space']) attackKeyLatch = false;

  // зелье
  if(keys['KeyE'] && !potionKeyLatch){
    potionKeyLatch = true;
    if(player.potions>0 && player.hp<player.maxHp){
      player.potions--; player.hp = Math.min(player.maxHp, player.hp+30);
      addNote('Выпит эликсир здоровья (+30 HP)', '#7fe07f'); SFX.play('drink');
    } else if(player.potions<=0){
      addNote('Нет эликсиров здоровья!', '#e07f7f'); SFX.play('deny');
    }
  }
  if(!keys['KeyE']) potionKeyLatch = false;
  skillTick(dt, mx, my); elixTick(dt); folkTick(dt); statusTick(dt); rescuePlayer(); if(gameState!=='playing') return;
  updateAoes(dt); updateFlow(dt); respawnTick(dt); worldExtrasTick(dt); if(gameState!=='playing') return;
  updateSkillButtons();

  // враги
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2, SAFE = 7*TILE;
  let safeZone = false;                                                // у входа в пещеру и у выхода из неё враги не нападают
  if(loc.exit && Math.hypot(pcx-(loc.exit.tx+0.5)*TILE, pcy-(loc.exit.ty+0.5)*TILE)<SAFE) safeZone = true;
  if(loc.entrances) for(const en of loc.entrances) if(Math.hypot(pcx-(en.tx+0.5)*TILE, pcy-(en.ty+0.5)*TILE)<SAFE) safeZone = true;
  const nightAggro = (loc.type==='overworld' ? 1+0.3*darkness() : 1)*weatherAggroMul(), wShoot = weatherShootMul();   // ночью на поверхности звери злее
  for(const e of loc.enemies){
    if(e.hp<=0) continue;
    if(!e.ab){ const bb = ENEMY_BASE[e.type]; if(bb && bb.ab) e.ab = bb.ab; }
    e.hitFlash = Math.max(0, e.hitFlash-dt*1000);
    e.cooldown = Math.max(0, e.cooldown-dt*1000);
    if(e.dot){
      e.dot.t -= dt*1000; e.hp -= e.dot.dps*dt; e.dotFx = (e.dotFx||0)-dt;
      if(e.dotFx<=0){ e.dotFx = 0.28; burst(e.x+e.w/2, e.y+e.h/2, 2, {colors:e.dot.col, sp:30, up:25, g:-40, life:420, size:2}); }
      if(e.dot.t<=0) e.dot = null;
      if(e.hp<=0){ killEnemy(e); continue; }
    }
    if(e.slow>0) e.slow -= dt*1000;
    const dx = (player.x+player.w/2)-(e.x+e.w/2), dy=(player.y+player.h/2)-(e.y+e.h/2);
    const dist = Math.hypot(dx,dy);
    if(BOSS_TYPES.includes(e.type)) bossTick(e, dt, dist, player.x+player.w/2, player.y+player.h/2);
    e.lookX = dx/(dist||1); e.lookY = dy/(dist||1);
    if(e.w>=30) unstick(e);
    if(dist < e.aggro*nightAggro && !(safeZone && !BOSS_TYPES.includes(e.type))){
      let nx=dx/(dist||1), ny=dy/(dist||1), spd=e.speed*(e.slow>0?0.5:1)*diffMul('spd');
      e.losT = (e.losT||0) - dt;
      if(e.losT<=0){ e.losT = 0.15+Math.random()*0.1; e.los = hasLOS(e.x+e.w/2, e.y+e.h/2, player.x+player.w/2, player.y+player.h/2); }
      if(!e.los){ const fd = flowDir(e); if(fd){ nx = fd[0]; ny = fd[1]; } }                // стена на пути — обходим по полю расстояний
      if(e.shoot && e.shoot.keep){ if(dist<85){ nx=-nx; ny=-ny; spd*=0.8; } else if(dist<125) spd=0; }   // стрелки держат дистанцию
      if(e.ab){ const m = aiExtra(e, dt, dist, dx, dy, nx, ny, spd); if(m.dead) continue; nx = m.nx; ny = m.ny; spd = m.spd; }
      if(e.erratic){ const w=Math.sin(Date.now()/170+(e.seed||0))*0.95, px=-ny, py=nx; nx+=px*w; ny+=py*w; const l=Math.hypot(nx,ny)||1; nx/=l; ny/=l; }   // летучие мыши мечутся
      if(spd>0) tryMove(e, nx*spd*dt, ny*spd*dt, loc);
      e.moving = spd>0; e.walkT = (e.walkT||0) + dt*9;
      if(Math.abs(dx)>3) e.face = dx<0 ? 'left' : 'right';
      if(e.shoot && dist<e.shoot.range*wShoot){
        e.shotCd = (e.shotCd===undefined ? rnd(500,e.shoot.cd) : e.shotCd) - dt*1000;
        if(e.shotCd<=0){ enemyShoot(e,dx,dy); e.shotCd = e.shoot.cd; }
      }
    } else { e.moving = false; }
    if(player.shield>0 && shieldReflect(e,dt)) continue;
    if(e.dmg>0 && overlap(e, {x:player.x,y:player.y,w:player.w,h:player.h}) && e.cooldown<=0){
      const dashing = e.ai && e.ai.st==='dash';
      if(hurtPlayer(dashing ? Math.round(e.dmg*1.5) : e.dmg)){
        if(e.inflict && Math.random()<(e.inflict.chance||1)) inflictStatus(e.inflict.kind, e.inflict.ms, e.dmg);
        if(e.ab && e.ab.leech){ sfxNear(e,'bite'); e.hp = Math.min(e.maxHp, e.hp+e.dmg*e.ab.leech); burst(e.x+e.w/2, e.y+e.h/2, 6, {colors:['#d02a4a','#ff7a8a'], sp:40, up:30, g:-40, life:500, size:2.4}); }
        if(dashing){ e.ai.st = null; e.ai.cd = e.ab.charge.cd; shakeT = Math.max(shakeT, 160); }
      }
      e.cooldown = 900;
    }
  }

  // предметы
  const curLoc = loc;
  let teleported = false;
  chestLoot.length = 0;
  curLoc.items = curLoc.items.filter(it=>{
    if(overlap(it, {x:player.x,y:player.y,w:player.w,h:player.h})){
      if(it.type==='chest'){
        if(it.open) return true;
        if(it.locked && !(player.vkeys>0)){ if(fullInvNoticeTimer<=0){ addNote('🔒 Сундук заперт — нужен ключ', '#e0a03a'); fullInvNoticeTimer = 1500; SFX.play('deny'); } return true; }
        if(it.locked) player.vkeys--;
        openChest(it); return true;
      }
      if(it.type==='key'){ player.vkeys++; addNote('🗝 Найден ключ — он откроет запертый сундук', '#ffd34a'); SFX.play('pickup'); return false; }
      if(it.type==='potion'){
        if(player.potions<8){
          player.potions++; addNote('Подобран эликсир здоровья', '#7fe07f'); SFX.play('pickup');
          return false;
        } else {
          if(fullInvNoticeTimer<=0){ addNote('Инвентарь полон! (макс. 8 эликсиров)', '#e0a03a'); fullInvNoticeTimer=1500; }
          return true;
        }
      }
      else if(it.type==='gold'){ player.gold += it.value; addNote(`+${it.value} золота`, '#e0c96a'); SFX.play('coin'); return false; }
      else if(it.type==='gear'){
        if(player.bag.length<BAG_MAX){ player.bag.push(it.gear); addNote('🎒 Найдено: '+it.gear.name+' ('+RAR[it.gear.rar].n.toLowerCase()+')', RAR[it.gear.rar].c); SFX.play('pickup'); return false; }
        if(fullInvNoticeTimer<=0){ addNote('Сумка полна! (макс. '+BAG_MAX+')', '#e0a03a'); fullInvNoticeTimer = 1500; }
        return true;
      }
      else if(it.type==='elixir'){
        if(player.elix[it.kind]<ELIX_MAX){ player.elix[it.kind]++; addNote('⚗ Найдено: '+ELIX[it.kind].name.toLowerCase(), ELIX[it.kind].col); SFX.play('pickup'); return false; }
        if(fullInvNoticeTimer<=0){ addNote('Достаточно таких (макс. '+ELIX_MAX+')', '#e0a03a'); fullInvNoticeTimer = 1500; }
        return true;
      }
      else if(it.type==='treasure'){ onWin(); return false; }
    }
    return true;
  });
  if(chestLoot.length){ curLoc.items.push(...chestLoot); chestLoot.length = 0; saveGame(); }
  if(teleported) return; // не обрабатываем переходы карты в том же кадре после телепортации

  // переходы между локациями
  const centerTX = Math.floor((player.x+player.w/2)/TILE);
  const centerTY = Math.floor((player.y+player.h/2)/TILE);
  if(loc.type==='overworld') for(const en of loc.entrances) if(en.hidden && !en.found && Math.hypot(player.x+player.w/2-(en.tx+0.5)*TILE, player.y+player.h/2-(en.ty+0.5)*TILE) < 4.4*TILE){
    en.found = true; addNote('✦ Вы нашли скрытую пещеру! Она отмечена на карте', '#ffd34a'); SFX.play('levelup');
  }
  if(loc.poi) for(const p of loc.poi) if(!p.seen && Math.hypot(player.x+player.w/2-(p.door.tx+0.5)*TILE, player.y+player.h/2-(p.door.ty+0.5)*TILE) < 7*TILE){ p.seen = true; addNote('✦ Вы заметили: '+p.title, '#ffd34a'); SFX.play('levelup'); }
  if(transitionCooldown<=0){
    const dr0 = loc.type==='overworld' && loc.doors && loc.doors.find(d=>d.tx===centerTX && d.ty===centerTY);
    if(dr0){
      goTo(dr0.to, world[dr0.to].spawn.x, world[dr0.to].spawn.y, dr0.msg);
    } else if(loc.type==='overworld'){
      for(const en of loc.entrances){
        if(en.hidden && !en.found) continue;
        if(en.tx===centerTX && en.ty===centerTY){
          const d = world[en.dungeon];
          goTo(en.dungeon, d.spawn.x, d.spawn.y, en.dungeon==='town' ? 'Вы входите в Город Лиссарен' : ENTER_MSG[en.dungeon] || 'Вы входите в пещеру...');
          break;
        }
      }
    } else if(loc.type==='dungeon'){
      const dr = loc.doors && loc.doors.find(d=>d.tx===centerTX && d.ty===centerTY);
      if(dr){
        goTo(dr.to, world[dr.to].spawn.x, world[dr.to].spawn.y, dr.msg);
      } else if(loc.backTo && loc.exit.tx===centerTX && loc.exit.ty===centerTY){
        goTo(loc.backTo.loc, loc.backTo.x, loc.backTo.y, loc.backTo.msg || 'Вы выходите на улицу');
      } else if(loc.portal && loc.portal.open && NEXT_LOC[currentLocId] && loc.portal.tx===centerTX && loc.portal.ty===centerTY){
        const nid = NEXT_LOC[currentLocId];
        goTo(nid, world[nid].spawn.x, world[nid].spawn.y, ENTER_MSG[nid]);
      } else if(loc.exit.tx===centerTX && loc.exit.ty===centerTY){
        const pid = PREV_LOC[currentLocId];
        if(pid){
          // возвращаемся к спуску предыдущего уровня
          const pt = world[pid].portal;
          goTo(pid, pt.tx*TILE+5, (pt.ty+1)*TILE+5, BACK_MSG[pid]);
        } else {
          const back = world.overworld.entrances.find(e=>e.dungeon===currentLocId).back;
          goTo('overworld', back.x, back.y, 'Вы возвращаетесь на поверхность');
        }
      }
    }
  }

  placesTick(dt); codexTick(dt); storiesTick(dt); if(gameState!=='playing') return;
  eventsTick(dt); if(gameState!=='playing') return;
  // торговец: лавка открывается, когда игрок подходит вплотную
  if(loc.merchant){
    const m=loc.merchant;
    const d=Math.hypot(player.x+player.w/2-(m.x+m.w/2), player.y+player.h/2-(m.y+m.h/2));
    if(d>115) shopLock=false;
    else if(d<74 && !shopLock){ openShop(); return; }
  }

  notifications.forEach(n=> n.timer -= dt*1000);
  notifications = notifications.filter(n=>n.timer>0);
}

function onPlayerDeath(){
  setTimeout(renderDiff,0);
  gameState='dead';
  SFX.play('death');
  refreshSaveUI();
  document.getElementById('deathStats').textContent =
    `Уровень: ${player.level}  •  Золото: ${player.gold}  •  Локация: ${getLocName(loc)}`;
  document.getElementById('deathScreen').classList.remove('hidden');
  menuBtn.classList.add('hidden');
  touchControls.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
}
function onWin(){
  setTimeout(renderDiff,0);
  SFX.play('win');
  gameState='won';
  clearSave(); refreshSaveUI();
  document.getElementById('winStats').textContent =
    `Вы изгнали Эфирия, забрали Сердце Эльдории и победили всех десятерых боссов — свет вернулся в Эльдорию! Уровень: ${player.level}  •  Золото: ${player.gold}`;
  document.getElementById('winScreen').classList.remove('hidden');
  menuBtn.classList.add('hidden');
  touchControls.classList.add('hidden');
  fullscreenBtn.classList.add('hidden');
}

