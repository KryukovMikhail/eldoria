// ---------- Звук (WebAudio: синтез на лету, внешних файлов нет) ----------
// ---------- Качество графики (для слабых телефонов) ----------
const QLEVELS = {low:{name:'Слабое', part:0.3, fog:0.25, anim:0, light:0}, mid:{name:'Среднее', part:0.6, fog:0.5, anim:1, light:1}, high:{name:'Высокое', part:1, fog:0.5, anim:2, light:2}};
let quality = (navigator.maxTouchPoints>0 ? 'mid' : 'high');
try{ const q = localStorage.getItem('eldoria_q'); if(QLEVELS[q]) quality = q; }catch(e){}
function Q(){ return QLEVELS[quality]; }
// «Авто»: игра сама понижает качество, если кадры стабильно долгие (по умолчанию включено, ручной выбор отключает)
let autoQ = true;
try{ if(localStorage.getItem('eldoria_qm')==='1') autoQ = false; }catch(e){}
const QORDER = ['high','mid','low'];
function applyQuality(q){ quality = q; try{ localStorage.setItem('eldoria_q', q); }catch(e){} lightCv = null; fogTmp = null; renderQuality(); }
function setQuality(q){ if(!QLEVELS[q]) return; autoQ = false; try{ localStorage.setItem('eldoria_qm','1'); }catch(e){} applyQuality(q); }
function setAutoQuality(){ autoQ = true; try{ localStorage.removeItem('eldoria_qm'); }catch(e){} afSum = 0; afN = 0; afBad = 0; renderQuality(); }
let afSum = 0, afN = 0, afBad = 0;
// вызывается каждый кадр с реальным интервалом между кадрами (мс); возвращает true, если качество понижено
function autoQualityTick(rawMs, active){
  if(!autoQ || !active || rawMs > 250 || rawMs <= 0){ return false; } // вкладка в фоне или пауза — не считаем
  afSum += rawMs; afN++;
  if(afN < 90) return false;
  const avg = afSum/afN; afSum = 0; afN = 0;
  afBad = avg > 26 ? afBad+1 : 0;
  if(afBad >= 2){
    afBad = 0; const i = QORDER.indexOf(quality);
    if(i < QORDER.length-1){ applyQuality(QORDER[i+1]); try{ addNote('Для плавности качество графики снижено: '+QLEVELS[quality].name, '#9ad0ff'); }catch(e){} return true; }
  }
  return false;
}
function renderQuality(){
  const box = document.getElementById('qBtns'); if(!box) return;
  box.innerHTML = '';
  for(const id of Object.keys(QLEVELS)){
    const b = document.createElement('button'); b.className = 'tabBtn'+(quality===id && !autoQ ? ' active' : ''); b.textContent = QLEVELS[id].name;
    b.addEventListener('click', ()=>setQuality(id)); box.appendChild(b);
  }
  { const b = document.createElement('button'); b.className = 'tabBtn'+(autoQ ? ' active' : ''); b.textContent = 'Авто';
    b.addEventListener('click', setAutoQuality); box.appendChild(b); }
  const d = document.getElementById('qDesc'); if(d) d.textContent = (autoQ ? 'Авто: сейчас «'+QLEVELS[quality].name+'», снижается само, если игра тормозит. ' : '') + (quality==='low' ? 'Меньше погоды и тумана, без анимаций листвы, волн и света факелов' : quality==='mid' ? 'Погода вполовину, упрощённые анимации' : 'Все эффекты в полную силу');
}
const SFX = {
  ctx:null, master:null, sfx:null, music:null, noiseBuf:null, muted:false, droneAt:0,
  init(){
    if(this.ctx) return true;
    try{
      const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      this.music = this.ctx.createGain(); this.music.gain.value = 0.5; this.music.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1,len,len);
      const d = this.noiseBuf.getChannelData(0); for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
      return true;
    }catch(e){ this.ctx=null; return false; }
  },
  unlock(){
    AudioFix.prime();
    if(!this.init()) return;
    const c = this.ctx;
    if(c.state!=='running'){ try{ const p = c.resume(); if(p && p.catch) p.catch(()=>{}); }catch(e){} }
    if(!this._primed){                                                  // «прогревочный» беззвучный буфер внутри жеста пользователя — требование iOS
      try{ const b = c.createBuffer(1,1,22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); this._primed = true; }catch(e){}
    }
  },
  setMuted(m){
    this.muted = m;
    if(this.master) this.master.gain.value = m ? 0 : 0.9;
    try{ localStorage.setItem('eldoria_muted', m?'1':'0'); }catch(e){}
  },
  tone(f,dur,o){
    o = o||{}; if(!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + (o.delay||0);
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f,t);
    if(o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.slide), t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(o.vol||0.2, t+(o.attack||0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    osc.connect(g); g.connect(o.dest || this.sfx);
    osc.start(t); osc.stop(t+dur+0.05);
  },
  noise(dur,o){
    o = o||{}; if(!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + (o.delay||0);
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const fl = this.ctx.createBiquadFilter(); fl.type = o.type || 'bandpass';
    fl.frequency.setValueAtTime(o.f0||1000,t);
    if(o.f1) fl.frequency.exponentialRampToValueAtTime(o.f1, t+dur);
    fl.Q.value = o.q || 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(o.vol||0.15, t+(o.attack||0.01)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(fl); fl.connect(g); g.connect(this.sfx);
    src.start(t, Math.random()*0.5); src.stop(t+dur+0.05);
  },
  play(n){
    if(!this.ctx || this.muted) return;
    switch(n){
      case 'swing':   this.noise(0.13,{f0:500,f1:2600,q:0.9,vol:0.14}); break;
      case 'spear':   this.noise(0.15,{f0:900,f1:3200,q:1.2,vol:0.12}); this.tone(420,0.1,{type:'triangle',slide:700,vol:0.05}); break;
      case 'hit':     this.tone(170,0.1,{type:'square',slide:60,vol:0.2}); this.noise(0.07,{type:'lowpass',f0:1800,f1:300,vol:0.18}); break;
      case 'kill':    this.tone(320,0.28,{type:'sawtooth',slide:55,vol:0.16}); this.noise(0.25,{type:'lowpass',f0:2200,f1:200,vol:0.18}); break;
      case 'hurt':    this.tone(240,0.22,{type:'sawtooth',slide:80,vol:0.22}); this.noise(0.1,{f0:900,f1:300,vol:0.12}); break;
      case 'coin':    this.tone(1318,0.08,{vol:0.12}); this.tone(1760,0.16,{vol:0.12,delay:0.07}); break;
      case 'pickup':  this.tone(500,0.12,{type:'triangle',slide:900,vol:0.14}); this.tone(900,0.14,{type:'triangle',slide:1300,vol:0.12,delay:0.1}); break;
      case 'drink':   this.tone(320,0.07,{slide:200,vol:0.14}); this.tone(300,0.07,{slide:190,vol:0.14,delay:0.09}); this.tone(280,0.07,{slide:180,vol:0.14,delay:0.18}); this.tone(600,0.18,{type:'triangle',slide:1100,vol:0.12,delay:0.27}); break;
      case 'levelup': [523,659,784,1047].forEach((f,i)=>this.tone(f,0.22,{type:'triangle',vol:0.16,delay:i*0.1})); break;
      case 'shopOpen':this.tone(880,0.6,{vol:0.12}); this.tone(1320,0.5,{vol:0.07,delay:0.02}); break;
      case 'buy':     this.tone(1318,0.08,{vol:0.12}); this.tone(1760,0.1,{vol:0.12,delay:0.07}); this.tone(1976,0.22,{vol:0.12,delay:0.14}); break;
      case 'deny':    this.tone(130,0.16,{type:'square',slide:100,vol:0.12}); break;
      case 'portal':  this.noise(0.7,{type:'lowpass',f0:200,f1:1600,vol:0.2,attack:0.2}); this.tone(80,0.7,{type:'sine',slide:320,vol:0.18,attack:0.2}); break;
      case 'death':   this.tone(330,1.0,{type:'sawtooth',slide:50,vol:0.22}); this.noise(0.5,{type:'lowpass',f0:1500,f1:100,vol:0.15}); break;
      case 'boss':    [392,523,659,784].forEach((f,i)=>this.tone(f,0.5,{type:'triangle',vol:0.16,delay:i*0.16})); this.noise(0.7,{type:'lowpass',f0:1200,f1:80,vol:0.2}); break;
      case 'win':     [523,659,784,1047,1319,1568].forEach((f,i)=>this.tone(f,0.5,{type:'triangle',vol:0.16,delay:i*0.14})); break;
      case 'click':   this.tone(900,0.035,{type:'square',vol:0.05}); break;
      case 'axe':     this.noise(0.2,{type:'lowpass',f0:300,f1:1400,q:0.8,vol:0.24}); this.tone(120,0.18,{type:'triangle',slide:60,vol:0.16}); break;
      case 'crossbow': this.tone(210,0.09,{type:'square',slide:-60,vol:0.14}); this.noise(0.06,{f0:3000,f1:1400,q:2,vol:0.1}); this.tone(520,0.07,{type:'triangle',slide:200,vol:0.06,delay:0.03}); break;
      case 'musket': this.noise(0.28,{f0:900,f1:140,q:0.8,vol:0.34}); this.tone(90,0.22,{type:'sawtooth',slide:-50,vol:0.2}); this.noise(0.5,{f0:300,f1:80,q:0.6,vol:0.12,delay:0.05}); break;
      case 'bow':     this.tone(340,0.13,{type:'triangle',slide:110,vol:0.16}); this.noise(0.07,{f0:2600,f1:1200,q:2,vol:0.09}); this.tone(1200,0.05,{type:'sine',slide:700,vol:0.05,delay:0.02}); break;
      case 'shoot':   this.tone(700,0.2,{type:'sawtooth',slide:220,vol:0.09}); this.noise(0.14,{f0:1800,f1:500,q:1,vol:0.07}); break;
      case 'thunder': this.noise(1.5,{type:'lowpass',f0:420,f1:60,q:0.7,vol:0.4,attack:0.05}); this.tone(55,1.2,{type:'sine',slide:32,vol:0.26}); break;
      case 'rain':    this.noise(0.7,{type:'highpass',f0:4200,q:0.5,vol:0.04,attack:0.2}); break;
      case 'wind':    this.noise(1.3,{f0:350,f1:900,q:0.6,vol:0.05,attack:0.45}); break;
      case 'roar':    this.tone(90,0.55,{type:'sawtooth',slide:-35,vol:0.26}); this.noise(0.5,{type:'lowpass',f0:900,f1:120,q:0.8,vol:0.2}); this.tone(140,0.4,{type:'square',slide:-60,vol:0.08,delay:0.05}); break;
      case 'charge':  this.noise(0.35,{f0:200,f1:1800,q:0.9,vol:0.2,attack:0.15}); this.tone(110,0.3,{type:'sawtooth',slide:260,vol:0.14}); break;
      case 'boom':    this.noise(0.7,{type:'lowpass',f0:1800,f1:60,q:0.6,vol:0.42}); this.tone(70,0.5,{type:'sine',slide:28,vol:0.34}); this.noise(0.25,{f0:3000,f1:600,q:1,vol:0.12}); break;
      case 'fuse':    this.noise(0.45,{f0:2400,f1:3800,q:3,vol:0.1}); this.tone(1500,0.4,{type:'square',slide:900,vol:0.04}); break;
      case 'heal':    [660,880,1100].forEach((f,i)=>this.tone(f,0.28,{type:'sine',slide:90,vol:0.12,delay:i*0.07})); this.tone(1760,0.3,{type:'triangle',vol:0.05,delay:0.22}); break;
      case 'blink':   this.tone(1500,0.14,{type:'sine',slide:-1100,vol:0.12}); this.noise(0.12,{f0:3500,f1:800,q:2,vol:0.08}); break;
      case 'summon':  this.tone(160,0.55,{type:'sawtooth',slide:90,vol:0.14}); this.tone(240,0.5,{type:'triangle',slide:420,vol:0.1,delay:0.1}); this.noise(0.5,{type:'lowpass',f0:300,f1:1200,vol:0.1,attack:0.2}); break;
      case 'clang':   this.tone(1250,0.2,{type:'square',slide:-200,vol:0.1}); this.tone(1870,0.28,{type:'triangle',vol:0.08}); this.noise(0.06,{f0:5000,f1:2000,q:2,vol:0.12}); break;
      case 'mortar':  this.tone(150,0.18,{type:'square',slide:-90,vol:0.16}); this.noise(0.2,{type:'lowpass',f0:1200,f1:200,vol:0.18}); break;
      case 'bite':    this.noise(0.1,{f0:2200,f1:600,q:2,vol:0.14}); this.tone(380,0.12,{type:'sawtooth',slide:-200,vol:0.1}); break;
      case 'splat':   this.noise(0.18,{type:'lowpass',f0:900,f1:200,q:0.7,vol:0.2}); this.tone(200,0.14,{type:'sine',slide:-100,vol:0.12}); break;
      case 'barrel':  this.noise(0.2,{type:'lowpass',f0:1400,f1:250,q:0.8,vol:0.26}); this.tone(180,0.12,{type:'triangle',slide:-90,vol:0.16}); this.noise(0.1,{f0:3000,f1:1200,q:2,vol:0.08,delay:0.06}); break;
      case 'spikes':  this.noise(0.12,{f0:3500,f1:1500,q:2,vol:0.14}); this.tone(900,0.08,{type:'square',slide:-400,vol:0.1}); break;
      case 'plate':   this.tone(130,0.12,{type:'square',slide:-40,vol:0.18}); this.noise(0.15,{type:'lowpass',f0:700,f1:150,vol:0.2}); this.tone(520,0.1,{type:'triangle',vol:0.08,delay:0.12}); break;
      case 'bolt':    this.noise(0.12,{f0:6000,f1:1500,q:1,vol:0.34}); this.noise(1.2,{type:'lowpass',f0:500,f1:50,q:0.7,vol:0.4,attack:0.04,delay:0.08}); this.tone(50,1.0,{type:'sine',slide:28,vol:0.28,delay:0.08}); break;
      case 'step':    this.noise(0.05,{type:'lowpass',f0:500,f1:250,vol:0.045}); break;
    }
  },
  // тихая фоновая музыка: редкие ноты пентатоники + длинный фон; для разных мест свой лад
  musicTick(){
    if(!this.ctx || this.muted || this.ctx.state!=='running') return;
    if(gameState!=='playing' && gameState!=='shop') return;
    const mode = currentLocId==='overworld' ? (darkness()>0.5 ? 'night' : 'day') : (currentLocId==='dungeon3' || currentLocId==='manor' || LAIR[currentLocId]) ? 'abyss' : currentLocId==='city' ? 'night'
               : currentLocId==='lava' ? 'lava' : currentLocId==='desert' ? 'desert' : currentLocId==='ice' ? 'ice' : currentLocId==='grave' ? 'grave' : currentLocId==='jungle' ? 'jungle' : currentLocId==='town' ? 'town' : currentLocId.startsWith('house') ? 'house' : 'cave';
    const sc = {day:[261.6,293.7,329.6,392,440,523.3,587.3], night:[196,220,261.6,293.7,329.6,392], cave:[110,130.8,146.8,164.8,196,220,261.6], abyss:[98,103.8,130.8,146.8,155.6,196,207.7],
                lava:[82.4,87.3,110,123.5,130.8,164.8], desert:[146.8,155.6,185,196,233,293.7], ice:[392,440,523,587,698,784], grave:[110,123.5,130.8,155.6,164.8,196], jungle:[196,233,261.6,293.7,349.2,392], town:[261.6,329.6,392,440,523.3,587.3], house:[196,246.9,293.7,329.6,392]}[mode];
    const soft = mode==='day' || mode==='ice' || mode==='town' || mode==='house';
    if(Math.random() < {day:0.55,night:0.4,cave:0.35,abyss:0.3,lava:0.3,desert:0.4,ice:0.45,grave:0.3,jungle:0.5,town:0.55,house:0.4}[mode]){
      this.tone(sc[Math.floor(Math.random()*sc.length)], soft?1.6:2.4, {type:mode==='day'?'triangle':'sine', vol:soft?0.05:0.06, attack:0.02, dest:this.music});
    }
    // повторяющийся мотив: у каждого места свой рисунок (индексы лада, -1 пауза); в логове — ещё и барабан
    const MOT = {day:[0,2,4,2,5,4,2,-1], night:[0,-1,2,-1,4,2,1,-1], cave:[0,-1,-1,3,2,-1,-1,1], abyss:[0,1,-1,4,-1,3,1,-1], lava:[0,0,2,-1,3,2,0,-1], desert:[0,1,3,4,3,1,0,-1],
                 ice:[4,2,0,2,4,5,4,-1], grave:[0,-1,2,-1,1,-1,3,-1], jungle:[0,2,4,5,4,2,3,-1], town:[0,2,4,5,4,2,0,-1], house:[0,-1,2,4,2,-1,0,-1]}[mode];
    this.step = (this.step||0)+1;
    if(this.step%2===0 && MOT){
      const n = MOT[(this.step/2)%MOT.length|0];
      if(n>=0) this.tone(sc[n%sc.length]*(mode==='day'||mode==='town'?1:0.5), soft?1.1:1.5, {type:soft?'triangle':'sine', vol:0.04, attack:0.03, dest:this.music});
    }
    if(LAIR[currentLocId]){
      const L = loc && loc.boss; const alive = !L || L.hp>0;
      if(alive && this.step%2===0){ this.tone(52, 0.22, {type:'sine', slide:30, vol:0.12, attack:0.005, dest:this.music}); if(this.step%4===2) this.noise(0.08,{type:'highpass',f0:5000,q:0.5,vol:0.025,attack:0.005}); }
    }
    const now = this.ctx.currentTime;
    if(now > this.droneAt){ this.tone({day:130.8,night:98,cave:55,abyss:49,lava:41,desert:73,ice:196,grave:58,jungle:110,town:98,house:65}[mode], 5, {vol:0.05, attack:0.9, dest:this.music}); this.droneAt = now+4.6; }
    const w = weatherName();                                               // шум погоды
    if(w==='rain' || w==='storm') this.play('rain');
    else if(w==='blizzard' || w==='sand') { if(Math.random()<0.5) this.play('wind'); }
  }
};
try{ SFX.muted = localStorage.getItem('eldoria_muted')==='1'; }catch(e){}
setInterval(()=>SFX.musicTick(), 520);
['pointerdown','pointerup','touchstart','touchend','click','keydown'].forEach(ev=>window.addEventListener(ev, ()=>SFX.unlock(), {passive:true, capture:true}));
document.addEventListener('visibilitychange', ()=>{ if(!SFX.ctx) return; if(document.hidden) SFX.ctx.suspend(); else SFX.ctx.resume(); });
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('button'); if(b && b.id!=='soundBtn') SFX.play('click'); });

