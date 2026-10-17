// ---------- Отрисовка ----------
function tileColor(t, x, y){
  const flick = (x*31+y*17)%2===0;
  switch(t){
    case '.': return loc.type==='overworld' ? (flick?'#3f7d32':'#437f37') : (flick?'#4a4a55':'#4e4e5a');
    case '~': return flick?'#3f7d32':'#437f37'; // под водой в первом проходе рисуется трава
    case '^': return flick?'#6b6b6b':'#616161';
    case '#': return loc.type==='overworld' ? (flick?'#3f7d32':'#437f37') : '#232327';
    case '>': return '#241a10';
    case '<': return '#3a2f10';
    case 'S': case 'B': return flick?'#3f7d32':'#437f37';
    case 'v': return '#2a2a33';
    default: return '#000';
  }
}
function drawTile(t, sx, sy, x, y){
  ctx.fillStyle = tileColor(t,x,y);
  ctx.fillRect(sx, sy, TILE, TILE);
  if(t==='#' && loc.type==='overworld'){
    // крона рисуется отдельным проходом (drawTrees)
  } else if(t==='#'){
    ctx.fillStyle='rgba(255,255,255,0.05)';
    ctx.fillRect(sx,sy,TILE,3);
  } else if(t==='>'){
    ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(sx+TILE/2, sy+TILE/2+3, TILE*0.32, TILE*0.24, 0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#5c4415'; ctx.lineWidth=2; ctx.stroke();
  } else if(t==='S' || t==='B'){
    // рисуются отдельно (drawStallBody)
  } else if(t==='v'){
    const pulse = 0.5+0.5*Math.sin(Date.now()/300);
    ctx.fillStyle='#07030d';
    ctx.beginPath(); ctx.ellipse(sx+TILE/2, sy+TILE/2, TILE*0.42, TILE*0.36, 0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(201,168,255,'+(0.45+0.45*pulse)+')'; ctx.lineWidth=3; ctx.stroke(); ctx.lineWidth=1;
    ctx.fillStyle='rgba(122,79,189,'+(0.25+0.25*pulse)+')';
    ctx.beginPath(); ctx.ellipse(sx+TILE/2, sy+TILE/2, TILE*0.22, TILE*0.18, 0,0,Math.PI*2); ctx.fill();
  } else if(t==='<'){
    const pulse = 0.5+0.5*Math.sin(Date.now()/500);
    ctx.beginPath(); ctx.moveTo(sx+5,sy+31); ctx.lineTo(sx+5,sy+14); ctx.quadraticCurveTo(sx+5,sy+3,sx+16,sy+3); ctx.quadraticCurveTo(sx+27,sy+3,sx+27,sy+14); ctx.lineTo(sx+27,sy+31); ctx.closePath();
    const lg = ctx.createLinearGradient(0,sy+3,0,sy+31); lg.addColorStop(0,'rgba(255,236,160,'+(0.75+0.2*pulse)+')'); lg.addColorStop(1,'rgba(255,236,160,0.12)');
    ctx.fillStyle=lg; ctx.fill(); ctx.strokeStyle='#6b5a3a'; ctx.lineWidth=2.5; ctx.stroke(); ctx.lineWidth=1;
    ctx.fillStyle='rgba(60,45,20,0.75)'; ctx.beginPath(); ctx.moveTo(sx+16,sy+10); ctx.lineTo(sx+22,sy+19); ctx.lineTo(sx+18,sy+19); ctx.lineTo(sx+18,sy+26); ctx.lineTo(sx+14,sy+26); ctx.lineTo(sx+14,sy+19); ctx.lineTo(sx+10,sy+19); ctx.closePath(); ctx.fill();
  }
}

// ---------- Вода: единая плавная береговая линия ----------
// Маска воды размывается и «шумится» — берег изгибается, длинных прямых не остаётся.
// Столкновения по-прежнему считаются по клеткам, отклонение берега — несколько пикселей.
const WATER_SCALE = 2;                 // 1 клетка маски = 2 px мира
const waterLayers = new WeakMap();
function sstep(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
function hash2(ix,iy,seed){
  let h = (Math.imul(ix,374761393) + Math.imul(iy,668265263) + Math.imul(seed,1013904223))|0;
  h = Math.imul(h ^ (h>>>13), 1274126177);
  return ((h ^ (h>>>16))>>>0)/4294967296;
}
function vnoise(x,y,seed){
  const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy;
  const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=hash2(ix,iy,seed), b=hash2(ix+1,iy,seed), c=hash2(ix,iy+1,seed), d=hash2(ix+1,iy+1,seed);
  const top=a+(b-a)*u, bot=c+(d-c)*u;
  return top+(bot-top)*v;
}
function boxBlur(src,dst,W,H,r,vertical){
  const n = vertical ? W : H, len = vertical ? H : W, step = vertical ? W : 1, w = 2*r+1;
  for(let k=0;k<n;k++){
    const base = vertical ? k : k*W;
    let acc=0;
    for(let i=-r;i<=r;i++) if(i>=0 && i<len) acc += src[base+i*step];
    for(let i=0;i<len;i++){
      dst[base+i*step] = acc/w;
      const add=i+r+1, rem=i-r;
      if(add<len) acc += src[base+add*step];
      if(rem>=0) acc -= src[base+rem*step];
    }
  }
}
function buildWaterLayer(L){
  const cpt = TILE/WATER_SCALE, W = L.width*cpt, H = L.height*cpt;
  let a = new Float32Array(W*H), b = new Float32Array(W*H);
  for(let ty=0; ty<L.height; ty++) for(let tx=0; tx<L.width; tx++){
    if(L.grid[ty][tx]!=='~') continue;
    for(let yy=0; yy<cpt; yy++){ const row=(ty*cpt+yy)*W+tx*cpt; for(let xx=0; xx<cpt; xx++) a[row+xx]=1; }
  }
  for(let pass=0; pass<2; pass++){ boxBlur(a,b,W,H,6,false); boxBlur(b,a,W,H,6,true); }
  const cv = document.createElement('canvas'); cv.width=W; cv.height=H;
  const g = cv.getContext('2d'), img = g.createImageData(W,H), d = img.data;
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      let F = a[y*W+x];
      if(F<0.2) continue;
      F += (vnoise(x/28,y/28,11)-0.5)*0.26 + (vnoise(x/11,y/11,23)-0.5)*0.12 + (vnoise(x/60,y/60,5)-0.5)*0.22;
      const alpha = sstep(0.47,0.53,F);
      if(alpha<=0) continue;
      const t = sstep(0.55,0.95,F);               // мелководье светлее, глубина темнее
      const i = (y*W+x)*4;
      d[i]   = 74 + (40-74)*t;
      d[i+1] = 138 + (92-138)*t;
      d[i+2] = 182 + (140-182)*t;
      d[i+3] = alpha*255;
    }
  }
  g.putImageData(img,0,0);
  return cv;
}
function drawWater(x0,y0,x1,y1,camX,camY){
  let layer = waterLayers.get(loc);
  if(!layer){ layer = buildWaterLayer(loc); waterLayers.set(loc, layer); }
  const S = WATER_SCALE;
  const wx0 = Math.max(0,camX), wy0 = Math.max(0,camY);
  const wx1 = Math.min(loc.width*TILE, camX+canvas.width), wy1 = Math.min(loc.height*TILE, camY+canvas.height);
  if(wx1>wx0 && wy1>wy0){
    const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(layer, wx0/S, wy0/S, (wx1-wx0)/S, (wy1-wy0)/S, wx0-camX, wy0-camY, wx1-wx0, wy1-wy0);
    ctx.imageSmoothingEnabled = prev;
  }
  // лёгкая рябь на воде (только там, где вокруг клетки тоже вода)
  const tm = Date.now()/900, QA = Q().anim;
  if(QA>0){                                                           // пена и волны у берега, бегущие блики
    const t2 = Date.now()/1000;
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
      if(loc.grid[y][x]!=='~') continue;
      const sx = x*TILE-camX, sy = y*TILE-camY, ph = Math.sin(t2*1.6+x*0.8+y*0.5);
      const edges = [[0,-1,sx,sy,TILE,0],[0,1,sx,sy+TILE,TILE,0],[-1,0,sx,sy,0,TILE],[1,0,sx+TILE,sy,0,TILE]];
      for(const e of edges){
        if(isWater(x+e[0],y+e[1])) continue;
        const inw = (0.6+0.4*ph)*2.2*(e[0]||e[1]);                  // кромка то накатывает, то отходит
        ctx.strokeStyle = 'rgba(236,248,255,'+(0.28+0.22*ph)+')'; ctx.lineWidth = 2;
        ctx.beginPath();
        if(e[4]){ ctx.moveTo(e[2],e[3]-inw); for(let k=1;k<=4;k++) ctx.lineTo(e[2]+k*8, e[3]-inw+Math.sin(t2*2+k+x)*1.2); }
        else { ctx.moveTo(e[2]-inw,e[3]); for(let k=1;k<=4;k++) ctx.lineTo(e[2]-inw+Math.sin(t2*2+k+y)*1.2, e[3]+k*8); }
        ctx.stroke();
      }
      if(QA>1){ const h = ((x*2654435761) ^ (y*40503))>>>0; if(h%5===0){ const wv = (t2*0.35+(h%100)/100)%1; ctx.strokeStyle='rgba(255,255,255,'+(0.28*Math.sin(wv*3.1416))+')'; ctx.lineWidth=1.2; const ox = sx+4+wv*22, oy = sy+10+(h>>4)%12; ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+7,oy-1.2); ctx.stroke(); } }
    }
  }
  ctx.strokeStyle='rgba(190,225,248,0.25)'; ctx.lineWidth=1.5;
  for(let y=y0;y<y1;y++){
    for(let x=x0;x<x1;x++){
      if(loc.grid[y][x]!=='~') continue;
      const h = ((x*73856093) ^ (y*19349663)) >>> 0;
      if(h%4!==0 || !isWater(x-1,y) || !isWater(x+1,y) || !isWater(x,y-1) || !isWater(x,y+1)) continue;
      const ox = x*TILE-camX+6+(h>>3)%12, oy = y*TILE-camY+8+(h>>5)%14, wv = Math.sin(tm+(h%100))*1.5;
      ctx.beginPath(); ctx.moveTo(ox,oy+wv); ctx.quadraticCurveTo(ox+5,oy-3+wv,ox+10,oy+wv); ctx.stroke();
    }
  }
}
function isWater(x,y){ return y>=0 && x>=0 && y<loc.height && x<loc.width && loc.grid[y][x]==='~'; }

// ---------- Деревья: кроны с волнистым краем (вид сверху) ----------
const TREE_VARIANTS = 8;
let treeSprites = null;
function makeTreeSprites(){
  treeSprites = [];
  for(let v=0; v<TREE_VARIANTS; v++){
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    let seed = 1234567 + v*9973; const rnd = ()=>{ seed = (seed*1664525+1013904223)>>>0; return seed/4294967296; };
    const ph = [rnd()*6.283, rnd()*6.283, rnd()*6.283];
    const blob = (cx,cy,r0,wob)=>{
      g.beginPath();
      const N = 44;
      for(let i=0;i<=N;i++){
        const a = i/N*Math.PI*2;
        const r = r0*(1 + wob*(0.55*Math.sin(5*a+ph[0]) + 0.3*Math.sin(8*a+ph[1]) + 0.15*Math.sin(13*a+ph[2])));
        const px = cx+Math.cos(a)*r, py = cy+Math.sin(a)*r;
        if(i) g.lineTo(px,py); else g.moveTo(px,py);
      }
      g.closePath();
    };
    g.fillStyle='rgba(0,0,0,0.28)';  blob(35,37,18,0.16); g.fill();   // тень на траве
    g.fillStyle='#1b4a1b';           blob(32,32,18,0.16); g.fill();   // тёмный низ кроны
    g.fillStyle='#2a6a27';           blob(31,30,14.5,0.2); g.fill();  // основная крона
    g.fillStyle='#3d8a34';           blob(29,27,9.5,0.25); g.fill();  // освещённая часть
    g.fillStyle='rgba(140,205,100,0.5)';
    for(let i=0;i<7;i++){          // отдельные листья
      const a = rnd()*6.283, d = rnd()*10;
      g.beginPath(); g.arc(29+Math.cos(a)*d, 27+Math.sin(a)*d, 1.2+rnd()*1.4, 0, 6.283); g.fill();
    }
    treeSprites.push(c);
  }
}
function drawTrees(x0,y0,x1,y1,camX,camY){
  if(!treeSprites) makeTreeSprites();
  const tnow = Date.now()/1000;
  for(let y=y0;y<y1;y++){
    for(let x=x0;x<x1;x++){
      if(loc.grid[y][x]!=='#') continue;
      const h = ((x*73856093) ^ (y*19349663)) >>> 0;
      const jx = (h%5)-2, jy = ((h>>4)%5)-2;           // лёгкий сдвиг, чтобы лес не выглядел решёткой
      const sway = Math.sin(tnow*1.1+x*0.7+y*0.45)*1.3 + Math.sin(tnow*0.45+x*0.1)*0.8;   // ветер
      ctx.drawImage(treeSprites[h%TREE_VARIANTS], x*TILE-camX+TILE/2-32+jx+sway, y*TILE-camY+TILE/2-32+jy);
    }
  }
  const QA = Q().anim;                                                  // опадающие листья
  if(QA>0){
    const LC = ['#7fc45a','#a6c83e','#d8a62a','#c8642a'];
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
      if(loc.grid[y][x]!=='#') continue;
      const h = ((x*73856093) ^ (y*19349663)) >>> 0;
      if(h%(QA>1?5:11)!==0) continue;
      const ph = (tnow*0.16+(h%97)/97)%1, a = Math.sin(ph*3.1416);
      const lx = x*TILE-camX+TILE/2+Math.sin(ph*9+h)*13+ph*18, ly = y*TILE-camY+TILE/2+ph*46-6;
      ctx.save(); ctx.translate(lx,ly); ctx.rotate(ph*7+h); ctx.globalAlpha = a*0.9; ctx.fillStyle = LC[(h>>3)%4];
      ctx.beginPath(); ctx.ellipse(0,0,3,1.6,0,0,6.283); ctx.fill(); ctx.restore();
    }
  }
}

// ---------- Рисованные персонажи ----------
function circ(x,y,r){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); }
function ell(x,y,rx,ry,rot){ ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2); }
function rrect(x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function shadowAt(x,y,rx,ry){ ctx.fillStyle='rgba(0,0,0,0.28)'; ell(x,y,rx,ry); ctx.fill(); }

const SKIN = '#e8b98a';
const SKIN_D = '#c98f5f';
const HERO_PAL = {
  none:    { body:'#3b6fa8', dark:'#27507c', helm:'#6b4a2a', boots:'#3e2a1a', pants:'#5b4a3a' },
  leather: { body:'#a8702f', dark:'#6e4519', helm:'#8a5a2b', boots:'#3e2a1a', pants:'#5b4a3a' },
  chain:   { body:'#aab6c2', dark:'#6f7b88', helm:'#9aa6b2', boots:'#4a4f57', pants:'#5a6068' },
  plate:   { body:'#e0cb78', dark:'#a68b2f', helm:'#e8d27a', boots:'#7a6420', pants:'#8a7430' }
};
function heldWeapon(kind, hx, hy, side){
  ctx.save();
  if(kind==='hammer'||kind==='dagger'||kind==='staff'){ heldNew(kind, hx, hy, side); ctx.restore(); return; }
  if(kind==='axe'){
    ctx.fillStyle='#6a4a2a';
    if(side){
      ctx.translate(hx,hy); ctx.rotate(-0.7); ctx.fillRect(-4,-1,20,2);
      ctx.fillStyle='#c5cbd3'; ctx.strokeStyle='#2a2e34'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(11,-1); ctx.lineTo(17,-8); ctx.lineTo(20,-2); ctx.lineTo(17,5); ctx.lineTo(11,1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.fillRect(14,-5,1.5,5);
    } else {
      ctx.fillRect(hx-1,hy-17,2,25);
      ctx.fillStyle='#c5cbd3'; ctx.strokeStyle='#2a2e34'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(hx+1,hy-17); ctx.lineTo(hx+9,hy-20); ctx.lineTo(hx+9,hy-9); ctx.lineTo(hx+1,hy-12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.fillRect(hx+5,hy-18,1.4,6);
    }
  } else if(kind==='crossbow'){
    if(side){
      ctx.translate(hx,hy-1); ctx.fillStyle='#6a4a2a'; ctx.fillRect(-2,-1.5,17,3);
      ctx.strokeStyle='#4a3a22'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(12,-9); ctx.quadraticCurveTo(16,0,12,9); ctx.stroke();
      ctx.strokeStyle='#e8e0cc'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(12,-9); ctx.lineTo(5,0); ctx.lineTo(12,9); ctx.stroke();
      ctx.fillStyle='#dfe4ea'; ctx.beginPath(); ctx.moveTo(14,-1.4); ctx.lineTo(19,0); ctx.lineTo(14,1.4); ctx.fill();
    } else {
      ctx.fillStyle='#6a4a2a'; ctx.fillRect(hx-1.5,hy-14,3,18);
      ctx.strokeStyle='#4a3a22'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(hx-9,hy-11); ctx.quadraticCurveTo(hx,hy-15,hx+9,hy-11); ctx.stroke();
    }
  } else if(kind==='musket'){
    if(side){
      ctx.translate(hx,hy-1); ctx.fillStyle='#6a4a2a'; ctx.beginPath(); ctx.moveTo(-6,2); ctx.lineTo(4,-2); ctx.lineTo(8,-1); ctx.lineTo(8,1.5); ctx.lineTo(0,3.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#4a4e58'; ctx.fillRect(6,-1.8,18,2.6); ctx.fillStyle='#8a8e98'; ctx.fillRect(6,-1.8,18,0.9);
      ctx.fillStyle='#b8a060'; ctx.fillRect(10,-2.4,1.6,3.6); ctx.fillRect(18,-2.4,1.6,3.6);
    } else {
      ctx.fillStyle='#4a4e58'; ctx.fillRect(hx-1.4,hy-22,2.8,22); ctx.fillStyle='#6a4a2a'; ctx.fillRect(hx-2,hy-2,4,9);
    }
  } else if(kind==='bow'){
    ctx.strokeStyle='#7a5a32'; ctx.lineWidth=2.2;
    if(side){
      ctx.translate(hx+1,hy-1); ctx.beginPath(); ctx.arc(5,0,11,-1.15,1.15); ctx.stroke();
      ctx.strokeStyle='#e8e0cc'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(5+11*Math.cos(-1.15),11*Math.sin(-1.15)); ctx.lineTo(5+11*Math.cos(1.15),11*Math.sin(1.15)); ctx.stroke();
      ctx.strokeStyle='#caa86a'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(1,0); ctx.lineTo(13,0); ctx.stroke();
      ctx.fillStyle='#dfe4ea'; ctx.beginPath(); ctx.moveTo(13,-1.8); ctx.lineTo(17,0); ctx.lineTo(13,1.8); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(hx-5,hy-6,12,-1.15,1.15); ctx.stroke();
      ctx.strokeStyle='#e8e0cc'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(hx-5+12*Math.cos(-1.15),hy-6+12*Math.sin(-1.15)); ctx.lineTo(hx-5+12*Math.cos(1.15),hy-6+12*Math.sin(1.15)); ctx.stroke();
    }
  } else if(kind==='spear'){
    ctx.fillStyle='#8a6a3a';
    if(side){ ctx.translate(hx,hy); ctx.rotate(-0.35); ctx.fillRect(-6,-0.9,26,1.8);
      ctx.fillStyle='#e9edf2'; ctx.beginPath(); ctx.moveTo(20,-2.4); ctx.lineTo(27,0); ctx.lineTo(20,2.4); ctx.closePath(); ctx.fill(); }
    else { ctx.fillRect(hx-0.9,hy-20,1.8,28);
      ctx.fillStyle='#e9edf2'; ctx.beginPath(); ctx.moveTo(hx-2.4,hy-20); ctx.lineTo(hx,hy-27); ctx.lineTo(hx+2.4,hy-20); ctx.closePath(); ctx.fill(); }
  } else {
    if(side){ ctx.translate(hx,hy); ctx.rotate(-0.8);
      ctx.fillStyle='#dfe4ea'; ctx.fillRect(0,-1.1,13,2.2); ctx.fillStyle='#8a6c2a'; ctx.fillRect(-1,-3.4,2.2,6.8);
      ctx.fillStyle='#5a3a1e'; ctx.fillRect(-4,-0.9,3,1.8); }
    else { ctx.fillStyle='#dfe4ea'; ctx.fillRect(hx-1.1,hy-15,2.2,14);
      ctx.fillStyle='#8a6c2a'; ctx.fillRect(hx-3.4,hy-2,6.8,2.2); ctx.fillStyle='#5a3a1e'; ctx.fillRect(hx-0.9,hy,1.8,3.5); }
  }
  ctx.restore();
}
function drawHero(sx,sy){
  const flash = player.invuln>0 && Math.floor(Date.now()/80)%2===0;
  const K = c => flash ? '#ffffff' : c;
  const pal = HERO_PAL[player.armor] || HERO_PAL.none;
  const cx = sx+player.w/2, cy = sy+player.h/2;
  const dir = player.dir, side = dir==='left'||dir==='right', back = dir==='up';
  const sw = Math.sin(player.walkT||0)*3;
  shadowAt(cx, cy+11.5, 9, 3.5);
  ctx.save(); ctx.translate(cx,cy - (player.walkT ? Math.abs(Math.sin(player.walkT))*1.2 : 0)); if(dir==='left') ctx.scale(-1,1);
  ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,0.35)';
  const hideW = player.attacking;
  if(!side){
    const leg=(x,sh)=>{ const h=8+sh; ctx.fillStyle=K(pal.pants); ctx.fillRect(x,3,5,h); ctx.fillStyle=K(player.boots?'#e0a830':pal.boots); ctx.fillRect(x-0.5,3+h-3,6,3); };
    leg(-6,sw*0.55); leg(1,-sw*0.55);
    ctx.fillStyle=K(pal.body); rrect(-7,-7,14,11,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K(pal.dark); ctx.fillRect(-7,1,14,2);
    if(player.armor==='plate'){ ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fillRect(-1,-6,2,7); }
    if(player.armor==='chain'){ ctx.fillStyle='rgba(255,255,255,0.3)'; for(let i=0;i<3;i++) for(let j=0;j<4;j++) ctx.fillRect(-5+j*3.2+(i%2)*1.6,-5+i*2.6,1.4,1.4); }
    const arm=(x,sh)=>{ ctx.fillStyle=K(pal.body); rrect(x,-6+sh,3.6,9,1.6); ctx.fill(); ctx.stroke(); ctx.fillStyle=K(SKIN); circ(x+1.8,4+sh,2.1); ctx.fill(); };
    arm(-10.6,-sw*0.5); arm(7,sw*0.5);
    if(!hideW) heldWeapon(player.weapon, 8.8, 4+sw*0.5, false);
  } else {
    const leg=(x)=>{ ctx.fillStyle=K(pal.pants); ctx.fillRect(x-2,3,4,8); ctx.fillStyle=K(player.boots?'#e0a830':pal.boots); ctx.fillRect(x-2,8,5.5,3); };
    ctx.globalAlpha = 0.85; leg(-1.5-sw*0.8); ctx.globalAlpha = 1; leg(1.5+sw*0.8);
    ctx.fillStyle=K(pal.body); rrect(-5,-7,10,11,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K(pal.dark); ctx.fillRect(-5,1,10,2);
    const ax = -2-sw*0.7;
    ctx.fillStyle=K(pal.body); rrect(ax,-6,4,9,1.8); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K(SKIN); circ(ax+2,4,2.1); ctx.fill();
    if(!hideW) heldWeapon(player.weapon, ax+3, 4, true);
  }
  // голова / шлем
  ctx.save(); ctx.translate(side?1:0,-12);
  ctx.fillStyle=K(pal.helm); circ(0,0,7.8); ctx.fill(); ctx.stroke();
  if(!back){
    ctx.fillStyle=K(SKIN);
    if(!side){ ell(0,1.7,5.4,5.5); ctx.fill(); ctx.fillStyle='#2a1a10'; circ(-2.4,0.8,1.1); ctx.fill(); circ(2.4,0.8,1.1); ctx.fill(); }
    else { ell(3,1.7,4.4,5.4); ctx.fill(); ctx.fillStyle='#2a1a10'; circ(4.7,0.8,1.1); ctx.fill(); }
    if(player.armor==='chain'||player.armor==='plate'){ // наносник шлема
      ctx.fillStyle=K(pal.dark); if(!side) ctx.fillRect(-1,-4,2,7); else ctx.fillRect(6.4,-3,1.8,6);
    }
  }
  if(player.armor==='plate'){ ctx.fillStyle=K('#c0392b'); ell(side?-2:0,-8.2,2.4,3.6, side?-0.6:0); ctx.fill(); }  // плюмаж
  if(player.armor==='leather'){ ctx.fillStyle=K(pal.dark); ctx.fillRect(-7.6,-2.6,15.2,1.6); }                    // ремешок шапки
  ctx.restore();
  ctx.restore();
}
function drawAttackFx(sx,sy){
  const cx=sx+player.w/2, cy=sy+player.h/2;
  const vx = player.dir==='left'?-1:player.dir==='right'?1:0, vy = player.dir==='up'?-1:player.dir==='down'?1:0;
  const ang = Math.atan2(vy,vx);
  ctx.save(); ctx.lineCap='round';
  if(newAttackFx(cx,cy,vx,vy,ang)){ /* новое оружие */ }
  else if(player.weapon==='musket'){
    ctx.fillStyle='rgba(255,238,170,0.95)'; ctx.beginPath(); ctx.arc(cx+vx*26,cy+vy*26,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,170,60,0.8)'; ctx.beginPath(); ctx.arc(cx+vx*32,cy+vy*32,4.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#4a4e58'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx+vx*6,cy+vy*6); ctx.lineTo(cx+vx*22,cy+vy*22); ctx.stroke();
  } else if(player.weapon==='crossbow'){
    ctx.strokeStyle='#4a3a22'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx+vx*14,cy+vy*14,10,ang-1.5,ang+1.5); ctx.stroke();
    ctx.strokeStyle='#6a4a2a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx+vx*4,cy+vy*4); ctx.lineTo(cx+vx*20,cy+vy*20); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx+vx*28,cy+vy*28,3,0,Math.PI*2); ctx.fill();
  } else if(player.weapon==='bow'){
    ctx.strokeStyle='#7a5a32'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.arc(cx+vx*9,cy+vy*9,13,ang-1.15,ang+1.15); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(cx+vx*9+13*Math.cos(ang-1.15),cy+vy*9+13*Math.sin(ang-1.15)); ctx.lineTo(cx+vx*5,cy+vy*5); ctx.lineTo(cx+vx*9+13*Math.cos(ang+1.15),cy+vy*9+13*Math.sin(ang+1.15)); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(cx+vx*24,cy+vy*24,3,0,Math.PI*2); ctx.fill();
  } else if(player.weapon==='axe'){
    ctx.strokeStyle='rgba(255,243,214,0.92)'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.arc(cx,cy,31,ang-1.35,ang+1.35); ctx.stroke();
    ctx.strokeStyle='rgba(255,210,122,0.65)'; ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.arc(cx,cy,24,ang-1.2,ang+1.2); ctx.stroke();
    ctx.strokeStyle='#c5cbd3'; ctx.lineWidth=3.2;
    ctx.beginPath(); ctx.moveTo(cx+vx*6,cy+vy*6); ctx.lineTo(cx+vx*28,cy+vy*28); ctx.stroke();
    ctx.save(); ctx.translate(cx+vx*30,cy+vy*30); ctx.rotate(ang);
    ctx.fillStyle='#e4e8ee'; ctx.strokeStyle='#2a2e34'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-3,-2); ctx.lineTo(3,-9); ctx.lineTo(8,0); ctx.lineTo(3,9); ctx.lineTo(-3,2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  } else if(player.weapon==='spear'){
    ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(cx+vx*6,cy+vy*6); ctx.lineTo(cx+vx*36,cy+vy*36); ctx.stroke();
    ctx.translate(cx+vx*36,cy+vy*36); ctx.rotate(ang);
    ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.moveTo(-3,-4); ctx.lineTo(8,0); ctx.lineTo(-3,4); ctx.closePath(); ctx.fill();
  } else {
    ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.arc(cx,cy,25,ang-0.95,ang+0.95); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(cx,cy,19,ang-0.8,ang+0.8); ctx.stroke();
    ctx.strokeStyle='#dfe4ea'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(cx+vx*8,cy+vy*8); ctx.lineTo(cx+vx*24,cy+vy*24); ctx.stroke();
  }
  ctx.restore();
}

// ---- враги ----
function drawEnemy(e, sx, sy){
  const flash = e.hitFlash>0;
  const K = c => flash ? '#ffffff' : c;
  const cx = sx+e.w/2, cy = sy+e.h/2;
  const t = (e.walkT||0), now = Date.now()/1000;
  const sw = Math.sin(t)*2.5;
  const face = e.face==='left' ? -1 : 1;
  ctx.save(); ctx.translate(cx,cy);
  if(e.big){ secretAura(e); ctx.scale(e.big,e.big); }
  ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,0.4)';

  if(e.type==='wolf'||e.type==='icewolf'){
    const ICEW = {'#5f5f66': '#7a95b0', '#8a8a93': '#b4cbe0', '#c9c9d0': '#f0f8ff', '#76767e': '#94b0c8', '#9a9aa3': '#c6d9ea', '#b0b0b8': '#dcebf7', '#6d6d75': '#8aa6c0'}, wc = c => e.type==='icewolf' ? ICEW[c] : c;
    ctx.scale(face*0.82,0.82);
    shadowAt(0,9,13,3.2);
    const leg=(x,sh,col)=>{ ctx.fillStyle=K(col); rrect(x-1.6,2,3.2,7+sh,1.2); ctx.fill(); };
    leg(-8+sw,0,wc('#5f5f66')); leg(5-sw,0,wc('#5f5f66'));
    ctx.strokeStyle=K(wc('#8a8a93')); ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-10,-1); ctx.quadraticCurveTo(-17,-3,-16,-8+Math.sin(now*5)*1.5); ctx.stroke(); ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,0.4)';
    ctx.fillStyle=K(wc('#8a8a93')); ell(-1,0,11,6.2); ctx.fill();
    ctx.fillStyle=K(wc('#c9c9d0')); ell(-1,3,8,2.6); ctx.fill();
    leg(-6-sw,0,wc('#76767e')); leg(7+sw,0,wc('#76767e'));
    ctx.fillStyle=K(wc('#9a9aa3')); ell(10,-2.5,5.5,4.8); ctx.fill();
    ctx.fillStyle=K(wc('#b0b0b8')); rrect(12.5,-2.8,6.5,4.2,1.8); ctx.fill();
    ctx.fillStyle='#1a1a1e'; circ(18.8,-1.6,1.3); ctx.fill();
    ctx.fillStyle=K(wc('#6d6d75')); ctx.beginPath(); ctx.moveTo(7.5,-6); ctx.lineTo(8.8,-11); ctx.lineTo(11,-6.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(11,-6.6); ctx.lineTo(13.4,-10.6); ctx.lineTo(14,-5.6); ctx.fill();
    ctx.fillStyle = e.type==='icewolf' ? (e.moving ? '#58d8ff' : '#d8f4ff') : (e.moving ? '#ff4a3a' : '#ffd34a'); circ(11.5,-3.6,1.2); ctx.fill();
    if(e.moving){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(15,1.2); ctx.lineTo(16,3.4); ctx.lineTo(17,1.2); ctx.fill(); }
  }
  else if(e.type==='slime' || e.type==='lavaslime'){ drawOoze(e,K,flash,now,t,e.type==='slime'?OOZE_TOXIC:OOZE_LAVA); }
  else if(e.type==='skeleton'){
    shadowAt(0,11,8.5,3);
    const bone=K('#d8d3bd'), boneD=K('#a39e86');
    ctx.fillStyle=bone; ctx.strokeStyle='rgba(0,0,0,0.45)';
    rrect(-4.8,3,2.6,8+sw*0.5,1); ctx.fill(); ctx.stroke(); rrect(2.2,3,2.6,8-sw*0.5,1); ctx.fill(); ctx.stroke();
    ctx.fillStyle=boneD; ctx.fillRect(-5.8,10+sw*0.5,4.6,1.8); ctx.fillRect(1.2,10-sw*0.5,4.6,1.8);
    ctx.fillStyle=bone; rrect(-5,0.5,10,3.2,1.2); ctx.fill(); ctx.stroke();
    rrect(-6,-8,12,10,3.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle=boneD; ctx.lineWidth=1.2;
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-4.5,-5.2+i*2.7); ctx.lineTo(4.5,-5.2+i*2.7); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,1); ctx.stroke();
    ctx.strokeStyle=bone; ctx.lineWidth=2.4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-6,-6); ctx.lineTo(-9.5,2+sw*0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,-6); ctx.lineTo(9.5,2-sw*0.4); ctx.stroke();
    ctx.fillStyle='#9a8f7a'; ctx.fillRect(8.6,-9+(-sw*0.4),2,13); ctx.fillStyle='#6b5a3a'; ctx.fillRect(6.8,2.2-sw*0.4,5.6,1.8);
    ctx.fillStyle=bone; ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,0.45)';
    circ(0,-13.5,6.4); ctx.fill(); ctx.stroke(); rrect(-3.8,-9.6,7.6,3.6,1.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#14110c'; circ(-2.5,-14,1.9); ctx.fill(); circ(2.5,-14,1.9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,-11.8); ctx.lineTo(-1,-10); ctx.lineTo(1,-10); ctx.fill();
    if(!flash){ ctx.fillStyle='#ff5a3a'; circ(-2.5,-14,0.8); ctx.fill(); circ(2.5,-14,0.8); ctx.fill(); }
    ctx.strokeStyle='#14110c'; ctx.lineWidth=0.8; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*1.4,-9.6); ctx.lineTo(i*1.4,-6.4); ctx.stroke(); }
  }
  else if(e.type==='wraith' || e.type==='frostwraith' || e.type==='banshee'){ drawGhost(e,K,flash,now,e.type==='wraith'?GHOST_DARK:e.type==='banshee'?GHOST_GRAVE:GHOST_ICE); }
  else if(e.type==='boss'){
    const tt = now*2.2 + e.x*0.02, sway = Math.sin(tt)*1.4;
    shadowAt(0,19,18,4.6);
    if(!flash){ const gr=ctx.createRadialGradient(0,-6,5,0,-6,40); gr.addColorStop(0,'rgba(120,255,150,0.26)'); gr.addColorStop(1,'rgba(120,255,150,0)'); ctx.fillStyle=gr; circ(0,-6,40); ctx.fill(); }
    const bone=K('#e4dfcb'), boneD=K('#a39d84'), boneS=K('#7a7560');
    ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1.1;
    // шипы-костяной воротник за головой
    ctx.fillStyle=bone;
    for(const [x,h,w] of [[-13,15,5],[-8,21,5],[0,25,6],[8,21,5],[13,15,5]]){ ctx.beginPath(); ctx.moveTo(x-w/2,-14); ctx.lineTo(x+(x>0?1:x<0?-1:0)*2,-14-h); ctx.lineTo(x+w/2,-14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // рваный алый плащ
    ctx.fillStyle=K('#5a0f1c');
    ctx.beginPath(); ctx.moveTo(-13,-12); ctx.lineTo(-22,12);
    for(let i=0;i<=8;i++){ const x=-22+i*5.5; ctx.lineTo(x, 17+(i%2?5:0)+Math.sin(tt*2+i)*1.6); }
    ctx.lineTo(22,12); ctx.lineTo(13,-12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#220309'); ctx.beginPath(); ctx.moveTo(-8,-10); ctx.lineTo(-12,16+sway*0.3); ctx.lineTo(12,16-sway*0.3); ctx.lineTo(8,-10); ctx.closePath(); ctx.fill();
    // ноги
    ctx.strokeStyle=bone; ctx.lineWidth=3.2;
    ctx.beginPath(); ctx.moveTo(-4,6); ctx.lineTo(-5,12+sw*0.4); ctx.lineTo(-6,18+sw*0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4,6); ctx.lineTo(5,12-sw*0.4); ctx.lineTo(6,18-sw*0.5); ctx.stroke();
    ctx.fillStyle=boneD; ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1; circ(-5,12+sw*0.4,2); ctx.fill(); circ(5,12-sw*0.4,2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9,18+sw*0.5); ctx.lineTo(-3,18+sw*0.5); ctx.lineTo(-4,20); ctx.lineTo(-10,20); ctx.fill(); ctx.beginPath(); ctx.moveTo(9,18-sw*0.5); ctx.lineTo(3,18-sw*0.5); ctx.lineTo(4,20); ctx.lineTo(10,20); ctx.fill();
    // грудная клетка с горящей душой
    ctx.fillStyle=flash?'#fff':'#14060a'; rrect(-9,-12,18,19,5); ctx.fill();
    if(!flash){ const gr=ctx.createRadialGradient(0,-4,1,0,-4,10); gr.addColorStop(0,'rgba(190,255,200,0.95)'); gr.addColorStop(0.5,'rgba(70,230,120,0.55)'); gr.addColorStop(1,'rgba(70,230,120,0)'); ctx.fillStyle=gr; circ(0,-4,10); ctx.fill(); }
    ctx.strokeStyle=bone; ctx.lineWidth=2.2;
    for(let i=0;i<5;i++){ const y=-10+i*3.9, w=8.6-i*0.7; ctx.beginPath(); ctx.moveTo(0,y); ctx.quadraticCurveTo(w*0.8,y-1.6,w,y+1.8); ctx.moveTo(0,y); ctx.quadraticCurveTo(-w*0.8,y-1.6,-w,y+1.8); ctx.stroke(); }
    ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(0,7); ctx.stroke();
    ctx.fillStyle=boneD; rrect(-6.5,6,13,3.6,1.5); ctx.fill();
    // плечи-черепа и руки
    for(const s of [-1,1]){
      ctx.fillStyle=bone; ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(s*8,-12); ctx.lineTo(s*15,-14); ctx.lineTo(s*17,-9); ctx.lineTo(s*10,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*12,-13); ctx.lineTo(s*14,-22); ctx.lineTo(s*16.5,-12); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*16,-10); ctx.lineTo(s*22,-17); ctx.lineTo(s*20,-7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle=bone; ctx.lineWidth=3; const sg=s>0?-1:1;
      ctx.beginPath(); ctx.moveTo(s*13,-8); ctx.lineTo(s*17,-1+sw*0.3*sg); ctx.lineTo(s*s*(s>0?15:-15),6+sw*0.4*sg); ctx.stroke();
      ctx.strokeStyle=boneD; ctx.lineWidth=1.3; const hx=s*15, hy=6+sw*0.4*sg;
      for(let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx+k*2.6+s*1.4,hy+5.5); ctx.stroke(); }
    }
    // огромный зазубренный меч
    const wy = -sw*0.4;
    ctx.fillStyle=K('#aeb6c0'); ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(14.4,7+wy); ctx.lineTo(13.2,-26+wy); ctx.lineTo(15,-37+wy); ctx.lineTo(17,-26+wy); ctx.lineTo(16.4,7+wy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#6a727c'); ctx.beginPath(); ctx.moveTo(15,-36+wy); ctx.lineTo(16.8,-26+wy); ctx.lineTo(16.2,7+wy); ctx.lineTo(15,7+wy); ctx.closePath(); ctx.fill();
    ctx.fillStyle=K('#aeb6c0'); for(const y of [-24,-17,-10]){ ctx.beginPath(); ctx.moveTo(13.2,y+wy); ctx.lineTo(10.6,y+2.2+wy); ctx.lineTo(13.2,y+4.4+wy); ctx.fill(); }
    if(!flash){ ctx.fillStyle='rgba(120,10,20,0.75)'; ctx.beginPath(); ctx.moveTo(13.4,-21+wy); ctx.lineTo(16.8,-21+wy); ctx.lineTo(16.6,-12+wy); ctx.lineTo(13.8,-14+wy); ctx.fill(); }
    ctx.fillStyle=K('#3a2a18'); ctx.fillRect(9.4,7+wy,10.6,2.8); ctx.fillStyle=K('#d8c8a0'); circ(15.4,13.4+wy,2.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#14110c'); circ(14.6,13+wy,0.7); ctx.fill(); circ(16.4,13+wy,0.7); ctx.fill();
    // череп
    ctx.fillStyle=bone; ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1.1;
    ell(0,-20,8.8,10); ctx.fill(); ctx.stroke();
    ctx.fillStyle=boneD; ctx.beginPath(); ctx.moveTo(-8,-18); ctx.lineTo(-5,-13); ctx.lineTo(-7,-12); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(8,-18); ctx.lineTo(5,-13); ctx.lineTo(7,-12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-1,-29); ctx.lineTo(1.2,-25); ctx.lineTo(-0.6,-22.5); ctx.lineTo(0.8,-21); ctx.stroke();   // трещина
    ctx.fillStyle=flash?'#fff':'#0a0306'; ell(-3.7,-20.5,3.2,4.2,0.28); ctx.fill(); ell(3.7,-20.5,3.2,4.2,-0.28); ctx.fill();
    if(!flash){ flameAt(-3.7,-19.2,4.6,9+Math.sin(tt*5)*1.6,tt*5,'#ff4a14','#ffd84a'); flameAt(3.7,-19.2,4.6,9+Math.sin(tt*5+1)*1.6,tt*5+1,'#ff4a14','#ffd84a'); }
    ctx.fillStyle='#0a0306'; ctx.beginPath(); ctx.moveTo(0,-16.6); ctx.lineTo(-1.8,-13.4); ctx.lineTo(1.8,-13.4); ctx.closePath(); ctx.fill();
    // челюсть с клыками
    const jaw = 1.4+Math.abs(Math.sin(tt*1.3))*1.6;
    ctx.fillStyle=bone; ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1; rrect(-5.6,-12+jaw,11.2,5,2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#0a0306'; ctx.fillRect(-5,-12.6,10,jaw+0.8);
    ctx.fillStyle='#f4f0dc'; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*2-1,-12.8); ctx.lineTo(i*2+1,-12.8); ctx.lineTo(i*2,-12.8+(i%2?3.4:2.4)); ctx.fill(); ctx.beginPath(); ctx.moveTo(i*2-1,-12+jaw); ctx.lineTo(i*2+1,-12+jaw); ctx.lineTo(i*2,-12+jaw-(i%2?2.4:3.4)); ctx.fill(); }
    // железная корона с шипами
    ctx.fillStyle=K('#5c616c'); ctx.strokeStyle='rgba(0,0,0,0.65)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-8.8,-26.6); ctx.lineTo(-9.4,-37); ctx.lineTo(-5.4,-31); ctx.lineTo(-2.8,-40); ctx.lineTo(0,-32); ctx.lineTo(2.8,-40); ctx.lineTo(5.4,-31); ctx.lineTo(9.4,-37); ctx.lineTo(8.8,-26.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#c9a23a'); ctx.fillRect(-8.8,-28.4,17.6,2.4);
    if(!flash){ ctx.fillStyle='#e0262e'; circ(0,-27.2,1.5); ctx.fill(); ctx.fillStyle='#46e08a'; circ(-5,-27.2,1); ctx.fill(); circ(5,-27.2,1); ctx.fill(); }
  }
  else if(e.type==='shadowlord'){
    const tt = now*1.8 + e.x*0.02;
    ctx.translate(0,Math.sin(tt)*2);
    if(!flash){ const gr=ctx.createRadialGradient(0,-2,4,0,-2,32); gr.addColorStop(0,'rgba(150,70,220,0.38)'); gr.addColorStop(1,'rgba(150,70,220,0)'); ctx.fillStyle=gr; circ(0,-2,32); ctx.fill(); }
    ctx.strokeStyle='rgba(0,0,0,0.55)'; ctx.lineWidth=1.2;
    ctx.fillStyle=K('#2a1240');
    ctx.beginPath(); ctx.moveTo(-13,-14);
    ctx.bezierCurveTo(-20,0,-22,10,-19,18);
    for(let x=-19;x<=19;x+=3.2) ctx.lineTo(x, 19+Math.sin(x*0.6+tt*3)*2.8);
    ctx.bezierCurveTo(22,10,20,0,13,-14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=K('#1a0a2a'); ctx.beginPath(); ctx.moveTo(-8,-6); ctx.quadraticCurveTo(0,4,8,-6); ctx.lineTo(10,16); ctx.lineTo(-10,16); ctx.closePath(); ctx.fill();
    ctx.fillStyle=K('#2a1240'); circ(0,-15,10.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle=flash?'#fff':'#07030d'; ell(0,-14,6.4,7); ctx.fill();
    if(!flash){ ctx.fillStyle='#d28bff'; ell(-2.8,-14.8,1.7,2.4); ctx.fill(); ell(2.8,-14.8,1.7,2.4); ctx.fill(); }
    ctx.fillStyle=K('#bdb5c9'); ctx.strokeStyle='rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.moveTo(-7,-22); ctx.bezierCurveTo(-11,-27,-16,-28,-15,-35); ctx.bezierCurveTo(-12,-31,-9,-30,-4,-24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7,-22); ctx.bezierCurveTo(11,-27,16,-28,15,-35); ctx.bezierCurveTo(12,-31,9,-30,4,-24); ctx.closePath(); ctx.fill(); ctx.stroke();
    // парящие тёмные шары в руках
    for(let i=0;i<2;i++){
      const sgn = i? 1 : -1, ox = sgn*(21+Math.sin(tt*2+i)*2), oy = 2+Math.cos(tt*2+i*2)*3;
      ctx.fillStyle=K('#3b1a5c'); circ(ox,oy,4.4); ctx.fill();
      if(!flash){ ctx.fillStyle='rgba(210,139,255,0.7)'; circ(ox,oy,2.2); ctx.fill(); }
    }
  }
  else { drawEnemyExtra(e,K,flash,now,t,sw,face); }
  ctx.restore();
}

