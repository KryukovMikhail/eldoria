// ---------- Особые умения врагов ----------
// У врага в ENEMY_BASE может быть поле ab: {charge, split, guard, summon, bomb, heal, blink, leech, mortar, keep}.
// Состояние умений хранится в e.ai (только числа — сохраняется вместе с локацией).
const NEW_ENEMY_BASE = {
  ram:         {hp:52,  dmg:12, speed:70, xp:20,  gold:4,  color:'#d9ccb0', size:26, aggro:210, ab:{charge:{wind:650, dash:520, mul:3.6, cd:3200, range:230}}},
  rhino:       {hp:160, dmg:24, speed:52, xp:100, gold:23, color:'#8a8a92', size:32, aggro:240, ab:{charge:{wind:800, dash:620, mul:3.3, cd:3800, range:260}}},
  gelcube:     {hp:34,  dmg:6,  speed:38, xp:12,  gold:2,  color:'#58b8e8', size:24, aggro:120, ab:{split:{type:'slimelet', n:2}}},
  slimelet:    {hp:9,   dmg:3,  speed:72, xp:2,   gold:0,  color:'#7ac8f0', size:14, aggro:170},
  shieldbearer:{hp:112, dmg:16, speed:46, xp:52,  gold:12, color:'#8d96a6', size:26, aggro:190, ab:{guard:true}},
  necromancer: {hp:72,  dmg:12, speed:50, xp:70,  gold:18, color:'#4a2a6a', size:24, aggro:270, ab:{summon:{type:'skeleton', cd:6500, max:2, range:300}, keep:140}},
  emberbomb:   {hp:30,  dmg:0,  speed:98, xp:40,  gold:8,  color:'#2c2420', size:20, aggro:240, ab:{bomb:{r:66, fuse:650, dmg:26}}},
  dunepriest:  {hp:66,  dmg:13, speed:54, xp:66,  gold:15, color:'#d8b868', size:24, aggro:270, shoot:{kind:'sand',cd:3000,speed:140,range:230,n:1}, ab:{heal:{cd:3200, r:150, pct:0.2}, keep:130}},
  snowstalker: {hp:74,  dmg:20, speed:66, xp:80,  gold:17, color:'#a8d8f0', size:24, aggro:260, inflict:{kind:'freeze',ms:700,chance:0.3}, ab:{blink:{cd:4200, minR:56, maxR:110}}},
  vampbat:     {hp:36,  dmg:8,  speed:112,xp:30,  gold:6,  color:'#7a1f3a', size:18, aggro:220, erratic:true, ab:{leech:1.2}},
  bombardier:  {hp:92,  dmg:20, speed:50, xp:100, gold:24, color:'#6a5a3a', size:25, aggro:290, ab:{mortar:{cd:3400, range:290, r:56, delay:1000, dmg:22}, keep:150}},
};
Object.assign(ENEMY_BASE, NEW_ENEMY_BASE);

function freeSpotAround(cx, cy, w, h, minR, maxR, tries){
  for(let i=0;i<tries;i++){
    const a = Math.random()*6.283, r = minR + Math.random()*(maxR-minR), x = cx+Math.cos(a)*r-w/2, y = cy+Math.sin(a)*r-h/2;
    if(!isBlocked(loc, x, y, w, h)) return {x, y};
  }
  return null;
}
let guardHint = false;
function sfxNear(e,n){ if(Math.hypot(e.x-player.x,e.y-player.y)<420) SFX.play(n); }
const zoneHint = {};
const ZONE_NOTE = {fire:'🔥 Земля вспыхивает: не стойте в огненных кругах!', ice:'❄ Лёд сковывает землю: круги замедляют героя', poison:'☠ Ядовитые лужи: выходите из кругов', sand:'🏜 Зыбучий песок: круги замедляют героя'};
// щитоносец: удар с лицевой стороны ослаблен
function guardBlocks(e){
  if(!e.ab || !e.ab.guard || !e.ai || e.ai.g===undefined) return false;
  const g = e.ai.g, a = Math.atan2((player.y+player.h/2)-(e.y+e.h/2), (player.x+player.w/2)-(e.x+e.w/2));
  const d = Math.abs(((a-g)+Math.PI*3)%(Math.PI*2)-Math.PI);
  return d < 1.15;
}
// Вызывается из цикла врагов, когда враг преследует героя. Возвращает скорректированное движение; dead — враг уже убит.
function aiExtra(e, dt, dist, dx, dy, nx, ny, spd){
  const ab = e.ab, ms = dt*1000, ai = e.ai || (e.ai = {}), out = {nx, ny, spd, dead:false};
  if(!ab) return out;
  const ecx = e.x+e.w/2, ecy = e.y+e.h/2, pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  if(ab.keep){ if(dist<ab.keep){ out.nx = -nx; out.ny = -ny; out.spd = spd*0.9; } else if(dist<ab.keep+50) out.spd = 0; }
  if(ab.guard){
    if(ai.g===undefined) ai.g = Math.atan2(dy,dx);
    let d = Math.atan2(dy,dx)-ai.g; d = ((d+Math.PI*3)%(Math.PI*2))-Math.PI;
    ai.g += Math.max(-1,Math.min(1,d))*Math.min(1,dt*2.2);
    if(ai.gf>0) ai.gf -= ms;
  }
  if(ab.charge){
    const c = ab.charge;
    ai.cd = (ai.cd===undefined ? 600+Math.random()*c.cd : ai.cd) - ms;
    if(ai.st==='wind'){
      ai.t -= ms; out.spd = 0;
      if(ai.t<=0){ ai.st = 'dash'; ai.t = c.dash; const l = Math.hypot(dx,dy)||1; ai.dx = dx/l; ai.dy = dy/l; sfxNear(e,'charge'); }
    } else if(ai.st==='dash'){
      ai.t -= ms; out.nx = ai.dx; out.ny = ai.dy; out.spd = e.speed*c.mul;
      if(Math.random()<dt*20) burst(ecx, e.y+e.h-2, 1, {colors:['#cdbf9a','#a89a78'], sp:30, up:14, g:60, life:380, size:3});
      if(ai.t<=0){ ai.st = null; ai.cd = c.cd; }
    } else if(ai.cd<=0 && dist<c.range && dist>70 && e.los!==false){ ai.st = 'wind'; ai.t = c.wind; sfxNear(e,'roar'); }
  }
  if(ab.summon){
    const s = ab.summon;
    ai.sc = (ai.sc===undefined ? 1500 : ai.sc) - ms; if(ai.sa>0) ai.sa -= ms;
    if(ai.sc<=0 && dist<s.range && (e.phase||1)>=(s.minPhase||1)){
      if(!e.uid) e.uid = Math.floor(Math.random()*1e9)+1;
      const alive = loc.enemies.filter(m=>m.hp>0 && m.owner===e.uid).length;
      if(alive<s.max && loc.enemies.length<90){
        const p = freeSpotAround(ecx, ecy, 24, 24, 30, 60, 10);
        if(p){
          const m = makeEnemy(s.type, p.x, p.y, loc.level||1); m.minion = true; m.owner = e.uid; m.xp = 0; m.gold = 0; m.hp = m.maxHp = Math.round(m.maxHp*0.6);
          loc.enemies.push(m); ai.sa = 700; sfxNear(e,'summon'); burst(p.x+12, p.y+12, 12, {colors:['#46d68a','#9affc0','#1c4a30'], sp:60, up:40, g:-30, life:600, size:2.6});
          ai.sc = s.cd;
        } else ai.sc = 1200;
      } else ai.sc = 1500;
    }
  }
  if(ab.zones){
    const z = ab.zones; ai.zc = (ai.zc===undefined ? 2500 : ai.zc) - ms;
    if(ai.zc<=0 && dist<z.range){
      const n = (e.phase||1)>=3 ? 2 : 1;
      for(let i=0;i<n;i++){ const a = Math.random()*6.283, rr = i ? 70 : 0; hazards.push({x:pcx+Math.cos(a)*rr, y:pcy+Math.sin(a)*rr, r:z.r, t:-900, dur:z.dur, dps:z.dps, kind:z.kind}); }
      ai.zc = z.cd; sfxNear(e,'summon');
      if(!zoneHint[z.kind]){ zoneHint[z.kind] = 1; addNote(ZONE_NOTE[z.kind], '#ff9f4a'); }
    }
  }
  if(ab.bomb){
    const b = ab.bomb;
    if(ai.f>0){
      ai.f -= ms; out.spd = 0;
      if(ai.f<=0){
        aoes.push({x:ecx, y:ecy, r:b.r, t:0, dur:1, dmg:b.dmg, col:'#ff7a1a'});
        burst(ecx, ecy, 26, {colors:['#ff7a1a','#ffd34a','#3a2a20'], sp:150, up:30, g:40, life:560, size:3.4});
        sfxNear(e,'boom'); shakeT = Math.max(shakeT, 300); e.hp = 0; killEnemy(e); out.dead = true;
      }
    } else if(dist<38){ ai.f = b.fuse; sfxNear(e,'fuse'); }
  }
  if(ab.heal){
    const h = ab.heal;
    ai.hc = (ai.hc===undefined ? 1200 : ai.hc) - ms; if(ai.hf>0) ai.hf -= ms;
    if(ai.hc<=0){
      let healed = 0;
      for(const m of loc.enemies){
        if(m===e || m.hp<=0 || m.hp>=m.maxHp*0.9 || BOSS_TYPES.includes(m.type)) continue;
        if(Math.hypot((m.x+m.w/2)-ecx,(m.y+m.h/2)-ecy)>h.r) continue;
        m.hp = Math.min(m.maxHp, m.hp+m.maxHp*h.pct); healed++;
        burst(m.x+m.w/2, m.y+m.h/2, 6, {colors:['#7aff9a','#d8ffe0'], sp:30, up:40, g:-50, life:600, size:2.4});
      }
      if(healed){ ai.hf = 600; ai.hc = h.cd; sfxNear(e,'heal'); } else ai.hc = 700;
    }
  }
  if(ab.blink){
    const b = ab.blink;
    ai.bc = (ai.bc===undefined ? 1500+Math.random()*b.cd : ai.bc) - ms; if(ai.bl>0) ai.bl -= ms;
    if(ai.bc<=0 && dist<280 && dist>b.maxR+10){
      const p = freeSpotAround(pcx, pcy, e.w, e.h, b.minR, b.maxR, 14);
      if(p){
        burst(ecx, ecy, 12, {colors:['#d8f4ff','#7ab8f0'], sp:70, up:30, g:-20, life:500, size:2.6});
        e.x = p.x; e.y = p.y; ai.bl = 450; ai.bc = b.cd; sfxNear(e,'blink');
        burst(e.x+e.w/2, e.y+e.h/2, 12, {colors:['#d8f4ff','#7ab8f0'], sp:70, up:30, g:-20, life:500, size:2.6});
      } else ai.bc = 1000;
    }
  }
  if(ab.mortar){
    const m = ab.mortar;
    ai.mc = (ai.mc===undefined ? 800+Math.random()*m.cd : ai.mc) - ms; if(ai.mf>0) ai.mf -= ms;
    if(ai.mc<=0 && dist<m.range && e.los!==false){
      aoes.push({x:pcx, y:pcy, r:m.r, t:0, dur:m.delay, dmg:Math.round(m.dmg*(e.dmg/ENEMY_BASE[e.type].dmg||1)), col:'#caa43a'});
      ai.mc = m.cd; ai.mf = 350; sfxNear(e,'mortar');
    }
  }
  return out;
}
// вызывается из killEnemy
function onEnemyDeath(e){
  const ab = e.ab; if(!ab) return;
  if(ab.split && !e.noSplit){
    const cx = e.x+e.w/2, cy = e.y+e.h/2;
    for(let i=0;i<ab.split.n;i++){
      const s = ENEMY_BASE[ab.split.type], p = freeSpotAround(cx, cy, s.size, s.size, 4, 22, 10) || {x:e.x, y:e.y};
      const m = makeEnemy(ab.split.type, p.x, p.y, loc.level||1); m.minion = true; m.xp = 2; m.gold = 0; m.cooldown = 600; loc.enemies.push(m);
    }
    sfxNear(e,'splat');
  }
  if(ab.summon && e.uid){
    for(const m of loc.enemies) if(m.owner===e.uid && m.hp>0){ m.hp = 0; startDeathFx(m); }
  }
}
// у стражей логов свои умения (см. ниже): призыв, щит, зоны на земле, рывок, телепорт
const BOSS_AB = {
  boss:       {summon:{type:'skeleton',  cd:7500, max:3, range:360, minPhase:2}},
  spiderqueen:{summon:{type:'webspider', cd:8500, max:2, range:360, minPhase:1}},
  shadowlord: {guard:true},
  lavalord:   {zones:{kind:'fire',   cd:5200, r:46, dur:6500, dps:11, range:420}},
  pharaoh:    {summon:{type:'mummy', cd:9000, max:2, range:360, minPhase:2}, zones:{kind:'sand', cd:7000, r:50, dur:5000, dps:5, range:420}},
  frostking:  {zones:{kind:'ice',    cd:5600, r:50, dur:6000, dps:6,  range:420}},
  lich:       {summon:{type:'skelarcher', cd:8000, max:2, range:380, minPhase:1}},
  treant:     {zones:{kind:'poison', cd:5000, r:48, dur:6500, dps:9,  range:420}},
  warlord:    {guard:true, charge:{wind:900, dash:700, mul:3, cd:5200, range:320}},
  phantom:    {blink:{cd:5200, minR:70, maxR:130}, summon:{type:'cursedbook', cd:8500, max:2, range:380, minPhase:1}}
};
for(const k in BOSS_AB) ENEMY_BASE[k].ab = BOSS_AB[k];
