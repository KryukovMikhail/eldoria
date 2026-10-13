// ---------- Страшные слизни и привидения ----------
const OOZE_TOXIC = {body:'#3c9a3a', dark:'#1c5a24', edge:'#0f3414', eye:'#ff2a1a', drip:'#8be84a', skull:'rgba(228,236,205,0.62)'};
const OOZE_LAVA  = {body:'#e0561a', dark:'#8a1f0a', edge:'#3a0a04', eye:'#ffe45a', drip:'#ffb02a', skull:'rgba(255,214,160,0.55)'};
function drawOoze(e,K,flash,now,t,P){
  const sq = Math.sin(now*3.4 + e.x*0.05 + t)*0.09;
  shadowAt(0,9,11,3.2);
  ctx.translate(0,9); ctx.scale(1+sq,1-sq);
  if(!flash){                                                     // капающая кислота
    ctx.fillStyle = P.drip;
    for(const dx of [-7.5,5.5]){ const L = 2.5+(Math.sin(now*2.2+dx+e.x*0.1)+1)*2.4; rrect(dx-1,0,2,L+1,1); ctx.fill(); circ(dx,L+1.6,1.7); ctx.fill(); }
  }
  ctx.fillStyle = K(P.body); ctx.strokeStyle = K(P.edge); ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-11.5,0.5);
  ctx.bezierCurveTo(-13.5,-11,-8,-19,-3,-18); ctx.lineTo(-1.4,-21.5); ctx.lineTo(0.8,-18.4);
  ctx.bezierCurveTo(6,-19.5,13.5,-11,11.5,0.5);
  for(let i=0;i<=5;i++) ctx.lineTo(11.5-i*4.6, i%2 ? 1.2 : 2.9);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if(!flash){
    ctx.fillStyle = P.dark; ctx.globalAlpha = 0.5; ell(0,-3,9.5,6.4); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = P.skull; circ(5.8,-4.6,3.4); ctx.fill(); rrect(4.3,-2.2,3,2.4,0.8); ctx.fill();         // череп жертвы внутри
    ctx.fillStyle = 'rgba(10,20,10,0.75)'; circ(4.8,-5.1,0.95); ctx.fill(); circ(7,-5.1,0.95); ctx.fill();
    ctx.fillStyle = 'rgba(210,255,170,0.5)'; ell(-6.5,-13,2.6,1.4,-0.5); ctx.fill();
    const bp = (now*0.8+e.x*0.01)%1; ctx.fillStyle = 'rgba(200,255,160,0.45)'; circ(-5,-1-bp*7,1.1); ctx.fill(); circ(-2.5,-3-((bp+0.5)%1)*6,0.8); ctx.fill();
  }
  const lx = (e.lookX||0)*0.9, ly = (e.lookY||0)*0.7;
  ctx.fillStyle = flash ? '#fff' : P.eye;                           // злые косые глаза
  ctx.beginPath(); ctx.moveTo(-9.2,-12.8); ctx.lineTo(-1.5,-9.2); ctx.lineTo(-6.2,-6.4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(9.2,-12.8); ctx.lineTo(1.5,-9.2); ctx.lineTo(6.2,-6.4); ctx.closePath(); ctx.fill();
  if(!flash){ ctx.fillStyle = '#180606'; ell(-4.7+lx,-9.2+ly,0.75,2.1,0.55); ctx.fill(); ell(4.7+lx,-9.2+ly,0.75,2.1,-0.55); ctx.fill(); }
  ctx.fillStyle = flash ? '#fff' : '#12060a';                        // пасть с клыками
  ctx.beginPath(); ctx.moveTo(-6.8,-3.6); ctx.lineTo(6.8,-3.6); ctx.lineTo(5,0.2); ctx.lineTo(-5,0.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f0dc';
  for(const fx of [-5.8,-2.6,0.6,3.8]){ ctx.beginPath(); ctx.moveTo(fx,-3.6); ctx.lineTo(fx+2,-3.6); ctx.lineTo(fx+1,-0.4+((fx*7)%2)); ctx.closePath(); ctx.fill(); }
  for(const fx of [-3.6,1.6]){ ctx.beginPath(); ctx.moveTo(fx,0.2); ctx.lineTo(fx+1.8,0.2); ctx.lineTo(fx+0.9,-1.9); ctx.closePath(); ctx.fill(); }
}

const GHOST_DARK = {body:'rgba(54,30,92,0.95)', mid:'rgba(88,52,142,0.92)', edge:'rgba(16,6,30,0.85)', face:'#ddd7e8', glow:'rgba(150,70,255,0.38)', eye:'#ff3030'};
const GHOST_GRAVE = {body:'rgba(30,70,56,0.95)', mid:'rgba(70,130,106,0.92)', edge:'rgba(6,24,18,0.85)', face:'#e6f4ea', glow:'rgba(120,255,170,0.4)', eye:'#8dffb0'};
const GHOST_ICE  = {body:'rgba(66,124,172,0.95)', mid:'rgba(128,190,232,0.92)', edge:'rgba(14,38,68,0.85)', face:'#eef8ff', glow:'rgba(110,210,255,0.42)', eye:'#37dcff'};
function drawGhost(e,K,flash,now,P){
  const tt = now*2.4 + e.x*0.05;
  ctx.translate(0,Math.sin(tt)*1.8);
  if(!flash){ const gr = ctx.createRadialGradient(0,-2,2,0,-2,22); gr.addColorStop(0,P.glow); gr.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = gr; circ(0,-2,22); ctx.fill(); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for(const s of [-1,1]){                                          // рваные рукава с когтями
    const w = Math.sin(tt*1.3+s)*2.5;
    ctx.fillStyle = K(P.mid); ctx.strokeStyle = P.edge; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(s*7,-8); ctx.quadraticCurveTo(s*17,-9+w,s*19,2+w);
    ctx.lineTo(s*16,1+w); ctx.lineTo(s*17,6+w); ctx.lineTo(s*13,2+w*0.6); ctx.lineTo(s*13,8+w*0.5); ctx.quadraticCurveTo(s*9,2,s*8,3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K('#ebe6f4'); ctx.lineWidth = 1.3;
    for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(s*19,2+w+k*1.5); ctx.lineTo(s*(23.5-Math.abs(k)),3.5+w+k*3.4); ctx.stroke(); }
  }
  ctx.fillStyle = K(P.body); ctx.strokeStyle = P.edge; ctx.lineWidth = 1.2;     // саван с рваным подолом
  ctx.beginPath(); ctx.moveTo(-9.5,6);
  ctx.bezierCurveTo(-11.5,-6,-8.5,-17,0,-17.5); ctx.bezierCurveTo(8.5,-17,11.5,-6,9.5,6);
  for(let i=0;i<=6;i++) ctx.lineTo(9.5-i*19/6, (i%2 ? 10 : 4.5) + Math.sin(tt*3+i)*1.8);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
  for(const x of [-4.5,0,4.5]){ ctx.beginPath(); ctx.moveTo(x,-1); ctx.lineTo(x*1.35,7+Math.sin(tt*3+x)*1); ctx.stroke(); }
  ctx.fillStyle = flash ? '#fff' : '#0a0510'; ell(0,-10,6.8,7.6); ctx.fill();   // тёмный капюшон
  ctx.fillStyle = K(P.face); ell(0,-9.4,5.1,6.1); ctx.fill();                  // череп
  ctx.fillStyle = '#07030d'; ell(-2.5,-10.4,2.1,3,0.2); ctx.fill(); ell(2.5,-10.4,2.1,3,-0.2); ctx.fill();
  if(!flash){
    ctx.globalAlpha = 0.35; ctx.fillStyle = P.eye; circ(-2.5,-9.9,2.6); ctx.fill(); circ(2.5,-9.9,2.6); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = P.eye; circ(-2.5,-9.9,1); ctx.fill(); circ(2.5,-9.9,1); ctx.fill();
  }
  ctx.fillStyle = '#07030d'; ctx.beginPath(); ctx.moveTo(0,-7.8); ctx.lineTo(-0.9,-6.2); ctx.lineTo(0.9,-6.2); ctx.fill();
  const open = 1.2*Math.abs(Math.sin(tt*2));
  ctx.beginPath(); ctx.moveTo(-3.5,-5.2);
  for(let i=0;i<=6;i++) ctx.lineTo(-3.5+i*7/6, -5 + (i%2 ? 2.6+open : 0.4));
  ctx.lineTo(3.5,-5.2); ctx.closePath(); ctx.fill();
}

function flameAt(x,y,w,h,ph,c1,c2){
  const sw2 = Math.sin(ph)*w*0.35;
  ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(x-w/2,y); ctx.quadraticCurveTo(x-w*0.6,y-h*0.5,x+sw2,y-h); ctx.quadraticCurveTo(x+w*0.6,y-h*0.5,x+w/2,y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x-w*0.26,y); ctx.quadraticCurveTo(x-w*0.3,y-h*0.35,x+sw2*0.7,y-h*0.62); ctx.quadraticCurveTo(x+w*0.3,y-h*0.35,x+w*0.26,y); ctx.closePath(); ctx.fill();
}

// ---------- Остальные новые враги ----------
function drawEnemyExtra(e,K,flash,now,t,sw,face){
  const OUT = 'rgba(0,0,0,0.5)';
  ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  switch(e.type){
  case 'bat': {
    const fl = Math.sin(now*16+e.x*0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(0,15,6.5,2); ctx.fill();
    ctx.translate(0,Math.sin(now*5+e.x)*1.6-2);
    for(const s of [-1,1]){
      ctx.fillStyle = K('#3a2548'); ctx.strokeStyle = OUT;
      ctx.beginPath(); ctx.moveTo(s*3,-3); ctx.quadraticCurveTo(s*9,-14-fl*6,s*19,-8-fl*8);
      ctx.quadraticCurveTo(s*16,-4-fl*4,s*17,-fl*3); ctx.quadraticCurveTo(s*13,-2-fl*2,s*12,2-fl*2);
      ctx.quadraticCurveTo(s*9,-1,s*7,3); ctx.quadraticCurveTo(s*5,0,s*3,2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(20,8,30,0.7)'; ctx.beginPath(); ctx.moveTo(s*3,-3); ctx.lineTo(s*16,-6-fl*7); ctx.moveTo(s*3,-3); ctx.lineTo(s*12,1-fl*2); ctx.stroke();
    }
    ctx.strokeStyle = OUT; ctx.fillStyle = K('#4a3358'); ell(0,0,4.4,5.8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4,-4); ctx.lineTo(-5.4,-10.5); ctx.lineTo(-1,-5.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(4,-4); ctx.lineTo(5.4,-10.5); ctx.lineTo(1,-5.6); ctx.fill();
    if(!flash){ ctx.fillStyle = '#ff3a3a'; circ(-1.9,-2.2,1.2); ctx.fill(); circ(1.9,-2.2,1.2); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-2.4,2); ctx.lineTo(-1.2,2); ctx.lineTo(-1.8,4.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(2.4,2); ctx.lineTo(1.2,2); ctx.lineTo(1.8,4.4); ctx.fill();
    break; }
  case 'spider': {
    shadowAt(0,10,10.5,3);
    ctx.strokeStyle = K('#2a1a2e'); ctx.lineWidth = 1.9;
    for(const s of [-1,1]) for(let i=0;i<4;i++){
      const ph = Math.sin(t*1.3+i*1.7+(s>0?0:3))*2, ex = (i===1||i===2) ? 2 : 0;
      ctx.beginPath(); ctx.moveTo(s*3,-1+i*1.2); ctx.lineTo(s*(9+ex),-7+i*3.4+ph*0.5); ctx.lineTo(s*(13+ex),4+i*1.5+ph); ctx.stroke();
    }
    ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    ctx.fillStyle = K('#2e1b3a'); ell(0,3,7.4,8.2); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#d02a2e'; ctx.beginPath(); ctx.moveTo(-2.4,-0.5); ctx.lineTo(2.4,-0.5); ctx.lineTo(0.5,3.5); ctx.lineTo(2.4,7.5); ctx.lineTo(-2.4,7.5); ctx.lineTo(-0.5,3.5); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = K('#3d2650'); ell(0,-6,4.8,4.2); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#ff3a3a'; for(const [x,y,r] of [[-2.4,-7.4,1.1],[2.4,-7.4,1.1],[-1,-5.6,0.8],[1,-5.6,0.8]]){ circ(x,y,r); ctx.fill(); } }
    ctx.strokeStyle = K('#cfc7d8'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-1.6,-3); ctx.lineTo(-2.2,-0.4); ctx.moveTo(1.6,-3); ctx.lineTo(2.2,-0.4); ctx.stroke();
    break; }
  case 'webspider': {
    const pulse = e.shotCd!==undefined && e.shotCd<500 ? 1 : 0;
    shadowAt(0,11,12,3.6);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for(const s of [-1,1]) for(let i=0;i<4;i++){
      const ph = Math.sin(t*1.3+i*1.7+(s>0?0:3))*2.2, ex = (i===1||i===2) ? 3 : 0;
      ctx.strokeStyle = K('#222c38'); ctx.lineWidth = 2.3;
      ctx.beginPath(); ctx.moveTo(s*3.5,-1+i*1.4); ctx.lineTo(s*(10+ex),-9+i*3.6+ph*0.5); ctx.lineTo(s*(15+ex),4+i*1.6+ph); ctx.stroke();
      ctx.strokeStyle = K('#c8d4e4'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s*(10+ex),-9+i*3.6+ph*0.5); ctx.lineTo(s*(12.5+ex),-3+i*2.6+ph*0.7); ctx.stroke();   // светлая полоска на ноге
    }
    ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    const sag = Math.sin(now*3+e.x)*1.2;
    ctx.strokeStyle = 'rgba(235,240,250,0.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0,12); ctx.quadraticCurveTo(sag,17,sag*0.6,22); ctx.stroke();   // нить паутины
    ctx.strokeStyle = OUT;
    ctx.fillStyle = K('#34465a'); ell(0,4,9.2,10); ctx.fill(); ctx.stroke();
    if(!flash){
      ctx.strokeStyle = 'rgba(225,238,255,0.8)'; ctx.lineWidth = 0.9;                       // узор-паутинка на брюшке
      for(let r=3;r<=8;r+=2.5){ ctx.beginPath(); ctx.ellipse(0,4,r*0.95,r*1.05,0,0,6.283); ctx.stroke(); }
      for(let a=0;a<6;a++){ ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(Math.cos(a*1.047)*8.6,4+Math.sin(a*1.047)*9.4); ctx.stroke(); }
      if(pulse){ ctx.fillStyle = 'rgba(210,230,255,0.45)'; ell(0,5,10.6,11.4); ctx.fill(); }
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.fillStyle = K('#47596e'); ell(0,-7,5.8,5.2); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#c8ff4a'; for(const [x,y,r] of [[-2.8,-8.4,1.25],[2.8,-8.4,1.25],[-1.2,-6.6,0.9],[1.2,-6.6,0.9],[-4.2,-6.8,0.7],[4.2,-6.8,0.7]]){ circ(x,y,r); ctx.fill(); } }
    ctx.strokeStyle = K('#e4ecf6'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-1.8,-3.4); ctx.lineTo(-2.4,0); ctx.moveTo(1.8,-3.4); ctx.lineTo(2.4,0); ctx.stroke();
    break; }
  case 'goblin': {
    shadowAt(0,11,8.5,3);
    ctx.fillStyle = K('#5a6b2a'); rrect(-4.8,4,3.6,7+sw*0.5,1.2); ctx.fill(); ctx.stroke(); rrect(1.2,4,3.6,7-sw*0.5,1.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#4a3a22'); ctx.fillRect(-6,9.5+sw*0.5,5.4,2); ctx.fillRect(0.6,9.5-sw*0.5,5.4,2);
    ctx.fillStyle = K('#6b4a2a'); rrect(-6.4,-3.2,12.8,9.4,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#8a6238'); ctx.fillRect(-6.4,3.4,12.8,1.8);
    ctx.strokeStyle = K('#7fae3a'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-6,-1.5); ctx.lineTo(-10,3+sw*0.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6,-1.5); ctx.lineTo(10.5,0-sw*0.4); ctx.stroke();
    ctx.save(); ctx.translate(11.5,-1-sw*0.4); ctx.rotate(-0.35);                               // дубина
    ctx.fillStyle = K('#6b4a2a'); ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-1.4,6); ctx.lineTo(-2.6,-8); ctx.lineTo(2.6,-8); ctx.lineTo(1.4,6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#b8b0a0'); for(const [x,y] of [[-2.8,-6],[2.8,-4.6],[-2.6,-2],[2.4,0]]){ ctx.beginPath(); ctx.moveTo(x,y-1.3); ctx.lineTo(x+Math.sign(x)*2.2,y); ctx.lineTo(x,y+1.3); ctx.fill(); }
    ctx.restore();
    ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    ctx.fillStyle = K('#7fae3a'); ctx.beginPath(); ctx.moveTo(-5,-10.5); ctx.lineTo(-13.5,-15); ctx.lineTo(-5.4,-6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(5,-10.5); ctx.lineTo(13.5,-15); ctx.lineTo(5.4,-6); ctx.fill(); ctx.stroke();
    circ(0,-9.5,6.2); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#ffd34a'; ell(-2.6,-10.6,1.5,1.2,0.3); ctx.fill(); ell(2.6,-10.6,1.5,1.2,-0.3); ctx.fill(); ctx.fillStyle = '#1a0a05'; circ(-2.6,-10.6,0.55); ctx.fill(); circ(2.6,-10.6,0.55); ctx.fill();
      ctx.strokeStyle = '#2a3a10'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-4.6,-13); ctx.lineTo(-1.2,-11.8); ctx.moveTo(4.6,-13); ctx.lineTo(1.2,-11.8); ctx.stroke(); }
    ctx.fillStyle = K('#5f8a2c'); ell(0,-8.2,1.4,1.7); ctx.fill();
    ctx.fillStyle = '#2a0f0a'; ctx.beginPath(); ctx.moveTo(-3.6,-6); ctx.quadraticCurveTo(0,-3.4,3.6,-6); ctx.quadraticCurveTo(0,-5,-3.6,-6); ctx.fill();
    ctx.fillStyle = '#f4f0dc'; ctx.beginPath(); ctx.moveTo(-3,-5.6); ctx.lineTo(-2.2,-8); ctx.lineTo(-1.4,-5.2); ctx.fill(); ctx.beginPath(); ctx.moveTo(3,-5.6); ctx.lineTo(2.2,-8); ctx.lineTo(1.4,-5.2); ctx.fill();
    break; }
  case 'zombie': {
    ctx.translate(Math.sin(t*0.8)*0.9,0);
    shadowAt(0,11,8.5,3);
    ctx.fillStyle = K('#4a5a7a'); rrect(-5.2,3,4.4,8+sw*0.5,1); ctx.fill(); ctx.stroke(); rrect(0.8,3,4.4,8-sw*0.5,1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#3a3a2a'); ctx.fillRect(-6,10.2+sw*0.5,5.6,1.8); ctx.fillRect(0.4,10.2-sw*0.5,5.6,1.8);
    ctx.fillStyle = K('#5a6b4a'); rrect(-6.8,-6,13.6,10,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#c9c6a0'); ctx.fillRect(-3.4,-4.6,6.8,5);                                   // рваная рубаха, видны рёбра
    ctx.strokeStyle = '#6b6a50'; ctx.lineWidth = 0.9; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-3.4,-3.6+i*1.7); ctx.lineTo(3.4,-3.6+i*1.7); ctx.stroke(); }
    ctx.strokeStyle = K('#7f9a6a'); ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-6.4,-4); ctx.lineTo(-12.5,-11+sw*0.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6.4,-4); ctx.lineTo(12.5,-11-sw*0.3); ctx.stroke();
    ctx.fillStyle = K('#7f9a6a'); circ(-12.8,-11.5+sw*0.3,2.3); ctx.fill(); circ(12.8,-11.5-sw*0.3,2.3); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    ctx.fillStyle = K('#86a374'); circ(0,-11.5,6.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#2a2a1a'); ctx.beginPath(); ctx.moveTo(-5.6,-14); ctx.lineTo(-3,-18); ctx.lineTo(-1,-14.4); ctx.lineTo(1.2,-18.4); ctx.lineTo(3.4,-14.4); ctx.lineTo(5.8,-17); ctx.lineTo(5.4,-12); ctx.lineTo(-5.4,-12); ctx.fill();
    ctx.fillStyle = '#0d0a06'; circ(-2.6,-11.6,1.9); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#e8e4b0'; circ(2.6,-11.6,1.7); ctx.fill();
    if(!flash){ ctx.fillStyle = '#b01818'; circ(2.7,-11.4,0.7); ctx.fill(); ctx.strokeStyle = '#4a1a1a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-1,-15.2); ctx.lineTo(1.6,-13.4); ctx.stroke(); }
    ctx.fillStyle = '#1a0a08'; ctx.beginPath(); ctx.moveTo(-3.4,-8); ctx.quadraticCurveTo(0,-5.4,3.4,-8); ctx.quadraticCurveTo(0,-7.2,-3.4,-8); ctx.fill();
    ctx.fillStyle = '#c0b890'; for(const x of [-2.2,0,2.2]) ctx.fillRect(x-0.5,-7.6,1,1.4);
    if(!flash){ ctx.fillStyle = '#a01c1c'; rrect(-6.6,-3.5,2,2.6,1); ctx.fill(); }
    break; }
  case 'darkknight': {
    shadowAt(0,11.5,9.5,3);
    ctx.fillStyle = K('#262833'); rrect(-5.4,4,4.6,8+sw*0.5,1.5); ctx.fill(); ctx.stroke(); rrect(0.8,4,4.6,8-sw*0.5,1.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#3a3d4d'); ctx.fillRect(-6,10.6+sw*0.5,5.6,2); ctx.fillRect(0.4,10.6-sw*0.5,5.6,2);
    ctx.fillStyle = K('#2f323f'); rrect(-8,-7,16,13,3.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K('#5a5f78'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-6,-4); ctx.lineTo(6,-4); ctx.moveTo(0,-7); ctx.lineTo(0,6); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#c0262e'; ctx.beginPath(); ctx.moveTo(0,-2.4); ctx.lineTo(2.4,0.4); ctx.lineTo(0,3.4); ctx.lineTo(-2.4,0.4); ctx.closePath(); ctx.fill(); }
    ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.fillStyle = K('#3a3d4d');
    circ(-9.4,-5,4.6); ctx.fill(); ctx.stroke(); circ(9.4,-5,4.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#5a5f78'); ctx.beginPath(); ctx.moveTo(-12,-8); ctx.lineTo(-13,-13); ctx.lineTo(-9,-8.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(12,-8); ctx.lineTo(13,-13); ctx.lineTo(9,-8.6); ctx.fill();
    ctx.save(); ctx.translate(-12.5,3);                                                                // щит
    ctx.fillStyle = K('#262833'); ctx.strokeStyle = K('#5a5f78'); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-5,-8); ctx.lineTo(5,-8); ctx.lineTo(5,3); ctx.lineTo(0,10); ctx.lineTo(-5,3); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#a01e26'; ctx.fillRect(-1,-6,2,12); ctx.fillRect(-3.4,-3,6.8,2); }
    ctx.restore();
    const wy = -sw*0.4; ctx.fillStyle = K('#aab0c0'); ctx.fillRect(11.6,-21+wy,3,22); ctx.fillStyle = K('#6a6e80'); ctx.fillRect(9.4,1+wy,7.4,2.4); ctx.fillStyle = K('#3a2a1e'); ctx.fillRect(12,3.4+wy,2.2,4);
    ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.fillStyle = K('#2f323f'); rrect(-5.8,-18,11.6,12,4.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#cfc9b8'); ctx.beginPath(); ctx.moveTo(-5,-16); ctx.quadraticCurveTo(-11,-18,-10.5,-25); ctx.quadraticCurveTo(-8,-20,-3.6,-18.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(5,-16); ctx.quadraticCurveTo(11,-18,10.5,-25); ctx.quadraticCurveTo(8,-20,3.6,-18.6); ctx.fill();
    ctx.fillStyle = '#07070b'; ctx.fillRect(-4.2,-13.4,8.4,2.8);
    if(!flash){ ctx.fillStyle = '#ff3030'; ctx.fillRect(-3.6,-12.8,7.2,1.6); }
    break; }
  case 'imp': {
    const fl = Math.sin(now*10+e.x), bob = Math.sin(now*4+e.x)*1.6;
    shadowAt(0,12,7,2.4);
    ctx.translate(0,bob-1);
    ctx.strokeStyle = K('#8a1f1a'); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(2,6); ctx.quadraticCurveTo(10,8,10,1); ctx.stroke();
    ctx.fillStyle = K('#8a1f1a'); ctx.beginPath(); ctx.moveTo(10,1); ctx.lineTo(7.8,-1.4); ctx.lineTo(12.2,-1.2); ctx.fill();
    for(const s of [-1,1]){
      ctx.fillStyle = K('#7a1a2a'); ctx.strokeStyle = OUT; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(s*3,-4); ctx.lineTo(s*14,-13-fl*3); ctx.lineTo(s*12,-6-fl*2); ctx.lineTo(s*16,-3-fl*2); ctx.lineTo(s*9,0); ctx.lineTo(s*4,2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = K('#c7352a'); rrect(-3.6,6,2.8,5,1); ctx.fill(); rrect(0.8,6,2.8,5,1); ctx.fill();
    ell(0,1,5.6,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#e0644a'); ell(0,3,3,4); ctx.fill();
    ctx.strokeStyle = K('#c7352a'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-4.4,-2); ctx.lineTo(-6.5,-8); ctx.moveTo(4.4,-2); ctx.lineTo(6.5,-8); ctx.stroke();
    if(!flash){ flameAt(0,-8.5,6,8+fl*1.2,now*9+e.x,'#ff7a1a','#ffe04a'); }
    ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.fillStyle = K('#d9442f'); circ(0,-6.6,5.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#2a1010'); ctx.beginPath(); ctx.moveTo(-4,-9.6); ctx.lineTo(-6.4,-15); ctx.lineTo(-1.6,-10.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(4,-9.6); ctx.lineTo(6.4,-15); ctx.lineTo(1.6,-10.6); ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#ffe04a'; ctx.beginPath(); ctx.moveTo(-4.2,-8.4); ctx.lineTo(-0.8,-7); ctx.lineTo(-3.8,-5.8); ctx.fill(); ctx.beginPath(); ctx.moveTo(4.2,-8.4); ctx.lineTo(0.8,-7); ctx.lineTo(3.8,-5.8); ctx.fill();
    ctx.fillStyle = '#2a0808'; ctx.beginPath(); ctx.moveTo(-3,-4.2); ctx.quadraticCurveTo(0,-1.8,3,-4.2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-2.2,-4); ctx.lineTo(-1.2,-4); ctx.lineTo(-1.7,-2.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(2.2,-4); ctx.lineTo(1.2,-4); ctx.lineTo(1.7,-2.6); ctx.fill();
    break; }
  case 'golem': {
    shadowAt(0,15,14,4);
    const hot = 0.6+0.4*Math.sin(now*2.2+e.x*0.05);
    ctx.fillStyle = K('#4a4550'); rrect(-10,5,8.6,11+sw*0.4,2.5); ctx.fill(); ctx.stroke(); rrect(1.4,5,8.6,11-sw*0.4,2.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#5c5560'); rrect(-13,-9,26,16,4.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#6b646f'); circ(-14,-6,6.6); ctx.fill(); ctx.stroke(); circ(14,-6,6.6); ctx.fill(); ctx.stroke();
    rrect(-19.5,-2,6,15+sw*0.4,3); ctx.fill(); ctx.stroke(); rrect(13.5,-2,6,15-sw*0.4,3); ctx.fill(); ctx.stroke();
    circ(-16.5,13+sw*0.4,4.6); ctx.fill(); ctx.stroke(); circ(16.5,13-sw*0.4,4.6); ctx.fill(); ctx.stroke();
    rrect(-6.4,-18,12.8,10.5,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ell(-6,-5,5,2.6,-0.3); ctx.fill(); ell(-5,-15.5,3.4,1.5,-0.2); ctx.fill();
    if(!flash){
      ctx.strokeStyle = 'rgba(255,'+((120+hot*70)|0)+',20,'+(0.7+0.3*hot)+')'; ctx.lineWidth = 1.7; ctx.lineJoin = 'miter';
      ctx.beginPath(); ctx.moveTo(-10,-7); ctx.lineTo(-6,-2); ctx.lineTo(-9,3); ctx.lineTo(-5,6); ctx.moveTo(10,-6); ctx.lineTo(6,-1); ctx.lineTo(9,4); ctx.moveTo(-16,2); ctx.lineTo(-17.5,8); ctx.moveTo(17,1); ctx.lineTo(15.5,7); ctx.stroke();
      const gr = ctx.createRadialGradient(0,-1,1,0,-1,7); gr.addColorStop(0,'rgba(255,230,120,'+(0.9*hot)+')'); gr.addColorStop(1,'rgba(255,90,10,0)'); ctx.fillStyle = gr; circ(0,-1,7); ctx.fill();
      ctx.fillStyle = '#ffb030'; ctx.fillRect(-4.4,-14,3.2,1.8); ctx.fillRect(1.2,-14,3.2,1.8);
    }
    break; }
  case 'lavalord': {
    const fl = now*8;
    shadowAt(0,19,17,4.6);
    if(!flash){ const gr = ctx.createRadialGradient(0,-4,4,0,-4,40); gr.addColorStop(0,'rgba(255,120,30,0.42)'); gr.addColorStop(1,'rgba(255,60,0,0)'); ctx.fillStyle = gr; circ(0,-4,40); ctx.fill(); }
    ctx.fillStyle = K('#2a0e08'); rrect(-9,6,7.6,13+sw*0.5,2.5); ctx.fill(); ctx.stroke(); rrect(1.4,6,7.6,13-sw*0.5,2.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#3a1208'); ctx.beginPath(); ctx.moveTo(-14,-10); ctx.lineTo(-17,10); ctx.lineTo(17,10); ctx.lineTo(14,-10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K('#4a1a0c'); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-13,-7); ctx.lineTo(-19,3+sw*0.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(13,-7); ctx.lineTo(19,3-sw*0.4); ctx.stroke();
    ctx.fillStyle = K('#ff7a22'); circ(-19.5,5+sw*0.4,5.4); ctx.fill(); circ(19.5,5-sw*0.4,5.4); ctx.fill();
    if(!flash){ flameAt(-19.5,2+sw*0.4,8,13,fl,'#ff5a14','#ffd24a'); flameAt(19.5,2-sw*0.4,8,13,fl+2,'#ff5a14','#ffd24a');
      ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 1.8; ctx.lineJoin = 'miter'; ctx.beginPath(); ctx.moveTo(-9,-8); ctx.lineTo(-5,-2); ctx.lineTo(-9,4); ctx.moveTo(9,-8); ctx.lineTo(5,-3); ctx.lineTo(8,3); ctx.moveTo(0,-9); ctx.lineTo(1,0); ctx.lineTo(-1,6); ctx.stroke(); }
    ctx.fillStyle = K('#5a2012'); ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    ctx.beginPath(); ctx.moveTo(-14,-9); ctx.lineTo(-18,-17); ctx.lineTo(-9,-12); ctx.fill(); ctx.beginPath(); ctx.moveTo(14,-9); ctx.lineTo(18,-17); ctx.lineTo(9,-12); ctx.fill();
    circ(0,-17,9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#1a0a06'); ctx.beginPath(); ctx.moveTo(-6.5,-22); ctx.quadraticCurveTo(-15,-25,-13,-35); ctx.quadraticCurveTo(-10,-28,-4,-25); ctx.fill(); ctx.beginPath(); ctx.moveTo(6.5,-22); ctx.quadraticCurveTo(15,-25,13,-35); ctx.quadraticCurveTo(10,-28,4,-25); ctx.fill();
    if(!flash){ for(let i=-2;i<=2;i++) flameAt(i*4.2,-24+Math.abs(i)*1.2,5,10+Math.sin(fl+i*1.7)*3,fl+i,'#ff5a14','#ffd24a');
      ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.moveTo(-7,-19.4); ctx.lineTo(-1.6,-17); ctx.lineTo(-6.6,-15.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(7,-19.4); ctx.lineTo(1.6,-17); ctx.lineTo(6.6,-15.6); ctx.fill();
      ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(-5,-11.6); ctx.lineTo(5,-11.6); ctx.lineTo(3,-9.4); ctx.lineTo(1.4,-11); ctx.lineTo(0,-9); ctx.lineTo(-1.4,-11); ctx.lineTo(-3,-9.4); ctx.closePath(); ctx.fill(); }
    break; }
  case 'scorpion': {
    shadowAt(0,10,11.5,3);
    ctx.strokeStyle = K('#7a4a1e'); ctx.lineWidth = 1.7;
    for(const s of [-1,1]) for(let i=0;i<3;i++){ const ph = Math.sin(t*1.4+i*2+(s>0?0:3))*1.6; ctx.beginPath(); ctx.moveTo(s*4,2+i*1.6); ctx.lineTo(s*(9+i),0+i*3+ph*0.5); ctx.lineTo(s*(12+i),6+i*1.6+ph); ctx.stroke(); }
    ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    for(const s of [-1,1]){                                                                // клешни
      ctx.strokeStyle = K('#a8622a'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s*5,-1); ctx.lineTo(s*10,-6+sw*0.3*s); ctx.stroke();
      ctx.fillStyle = K('#c27a34'); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ell(s*12,-9+sw*0.3*s,3.6,4.8,s*0.5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*10.4,-12.4+sw*0.3*s); ctx.lineTo(s*12,-15.5+sw*0.3*s); ctx.lineTo(s*13.6,-12+sw*0.3*s); ctx.fill();
    }
    const tl = Math.sin(now*3+e.x)*1.2;
    ctx.fillStyle = K('#b8742e');
    for(const [x,y,r] of [[3,5,3.6],[7,2,3.2],[8.5,-4,2.9],[6.5,-9.5,2.7],[2,-12.5+tl,2.5]]){ circ(x,y,r); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = K('#ffd0a0'); ctx.beginPath(); ctx.moveTo(-0.6,-12.5+tl); ctx.lineTo(-4.2,-9.6+tl); ctx.lineTo(0.2,-9.8+tl); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#9aff4a'; circ(-3.6,-9.6+tl,1.1); ctx.fill(); }
    ctx.fillStyle = K('#b8742e'); ell(0,3,8.6,6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,8,0.55)'; ctx.beginPath(); ctx.moveTo(-7,1); ctx.quadraticCurveTo(0,-1,7,1); ctx.moveTo(-6,4); ctx.quadraticCurveTo(0,2,6,4); ctx.stroke();
    ctx.fillStyle = K('#d49048'); ell(0,-0.5,5,3); ctx.fill();
    if(!flash){ ctx.fillStyle = '#ff3a2a'; circ(-2,-2,0.9); ctx.fill(); circ(2,-2,0.9); ctx.fill(); }
    break; }
  case 'mummy': {
    shadowAt(0,11,8.5,3);
    ctx.fillStyle = K('#d9cfa8'); rrect(-5.2,3,4.6,8+sw*0.5,1.2); ctx.fill(); ctx.stroke(); rrect(0.6,3,4.6,8-sw*0.5,1.2); ctx.fill(); ctx.stroke();
    rrect(-6.8,-6.6,13.6,11,3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#a89c74'; ctx.lineWidth = 1;
    for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(-6.6,-5.4+i*2.3); ctx.lineTo(6.6,-3.6+i*2.3); ctx.stroke(); }
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-5,5.2+i*2.3); ctx.lineTo(-0.6,6.2+i*2.3); ctx.moveTo(1,5.4+i*2.3); ctx.lineTo(5.2,6.2+i*2.3); ctx.stroke(); }
    ctx.strokeStyle = K('#d9cfa8'); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-6.4,-4); ctx.lineTo(-12.5,-9+sw*0.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6.4,-4); ctx.lineTo(12.5,-9-sw*0.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,190,150,0.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-12.5,-9+sw*0.3); ctx.quadraticCurveTo(-14,-3,-12,2+Math.sin(now*3)*1.5); ctx.moveTo(12.5,-9-sw*0.3); ctx.quadraticCurveTo(14,-4,13,3+Math.sin(now*3+1)*1.5); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = OUT; ctx.fillStyle = K('#e0d6b0'); circ(0,-11.5,6.4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#a89c74'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(-6,-14+i*2.4); ctx.lineTo(6,-12.4+i*2.4); ctx.stroke(); }
    ctx.fillStyle = '#0b0805'; ctx.fillRect(-5,-13.4,10,3.4);
    if(!flash){ ctx.fillStyle = '#d6ff5a'; circ(-2.4,-11.7,1.25); ctx.fill(); circ(2.4,-11.7,1.25); ctx.fill(); ctx.globalAlpha = 0.3; circ(-2.4,-11.7,2.8); ctx.fill(); circ(2.4,-11.7,2.8); ctx.fill(); ctx.globalAlpha = 1; }
    break; }
  case 'cobra': {
    const sway = Math.sin(now*2.6+e.x*0.1)*2.2;
    shadowAt(0,11,11,3);
    ctx.fillStyle = K('#7a8a2a'); ctx.strokeStyle = OUT; ell(0,8,10.5,4); ctx.fill(); ctx.stroke(); ell(0,5,8,3.4); ctx.fillStyle = K('#8a9a30'); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K('#8a9a30'); ctx.lineWidth = 6.4; ctx.beginPath(); ctx.moveTo(0,5); ctx.quadraticCurveTo(-3+sway*0.5,-3,sway,-9); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = K('#9aa83a'); ctx.strokeStyle = OUT; ell(sway,-11,8.6,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#e8d870'); ell(sway,-10.5,4.6,4.2); ctx.fill();
    if(!flash){ ctx.fillStyle = '#2a2a10'; circ(sway-2.4,-10.5,1.5); ctx.fill(); circ(sway+2.4,-10.5,1.5); ctx.fill(); }
    ctx.fillStyle = K('#6a7a22'); ell(sway,-8.2,3.8,3.2); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#ffdc2a'; ell(sway-1.7,-9,1,1.2); ctx.fill(); ell(sway+1.7,-9,1,1.2); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillRect(sway-1.9,-9.6,0.5,1.4); ctx.fillRect(sway+1.5,-9.6,0.5,1.4); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(sway-1.8,-6.4); ctx.lineTo(sway-0.9,-6.4); ctx.lineTo(sway-1.4,-3.8); ctx.fill(); ctx.beginPath(); ctx.moveTo(sway+1.8,-6.4); ctx.lineTo(sway+0.9,-6.4); ctx.lineTo(sway+1.4,-3.8); ctx.fill();
    if(Math.sin(now*5+e.x)>0.2){ ctx.strokeStyle = '#d02a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sway,-6); ctx.lineTo(sway,-2.6); ctx.lineTo(sway-1.2,-1.4); ctx.moveTo(sway,-2.6); ctx.lineTo(sway+1.2,-1.4); ctx.stroke(); }
    break; }
  case 'pharaoh': {
    const bob = Math.sin(now*1.8+e.x*0.02)*1.6;
    shadowAt(0,19,17,4.4);
    if(!flash){ const gr = ctx.createRadialGradient(0,-4,4,0,-4,38); gr.addColorStop(0,'rgba(255,214,90,0.34)'); gr.addColorStop(1,'rgba(255,214,90,0)'); ctx.fillStyle = gr; circ(0,-4,38); ctx.fill(); }
    ctx.translate(0,bob);
    ctx.fillStyle = K('#e3d6a0'); ctx.beginPath(); ctx.moveTo(-13,-10); ctx.lineTo(-18,18); ctx.lineTo(18,18); ctx.lineTo(13,-10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#d8a824'); ctx.fillRect(-17.6,15,35.2,3.2); ctx.fillStyle = K('#2a6ab0'); for(let i=-3;i<=3;i++) ctx.fillRect(i*5-1.2,6,2.4,9);
    ctx.strokeStyle = K('#b8ac80'); ctx.lineWidth = 1; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(-12+i*1,-6+i*3); ctx.lineTo(12-i*1,-6+i*3); ctx.stroke(); }
    ctx.strokeStyle = K('#e3d6a0'); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-11,-9); ctx.lineTo(-4,-2); ctx.moveTo(11,-9); ctx.lineTo(4,-2); ctx.stroke();
    ctx.strokeStyle = K('#d8a824'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(17,-22); ctx.lineTo(17,14); ctx.stroke(); ctx.beginPath(); ctx.arc(14.5,-22,2.6,Math.PI*1.05,Math.PI*1.9+0.8); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-17,-4); ctx.lineTo(-17,10); ctx.stroke(); ctx.fillStyle = K('#2a6ab0'); for(const dy of [10,13]){ circ(-17,dy,1.9); ctx.fill(); }
    ctx.fillStyle = K('#d8a824'); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ell(0,-8,13,5.2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K('#2a6ab0'); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0,-8,10.5,0.15,Math.PI-0.15); ctx.stroke(); ctx.beginPath(); ctx.arc(0,-8,7.5,0.15,Math.PI-0.15); ctx.stroke();
    ctx.fillStyle = K('#d8a824'); ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(-8,-31); ctx.lineTo(0,-34); ctx.lineTo(8,-31); ctx.lineTo(10,-10); ctx.lineTo(7,-12); ctx.lineTo(-7,-12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K('#2a6ab0'); ctx.lineWidth = 1.7; for(let i=0;i<5;i++){ const y = -30+i*3.6, w = 7.4+i*0.5; ctx.beginPath(); ctx.moveTo(-w,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.fillStyle = K('#e0b84a'); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ell(0,-18.5,5.6,7.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0b0805'; ctx.beginPath(); ctx.moveTo(-5,-20.4); ctx.lineTo(-1,-19); ctx.lineTo(-4.6,-17.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(5,-20.4); ctx.lineTo(1,-19); ctx.lineTo(4.6,-17.6); ctx.fill();
    if(!flash){ ctx.fillStyle = '#7affc8'; circ(-2.8,-19,1); ctx.fill(); circ(2.8,-19,1); ctx.fill(); ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.moveTo(0,-25.6); ctx.lineTo(-1.6,-23); ctx.lineTo(1.6,-23); ctx.fill(); }
    ctx.fillStyle = K('#2a6ab0'); ctx.fillRect(-1.3,-12,2.6,7);
    break; }
  case 'yeti': {
    shadowAt(0,14,13,4);
    ctx.fillStyle = K('#e8f1f8'); rrect(-9,5,8.2,10+sw*0.4,3.2); ctx.fill(); ctx.stroke(); rrect(0.8,5,8.2,10-sw*0.4,3.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#7a9ab8'); ctx.fillRect(-9.4,13+sw*0.4,9,2.4); ctx.fillRect(0.4,13-sw*0.4,9,2.4);
    ctx.fillStyle = K('#f2f8fc'); ctx.beginPath(); ctx.moveTo(-13,-6);
    for(let i=0;i<=8;i++) ctx.lineTo(-13+i*3.25, i%2 ? 10.5 : 7.5);
    ctx.lineTo(13,-6); ctx.quadraticCurveTo(0,-14,-13,-6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c0d4e4'; ctx.lineWidth = 1.1; for(let i=0;i<6;i++){ ctx.beginPath(); ctx.moveTo(-9+i*3.6,-3+(i%2)*3); ctx.lineTo(-10+i*3.6,4+(i%2)*3); ctx.stroke(); }
    ctx.fillStyle = K('#e8f1f8'); ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ell(-16,0+sw*0.3,5,10.5,0.22); ctx.fill(); ctx.stroke(); ell(16,0-sw*0.3,5,10.5,-0.22); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#b8d0e4'); circ(-17.5,10+sw*0.3,5); ctx.fill(); ctx.stroke(); circ(17.5,10-sw*0.3,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#f2f8fc'); circ(0,-12.5,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#d9e6ef'); ctx.beginPath(); ctx.moveTo(-6,-18); ctx.lineTo(-9,-25); ctx.lineTo(-3,-19); ctx.fill(); ctx.beginPath(); ctx.moveTo(6,-18); ctx.lineTo(9,-25); ctx.lineTo(3,-19); ctx.fill();
    ctx.fillStyle = K('#5a86ac'); ell(0,-11.2,5.6,5); ctx.fill();
    if(!flash){ ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-5,-14.6); ctx.lineTo(-1,-12.6); ctx.lineTo(-4.6,-11.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(5,-14.6); ctx.lineTo(1,-12.6); ctx.lineTo(4.6,-11.6); ctx.fill(); ctx.fillStyle = '#c01818'; circ(-2.6,-12.6,0.8); ctx.fill(); circ(2.6,-12.6,0.8); ctx.fill(); }
    ctx.fillStyle = '#1a0a14'; ctx.beginPath(); ctx.moveTo(-3.8,-8.6); ctx.quadraticCurveTo(0,-4.2,3.8,-8.6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-3.2,-8.2); ctx.lineTo(-2.2,-8.2); ctx.lineTo(-2.7,-6) ; ctx.fill(); ctx.beginPath(); ctx.moveTo(3.2,-8.2); ctx.lineTo(2.2,-8.2); ctx.lineTo(2.7,-6); ctx.fill();
    break; }
  case 'frostking': {
    const bob = Math.sin(now*1.7+e.x*0.02)*2.2;
    shadowAt(0,20,16,4.2);
    if(!flash){ const gr = ctx.createRadialGradient(0,-4,4,0,-4,40); gr.addColorStop(0,'rgba(140,220,255,0.42)'); gr.addColorStop(1,'rgba(140,220,255,0)'); ctx.fillStyle = gr; circ(0,-4,40); ctx.fill(); }
    ctx.translate(0,bob);
    ctx.fillStyle = K('#3a6aa0'); ctx.beginPath(); ctx.moveTo(-13,-12); ctx.lineTo(-20,18); for(let x=-20;x<=20;x+=5) ctx.lineTo(x, 18+((x/5)%2?3:-1)); ctx.lineTo(20,18); ctx.lineTo(13,-12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#7ab4e0'); ctx.beginPath(); ctx.moveTo(-6,-10); ctx.lineTo(6,-10); ctx.lineTo(9,16); ctx.lineTo(-9,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = K('#5a8cc0'); rrect(-11,-12,22,14,4); ctx.fill(); ctx.stroke();
    if(!flash){ const gr = ctx.createRadialGradient(0,-5,1,0,-5,7); gr.addColorStop(0,'rgba(232,251,255,1)'); gr.addColorStop(1,'rgba(120,220,255,0)'); ctx.fillStyle = gr; circ(0,-5,7); ctx.fill(); }
    ctx.fillStyle = K('#bfe6ff'); ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*9,-12); ctx.lineTo(s*14,-26); ctx.lineTo(s*15,-10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s*14,-9); ctx.lineTo(s*21,-19); ctx.lineTo(s*19,-6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = K('#7ab4e0'); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(-11,-6); ctx.lineTo(-17,4+sw*0.3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(11,-6); ctx.lineTo(17,0-sw*0.3); ctx.stroke();
    ctx.fillStyle = K('#dff0fa'); circ(-17.4,5+sw*0.3,3.6); ctx.fill(); circ(17.4,0-sw*0.3,3.6); ctx.fill();
    ctx.strokeStyle = K('#9ad0f0'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(17.4,22); ctx.lineTo(17.4,-20-sw*0.3); ctx.stroke();
    ctx.fillStyle = K('#e8fbff'); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(17.4,-34-sw*0.3); ctx.lineTo(22,-26-sw*0.3); ctx.lineTo(17.4,-18-sw*0.3); ctx.lineTo(12.8,-26-sw*0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#dff0fa'); circ(0,-19,8.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#cfe6f6'); ctx.beginPath(); ctx.moveTo(-6,-12.8); for(const [x,h] of [[-5,5],[-2.5,8],[0,10],[2.5,8],[5,5]]) ctx.lineTo(x,-12.8+h); ctx.lineTo(6,-12.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#07101a'; ell(-3.1,-19.6,2.4,3,0.2); ctx.fill(); ell(3.1,-19.6,2.4,3,-0.2); ctx.fill(); ctx.beginPath(); ctx.moveTo(0,-17.4); ctx.lineTo(-1.2,-14.8); ctx.lineTo(1.2,-14.8); ctx.fill();
    if(!flash){ ctx.fillStyle = '#4ad8ff'; circ(-3.1,-19.4,1.2); ctx.fill(); circ(3.1,-19.4,1.2); ctx.fill(); }
    ctx.fillStyle = K('#bfe6ff'); ctx.strokeStyle = OUT; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-8.6,-24.6); ctx.lineTo(-9.6,-34); ctx.lineTo(-5,-28.4); ctx.lineTo(-3.4,-38); ctx.lineTo(0,-29.4); ctx.lineTo(3.4,-38); ctx.lineTo(5,-28.4); ctx.lineTo(9.6,-34); ctx.lineTo(8.6,-24.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#e8fbff'; circ(0,-26.6,1.4); ctx.fill(); }
    break; }
  case 'ghoul': {
    const hunch = Math.sin(t*0.9)*0.8;
    shadowAt(0,11,9.5,3);
    ctx.fillStyle = K('#6a6a60'); rrect(-5,4,3.8,7+sw*0.5,1.4); ctx.fill(); ctx.stroke(); rrect(1.2,4,3.8,7-sw*0.5,1.4); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(0,hunch); ctx.rotate(0.22);
    ctx.fillStyle = K('#8a8a7a'); ell(-1,-3,8.2,8.6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a4a40'; ctx.lineWidth = 1; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-5,-6+i*3); ctx.lineTo(3,-5+i*3); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = K('#8a8a7a'); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6,-5); ctx.lineTo(-11,3); ctx.lineTo(-12.5,9+sw*0.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6,-5); ctx.lineTo(11,3); ctx.lineTo(12.5,9-sw*0.4); ctx.stroke();
    ctx.strokeStyle = K('#e8e4d0'); ctx.lineWidth = 1.2;
    for(const s of [-1,1]) for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(s*12.5,9+sw*0.4*-s); ctx.lineTo(s*(14+k*1.2),13.5+sw*0.4*-s); ctx.stroke(); }
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = K('#9a9a8a'); ell(1,-11.5+hunch,6.6,6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#7a7a6a'); ctx.beginPath(); ctx.moveTo(-3,-16.4); ctx.lineTo(-6,-20); ctx.lineTo(-1,-16.8); ctx.fill();
    if(!flash){ ctx.fillStyle = '#ffe23a'; ell(-1.4,-12.6+hunch,1.7,1.3,0.3); ctx.fill(); ell(3.6,-12.6+hunch,1.7,1.3,-0.3); ctx.fill(); ctx.fillStyle = '#000'; circ(-1.4,-12.6+hunch,0.5); ctx.fill(); circ(3.6,-12.6+hunch,0.5); ctx.fill(); }
    ctx.fillStyle = '#1a0608'; ctx.beginPath(); ctx.moveTo(-3.6,-8.6+hunch); ctx.quadraticCurveTo(1,-3.4+hunch,5.6,-8.6+hunch); ctx.quadraticCurveTo(1,-7.4+hunch,-3.6,-8.6+hunch); ctx.fill();
    ctx.fillStyle = '#f4f0dc'; for(const x of [-2.4,0,2.4,4.6]){ ctx.beginPath(); ctx.moveTo(x-0.8,-8.2+hunch); ctx.lineTo(x+0.8,-8.2+hunch); ctx.lineTo(x,-5.6+hunch); ctx.fill(); }
    break; }
  case 'lich': {
    const tt = now*1.9 + e.x*0.02, bob = Math.sin(tt)*2.2;
    shadowAt(0,21,15,4);
    if(!flash){ const gr = ctx.createRadialGradient(0,-4,4,0,-4,42); gr.addColorStop(0,'rgba(90,255,150,0.38)'); gr.addColorStop(1,'rgba(90,255,150,0)'); ctx.fillStyle = gr; circ(0,-4,42); ctx.fill(); }
    ctx.translate(0,bob);
    ctx.fillStyle = K('#1c1030'); ctx.beginPath(); ctx.moveTo(-10,-14); ctx.quadraticCurveTo(-21,2,-20,16);
    for(let i=0;i<=8;i++) ctx.lineTo(-20+i*5, 18+(i%2?5:0)+Math.sin(tt*3+i)*1.6);
    ctx.quadraticCurveTo(21,2,10,-14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#2e1a4a'); ctx.beginPath(); ctx.moveTo(-6,-12); ctx.lineTo(6,-12); ctx.lineTo(9,16); ctx.lineTo(-9,16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = K('#46e08a'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6,-12); ctx.lineTo(-9,16); ctx.moveTo(6,-12); ctx.lineTo(9,16); ctx.stroke();
    if(!flash){ ctx.strokeStyle = 'rgba(110,255,170,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3,-4); ctx.lineTo(3,-4); ctx.moveTo(0,-7); ctx.lineTo(0,2); ctx.moveTo(-2.4,-6.4); ctx.lineTo(2.4,0.4); ctx.moveTo(2.4,-6.4); ctx.lineTo(-2.4,0.4); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    ctx.fillStyle = K('#2e1a4a'); ctx.beginPath(); ctx.moveTo(-9,-13); ctx.lineTo(-17,-9); ctx.lineTo(-21,0); ctx.lineTo(-14,1); ctx.lineTo(-10,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9,-13); ctx.lineTo(17,-9); ctx.lineTo(19,-2); ctx.lineTo(13,-2); ctx.lineTo(10,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#e4dfcb'); circ(-19,3,2.4); ctx.fill(); circ(17,0,2.4); ctx.fill();
    const oy = Math.sin(tt*1.6)*3;                                                              // парящий зелёный шар слева
    if(!flash){ const gr = ctx.createRadialGradient(-24,-6+oy,1,-24,-6+oy,9); gr.addColorStop(0,'rgba(230,255,235,1)'); gr.addColorStop(0.5,'rgba(70,230,130,0.8)'); gr.addColorStop(1,'rgba(70,230,130,0)'); ctx.fillStyle = gr; circ(-24,-6+oy,9); ctx.fill(); }
    ctx.strokeStyle = K('#6a4a2a'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(19,20); ctx.lineTo(19,-24); ctx.stroke();       // посох с черепом
    ctx.fillStyle = K('#e4dfcb'); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1; circ(19,-28,4.6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#0a0306'; circ(17.6,-28.4,1.3); ctx.fill(); circ(20.4,-28.4,1.3); ctx.fill();
    if(!flash){ flameAt(19,-31,6,10+Math.sin(tt*6)*2,tt*6,'#2fd06a','#d8ffe0'); }
    ctx.fillStyle = K('#e4dfcb'); ell(0,-21,8,9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#0a0306'; ell(-3.2,-21.4,2.6,3.4,0.25); ctx.fill(); ell(3.2,-21.4,2.6,3.4,-0.25); ctx.fill();
    if(!flash){ flameAt(-3.2,-20.4,3.6,7+Math.sin(tt*6)*1.4,tt*6,'#2fd06a','#d8ffe0'); flameAt(3.2,-20.4,3.6,7+Math.sin(tt*6+1)*1.4,tt*6+1,'#2fd06a','#d8ffe0'); }
    ctx.fillStyle = '#0a0306'; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(-1.4,-15.4); ctx.lineTo(1.4,-15.4); ctx.fill();
    ctx.fillStyle = K('#e4dfcb'); rrect(-5,-14.4,10,4.6,1.6); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#14110c'; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*1.8,-14.4); ctx.lineTo(i*1.8,-10); ctx.stroke(); }
    ctx.fillStyle = K('#cfc9b4'); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1;                                          // рога-корона
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(s*5,-27.4); ctx.quadraticCurveTo(s*13,-30,s*12,-40); ctx.quadraticCurveTo(s*9,-33,s*3.6,-29.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s*9,-31.6); ctx.lineTo(s*15,-33); ctx.lineTo(s*10.6,-35); ctx.fill(); }
    ctx.fillStyle = K('#46e08a'); circ(0,-28,1.6); ctx.fill();
    break; }
  case 'panther': {
    ctx.scale(face*0.88,0.88);
    shadowAt(0,9,14,3.4);
    const run = Math.sin(t*1.2)*2.4;
    const leg=(x,sh,col)=>{ ctx.fillStyle=K(col); rrect(x-1.8,1,3.6,8+sh,1.4); ctx.fill(); };
    leg(-9+run,0,'#15131a'); leg(6-run,0,'#15131a');
    ctx.strokeStyle = K('#22202a'); ctx.lineWidth = 4.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11,-1); ctx.bezierCurveTo(-20,-2,-21,-12,-14,-14+Math.sin(now*4)*2); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.fillStyle = K('#2a2733'); ell(-1,-1,12.6,6.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#3a3644'); ell(-1,-3,9,2.6); ctx.fill();
    leg(-6-run,0,'#22202a'); leg(8+run,0,'#22202a');
    ctx.fillStyle = K('#2a2733'); ell(11,-3.6,5.8,5.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#3a3644'); rrect(13.4,-3.6,6.4,4.4,1.8); ctx.fill();
    ctx.fillStyle = '#0a090c'; circ(19.4,-2.6,1.2); ctx.fill();
    ctx.fillStyle = K('#22202a'); ctx.beginPath(); ctx.moveTo(8,-7.4); ctx.lineTo(9,-12.6); ctx.lineTo(12,-7.8); ctx.fill(); ctx.beginPath(); ctx.moveTo(12,-8); ctx.lineTo(14.6,-12.2); ctx.lineTo(15,-6.6); ctx.fill();
    if(!flash){ ctx.fillStyle = '#9aff3a'; ell(13.4,-5.4,1.8,1.1,-0.3); ctx.fill(); ctx.fillStyle = '#000'; circ(13.8,-5.4,0.5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(16.4,0.4); ctx.lineTo(17.2,3.2); ctx.lineTo(18,0.4); ctx.fill(); }
    break; }
  case 'shroom': {
    const bob = Math.sin(now*3+e.x*0.1)*0.8;
    shadowAt(0,11,10,3);
    ctx.strokeStyle = K('#5a4a30'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-3,7); ctx.lineTo(-6,11+sw*0.3); ctx.moveTo(3,7); ctx.lineTo(6,11-sw*0.3); ctx.moveTo(0,8); ctx.lineTo(0,11.5); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = K('#e8dcc0'); ctx.beginPath(); ctx.moveTo(-5,-4+bob); ctx.lineTo(-6.4,8); ctx.quadraticCurveTo(0,10.6,6.4,8); ctx.lineTo(5,-4+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#7a2a9a'); ctx.beginPath(); ctx.moveTo(-15,-3+bob); ctx.bezierCurveTo(-16,-16,-7,-22,0,-22+bob); ctx.bezierCurveTo(7,-22,16,-16,15,-3+bob); ctx.quadraticCurveTo(0,0+bob,-15,-3+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#5a1a78'); ctx.beginPath(); ctx.moveTo(-15,-3+bob); ctx.quadraticCurveTo(0,0+bob,15,-3+bob); ctx.quadraticCurveTo(0,-5+bob,-15,-3+bob); ctx.fill();
    ctx.fillStyle = flash?'#fff':'#c8ff4a'; for(const [x,y,r] of [[-8,-12,2.6],[2,-17,2.2],[9,-10,2.8],[-1,-8,1.6],[-11,-6,1.4]]){ circ(x,y+bob,r); ctx.fill(); }
    if(!flash){ ctx.globalAlpha = 0.3; ctx.fillStyle = '#c8ff4a'; for(const [x,y,r] of [[-8,-12,4.4],[9,-10,4.6]]){ circ(x,y+bob,r); ctx.fill(); } ctx.globalAlpha = 1; }
    ctx.fillStyle = flash?'#fff':'#c8ff4a'; ctx.beginPath(); ctx.moveTo(-4.4,0+bob); ctx.lineTo(-0.8,2.4+bob); ctx.lineTo(-4,3.8+bob); ctx.fill(); ctx.beginPath(); ctx.moveTo(4.4,0+bob); ctx.lineTo(0.8,2.4+bob); ctx.lineTo(4,3.8+bob); ctx.fill();
    ctx.fillStyle = '#1a0a1e'; ctx.beginPath(); ctx.moveTo(-3,5+bob); ctx.quadraticCurveTo(0,8.4+bob,3,5+bob); ctx.quadraticCurveTo(0,6.4+bob,-3,5+bob); ctx.fill();
    if(!flash){ for(let k=0;k<3;k++){ const p = (now*0.6+k/3)%1; ctx.fillStyle = 'rgba(190,255,90,'+(0.55*(1-p))+')'; circ(Math.sin(k*3+now)*7, -22-p*10, 1.4+p); ctx.fill(); } }
    break; }
  case 'gorilla': {
    shadowAt(0,15,14,4);
    ctx.fillStyle = K('#3a3633'); rrect(-9,5,8.4,10+sw*0.4,3.4); ctx.fill(); ctx.stroke(); rrect(0.6,5,8.4,10-sw*0.4,3.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#4a4642'); ell(0,-3,13,11.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#6a645e'); ell(0,-1,8.6,7.6); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,5); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = K('#3e3a37'); ell(-16,2+sw*0.3,5.4,11,0.2); ctx.fill(); ctx.stroke(); ell(16,2-sw*0.3,5.4,11,-0.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#2a2725'); circ(-17.6,12+sw*0.3,5); ctx.fill(); ctx.stroke(); circ(17.6,12-sw*0.3,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#3e3a37'); circ(0,-14,8); ctx.fill(); ctx.stroke(); ell(0,-19,6,3.4); ctx.fill();
    ctx.fillStyle = K('#7a7068'); ell(0,-11.8,5.4,4.6); ctx.fill();
    ctx.fillStyle = flash?'#fff':'#0a0908'; circ(-2.4,-14.6,1.6); ctx.fill(); circ(2.4,-14.6,1.6); ctx.fill();
    if(!flash){ ctx.fillStyle = '#ff8a3a'; circ(-2.4,-14.6,0.7); ctx.fill(); circ(2.4,-14.6,0.7); ctx.fill(); ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-5,-17.4); ctx.lineTo(-0.8,-15.6); ctx.moveTo(5,-17.4); ctx.lineTo(0.8,-15.6); ctx.stroke(); }
    ctx.fillStyle = '#1a0a0a'; ctx.beginPath(); ctx.moveTo(-3.8,-9.8); ctx.quadraticCurveTo(0,-6.4,3.8,-9.8); ctx.quadraticCurveTo(0,-8.6,-3.8,-9.8); ctx.fill();
    ctx.fillStyle = '#f4f0dc'; ctx.beginPath(); ctx.moveTo(-3,-9.6); ctx.lineTo(-2,-9.6); ctx.lineTo(-2.5,-7.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(3,-9.6); ctx.lineTo(2,-9.6); ctx.lineTo(2.5,-7.4); ctx.fill();
    break; }
  case 'spiderqueen': {
    const tt = now*2+e.x*0.02, pulse = e.shotCd!==undefined && e.shotCd<500 ? 1 : 0;
    shadowAt(0,19,20,5);
    if(!flash){ const gr = ctx.createRadialGradient(0,0,4,0,0,42); gr.addColorStop(0,'rgba(200,120,255,0.32)'); gr.addColorStop(1,'rgba(200,120,255,0)'); ctx.fillStyle = gr; circ(0,0,42); ctx.fill(); }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for(const sd of [-1,1]) for(let i=0;i<4;i++){
      const ph = Math.sin(tt*1.3+i*1.7+(sd>0?0:3))*3, kx = sd*(15+i*1.5), ky = -18+i*9+ph*0.4, fx = sd*(29+(i%2)*3), fy = -2+i*8+ph;
      ctx.strokeStyle = K('#241432'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sd*5,-2+i*2.4); ctx.lineTo(kx,ky); ctx.lineTo(fx,fy); ctx.stroke();
      ctx.strokeStyle = K('#7a4a9a'); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(sd*5,-2+i*2.4); ctx.lineTo(kx,ky); ctx.stroke();
    }
    ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    ctx.fillStyle = K('#2a1738'); ell(0,9,13,15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#40255a'); ell(-3.4,5,5,8,0.2); ctx.fill();
    if(!flash){ ctx.fillStyle = '#e03a4a'; ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(4.4,10); ctx.lineTo(0,16); ctx.lineTo(-4.4,10); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = K('#34204a'); ell(0,-9,9.4,8.4); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = pulse ? '#ffffff' : '#ff3a4a'; for(const [x,y,r] of [[-3.4,-11,1.9],[3.4,-11,1.9],[-6.2,-8.6,1.3],[6.2,-8.6,1.3],[-1.4,-13.6,1.1],[1.4,-13.6,1.1]]){ circ(x,y,r); ctx.fill(); } }
    ctx.fillStyle = K('#e8e0f0'); ctx.beginPath(); ctx.moveTo(-3.4,-3.4); ctx.lineTo(-1.8,3+pulse*2.4); ctx.lineTo(-0.4,-3.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(3.4,-3.4); ctx.lineTo(1.8,3+pulse*2.4); ctx.lineTo(0.4,-3.4); ctx.fill();
    ctx.fillStyle = K('#d8b84a'); ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(-6.4,-15); ctx.lineTo(-5.4,-23); ctx.lineTo(-2.2,-17.6); ctx.lineTo(0,-24.4); ctx.lineTo(2.2,-17.6); ctx.lineTo(5.4,-23); ctx.lineTo(6.4,-15); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#c03a6a'; circ(0,-18.4,1.3); ctx.fill(); }
    break; }
  case 'warlord': {
    const tt = now*1.6+e.x*0.02, sg = Math.sin(tt)*1.4;
    shadowAt(0,21,17,4.4);
    if(!flash){ const gr = ctx.createRadialGradient(0,-2,4,0,-2,42); gr.addColorStop(0,'rgba(255,60,60,0.26)'); gr.addColorStop(1,'rgba(255,60,60,0)'); ctx.fillStyle = gr; circ(0,-2,42); ctx.fill(); }
    ctx.fillStyle = K('#6a0f1a'); ctx.beginPath(); ctx.moveTo(-12,-12); ctx.lineTo(12,-12); ctx.lineTo(18+sg,20); ctx.lineTo(8,16); ctx.lineTo(0,22); ctx.lineTo(-8,16); ctx.lineTo(-18-sg,20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#23252e'); rrect(-8,8,6.6,13,2); ctx.fill(); ctx.stroke(); rrect(1.4,8,6.6,13,2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#2b2e3a'); rrect(-11,-14,22,24,5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = K('#6a7090'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8,-6); ctx.lineTo(8,-6); ctx.moveTo(0,-14); ctx.lineTo(0,10); ctx.moveTo(-8,2); ctx.lineTo(8,2); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    for(const sd of [-1,1]){
      ctx.fillStyle = K('#3a3e50'); circ(sd*13.4,-11,6.6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = K('#9aa0bc'); ctx.beginPath(); ctx.moveTo(sd*10,-15); ctx.lineTo(sd*13,-23); ctx.lineTo(sd*16,-14); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.save(); ctx.translate(18,-6); ctx.rotate(-0.2+sg*0.03);
    ctx.fillStyle = K('#c8cede'); ctx.beginPath(); ctx.moveTo(-2.4,2); ctx.lineTo(-2.4,-32); ctx.lineTo(0,-38); ctx.lineTo(2.4,-32); ctx.lineTo(2.4,2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#8a90a8'); ctx.fillRect(-6,2,12,3); ctx.fillStyle = K('#3a2a1e'); ctx.fillRect(-1.6,5,3.2,7);
    if(!flash){ ctx.fillStyle = 'rgba(255,90,70,0.55)'; ctx.fillRect(-0.6,-30,1.2,30); }
    ctx.restore();
    ctx.fillStyle = K('#2b2e3a'); rrect(-7.4,-28,14.8,16,5.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#9aa0bc');
    for(const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(sd*6,-25); ctx.quadraticCurveTo(sd*14,-27,sd*13,-36); ctx.quadraticCurveTo(sd*10,-30,sd*4.6,-28); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#07070b'; ctx.fillRect(-5.4,-21,10.8,3.4);
    if(!flash){ ctx.fillStyle = '#ff3030'; ctx.fillRect(-4.6,-20.4,9.2,1.8); }
    break; }
  case 'phantom': {
    const tt = now*1.5+e.x*0.02, bob = Math.sin(tt)*3;
    shadowAt(0,23,11,2.8);
    if(!flash){ const gr = ctx.createRadialGradient(0,-2,4,0,-2,44); gr.addColorStop(0,'rgba(120,255,230,0.34)'); gr.addColorStop(1,'rgba(120,255,230,0)'); ctx.fillStyle = gr; circ(0,-2,44); ctx.fill(); }
    ctx.translate(0,bob); ctx.globalAlpha = flash ? 1 : 0.86;
    ctx.fillStyle = K('#b8c6dc'); ctx.beginPath(); ctx.moveTo(-9,-12); ctx.quadraticCurveTo(-17,6,-15,18);
    for(let i=0;i<=6;i++) ctx.lineTo(-15+i*5, 18+(i%2?6:0)+Math.sin(tt*3+i)*1.8);
    ctx.quadraticCurveTo(17,6,9,-12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#46587a'); ctx.beginPath(); ctx.moveTo(-7,-12); ctx.lineTo(7,-12); ctx.lineTo(10,16); ctx.lineTo(-10,16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = K('#dfe8f6'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(0,16); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    if(!flash){ ctx.fillStyle = '#8ff0e0'; for(const y of [-6,0,6]){ circ(0,y,1.2); ctx.fill(); } }
    ctx.fillStyle = K('#8a2a3a'); ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(-5,-14); ctx.lineTo(-5,-10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(5,-14); ctx.lineTo(5,-10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = K('#b8c6dc'); ctx.beginPath(); ctx.moveTo(-9,-11); ctx.lineTo(-17,-2); ctx.lineTo(-14,3); ctx.lineTo(-8,-5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9,-11); ctx.lineTo(17,-4); ctx.lineTo(19,2); ctx.lineTo(13,0); ctx.lineTo(8,-5); ctx.closePath(); ctx.fill(); ctx.stroke();
    const sw2 = Math.sin(tt*1.4)*2;                                                         // фонарь в руке
    ctx.strokeStyle = K('#6a7a98'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(18,2); ctx.lineTo(18,7+sw2*0.3); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = OUT;
    ctx.fillStyle = K('#3a4560'); rrect(14.6,7+sw2*0.3,7,9,1.6); ctx.fill(); ctx.stroke();
    if(!flash){ const lg = ctx.createRadialGradient(18,11.6+sw2*0.3,1,18,11.6+sw2*0.3,16); lg.addColorStop(0,'rgba(200,255,240,0.95)'); lg.addColorStop(1,'rgba(120,255,230,0)'); ctx.fillStyle = lg; circ(18,11.6+sw2*0.3,16); ctx.fill(); flameAt(18,13+sw2*0.3,3.2,6,tt*6,'#4af0d0','#e0fff8'); }
    ctx.fillStyle = K('#e6eef8'); ell(0,-22,8,9.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#06141a'; ell(-3.2,-22.6,2.4,3.2,0.2); ctx.fill(); ell(3.2,-22.6,2.4,3.2,-0.2); ctx.fill();
    if(!flash){ ctx.fillStyle = '#6ff8e0'; circ(-3.2,-22.4,1); ctx.fill(); circ(3.2,-22.4,1); ctx.fill(); }
    ctx.fillStyle = '#06141a'; ctx.beginPath(); ctx.moveTo(0,-19.6); ctx.lineTo(-1.2,-17.4); ctx.lineTo(1.2,-17.4); ctx.fill(); ctx.beginPath(); ctx.ellipse(0,-14.8,3.4,1.4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = K('#1c2236'); ell(0,-29,12,2.6); ctx.fill(); ctx.stroke(); rrect(-7,-41,14,13,2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#8a2a3a'); ctx.fillRect(-7,-33.4,14,3);
    break; }
  case 'treant': {
    const tt = now*1.2 + e.x*0.02, sway = Math.sin(tt)*1.6;
    shadowAt(0,21,19,5);
    if(!flash){ const gr = ctx.createRadialGradient(0,-8,4,0,-8,44); gr.addColorStop(0,'rgba(190,255,90,0.3)'); gr.addColorStop(1,'rgba(190,255,90,0)'); ctx.fillStyle = gr; circ(0,-8,44); ctx.fill(); }
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.2;
    ctx.fillStyle = K('#4a2e1a');                                                                 // корни-ноги
    for(const [x0,x1,w] of [[-4,-17,6],[4,17,6],[-1,-6,5],[1,7,5]]){ ctx.beginPath(); ctx.moveTo(x0-w/2,8); ctx.quadraticCurveTo((x0+x1)/2,16,x1,21+sw*0.4*Math.sign(x1)); ctx.lineTo(x1+(x1>0?3:-3),21); ctx.quadraticCurveTo((x0+x1)/2,12,x0+w/2,8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = K('#5a3a22'); ctx.beginPath(); ctx.moveTo(-11,10); ctx.quadraticCurveTo(-15,-6,-9,-17); ctx.lineTo(9,-17); ctx.quadraticCurveTo(15,-6,11,10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,16,8,0.7)'; ctx.lineWidth = 1.3; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*4,-15); ctx.quadraticCurveTo(i*4+Math.sin(i)*2,-2,i*4.6,9); ctx.stroke(); }
    ctx.fillStyle = K('#3f7a2a'); ctx.beginPath(); ctx.moveTo(-12,-2); ctx.quadraticCurveTo(-6,2,0,-1); ctx.quadraticCurveTo(7,2,12,-3); ctx.lineTo(11,3); ctx.quadraticCurveTo(0,6,-11,3); ctx.fill();     // мох
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.2;
    for(const s of [-1,1]){                                                                          // ветви-руки
      const a = s>0 ? sway : -sway;
      ctx.strokeStyle = K('#5a3a22'); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(s*10,-10); ctx.quadraticCurveTo(s*22,-8+a,s*24,6+sw*0.4*s); ctx.stroke();
      ctx.lineWidth = 2.4; for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(s*24,6+sw*0.4*s); ctx.lineTo(s*(26+k),13+k*2+sw*0.4*s); ctx.stroke(); }
      ctx.fillStyle = K('#3f8a2a'); for(const [x,y] of [[s*18,-9+a],[s*22,-4+a]]){ ell(x,y,4.4,2.4,s*0.6); ctx.fill(); }
    }
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.fillStyle = K('#2e6a22'); for(const [x,y,r] of [[-12,-26,10],[0,-33,12],[12,-26,10],[-6,-22,8],[7,-22,8]]){ circ(x,y,r); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = K('#4a9a30'); for(const [x,y,r] of [[-12,-29,6],[0,-37,7],[11,-29,6],[-3,-27,5]]){ circ(x,y,r); ctx.fill(); }
    if(!flash){ ctx.fillStyle = '#d8ff6a'; for(const [x,y] of [[-14,-24],[-2,-30],[6,-36],[13,-23]]){ circ(x,y,1); ctx.fill(); } }
    ctx.fillStyle = flash?'#fff':'#14080a'; ctx.beginPath(); ctx.moveTo(-8,-14); ctx.lineTo(-1.6,-11); ctx.lineTo(-7,-8.4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(8,-14); ctx.lineTo(1.6,-11); ctx.lineTo(7,-8.4); ctx.closePath(); ctx.fill();
    if(!flash){ ctx.fillStyle = '#ffb02a'; ctx.beginPath(); ctx.moveTo(-6.6,-12.4); ctx.lineTo(-2.6,-11); ctx.lineTo(-6,-9.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(6.6,-12.4); ctx.lineTo(2.6,-11); ctx.lineTo(6,-9.6); ctx.fill(); }
    ctx.fillStyle = '#14080a'; ctx.beginPath(); ctx.moveTo(-5,-3); ctx.quadraticCurveTo(0,3+Math.abs(Math.sin(tt*1.5))*3,5,-3); ctx.quadraticCurveTo(0,-1.6,-5,-3); ctx.fill();
    ctx.strokeStyle = '#2e1a0c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1,-8); ctx.lineTo(1,-5); ctx.stroke();
    break; }
  case 'boar': {
    const f = face==='left'?-1:1;
    shadowAt(0,11,13,3.4);
    ctx.scale(f,1);
    const lg = Math.sin(t*1.4)*2;
    ctx.fillStyle=K('#3a2616'); for(const [x,l] of [[-8,lg],[-3,-lg],[5,lg],[10,-lg]]) ctx.fillRect(x-1.4,6,2.8,6+l*0.4);
    ctx.fillStyle=K('#6a4a32'); ell(-1,1,13,8.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#4a3220'); ctx.beginPath(); ctx.moveTo(-9,-6); ctx.lineTo(-6,-10); ctx.lineTo(-3,-6.5); ctx.lineTo(0,-10); ctx.lineTo(3,-6); ctx.lineTo(6,-9); ctx.lineTo(7,-5); ctx.closePath(); ctx.fill();
    ctx.fillStyle=K('#7a5a40'); ell(11,2,6.4,5.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#d8a090'); ell(15.5,3.6,2.8,2.4); ctx.fill();
    ctx.fillStyle='#f4f0e0'; ctx.beginPath(); ctx.moveTo(12.5,5.5); ctx.lineTo(16,9); ctx.lineTo(13.5,4.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(10,5.5); ctx.lineTo(10.5,9.5); ctx.lineTo(12,5); ctx.fill();
    if(!flash){ ctx.fillStyle='#ff4a2a'; circ(11,-0.6,1.2); ctx.fill(); }
    ctx.fillStyle=K('#4a3220'); ctx.beginPath(); ctx.moveTo(8,-3); ctx.lineTo(7,-8); ctx.lineTo(11,-4); ctx.fill();
    break; }
  case 'bandit': {
    shadowAt(0,11,8,3);
    ctx.fillStyle=K('#3a3028'); ctx.fillRect(-5,5,3.6,7); ctx.fillRect(1.4,5,3.6,7);
    ctx.fillStyle=K('#5a4a3a'); ctx.beginPath(); ctx.moveTo(-7,6); ctx.lineTo(-5,-5); ctx.lineTo(5,-5); ctx.lineTo(7,6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#8a2a2a'); ctx.fillRect(-6,0,12,2.2);
    ctx.fillStyle=K('#2e2a26'); circ(0,-9,6.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#c9a082'); ell(0,-8,4,3.4); ctx.fill();
    ctx.fillStyle=K('#7a2a2a'); ctx.fillRect(-4,-7.4,8,3.4);
    if(!flash){ ctx.fillStyle='#fff'; ctx.fillRect(-3,-9.4,2,1.4); ctx.fillRect(1,-9.4,2,1.4); }
    const sw2 = Math.sin(now*6+e.x)*0.3;
    ctx.save(); ctx.translate(7,1); ctx.rotate(-0.6+sw2); ctx.fillStyle='#dfe4ea'; ctx.beginPath(); ctx.moveTo(0,-1.2); ctx.lineTo(9,0); ctx.lineTo(0,1.2); ctx.fill(); ctx.fillStyle='#5a3a22'; ctx.fillRect(-3,-1.4,3.4,2.8); ctx.restore();
    break; }
  case 'giantrat': {
    const f = face==='left'?-1:1;
    shadowAt(0,9,10,2.8);
    ctx.scale(f,1);
    ctx.strokeStyle=K('#c99a8a'); ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-9,2); ctx.quadraticCurveTo(-16,-2+Math.sin(now*8+e.x)*3,-15,6); ctx.stroke();
    ctx.strokeStyle=OUT; ctx.lineWidth=1;
    ctx.fillStyle=K('#8a7a6a'); ell(-1,2,10,6.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#9a8a7a'); ctx.beginPath(); ctx.moveTo(7,-2); ctx.lineTo(15,3); ctx.lineTo(7,7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#c99a8a'); circ(5,-3,2.6); ctx.fill(); circ(8,-3.4,2.2); ctx.fill();
    ctx.fillStyle='#f4f0e0'; ctx.fillRect(13,4,1.4,3);
    if(!flash){ ctx.fillStyle='#ff3a3a'; circ(10,1,1.1); ctx.fill(); }
    ctx.fillStyle=K('#d8b0a0'); ctx.fillRect(14.5,2.5,1.6,1.6);
    break; }
  case 'gargoyle': {
    const fl = Math.sin(now*3+e.x)*3;
    shadowAt(0,13,11,3);
    for(const sd of [-1,1]){ ctx.fillStyle=K('#5a606c'); ctx.beginPath(); ctx.moveTo(sd*5,-4); ctx.lineTo(sd*20,-14-fl); ctx.lineTo(sd*16,-5); ctx.lineTo(sd*21,0); ctx.lineTo(sd*13,1); ctx.lineTo(sd*7,5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle=K('#7a808c'); ell(0,3,7.4,9.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#8a909c'); ell(0,-7,5.6,5.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#5a606c'); ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(-7,-17); ctx.lineTo(-1.5,-11); ctx.fill(); ctx.beginPath(); ctx.moveTo(4,-10); ctx.lineTo(7,-17); ctx.lineTo(1.5,-11); ctx.fill();
    if(!flash){ ctx.fillStyle='#ffb02a'; circ(-2,-7.4,1.3); ctx.fill(); circ(2,-7.4,1.3); ctx.fill(); }
    ctx.fillStyle='#e8e8ee'; ctx.fillRect(-1.6,-4,1,2); ctx.fillRect(0.7,-4,1,2);
    ctx.fillStyle=K('#5a606c'); ctx.fillRect(-5,10,3.6,4); ctx.fillRect(1.4,10,3.6,4);
    break; }
  case 'salamander': {
    const f = face==='left'?-1:1, w = Math.sin(now*6+e.x)*2;
    shadowAt(0,10,12,3);
    ctx.scale(f,1);
    ctx.strokeStyle=K('#e0561a'); ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-6,3); ctx.quadraticCurveTo(-14,3+w,-17,-2+w); ctx.stroke();
    if(!flash){ ctx.fillStyle='rgba(255,210,70,0.9)'; circ(-18,-3+w,2.8); ctx.fill(); ctx.fillStyle='rgba(255,100,30,0.8)'; circ(-18,-4+w,1.6); ctx.fill(); }
    ctx.strokeStyle=OUT; ctx.lineWidth=1;
    ctx.fillStyle=K('#3a1a10'); for(const x of [-4,1,7]) ctx.fillRect(x,6,3,5);
    ctx.fillStyle=K('#ff7a2a'); ell(0,2,10,6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#ffb84a'); ell(0,4,8,3); ctx.fill();
    ctx.fillStyle=K('#ffd34a'); for(const x of [-5,0,5]) { circ(x,-0.4,1.3); ctx.fill(); }
    ctx.fillStyle=K('#ff8a3a'); ell(10,0,5.2,4.2); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle='#1a0a06'; circ(11,-1.4,1.2); ctx.fill(); }
    break; }
  case 'vulture': {
    const fl = Math.sin(now*9+e.x*0.2);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ell(0,14,8,2.4); ctx.fill();
    ctx.translate(0,Math.sin(now*4+e.x)*1.5-3);
    for(const sd of [-1,1]){ ctx.fillStyle=K('#4a3a32'); ctx.beginPath(); ctx.moveTo(sd*3,-2); ctx.quadraticCurveTo(sd*12,-12-fl*7,sd*23,-5-fl*9); ctx.lineTo(sd*18,-1-fl*5); ctx.lineTo(sd*21,3-fl*4); ctx.lineTo(sd*13,3-fl*2); ctx.lineTo(sd*6,6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle=K('#5a4a42'); ell(0,3,5,7.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#e8e0d0'); ctx.beginPath(); ctx.moveTo(-5,-3); ctx.lineTo(0,-1); ctx.lineTo(5,-3); ctx.lineTo(0,2); ctx.fill();
    ctx.fillStyle=K('#d89a8a'); circ(0,-7,3.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#d8b04a'); ctx.beginPath(); ctx.moveTo(-1.8,-6.4); ctx.lineTo(0,-1.4); ctx.lineTo(1.8,-6.4); ctx.fill();
    if(!flash){ ctx.fillStyle='#1a1008'; circ(-1.5,-8,0.9); ctx.fill(); circ(1.5,-8,0.9); ctx.fill(); }
    ctx.fillStyle='#3a2a22'; ctx.fillRect(-3,10,1.6,4); ctx.fillRect(1.4,10,1.6,4);
    break; }
  case 'icegolem': {
    shadowAt(0,14,13,3.6);
    const sw3 = Math.sin(t*1.1)*1.6;
    ctx.fillStyle=K('#7ab0d8'); ctx.fillRect(-9,7,7,8); ctx.fillRect(2,7,7,8);
    ctx.fillStyle=K('#9fd0f0'); ctx.beginPath(); ctx.moveTo(-12,-6); ctx.lineTo(-6,-10); ctx.lineTo(6,-10); ctx.lineTo(12,-6); ctx.lineTo(10,8); ctx.lineTo(-10,8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#b8e4ff'); ctx.beginPath(); ctx.moveTo(-8,-6); ctx.lineTo(-2,-8); ctx.lineTo(-4,2); ctx.lineTo(-9,3); ctx.fill();
    for(const sd of [-1,1]){ ctx.fillStyle=K('#8cc0e8'); ctx.fillRect(sd*13-3.5,-6+sw3*sd,7,13); ctx.strokeRect(sd*13-3.5,-6+sw3*sd,7,13); }
    ctx.fillStyle=K('#c8ecff'); ctx.beginPath(); ctx.moveTo(-7,-10); ctx.lineTo(-5,-17); ctx.lineTo(-2,-11); ctx.lineTo(1,-18); ctx.lineTo(3,-11); ctx.lineTo(7,-16); ctx.lineTo(7,-9); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle='#2a7aff'; ctx.fillRect(-4,-6,3,2.6); ctx.fillRect(1,-6,3,2.6); ctx.fillStyle='rgba(120,200,255,0.5)'; circ(0,0,3.2); ctx.fill(); }
    break; }
  case 'skelarcher': {
    shadowAt(0,11,8,3);
    ctx.fillStyle=K('#d8d3bd'); ctx.fillRect(-4,5,2.4,7); ctx.fillRect(1.6,5,2.4,7);
    ctx.fillRect(-1,-4,2,10); for(const y of [-3,0,3]) ctx.fillRect(-5,y,10,1.5);
    circ(0,-9,5.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=flash?'#fff':'#14110a'; circ(-2,-9.4,1.5); ctx.fill(); circ(2,-9.4,1.5); ctx.fill(); ctx.fillRect(-1.5,-6,3,1.3);
    if(!flash){ ctx.fillStyle='#ff4a2a'; circ(-2,-9.4,0.6); ctx.fill(); circ(2,-9.4,0.6); ctx.fill(); }
    const aim = Math.atan2((player.y-e.y),(player.x-e.x));
    ctx.save(); ctx.translate(Math.cos(aim)*7,-1+Math.sin(aim)*7); ctx.rotate(aim);
    ctx.strokeStyle='#7a5a32'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(2,0,9,-1.2,1.2); ctx.stroke();
    ctx.strokeStyle='#e8e0cc'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(2+9*Math.cos(-1.2),9*Math.sin(-1.2)); ctx.lineTo(-1,0); ctx.lineTo(2+9*Math.cos(1.2),9*Math.sin(1.2)); ctx.stroke(); ctx.restore();
    break; }
  case 'hunter': {
    shadowAt(0,11,8,3);
    ctx.fillStyle=K('#4a3a22'); ctx.fillRect(-4.6,5,3.6,7); ctx.fillRect(1,5,3.6,7);
    ctx.fillStyle=K('#3f6a2a'); ctx.beginPath(); ctx.moveTo(-8,7); ctx.lineTo(-5,-5); ctx.lineTo(5,-5); ctx.lineTo(8,7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#8a6a3a'); ctx.fillRect(-6,1,12,1.8);
    ctx.fillStyle=K('#2a4a1a'); ctx.beginPath(); ctx.moveTo(-6.4,-8); ctx.lineTo(0,-16); ctx.lineTo(6.4,-8); ctx.lineTo(5,-3); ctx.lineTo(-5,-3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#b8906a'); ell(0,-7,3.8,3.4); ctx.fill();
    ctx.fillStyle='#d83a2a'; ctx.fillRect(-4,-9.6,8,1.6);
    if(!flash){ ctx.fillStyle='#10200a'; circ(-1.6,-6.8,0.9); ctx.fill(); circ(1.6,-6.8,0.9); ctx.fill(); }
    ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.moveTo(9,9); ctx.lineTo(9,-14); ctx.stroke();
    ctx.fillStyle='#dfe4ea'; ctx.beginPath(); ctx.moveTo(7.6,-13); ctx.lineTo(9,-19); ctx.lineTo(10.4,-13); ctx.fill();
    for(const [x,c] of [[-3,'#d83a2a'],[3,'#e8c83a']]){ ctx.fillStyle=c; ctx.fillRect(x-0.8,-14.4,1.6,3); }
    break; }
  case 'crossbowman': {
    shadowAt(0,12,9,3);
    ctx.fillStyle=K('#5a5f6c'); ctx.fillRect(-5,5,4,8); ctx.fillRect(1,5,4,8);
    ctx.fillStyle=K('#7a7f8c'); ctx.beginPath(); ctx.moveTo(-8,6); ctx.lineTo(-6,-6); ctx.lineTo(6,-6); ctx.lineTo(8,6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#2e4a8a'); ctx.fillRect(-3,-5,6,10);
    ctx.fillStyle=K('#9aa0ae'); circ(0,-10,6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=flash?'#fff':'#14161c'; ctx.fillRect(-4,-11.2,8,2.2);
    ctx.fillStyle=K('#c83a2a'); ctx.beginPath(); ctx.moveTo(-1,-15.5); ctx.lineTo(0,-20); ctx.lineTo(1,-15.5); ctx.fill();
    const aim2 = Math.atan2((player.y-e.y),(player.x-e.x));
    ctx.save(); ctx.translate(0,0); ctx.rotate(aim2);
    ctx.fillStyle='#6a4a2a'; ctx.fillRect(2,-1.6,15,3.2);
    ctx.strokeStyle='#4a3a22'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(13,-8); ctx.quadraticCurveTo(17,0,13,8); ctx.stroke();
    ctx.strokeStyle='#e8e0cc'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(13,-8); ctx.lineTo(8,0); ctx.lineTo(13,8); ctx.stroke(); ctx.restore();
    break; }
  case 'frostmite': {
    shadowAt(0,9,10,2.8);
    ctx.strokeStyle=K('#8cc8f0'); ctx.lineWidth=1.6;
    for(const sd of [-1,1]) for(let i=0;i<3;i++){ const ph=Math.sin(t*1.6+i*1.9+(sd>0?0:3))*2; ctx.beginPath(); ctx.moveTo(sd*4,-1+i*3); ctx.lineTo(sd*(10+i),-4+i*4+ph*0.4); ctx.lineTo(sd*(13+i),3+i*3+ph); ctx.stroke(); }
    ctx.strokeStyle=OUT; ctx.lineWidth=1;
    ctx.fillStyle=K('#bfeaff'); ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(8,-3); ctx.lineTo(6,7); ctx.lineTo(-6,7); ctx.lineTo(-8,-3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#e8f8ff'); ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(4,-2); ctx.lineTo(0,5); ctx.lineTo(-4,-2); ctx.closePath(); ctx.fill();
    ctx.fillStyle=K('#9fd8f0'); for(const x of [-6,-2,2,6]){ ctx.beginPath(); ctx.moveTo(x-1.4,-5); ctx.lineTo(x,-12-Math.abs(x)*0.2); ctx.lineTo(x+1.4,-5); ctx.fill(); }
    if(!flash){ ctx.fillStyle='#2a7aff'; circ(-2.6,0,1.4); ctx.fill(); circ(2.6,0,1.4); ctx.fill(); }
    break; }
  case 'cinderhound': {
    const f = face==='left'?-1:1, lg = Math.sin(t*2.2)*2.4;
    shadowAt(0,11,13,3);
    ctx.scale(f,1);
    ctx.fillStyle=K('#4a1a10'); for(const [x,l] of [[-9,lg],[-4,-lg],[5,lg],[10,-lg]]) ctx.fillRect(x-1.5,6,3,6+l*0.3);
    ctx.fillStyle=K('#2a1210'); ell(-1,1,13,7.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#c2461e'); ctx.beginPath(); ctx.moveTo(-9,-3); ctx.quadraticCurveTo(-3,-7,4,-3); ctx.quadraticCurveTo(-3,3,-9,-3); ctx.fill();
    if(!flash){ ctx.fillStyle='rgba(255,170,50,0.9)'; for(let i=0;i<4;i++){ const ph=Math.sin(now*9+i*1.7), x=-8+i*4.5; ctx.beginPath(); ctx.moveTo(x-2,-5); ctx.quadraticCurveTo(x,-10-ph*2.4,x+2,-5); ctx.fill(); } }
    ctx.fillStyle=K('#3a1a12'); ell(11,0,6.4,5.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#e86a2a'); ell(15.5,2,2.6,2); ctx.fill();
    ctx.fillStyle=K('#2a1210'); ctx.beginPath(); ctx.moveTo(8,-4); ctx.lineTo(7,-9); ctx.lineTo(11,-5); ctx.fill();
    if(!flash){ ctx.fillStyle='#ffd34a'; circ(11,-1,1.3); ctx.fill(); }
    ctx.fillStyle='#fff'; ctx.fillRect(13,3.2,1.2,2); ctx.fillRect(15,3.2,1.2,2);
    ctx.strokeStyle=K('#c2461e'); ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(-12,-1); ctx.quadraticCurveTo(-17,-7,-15,-11); ctx.stroke();
    break; }
  case 'pyromancer': {
    shadowAt(0,12,9,3);
    ctx.fillStyle=K('#6a1a10'); ctx.beginPath(); ctx.moveTo(-5,-6); ctx.lineTo(5,-6); ctx.lineTo(10,12); ctx.lineTo(-10,12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#ff7a2a'); ctx.fillRect(-9,6,18,2.4);
    ctx.fillStyle=K('#8a2a14'); ctx.beginPath(); ctx.moveTo(-7,-7); ctx.lineTo(0,-19); ctx.lineTo(7,-7); ctx.lineTo(5,-3); ctx.lineTo(-5,-3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=flash?'#fff':'#14060a'; ell(0,-6,3.6,3); ctx.fill();
    if(!flash){ ctx.fillStyle='#ffd34a'; circ(-1.6,-6.4,1); ctx.fill(); circ(1.6,-6.4,1); ctx.fill(); }
    const fl = Math.sin(now*8+e.x);
    ctx.strokeStyle='#5a3a1a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(10,12); ctx.lineTo(10,-10); ctx.stroke();
    if(!flash){ ctx.fillStyle='rgba(255,120,30,0.9)'; ctx.beginPath(); ctx.moveTo(6.5,-10); ctx.quadraticCurveTo(7,-16-fl*2,10,-20-fl*2); ctx.quadraticCurveTo(13,-16,13.5,-10); ctx.closePath(); ctx.fill(); ctx.fillStyle='#ffe28a'; circ(10,-12,2.2); ctx.fill(); }
    break; }
  case 'blizzardmage': {
    shadowAt(0,12,9,3);
    ctx.fillStyle=K('#2e5a9a'); ctx.beginPath(); ctx.moveTo(-5,-6); ctx.lineTo(5,-6); ctx.lineTo(10,12); ctx.lineTo(-10,12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#e8f6ff'); ctx.fillRect(-9,7,18,2.4);
    ctx.fillStyle=K('#4a7ac0'); ctx.beginPath(); ctx.moveTo(-7,-7); ctx.lineTo(0,-18); ctx.lineTo(7,-7); ctx.lineTo(5,-3); ctx.lineTo(-5,-3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#f2f8fc'); ctx.beginPath(); ctx.moveTo(-4,-4); ctx.quadraticCurveTo(0,6,4,-4); ctx.closePath(); ctx.fill();
    ctx.fillStyle=flash?'#fff':'#0a1226'; ell(0,-7,3.4,2.6); ctx.fill();
    if(!flash){ ctx.fillStyle='#9fe8ff'; circ(-1.5,-7.2,0.9); ctx.fill(); circ(1.5,-7.2,0.9); ctx.fill(); }
    ctx.strokeStyle='#7a9ab8'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-10,12); ctx.lineTo(-10,-10); ctx.stroke();
    ctx.fillStyle=K('#bfeaff'); ctx.beginPath(); ctx.moveTo(-10,-18); ctx.lineTo(-7,-13); ctx.lineTo(-10,-8); ctx.lineTo(-13,-13); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle='rgba(180,235,255,0.4)'; circ(-10,-13,8+Math.sin(now*4)*1.4); ctx.fill(); }
    break; }
  case 'venomtoad': {
    const f = face==='left'?-1:1, hop = Math.abs(Math.sin(t*1.3))*3;
    shadowAt(0,11,12,3);
    ctx.scale(f,1); ctx.translate(0,-hop);
    ctx.fillStyle=K('#3a6a1a'); ell(-8,9,5,3); ctx.fill(); ell(7,9,5,3); ctx.fill();
    ctx.fillStyle=K('#5a9a2a'); ell(0,3,12,9.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#7ac03a'); ell(0,6,8,4.4); ctx.fill();
    ctx.fillStyle=K('#8a2a9a'); for(const [x,y,r] of [[-6,-1,1.8],[-1,-3,2.2],[5,-1,1.8],[-3,3,1.4]]){ circ(x,y,r); ctx.fill(); }
    ctx.fillStyle=K('#6aaa2a'); ell(8,-3,6,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#e8f060'); circ(7,-8,2.8); ctx.fill(); circ(12,-7,2.4); ctx.fill();
    if(!flash){ ctx.fillStyle='#14080a'; circ(7,-8,1.2); ctx.fill(); circ(12,-7,1); ctx.fill(); }
    ctx.strokeStyle='#2a4a10'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(7,-1); ctx.quadraticCurveTo(11,1,14,-1); ctx.stroke();
    break; }
  case 'cursedbook': {
    const bob = Math.sin(now*3+e.x)*2.5, fl = Math.sin(now*10+e.x)*0.35;
    ctx.fillStyle='rgba(0,0,0,0.2)'; ell(0,14,8,2.4); ctx.fill();
    ctx.translate(0,-3+bob);
    if(!flash){ ctx.fillStyle='rgba(120,255,160,0.25)'; circ(0,0,15); ctx.fill(); }
    for(const sd of [-1,1]){
      ctx.save(); ctx.scale(sd,1); ctx.rotate(-0.15-fl*0.5);
      ctx.fillStyle=K('#6a2a8a'); ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(12,-7); ctx.lineTo(12,8); ctx.lineTo(0,10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle=K('#efe6c8'); ctx.beginPath(); ctx.moveTo(1,-7); ctx.lineTo(10.5,-5.4); ctx.lineTo(10.5,6.4); ctx.lineTo(1,8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(40,20,60,0.5)'; ctx.lineWidth=0.8; for(const y of [-3,0,3]){ ctx.beginPath(); ctx.moveTo(2.5,y); ctx.lineTo(9,y+0.6); ctx.stroke(); }
      ctx.restore();
    }
    ctx.strokeStyle=OUT; ctx.lineWidth=1;
    ctx.fillStyle=K('#4a1a6a'); ctx.fillRect(-1.4,-9,2.8,19);
    if(!flash){ ctx.fillStyle='#7aff9a'; circ(0,-1,2.6); ctx.fill(); ctx.fillStyle='#10301a'; circ(0,-1,1.1); ctx.fill(); }
    break; }
  default:
    ctx.fillStyle = K(e.color); circ(0,0,e.w/2); ctx.fill(); ctx.stroke();
  }
}

