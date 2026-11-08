// ---------- Сохранение ----------
const SAVE_KEY = 'eldoria_save_v1';                      // автосохранение
const SLOT_KEYS = ['eldoria_slot_1','eldoria_slot_2','eldoria_slot_3'];   // ручные слоты
try{ localStorage.setItem('__eldoria_t','1'); localStorage.removeItem('__eldoria_t'); storageOK=true; }catch(e){ storageOK=false; }
const PLAYER_KEYS = ['mercs','genq','wild','bhSeen','forks','stash','home','pet','daily','secrets','ach','stat','ngp','comp','x','y','dir','hp','maxHp','atk','level','xp','xpNext','gold','potions','vkeys','weapon','owned','armor','ownedArmor','quest','questsDone','sp','skills','gear','bag','wLvl','ench','elix','codex','boots','sb','mats','visited','track','stories'];
const savesBtn = document.getElementById('savesBtn');
const loadBtn = document.getElementById('loadBtn');
const saveInfoEl = document.getElementById('saveInfo');
const savesScreen = document.getElementById('savesScreen');
const savesList = document.getElementById('savesList');

function packLoc(L){
  const o={};
  for(const k in L){ if(k==='boss' || k==='fog') continue; o[k] = (k==='grid') ? L.grid.map(r=>r.join('')) : L[k]; }
  const f = fogString(L); if(f) o.fog = f;
  return o;
}
function unpackLoc(o){
  const L = Object.assign({}, o);
  L.grid = o.grid.map(r=>r.split(''));
  if(L.type==='dungeon') L.boss = L.enemies.find(e=>BOSS_TYPES.includes(e.type)) || null;
  return L;
}
// ---------- Формат хранения сохранений ----------
// Версия данных сохранения. Меняете формат — поднимите SAVE_VERSION и добавьте шаг в SAVE_MIGRATIONS.
const SAVE_VERSION = 2;
const SAVE_MIGRATIONS = {
  // v1 -> v2: изменился только способ хранения (сжатие); заодно переносим сюда старую проверку «мир до логов боссов»
  1: d=>{ const w = d.world; if(w && w.overworld && !w.lair1) d.legacy = true; },
};
function migrateSave(d){
  if(!d || typeof d.v!=='number' || d.v<1 || d.v>SAVE_VERSION) return null;   // сохранение из более новой версии игры не трогаем
  while(d.v < SAVE_VERSION){ const step = SAVE_MIGRATIONS[d.v]; if(step) step(d); d.v++; }
  return d;
}
// Сжатие: LZ77 по символам строки. Совпадение кодируется тремя символами: U+0001, длина, расстояние.
// Сырой U+0001 в JSON не встречается (JSON.stringify экранирует управляющие символы), поэтому он свободен как маркер.
// Функции самодостаточны: их исходный текст отдаётся фоновому потоку (Worker).
function lzPack(s){
  const BASE = 0x100, MIN = 5, MAXLEN = 4096, WIN = 50000;      // значения BASE+n < 0xD800: без суррогатов
  const n = s.length, head = new Int32Array(1<<16).fill(-1), prev = new Int32Array(n), out = [];
  const h = p => (((s.charCodeAt(p)*31 + s.charCodeAt(p+1))*31 + s.charCodeAt(p+2))*31 + s.charCodeAt(p+3)) & 0xFFFF;
  let lit = 0, i = 0;
  const ins = p => { if(p+3 < n){ const k = h(p); prev[p] = head[k]; head[k] = p; } };
  while(i < n){
    let bl = 0, bd = 0;
    const c0 = s.charCodeAt(i);
    if(i+MIN <= n && !(c0>=0xDC00 && c0<=0xDFFF)){                // не начинаем совпадение посреди суррогатной пары
      let c = head[h(i)], tries = 24;
      while(c >= 0 && i-c <= WIN && tries--){
        if(s.charCodeAt(c+bl) === s.charCodeAt(i+bl)){
          let l = 0; const lim = Math.min(MAXLEN, n-i);
          while(l < lim && s.charCodeAt(c+l) === s.charCodeAt(i+l)) l++;
          if(l > bl){ bl = l; bd = i-c; if(l === lim) break; }
        }
        c = prev[c];
      }
      if(bl >= MIN){ const e = s.charCodeAt(i+bl-1); if(e>=0xD800 && e<=0xDBFF) bl--; }   // и не заканчиваем посреди неё
    }
    if(bl >= MIN){
      if(lit < i) out.push(s.slice(lit, i));
      out.push('\u0001' + String.fromCharCode(BASE+bl, BASE+bd));
      const end = i+bl; for(; i < end; i++) ins(i); lit = i;
    } else { ins(i); i++; }
  }
  if(lit < n) out.push(s.slice(lit));
  return out.join('');
}
function lzUnpack(z){
  const BASE = 0x100; let n = 0, i = 0;
  while(i < z.length){ if(z.charCodeAt(i)===1){ n += z.charCodeAt(i+1)-BASE; i += 3; } else { n++; i++; } }
  const o = new Uint16Array(n); let p = 0; i = 0;
  while(i < z.length){
    const c = z.charCodeAt(i);
    if(c === 1){ const len = z.charCodeAt(i+1)-BASE, d = z.charCodeAt(i+2)-BASE; if(d<1 || d>p) throw new Error('bad lz'); for(let k=0;k<len;k++,p++) o[p] = o[p-d]; i += 3; }
    else { o[p++] = c; i++; }
  }
  let r = ''; for(let k=0;k<n;k+=8192) r += String.fromCharCode.apply(null, o.subarray(k, k+8192));
  return r;
}
const LZ_TAG = 'ELZ1:';
// дробные числа (координаты, таймеры, зёрна анимаций) храним с 6 значащими цифрами — на игру не влияет, а места меньше
function saveNum(k, v){ return (typeof v==='number' && !Number.isInteger(v) && isFinite(v)) ? +v.toPrecision(6) : v; }
function saveJSON(data){ return JSON.stringify(data, saveNum); }
function encodeSave(data){ return LZ_TAG + lzPack(saveJSON(data)); }
function decodeSave(raw){ return JSON.parse(raw.indexOf(LZ_TAG)===0 ? lzUnpack(raw.slice(LZ_TAG.length)) : raw); }
const saveCache = new Map();                                     // ключ -> {raw, d}: меню читает слоты часто, распаковываем один раз
// незаписанное фоновое сохранение дописываем сразу, если кто-то читает сохранения (загрузка, меню, экспорт)
function flushSaves(key){
  for(const [id, job] of lzJobs){ if(key && job.key!==key) continue; lzJobs.delete(id); writeSaveRawNow(job); }
}
function readSave(key){
  flushSaves(key);
  let raw; try{ raw = localStorage.getItem(key); }catch(e){ return null; }
  if(!raw){ saveCache.delete(key); return null; }
  const c = saveCache.get(key); if(c && c.raw===raw) return c.d;
  let d = null; try{ d = migrateSave(decodeSave(raw)); }catch(e){ d = null; }
  if(d && !(d.player && d.world)) d = null;
  saveCache.set(key, {raw, d});
  return d;
}
function getSaveInfo(key){
  if(!storageOK) return null;
  return readSave(key || SAVE_KEY);                              // общий объект из кэша: не изменять (loadGame делает копию)
}
// ---------- Запись ----------
let saveFailT = -1e9, saveErr = '', lzJobId = 0;
const saveSeq = {};                                             // ключ -> номер последней записи; старые фоновые результаты отбрасываются
const nextSeq = key => (saveSeq[key] = (saveSeq[key]||0)+1);
function storeRaw(key, raw){
  try{ localStorage.setItem(key, raw); saveCache.delete(key); return true; }catch(e){}
  compactStoredSaves();                                          // место могли занимать несжатые сохранения прошлых версий
  try{ localStorage.setItem(key, raw); saveCache.delete(key); return true; }catch(e){}
  return false;
}
function saveFailed(){
  saveErr = 'Не удалось сохранить: в памяти браузера кончилось место. Удалите лишний слот в «Сохранениях» или выгрузите их в файл.';
  if(performance.now()-saveFailT > 60000){ saveFailT = performance.now(); addNote('⚠ '+saveErr, '#ff6b5a'); }
  return false;
}
function writeSave(key, data){
  if(!storageOK || !data) return false;
  nextSeq(key);
  let raw; try{ raw = encodeSave(data); }catch(e){ return saveFailed(); }
  if(!storeRaw(key, raw)) return saveFailed();
  saveErr = ''; return true;
}
// Сжатие в фоновом потоке, чтобы переходы между локациями и покупки не подтормаживали.
// Снимок состояния делается сразу (синхронно), в фон уходит только упаковка строки.
let lzWorker = null, lzWorkerOK = typeof Worker!=='undefined' && typeof Blob!=='undefined';
const lzJobs = new Map();
function lzWorkerGet(){
  if(lzWorker || !lzWorkerOK) return lzWorker;
  try{
    const src = lzPack.toString()+'\nonmessage=e=>{ let z=null; try{ z=lzPack(e.data.s); }catch(err){} postMessage({id:e.data.id, z}); };';
    lzWorker = new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})));
    lzWorker.onmessage = e=>{
      const job = lzJobs.get(e.data.id); lzJobs.delete(e.data.id); if(!job) return;
      if(job.seq !== saveSeq[job.key]) return;                   // после этого уже записано более свежее состояние
      if(e.data.z===null){ writeSaveRawNow(job); return; }
      if(storeRaw(job.key, LZ_TAG+e.data.z)){ saveErr = ''; if(job.flash) saveFlash = 1500; } else saveFailed();
    };
    lzWorker.onerror = ()=>{ lzWorkerOK = false; lzWorker = null; for(const job of lzJobs.values()) writeSaveRawNow(job); lzJobs.clear(); };
  }catch(e){ lzWorkerOK = false; lzWorker = null; }
  return lzWorker;
}
function writeSaveRawNow(job){
  if(job.seq !== saveSeq[job.key]) return;
  try{ if(storeRaw(job.key, LZ_TAG+lzPack(job.s))){ saveErr = ''; if(job.flash) saveFlash = 1500; } else saveFailed(); }catch(e){ saveFailed(); }
}
function writeSaveAsync(key, data, flash){
  if(!storageOK || !data) return false;
  const w = lzWorkerGet();
  if(!w){ const ok = writeSave(key, data); if(ok && flash) saveFlash = 1500; return ok; }
  const job = {id:++lzJobId, seq:nextSeq(key), key, s:saveJSON(data), flash};
  lzJobs.set(job.id, job); w.postMessage({id:job.id, s:job.s});
  return true;
}
// Пережать сохранения, записанные прошлыми версиями игры без сжатия (освобождает место в хранилище)
function compactStoredSaves(){
  if(!storageOK) return;
  for(const k of [SAVE_KEY, ...SLOT_KEYS]){
    let raw = null; try{ raw = localStorage.getItem(k); }catch(e){}
    if(!raw || raw.indexOf(LZ_TAG)===0) continue;
    try{ const z = LZ_TAG+lzPack(saveJSON(JSON.parse(raw))); localStorage.removeItem(k); localStorage.setItem(k, z); saveCache.delete(k); }
    catch(e){ try{ if(!localStorage.getItem(k)) localStorage.setItem(k, raw); }catch(e2){} }
  }
}
function buildSaveData(){
  if(!hasActiveGame || gameState==='dead' || gameState==='won' || player.hp<=0) return null;
  const data = { v:SAVE_VERSION, diff:difficulty, t:Date.now(), locId:currentLocId, locName:getLocName(loc), player:{}, world:{}, env:packEnv() };
  for(const k of PLAYER_KEYS) data.player[k] = player[k];
  for(const id of Object.keys(world)) data.world[id] = packLoc(world[id]);
  return data;
}
// обычное сохранение: снимок сразу, сжатие и запись в фоне
function saveGame(){
  if(!storageOK) return false;
  return writeSaveAsync(SAVE_KEY, buildSaveData(), true);
}
// немедленное сохранение: при сворачивании и закрытии страницы ждать фонового потока нельзя
function saveGameNow(){
  if(!storageOK) return false;
  const ok = writeSave(SAVE_KEY, buildSaveData()); if(ok) saveFlash = 1500; return ok;
}
function saveToSlot(n){
  if(!storageOK) return false;
  return writeSave(SLOT_KEYS[n], buildSaveData());
}
function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} saveCache.delete(SAVE_KEY); }
function latestSaveKey(){
  let best = null, bt = -1;
  for(const k of [SAVE_KEY, ...SLOT_KEYS]){ const i = storageOK ? readSave(k) : null; if(i && i.t>bt){ bt = i.t; best = k; } }
  return best;
}
function fmtSave(info){
  const when = new Date(info.t).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  return `Уровень ${info.player.level} • Золото ${info.player.gold} • ${info.locName} • ${when}`;
}
function refreshSaveUI(){
  if(typeof refreshNgpUI==='function') refreshNgpUI();
  loadBtn.classList.toggle('hidden', !latestSaveKey());
  if(!storageOK){
    saveInfoEl.textContent = 'Сохранение недоступно в этом браузере (возможно, включён приватный режим).';
    saveInfoEl.classList.remove('hidden');
  } else saveInfoEl.classList.add('hidden');
}
function loadGame(key){
  const d0 = getSaveInfo(key);
  if(!d0) return false;
  const d = JSON.parse(JSON.stringify(d0));                       // копия: мир игры не должен делить объекты с кэшем
  try{
    const w = {};
    for(const id of Object.keys(d.world)) w[id] = unpackLoc(d.world[id]);
    let legacy = !!d.legacy;
    if(legacy){                 // сохранение до переделки уровней: герой остаётся, карты подземелий создаются заново
      legacy = true;
      for(const id of Object.keys(w)) if(!['overworld','town','house1','house2'].includes(id)) delete w[id];
      for(const en of w.overworld.entrances) if(en.dungeon==='dungeon1') en.dungeon = 'lair1';
    }
    if(!w.overworld || (!legacy && !w[d.locId])) throw new Error('bad save');
    world = w; ensureWorldExtras(); eventsReset();
    let relocate = false;
    if(legacy || !world[d.locId]){ d.locId = 'overworld'; relocate = true; }
    currentLocId = d.locId; loc = world[currentLocId];
    loadEnv(d.env);
    difficulty = DIFFS[d.diff] ? d.diff : 'normal'; try{ localStorage.setItem('eldoria_diff', difficulty); }catch(e){}
    resetHero();
    for(const k of PLAYER_KEYS) if(k in d.player) player[k] = d.player[k];
    if(relocate){ const bk = world.overworld.entrances.find(en=>en.dungeon==='lair1').back; player.x = bk.x; player.y = bk.y; }
    if(!('skills' in d.player)) player.sp = Math.max(0, player.level-1);      // старое сохранение: очки навыков за уже набранные уровни
    player.skills = Object.assign({dash:0,spin:0,shield:0,might:0}, player.skills);
    if(!player.gear) player.gear = {helm:null,ring:null,amulet:null};
    if(!Array.isArray(player.bag)) player.bag = [];
    if(!player.wLvl) player.wLvl = {}; if(!player.ench) player.ench = {};
    player.elix = Object.assign({big:0,speed:0,might:0,guard:0,swim:0}, player.elix||{}); player.buff = {speed:0,might:0,guard:0,swim:0}; player.slowT = 0; player.boots = !!player.boots; player.fx = {freeze:0,freezeImm:0,burn:0,burnDps:0,poison:0,poisonDps:0,acc:0};
    player.cd = {dash:0,spin:0,shield:0}; player.shield = 0; player.dashT = 0; player.spinFx = 0;
    if(!WEAPONS[player.weapon]) player.weapon='sword';
    if(!ARMORS[player.armor]) player.armor='none';
    ensureNewPlayerFields(); storiesEnsure();
    if(!('quest' in d.player)) player.quest = null;
    if(!('questsDone' in d.player)) player.questsDone = {};
    player.codex = Object.assign({e:{},a:{},k:{}}, player.codex||{});
    player.owned = Object.assign({sword:true}, player.owned||{});
    player.ownedArmor = Object.assign({none:true}, player.ownedArmor||{});
    player.invuln = 1500; player.hitFlash = 0; player.attackTimer = 0; player.attacking = false;
    notifications = []; transitionCooldown = 700; fullInvNoticeTimer = 0; shopLock = true;
    for(const k in keys) keys[k]=false;
    enterPlaying();
    addNote('💾 Сохранение загружено', '#7fe07f');
    if(legacy) addNote('Мир обновлён: между уровнями появились логова боссов. Карты подземелий созданы заново, герой сохранён.', '#ffd34a');
    return true;
  }catch(e){
    saveInfoEl.textContent = 'Не удалось загрузить сохранение.'; saveInfoEl.classList.remove('hidden');
    return false;
  }
}

// ---------- Меню «Сохранения» ----------
function saveRow(title, desc, buttons){
  const row = document.createElement('div'); row.className = 'shopItem'; row.style.flexWrap = 'wrap';
  const info = document.createElement('div'); info.className = 'shopInfo'; info.style.flex = '1 1 100%';
  const nm = document.createElement('b'); nm.textContent = title;
  const ds = document.createElement('span'); ds.textContent = desc;
  info.append(nm, ds);
  const box = document.createElement('div'); box.className = 'shopBtns'; box.style.flexWrap = 'wrap'; box.style.flex = '1 1 100%'; box.style.justifyContent = 'flex-end';
  buttons.forEach(b=>box.appendChild(b));
  row.append(info, box); savesList.appendChild(row);
}
function renderSaves(msg){
  const last = latestSaveKey(), li = last ? getSaveInfo(last) : null;
  document.getElementById('savesLast').textContent = li ? 'Последнее сохранение: '+fmtSave(li) : 'Сохранений пока нет.';
  document.getElementById('savesMsg').textContent = msg || (saveErr ? '⚠ '+saveErr : '');
  savesList.innerHTML = '';
  const ai = getSaveInfo(SAVE_KEY);
  saveRow('Автосохранение', ai ? fmtSave(ai) : 'Пусто. Появится само при переходах, в лавке и по ходу игры.',
    [shopButton('Загрузить', ()=>{ loadGame(SAVE_KEY); }, !ai)]);
  SLOT_KEYS.forEach((key,n)=>{
    const info = getSaveInfo(key), btns = [];
    btns.push(shopButton('Загрузить', ()=>{ loadGame(key); }, !info));
    btns.push(shopButton(info ? 'Записать' : 'Сохранить сюда', ()=>{
      if(info && !confirm('Перезаписать слот '+(n+1)+'?')) return;
      renderSaves(saveToSlot(n) ? 'Игра сохранена в слот '+(n+1)+'.' : (saveErr || 'Не удалось сохранить (хранилище недоступно).'));
    }, !hasActiveGame));
    if(info) btns.push(shopButton('Удалить', ()=>{ if(!confirm('Удалить слот '+(n+1)+'?')) return; try{ localStorage.removeItem(key); }catch(e){} saveCache.delete(key); saveErr = ''; renderSaves('Слот '+(n+1)+' удалён.'); }));
    saveRow('Слот '+(n+1), info ? fmtSave(info) : (hasActiveGame ? 'Пусто' : 'Пусто. Начните или загрузите игру, чтобы сохранять сюда.'), btns);
  });
}
function openSaves(){ startScreenEl.classList.add('hidden'); renderSaves(''); savesScreen.classList.remove('hidden'); }
function closeSaves(){ savesScreen.classList.add('hidden'); startScreenEl.classList.remove('hidden'); refreshSaveUI(); }
// периодическое автосохранение — только когда рядом нет врагов (чтобы не сохраниться посреди боя)
setInterval(()=>{
  if(gameState!=='playing') return;
  const calm = !loc.enemies.some(e=> e.hp>0 && Math.hypot(e.x-player.x, e.y-player.y) < e.aggro+60);
  if(calm) saveGame();
}, 20000);
// при сворачивании вкладки и закрытии страницы сохраняем точное состояние
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) saveGameNow(); });
window.addEventListener('pagehide', saveGameNow);
// один раз при запуске: пережать старые несжатые сохранения, чтобы освободить место
setTimeout(compactStoredSaves, 1500);

// ---------- Торговая лавка ----------
const shopScreen = document.getElementById('shopScreen');
const shopList = document.getElementById('shopList');
const shopTabsEl = document.getElementById('shopTabs');
let shopTab = 'weapons';
const BOOTS_PRICE = 260;
const SHOP_TABS = [['boots','👢 Сапоги'],['weapons','⚔ Оружие'],['armor','🛡 Броня'],['potions','✚ Эликсиры'],['elixirs','⚗ Зелья'],['quests','📜 Задания'],['forge','🔨 Кузнец']];
function shopKind(){ return currentLocId==='house2' ? 'alch' : shopMode==='caravan' ? 'caravan' : null; }
function shopTabsNow(){ const k = shopKind(); if(k==='caravan') return SHOP_TABS.filter(t=>t[0]==='boots'||t[0]==='potions'||t[0]==='elixirs'); if(k) return SHOP_TABS.filter(t=>t[0]==='potions'||t[0]==='elixirs'); return SHOP_TABS.filter(t=>t[0]!=='boots'); }
function shopMul(){ const k = shopKind(); return k==='alch' ? 0.8 : k==='caravan' ? 0.75 : 1; }
function openShop(msg){
  SFX.play('shopOpen');
  for(const k in keys) keys[k]=false;
  gameState='shop';
  if(!shopTabsNow().some(t=>t[0]===shopTab)) shopTab = shopTabsNow()[0][0];
  if(shopKind() && !msg) shopTab = (shopKind()==='caravan' && !player.boots) ? 'boots' : 'elixirs';
  renderShop(msg || (shopKind()==='alch' ? 'Добро пожаловать в мою лавку! Для вас — скидка 20%.' : shopKind()==='caravan' ? 'Караванщик Хазим: «Редкая удача, путник! Скидка 25% на эликсиры и зелья — а ещё у меня есть сапоги-скороходы, их нигде больше не купить.»' : 'Торговец: «'+STORY_TIPS[Math.min(10,storyStage())]+'»'));
  shopScreen.classList.remove('hidden');
}
function closeShop(){
  shopScreen.classList.add('hidden');
  gameState='playing';
  shopLock=true; evShopLock = shopMode==='caravan'; shopMode = null;
  saveGame();
}
function shopRow(title, desc, buttons){
  const row = document.createElement('div'); row.className='shopItem';
  const info = document.createElement('div'); info.className='shopInfo';
  const nm = document.createElement('b'); nm.textContent = title;
  const ds = document.createElement('span'); ds.textContent = desc;
  info.append(nm, ds);
  const box = document.createElement('div'); box.className='shopBtns';
  buttons.forEach(b=>box.appendChild(b));
  row.append(info, box); shopList.appendChild(row);
}
function shopButton(text, onClick, disabled){
  const b = document.createElement('button'); b.className='startBtn shopBtn'; b.textContent=text;
  if(disabled) b.disabled = true; else b.addEventListener('click', onClick);
  return b;
}
// одна строка снаряжения: оружие или броня
function gearRow(kind, id, def){
  const isW = kind==='weapon';
  const owned = isW ? player.owned : player.ownedArmor;
  const current = isW ? player.weapon : player.armor;
  const desc = isW
    ? `Урон ×${def.mult} (сейчас ${Math.round(player.atk*def.mult)}). ${def.desc}`
    : `Гасит ${Math.round(def.reduce*100)}% получаемого урона. ${def.desc}`;
  const equip = ()=>{ if(isW) player.weapon=id; else player.armor=id; };
  let btn;
  if(current===id) btn = shopButton('Экипировано', null, true);
  else if(owned[id]) btn = shopButton('Экипировать', ()=>{ equip(); saveGame(); renderShop(`Экипировано: ${def.name}.`); });
  else btn = shopButton(`Купить — ${def.price} ◆`, ()=>{
    if(player.gold < def.price){ renderShop(`Не хватает золота: нужно ${def.price}, у вас ${player.gold}.`); return; }
    player.gold -= def.price; owned[id]=true; equip();
    addNote(`Куплено: ${def.name}`, '#7fe07f'); saveGame();
    renderShop(`${def.name} куплено и экипировано. Удачной охоты!`);
  });
  const btns = [btn];
  if(owned[id] && def.price>0){
    const sell = Math.floor(def.price*0.5);
    btns.push(shopButton('Продать — '+sell+' ◆', ()=>{
      delete owned[id];
      if(current===id){ if(isW) player.weapon='sword'; else player.armor='none'; }
      player.gold += sell;
      addNote('Продано: '+def.name+' (+'+sell+' золота)', '#e0c96a'); saveGame();
      renderShop(def.name+' продано за '+sell+' ◆.');
    }));
  }
  shopRow(def.name, desc, btns);
}
function renderQuests(){
  const act = player.quest;
  for(const id of Object.keys(QUESTS)){
    const d = QUESTS[id]; if(d.gen) continue;
    const reward = 'Награда: '+d.gold+' ◆'+(d.potions ? ' и '+d.potions+' зел.' : '');
    let btn, extra = '', extraBtn = null;
    if(player.questsDone && player.questsDone[id]) btn = shopButton('Выполнено ✓', null, true);
    else if(act && act.id===id){
      if(act.done){
        btn = shopButton('Получить Вознаграждение', ()=>{
          player.gold += d.gold; player.potions = Math.min(POTION_MAX, player.potions + d.potions);
          player.quest = null; player.questsDone[id] = true;
          addNote('📜 Награда: +'+d.gold+' золота', '#e0c96a'); SFX.play('levelup'); saveGame();
          renderShop('Задание «'+d.name+'» выполнено: +'+d.gold+' золота'+(d.potions?' и эликсиры':'')+'.');
        });
      } else btn = shopButton('В процессе '+act.progress+'/'+d.target, null, true);
      extraBtn = shopButton('Отменить', ()=>{ player.quest = null; saveGame(); renderShop('Задание «'+d.name+'» отменено. Можно взять другое.'); });
    } else {
      if(act) extra = ' (сначала завершите текущее задание)';
      btn = shopButton('Взять', ()=>{ player.quest = {id, progress:0, done:false}; saveGame(); renderShop('Задание принято: «'+d.name+'».'); }, !!act);
    }
    shopRow(d.name, d.desc+' '+reward+extra, extraBtn ? [btn, extraBtn] : [btn]);
  }
  renderGenQuests();
}
function elixShopRow(k){
      const d = ELIX[k], price = Math.round(d.price*shopMul());
      const buy = shopButton(`Купить — ${price} ◆`, ()=>{
        if(player.elix[k]>=ELIX_MAX){ renderShop(`Максимум этого вида: ${ELIX_MAX}.`); return; }
        if(player.gold<price){ renderShop(`Не хватает золота: нужно ${price}, у вас ${player.gold}.`); return; }
        player.gold -= price; player.elix[k]++; saveGame(); renderShop(d.name+' куплено.');
      });
      const sell = shopButton(`Продать — ${d.sell} ◆`, ()=>{
        if(!(player.elix[k]>0)){ renderShop('У вас нет таких для продажи.'); return; }
        player.elix[k]--; player.gold += d.sell; saveGame(); renderShop(d.name+' продано.');
      });
      shopRow(d.name, `${d.desc} У вас: ${player.elix[k]}/${ELIX_MAX}. Горячая клавиша: ${ELIX_KEYS.indexOf(k)+1}.`, [buy, sell]);
    }
function renderShop(msg){
  if(msg){ if(/Не хватает|нет зелий|нет эликсиров|нет эликсиров здоровья|полон|максимум/i.test(msg)) SFX.play('deny'); else if(/куплен|продан|улучшен|зачаров/i.test(msg)) SFX.play('buy'); }
  document.getElementById('shopMsg').textContent = msg || '';
  document.getElementById('shopGold').textContent = '◆ Золото: ' + player.gold;
  shopTabsEl.innerHTML='';
  if(!shopTabsNow().some(t=>t[0]===shopTab)) shopTab = shopTabsNow()[0][0];
  shopTabsNow().forEach(([id,label])=>{
    const t = document.createElement('button'); t.className = 'tabBtn' + (shopTab===id ? ' active' : ''); t.textContent = label;
    t.addEventListener('click', ()=>{ shopTab=id; renderShop(''); });
    shopTabsEl.appendChild(t);
  });
  shopList.innerHTML='';
  if(shopTab==='boots'){
    const have = !!player.boots;
    const b = have ? shopButton('Куплено ✓', null, true) : shopButton(`Купить — ${BOOTS_PRICE} ◆`, ()=>{
      if(player.gold<BOOTS_PRICE){ renderShop(`Не хватает золота: нужно ${BOOTS_PRICE}, у вас ${player.gold}.`); return; }
      player.gold -= BOOTS_PRICE; player.boots = true; addNote('👢 Куплены сапоги-скороходы: +18% к скорости', '#ffd34a'); saveGame(); renderShop('Сапоги-скороходы куплены и надеты — вы стали быстрее!');
    });
    shopRow('👢 Сапоги-скороходы', 'Скорость передвижения +18% навсегда. Такие сапоги не продаются в лавках — только у караванщиков.', [b]);
  } else if(shopTab==='weapons'){
    for(const id of Object.keys(WEAPONS).filter(weaponUnlocked).sort((a,b)=>(WEAPON_UNLOCK[a]||0)-(WEAPON_UNLOCK[b]||0))) gearRow('weapon', id, WEAPONS[id]);
  } else if(shopTab==='armor'){
    for(const id of Object.keys(ARMORS)) if(id!=='none' && (armorUnlocked(id) || player.ownedArmor[id])) gearRow('armor', id, ARMORS[id]);
  } else if(shopTab==='quests'){
    renderQuests();
  } else if(shopTab==='forge'){
    renderForge();
  } else if(shopTab==='elixirs'){
    for(const k of ELIX_KEYS.filter(k=>k!=='big')) elixShopRow(k);
  } else {
    const PB = Math.round(POTION_BUY*shopMul());
    const buy = shopButton(`Купить — ${PB} ◆`, ()=>{
      if(player.potions>=POTION_MAX){ renderShop(`В инвентаре максимум эликсиров (${POTION_MAX}).`); return; }
      if(player.gold<PB){ renderShop(`Не хватает золота: нужно ${PB}, у вас ${player.gold}.`); return; }
      player.gold-=PB; player.potions++; saveGame(); renderShop('Эликсир здоровья куплен.');
    }, false);
    const sell = shopButton(`Продать — ${POTION_SELL} ◆`, ()=>{
      if(player.potions<=0){ renderShop('У вас нет эликсиров на продажу.'); return; }
      player.potions--; player.gold+=POTION_SELL; saveGame(); renderShop('Эликсир продан.');
    }, false);
    shopRow('Эликсир здоровья', `Лечит 30 HP. У вас: ${player.potions}/${POTION_MAX}. Скупаю по ${POTION_SELL} ◆.`, [buy, sell]);
    elixShopRow('big');
  }
}
document.getElementById('shopClose').addEventListener('click', closeShop);

// ---------- Кнопка звука ----------
const soundBtn = document.getElementById('soundBtn');
function refreshSoundBtn(){ soundBtn.textContent = SFX.muted ? '🔇' : '🔊'; }
soundBtn.addEventListener('click', ()=>{
  SFX.unlock(); SFX.setMuted(!SFX.muted); refreshSoundBtn();
  if(!SFX.muted) SFX.play('click');
});
refreshSoundBtn();

// ---------- Полноэкранный режим ----------
let fsToastTimer = null;
function showFsToast(msg){
  const el = document.getElementById('fsToast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(fsToastTimer);
  fsToastTimer = setTimeout(()=>el.classList.add('hidden'), 5500);
}
function toggleFullscreen(){
  const el = document.getElementById('gameWrap');
  const isFs = document.fullscreenElement || document.webkitFullscreenElement;
  if(!isFs){
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if(!req){
      // Safari на iPhone/iPad не реализует Fullscreen API для обычных элементов —
      // это ограничение самой Apple, через код браузера это не обойти.
      showFsToast('На iPhone/iPad полноэкранный режим недоступен — это ограничение Safari, а не игры. Похожий эффект даёт «Поделиться» → «На экран «Домой»»: ярлык игры откроется без адресной строки.');
      return;
    }
    try{
      Promise.resolve(req.call(el)).then(()=>{
        if(screen.orientation && screen.orientation.lock){
          screen.orientation.lock('landscape').catch(()=>{});
        }
      }).catch(()=>{
        showFsToast('Не удалось включить полноэкранный режим в этом браузере.');
      });
    } catch(err){
      showFsToast('Не удалось включить полноэкранный режим в этом браузере.');
    }
  } else {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if(exit) exit.call(document);
  }
}
function updateFsButton(){
  const isFs = document.fullscreenElement || document.webkitFullscreenElement;
  fullscreenBtn.textContent = isFs ? '🗗' : '⛶';
}
fullscreenBtn.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', ()=>{ updateFsButton(); setTimeout(resizeCanvas,100); });
document.addEventListener('webkitfullscreenchange', ()=>{ updateFsButton(); setTimeout(resizeCanvas,100); });

document.getElementById('startBtn').addEventListener('click', ()=>{
  if(getSaveInfo() && !confirm('Начать новую игру? Автосохранение будет перезаписано, как только вы продвинетесь (ручные слоты останутся).')) return;
  newGameWithIntro();
});
savesBtn.addEventListener('click', openSaves);
document.getElementById('savesBack').addEventListener('click', closeSaves);

