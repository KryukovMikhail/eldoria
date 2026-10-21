// ---------- Сущности ----------
const ENEMY_BASE = {
    wolf:   {hp:28,  dmg:7,  speed:75,  xp:14, gold:2, color:'#9c9c9c', size:22, aggro:150},
    slime:  {hp:18,  dmg:5,  speed:40,  xp:9,  gold:2, color:'#4fd15b', size:20, aggro:110},
    skeleton:{hp:42, dmg:11, speed:55,  xp:24, gold:5, color:'#d8d3bd', size:24, aggro:170},
    wraith: {hp:58,  dmg:15, speed:72,  xp:34, gold:8, color:'#7a4fbd', size:24, aggro:200},
    boss:   {hp:220, dmg:20, speed:55,  xp:150,gold:60, color:'#b23a3a', size:38, aggro:260},
    shadowlord:{hp:340,dmg:27,speed:62, xp:320,gold:150,color:'#3a1a4d', size:42, aggro:300},
    goblin: {hp:34,  dmg:8,  speed:68,  xp:18, gold:4, color:'#7fae3a', size:22, aggro:160},
    bat:    {hp:16,  dmg:5,  speed:105, xp:10, gold:2, color:'#4a3358', size:18, aggro:190, erratic:true},
    spider: {hp:30,  dmg:9,  speed:78,  xp:20, gold:4, color:'#2e1b3a', size:22, aggro:150},
    zombie: {hp:70,  dmg:12, speed:36,  xp:28, gold:6, color:'#5a6b4a', size:24, aggro:140},
    darkknight:{hp:88,dmg:17,speed:58,  xp:46, gold:10,color:'#2f323f', size:25, aggro:190},
    imp:    {hp:34,  dmg:10, speed:70,  xp:36, gold:9, color:'#c7352a', size:20, aggro:230, shoot:{kind:'fire',cd:2200,speed:150,range:220,n:1,keep:true}},
    lavaslime:{hp:50,dmg:12, speed:42,  xp:34, gold:8, color:'#e0561a', size:22, aggro:130, inflict:{kind:'burn',ms:2800,chance:0.5}},
    golem:  {hp:100, dmg:17, speed:36,  xp:50, gold:12,color:'#5c5560', size:30, aggro:150},
    lavalord:{hp:560,dmg:24, speed:60,  xp:520,gold:260,color:'#ff6a1a', size:42, aggro:340, shoot:{kind:'fire',cd:1700,speed:170,range:300,n:3}},
    scorpion:{hp:46, dmg:13, speed:80,  xp:38, gold:9, color:'#b8742e', size:24, aggro:170, inflict:{kind:'poison',ms:3000,chance:0.5}},
    mummy:  {hp:84,  dmg:15, speed:40,  xp:48, gold:12,color:'#e0d6b0', size:24, aggro:150},
    cobra:  {hp:38,  dmg:18, speed:86,  xp:44, gold:10,color:'#8a9a30', size:22, aggro:170, inflict:{kind:'poison',ms:4000,chance:0.7}},
    pharaoh:{hp:700, dmg:26, speed:58,  xp:760,gold:340,color:'#d8a824', size:40, aggro:340, shoot:{kind:'sand',cd:2100,speed:150,range:280,n:2}},
    icewolf:{hp:56,  dmg:13, speed:92,  xp:42, gold:10,color:'#b4cbe0', size:24, aggro:200},
    yeti:   {hp:120, dmg:19, speed:50,  xp:60, gold:14,color:'#f2f8fc', size:30, aggro:160, inflict:{kind:'freeze',ms:1000,chance:0.35}},
    frostwraith:{hp:64,dmg:13,speed:66, xp:56, gold:12,color:'#9fd8f0', size:24, aggro:230, shoot:{kind:'ice',cd:2400,speed:140,range:220,n:1,keep:true}},
    ghoul:  {hp:96,  dmg:21, speed:74,  xp:70, gold:16,color:'#7d8a70', size:24, aggro:200},
    banshee:{hp:70,  dmg:16, speed:62,  xp:72, gold:16,color:'#7fd8a8', size:24, aggro:240, shoot:{kind:'wail',cd:2300,speed:135,range:230,n:1,keep:true}},
    lich:   {hp:1000,dmg:30, speed:60,  xp:1400,gold:700,color:'#46d68a', size:42, aggro:360, shoot:{kind:'curse',cd:1500,speed:170,range:320,n:3}},
    panther:{hp:90,  dmg:22, speed:110, xp:78, gold:17,color:'#2a2a38', size:26, aggro:230},
    shroom: {hp:84,  dmg:14, speed:30,  xp:74, gold:16,color:'#9a4fc0', size:24, aggro:220, shoot:{kind:'spore',cd:2200,speed:120,range:220,n:2}},
    gorilla:{hp:190, dmg:26, speed:56,  xp:96, gold:22,color:'#4a4a4e', size:32, aggro:170},
    spiderqueen:{hp:300,dmg:22, speed:64, xp:240,gold:110,color:'#6a3a8a', size:40, aggro:300, shoot:{kind:'web',cd:2000,speed:140,range:290,n:3}},
    warlord:{hp:1300,dmg:32, speed:66,  xp:2400,gold:1100,color:'#8a1f2a', size:42, aggro:360, shoot:{kind:'fire',cd:1800,speed:175,range:320,n:2}},
    phantom:{hp:1450,dmg:30, speed:62,  xp:3000,gold:1500,color:'#8fe8d8', size:40, aggro:380, shoot:{kind:'curse',cd:1400,speed:175,range:340,n:3}},
    treant: {hp:1250,dmg:34, speed:52,  xp:2000,gold:1000,color:'#5a8a2a', size:46, aggro:360, shoot:{kind:'spore',cd:1700,speed:160,range:320,n:3}},
    frostking:{hp:860,dmg:28,speed:62,  xp:1000,gold:500,color:'#7ab4e0', size:42, aggro:350, shoot:{kind:'ice',cd:1600,speed:170,range:300,n:3}},
    webspider:{hp:60, dmg:12, speed:62, xp:40, gold:9, color:'#34465a', size:24, aggro:250, shoot:{kind:'web',cd:2600,speed:125,range:250,n:1,keep:true}},

    boar:   {hp:40,  dmg:10, speed:88,  xp:17, gold:3, color:'#6a4a32', size:24, aggro:150},
    bandit: {hp:42,  dmg:9,  speed:66,  xp:24, gold:9, color:'#5a4a3a', size:22, aggro:220, shoot:{kind:'knife',cd:2600,speed:210,range:210,n:1,keep:true}},
    giantrat:{hp:28, dmg:8,  speed:92,  xp:15, gold:2, color:'#8a7a6a', size:20, aggro:160},
    gargoyle:{hp:115,dmg:19, speed:50,  xp:58, gold:13,color:'#7a808c', size:26, aggro:180},
    salamander:{hp:72,dmg:15,speed:76,  xp:50, gold:12,color:'#ff7a2a', size:24, aggro:210, shoot:{kind:'fire',cd:2500,speed:150,range:170,n:1,keep:true}},
    vulture:{hp:52,  dmg:14, speed:98,  xp:44, gold:10,color:'#4a3a32', size:22, aggro:210, erratic:true},
    icegolem:{hp:155,dmg:23, speed:34,  xp:74, gold:17,color:'#9fd0f0', size:30, aggro:150},
    skelarcher:{hp:68,dmg:17,speed:56,  xp:68, gold:15,color:'#d8d3bd', size:24, aggro:240, shoot:{kind:'arrow',cd:2300,speed:220,range:260,n:1,keep:true}},
    hunter: {hp:104, dmg:22, speed:64,  xp:92, gold:21,color:'#3f6a2a', size:24, aggro:240, shoot:{kind:'dart',cd:2100,speed:230,range:250,n:1,keep:true}},
    crossbowman:{hp:112,dmg:26,speed:58,xp:106,gold:25,color:'#7a7f8c', size:25, aggro:260, shoot:{kind:'bolt',cd:2400,speed:250,range:290,n:1,keep:true}},
    frostmite:{hp:62, dmg:13, speed:86, xp:54, gold:12,color:'#bfeaff', size:22, aggro:200, inflict:{kind:'freeze',ms:1300,chance:0.6}},
    cinderhound:{hp:78,dmg:16,speed:104,xp:54, gold:12,color:'#c2461e', size:24, aggro:230, inflict:{kind:'burn',ms:3600,chance:0.7}},
    pyromancer:{hp:62,dmg:15, speed:58, xp:58, gold:14,color:'#ff6a2a', size:24, aggro:260, shoot:{kind:'fire',cd:2500,speed:160,range:260,n:2,keep:true}},
    blizzardmage:{hp:78,dmg:16,speed:56,xp:78, gold:17,color:'#7ab8f0', size:24, aggro:260, shoot:{kind:'ice',cd:2700,speed:150,range:260,n:1,keep:true}},
    venomtoad:{hp:98, dmg:18, speed:54, xp:92, gold:20,color:'#5a9a2a', size:24, aggro:190, inflict:{kind:'poison',ms:4500,chance:0.8}, shoot:{kind:'spore',cd:3000,speed:130,range:200,n:1,keep:true}},
    cursedbook:{hp:92,dmg:22,speed:72,  xp:112,gold:27,color:'#6a2a8a', size:22, aggro:240, erratic:true, shoot:{kind:'curse',cd:2200,speed:150,range:230,n:1,keep:true}},
};
function makeEnemy(type,x,y,level=1){
  const base = ENEMY_BASE[type];
  const k = level>=4 ? (level-4)*0.25 : level-1;   // враги глубоких уровней уже рассчитаны, растут слабо
  const e = {
    type, x, y, w:base.size, h:base.size, hp:base.hp*(1+k*0.3), maxHp:base.hp*(1+k*0.3),
    dmg:Math.round(base.dmg*(1+k*0.25)), speed:base.speed, xp:base.xp, gold:base.gold,
    color:base.color, aggro:base.aggro, cooldown:0, hitFlash:0, dir:'down', seed:Math.random()*6.28
  };
  if(base.shoot) e.shoot = base.shoot;
  if(base.erratic) e.erratic = true;
  if(base.inflict) e.inflict = base.inflict;
  if(base.ab) e.ab = base.ab;
  const g = 1+0.4*(player.ngp||0);                   // «Новая игра+»: враги крепче
  if(g>1){ e.hp *= g; e.maxHp *= g; e.dmg = Math.round(e.dmg*(1+(g-1)*0.8)); e.xp = Math.round(e.xp*(1+(g-1)*0.5)); }
  return e;
}
// на карте золота стало заметно меньше: потион выпадает как раньше, золото — лишь в части точек
function pickupType(pPotion){ return Math.random()<pPotion ? 'potion' : Math.random()<0.4 ? 'gold' : null; }
function makeItem(type,x,y){
  return { type, x, y, w:16, h:16, value: type==='gold'? rnd(3,10) : 1 };
}

// ---------- Оружие ----------
// mult — множитель к базовому урону игрока (растёт с уровнем). Новое оружие добавляется сюда же.
// cooldown — перезарядка (мс). axe бьёт по площади, bow стреляет стрелами.
const WEAPONS = {
  sword: { name:'Меч',          mult:1,   price:0,   cooldown:380, desc:'Базовое оружие, удар на одну клетку.' },
  spear: { name:'Копьё',        mult:1.5, price:50,  cooldown:380, desc:'Заметно сильнее меча.' },
  axe:   { name:'Боевой топор', mult:2.5, price:130, cooldown:620, desc:'Тяжёлый удар по большой площади, но заметно медленнее.' },
  bow:   { name:'Лук',          mult:1.6, price:90,  cooldown:560, ranged:true, proj:'arrow', pspeed:430, prange:150, desc:'Стреляет стрелами примерно на 4,5 клетки. Перезарядка дольше.' },
  crossbow:{ name:'Арбалет',     mult:3.0, price:300, cooldown:860, ranged:true, proj:'bolt',  pspeed:540, prange:200, desc:'Мощные болты летят дальше и бьют сильнее лука. Перезаряжается медленно.' },
  musket:{ name:'Мушкет',        mult:5.0, price:700, cooldown:1400,ranged:true, proj:'bullet',pspeed:900, prange:300, desc:'Самое мощное оружие: пуля летит почти через весь экран. Долгая перезарядка.' },
  dagger:{ name:'Парные кинжалы', mult:0.8, price:110, cooldown:230, desc:'Очень быстрые удары по короткой дуге; каждый четвёртый удар — критический (×2).' },
  hammer:{ name:'Боевой молот', mult:3.9, price:520, cooldown:1050, desc:'Сокрушительный удар по большой площади: оглушает врагов (боссов — ненадолго).' },
  staff: { name:'Посох чародея', mult:2.9, price:900, cooldown:700, ranged:true, proj:'orb', pspeed:360, prange:190, desc:'Магический шар взрывается при попадании и ранит врагов вокруг цели.' }
};
const WEAPON_SFX = { sword:'swing', spear:'spear', axe:'axe', bow:'bow', crossbow:'crossbow', musket:'musket', dagger:'swing', hammer:'axe', staff:'crossbow' };
// оружие открывается постепенно: число побеждённых стражей-боссов, нужное для покупки
const WEAPON_UNLOCK = { sword:0, spear:1, bow:2, axe:3, crossbow:4, musket:5, dagger:2, hammer:6, staff:7 };
const BOSS_NAME_BY_STAGE = ['Мортракс','Шелиба','Ноктурн','Игнаррок','Хар-Атеп','Криомир','Морвейн','Ольхарон','Вархаал','Эфирий'];
const ARMOR_UNLOCK = { none:0, leather:0, chain:1, plate:2 };
function armorUnlocked(id){ return (ARMOR_UNLOCK[id]||0) <= storyStage(); }
function weaponUnlocked(id){ return (WEAPON_UNLOCK[id]||0) <= storyStage(); }
function weaponLockText(id){ const n = WEAPON_UNLOCK[id]||0; return '🔒 После победы над стражем №'+n+': '+BOSS_NAME_BY_STAGE[n-1]; }

// ---------- Броня ----------
// reduce — доля урона, которую броня гасит. Новая броня добавляется строкой в эту таблицу.
const ARMORS = {
  none:    { name:'Без брони',      reduce:0,    price:0,   color:'#12314a', desc:'Простая одежда путника.' },
  leather: { name:'Кожаная броня',  reduce:0.20, price:60,  color:'#a8702f', desc:'Лёгкая и недорогая.' },
  chain:   { name:'Кольчуга',       reduce:0.35, price:140, color:'#b8c4d0', desc:'Надёжная защита от скелетов и волков.' },
  plate:   { name:'Стальные латы',  reduce:0.50, price:240, color:'#e8d27a', desc:'Лучшая броня в Эльдории.' }
};
const POTION_BUY = 20, POTION_SELL = 8, POTION_MAX = 8;

// ---------- Игрок ----------
const player = {
  x:0,y:0,w:22,h:22, speed:165, dir:'down',
  hp:100, maxHp:100, atk:16, level:1, xp:0, xpNext:50, gold:0, potions:3,
  attackTimer:0, attackDuration:220, attacking:false, invuln:0, hitFlash:0,
  codex:{e:{},a:{},k:{}}, weapon:'sword', owned:{sword:true}, armor:'none', ownedArmor:{none:true},
  quest:null, questsDone:{},
  sp:0, skills:{dash:0,spin:0,shield:0,might:0}, gear:{helm:null,ring:null,amulet:null}, bag:[], wLvl:{}, ench:{}, cd:{dash:0,spin:0,shield:0}, shield:0, dashT:0, dvx:0, dvy:0, spinFx:0, spinR:0, vamp:0,
  elix:{big:0,speed:0,might:0,guard:0,swim:0}, buff:{speed:0,might:0,guard:0,swim:0}, slowT:0, boots:false,
  fx:{freeze:0,freezeImm:0,burn:0,burnDps:0,poison:0,poisonDps:0,acc:0}
};
function incomingDamage(d){
  const red = Math.min(0.85, ARMORS[player.armor].reduce + gearStat('def')/100);
  return Math.max(1, Math.round(d * (1-red) * (player.shield>0 ? 0.2 : 1) * (player.buff.guard>0 ? 0.5 : 1) * (player.sb && player.sb.might==='b' ? 0.88 : 1) * diffMul('dmg') * dailyMul('inn')));
}
function playerDamage(){ return Math.round(player.atk * WEAPONS[player.weapon].mult * weaponMul() * (1 + (gearStat('dmg') + 6*player.skills.might + (player.buff.might>0 ? 50 : 0))/100) * (player.counterT>0 ? 1.5 : 1)); }

// ---------- Эликсиры ----------
const ELIX = {
  big:  {name:'Большой эликсир здоровья', price:55, sell:22, col:'#e0508a', col2:'#ffb0d0', desc:'Мгновенно лечит 80 HP.'},
  speed:{name:'Зелье скорости',    price:45, sell:18, dur:20000, col:'#34c8f0', col2:'#c0f4ff', desc:'+40% к скорости на 20 с, снимает замедление паутиной.'},
  might:{name:'Зелье силы',        price:50, sell:20, dur:25000, col:'#ff9a2a', col2:'#ffe4a8', desc:'+50% к урону на 25 с.'},
  swim: {name:'Зелье водохода',    price:60, sell:24, dur:40000, col:'#27c9b8', col2:'#b8fff0', desc:'Позволяет ходить по воде 40 с (вода замедляет). Тушит горение.'},
  guard:{name:'Зелье стойкости',   price:50, sell:20, dur:25000, col:'#8a7aff', col2:'#d8d0ff', desc:'Получаемый урон вдвое меньше на 25 с.'}
};
const ELIX_KEYS = ['big','speed','might','guard','swim'], ELIX_MAX = 5;
const elixLatch = {big:false, speed:false, might:false, guard:false, swim:false};
function drawElixirIcon(cx,cy,sc,kind,glow){
  const d = ELIX[kind];
  ctx.save(); ctx.translate(cx,cy); ctx.scale(sc,sc);
  if(glow){ const gr = ctx.createRadialGradient(0,0,2,0,0,15); gr.addColorStop(0,d.col+'99'); gr.addColorStop(1,d.col+'00'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,15,0,6.283); ctx.fill(); }
  ctx.lineWidth = 1.1; ctx.strokeStyle = 'rgba(20,10,20,0.85)';
  ctx.fillStyle = d.col; ctx.beginPath(); ctx.arc(0,2.4,5.8,0,6.283); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.arc(0,2.4,5.8,0.15*Math.PI,0.85*Math.PI); ctx.fill();
  ctx.fillStyle = d.col2; ctx.beginPath(); ctx.ellipse(-2.4,0.6,1.3,2.2,-0.4,0,6.283); ctx.fill();
  ctx.fillStyle = '#d9e6ee'; ctx.strokeStyle = '#5a6a74'; ctx.beginPath(); ctx.rect(-1.8,-6.2,3.6,4.4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-2.3,-8.6,4.6,2.6);
  ctx.fillStyle = '#fff';
  if(kind==='big'){ ctx.fillRect(-0.7,0.6,1.4,3.8); ctx.fillRect(-1.9,1.8,3.8,1.4); }
  else if(kind==='speed'){ ctx.beginPath(); ctx.moveTo(1.4,-0.2); ctx.lineTo(-1.6,2.9); ctx.lineTo(0.2,2.9); ctx.lineTo(-1,5.6); ctx.lineTo(2,2.2); ctx.lineTo(0.2,2.2); ctx.closePath(); ctx.fill(); }
  else if(kind==='might'){ ctx.beginPath(); ctx.moveTo(0,-0.2); ctx.lineTo(1.2,1.8); ctx.lineTo(3.2,2.4); ctx.lineTo(1.2,3.2); ctx.lineTo(0,5.2); ctx.lineTo(-1.2,3.2); ctx.lineTo(-3.2,2.4); ctx.lineTo(-1.2,1.8); ctx.closePath(); ctx.fill(); }
  else if(kind==='swim'){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; for(const yy of [1.4,3.4,5.2]){ ctx.beginPath(); ctx.moveTo(-3,yy); ctx.quadraticCurveTo(-1.5,yy-1.4,0,yy); ctx.quadraticCurveTo(1.5,yy+1.4,3,yy); ctx.stroke(); } }
  else { ctx.beginPath(); ctx.moveTo(-2.4,0.6); ctx.lineTo(2.4,0.6); ctx.lineTo(2.4,3); ctx.quadraticCurveTo(2.4,4.8,0,5.7); ctx.quadraticCurveTo(-2.4,4.8,-2.4,3); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function useElixir(k){
  if(gameState!=='playing' || !ELIX[k]) return false;
  const d = ELIX[k];
  if(!(player.elix[k]>0)){ addNote('Нет: '+d.name.toLowerCase(), '#e07f7f'); SFX.play('deny'); return false; }
  if(k==='big'){
    if(player.hp>=player.maxHp && !(player.fx.burn>0 || player.fx.poison>0)){ addNote('Здоровье уже полное', '#e0c96a'); return false; }
    player.hp = Math.min(player.maxHp, player.hp+80);
    addNote('Выпит большой эликсир здоровья (+80 HP)', '#7fe07f');
    if(player.fx.burn>0 || player.fx.poison>0){ player.fx.burn = 0; player.fx.poison = 0; addNote('Эликсир снял горение и яд', '#7fe07f'); }
  } else {
    player.buff[k] = d.dur;
    if(k==='speed') player.slowT = 0;
    addNote(d.name+': '+d.desc.split(',')[0].replace(/\.$/,''), d.col);
  }
  player.elix[k]--; SFX.play('drink');
  burst(player.x+player.w/2, player.y+player.h/2, 10, {colors:[d.col,d.col2,'#ffffff'], sp:60, up:40, g:-60, life:600, size:2.4});
  return true;
}
function elixTick(dt){
  for(const k of ['speed','might','guard','swim']) if(player.buff[k]>0){ player.buff[k] = Math.max(0, player.buff[k]-dt*1000); if(player.buff[k]===0) addNote('Действие зелья закончилось: '+ELIX[k].name.toLowerCase(), '#a89d78'); }
  player.slowT = Math.max(0, (player.slowT||0)-dt*1000);
  ELIX_KEYS.forEach((k,i)=>{
    const on = keys['Digit'+(i+1)] || keys['Numpad'+(i+1)];
    if(on && !elixLatch[k]){ elixLatch[k] = true; useElixir(k); }
    if(!on) elixLatch[k] = false;
  });
}

// ---------- Спасение из непроходимой клетки (лава, вода после окончания зелья) ----------
function rescuePlayer(){
  if(player.dashT>0 || loc.type==='overworld' && swimOn()) return;
  if(!isBlocked(loc, player.x, player.y, player.w, player.h)) return;
  const wasWater = onWater();
  const cx = Math.floor((player.x+player.w/2)/TILE), cy = Math.floor((player.y+player.h/2)/TILE);
  for(let r=1;r<=18;r++){
    let best = null, bd = 1e9;
    for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
      const tx = cx+dx, ty = cy+dy; if(tx<1||ty<1||tx>=loc.width-1||ty>=loc.height-1) continue;
      const x = tx*TILE+(TILE-player.w)/2, y = ty*TILE+(TILE-player.h)/2;
      if(isBlocked(loc,x,y,player.w,player.h)) continue;
      const d = dx*dx+dy*dy; if(d<bd){ bd = d; best = [x,y]; }
    }
    if(best){ player.x = best[0]; player.y = best[1]; addNote(wasWater ? '🌊 Вас вынесло на берег' : '✦ Вас вынесло на твёрдую землю', '#9fd8ff'); return; }
  }
}
// ---------- Статусы: заморозка, горение, яд ----------
const STATUS_INFO = {
  freeze:{n:'Заморозка', icon:'❄', col:'#9fe0ff'},
  burn:  {n:'Горение',   icon:'🔥', col:'#ff8a2a'},
  poison:{n:'Яд',        icon:'☠', col:'#8aff4a'}
};
const SHOT_FX = { fire:['burn',3400,0.6], ice:['freeze',1100,0.5], spore:['poison',4200,0.6] };
function statusImmune(){ return player.shield>0 || player.dashT>0 || player.buff.guard>0; }
function inflictStatus(kind, ms, baseDmg){
  if(statusImmune() || gameState!=='playing') return false;
  const f = player.fx;
  if(kind==='freeze'){
    if(f.freeze>0 || f.freezeImm>0) return false;
    f.freeze = ms; f.freezeImm = 2200; player.dashT = 0; addNote('❄ Вы заморожены и не можете двигаться!', '#9fe0ff'); SFX.play('hit');
  } else if(kind==='burn'){
    if(onWater()) return false;
    if(!(f.burn>0)) addNote('🔥 Вы горите — здоровье убывает!', '#ff8a2a');
    f.burn = ms; f.burnDps = Math.max(2, Math.round(incomingDamage(baseDmg)*0.3));
  } else if(kind==='poison'){
    if(!(f.poison>0)) addNote('☠ Вы отравлены — здоровье убывает!', '#8aff4a');
    f.poison = ms; f.poisonDps = Math.max(1, Math.round(incomingDamage(baseDmg)*0.18));
  }
  return true;
}
function statusTick(dt){
  const f = player.fx; if(!f) return;
  const ms = dt*1000;
  if(f.freeze>0){ f.freeze = Math.max(0,f.freeze-ms); if(f.freeze===0) addNote('Лёд растаял — вы снова можете двигаться', '#a89d78'); }
  else f.freezeImm = Math.max(0,f.freezeImm-ms);
  if(f.burn>0 && onWater()){ f.burn = 0; addNote('💧 Вода потушила огонь', '#9fd8ff'); }
  if(f.burn>0 || f.poison>0){
    let dps = 0;
    if(f.burn>0){ f.burn = Math.max(0,f.burn-ms); dps += f.burnDps; }
    if(f.poison>0){ f.poison = Math.max(0,f.poison-ms); dps += f.poisonDps; }
    f.acc += dps*dt;
    while(f.acc>=1){
      f.acc -= 1;
      if(f.burn>0 || player.hp>1){ player.hp -= 1; player.hitFlash = Math.max(player.hitFlash,90); }
      if(player.hp<=0){ player.hp = 0; onPlayerDeath(); return; }
    }
    if(f.burn>0 && Math.random()<dt*14) burst(player.x+player.w/2+rnd(-6,6), player.y+4, 1, {colors:['#ff9a2a','#ffd34a','#ff4a1a'], sp:20, up:30, g:-90, life:420, size:2.4});
    if(f.poison>0 && Math.random()<dt*7) burst(player.x+player.w/2+rnd(-6,6), player.y+8, 1, {colors:['#8aff4a','#4a9a1a'], sp:14, up:14, g:-40, life:500, size:2});
  }
}
function drawStatusFx(sx,sy){
  const f = player.fx; if(!f) return;
  const cx = sx+player.w/2, cy = sy+player.h/2, t = Date.now()/1000;
  if(f.freeze>0){
    ctx.fillStyle = 'rgba(150,215,255,0.5)'; ctx.strokeStyle = 'rgba(230,248,255,0.95)'; ctx.lineWidth = 1.6;
    rrect(cx-13,cy-16,26,34,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(cx-9,cy-12,4,12); ctx.fillRect(cx-9,cy+3,2.4,5);
  }
  if(f.burn>0){
    for(let i=0;i<3;i++){ const ph = t*9+i*2.1, x = cx-8+i*8, h = 9+3*Math.sin(ph);
      ctx.fillStyle = 'rgba(255,120,30,0.85)'; ctx.beginPath(); ctx.moveTo(x-4,cy-4); ctx.quadraticCurveTo(x-3,cy-4-h,x,cy-8-h); ctx.quadraticCurveTo(x+3,cy-4-h*0.6,x+4,cy-4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,90,0.9)'; ctx.beginPath(); ctx.moveTo(x-2,cy-4); ctx.quadraticCurveTo(x,cy-4-h*0.7,x+2,cy-4); ctx.closePath(); ctx.fill(); }
  }
  if(f.poison>0){
    for(let i=0;i<3;i++){ const ph = (t*0.9+i/3)%1; ctx.fillStyle = 'rgba(140,255,80,'+(0.7*(1-ph))+')'; ctx.beginPath(); ctx.arc(cx-7+i*7+Math.sin(t*3+i)*2, cy-6-ph*20, 2.4, 0, 6.283); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,230,60,0.45)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx,cy+2,14,17,0,0,6.283); ctx.stroke();
  }
  if(swimOn() && onWater()){
    ctx.fillStyle = 'rgba(46,150,200,0.55)'; ctx.beginPath(); ctx.ellipse(cx,cy+8,13,8,0,0,6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(220,250,255,0.8)'; ctx.lineWidth = 1.2;
    for(let i=0;i<2;i++){ const p = (t*1.2+i*0.5)%1; ctx.globalAlpha = 1-p; ctx.beginPath(); ctx.ellipse(cx,cy+9,10+p*12,5+p*5,0,0,6.283); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
}
function drawStatusHUD(){
  const f = player.fx; if(!f) return;
  let y = UI.t+244+(player.slowT>0?24:0);
  for(const k of ['freeze','burn','poison']){
    if(!(f[k]>0)) continue;
    const I = STATUS_INFO[k], w = 112;
    ctx.fillStyle = 'rgba(20,20,30,0.8)'; ctx.fillRect(UI.l+8,y,w,20); ctx.strokeStyle = I.col; ctx.lineWidth = 1; ctx.strokeRect(UI.l+8.5,y+0.5,w-1,19);
    ctx.fillStyle = I.col; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(I.icon+' '+I.n+' '+(f[k]/1000).toFixed(1), UI.l+14, y+14);
    y += 24;
  }
  if(player.buff.swim>0){
    const w = 112; ctx.fillStyle = 'rgba(10,40,40,0.8)'; ctx.fillRect(UI.l+8,y,w,20); ctx.strokeStyle = '#27c9b8'; ctx.lineWidth = 1; ctx.strokeRect(UI.l+8.5,y+0.5,w-1,19);
    const blink = player.buff.swim<6000 && Math.floor(Date.now()/250)%2===0;
    ctx.fillStyle = blink ? '#ff8a6a' : '#27c9b8'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('🌊 Водоход '+(player.buff.swim/1000).toFixed(0)+' с', UI.l+14, y+14);
  }
}
function applyWebSlow(){
  if(player.shield>0 || player.dashT>0) return;
  if(!(player.slowT>0)) addNote('🕸 Паутина замедляет вас!', '#c8c8dc');
  player.slowT = 2600;
}
function maybeDropElixir(e){
  if(e.minion) return;
  const boss = BOSS_TYPES.includes(e.type);
  if(!boss && Math.random()>0.045) return;
  loc.items.push({type:'elixir', kind:ELIX_KEYS[rnd(0,4)], x:e.x+e.w/2-8+rnd(-6,6), y:e.y+e.h/2-8, w:16, h:16, value:1});
}
function elixLayout(){
  const list = ELIX_KEYS.filter(k=> player.elix[k]>0 || (k!=='big' && player.buff[k]>0));
  return list.map((k,i)=>({k, x:UI.l+8+i*40, y:UI.t+202, w:36, h:36}));
}
function drawElixHUD(){
  const L = elixLayout();
  ctx.save();
  for(const s of L){
    const d = ELIX[s.k], n = player.elix[s.k], act = s.k!=='big' && player.buff[s.k]>0;
    ctx.fillStyle = 'rgba(10,8,4,0.72)'; ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.strokeStyle = act ? d.col : '#5c4415'; ctx.lineWidth = act ? 2 : 1; ctx.strokeRect(s.x+0.5,s.y+0.5,s.w-1,s.h-1);
    drawElixirIcon(s.x+s.w/2, s.y+s.h/2, 1.3, s.k, act);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('×'+n, s.x+s.w-2, s.y+s.h-3);
    ctx.textAlign = 'left'; ctx.fillStyle = '#e8c873'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(String(ELIX_KEYS.indexOf(s.k)+1), s.x+3, s.y+10);
    if(act){ ctx.fillStyle = d.col; ctx.fillRect(s.x, s.y+s.h-3, s.w*player.buff[s.k]/d.dur, 3); }
  }
  drawStatusHUD();
  if(player.slowT>0){
    const y = UI.t+184, w = 112;
    ctx.fillStyle = 'rgba(40,40,56,0.8)'; ctx.fillRect(UI.l+52,y,w,20); ctx.strokeStyle = '#a8a8c0'; ctx.lineWidth = 1; ctx.strokeRect(UI.l+52.5,y+0.5,w-1,19);
    ctx.fillStyle = '#e4e4f4'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('🕸 Замедление '+(player.slowT/1000).toFixed(1), UI.l+58, y+14);
  }
  ctx.restore();
}
canvas.addEventListener('pointerdown', e=>{
  if(gameState!=='playing') return;
  const r = canvas.getBoundingClientRect(); if(!r.width) return;
  const x = (e.clientX-r.left)*canvas.width/r.width, y = (e.clientY-r.top)*canvas.height/r.height;
  for(const s of elixLayout()) if(x>=s.x && x<=s.x+s.w && y>=s.y && y<=s.y+s.h){ useElixir(s.k); break; }
});

let world = {};
let currentLocId = 'overworld';
let loc = null;
let transitionCooldown = 0;
let notifications = [];
let fullInvNoticeTimer = 0;
let saveFlash = 0, storageOK = false;
let shopLock = false; // после закрытия лавки она не открывается снова, пока игрок не отойдёт
let gameState = 'start'; // start | playing | dead | won

