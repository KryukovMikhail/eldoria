// ---------- Город: отрисовка (слой рисуется один раз) ----------
function rrectG(g,x,y,w,h,r){ g.beginPath(); if(g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); }
function townTree(g,tx,ty){
  const x = tx*TILE+16, y = ty*TILE+16, R = (k)=>hash2(tx,ty,1200+k);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x+3,y+12,13,5,0,0,6.283); g.fill();
  g.fillStyle = '#5a3d22'; g.strokeStyle = '#2a1a0c'; g.lineWidth = 1; g.fillRect(x-3,y-2,6,15); g.strokeRect(x-3,y-2,6,15);
  const cols = ['#2f6a2a','#3c7e30','#2a5e26'];
  for(const [dx,dy,r,c] of [[-8,-8,10,0],[8,-8,10,2],[0,-17,12,1],[0,-6,11,0],[-4,-14,8,1],[6,-13,8,2]]){
    g.fillStyle = cols[c]; g.strokeStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.arc(x+dx,y+dy,r,0,6.283); g.fill(); g.stroke();
  }
  g.fillStyle = 'rgba(190,240,120,0.35)'; g.beginPath(); g.ellipse(x-4,y-20,6,3.4,-0.3,0,6.283); g.fill();
  if(R(1)<0.25){ g.fillStyle = '#d83a3a'; for(const [dx,dy] of [[-6,-10],[5,-6],[1,-16]]){ g.beginPath(); g.arc(x+dx,y+dy,1.8,0,6.283); g.fill(); } }
}
function townLamp(g,tx,ty){
  const x = tx*TILE+16, y = ty*TILE+30;
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x+2,y,6,2.4,0,0,6.283); g.fill();
  g.fillStyle = '#3a2d22'; g.fillRect(x-1.5,y-30,3,30); g.fillRect(x-4,y-1,8,2);
  const gr = g.createRadialGradient(x,y-34,1,x,y-34,14); gr.addColorStop(0,'rgba(255,210,120,0.5)'); gr.addColorStop(1,'rgba(255,210,120,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x,y-34,14,0,6.283); g.fill();
  g.fillStyle = '#2a2a30'; g.fillRect(x-4.5,y-38,9,2); g.fillRect(x-4.5,y-29,9,2);
  g.fillStyle = '#ffd36a'; g.fillRect(x-3,y-36,6,7); g.fillStyle = 'rgba(255,255,230,0.8)'; g.fillRect(x-1.2,y-35,2.4,4);
}
function townHouse(g,h){
  const T = TILE, x = h.x*T, y = h.y*T, w = 6*T, hh = 4*T;
  g.fillStyle = 'rgba(0,0,0,0.26)'; g.beginPath(); g.ellipse(x+w/2+8,y+hh+2,w/2+10,8,0,0,6.283); g.fill();
  const wy = y+2*T-8, wh = 2*T+8;
  g.fillStyle = h.wall; g.fillRect(x+4,wy,w-8,wh);
  g.fillStyle = 'rgba(0,0,0,0.07)'; for(let i=0;i<14;i++){ g.fillRect(x+6+hash2(h.x,i,1300)*(w-24), wy+hash2(h.y,i,1301)*(wh-6), 14, 3); }
  g.strokeStyle = '#5a4028'; g.lineWidth = 3; g.strokeRect(x+4,wy,w-8,wh);
  g.lineWidth = 2.4; for(let k=1;k<4;k++){ g.beginPath(); g.moveTo(x+4+k*(w-8)/4,wy); g.lineTo(x+4+k*(w-8)/4,wy+wh); g.stroke(); }
  g.beginPath(); g.moveTo(x+4,wy+16); g.lineTo(x+w-4,wy+16); g.stroke();
  for(const wx of [x+30, x+w-58]){                                                  // окна
    g.fillStyle = '#5a4028'; g.fillRect(wx-3,wy+22,32,30);
    g.fillStyle = hash2(h.x,h.y,1302)<0.7 ? '#f2c870' : '#3a4a68'; g.fillRect(wx,wy+25,26,24);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(wx+2,wy+27,7,10);
    g.strokeStyle = '#5a4028'; g.lineWidth = 2; g.beginPath(); g.moveTo(wx+13,wy+25); g.lineTo(wx+13,wy+49); g.moveTo(wx,wy+37); g.lineTo(wx+26,wy+37); g.stroke();
    g.fillStyle = '#6a8a4a'; g.fillRect(wx-3,wy+51,32,5); g.fillStyle = '#d85a7a'; for(let k=0;k<4;k++){ g.beginPath(); g.arc(wx+2+k*8,wy+51,2.2,0,6.283); g.fill(); }   // ящик с цветами
  }
  const dx0 = (h.x+3)*T, dy0 = (h.y+3)*T;                                            // дверь
  g.fillStyle = '#8a7e6e'; g.fillRect(dx0-2,dy0+27,T+4,6);
  g.fillStyle = '#4a3320'; rrectG(g,dx0+1,dy0-14,T-2,T+16,[12,12,0,0]); g.fill();
  g.fillStyle = '#6a4828'; rrectG(g,dx0+3,dy0-11,T-6,T+14,[10,10,0,0]); g.fill();
  g.strokeStyle = '#3a2614'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(dx0+16,dy0-10); g.lineTo(dx0+16,dy0+27); g.moveTo(dx0+9,dy0-4); g.lineTo(dx0+9,dy0+27); g.moveTo(dx0+23,dy0-4); g.lineTo(dx0+23,dy0+27); g.stroke();
  g.fillStyle = '#e0b84a'; g.beginPath(); g.arc(dx0+21,dy0+12,1.8,0,6.283); g.fill();
  if(h.sign){                                                                        // вывеска
    const sx = dx0+T+2, sy = dy0-26;
    g.strokeStyle = '#2a1a0c'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx-6,sy-4); g.lineTo(sx+14,sy-4); g.stroke();
    g.fillStyle = '#4e3b2a'; rrectG(g,sx,sy-2,24,20,3); g.fill(); g.strokeStyle = '#241a10'; g.lineWidth = 1; g.stroke();
    if(h.sign==='inn'){ g.fillStyle = '#e8c873'; g.fillRect(sx+7,sy+4,9,10); g.strokeStyle = '#e8c873'; g.lineWidth = 2; g.beginPath(); g.arc(sx+17,sy+9,3.2,-1.4,1.4); g.stroke(); g.fillStyle = '#fff'; g.fillRect(sx+7,sy+4,9,3); }
    else if(h.sign==='home'){ g.strokeStyle = '#e8c873'; g.lineWidth = 2.2; g.beginPath(); g.arc(sx+9,sy+9,4,0,6.283); g.moveTo(sx+13,sy+9); g.lineTo(sx+20,sy+9); g.moveTo(sx+17,sy+9); g.lineTo(sx+17,sy+14); g.moveTo(sx+20,sy+9); g.lineTo(sx+20,sy+13); g.stroke(); }
    else if(h.sign==='arena'){ g.strokeStyle = '#e8c873'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(sx+5,sy+4); g.lineTo(sx+19,sy+16); g.moveTo(sx+19,sy+4); g.lineTo(sx+5,sy+16); g.stroke(); g.fillStyle = '#c0392b'; g.beginPath(); g.arc(sx+12,sy+10,2.4,0,6.283); g.fill(); }
    else { g.fillStyle = '#8ad8a8'; g.beginPath(); g.arc(sx+12,sy+11,5.5,0,6.283); g.fill(); g.fillStyle = '#d9e6ee'; g.fillRect(sx+10,sy+2,4,6); g.fillStyle = '#fff'; g.fillRect(sx+8,sy+9,2,2); }
  }
  // крыша с черепицей
  const rt = y-14, rb = wy+10, L0 = x-10, R0 = x+w+10, tl = x+16, tr = x+w-16;
  const gr = g.createLinearGradient(0,rt,0,rb); gr.addColorStop(0,h.roof); gr.addColorStop(1,'rgba(0,0,0,0.5)');
  g.beginPath(); g.moveTo(L0,rb); g.lineTo(tl,rt); g.lineTo(tr,rt); g.lineTo(R0,rb); g.closePath();
  g.fillStyle = h.roof; g.fill(); g.fillStyle = gr; g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1;
  g.save(); g.clip();
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1.2;
  for(let r=0, yy=rt+8; yy<rb+6; r++, yy+=10){
    g.beginPath(); g.moveTo(L0,yy); g.lineTo(R0,yy); g.stroke();
    for(let xx=L0+(r%2?7:0); xx<R0; xx+=14){ g.beginPath(); g.moveTo(xx,yy); g.lineTo(xx,yy-10); g.stroke(); }
  }
  g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(L0,rt,R0-L0,6);
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(L0,rb); g.lineTo(tl,rt); g.lineTo(tr,rt); g.lineTo(R0,rb); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(L0+2,rb,R0-L0-4,5);                    // тень свеса
  const cx = x+w-52;                                                                  // труба
  g.fillStyle = '#7a6e62'; g.strokeStyle = '#2a2420'; g.lineWidth = 1; g.fillRect(cx,rt-10,14,26); g.strokeRect(cx,rt-10,14,26); g.fillStyle = '#4a423a'; g.fillRect(cx-2,rt-13,18,5);
  g.fillStyle = 'rgba(210,210,215,0.35)'; for(const [dx,dy,r] of [[7,-20,5],[11,-30,6.5],[5,-40,7.5]]){ g.beginPath(); g.arc(cx+dx,rt+dy,r,0,6.283); g.fill(); }
}
function townFountain(g,p){
  const x = (p.tx+1)*TILE, y = (p.ty+1)*TILE;
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x+3,y+5,34,24,0,0,6.283); g.fill();
  g.fillStyle = '#8a8478'; g.strokeStyle = '#2a2824'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x,y,31,23,0,0,6.283); g.fill(); g.stroke();
  g.fillStyle = '#a8a294'; g.beginPath(); g.ellipse(x,y-2,28,19.5,0,0,6.283); g.fill();
  g.fillStyle = '#4a98c8'; g.beginPath(); g.ellipse(x,y-2,24,16,0,0,6.283); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(x-8,y-6,9,3,-0.2,0,6.283); g.fill();
  g.fillStyle = '#8a8478'; g.strokeStyle = '#2a2824'; g.beginPath(); g.ellipse(x,y-3,7,5,0,0,6.283); g.fill(); g.stroke(); g.fillRect(x-3,y-18,6,15); g.strokeRect(x-3,y-18,6,15);
  g.fillStyle = '#a8a294'; g.beginPath(); g.ellipse(x,y-18,8,3.4,0,0,6.283); g.fill(); g.stroke();
  g.fillStyle = 'rgba(200,235,255,0.7)'; for(const [dx,dy,r] of [[0,-24,2.4],[-5,-21,1.6],[5,-21,1.6],[-8,-14,1.4],[8,-14,1.4]]){ g.beginPath(); g.arc(x+dx,y+dy,r,0,6.283); g.fill(); }
}
function townWell(g,p){
  const x = (p.tx+1)*TILE, y = (p.ty+1)*TILE;
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x+3,y+12,24,10,0,0,6.283); g.fill();
  g.fillStyle = '#7a746a'; g.strokeStyle = '#2a2824'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x,y+4,22,15,0,0,6.283); g.fill(); g.stroke();
  g.fillStyle = '#0c1a28'; g.beginPath(); g.ellipse(x,y+2,15,9.5,0,0,6.283); g.fill();
  g.fillStyle = '#5a4028'; g.fillRect(x-19,y-22,4,26); g.fillRect(x+15,y-22,4,26);
  g.fillStyle = '#6a4828'; g.fillRect(x-22,y-26,44,5); g.strokeRect(x-22,y-26,44,5);
  g.fillStyle = '#9a3b2e'; g.beginPath(); g.moveTo(x-26,y-26); g.lineTo(x,y-40); g.lineTo(x+26,y-26); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = '#d8c8a0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x,y-24); g.lineTo(x,y-6); g.stroke(); g.fillStyle = '#7a5a30'; g.fillRect(x-3,y-8,6,5);
}
function buildTownLayer(L){
  const T = TILE, W = L.width*T, H = L.height*T, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), P = townPaths(L), mk = L.shop;
  for(let y=0;y<H;y+=8) for(let x=0;x<W;x+=8){
    const n = vnoise(x/60,y/60,11)*0.5 + vnoise(x/18,y/18,12)*0.5, k = (n-0.5)*26;
    g.fillStyle = 'rgb('+((74+k)|0)+','+((128+k)|0)+','+((58+k*0.8)|0)+')'; g.fillRect(x,y,8,8);
  }
  const wall = (x,y)=> x===0||y===0||x===L.width-1||y===L.height-1;
  const plaza = (x,y)=> mk && Math.hypot(x-mk.tx,y-(mk.ty+1))<=4.4;
  for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
    if(wall(tx,ty) && !(ty===L.height-1 && tx>=22 && tx<=24)) continue;
    const road = P[ty][tx] || plaza(tx,ty), x0 = tx*T, y0 = ty*T;
    if(road){
      g.fillStyle = 'rgb(138,128,112)'; g.fillRect(x0,y0,T,T);
      for(let j=0;j<2;j++) for(let i=0;i<2;i++){
        const R = hash2(tx*2+i,ty*2+j,1310), c = (150+R*30)|0;
        g.fillStyle = 'rgb('+c+','+((c-9)|0)+','+((c-24)|0)+')'; rrectG(g,x0+i*16+1,y0+j*16+1,14,14,4); g.fill();
      }
    } else if(L.grid[ty][tx]!=='#'){
      const R = (k)=>hash2(tx,ty,1320+k);
      if(R(0)<0.16){ g.strokeStyle = 'rgba(40,100,34,0.9)'; g.lineWidth = 1.2; const px = x0+6+R(1)*20, py = y0+14+R(2)*12; for(let k=-1;k<=1;k++){ g.beginPath(); g.moveTo(px,py); g.lineTo(px+k*2.4,py-5); g.stroke(); } }
      if(R(3)<0.035){ const px = x0+8+R(4)*16, py = y0+10+R(5)*14, c = ['#ffd34a','#ff7a9a','#ffffff','#c88aff'][(R(6)*4)|0]; g.fillStyle = c; for(let k=0;k<5;k++){ const a = k/5*6.283; g.beginPath(); g.arc(px+Math.cos(a)*2,py+Math.sin(a)*2,1.4,0,6.283); g.fill(); } g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(px,py,1,0,6.283); g.fill(); }
    }
  }
  // городская стена
  for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
    if(!wall(tx,ty) || (ty===L.height-1 && tx>=22 && tx<=24)) continue;
    const x0 = tx*T, y0 = ty*T;
    g.fillStyle = '#7e786c'; g.fillRect(x0,y0,T,T);
    g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 1;
    for(let r=0;r<4;r++){ const yy = y0+r*8; g.beginPath(); g.moveTo(x0,yy); g.lineTo(x0+T,yy); g.stroke(); const off = (r+tx+ty)%2 ? 8 : 0; for(let xx=x0+off; xx<x0+T; xx+=16){ g.beginPath(); g.moveTo(xx,yy); g.lineTo(xx,yy+8); g.stroke(); } }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0,y0,T,3);
    if(ty===0 && tx%2===0){ g.fillStyle = '#8e887a'; g.fillRect(x0+2,y0,T-4,6); }
  }
  // ворота: башни и створки
  const gy = (L.height-1)*T;
  for(const tx of [21,25]){
    const x0 = tx*T; g.fillStyle = '#6a655a'; g.fillRect(x0,gy-16,T,T+16); g.strokeStyle = '#2a2824'; g.lineWidth = 1.2; g.strokeRect(x0,gy-16,T,T+16);
    g.fillStyle = '#8e887a'; for(let k=0;k<3;k++) g.fillRect(x0+1+k*11,gy-22,8,7);
    g.fillStyle = '#16120e'; g.fillRect(x0+14,gy-6,4,12);
    g.fillStyle = '#a02a2a'; g.beginPath(); g.moveTo(x0+6,gy+8); g.lineTo(x0+26,gy+8); g.lineTo(x0+26,gy+28); g.lineTo(x0+16,gy+22); g.lineTo(x0+6,gy+28); g.closePath(); g.fill();
  }
  g.fillStyle = '#e8c873'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('ЭЛЬДОР', 23.5*T, gy-2); g.textAlign = 'left';
  for(const p of L.props) (p.k==='fountain' ? townFountain : townWell)(g,p);
  for(const l of L.lamps) townLamp(g,l.tx,l.ty);
  for(const h of L.houses) townHouse(g,h);
  for(const t of L.trees) townTree(g,t.tx,t.ty);
  return cv;
}

// ---------- Дома внутри ----------
function houseFurn(g,f,L){
  const T = TILE, x = f.tx*T, y = f.ty*T, w = f.w*T, h = f.h*T;
  const wood = (a,b,c,d,col)=>{ g.fillStyle = col||'#7d6850'; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1; g.fillRect(a,b,c,d); g.strokeRect(a,b,c,d); };
  const shadow = ()=>{ g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x+3,y+h-3,w,6); };
  switch(f.k){
    case 'bed': {
      shadow(); wood(x+2,y+2,w-4,h-4,'#5c4430'); g.fillStyle = '#f0eadc'; g.fillRect(x+5,y+5,w-10,18); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.strokeRect(x+5,y+5,w-10,18);
      g.fillStyle = '#b84a4a'; g.fillRect(x+5,y+26,w-10,h-34); g.strokeRect(x+5,y+26,w-10,h-34); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x+5,y+26,w-10,4);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(x+w/2,y+28); g.lineTo(x+w/2,y+h-9); g.stroke(); break; }
    case 'table': { shadow(); wood(x+4,y+8,w-8,h-14,'#8a6a44'); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x+6,y+10,w-12,3);
      g.fillStyle = '#c8c0a8'; g.beginPath(); g.arc(x+20,y+24,5,0,6.283); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.stroke(); g.fillStyle = '#a07a3a'; g.fillRect(x+w-30,y+20,7,9); g.fillRect(x+w-20,y+22,7,8);
      g.fillStyle = '#e8e0c8'; g.fillRect(x+w/2-2,y+14,4,8); g.fillStyle = '#ffd060'; g.beginPath(); g.ellipse(x+w/2,y+12,2,3.4,0,0,6.283); g.fill(); break; }
    case 'stool': wood(x+9,y+12,14,14,'#6a4e30'); break;
    case 'barrel': shadow(); g.fillStyle = '#6a4a2a'; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.ellipse(x+16,y+19,12,12,0,0,6.283); g.fill(); g.stroke(); g.fillStyle = '#8a6a40'; g.beginPath(); g.ellipse(x+16,y+14,11,8,0,0,6.283); g.fill(); g.stroke(); g.strokeStyle = '#2b2b30'; g.lineWidth = 2; g.beginPath(); g.ellipse(x+16,y+20,12,5,0,0,3.14); g.stroke(); break;
    case 'plant': shadow(); g.fillStyle = '#7a4a2a'; g.fillRect(x+9,y+18,14,12); for(let k=0;k<6;k++){ g.fillStyle = k%2?'#3c8a34':'#4c9a40'; g.beginPath(); g.ellipse(x+16+Math.cos(k)*7,y+12+Math.sin(k*2)*3,6,3,k,0,6.283); g.fill(); } break;
    case 'rug': { const col = L.kind==='inn' ? '#8a2e2e' : '#3a4a7a'; g.fillStyle = col; g.fillRect(x+4,y+4,w-8,h-8); g.strokeStyle = '#e8c873'; g.lineWidth = 2; g.strokeRect(x+9,y+9,w-18,h-18); g.fillStyle = 'rgba(232,200,115,0.5)'; for(let k=0;k<f.w;k++){ g.beginPath(); g.arc(x+16+k*T,y+h/2,5,0,6.283); g.fill(); } break; }
    case 'fire': { wood(x+2,y-8,w-4,T+8,'#6a645a'); g.fillStyle = '#1a1410'; g.fillRect(x+14,y+2,w-28,T-6); g.fillStyle = '#4a423a'; g.fillRect(x+6,y-12,w-12,6); g.strokeRect(x+6,y-12,w-12,6); g.fillStyle = '#5a3a1c'; g.fillRect(x+22,y+22,w-44,5); break; }
    case 'shelf': { wood(x+1,y-6,w-2,T+2,'#4a3420'); g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1; for(const yy of [y+6,y+19]){ g.fillStyle = '#7d6850'; g.fillRect(x+2,yy+7,w-4,3); }
      for(let k=0;k<f.w*2;k++){ const px = x+8+k*16, hs = hash2(f.tx+k,f.ty,1400), cols = ['#7a5a3a','#6e7f5a','#7a6a9a','#a85a4a','#4a8a9a']; g.fillStyle = cols[(hs*5)|0]; g.fillRect(px,y-1+(hs>0.5?0:12)-0,7,13-0); g.fillRect(px,y+11,7,0); if(hs>0.4){ g.fillRect(px+1,y+13,6,7); } } break; }
    case 'counter': { shadow(); wood(x+1,y+6,w-2,T-8,'#8a6a44'); g.fillStyle = '#a07e52'; g.fillRect(x+1,y+6,w-2,6); for(let k=0;k<f.w;k++){ const hs = hash2(f.tx+k,f.ty,1410); if(hs<0.6){ g.fillStyle = ['#d94a4a','#4ad8a8','#9a7aff','#f0c040'][(hs*10|0)%4]; g.beginPath(); g.arc(x+k*T+16,y+8,4,0,6.283); g.fill(); g.fillStyle = '#d9e6ee'; g.fillRect(x+k*T+14,y+1,4,4); } } break; }
    case 'cauldron': { shadow(); g.fillStyle = '#2a2a30'; g.strokeStyle = '#000'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x+w/2,y+h/2+8,26,22,0,0,6.283); g.fill(); g.stroke(); g.fillStyle = '#3a8a4a'; g.beginPath(); g.ellipse(x+w/2,y+h/2+2,21,14,0,0,6.283); g.fill(); g.fillStyle = 'rgba(180,255,190,0.4)'; g.beginPath(); g.ellipse(x+w/2-6,y+h/2-1,8,3,0,0,6.283); g.fill();
      g.strokeStyle = '#5a3a1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(x+w/2+4,y+h/2-4); g.lineTo(x+w/2+20,y+h/2-22); g.stroke(); break; }
    case 'chestbox': break;
  }
}
function buildHouseLayer(L){
  const T = TILE, W = L.width*T, H = L.height*T, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
    const x0 = tx*T, y0 = ty*T;
    for(let k=0;k<4;k++){ const R = hash2(tx*4+k,ty,1500), c = (118+R*22)|0; g.fillStyle = 'rgb('+c+','+((c*0.78)|0)+','+((c*0.52)|0)+')'; g.fillRect(x0+k*8,y0,8,T); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x0+k*8,y0,1,T); if(hash2(tx,ty*4+k,1501)<0.5) g.fillRect(x0+k*8,y0+hash2(tx,ty,1502+k)*28,8,1); }
  }
  for(const f of L.furn) if(f.k==='rug') houseFurn(g,f,L);
  for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
    if(!(tx===0||ty===0||tx===L.width-1||ty===L.height-1)) continue;
    const x0 = tx*T, y0 = ty*T;
    g.fillStyle = ty===0 ? '#6a5640' : '#3a2a1c'; g.fillRect(x0,y0,T,T);
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1; for(let k=1;k<4;k++){ g.beginPath(); g.moveTo(x0+k*8,y0); g.lineTo(x0+k*8,y0+T); g.stroke(); }
    if(ty===0){ g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x0,y0,T,3); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0,y0+T-5,T,5); }
  }
  for(const tx of (L.kind==='inn' ? [4,8] : [1,12])){                                  // окна в задней стене
    const x0 = tx*T; if(L.furn.some(f=>f.tx<=tx&&tx<f.tx+f.w&&f.ty===1)) continue;
    g.fillStyle = '#3a2a1c'; g.fillRect(x0+3,4,26,24); g.fillStyle = '#9ac8e8'; g.fillRect(x0+6,7,20,18); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x0+8,9,6,8);
    g.strokeStyle = '#3a2a1c'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0+16,7); g.lineTo(x0+16,25); g.moveTo(x0+6,16); g.lineTo(x0+26,16); g.stroke();
  }
  const dx = 7*T, dy = (L.height-1)*T;                                                   // дверь и коврик
  g.fillStyle = '#4a3320'; rrectG(g,dx+2,dy+2,T-4,T-2,[10,10,0,0]); g.fill(); g.fillStyle = '#6a4828'; rrectG(g,dx+4,dy+5,T-8,T-5,[8,8,0,0]); g.fill(); g.fillStyle = '#e0b84a'; g.beginPath(); g.arc(dx+23,dy+20,1.8,0,6.283); g.fill();
  g.fillStyle = '#7a4a2e'; g.fillRect(dx+3,(L.height-2)*T+8,T-6,16); g.strokeStyle = '#e8c873'; g.lineWidth = 1; g.strokeRect(dx+5.5,(L.height-2)*T+10.5,T-11,11);
  for(const f of L.furn) if(f.k!=='rug') houseFurn(g,f,L);
  return cv;
}
function drawHouseAnim(camX,camY){
  const now = Date.now()/1000;
  for(const f of loc.furn||[]){
    if(f.k==='fire'){
      const cx = (f.tx+1.5)*TILE-camX, cy = (f.ty+0.5)*TILE-camY, fl = 0.7+0.2*Math.sin(now*9)+0.1*Math.sin(now*17);
      if(!onScreen(cx-80,cy-80,160,160)) continue;
      for(const [dx,s] of [[-9,1],[0,1.3],[9,0.9]]){ const h = (12+Math.sin(now*11+dx)*3)*s; ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.moveTo(cx+dx-6,cy+7); ctx.quadraticCurveTo(cx+dx-7,cy-h*0.4,cx+dx,cy+7-h); ctx.quadraticCurveTo(cx+dx+7,cy-h*0.4,cx+dx+6,cy+7); ctx.fill(); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(cx+dx-3,cy+7); ctx.quadraticCurveTo(cx+dx-3,cy-h*0.2,cx+dx,cy+7-h*0.6); ctx.quadraticCurveTo(cx+dx+3,cy-h*0.2,cx+dx+3,cy+7); ctx.fill(); }
      const gr = ctx.createRadialGradient(cx,cy+20,6,cx,cy+20,120); gr.addColorStop(0,'rgba(255,150,50,'+(0.3*fl)+')'); gr.addColorStop(1,'rgba(255,150,50,0)'); ctx.fillStyle = gr; ctx.fillRect(cx-120,cy-100,240,240);
    } else if(f.k==='cauldron'){
      const cx = (f.tx+1)*TILE-camX, cy = (f.ty+1)*TILE-camY;
      if(!onScreen(cx-40,cy-60,80,100)) continue;
      for(let k=0;k<4;k++){ const t = (now*0.6+k/4)%1; ctx.fillStyle = 'rgba(180,255,190,'+(0.8*(1-t))+')'; ctx.beginPath(); ctx.arc(cx+Math.sin(k*2.3+now)*9, cy+2-t*36, 2+t*3, 0, 6.283); ctx.fill(); }
    }
  }
}
function drawChest(camX,camY){
  const c = loc.chest; if(!c) return;
  const x = c.tx*TILE-camX, y = c.ty*TILE-camY;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(x+17,y+29,13,4); ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = '#1a0e06';
  ctx.fillStyle = '#7a4a22'; rrect(x+3,y+13,26,15,2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8962a'; ctx.fillRect(x+3,y+18,26,3);
  if(c.opened){
    ctx.fillStyle = '#5a3416'; ctx.beginPath(); ctx.moveTo(x+3,y+13); ctx.lineTo(x+6,y+2); ctx.lineTo(x+26,y+2); ctx.lineTo(x+29,y+13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a0e06'; ctx.fillRect(x+5,y+14,22,5);
  } else {
    ctx.fillStyle = '#8a5a2a'; rrect(x+3,y+5,26,10,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8962a'; ctx.fillRect(x+3,y+9,26,3); ctx.fillRect(x+14,y+12,4,6);
    const p = 0.5+0.5*Math.sin(Date.now()/320); ctx.fillStyle = 'rgba(255,230,120,'+(0.25+0.25*p)+')'; ctx.beginPath(); ctx.arc(x+16,y+14,18,0,6.283); ctx.fill();
  }
}

// ---------- Жители города ----------
let folk = [], folkLoc = null, folkCells = [];
function spawnFolk(){
  folk = []; folkLoc = loc; folkCells = [];
  const P = townPaths(loc);
  for(let y=1;y<loc.height-1;y++) for(let x=1;x<loc.width-1;x++) if(P[y][x] && loc.grid[y][x]==='.') folkCells.push([x,y]);
  const cols = ['#7a4a8a','#3f6a8a','#8a5a3a','#5a7a4a','#a04a4a','#6a6a7a'], hair = ['#3a2414','#6a4a24','#b8883a','#222','#8a8a8a'];
  for(let i=0;i<6;i++){ const c = folkCells[rnd(0,folkCells.length-1)];
    folk.push({x:c[0]*TILE+9, y:c[1]*TILE+9, w:14, h:14, tx:null, ty:null, wait:rnd(0,3000), col:cols[i%cols.length], hair:hair[rnd(0,4)], face:1, walkT:0, moving:false, stuck:0}); }
}
function folkTick(dt){
  if(loc.biome!=='town') return;
  if(folkLoc!==loc) spawnFolk();
  for(const f of folk){
    if(f.wait>0){ f.wait -= dt*1000; f.moving = false; continue; }
    if(f.tx===null){
      const fx = f.x/TILE, fy = f.y/TILE, near = folkCells.filter(c=>Math.hypot(c[0]-fx,c[1]-fy)<10 && Math.hypot(c[0]-fx,c[1]-fy)>2);
      const c = near.length ? near[rnd(0,near.length-1)] : folkCells[rnd(0,folkCells.length-1)];
      f.tx = c[0]*TILE+9; f.ty = c[1]*TILE+9;
    }
    const dx = f.tx-f.x, dy = f.ty-f.y, d = Math.hypot(dx,dy);
    if(d<3){ f.tx = null; f.wait = rnd(1500,5000); f.moving = false; continue; }
    const ox = f.x, oy = f.y;
    tryMove(f, dx/d*30*dt, dy/d*30*dt, loc);
    if(Math.hypot(f.x-ox,f.y-oy) < 30*dt*0.3){ f.stuck += dt; if(f.stuck>1){ f.tx = null; f.wait = 300; f.stuck = 0; } } else f.stuck = 0;
    f.walkT += dt*8; f.moving = true; if(Math.abs(dx)>2) f.face = dx<0 ? -1 : 1;
  }
}
function drawFolk(camX,camY){
  if(loc.biome!=='town') return;
  for(const f of folk){
    const x = f.x-camX+7, y = f.y-camY+14;
    if(!onScreen(x-20,y-40,40,60)) continue;
    const sw = f.moving ? Math.sin(f.walkT)*2 : 0;
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(0,1,7,2.4); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-4,-4+0,3,5+sw*0.3); ctx.fillRect(1,-4,3,5-sw*0.3);
    ctx.fillStyle = f.col; rrect(-5.5,-14,11,12,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = f.col; ctx.fillRect(-7.5,-13,2.4,8+sw*0.2); ctx.fillRect(5.1,-13,2.4,8-sw*0.2);
    ctx.fillStyle = SKIN; circ(0,-19,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = f.hair; ctx.beginPath(); ctx.arc(0,-20,5.2,Math.PI,0); ctx.fill();
    ctx.fillStyle = '#2a1a10'; circ(1.6*f.face,-19,0.8); ctx.fill();
    ctx.restore();
  }
}

// ---------- Отдых в трактире и сундук ----------
let bedLock = false, restFade = 0;
function placesTick(dt){
  restFade = Math.max(0, restFade-dt*1000);
  const pcx = player.x+player.w/2, pcy = player.y+player.h/2;
  if(loc.bed){
    const d = Math.hypot(pcx-loc.bed.x, pcy-loc.bed.y);
    if(d>120) bedLock = false;
    else if(d<66 && !bedLock){
      bedLock = true;
      const night = darkness()>0.35;
      if(player.hp<player.maxHp || night){
        player.hp = player.maxHp; if(night) env.t = 0.27;
        restFade = 1400; SFX.play('levelup');
        addNote(night ? '🛏 Вы проспали до рассвета: здоровье восстановлено' : '🛏 Вы отдохнули: здоровье восстановлено', '#7fe07f');
        saveGame();
      } else addNote('Вы полны сил — отдыхать не нужно', '#e0c96a');
    }
  }
  if(loc.chest && !loc.chest.opened){
    if(Math.hypot(pcx-(loc.chest.tx+0.5)*TILE, pcy-(loc.chest.ty+0.5)*TILE)<56){
      loc.chest.opened = true; SFX.play('pickup');
      const gold = rnd(90,160); player.gold += gold; addNote('📦 Сундук: +'+gold+' золота', '#e0c96a');
      const k = ELIX_KEYS[rnd(0,4)];
      if(player.elix[k]<ELIX_MAX){ player.elix[k]++; addNote('⚗ Найдено: '+ELIX[k].name.toLowerCase(), ELIX[k].col); }
      if(player.bag.length<BAG_MAX){ const g = makeGear(5,1); player.bag.push(g); addNote('🎒 Найдено: '+g.name+' ('+RAR[g.rar].n.toLowerCase()+')', RAR[g.rar].c); }
      else { player.gold += 60; addNote('Сумка полна — вместо снаряжения +60 золота', '#e0a03a'); }
      saveGame();
    }
  }
}

// ---------- Ворота города (вход на поверхности) ----------
function makeTownGateSprite(){
  const c = document.createElement('canvas'); c.width = 76; c.height = 68; const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(38,59,32,7,0,0,6.283); g.fill();
  const stone = (x,y,w,h)=>{ g.fillStyle = '#8a857a'; g.strokeStyle = '#25221e'; g.lineWidth = 1.2; g.fillRect(x,y,w,h); g.strokeRect(x,y,w,h);
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.8; for(let yy=y+7; yy<y+h; yy+=7){ g.beginPath(); g.moveTo(x,yy); g.lineTo(x+w,yy); g.stroke(); for(let xx=x+((yy/7|0)%2?4:9); xx<x+w; xx+=10){ g.beginPath(); g.moveTo(xx,yy); g.lineTo(xx,yy-7); g.stroke(); } }
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x,y,w,2.5); };
  stone(23,24,30,34);                                                                 // стена над проёмом
  for(const x of [4,52]){                                                             // башни
    stone(x,12,20,46); g.fillStyle = '#9a948a'; for(let k=0;k<3;k++){ g.fillRect(x+1+k*7,6,5,7); g.strokeStyle = '#25221e'; g.strokeRect(x+1+k*7,6,5,7); }
    g.fillStyle = '#16120e'; g.fillRect(x+9,24,2.4,8);
    g.fillStyle = '#a02a2a'; g.strokeStyle = '#3a0c0c'; g.lineWidth = 1; g.beginPath(); g.moveTo(x+5,36); g.lineTo(x+15,36); g.lineTo(x+15,50); g.lineTo(x+10,46); g.lineTo(x+5,50); g.closePath(); g.fill(); g.stroke();
  }
  g.fillStyle = '#8e887a'; for(let k=0;k<3;k++){ g.fillRect(26+k*9,19,6,6); g.strokeStyle = '#25221e'; g.strokeRect(26+k*9,19,6,6); }
  g.beginPath(); g.moveTo(26,58); g.lineTo(26,42); g.quadraticCurveTo(26,30,38,30); g.quadraticCurveTo(50,30,50,42); g.lineTo(50,58); g.closePath();
  const gr = g.createLinearGradient(0,30,0,58); gr.addColorStop(0,'#ffcf7a'); gr.addColorStop(1,'#6a3a14'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#25221e'; g.lineWidth = 2.4; g.stroke();
  g.fillStyle = '#5a3a1c'; g.strokeStyle = '#25221e'; g.lineWidth = 1;                // створки
  g.beginPath(); g.moveTo(26,58); g.lineTo(26,43); g.lineTo(31,45); g.lineTo(31,58); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(50,58); g.lineTo(50,43); g.lineTo(45,45); g.lineTo(45,58); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#e8c873'; g.strokeStyle = '#4a3410'; g.beginPath(); g.moveTo(34,22); g.lineTo(42,22); g.lineTo(42,28); g.lineTo(38,31); g.lineTo(34,28); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#b8a888'; g.beginPath(); g.ellipse(38,59,14,2.6,0,0,6.283); g.fill();
  return c;
}

// ---------- Каменные подземелья (рисуются один раз и кешируются) ----------
const dungeonLayers = new WeakMap();
const DPAL = { 1:{f:[78,72,66],w:[38,34,30],a:[150,136,118]}, 2:{f:[64,70,84],w:[28,32,42],a:[124,138,166]}, 3:{f:[58,46,80],w:[24,18,38],a:[146,114,196]},
  4:{f:[66,40,38],w:[30,15,14],a:[176,104,84]}, 5:{f:[204,174,112],w:[136,98,56],a:[232,196,136]}, 6:{f:[184,210,228],w:[74,112,156],a:[228,244,254]},
  7:{f:[62,70,64],w:[24,30,28],a:[150,162,152]}, 8:{f:[52,100,46],w:[16,52,26],a:[120,200,90]},
  11:{f:[108,102,94],w:[72,52,44],a:[176,160,140]}, 12:{f:[96,66,48],w:[40,26,28],a:[170,130,100]} , 13:{f:[46,98,132],w:[18,44,78],a:[130,210,240]}, 14:{f:[206,214,228],w:[96,132,190],a:[255,255,255]}};
function buildDungeonLayer(L){
  if(L.biome==='town') return buildTownLayer(L);
  if(L.biome==='house') return buildHouseLayer(L);
  const W = L.width*TILE, H = L.height*TILE, P = DPAL[L.pal||L.level] || DPAL[1];
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const isF = (x,y)=> y>=0 && x>=0 && y<L.height && x<L.width && L.grid[y][x]!=='#';
  // пол: неровная каменная поверхность
  for(let y=0;y<H;y+=8) for(let x=0;x<W;x+=8){
    const n = vnoise(x/70,y/70,5)*0.5 + vnoise(x/22,y/22,8)*0.5, k = (n-0.5)*30;
    g.fillStyle = 'rgb('+((P.f[0]+k)|0)+','+((P.f[1]+k)|0)+','+((P.f[2]+k)|0)+')'; g.fillRect(x,y,8,8);
  }
  for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
    if(!isF(tx,ty)) continue;
    const x0 = tx*TILE, y0 = ty*TILE, R = (k)=>hash2(tx,ty,400+k);
    if(L.grid[ty][tx]==='L') continue;
    if(R(1)<0.14){                                           // трещины
      let px = x0+4+R(2)*24, py = y0+4+R(3)*24;
      g.strokeStyle='rgba(0,0,0,0.38)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(px,py);
      for(let i=0;i<3;i++){ px += (R(4+i)-0.4)*10; py += (R(8+i)-0.4)*9; g.lineTo(px,py); } g.stroke();
    }
    for(let i=0;i<3;i++){                                    // камешки
      if(R(12+i)>0.45 || (L.level>=11 && R(12+i)>0.12)) continue;
      const px = x0+3+R(15+i)*26, py = y0+3+R(18+i)*26, r = 1.8+R(21+i)*3;
      g.fillStyle='rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(px+1,py+1.4,r*1.2,r*0.7,0,0,Math.PI*2); g.fill();
      g.fillStyle='rgb('+((P.a[0]*0.8)|0)+','+((P.a[1]*0.8)|0)+','+((P.a[2]*0.8)|0)+')'; g.beginPath(); g.ellipse(px,py,r*1.15,r*0.8,0,0,Math.PI*2); g.fill();
      g.fillStyle='rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(px-r*0.3,py-r*0.25,r*0.5,r*0.25,0,0,Math.PI*2); g.fill();
    }
    if(L.level===1 && R(30)<0.08){ g.fillStyle='rgba(80,130,60,0.35)'; g.beginPath(); g.ellipse(x0+16,y0+18,9+R(31)*5,5,R(32),0,Math.PI*2); g.fill(); }   // мох
    if(L.level===5){                                                                                               // пустыня
      if(R(50)<0.55){ g.strokeStyle='rgba(120,88,40,0.2)'; g.lineWidth=1.2; const yy=y0+6+R(51)*20; g.beginPath(); g.moveTo(x0,yy); g.quadraticCurveTo(x0+10,yy-3-R(52)*3,x0+20,yy); g.quadraticCurveTo(x0+27,yy+2,x0+TILE,yy-1); g.stroke(); g.strokeStyle='rgba(255,240,190,0.18)'; g.beginPath(); g.moveTo(x0,yy+2.5); g.quadraticCurveTo(x0+10,yy-0.5,x0+20,yy+2.5); g.stroke(); }
      if(R(53)<0.035){ const px=x0+8+R(54)*16, py=y0+10+R(55)*14;                                                 // кактус
        g.fillStyle='rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(px+2,py+8,6,2.4,0,0,Math.PI*2); g.fill();
        g.fillStyle='#4a8a3a'; g.strokeStyle='#23501c'; g.lineWidth=1;
        g.beginPath(); g.roundRect ? g.roundRect(px-2.4,py-8,4.8,16,2.4) : g.rect(px-2.4,py-8,4.8,16); g.fill(); g.stroke();
        g.beginPath(); g.roundRect ? g.roundRect(px-8,py-3,4,7,2) : g.rect(px-8,py-3,4,7); g.fill(); g.stroke(); g.fillRect(px-6,py+2,4,2.4);
        g.beginPath(); g.roundRect ? g.roundRect(px+4,py-6,4,7,2) : g.rect(px+4,py-6,4,7); g.fill(); g.stroke(); g.fillRect(px+2,py-0.5,4,2.4);
        g.strokeStyle='rgba(200,240,160,0.5)'; g.beginPath(); g.moveTo(px,py-7); g.lineTo(px,py+6); g.stroke(); }
      else if(R(56)<0.014){ const px=x0+8+R(57)*16, py=y0+10+R(58)*14;                                            // череп в песке
        g.fillStyle='#e6e1cf'; g.strokeStyle='#5a5546'; g.lineWidth=1; g.beginPath(); g.arc(px,py,4.4,0,Math.PI*2); g.fill(); g.stroke(); g.fillRect(px-2.4,py+2.6,4.8,2.4);
        g.fillStyle='#14110c'; g.beginPath(); g.arc(px-1.7,py-0.4,1.1,0,Math.PI*2); g.arc(px+1.7,py-0.4,1.1,0,Math.PI*2); g.fill();
        g.strokeStyle='#d8d3bd'; g.lineWidth=2; g.beginPath(); g.moveTo(px+6,py+2); g.lineTo(px+13,py+5); g.stroke(); }
      else if(R(59)<0.04){ g.strokeStyle='rgba(120,100,40,0.8)'; g.lineWidth=1.1; const px=x0+6+R(60)*20, py=y0+12+R(61)*14; for(let k=-2;k<=2;k++){ g.beginPath(); g.moveTo(px,py); g.lineTo(px+k*2.2,py-6+Math.abs(k)); g.stroke(); } }
    }
    if(L.level===6){                                                                                               // ледяной край
      if(R(50)<0.2){ g.fillStyle='rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(x0+8+R(51)*16,y0+10+R(52)*14,6+R(53)*8,3+R(54)*3,R(55)*3,0,Math.PI*2); g.fill(); }
      if(R(56)<0.1){ g.strokeStyle='rgba(120,180,225,0.55)'; g.lineWidth=1; let px=x0+4+R(57)*24, py=y0+4+R(58)*24; g.beginPath(); g.moveTo(px,py); for(let k=0;k<3;k++){ px+=(R(59+k)-0.5)*12; py+=(R(62+k)-0.4)*9; g.lineTo(px,py); } g.stroke(); }
      if(R(65)<0.035){ const px=x0+8+R(66)*16, py=y0+10+R(67)*14;                                                  // ледяные кристаллы
        g.fillStyle='rgba(170,230,255,0.28)'; g.beginPath(); g.arc(px,py,9,0,Math.PI*2); g.fill();
        g.fillStyle='#bfe6ff'; g.strokeStyle='#2a5a8a'; g.lineWidth=1; g.beginPath(); g.moveTo(px-3.4,py+3); g.lineTo(px-1,py-8); g.lineTo(px+1.6,py+3); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(px+0.6,py+3); g.lineTo(px+3.4,py-5); g.lineTo(px+5.2,py+3); g.closePath(); g.fill(); g.stroke();
        g.fillStyle='rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(px-1.6,py-2); g.lineTo(px-1,py-6); g.lineTo(px-0.2,py-1); g.fill(); }
      else if(R(68)<0.03){ g.fillStyle='rgba(130,200,240,0.55)'; g.beginPath(); g.ellipse(x0+16,y0+17,9+R(69)*5,6,R(70),0,Math.PI*2); g.fill(); g.fillStyle='rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(x0+13,y0+14,3.5,1.5,-0.4,0,Math.PI*2); g.fill(); }
    }
    if(L.level===7){                                                                                               // кладбище
      if(R(50)<0.12){ g.fillStyle='rgba(30,60,36,0.35)'; g.beginPath(); g.ellipse(x0+16,y0+17,8+R(51)*6,4.5,R(52),0,Math.PI*2); g.fill(); }
      if(R(53)<0.05){ const px=x0+16+(R(54)-0.5)*10, py=y0+18+(R(55)-0.5)*8;                                      // надгробие
        g.fillStyle='rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(px+2,py+8,9,3,0,0,Math.PI*2); g.fill();
        g.fillStyle='#8a948c'; g.strokeStyle='#1c201e'; g.lineWidth=1; g.beginPath(); g.moveTo(px-6,py+8); g.lineTo(px-6,py-4); g.quadraticCurveTo(px,py-12,px+6,py-4); g.lineTo(px+6,py+8); g.closePath(); g.fill(); g.stroke();
        g.fillStyle='rgba(255,255,255,0.2)'; g.fillRect(px-4.5,py-4,2,10);
        g.strokeStyle='#3c443e'; g.lineWidth=1.2; g.beginPath(); g.moveTo(px,py-6); g.lineTo(px,py+1); g.moveTo(px-2.6,py-3.4); g.lineTo(px+2.6,py-3.4); g.stroke();
        g.fillStyle='rgba(70,120,60,0.6)'; g.beginPath(); g.ellipse(px+3,py+7,4,1.8,0,0,Math.PI*2); g.fill(); }
      else if(R(56)<0.025){ const px=x0+16+(R(57)-0.5)*10, py=y0+16;                                              // крест
        g.fillStyle='rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(px+2,py+10,7,2.4,0,0,Math.PI*2); g.fill();
        g.fillStyle='#6a5a40'; g.strokeStyle='#241c10'; g.lineWidth=1; g.fillRect(px-1.8,py-9,3.6,19); g.strokeRect(px-1.8,py-9,3.6,19); g.fillRect(px-6,py-5,12,3.4); g.strokeRect(px-6,py-5,12,3.4); }
      else if(R(58)<0.03){ g.strokeStyle='#d8d3bd'; g.lineWidth=2; g.lineCap='round'; const px=x0+8+R(59)*16, py=y0+10+R(60)*14; g.beginPath(); g.moveTo(px-5,py-2); g.lineTo(px+5,py+2); g.moveTo(px-4,py+3); g.lineTo(px+4,py-3); g.stroke(); g.fillStyle='#e6e1cf'; g.beginPath(); g.arc(px,py,2.6,0,Math.PI*2); g.fill(); }
      else if(R(61)<0.012){ const px=x0+16, py=y0+18; g.fillStyle='rgba(255,220,120,0.25)'; g.beginPath(); g.arc(px,py,9,0,Math.PI*2); g.fill(); g.fillStyle='#e8e0c8'; g.fillRect(px-1.6,py-2,3.2,6); g.fillStyle='#ffd060'; g.beginPath(); g.ellipse(px,py-4,1.6,2.8,0,0,Math.PI*2); g.fill(); }
    }
    if(L.level===8){                                                                                               // джунгли
      if(R(50)<0.25){ g.fillStyle='rgba(20,70,24,'+(0.25+R(51)*0.2)+')'; g.beginPath(); g.ellipse(x0+8+R(52)*16,y0+10+R(53)*14,5+R(54)*7,3+R(55)*3,R(56)*3,0,Math.PI*2); g.fill(); }
      if(R(57)<0.18){ g.strokeStyle='rgba(30,100,30,0.9)'; g.lineWidth=1.2; const px=x0+6+R(58)*20, py=y0+14+R(59)*12; for(let k=-2;k<=2;k++){ g.beginPath(); g.moveTo(px,py); g.quadraticCurveTo(px+k*3,py-5,px+k*4.4,py-3+Math.abs(k)*2.4); g.stroke(); } }
      if(R(60)<0.05){ const px=x0+8+R(61)*16, py=y0+10+R(62)*14, c=['#ff6a9a','#ffd34a','#ff8a3a','#c88aff'][(R(63)*4)|0];
        g.strokeStyle='#2a6a1a'; g.lineWidth=1.2; g.beginPath(); g.moveTo(px,py+5); g.lineTo(px,py); g.stroke();
        g.fillStyle=c; for(let k=0;k<5;k++){ const a=k/5*6.283; g.beginPath(); g.arc(px+Math.cos(a)*2.4,py+Math.sin(a)*2.4,1.7,0,6.283); g.fill(); } g.fillStyle='#fff3b0'; g.beginPath(); g.arc(px,py,1.3,0,6.283); g.fill(); }
      else if(R(64)<0.02){ const px=x0+16+(R(65)-0.5)*10, py=y0+18;                                               // светящийся гриб
        g.fillStyle='rgba(120,255,200,0.25)'; g.beginPath(); g.arc(px,py,10,0,6.283); g.fill();
        g.fillStyle='#e8e0c0'; g.fillRect(px-1.4,py-1,2.8,6); g.fillStyle='#4ae0b0'; g.strokeStyle='#0c4a38'; g.lineWidth=1; g.beginPath(); g.ellipse(px,py-2,5.4,3.6,0,Math.PI,0); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#d8fff0'; g.beginPath(); g.arc(px-1.6,py-3.6,0.9,0,6.283); g.arc(px+1.8,py-3,0.7,0,6.283); g.fill(); }
    }
    if(L.level===11){                                                                                              // булыжная мостовая
      g.strokeStyle='rgba(0,0,0,0.22)'; g.lineWidth=1;
      for(let k=0;k<2;k++){ const yy=y0+k*16+8; g.beginPath(); g.moveTo(x0,yy); g.lineTo(x0+TILE,yy); g.stroke(); const off=(k+tx)%2*8; for(let q=0;q<3;q++){ g.beginPath(); g.moveTo(x0+off+q*14,yy-8); g.lineTo(x0+off+q*14,yy+8); g.stroke(); } }
      if(R(50)<0.025){ const px=x0+16, py=y0+17; g.fillStyle='rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(px+2,py+9,8,2.6,0,0,Math.PI*2); g.fill(); g.fillStyle='#7a5430'; g.strokeStyle='#2a1a0c'; g.beginPath(); g.roundRect ? g.roundRect(px-7,py-8,14,16,3) : g.rect(px-7,py-8,14,16); g.fill(); g.stroke(); g.strokeStyle='#4a3018'; g.beginPath(); g.moveTo(px-7,py-3); g.lineTo(px+7,py-3); g.moveTo(px-7,py+3); g.lineTo(px+7,py+3); g.stroke(); }
      else if(R(52)<0.03){ g.fillStyle='rgba(90,120,70,0.4)'; g.beginPath(); g.ellipse(x0+8+R(53)*16,y0+10+R(54)*14,5+R(55)*5,3,R(56)*3,0,Math.PI*2); g.fill(); }
    }
    if(L.level===12){                                                                                              // дощатый пол, ковры, свечи
      g.strokeStyle='rgba(0,0,0,0.3)'; g.lineWidth=1; for(let k=1;k<4;k++){ g.beginPath(); g.moveTo(x0,y0+k*8); g.lineTo(x0+TILE,y0+k*8); g.stroke(); }
      g.beginPath(); g.moveTo(x0+((tx*7+ty*3)%3)*9+6,y0); g.lineTo(x0+((tx*7+ty*3)%3)*9+6,y0+8); g.stroke();
      if(((tx>>2)+(ty>>2))%5===0){ g.fillStyle='rgba(120,30,40,0.35)'; g.fillRect(x0,y0,TILE,TILE); g.strokeStyle='rgba(220,180,90,0.25)'; g.strokeRect(x0+3,y0+3,TILE-6,TILE-6); }
      if(R(50)<0.014){ const px=x0+16, py=y0+18; g.fillStyle='rgba(255,220,140,0.22)'; g.beginPath(); g.arc(px,py,11,0,Math.PI*2); g.fill(); g.fillStyle='#e8e0c8'; g.fillRect(px-1.6,py-2,3.2,6); g.fillStyle='#ffd060'; g.beginPath(); g.ellipse(px,py-4,1.6,2.8,0,0,Math.PI*2); g.fill(); }
      else if(R(52)<0.03){ g.strokeStyle='rgba(230,240,240,0.45)'; g.lineWidth=0.8; const px=x0+4+R(53)*20, py=y0+4+R(54)*20; for(let k=0;k<4;k++){ g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(k*0.8)*9,py+Math.sin(k*0.8)*9); g.stroke(); } }
    }
    if(L.level===3 && R(33)<0.05){                                                                                                                  // кристаллы
      const px = x0+8+R(34)*16, py = y0+10+R(35)*14;
      g.fillStyle='rgba(190,130,255,0.25)'; g.beginPath(); g.arc(px,py,8,0,Math.PI*2); g.fill();
      g.fillStyle='#a47be0'; g.strokeStyle='#241038'; g.lineWidth=1; g.beginPath(); g.moveTo(px-3,py+3); g.lineTo(px,py-6); g.lineTo(px+3,py+3); g.closePath(); g.fill(); g.stroke();
      g.fillStyle='rgba(255,255,255,0.4)'; g.beginPath(); g.moveTo(px-0.5,py-3); g.lineTo(px,py-5); g.lineTo(px+0.8,py-1); g.fill();
    }
  }
  // лавовые озёра: свечение на камне, остывшая корка, жидкий огонь
  if(L.level===4){
    const isL = (x,y)=> y>=0 && x>=0 && y<L.height && x<L.width && L.grid[y][x]==='L';
    for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
      if(!isL(tx,ty)) continue;
      const cx = tx*TILE+16, cy = ty*TILE+16, gr = g.createRadialGradient(cx,cy,6,cx,cy,52);
      gr.addColorStop(0,'rgba(255,110,20,0.34)'); gr.addColorStop(1,'rgba(255,110,20,0)');
      g.fillStyle = gr; g.fillRect(cx-52,cy-52,104,104);
    }
    const blob = (cx,cy,rad,sd)=>{                                  // неровное вытянутое пятно: у каждого своя форма, без контура
      const N = 16, pts = [], rot = hash2(sd,1,711)*6.28, sx = 0.75+0.7*hash2(sd,2,712), sy = 0.75+0.5*hash2(sd,3,713), cr = Math.cos(rot), sr = Math.sin(rot);
      for(let i=0;i<N;i++){ const a = i/N*Math.PI*2, r = rad*(0.62+0.7*hash2(sd,i,710)), px = Math.cos(a)*r*sx, py = Math.sin(a)*r*sy; pts.push([cx+px*cr-py*sr, cy+px*sr+py*cr]); }
      g.beginPath(); g.moveTo((pts[0][0]+pts[N-1][0])/2,(pts[0][1]+pts[N-1][1])/2);
      for(let i=0;i<N;i++){ const a = pts[i], b = pts[(i+1)%N]; g.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2); }
      g.closePath(); g.fill();
    };
    for(const [rad,col,dx] of [[22,'rgba(255,92,24,0.30)',0],[18,'#c43a0a',1],[11,'#e8620f',2]]){
      g.fillStyle = col;
      for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
        if(!isL(tx,ty)) continue;
        const sd = tx*131+ty*17+dx, jx = (hash2(tx,ty,720)-0.5)*9, jy = (hash2(tx,ty,721)-0.5)*9, cx = tx*TILE+16+jx, cy = ty*TILE+16+jy;
        blob(cx,cy,rad*(0.9+0.28*hash2(tx,ty,722)),sd);
        if(isL(tx+1,ty)) blob(tx*TILE+32+(hash2(tx,ty,723)-0.5)*6,ty*TILE+16+(hash2(tx,ty,724)-0.5)*10,rad*0.9,sd+5);
        if(isL(tx,ty+1)) blob(tx*TILE+16+(hash2(tx,ty,725)-0.5)*10,ty*TILE+32+(hash2(tx,ty,726)-0.5)*6,rad*0.9,sd+9);
        if(isL(tx+1,ty+1) && isL(tx+1,ty) && isL(tx,ty+1)) blob(tx*TILE+32,ty*TILE+32,rad*0.85,sd+13);
      }
    }
    for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
      if(!isL(tx,ty)) continue;
      const R = (k)=>hash2(tx,ty,700+k);
      for(let i=0;i<5;i++){
        const px = tx*TILE+4+R(i*3)*24, py = ty*TILE+4+R(i*3+1)*24, r = 2.5+R(i*3+2)*4.5;
        g.fillStyle = R(i+20)<0.5 ? 'rgba(255,150,30,0.8)' : 'rgba(255,214,90,0.7)'; g.beginPath(); g.arc(px,py,r,0,Math.PI*2); g.fill();
      }
    }
  }
  // стены: тёмная масса + валуны
  for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
    if(isF(tx,ty)) continue;
    g.fillStyle = 'rgb('+P.w[0]+','+P.w[1]+','+P.w[2]+')'; g.fillRect(tx*TILE,ty*TILE,TILE,TILE);
  }
  for(let ty=0;ty<L.height;ty++) for(let tx=0;tx<L.width;tx++){
    if(isF(tx,ty)) continue;
    const R = (k)=>hash2(tx,ty,500+k);
    if(L.biome==='city' && L.level===11 && tx>=2 && ty>=2 && tx<L.width-2 && ty<L.height-2){                       // дома с крышами (вид сверху)
      const x0 = tx*TILE, y0 = ty*TILE, wl = (x,y)=>!isF(x,y);
      const cols = [[176,76,54],[128,92,70],[78,92,120],[138,62,62],[98,114,88],[150,112,66]];
      const c = cols[(hash2(tx>>2,ty>>2,777)*cols.length)|0], sh = 0.92+0.16*hash2(tx,ty,778);
      g.fillStyle = 'rgb('+((c[0]*sh)|0)+','+((c[1]*sh)|0)+','+((c[2]*sh)|0)+')'; g.fillRect(x0,y0,TILE,TILE);
      for(let k=0;k<4;k++){                                                                                     // ряды черепицы
        const yy = y0+k*8, off = (k+tx)%2*8;
        g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0,yy+7.5); g.lineTo(x0+TILE,yy+7.5); g.stroke();
        for(let q=0;q<3;q++){ g.beginPath(); g.arc(x0+off+q*16-4,yy+0.5,8,0.15,Math.PI-0.15); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,'+(0.05+0.03*(k%2))+')'; g.fillRect(x0,yy,TILE,3);
      }
      let up = 0, dn = 0; while(wl(tx,ty-up-1) && up<8) up++; while(wl(tx,ty+dn+1) && dn<8) dn++;
      const hh = up+dn+1, mid = (hh-1)/2;
      if(hh>=2){ const ry = hh%2===1 ? (up===mid ? y0+16 : -1) : (up===hh/2-1 ? y0+32 : -1);
        if(ry>=0){ g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0,ry+1,TILE,3); g.fillStyle = 'rgba(255,236,200,0.5)'; g.fillRect(x0,ry-2,TILE,3); } }
      g.fillStyle = 'rgba(0,0,0,0.38)';
      if(!wl(tx,ty+1)) g.fillRect(x0,y0+TILE-5,TILE,5);
      if(!wl(tx-1,ty)) g.fillRect(x0,y0,3,TILE);
      if(!wl(tx+1,ty)) g.fillRect(x0+TILE-3,y0,3,TILE);
      if(!wl(tx,ty-1)){ g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0,y0,TILE,3); }
      continue;
    }
    if(L.level>=11){                                                                                               // кирпичная кладка вместо валунов
      const x0 = tx*TILE, y0 = ty*TILE;
      g.fillStyle = 'rgb('+((P.w[0]*1.25)|0)+','+((P.w[1]*1.25)|0)+','+((P.w[2]*1.25)|0)+')'; g.fillRect(x0,y0,TILE,TILE);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1;
      for(let k=0;k<4;k++){ const yy = y0+k*8; g.beginPath(); g.moveTo(x0,yy); g.lineTo(x0+TILE,yy); g.stroke(); const off = (k+tx+ty)%2*8; for(let q=0;q<2;q++){ g.beginPath(); g.moveTo(x0+off+q*16,yy); g.lineTo(x0+off+q*16,yy+8); g.stroke(); } }
      if(R(1)<0.2){ g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x0+R(2)*18,y0+R(3)*22,12,6); }
      if(L.level===12 && R(4)<0.12){ g.fillStyle = 'rgba(60,110,50,0.4)'; g.fillRect(x0+R(5)*20,y0,5,12+R(6)*14); }
      continue;
    }
    let adj = false;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if((dx||dy) && isF(tx+dx,ty+dy)) adj = true;
    const south = isF(tx,ty+1), lit = south ? 1 : adj ? 0.75 : 0.5;
    const cnt = adj ? 3 : (R(0)<0.55 ? 2 : 1);
    for(let i=0;i<cnt;i++){
      const cx = tx*TILE+6+R(1+i*4)*20, cy = ty*TILE+6+R(2+i*4)*20, r = 12+R(3+i*4)*8;
      const pts = 9, seed = R(4+i*4)*6.28;
      g.beginPath();
      for(let k=0;k<=pts;k++){ const a = k/pts*Math.PI*2, rr = r*(0.82+0.28*Math.sin(a*3+seed)*0.6+0.12*Math.sin(a*5+seed*2)); const x = cx+Math.cos(a)*rr, y = cy+Math.sin(a)*rr*0.9; if(k) g.lineTo(x,y); else g.moveTo(x,y); }
      g.closePath();
      const gr = g.createRadialGradient(cx-r*0.3,cy-r*0.4,2,cx,cy,r*1.1);
      gr.addColorStop(0,'rgb('+((P.a[0]*lit*0.62)|0)+','+((P.a[1]*lit*0.62)|0)+','+((P.a[2]*lit*0.62)|0)+')');
      gr.addColorStop(1,'rgb('+((P.w[0]*1.5+12)|0)+','+((P.w[1]*1.5+12)|0)+','+((P.w[2]*1.5+12)|0)+')');
      g.fillStyle = gr; g.fill(); g.strokeStyle='rgba(0,0,0,0.55)'; g.lineWidth=1.2; g.stroke();
      g.fillStyle='rgba(255,255,255,'+(0.1*lit)+')'; g.beginPath(); g.ellipse(cx-r*0.3,cy-r*0.4,r*0.45,r*0.2,-0.4,0,Math.PI*2); g.fill();
      if(L.level===6){ g.fillStyle='rgba(255,255,255,'+(0.45*lit)+')'; g.beginPath(); g.ellipse(cx-r*0.1,cy-r*0.5,r*0.7,r*0.3,-0.1,0,Math.PI*2); g.fill(); }
      if(L.level===8){                                                                                             // кроны и лианы
        g.fillStyle='rgba('+((50+R(70+i)*40)|0)+','+((130+R(72+i)*50)|0)+',40,'+(0.55*lit+0.2)+')';
        for(let k=0;k<3;k++){ g.beginPath(); g.ellipse(cx+(R(74+k+i)-0.5)*r*1.2,cy+(R(77+k+i)-0.6)*r*1.0,r*0.55,r*0.38,R(80+k)*3,0,6.283); g.fill(); }
        if(R(83+i)<0.4){ g.strokeStyle='rgba(40,110,36,0.9)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(cx,cy); g.bezierCurveTo(cx+4,cy+6,cx-4,cy+10,cx+1,cy+15); g.stroke(); }
      }
      if(L.level===7 && R(90+i)<0.3){ g.fillStyle='rgba(120,160,120,'+(0.18*lit)+')'; g.beginPath(); g.ellipse(cx,cy+r*0.2,r*0.8,r*0.28,0,0,Math.PI*2); g.fill(); }
      if(R(40+i)<0.4){ g.strokeStyle='rgba(0,0,0,0.35)'; g.lineWidth=1; g.beginPath(); g.moveTo(cx-r*0.2,cy-r*0.4); g.lineTo(cx+r*0.1,cy); g.lineTo(cx-r*0.1,cy+r*0.4); g.stroke(); }
    }
  }
  return cv;
}
// выход из подземелья: лестница вверх с дневным светом
function drawDungeonExit(camX,camY){
  if(!loc.exit) return;
  const x = loc.exit.tx*TILE+TILE/2-camX, y = loc.exit.ty*TILE+TILE/2-camY, now = Date.now()/1000;
  if(!onScreen(x-60,y-60,120,120)) return;
  const gl = ctx.createRadialGradient(x,y,3,x,y,50); gl.addColorStop(0,'rgba(255,244,190,0.55)'); gl.addColorStop(1,'rgba(255,244,190,0)');
  ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(x,y,50,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#1d1914'; ctx.beginPath(); ctx.ellipse(x,y,16,12.5,0,0,Math.PI*2); ctx.fill();
  for(let i=0;i<4;i++){ ctx.fillStyle='rgba(240,228,176,'+(0.28+0.17*i)+')'; ctx.fillRect(x-12+i*0.8,y+8-i*5,24-i*1.6,4); }
  const lg = ctx.createRadialGradient(x,y-7,1,x,y-7,15); lg.addColorStop(0,'rgba(255,252,210,0.95)'); lg.addColorStop(1,'rgba(255,252,210,0)');
  ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(x,y-7,15,0,Math.PI*2); ctx.fill();
  for(let i=0;i<12;i++){                                      // кольцо камней
    const a = i/12*Math.PI*2+0.3, rx = x+Math.cos(a)*21, ry = y+Math.sin(a)*17.5, r = 4.4+hash2(i,7,600)*2;
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(rx+1,ry+2,r*1.15,r*0.7,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#7a736a'; ctx.strokeStyle='#2c2822'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(rx,ry,r*1.1,r*0.85,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(rx-r*0.3,ry-r*0.3,r*0.45,r*0.25,0,0,Math.PI*2); ctx.fill();
  }
  ctx.strokeStyle='rgba(110,180,80,0.9)'; ctx.lineWidth=1.3;     // трава с поверхности
  for(let i=0;i<5;i++){ const a = -2.6+i*0.55, gx = x+Math.cos(a)*20, gy = y+Math.sin(a)*16; ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx-1.5,gy-5); ctx.moveTo(gx,gy); ctx.lineTo(gx+1.2,gy-4.5); ctx.stroke(); }
  ctx.fillStyle='rgba(90,70,30,0.8)'; ctx.beginPath(); ctx.moveTo(x,y-3); ctx.lineTo(x+5,y+3); ctx.lineTo(x+1.8,y+3); ctx.lineTo(x+1.8,y+7); ctx.lineTo(x-1.8,y+7); ctx.lineTo(x-1.8,y+3); ctx.lineTo(x-5,y+3); ctx.closePath(); ctx.fill();
  for(let k=0;k<5;k++){ const t = (now*0.4+k/5)%1; ctx.fillStyle='rgba(255,250,210,'+(0.8*(1-t))+')'; ctx.beginPath(); ctx.arc(x+Math.sin(k*3+now)*9, y+6-t*30, 1.3, 0, Math.PI*2); ctx.fill(); }
}
// живая лава: мерцание и пузыри поверх готового слоя
function drawLavaAnim(x0,y0,x1,y1,camX,camY){
  const now = Date.now()/1000;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
    if(loc.grid[y][x]!=='L') continue;
    const h = hash2(x,y,900), ph = now*1.6+h*6.28, a = 0.1+0.1*Math.sin(ph);
    const cx = x*TILE-camX+16, cy = y*TILE-camY+16;
    ctx.fillStyle = 'rgba(255,224,100,'+a+')'; circ(cx+Math.sin(ph*0.7)*5, cy+Math.cos(ph*0.9)*5, 9); ctx.fill();
    const b = (now*0.5+h*3)%1;
    if(b<0.5){ ctx.fillStyle = 'rgba(255,236,140,'+(0.35*(1-b*2))+')'; circ(cx+(h-0.5)*16, cy+(hash2(x,y,901)-0.5)*16, 1+b*6); ctx.fill(); }
  }
}
function drawDungeonGround(camX,camY){
  let layer = dungeonLayers.get(loc);
  if(!layer){ layer = buildDungeonLayer(loc); dungeonLayers.set(loc, layer); }
  const wx0 = Math.max(0,camX), wy0 = Math.max(0,camY);
  const wx1 = Math.min(loc.width*TILE, camX+canvas.width), wy1 = Math.min(loc.height*TILE, camY+canvas.height);
  if(wx1>wx0 && wy1>wy0) ctx.drawImage(layer, wx0, wy0, wx1-wx0, wy1-wy0, wx0-camX, wy0-camY, wx1-wx0, wy1-wy0);
  if(loc.biome==='house') drawHouseAnim(camX,camY);
  else if(loc.biome!=='town') drawDungeonExit(camX,camY);
}

