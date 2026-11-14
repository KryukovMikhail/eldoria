// ---------- Заставка «The Legend of Eldoria» ----------
// Стартовая страница перед главным меню: волшебный лес с лучами света, светлячками и героем на тропе,
// золотое название с эмблемой Сердца Эльдории и кнопка «Играть». Всё рисуется кодом — без картинок и сети.
// Неподвижные слои (небо, дальний лес, тропа, ближние деревья, листва) строятся один раз в отдельные холсты,
// каждый кадр только сдвигаются (параллакс) и поверх рисуются лучи, пылинки, светлячки, листья и герой.
const splash = (()=>{
  const root = document.getElementById('splash');
  if(!root) return {active:false};
  const test = document.documentElement.dataset.test==='1' && !/[?&]splash\b/.test(location.search);
  const cv = document.getElementById('splashCv'), g = cv.getContext('2d');
  const bt = document.getElementById('buildTag'), sb = document.getElementById('splashBuild');
  if(bt && sb) sb.textContent = bt.textContent;
  const st = {active:!test, t0:performance.now(), raf:0, W:0, H:0, dpr:1, layers:[], px:0, py:0, tx:0, ty:0, parts:null, gone:false};
  if(test){ root.classList.add('hidden'); return st; }

  // ----- случайные числа с зерном: сцена одинаковая при каждом запуске -----
  let seed = 7;
  const rnd = ()=>{ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed>>>15, 1 | seed); t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t; return ((t ^ t>>>14) >>> 0) / 4294967296; };
  const R = (a,b)=>a+(b-a)*rnd();
  const mix = (c1,c2,k)=>'rgb('+[0,1,2].map(i=>Math.round(c1[i]+(c2[i]-c1[i])*k)).join(',')+')';
  const hex = h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];

  // ----- композиция зависит от формы экрана -----
  function comp(){
    const W = st.W, H = st.H, land = W >= H*1.05, s = Math.min(W,H);
    return land
      ? {W,H,s,land, vp:{x:W*0.36, y:H*0.57}, ls:{x:W*0.50, y:-H*0.18}, hero:{x:W*0.335, y:H*0.86, h:H*0.27}, pathBot:W*0.30}
      : {W,H,s,land, vp:{x:W*0.52, y:H*0.62}, ls:{x:W*0.62, y:-H*0.12}, hero:{x:W*0.47, y:H*0.90, h:H*0.17}, pathBot:W*0.47};
  }

  // ----- ствол дерева: изогнутый, с корнями, корой и подсветкой со стороны света -----
  function trunk(c, x, baseY, w, col, fogK, lightSide, opt){
    opt = opt || {};
    const topY = -c.H*0.15, bend = (opt.bend!=null ? opt.bend : R(-0.25,0.25))*w, base = hex(col), fog = hex('#a9d2b6');
    const body = mix(base, fog, fogK), dark = mix(base.map(v=>v*0.55), fog, fogK*0.8), lite = mix(base.map(v=>Math.min(255,v*1.7+20)), fog, fogK*0.6);
    const L = y=>{ const k = (baseY-y)/(baseY-topY); return x - w/2 + bend*Math.sin(k*Math.PI*0.9) - (1-k)*(1-k)*w*0.35*(opt.flare||1); };
    const Rt = y=>{ const k = (baseY-y)/(baseY-topY); return x + w/2 + bend*Math.sin(k*Math.PI*0.9) + (1-k)*(1-k)*w*0.35*(opt.flare||1); };
    const n = 24;
    g2.beginPath();
    for(let i=0;i<=n;i++){ const y = baseY-(baseY-topY)*i/n; g2.lineTo(L(y), y); }
    for(let i=n;i>=0;i--){ const y = baseY-(baseY-topY)*i/n; g2.lineTo(Rt(y), y); }
    g2.closePath();
    const gr = g2.createLinearGradient(x-w, 0, x+w, 0);
    if(lightSide>0){ gr.addColorStop(0, dark); gr.addColorStop(0.55, body); gr.addColorStop(1, lite); }
    else { gr.addColorStop(0, lite); gr.addColorStop(0.45, body); gr.addColorStop(1, dark); }
    g2.fillStyle = gr; g2.fill();
    // корни
    if(opt.roots!==false){
      g2.fillStyle = body;
      for(let r=0;r<4;r++){
        const dir = r<2 ? -1 : 1, rx = x + dir*w*R(0.25,0.55), len = w*R(0.6,1.3);
        g2.beginPath(); g2.moveTo(rx - w*0.18, baseY - w*0.25); g2.quadraticCurveTo(rx + dir*len*0.5, baseY - w*0.1, rx + dir*len, baseY + w*R(0.02,0.1));
        g2.quadraticCurveTo(rx + dir*len*0.4, baseY + w*0.05, rx + w*0.18*dir, baseY); g2.closePath(); g2.fill();
      }
    }
    // кора: вертикальные бороздки
    if(w > c.s*0.03){
      g2.save(); g2.clip();
      g2.strokeStyle = dark; g2.globalAlpha = 0.45; g2.lineWidth = Math.max(1, w*0.025);
      for(let i=0;i<Math.round(w/(c.s*0.012));i++){
        const fx = R(-0.45,0.45); let y = baseY; g2.beginPath();
        const y2 = R(topY, baseY-w);
        for(let k=0;k<=10;k++){ const yy = baseY - (baseY-y2)*k/10; const xl = L(yy), xr = Rt(yy); g2.lineTo(xl+(xr-xl)*(0.5+fx)+Math.sin(yy*0.05+i)*w*0.02, yy); }
        g2.stroke();
      }
      // мох на светлой стороне
      if(opt.moss){
        g2.globalAlpha = 0.55; g2.fillStyle = opt.moss;
        for(let i=0;i<40;i++){ const yy = R(baseY-(baseY-topY)*0.55, baseY); const xr = lightSide>0 ? Rt(yy) : L(yy); g2.beginPath(); g2.ellipse(xr - lightSide*R(0,w*0.18), yy, w*R(0.04,0.1), w*R(0.08,0.2), 0, 0, 6.3); g2.fill(); }
      }
      g2.restore();
    }
  }
  // ----- облако листвы: много пятен разного тона, светлее со стороны света -----
  function foliage(c, x, y, r, cols, n, lightK){
    for(let i=0;i<n;i++){
      const a = rnd()*6.283, d = Math.sqrt(rnd())*r, px = x+Math.cos(a)*d, py = y+Math.sin(a)*d*0.7;
      const toL = Math.max(0, ((c.ls.x-px)*(-0.2) + (c.ls.y-py)*(-1)) < 0 ? 1 : 0.4);
      const col = cols[(rnd()*cols.length)|0], rr = r*R(0.12,0.3);
      g2.fillStyle = col; g2.beginPath(); g2.ellipse(px, py, rr, rr*R(0.6,0.9), R(0,3), 0, 6.3); g2.fill();
      if(lightK && rnd() < lightK*toL){ g2.fillStyle = 'rgba(220,255,170,'+R(0.15,0.35)+')'; g2.beginPath(); g2.ellipse(px+rr*0.2, py-rr*0.3, rr*0.55, rr*0.35, R(0,3), 0, 6.3); g2.fill(); }
    }
  }
  // ----- папоротник -----
  function fern(c, x, y, len, ang, col, liteCol){
    const segs = 14; let px = x, py = y, a = ang;
    g2.strokeStyle = col; g2.lineWidth = Math.max(1, len*0.02); g2.lineCap = 'round';
    const pts = [];
    for(let i=0;i<=segs;i++){ pts.push([px,py,a]); px += Math.cos(a)*len/segs; py += Math.sin(a)*len/segs; a += 0.06*(ang<-1.57 ? -1 : 1); }
    g2.beginPath(); pts.forEach((p,i)=> i ? g2.lineTo(p[0],p[1]) : g2.moveTo(p[0],p[1])); g2.stroke();
    for(let i=1;i<pts.length;i++){
      const [qx,qy,qa] = pts[i], l = len*0.22*(1-i/pts.length*0.8);
      for(const sd of [-1,1]){
        g2.fillStyle = (sd>0 && liteCol) ? liteCol : col;
        g2.beginPath(); g2.moveTo(qx,qy);
        const la = qa + sd*1.1;
        g2.quadraticCurveTo(qx+Math.cos(la-sd*0.3)*l*0.6, qy+Math.sin(la-sd*0.3)*l*0.6, qx+Math.cos(la)*l, qy+Math.sin(la)*l);
        g2.quadraticCurveTo(qx+Math.cos(la+sd*0.3)*l*0.5, qy+Math.sin(la+sd*0.3)*l*0.5, qx, qy); g2.fill();
      }
    }
  }
  // ----- крупный лист переднего плана -----
  function bigLeaf(x, y, len, ang, col, vein){
    g2.save(); g2.translate(x,y); g2.rotate(ang);
    g2.fillStyle = col; g2.beginPath(); g2.moveTo(0,0);
    g2.bezierCurveTo(len*0.3, -len*0.28, len*0.75, -len*0.22, len, 0); g2.bezierCurveTo(len*0.75, len*0.22, len*0.3, len*0.28, 0, 0); g2.fill();
    if(vein){ g2.strokeStyle = vein; g2.lineWidth = Math.max(1,len*0.012); g2.beginPath(); g2.moveTo(0,0); g2.lineTo(len*0.95,0); g2.stroke(); }
    g2.restore();
  }

  // ----- построение неподвижных слоёв -----
  let g2 = null;
  function makeLayer(depth, fn){
    const c = comp(), ox = Math.ceil(c.W*0.05), oy = Math.ceil(c.H*0.04);
    const L = document.createElement('canvas'); L.width = c.W+2*ox; L.height = c.H+2*oy;
    g2 = L.getContext('2d'); g2.translate(ox, oy); fn(c);
    return {cv:L, ox, oy, depth};
  }
  function pathEdges(c){
    // осевая линия тропы от низа экрана к точке схода, с лёгким изгибом
    const pts = [], n = 40, x0 = c.pathBot, y0 = c.H*1.08;
    for(let i=0;i<=n;i++){
      const k = i/n, e = k*k*(3-2*k);
      const x = x0 + (c.vp.x-x0)*e + Math.sin(k*Math.PI)*c.s*0.10*(c.land ? 1 : -0.6), y = y0 + (c.vp.y-y0)*k;
      const w = c.s*(c.land ? 0.62 : 0.5)*Math.pow(1-k, 1.6) + c.s*0.012;
      pts.push({x, y, w, k});
    }
    return pts;
  }
  function build(){
    seed = 7;
    st.layers = [];
    // 1. дальний план: светлая дымка, солнце в кронах, далёкие стволы
    st.layers.push(makeLayer(0.12, c=>{
      const gr = g2.createLinearGradient(0,-c.H*0.05,0,c.H*1.05);
      gr.addColorStop(0,'#f6fbe6'); gr.addColorStop(0.3,'#cfe8c6'); gr.addColorStop(0.58,'#8fbf9c'); gr.addColorStop(1,'#3b6a4c');
      g2.fillStyle = gr; g2.fillRect(-c.W*0.1,-c.H*0.1,c.W*1.2,c.H*1.2);
      const sun = g2.createRadialGradient(c.ls.x, c.ls.y+c.H*0.2, 0, c.ls.x, c.ls.y+c.H*0.2, Math.max(c.W,c.H)*0.75);
      sun.addColorStop(0,'rgba(255,252,225,1)'); sun.addColorStop(0.25,'rgba(255,246,205,.75)'); sun.addColorStop(1,'rgba(255,246,205,0)');
      g2.fillStyle = sun; g2.fillRect(-c.W*0.1,-c.H*0.1,c.W*1.2,c.H*1.2);
      // далёкие кроны — мягкие пятна
      for(let i=0;i<26;i++){ const x = R(-0.05,1.05)*c.W, y = R(-0.1,0.28)*c.H; const r = c.s*R(0.08,0.2);
        const a = 0.12 + 0.25*Math.min(1, Math.abs(x-c.ls.x)/(c.W*0.5));
        g2.fillStyle = 'rgba(110,160,120,'+a.toFixed(2)+')'; g2.beginPath(); g2.ellipse(x,y,r,r*0.7,0,0,6.3); g2.fill(); }
      // два ряда далёких стволов
      for(const [cnt, fogK, wk] of [[18,0.78,0.018],[13,0.6,0.03]]){
        for(let i=0;i<cnt;i++){ const x = R(-0.05,1.05)*c.W; if(Math.abs(x-c.vp.x) < c.s*0.05) continue;
          trunk(c, x, c.vp.y + c.H*R(0.0,0.06), c.s*wk*R(0.7,1.4), '#3f5a44', fogK, x<c.ls.x ? 1 : -1, {roots:false, bend:R(-0.1,0.1)}); }
      }
      // туман у горизонта
      const mist = g2.createLinearGradient(0, c.vp.y-c.H*0.18, 0, c.vp.y+c.H*0.12);
      mist.addColorStop(0,'rgba(225,240,215,0)'); mist.addColorStop(0.6,'rgba(225,240,215,.75)'); mist.addColorStop(1,'rgba(200,225,195,0)');
      g2.fillStyle = mist; g2.fillRect(-c.W*0.1, c.vp.y-c.H*0.18, c.W*1.2, c.H*0.3);
    }));
    // 2. средний план: земля, тропа, стволы средней дальности, кусты
    st.layers.push(makeLayer(0.35, c=>{
      const gy = c.vp.y - c.H*0.01;
      const gr = g2.createLinearGradient(0, gy, 0, c.H*1.05);
      gr.addColorStop(0,'#86b07a'); gr.addColorStop(0.25,'#55813f'); gr.addColorStop(0.7,'#2f5224'); gr.addColorStop(1,'#1b3215');
      g2.fillStyle = gr; g2.fillRect(-c.W*0.1, gy, c.W*1.2, c.H*1.2);
      // пятна света на траве
      for(let i=0;i<14;i++){ const x = R(0,1)*c.W, y = R(gy+c.H*0.03, c.H); const r = c.s*R(0.04,0.12)*(0.4+(y-gy)/c.H);
        g2.fillStyle = 'rgba(200,240,140,'+R(0.06,0.16).toFixed(2)+')'; g2.beginPath(); g2.ellipse(x,y,r*1.8,r*0.5,0,0,6.3); g2.fill(); }
      // стволы средней дальности (за тропой, не на ней)
      const mids = c.land ? [0.17,0.27,0.5,0.6,0.72,0.86,0.97] : [0.08,0.26,0.74,0.92];
      for(const fx of mids){ const x = (fx+R(-0.02,0.02))*c.W; if(Math.abs(x-c.vp.x) < c.s*0.07) continue;
        const base = gy + c.H*R(0.02,0.07);
        trunk(c, x, base, c.s*R(0.035,0.06), '#3d5638', 0.35, x<c.ls.x ? 1 : -1, {moss:'#7fae55', flare:1.2}); }
      // кусты у оснований
      for(let i=0;i<16;i++){ const x = R(-0.05,1.05)*c.W; if(Math.abs(x-c.vp.x) < c.s*0.12) continue;
        foliage(c, x, gy + c.H*R(0.03,0.09), c.s*R(0.04,0.08), ['#4b7a3a','#3d6a31','#5c8b44','#6f9c4f'], 14, 0.5); }
      // тропа
      const P = pathEdges(c);
      g2.beginPath(); P.forEach((p,i)=> i ? g2.lineTo(p.x-p.w/2, p.y) : g2.moveTo(p.x-p.w/2, p.y)); for(let i=P.length-1;i>=0;i--) g2.lineTo(P[i].x+P[i].w/2, P[i].y); g2.closePath();
      const pg = g2.createLinearGradient(0, c.vp.y, 0, c.H*1.05);
      pg.addColorStop(0,'#f3e2b6'); pg.addColorStop(0.35,'#d2ad73'); pg.addColorStop(0.8,'#9d7444'); pg.addColorStop(1,'#6e4f2c');
      g2.fillStyle = pg; g2.fill();
      g2.save(); g2.clip();
      // светлая полоса солнца поперёк тропы и камешки
      const sp = g2.createRadialGradient(c.hero.x+c.s*0.05, c.hero.y-c.H*0.05, 0, c.hero.x+c.s*0.05, c.hero.y-c.H*0.05, c.s*0.45);
      sp.addColorStop(0,'rgba(255,240,190,.55)'); sp.addColorStop(1,'rgba(255,240,190,0)'); g2.fillStyle = sp; g2.fillRect(0,0,c.W,c.H*1.1);
      for(let i=0;i<260;i++){ const p = P[(rnd()*(P.length-1))|0]; const x = p.x + R(-0.5,0.5)*p.w, y = p.y + R(-1,1)*c.H*0.012; const r = Math.max(0.6, c.s*0.006*(1-p.k)*R(0.4,1.4));
        g2.fillStyle = rnd()<0.5 ? 'rgba(90,60,30,.35)' : 'rgba(255,240,200,.35)'; g2.beginPath(); g2.ellipse(x,y,r*1.4,r*0.8,0,0,6.3); g2.fill(); }
      g2.restore();
      // трава заходит на края тропы
      for(const sd of [-1,1]) for(let i=0;i<P.length-2;i++){ const p = P[i]; const ex = p.x + sd*p.w/2;
        const n = Math.max(2, Math.round(12*(1-p.k)));
        for(let j=0;j<n;j++){ const bx = ex + R(-1,1)*p.w*0.05, by = p.y + R(-1,1)*c.H*0.01, bl = c.s*0.05*(1-p.k)*R(0.5,1.2)+1;
          g2.strokeStyle = rnd()<0.3 ? '#9ccb64' : (rnd()<0.5 ? '#4e8237' : '#3a6a2a'); g2.lineWidth = Math.max(1, c.s*0.004*(1-p.k));
          g2.beginPath(); g2.moveTo(bx,by); g2.quadraticCurveTo(bx - sd*bl*0.2, by-bl*0.6, bx - sd*bl*R(0.1,0.5), by-bl); g2.stroke(); } }
      // камни со мхом у тропы
      for(let i=0;i<6;i++){ const p = P[(R(0.1,0.7)*P.length)|0]; const sd = rnd()<0.5?-1:1; const x = p.x + sd*(p.w/2 + c.s*R(0.01,0.05)), y = p.y, r = c.s*0.035*(1-p.k)+2;
        g2.fillStyle = '#6c705f'; g2.beginPath(); g2.ellipse(x,y-r*0.3,r*1.3,r*0.8,0,0,6.3); g2.fill();
        g2.fillStyle = '#8a8e7a'; g2.beginPath(); g2.ellipse(x+r*0.2,y-r*0.55,r*0.8,r*0.4,0,0,6.3); g2.fill();
        g2.fillStyle = 'rgba(110,160,70,.8)'; g2.beginPath(); g2.ellipse(x-r*0.2,y-r*0.85,r*0.9,r*0.3,0,0,6.3); g2.fill(); }
    }));
    // 3. ближний план: огромный ствол слева, тёмная чаща справа (фон для названия), кроны сверху, лианы, папоротники
    st.layers.push(makeLayer(0.7, c=>{
      if(c.land){
        trunk(c, c.W*0.045, c.H*1.02, c.s*0.36, '#2b3b25', 0.05, 1, {moss:'#6f9f45', bend:0.18, flare:1.4});
        trunk(c, c.W*0.205, c.H*0.95, c.s*0.09, '#33462d', 0.15, 1, {moss:'#77a64c', bend:-0.2});
        // правая сторона: тёмные стволы и чаща — на ней хорошо читается золотое название
        trunk(c, c.W*0.66, c.H*0.98, c.s*0.13, '#24321f', 0.1, -1, {moss:'#5f8e3d', bend:0.12});
        trunk(c, c.W*0.99, c.H*1.05, c.s*0.32, '#1c2818', 0.02, -1, {moss:'#4f7c34', bend:-0.15});
        const dark = g2.createLinearGradient(c.W*0.48, 0, c.W*1.05, 0); dark.addColorStop(0,'rgba(8,24,12,0)'); dark.addColorStop(0.35,'rgba(8,24,12,.45)'); dark.addColorStop(1,'rgba(6,18,9,.7)');
        g2.fillStyle = dark; g2.fillRect(c.W*0.48, -c.H*0.1, c.W*0.62, c.H*1.2);
        for(let i=0;i<10;i++) foliage(c, R(0.5,1.05)*c.W, R(0.72,1.05)*c.H, c.s*R(0.08,0.16), ['#173219','#1f3f1e','#264b22','#2f5a29'], 22, 0.15);
      } else {
        trunk(c, -c.W*0.02, c.H*1.02, c.s*0.32, '#2b3b25', 0.05, 1, {moss:'#6f9f45', bend:0.1});
        trunk(c, c.W*1.02, c.H*1.02, c.s*0.3, '#1f2c1b', 0.03, -1, {moss:'#4f7c34', bend:-0.1});
        // верх затемнён под название
        const dark = g2.createLinearGradient(0, 0, 0, c.H*0.55); dark.addColorStop(0,'rgba(6,18,9,.55)'); dark.addColorStop(1,'rgba(6,18,9,0)');
        g2.fillStyle = dark; g2.fillRect(-c.W*0.1, -c.H*0.1, c.W*1.2, c.H*0.65);
      }
      // кроны по верхнему краю с просветом у солнца
      for(let i=0;i<34;i++){ const x = R(-0.08,1.08)*c.W; if(Math.abs(x-c.ls.x) < c.W*0.13 && rnd()<0.85) continue;
        foliage(c, x, R(-0.12,0.08)*c.H, c.s*R(0.1,0.2), ['#1b3a1c','#24481f','#2e5827','#3a6a2e','#4a7c36'], 26, 0.45); }
      // свисающие лианы
      g2.lineCap = 'round';
      for(let i=0;i<9;i++){ const x = R(0.02,0.98)*c.W; if(Math.abs(x-c.ls.x) < c.W*0.08) continue; const len = c.H*R(0.15,0.45), sw = R(-1,1)*c.s*0.04;
        g2.strokeStyle = '#2d4a24'; g2.lineWidth = Math.max(1.2, c.s*0.004); g2.beginPath(); g2.moveTo(x, -c.H*0.02); g2.quadraticCurveTo(x+sw, len*0.5, x+sw*0.4, len); g2.stroke();
        for(let k=0;k<len/(c.s*0.03);k++){ const t = k*c.s*0.03/len, lx = x + sw*2*t*(1-t) + sw*0.4*t*t, ly = len*t; bigLeaf(lx, ly, c.s*R(0.015,0.03), R(0.3,2.8), rnd()<0.5?'#3f6e2f':'#2f5a26'); } }
      // папоротники по нижним краям
      const ferns = c.land ? [[0.12,1.0],[0.24,1.02],[0.42,1.04],[0.56,1.0],[0.8,1.02],[0.93,0.98]] : [[0.05,1.0],[0.25,1.03],[0.7,1.03],[0.95,1.0]];
      for(const [fx,fy] of ferns){ const x = fx*c.W, y = fy*c.H;
        for(let k=0;k<6;k++) fern(c, x+R(-1,1)*c.s*0.03, y, c.s*R(0.16,0.26), -Math.PI/2 + R(-1.1,1.1), rnd()<0.5?'#2c5a25':'#22481d', 'rgba(120,180,70,.55)'); }
    }));
    // 4. передний план: тёмные размытые листья по углам и виньетка
    st.layers.push(makeLayer(1.25, c=>{
      g2.globalAlpha = 0.92;
      for(let i=0;i<9;i++) bigLeaf(R(-0.06,0.1)*c.W, R(0.85,1.08)*c.H, c.s*R(0.18,0.32), R(-1.4,-0.2), rnd()<0.5?'#0b1a0c':'#10240f', 'rgba(60,100,50,.35)');
      for(let i=0;i<9;i++) bigLeaf(R(0.9,1.06)*c.W, R(0.86,1.08)*c.H, c.s*R(0.18,0.32), R(-2.9,-1.7), rnd()<0.5?'#0b1a0c':'#10240f', 'rgba(60,100,50,.35)');
      for(let i=0;i<6;i++) bigLeaf(R(0.85,1.05)*c.W, R(-0.05,0.05)*c.H, c.s*R(0.14,0.24), R(1.8,2.9), '#0c1d0d', 'rgba(60,100,50,.3)');
      g2.globalAlpha = 1;
      const vg = g2.createRadialGradient(c.W*0.5, c.H*0.5, Math.min(c.W,c.H)*0.35, c.W*0.5, c.H*0.5, Math.hypot(c.W,c.H)*0.62);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,8,3,.6)');
      g2.fillStyle = vg; g2.fillRect(-c.W*0.1,-c.H*0.1,c.W*1.2,c.H*1.2);
    }));
    // частицы
    const c = comp();
    st.parts = {
      motes: Array.from({length:70}, ()=>({x:R(0,1), y:R(0,0.9), r:R(0.6,1.8), v:R(0.004,0.012), ph:R(0,6.3)})),
      flies: Array.from({length:c.land ? 28 : 20}, ()=>({x:R(0,1), y:R(0.35,0.98), r:R(0.8,1.6), ph:R(0,6.3), sp:R(0.3,0.8), bl:R(0.6,1.6)})),
      leaves: Array.from({length:7}, ()=>({x:R(0,1), y:R(-0.3,1), s:R(0.6,1.2), ph:R(0,6.3), v:R(0.02,0.045), col:rnd()<0.6?'#7aa63e':'#c9b04a'})),
    };
  }

  // ----- герой со спины на тропе -----
  function hero(c, t){
    const {x, y, h} = c.hero, u = h/100, br = Math.sin(t*1.6)*0.6;
    g.save(); g.translate(x, y);
    // тень
    const sh = g.createRadialGradient(0, 0, 0, 0, 0, 26*u); sh.addColorStop(0,'rgba(30,20,10,.55)'); sh.addColorStop(1,'rgba(30,20,10,0)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(-4*u, 1*u, 30*u, 7*u, 0, 0, 6.3); g.fill();
    const rim = 'rgba(255,240,190,.75)';
    // сапоги и ноги
    for(const sd of [-1,1]){
      g.fillStyle = '#3d3a48'; g.beginPath(); g.moveTo(sd*3*u, -46*u); g.lineTo(sd*13*u, -46*u); g.lineTo(sd*12*u, -16*u); g.lineTo(sd*4*u, -16*u); g.closePath(); g.fill();
      g.fillStyle = '#4a2c16'; g.beginPath(); g.roundRect ? g.roundRect(sd>0 ? 3*u : -13*u, -18*u, 10*u, 18*u, 2.5*u) : g.rect(sd>0 ? 3*u : -13*u, -18*u, 10*u, 18*u); g.fill();
      g.fillStyle = '#6b4424'; g.fillRect(sd>0 ? 3*u : -13*u, -18*u, 10*u, 3*u);
    }
    // плащ-накидка до колен (развевается)
    const fl = Math.sin(t*1.3)*2.5*u;
    g.fillStyle = '#5a2a22';
    g.beginPath(); g.moveTo(-14*u, -80*u+br*u); g.quadraticCurveTo(-20*u, -55*u, -19*u+fl, -32*u); g.lineTo(19*u+fl*1.2, -30*u); g.quadraticCurveTo(20*u, -55*u, 14*u, -80*u+br*u); g.closePath(); g.fill();
    const cg = g.createLinearGradient(-20*u, 0, 20*u, 0); cg.addColorStop(0,'rgba(0,0,0,.35)'); cg.addColorStop(0.6,'rgba(0,0,0,0)'); cg.addColorStop(1,'rgba(255,220,160,.18)');
    g.fillStyle = cg; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.2*u; for(const k of [-7,1,9]){ g.beginPath(); g.moveTo(k*u, -74*u); g.quadraticCurveTo((k+1)*u, -50*u, k*u+fl*0.8, -32*u); g.stroke(); }
    // рукава и кисти
    for(const sd of [-1,1]){
      g.fillStyle = '#3d6fc0'; g.beginPath(); g.moveTo(sd*13*u, -80*u+br*u); g.quadraticCurveTo(sd*22*u, -70*u, sd*21*u, -52*u); g.lineTo(sd*15*u, -52*u); g.quadraticCurveTo(sd*15*u, -66*u, sd*10*u, -74*u); g.closePath(); g.fill();
      g.fillStyle = '#e3ad85'; g.beginPath(); g.ellipse(sd*18.5*u, -49*u, 3.6*u, 4.2*u, 0, 0, 6.3); g.fill();
    }
    // меч в правой руке, остриём вниз
    g.save(); g.translate(19*u, -48*u); g.rotate(0.32);
    g.fillStyle = '#b8892e'; g.fillRect(-6*u, -1.5*u, 12*u, 3*u);
    g.fillStyle = '#5a3a1e'; g.fillRect(-1.6*u, -9*u, 3.2*u, 8*u);
    const bl = g.createLinearGradient(-2.4*u, 0, 2.4*u, 0); bl.addColorStop(0,'#8c99a8'); bl.addColorStop(0.5,'#f4f8ff'); bl.addColorStop(1,'#7d8a99');
    g.fillStyle = bl; g.beginPath(); g.moveTo(-2.4*u, 1.5*u); g.lineTo(2.4*u, 1.5*u); g.lineTo(2*u, 34*u); g.lineTo(0, 39*u); g.lineTo(-2*u, 34*u); g.closePath(); g.fill();
    const gl = (t*0.5)%3; if(gl<1){ g.fillStyle = 'rgba(255,255,255,'+(0.9*Math.sin(gl*Math.PI)).toFixed(2)+')'; g.beginPath(); g.arc(0, 4*u+gl*32*u, 2.2*u, 0, 6.3); g.fill(); }
    g.restore();
    // плечи / верх туники над плащом, ремень сумки
    g.fillStyle = '#3d6fc0'; g.beginPath(); g.moveTo(-14*u, -80*u+br*u); g.quadraticCurveTo(0, -86*u+br*u, 14*u, -80*u+br*u); g.lineTo(11*u, -72*u); g.lineTo(-11*u, -72*u); g.closePath(); g.fill();
    g.strokeStyle = '#6b4526'; g.lineWidth = 2.6*u; g.beginPath(); g.moveTo(-11*u, -80*u); g.lineTo(14*u, -40*u); g.stroke();
    g.fillStyle = '#6b4526'; g.beginPath(); g.roundRect ? g.roundRect(9*u, -44*u, 10*u, 9*u, 2*u) : g.rect(9*u, -44*u, 10*u, 9*u); g.fill();
    // шея и голова: волосы со спины
    g.fillStyle = '#e3ad85'; g.fillRect(-3.5*u, -88*u+br*u, 7*u, 6*u);
    g.fillStyle = '#e3ad85'; for(const sd of [-1,1]){ g.beginPath(); g.ellipse(sd*9.6*u, -95*u+br*u, 2.2*u, 3.4*u, 0, 0, 6.3); g.fill(); }
    const hs = Math.sin(t*1.1)*0.8*u, hy = -97*u+br*u;
    // шевелюра: пышный силуэт из прядей-клиньев, тёмные пряди и блик сбоку
    const hg = g.createLinearGradient(-11*u, hy-12*u, 11*u, hy+10*u); hg.addColorStop(0,'#3e2612'); hg.addColorStop(0.6,'#5b3a1e'); hg.addColorStop(1,'#7a5230');
    g.fillStyle = hg; g.beginPath();
    const tufts = [[-11,-1],[-11.5,-6],[-9,-11],[-5,-13.5],[0,-14.5],[5,-13.5],[9,-11],[11.5,-6],[11,-1],[10,6],[7,10],[3,11.5],[-3,11.5],[-7,10],[-10,6]];
    tufts.forEach(([tx,ty],i)=>{ const px = tx*u + (ty>4 ? hs : 0), py = hy + ty*u; if(!i) g.moveTo(px,py); else { const [ux,uy] = tufts[i-1]; const mx = (ux+tx)/2*1.12*u + (ty>4 ? hs : 0), my = hy + (uy+ty)/2*1.1*u; g.quadraticCurveTo(mx, my, px, py); } });
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,22,8,.55)'; g.lineWidth = 0.9*u; g.lineCap = 'round';
    for(const k of [-7,-3.5,0,3.5,7]){ g.beginPath(); g.moveTo(k*0.5*u, hy-12*u); g.quadraticCurveTo(k*1.05*u, hy-2*u, k*0.95*u+hs, hy+10*u); g.stroke(); }
    g.strokeStyle = 'rgba(170,120,70,.45)'; g.lineWidth = 1.1*u;
    for(const k of [4.5,7.5]){ g.beginPath(); g.moveTo(k*0.6*u, hy-11*u); g.quadraticCurveTo(k*1.1*u, hy-3*u, k*u+hs, hy+6*u); g.stroke(); }
    // контровой свет справа-сверху
    g.strokeStyle = rim; g.lineWidth = 1.4*u; g.lineCap = 'round';
    g.globalAlpha = 0.55; g.beginPath(); g.arc(0, -97*u+br*u, 11.5*u, -0.9, 0.35); g.stroke(); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(14*u, -80*u+br*u); g.quadraticCurveTo(22*u, -70*u, 21*u, -54*u); g.stroke();
    g.beginPath(); g.moveTo(15*u, -50*u); g.quadraticCurveTo(20*u, -40*u, 19*u+fl*1.2, -31*u); g.stroke();
    g.restore();
  }

  // ----- кадр -----
  function frame(now){
    if(st.gone) return;
    st.raf = requestAnimationFrame(frame);
    if(document.hidden) return;
    const t = (now - st.t0)/1000, c = comp(), W = c.W, H = c.H;
    // плавный параллакс: за курсором/пальцем и лёгкое «дыхание» камеры
    st.px += (st.tx + Math.sin(t*0.17)*0.25 - st.px)*0.04; st.py += (st.ty + Math.cos(t*0.13)*0.2 - st.py)*0.04;
    const lay = (L)=>{ g.drawImage(L.cv, -L.ox - st.px*L.ox*0.8*L.depth, -L.oy - st.py*L.oy*0.8*L.depth); };
    lay(st.layers[0]); lay(st.layers[1]);
    const ox = st.layers[1].ox*0.8*0.45*st.px, oy = st.layers[1].oy*0.8*0.45*st.py;
    // лучи света из просвета в кронах
    g.save(); g.globalCompositeOperation = 'lighter';
    const L0 = {x:c.ls.x - st.px*st.layers[0].ox*0.3, y:c.ls.y};
    for(let i=0;i<7;i++){
      const a = Math.PI/2 + (i-3)*0.17 + Math.sin(t*0.2+i)*0.02 + (c.land ? 0.12 : 0.05), len = H*1.35, wd = H*(0.05 + 0.03*Math.sin(i*2.1));
      const ex = L0.x + Math.cos(a)*len, ey = L0.y + Math.sin(a)*len, nx = -Math.sin(a), ny = Math.cos(a);
      const al = 0.07 + 0.05*Math.sin(t*0.5 + i*1.7);
      const gr = g.createLinearGradient(L0.x, L0.y, ex, ey); gr.addColorStop(0,'rgba(255,248,215,'+(al*1.6).toFixed(3)+')'); gr.addColorStop(0.55,'rgba(255,244,200,'+al.toFixed(3)+')'); gr.addColorStop(1,'rgba(255,244,200,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(L0.x + nx*wd*0.15, L0.y + ny*wd*0.15); g.lineTo(ex + nx*wd, ey + ny*wd); g.lineTo(ex - nx*wd, ey - ny*wd); g.lineTo(L0.x - nx*wd*0.15, L0.y - ny*wd*0.15); g.closePath(); g.fill();
    }
    // пылинки в лучах
    const P = st.parts, sc = st.dpr;
    for(const m of P.motes){
      m.y -= m.v*0.016; m.x += Math.sin(t*0.6+m.ph)*0.0004; if(m.y < -0.02){ m.y = 0.95; m.x = Math.random(); }
      const mx = m.x*W, my = m.y*H, d = Math.abs((mx-L0.x) - (my-L0.y)*0.12)/(W*0.35);
      const a = Math.max(0, 0.75 - d)*(0.5+0.5*Math.sin(t*2+m.ph));
      if(a < 0.03) continue;
      g.fillStyle = 'rgba(255,250,225,'+a.toFixed(2)+')'; g.beginPath(); g.arc(mx, my, m.r*sc, 0, 6.3); g.fill();
    }
    g.restore();
    // герой
    g.save(); g.translate(-ox, -oy); hero(c, t); g.restore();
    lay(st.layers[2]);
    // светлячки
    g.save(); g.globalCompositeOperation = 'lighter';
    for(const f of P.flies){
      const fx = (f.x + Math.sin(t*f.sp*0.4+f.ph)*0.04)*W - st.px*st.layers[2].ox*0.6, fy = (f.y + Math.sin(t*f.sp*0.55+f.ph*1.3)*0.035)*H - st.py*st.layers[2].oy*0.6;
      const b = Math.max(0, Math.sin(t*f.bl + f.ph)); if(b < 0.05) continue;
      const r = f.r*sc*7*(0.6+b*0.6);
      const gr = g.createRadialGradient(fx, fy, 0, fx, fy, r); gr.addColorStop(0,'rgba(240,255,170,'+(0.95*b).toFixed(2)+')'); gr.addColorStop(0.25,'rgba(190,255,110,'+(0.45*b).toFixed(2)+')'); gr.addColorStop(1,'rgba(120,255,80,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(fx, fy, r, 0, 6.3); g.fill();
    }
    g.restore();
    // падающие листья
    for(const l of P.leaves){
      l.y += l.v*0.016; l.x += Math.sin(t*1.2+l.ph)*0.0012; if(l.y > 1.08){ l.y = -0.06; l.x = Math.random(); }
      g.save(); g.translate(l.x*W, l.y*H); g.rotate(Math.sin(t*1.8+l.ph)*1.2); g.scale(1, 0.5+0.5*Math.abs(Math.sin(t*2.2+l.ph)));
      g.fillStyle = l.col; g.beginPath(); g.ellipse(0, 0, 6*sc*l.s, 3*sc*l.s, 0, 0, 6.3); g.fill(); g.restore();
    }
    lay(st.layers[3]);
    // появление из темноты
    const fin = Math.min(1, t/1.6);
    if(fin < 1){ g.fillStyle = 'rgba(2,6,3,'+(1-fin*fin*(3-2*fin)).toFixed(3)+')'; g.fillRect(0,0,W,H); }
  }

  function resize(){
    if(st.gone) return;
    const r = root.getBoundingClientRect();
    const lowQ = (typeof quality!=='undefined' && quality==='low');
    st.dpr = Math.min(lowQ ? 1 : 2, window.devicePixelRatio || 1);
    const W = Math.max(2, Math.round(r.width*st.dpr)), H = Math.max(2, Math.round(r.height*st.dpr));
    if(W===st.W && H===st.H && st.layers.length) return;
    st.W = cv.width = W; st.H = cv.height = H;
    build();
  }
  let rzT = 0;
  window.addEventListener('resize', ()=>{ clearTimeout(rzT); rzT = setTimeout(resize, 120); });
  root.addEventListener('pointermove', e=>{ const r = root.getBoundingClientRect(); st.tx = ((e.clientX-r.left)/r.width - 0.5)*2; st.ty = ((e.clientY-r.top)/r.height - 0.5)*2; });

  // ----- кнопка «Играть» -----
  function chime(){
    try{ SFX.unlock(); if(!SFX.ctx || SFX.muted) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f,i)=>SFX.tone(f, 1.4, {type:'triangle', vol:0.07, delay:i*0.09, attack:0.02}));
      SFX.tone(1567.98, 1.8, {type:'sine', vol:0.035, delay:0.36, attack:0.05});
    }catch(e){}
  }
  function play(){
    if(st.gone || root.classList.contains('leaving')) return;
    chime();
    root.classList.add('leaving');
    setTimeout(()=>{ st.gone = true; st.active = false; cancelAnimationFrame(st.raf); root.classList.add('hidden'); cv.width = cv.height = 1; st.layers = []; }, 900);
  }
  st.play = play;
  document.getElementById('splashPlay').addEventListener('click', e=>{ e.stopPropagation(); play(); });
  // касание во время вступления — сразу показать всё
  root.addEventListener('pointerdown', e=>{ if(e.target.closest && e.target.closest('#splashPlay')) return; root.classList.add('skip'); if(performance.now()-st.t0 < 1600) st.t0 = performance.now()-1600; });
  // клавиатура: Enter / пробел — «Играть»; пока заставка открыта, клавиши не уходят в игру
  window.addEventListener('keydown', e=>{
    if(!st.active || st.gone) return;
    if(e.code==='Enter' || e.code==='Space' || e.code==='NumpadEnter'){ e.preventDefault(); play(); }
    e.stopImmediatePropagation();
  }, true);
  resize();
  st.raf = requestAnimationFrame(frame);
  return st;
})();
