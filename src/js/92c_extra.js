// ======================= Сезоны, секретные боссы, настройки, подсказки в бою, код переноса =======================
const SET_KEY = 'eldoria_settings', TIPS_KEY = 'eldoria_tips';
const SET = { music:1, sfx:1, shake:true, nums:false, tips:true, season:true, lefty:false, ctrl:1 };
(function loadSet(){ try{ const o = JSON.parse(localStorage.getItem(SET_KEY)); if(o) for(const k in SET) if(typeof o[k]===typeof SET[k]) SET[k] = o[k]; }catch(e){} })();
function saveSet(){ try{ localStorage.setItem(SET_KEY, JSON.stringify(SET)); }catch(e){} }

// ---------- сезоны ----------
const SEASON_DAYS = 2;                                       // игровых суток на сезон (сутки = DAY_LEN секунд)
const SEASONS = [
  {id:'spring', n:'🌸 Весна', d:'Травы растут быстрее.'},
  {id:'summer', n:'☀ Лето',   d:'Рыба клюёт охотнее.'},
  {id:'autumn', n:'🍂 Осень', d:'С врагов падает на 15% больше золота.'},
  {id:'winter', n:'❄ Зима',   d:'На равнине идёт снег; трав меньше, рыба клюёт вяло.'}
];
function seasonIdx(){ return Math.floor(env.day/SEASON_DAYS)%4; }
function seasonId(){ return SEASONS[seasonIdx()].id; }
function seasonLabel(){ return SEASONS[seasonIdx()].n; }
function seasonMul(kind){
  const s = seasonId();
  if(kind==='herb') return s==='spring' ? 1.7 : s==='winter' ? 0.55 : 1;
  if(kind==='fish') return s==='summer' ? 0.7 : s==='winter' ? 1.4 : 1;
  if(kind==='gold') return s==='autumn' ? 1.15 : 1;
  return 1;
}
let seasonSeen = -1;
function seasonTick(){
  const i = seasonIdx(), outdoor = currentLocId==='overworld' || currentLocId==='town';
  if(outdoor && player.stat){
    player.stat.seasons = (player.stat.seasons||0) | (1<<i);
    if(seasonSeen!==i){
      if(seasonSeen>=0) addNote('Сезон сменился: '+SEASONS[i].n+'. '+SEASONS[i].d, '#9ad0ff');
      seasonSeen = i;
    }
  }
}
// цветовая вуаль и падающие лепестки/листья на открытой местности
function drawSeason(){
  if(!SET.season || (currentLocId!=='overworld' && currentLocId!=='town')) return;
  const s = seasonId(), W = canvas.width, H = canvas.height, now = Date.now()/1000;
  const tint = {spring:null, summer:'rgba(255,210,90,0.05)', autumn:'rgba(230,140,40,0.07)', winter:'rgba(190,215,255,0.09)'}[s];
  if(tint){ ctx.fillStyle = tint; ctx.fillRect(0,0,W,H); }
  if(s!=='spring' && s!=='autumn') return;
  const n = Math.floor(26*Q().part*Math.min(1.5, W*H/(900*500))), cols = s==='spring' ? ['#f6b4c8','#ffd8e4','#e89ab4'] : ['#d9792a','#b8481e','#e0a63a'];
  for(let i=0;i<n;i++){
    const sp = 0.5+RN[i*3+2]*0.7, x = frac(RN[i*3]+Math.sin(now*0.6+i)*0.02-now*0.03*sp)*W, y = frac(RN[i*3+1]+now*0.06*sp)*H;
    ctx.fillStyle = cols[i%3]; ctx.save(); ctx.translate(x,y); ctx.rotate(now*1.2+i); ctx.globalAlpha = 0.8;
    if(s==='spring') ell(0,0,3,1.6); else ell(0,0,4,2.2);
    ctx.fill(); ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------- секретные боссы ----------
const SECRETS = [
  {id:'alpha', name:'Лунный Альфа', type:'wolf', loc:'overworld', need:1, hp:20, dmg:1.7, big:2.1, col:'#dfe6ff', aura:'#9ab4ff',
   cond:()=>darkness()>0.75, hint:'🌕 Под полной луной на равнине слышен далёкий вой…', spawn:'🌕 Лунный Альфа вышел на охоту! Он крепок — берегите эликсиры.',
   ab:{charge:{wind:700, dash:560, mul:3.4, cd:3600, range:300}}, reward:{gold:650, mats:{essence:3, crystal:2}, gear:2}},
  {id:'dune', name:'Дюнный Исполин', type:'rhino', loc:'desert', need:4, hp:14, dmg:1.5, big:1.9, col:'#d8b070', aura:'#ffd27a',
   cond:()=>weatherName()==='sand', hint:'🌪 Говорят, в песчаную бурю из дюн встаёт исполин…', spawn:'🌪 Из бури поднялся Дюнный Исполин!',
   ab:{charge:{wind:650, dash:600, mul:3.2, cd:3400, range:300}}, reward:{gold:900, mats:{essence:4, crystal:2, scrap:8}, gear:2}},
  {id:'frost', name:'Хранитель Метели', type:'snowstalker', loc:'ice', need:5, hp:16, dmg:1.5, big:1.9, col:'#d8f0ff', aura:'#9ae0ff',
   cond:()=>{ const w = weatherName(); return w==='blizzard' || w==='snow'; }, hint:'❄ В метель во льдах бродит нечто огромное…', spawn:'❄ Из метели вышел Хранитель Метели!',
   ab:{blink:{cd:3600, minR:70, maxR:130}}, reward:{gold:1100, mats:{essence:5, crystal:3}, gear:2}},
  {id:'rot', name:'Король Гнили', type:'necromancer', loc:'grave', need:6, hp:16, dmg:1.5, big:1.8, col:'#6aa07a', aura:'#7aff9a',
   cond:()=>darkness()>0.5, hint:'☠ На погосте ночью шевелится самая старая могила…', spawn:'☠ Король Гнили восстал из старой могилы!',
   ab:{summon:{type:'skeleton', cd:5200, max:3, range:320}, keep:150}, reward:{gold:1400, mats:{essence:6, crystal:3}, gear:2}}
];
const SECRET_HINT_KEY = {};
function secretOf(e){ return e && e.secret ? SECRETS.find(s=>s.id===e.secret) : null; }
let secAcc = 0;
function secretsTick(dt){
  secAcc += dt; if(secAcc<2) return; secAcc = 0;
  if(!player.secrets) player.secrets = {};
  const stage = storyStage();
  for(const S of SECRETS){
    if(S.loc!==currentLocId || stage<S.need) continue;
    const st = player.secrets[S.id]||0;
    if(st===2) continue;
    const alive = loc.enemies.some(m=>m.secret===S.id && m.hp>0);
    if(st===1 && alive) continue;
    if(!S.cond()){ continue; }
    const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
    const base = ENEMY_BASE[S.type], sz = base.size*S.big;
    const p = freeSpotAround(pcx, pcy, sz, sz, 360, 520, 60);
    if(!p) continue;
    const e = makeEnemy(S.type, p.x, p.y, loc.level||1);
    e.secret = S.id; e.name = S.name; e.big = S.big; e.w = e.h = sz; e.color = S.col;
    e.maxHp = e.hp = Math.round(e.maxHp*S.hp*(1+0.08*stage)); e.dmg = Math.round(e.dmg*S.dmg); e.xp = 220+70*stage; e.gold = 0; e.aggro = 340;
    e.ab = Object.assign({}, e.ab||{}, S.ab);
    e.aggroed = true;
    loc.enemies.push(e); player.secrets[S.id] = 1;
    addNote(S.spawn, '#ff9f4a'); SFX.play('roar'); shakeT = Math.max(shakeT, 400);
    tipOnce('secret');
  }
}
function extraKill(e){
  if(seasonMul('gold')>1 && !loc.arena) player.gold += Math.ceil(e.gold*(seasonMul('gold')-1));
  petXp(e);
  const S = secretOf(e); if(!S) return;
  player.secrets[S.id] = 2; bump('secrets');
  const txt = giveReward(S.reward);
  addNote('🏆 «'+S.name+'» повержен! '+txt, '#ffd34a'); SFX.play('levelup');
  burst(e.x+e.w/2, e.y+e.h/2, 40, {colors:[S.aura,'#ffffff','#ffd34a'], sp:140, up:70, g:60, life:1200, size:3.4});
  shakeT = Math.max(shakeT, 600);
  saveGame();
}
function secretAura(e){
  const S = secretOf(e); if(!S) return;
  const t = Date.now()/1000, r = e.w*0.9/e.big*(1+0.06*Math.sin(t*3));
  const g = ctx.createRadialGradient(0,0,r*0.2,0,0,r*1.35);
  g.addColorStop(0, S.aura+'55'); g.addColorStop(1, S.aura+'00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,r*1.35,0,6.283); ctx.fill();
}
function drawSecretBars(camX, camY){
  for(const e of loc.enemies){
    if(!e.secret || e.hp<=0) continue;
    const sx = e.x-camX+e.w/2, sy = e.y-camY;
    if(sx<-60 || sx>canvas.width+60 || sy<-60 || sy>canvas.height+60) continue;
    const w = 56, f = Math.max(0, e.hp/e.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(sx-w/2-1, sy-17, w+2, 7);
    ctx.fillStyle = '#d33a3a'; ctx.fillRect(sx-w/2, sy-16, w*f, 5);
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(e.name, sx, sy-21);
    ctx.fillStyle = '#ffd9a0'; ctx.fillText(e.name, sx, sy-21); ctx.textAlign = 'center';
  }
}
// намёки на секретных боссов в журнале и при смене локации
function secretHints(){
  const stage = storyStage();
  return SECRETS.filter(S=>stage>=S.need).map(S=>({S, st:(player.secrets||{})[S.id]||0}));
}

// ---------- плавающие числа урона ----------
const nums = [];
function fxNum(e, dmg){
  if(!SET.nums || dmg<=0) return;
  if(nums.length>40) nums.shift();
  nums.push({x:e.x+e.w/2+rnd(-6,6), y:e.y, t:0, v:Math.max(1,Math.round(dmg)), big:dmg>=(player.atk||10)*1.7});
}
function drawNums(camX, camY){
  if(!nums.length) return;
  ctx.textAlign = 'center';
  for(let i=nums.length-1;i>=0;i--){
    const n = nums[i]; n.t += 1/60;
    if(n.t>0.9){ nums.splice(i,1); continue; }
    const a = 1-n.t/0.9, x = n.x-camX, y = n.y-camY-n.t*34;
    ctx.globalAlpha = a; ctx.font = (n.big ? 'bold 17px' : 'bold 13px')+' sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(n.v, x, y); ctx.fillStyle = n.big ? '#ffd34a' : '#fff'; ctx.fillText(n.v, x, y);
  }
  ctx.globalAlpha = 1;
}

// ---------- подсказки в бою ----------
const TIPS = {
  charge:'🐗 Враг с рывком: заметили замах — отойдите в сторону, он пролетит мимо.',
  split:'🟦 Желе делится при ударе: добивайте мелочь по одной, не окружайтесь.',
  summon:'☠ Призыватель вызывает слуг снова и снова — убейте его самого первым.',
  bomb:'💣 Подрывник бежит к вам и взрывается — бейте издалека или отходите.',
  heal:'✨ Жрец лечит союзников — расправьтесь с ним в первую очередь.',
  blink:'❄ Этот враг телепортируется: держите дистанцию и бейте, когда он появится рядом.',
  leech:'🦇 Кровосос лечится от ударов по вам — не затягивайте бой.',
  mortar:'🎯 Красные круги на земле — удар через секунду: выйдите из круга.',
  shoot:'🏹 Стрелок: сближайтесь зигзагом или прячьтесь за препятствиями.',
  inflict:'🥶 Этот враг накладывает статус (заморозка, ожог) — держитесь дальше и не стойте в круге.',
  boss:'👑 Страж логова: следите за кругами на земле и не стойте на месте — у боссов бывают фазы.',
  secret:'⚠ Секретный босс очень крепок. Запаситесь эликсирами и бейте издалека — награда редкая.',
  lowhp:'❤ Здоровье на исходе — выпейте эликсир (✚ / клавиша H) или отступите: вне боя герой восстанавливается.'
};
const DEATH_TIPS = [
  'Рывок врага можно пережить, шагнув в сторону в момент замаха.', 'Щитоносцев бейте сбоку или со спины.', 'Красный круг на земле — предупреждение: выходите из него.',
  'Эликсиры скорости, силы и стойкости из «Дымного Тигля» заметно меняют ход боя.', 'Улучшайте снаряжение у кузнеца и разбирайте лишнее на материалы.',
  'Напарник из трактира отвлекает врагов и бьёт вместе с вами.', 'На арене можно безопасно набить материалы — награда остаётся даже при поражении.',
  'Ночью и в непогоду на карте появляются секретные боссы — они дают редкое снаряжение.', 'Быстрый перенос из журнала экономит время, но стоит золота.',
  'Не лечитесь посреди толпы: отступите, выпейте эликсир и возвращайтесь.', 'Умения в «Герое» можно развивать по двум веткам — выбирайте под свой стиль.'
];
let tipsSeen = {}; try{ tipsSeen = JSON.parse(localStorage.getItem(TIPS_KEY))||{}; }catch(e){}
let tipCd = 0;
function tipOnce(k){
  if(!SET.tips || tipsSeen[k] || !TIPS[k] || tipCd>0) return false;
  tipsSeen[k] = 1; tipCd = 7; try{ localStorage.setItem(TIPS_KEY, JSON.stringify(tipsSeen)); }catch(e){}
  addNote('💡 '+TIPS[k], '#9ad0ff'); return true;
}
let tipAcc = 0;
function tipsTick(dt){
  tipCd = Math.max(0, tipCd-dt);
  tipAcc += dt; if(tipAcc<0.4) return; tipAcc = 0;
  if(!SET.tips || tipCd>0) return;
  if(player.hp < player.maxHp*0.25 && loc.enemies.some(e=>e.hp>0 && Math.hypot(e.x-player.x,e.y-player.y)<260) && tipOnce('lowhp')) return;
  const pcx = player.x, pcy = player.y;
  for(const e of loc.enemies){
    if(e.hp<=0 || Math.hypot(e.x-pcx,e.y-pcy)>240) continue;
    if(e.secret && tipOnce('secret')) return;
    if(BOSS_TYPES.includes(e.type) && tipOnce('boss')) return;
    if(e.ab) for(const k of ['charge','split','summon','bomb','heal','blink','leech','mortar']) if(e.ab[k] && tipOnce(k)) return;
    if(e.shoot && tipOnce('shoot')) return;
    if(e.inflict && tipOnce('inflict')) return;
  }
}
// подсказка на экране поражения
(function(){
  const ds = document.getElementById('deathStats'); if(!ds) return;
  const p = document.createElement('p'); p.id = 'deathTip'; p.style.cssText = 'font-size:13px;color:#9ad0ff;max-width:480px;margin:0'; ds.insertAdjacentElement('afterend', p);
})();
function showDeathTip(){ const p = document.getElementById('deathTip'); if(p) p.textContent = SET.tips ? '💡 '+DEATH_TIPS[Math.floor(Math.random()*DEATH_TIPS.length)] : ''; }

// ---------- настройки ----------
let setAcc = 0;
function applySettings(){
  if(SFX.music) SFX.music.gain.value = 0.5*SET.music;
  if(SFX.sfx) SFX.sfx.gain.value = 0.9*SET.sfx;
  const tc = document.getElementById('touchControls');
  if(tc){ tc.classList.toggle('lefty', SET.lefty); tc.style.setProperty('--cs', SET.ctrl); }
  if(!SET.shake) shakeT = 0;
}
const settingsScreen = document.createElement('div');
settingsScreen.id = 'settingsScreen'; settingsScreen.className = 'overlay hidden';
document.getElementById('gameWrap').appendChild(settingsScreen);
function renderSettings(){
  const row = (label, ctl)=>{ const d = document.createElement('div'); d.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;max-width:420px;font-size:14px'; const l = document.createElement('span'); l.textContent = label; d.appendChild(l); d.appendChild(ctl); return d; };
  const slider = (key, min, max, step)=>{ const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = SET[key]; i.style.width = '150px'; i.style.accentColor = '#e0b23a'; i.addEventListener('input', ()=>{ SET[key] = parseFloat(i.value); saveSet(); applySettings(); }); return i; };
  const toggle = (key, onTxt, offTxt)=>{ const b = document.createElement('button'); b.className = 'tabBtn'+(SET[key]?' active':''); b.textContent = SET[key] ? onTxt : offTxt; b.addEventListener('click', ()=>{ SET[key] = !SET[key]; saveSet(); applySettings(); renderSettings(); }); return b; };
  settingsScreen.innerHTML = '<h2>Настройки</h2>';
  const box = document.createElement('div'); box.style.cssText = 'display:flex;flex-direction:column;gap:10px;align-items:center;width:100%';
  box.appendChild(row('Музыка', slider('music',0,1,0.05)));
  box.appendChild(row('Звуки', slider('sfx',0,1,0.05)));
  box.appendChild(row('Тряска экрана', toggle('shake','Вкл','Выкл')));
  box.appendChild(row('Числа урона', toggle('nums','Вкл','Выкл')));
  box.appendChild(row('Подсказки в бою', toggle('tips','Вкл','Выкл')));
  box.appendChild(row('Сезонные эффекты', toggle('season','Вкл','Выкл')));
  box.appendChild(row('Управление на экране', toggle('lefty','Для левши','Для правши')));
  box.appendChild(row('Размер кнопок', slider('ctrl',0.8,1.3,0.1)));
  const note = document.createElement('p'); note.style.cssText = 'font-size:12px;color:#a89d78;max-width:420px;margin:4px 0 0'; note.textContent = 'Настройки хранятся на этом устройстве. Графика и сложность — на главном экране.';
  const back = document.createElement('button'); back.className = 'startBtn'; back.textContent = 'Назад';
  back.addEventListener('click', ()=>{ settingsScreen.classList.add('hidden'); startScreenEl.classList.remove('hidden'); });
  settingsScreen.appendChild(box); settingsScreen.appendChild(note); settingsScreen.appendChild(back);
}
document.getElementById('setBtn').addEventListener('click', ()=>{ startScreenEl.classList.add('hidden'); renderSettings(); settingsScreen.classList.remove('hidden'); });

// ---------- код переноса сохранений ----------
function b64enc(bytes){ let s = ''; for(let i=0;i<bytes.length;i+=0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i,i+0x8000)); return btoa(s); }
function b64dec(str){ const s = atob(str), a = new Uint8Array(s.length); for(let i=0;i<s.length;i++) a[i] = s.charCodeAt(i); return a; }
async function pipeBytes(bytes, stream){ return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
async function makeSaveCode(){
  const bundle = {format:'eldoria-saves', v:1, t:Date.now(), saves:{}}; let n = 0;
  for(const k of [SAVE_KEY, ...SLOT_KEYS]){ let v = null; try{ v = localStorage.getItem(k); }catch(e){} if(v){ bundle.saves[k] = v; n++; } }
  if(!n) return null;
  const raw = new TextEncoder().encode(JSON.stringify(bundle));
  if(typeof CompressionStream!=='undefined'){ try{ return 'ELD1.'+b64enc(await pipeBytes(raw, new CompressionStream('gzip'))); }catch(e){} }
  return 'ELD0.'+b64enc(raw);
}
async function parseSaveCode(code){
  code = (code||'').replace(/\s+/g,'');
  const m = /^(ELD[01])\.([A-Za-z0-9+/=]+)$/.exec(code); if(!m) throw new Error('bad');
  let bytes = b64dec(m[2]);
  if(m[1]==='ELD1'){ if(typeof DecompressionStream==='undefined') throw new Error('nodec'); bytes = await pipeBytes(bytes, new DecompressionStream('gzip')); }
  return new TextDecoder().decode(bytes);
}
(function(){
  const sc = document.getElementById('savesScreen'), row = sc.querySelector('.btnRow'); if(!row) return;
  const mk = (txt, bg)=>{ const b = document.createElement('button'); b.className = 'startBtn'; b.textContent = txt; b.style.cssText = 'background:linear-gradient(#'+bg[0]+',#'+bg[1]+'); border-color:#'+bg[2]; return b; };
  const copyBtn = mk('📋 Копировать код', ['b08ae0','6a449c','2a1850']), pasteBtn = mk('⌨ Ввести код', ['8fd3d3','3f8f8f','1d4a4a']);
  row.appendChild(copyBtn); row.appendChild(pasteBtn);
  const box = document.createElement('div'); box.className = 'hidden'; box.style.cssText = 'display:flex;flex-direction:column;gap:6px;align-items:center;width:100%;max-width:520px';
  const ta = document.createElement('textarea'); ta.id = 'codeArea'; ta.rows = 4; ta.placeholder = 'Вставьте код переноса (ELD1…)'; ta.style.cssText = 'width:100%;font-size:12px;background:#1a140a;color:#f0e6c8;border:2px solid #5c4415;border-radius:6px;padding:6px';
  const ok = mk('Применить код', ['e0c070','9c7a2a','4a3510']);
  box.appendChild(ta); box.appendChild(ok); row.insertAdjacentElement('afterend', box);
  const say = m=>renderSaves(m);
  copyBtn.addEventListener('click', async ()=>{
    const code = await makeSaveCode(); if(!code){ say('Нечего переносить: сохранений пока нет.'); return; }
    let done = false; try{ await navigator.clipboard.writeText(code); done = true; }catch(e){}
    if(done) say('Код скопирован ('+Math.round(code.length/1024)+' КБ текста). Отправьте его себе в мессенджер или заметки и вставьте на другом устройстве.');
    else { box.classList.remove('hidden'); ta.value = code; ta.focus(); ta.select(); say('Скопируйте код из поля вручную.'); }
  });
  pasteBtn.addEventListener('click', ()=>{ box.classList.toggle('hidden'); ta.value = ''; if(!box.classList.contains('hidden')) ta.focus(); });
  ok.addEventListener('click', async ()=>{
    if(!storageOK){ say('Хранилище браузера недоступно.'); return; }
    try{ const json = await parseSaveCode(ta.value); importSaves(new Blob([json])); box.classList.add('hidden'); ta.value = ''; }
    catch(e){ say(e.message==='nodec' ? 'Этот браузер не умеет распаковывать код — используйте файл.' : 'Код повреждён или обрезан: скопируйте его целиком, от «ELD» до конца.'); }
  });
})();

// ---------- тик и отрисовка ----------
function extraTick(dt){
  seasonTick(); secretsTick(dt); tipsTick(dt); tickD(dt);
  setAcc += dt; if(setAcc>0.5){ setAcc = 0; applySettings(); }
}
function drawExtra(camX, camY){ drawPet(camX, camY); drawSecretBars(camX, camY); drawNums(camX, camY); }
ACH.push(
  {id:'seasons', i:'🍃', n:'Круговорот', d:'Увидеть все четыре сезона на равнине или в городе.', g:150, t:()=>((player.stat.seasons||0)&15)===15},
  {id:'secret1', i:'🌙', n:'Охотник за тайнами', d:'Победить секретного босса.', g:300, t:()=>(player.stat.secrets||0)>=1},
  {id:'secret4', i:'🗝', n:'Знаток тайн', d:'Победить всех четырёх секретных боссов.', g:800, t:()=>(player.stat.secrets||0)>=4, p:()=>[player.stat.secrets||0,4]}
);
