// ---------- Предметы: зелье и монеты ----------
function drawPotionIcon(cx,cy,sc,glow){
  ctx.save(); ctx.translate(cx,cy); ctx.scale(sc,sc);
  if(glow){ const gr = ctx.createRadialGradient(0,0,2,0,0,14); gr.addColorStop(0,'rgba(255,120,120,0.4)'); gr.addColorStop(1,'rgba(255,120,120,0)'); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill(); }
  ctx.lineWidth=1.1; ctx.strokeStyle='#5a1a1a'; ctx.fillStyle='#d94a4a';
  ctx.beginPath(); ctx.arc(0,2.2,5.6,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#9e2a2a'; ctx.beginPath(); ctx.arc(0,2.2,5.6,0.15*Math.PI,0.85*Math.PI); ctx.fill();
  ctx.fillStyle='#ff9a9a'; ctx.beginPath(); ctx.ellipse(-2,0.8,1.5,2.4,-0.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#d9e6ee'; ctx.strokeStyle='#5a6a74'; ctx.lineWidth=1; ctx.beginPath(); ctx.rect(-1.8,-6.2,3.6,4.2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#8a5a2b'; ctx.fillRect(-2.3,-8.6,4.6,2.6);
  ctx.restore();
}
function coinAt(x,y,r,tilt){
  ctx.fillStyle='#f0a81c'; ctx.strokeStyle='#5e3504'; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.ellipse(x,y,r,r*0.62,tilt||0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#ffe08a'; ctx.beginPath(); ctx.ellipse(x-r*0.22,y-r*0.17,r*0.42,r*0.2,tilt||0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#b8741a'; ctx.beginPath(); ctx.ellipse(x,y,r*0.62,r*0.38,tilt||0,0,Math.PI*2); ctx.stroke();
}
function drawCoinPile(cx,cy,value){
  const spots = [[0,-4],[-4.5,-0.5],[4.8,0],[-9,3.5],[0.3,4],[9.5,3.6],[-4.5,6.5],[5,7]];
  const n = Math.min(spots.length, 4+Math.floor((value||4)/6));
  const pulse = 0.5+0.5*Math.sin(Date.now()/320+cx);
  const gl = ctx.createRadialGradient(cx,cy+1,2,cx,cy+1,22);
  gl.addColorStop(0,'rgba(255,196,70,'+(0.4+0.22*pulse)+')'); gl.addColorStop(1,'rgba(255,196,70,0)');
  ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(cx,cy+1,22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx,cy+9,12,3.5,0,0,Math.PI*2); ctx.fill();
  for(let i=n-1;i>=0;i--) coinAt(cx+spots[i][0], cy+spots[i][1], 5.6, (i%2?0.12:-0.1));
  const tw = 0.5+0.5*Math.sin(Date.now()/230+cx*0.7);
  ctx.strokeStyle='rgba(255,255,235,'+(0.4+0.55*tw)+')'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(cx+8,cy-11); ctx.lineTo(cx+8,cy-4); ctx.moveTo(cx+4.5,cy-7.5); ctx.lineTo(cx+11.5,cy-7.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx-9,cy-6); ctx.lineTo(cx-9,cy-1.5); ctx.moveTo(cx-11.2,cy-3.8); ctx.lineTo(cx-6.8,cy-3.8); ctx.stroke();
}

// ---------- Земля: трава, цветы, горы по краям (рисуется один раз и кешируется) ----------
const groundLayers = new WeakMap();
const FLOWER_COLORS = ['#f4f4f0','#f2d13a','#e87aa8','#a97ae8','#e0574f','#7ab8f0'];
function buildGroundLayer(L){
  const W = L.width*TILE, H = L.height*TILE;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  // 1) трава: плавные пятна светлее/темнее
  for(let y=0;y<H;y+=8) for(let x=0;x<W;x+=8){
    const n = vnoise(x/90,y/90,3)*0.6 + vnoise(x/30,y/30,9)*0.4;
    g.fillStyle = 'rgb('+((52+n*22)|0)+','+((112+n*28)|0)+','+((44+n*14)|0)+')';
    g.fillRect(x,y,8,8);
  }
  // 2) травинки, цветы, камешки
  for(let ty=0;ty<L.height;ty++){
    for(let tx=0;tx<L.width;tx++){
      const t = L.grid[ty][tx]; if(t==='^') continue;
      const x0 = tx*TILE, y0 = ty*TILE, R = (k)=>hash2(tx,ty,k);
      for(let i=0;i<5;i++){
        const px = x0+R(i*2+1)*28+2, py = y0+R(i*2+2)*26+6;
        g.strokeStyle = R(40+i)>0.5 ? 'rgba(28,82,30,0.55)' : 'rgba(140,208,96,0.5)'; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(px,py); g.lineTo(px-1.6,py-4); g.moveTo(px,py); g.lineTo(px+0.4,py-5.2); g.moveTo(px,py); g.lineTo(px+2,py-3.6); g.stroke();
      }
      if(t==='S' || t==='B' || t==='>') continue;
      const hv = R(77);
      if(hv<0.17){ /* цветы рисуются динамически — они качаются на ветру */ } else if(hv<0.21){                             // камешки
        const px = x0+6+R(90)*20, py = y0+8+R(91)*18;
        g.fillStyle='rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(px+1,py+1.5,3.6,2,0,0,Math.PI*2); g.fill();
        g.fillStyle='#9a9aa0'; g.beginPath(); g.ellipse(px,py,3.4,2.2,0,0,Math.PI*2); g.fill();
        g.fillStyle='#b8b8be'; g.beginPath(); g.ellipse(px-1,py-0.8,1.5,0.9,0,0,Math.PI*2); g.fill();
      }
    }
  }
  // 3) горы по краям: пологие и редкие, у подножия темнее, снежные шапки не у всех
  const GW = L.width, GH = L.height;
  for(let ty=0;ty<GH;ty++) for(let tx=0;tx<GW;tx++){
    if(L.grid[ty][tx]!=='^') continue;
    const x0 = tx*TILE, y0 = ty*TILE, R = (k)=>hash2(tx,ty,200+k), n = vnoise(tx*0.7,ty*0.7,17);
    g.fillStyle = 'rgb('+((58+n*24)|0)+','+((56+n*22)|0)+','+((60+n*22)|0)+')'; g.fillRect(x0,y0,TILE,TILE);
    g.strokeStyle='rgba(20,22,28,0.45)'; g.lineWidth=1;                                  // слоистая серая скала
    for(let i=0;i<5;i++){ const px = x0+3+i*6.5+R(50+i)*3; g.beginPath(); g.moveTo(px,y0); g.lineTo(px+(R(60+i)-0.5)*4,y0+TILE); g.stroke(); }
    g.strokeStyle='rgba(150,155,165,0.16)';
    for(let i=0;i<3;i++){ const py = y0+5+i*10+R(70+i)*3; g.beginPath(); g.moveTo(x0,py); g.lineTo(x0+TILE,py+(R(80+i)-0.5)*3); g.stroke(); }
    for(let i=0;i<3;i++){                                   // камни и валуны на каменистой земле
      const px = x0+4+R(i*3)*24, py = y0+4+R(i*3+1)*24, r = 2.5+R(i*3+2)*3.5;
      g.fillStyle='rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(px+1,py+1.5,r*1.2,r*0.7,0,0,Math.PI*2); g.fill();
      g.fillStyle='rgb('+((96+R(i+9)*30)|0)+','+((94+R(i+9)*30)|0)+','+((100+R(i+9)*30)|0)+')'; g.beginPath(); g.ellipse(px,py,r*1.15,r*0.8,0,0,Math.PI*2); g.fill();
      g.fillStyle='rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(px-r*0.3,py-r*0.25,r*0.5,r*0.25,0,0,Math.PI*2); g.fill();
    }
    g.strokeStyle='rgba(120,130,60,0.7)'; g.lineWidth=1;     // сухая трава
    for(let i=0;i<2;i++){ const px = x0+4+R(20+i)*24, py = y0+10+R(22+i)*20; g.beginPath(); g.moveTo(px,py); g.lineTo(px-1.5,py-4); g.moveTo(px,py); g.lineTo(px+1,py-4.5); g.stroke(); }
    // камни, «рассыпанные» внутрь поля, чтобы край не был ровной линией
    const inx = tx===0 ? 1 : tx===GW-1 ? -1 : 0, iny = ty===0 ? 1 : ty===GH-1 ? -1 : 0;
    if(R(30)<0.7){
      const d = 8+R(31)*14, px = x0+16+inx*(16+d)+(iny?(R(32)-0.5)*24:0), py = y0+16+iny*(16+d)+(inx?(R(33)-0.5)*24:0), r = 2+R(34)*3;
      g.fillStyle='rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(px+1,py+1.5,r*1.2,r*0.7,0,0,Math.PI*2); g.fill();
      g.fillStyle='#8f8f98'; g.beginPath(); g.ellipse(px,py,r*1.15,r*0.8,0,0,Math.PI*2); g.fill();
      g.fillStyle='rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(px-r*0.3,py-r*0.25,r*0.5,r*0.25,0,0,Math.PI*2); g.fill();
    }
  }
  // глубина полосы гор по краям (для старых сохранений — одна клетка)
  const dep = (axis,i)=>{ let d = 0;
    if(axis==='T'){ while(d<8 && L.grid[d] && L.grid[d][i]==='^') d++; }
    else if(axis==='B'){ while(d<8 && L.grid[GH-1-d] && L.grid[GH-1-d][i]==='^') d++; }
    else if(axis==='L'){ while(d<8 && L.grid[i][d]==='^') d++; }
    else { while(d<8 && L.grid[i][GW-1-d]==='^') d++; }
    return Math.max(1,d); };
  // рваный край: валуны и осыпь заходят на траву, а трава — на камень
  for(let ty=0;ty<GH;ty++) for(let tx=0;tx<GW;tx++){
    if(L.grid[ty][tx]!=='^') continue;
    for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]){
      const nx = tx+dx, ny = ty+dy; if(nx<0||ny<0||nx>=GW||ny>=GH || L.grid[ny][nx]==='^') continue;
      const R2 = (k)=>hash2(tx*7+dx,ty*7+dy,400+k);
      for(let i=0;i<5;i++){
        const along = (R2(i)-0.5)*TILE*1.1, out = R2(i+10)*13-3;
        const px = tx*TILE+16+dx*(16+out)+(dy?along:0), py = ty*TILE+16+dy*(16+out)+(dx?along:0), r = 5+R2(i+20)*8;
        const sh = 60+R2(i+30)*30;
        g.fillStyle = 'rgb('+(sh|0)+','+((sh-2)|0)+','+((sh+4)|0)+')'; g.beginPath(); g.ellipse(px,py,r*1.15,r*0.8,R2(i+40)*3,0,6.283); g.fill();
        g.fillStyle = 'rgba(190,196,210,0.16)'; g.beginPath(); g.ellipse(px-r*0.25,py-r*0.25,r*0.5,r*0.3,R2(i+40)*3,0,6.283); g.fill();
      }
      for(let i=0;i<4;i++){
        const along = (R2(i+50)-0.5)*TILE, px = tx*TILE+16+dx*(14-R2(i+60)*7)+(dy?along:0), py = ty*TILE+16+dy*(14-R2(i+60)*7)+(dx?along:0);
        g.fillStyle = 'rgba(70,120,50,0.8)'; g.beginPath(); g.ellipse(px,py,3+R2(i+70)*3,2+R2(i+70)*2,R2(i+80)*3,0,6.283); g.fill();
      }
    }
  }
  const mounds = [];
  const addRidge = (len, pos0, make)=>{ let pos = pos0; while(pos < len-1){ make(pos); pos += 2+Math.floor(hash2(pos,len,302)*3); } };   // шаг 2-4 клетки
  addRidge(GW,1,(i)=>{ mounds.push({bx:i*TILE+16+(hash2(i,1,310)-0.5)*22, base:dep('T',i)*TILE+10, top:true,  seed:i*7+1}); });
  addRidge(GW,1,(i)=>{ mounds.push({bx:i*TILE+16+(hash2(i,2,310)-0.5)*22, base:(GH-dep('B',i))*TILE+34, seed:i*7+2}); });
  addRidge(GH,1,(i)=>{ mounds.push({bx:dep('L',i)*TILE-6, side:true, base:i*TILE+20+(hash2(i,3,310)-0.5)*14, seed:i*7+3}); });
  addRidge(GH,1,(i)=>{ mounds.push({bx:GW*TILE-dep('R',i)*TILE+6, side:true, base:i*TILE+20+(hash2(i,4,310)-0.5)*14, seed:i*7+4}); });
  mounds.push({bx:20,base:36,top:true,seed:901},{bx:GW*TILE-20,base:36,top:true,seed:902},{bx:20,base:GH*TILE-4,seed:903},{bx:GW*TILE-20,base:GH*TILE-4,seed:904});
  mounds.sort((a,b)=>a.base-b.base);
  for(const m of mounds){
    const R = (k)=>hash2(m.seed,k,320);
    const bw = m.side ? 52+R(1)*28 : 70+R(1)*46, h = (m.top ? 34+R(2)*14 : m.side ? 26+R(3)*16 : 42+R(3)*26)*1.12;
    const bx = m.bx, baseY = m.base, ax = bx+(R(5)-0.5)*bw*0.3, ay = baseY-h, l = bx-bw/2, r = bx+bw/2;
    const jag = (x0,y0,x1,y1,n,amp,sd)=>{ const pts=[]; for(let i=1;i<=n;i++){ const t=i/n; pts.push([x0+(x1-x0)*t+(i<n?(hash2(m.seed,sd+i,330)-0.5)*amp:0), y0+(y1-y0)*t+(i<n?(hash2(m.seed,sd+i+20,330)-0.5)*amp*0.7:0)]); } return pts; };
    const left = jag(l,baseY,ax,ay,5,bw*0.14,1), right = jag(ax,ay,r,baseY,5,bw*0.14,40);
    const shoulderX = ax+bw*0.30, shoulderY = ay+h*0.34, hasSub = R(6)<0.6;
    const outline = ()=>{ g.beginPath(); g.moveTo(l,baseY); for(const q of left) g.lineTo(q[0],q[1]);
      if(hasSub){ g.lineTo(ax+bw*0.12,ay+h*0.22); g.lineTo(shoulderX,shoulderY-h*0.14); g.lineTo(shoulderX+bw*0.04,shoulderY+h*0.1); }
      for(const q of right) g.lineTo(q[0],q[1]); g.closePath(); };
    g.save(); outline(); g.clip();
    let gr = g.createLinearGradient(0,ay,0,baseY); gr.addColorStop(0,'#a6adc2'); gr.addColorStop(0.5,'#6a6f86'); gr.addColorStop(1,'#2e303f');
    g.fillStyle = gr; g.fillRect(l-4,ay-4,bw+8,h+8);                                            // освещённая грань
    g.beginPath(); g.moveTo(ax,ay); for(let i=0;i<=5;i++){ const t=i/5; g.lineTo(ax+bw*(0.02+0.12*t)+Math.sin(i*2.1+m.seed)*bw*0.03, ay+h*t*1.05); }
    g.lineTo(r+8,baseY+4); g.lineTo(r+8,ay-4); g.closePath();
    gr = g.createLinearGradient(0,ay,0,baseY); gr.addColorStop(0,'#5a6078'); gr.addColorStop(0.55,'#3a3e52'); gr.addColorStop(1,'#1c1e2a');
    g.fillStyle = gr; g.fill();                                                                  // теневая грань
    g.strokeStyle='rgba(8,10,22,0.5)'; g.lineWidth=0.9;
    for(let i=0;i<7;i++){ const t=0.18+i*0.11, yy=ay+h*t; g.beginPath(); g.moveTo(ax+bw*(0.03+0.1*t),yy); g.lineTo(ax+bw*(0.03+0.1*t)+bw*(0.1+0.3*t)*(0.5+R(10+i)*0.5), yy+h*0.1); g.stroke(); }
    g.strokeStyle='rgba(215,225,245,0.2)';
    for(let i=0;i<4;i++){ const t=0.2+i*0.16; g.beginPath(); g.moveTo(ax-bw*0.02*t,ay+h*t); g.lineTo(ax-bw*(0.12+0.26*t),ay+h*(t+0.12)); g.stroke(); }
    if(R(4)<0.7){                                                                                // ледник на вершине
      const capY = t=>ay+h*(0.30+0.1*Math.sin(t*14+m.seed)+0.07*Math.sin(t*33+m.seed*2));
      g.fillStyle='#f1f6fb'; g.beginPath(); g.moveTo(l-6,ay-8); g.lineTo(r+6,ay-8);
      for(let t=1;t>=0;t-=0.05) g.lineTo(l+bw*t, capY(t)); g.closePath(); g.fill();
      g.fillStyle='rgba(110,142,196,0.5)'; g.beginPath(); g.moveTo(ax,ay-8); g.lineTo(r+6,ay-8);
      for(let t=1;t>=0.5;t-=0.05) g.lineTo(l+bw*t, capY(t)+1); g.closePath(); g.fill();
      g.strokeStyle='rgba(150,190,230,0.7)'; g.lineWidth=0.8; g.beginPath(); for(let t=0;t<=1.001;t+=0.05){ const x = l+bw*t, y = capY(t); if(t===0) g.moveTo(x,y); else g.lineTo(x,y); } g.stroke();
    }
    const fg = g.createLinearGradient(0,baseY-h*0.45,0,baseY); fg.addColorStop(0,'rgba(6,6,14,0)'); fg.addColorStop(1,'rgba(6,6,14,0.7)');
    g.fillStyle = fg; g.fillRect(l-4,baseY-h*0.45,bw+8,h*0.45+6);
    g.restore();
    outline(); g.strokeStyle='rgba(8,8,18,0.85)'; g.lineWidth=1.3; g.lineJoin='round'; g.stroke();
    g.beginPath(); g.moveTo(ax,ay); g.lineTo(ax+bw*0.03,ay+h*0.5); g.lineTo(ax+bw*0.1,baseY-h*0.05); g.strokeStyle='rgba(8,8,18,0.55)'; g.lineWidth=1; g.stroke();
  }
  return cv;
}
function drawGround(camX,camY){
  let layer = groundLayers.get(loc);
  if(!layer){ layer = buildGroundLayer(loc); groundLayers.set(loc, layer); }
  const wx0 = Math.max(0,camX), wy0 = Math.max(0,camY);
  const wx1 = Math.min(loc.width*TILE, camX+canvas.width), wy1 = Math.min(loc.height*TILE, camY+canvas.height);
  if(wx1>wx0 && wy1>wy0) ctx.drawImage(layer, wx0, wy0, wx1-wx0, wy1-wy0, wx0-camX, wy0-camY, wx1-wx0, wy1-wy0);
}

// ---------- Пещеры: входы (overworld) и спуск в Провал (в подземелье) ----------
const caveSprites = {};
const GLOW_COL = { town:[255,206,120], abyss:[190,120,255], lavaGate:[255,140,40], tomb:[255,214,90], iceGate:[130,220,255], graveGate:[120,255,150], jungleGate:[190,255,90], cityGate:[255,176,90], manorGate:[130,255,230] };
function makeCaveSprite(kind){
  if(kind==='town') return makeTownGateSprite();
  const PALS = {
    abyss:   {r1:'#3a3050', r2:'#52456f', r3:'#6e5f92', edge:'#16101f', boul:'#473b62', rim:'#2a2140', key:'#8a74b8', in0:'#14081f', in1:'#020006'},
    lavaGate:{r1:'#4a2a26', r2:'#6a3a30', r3:'#8a4a3a', edge:'#1a0806', boul:'#5a3028', rim:'#2a100c', key:'#c8602a', in0:'#ff7a1a', in1:'#5a1204'},
    tomb:    {r1:'#9a7a44', r2:'#b8945a', r3:'#d4b074', edge:'#3a2a10', boul:'#a8864e', rim:'#5a4018', key:'#e8c878', in0:'#2a1a08', in1:'#030201'},
    graveGate:{r1:'#4a504c', r2:'#646b66', r3:'#828a84', edge:'#101412', boul:'#586059', rim:'#242a26', key:'#a8b4aa', in0:'#103a24', in1:'#010604'},
    jungleGate:{r1:'#3a5a28', r2:'#4c7a34', r3:'#68a048', edge:'#0c1c08', boul:'#456a30', rim:'#1c3012', key:'#8ac85a', in0:'#2a5a14', in1:'#020a02'},
    iceGate: {r1:'#6a8aa8', r2:'#8cb0cc', r3:'#c4e0f0', edge:'#1c3048', boul:'#7a9ab8', rim:'#34506c', key:'#e8f6ff', in0:'#1a3a60', in1:'#02060f'},
    cityGate:{r1:'#5a5048', r2:'#7a6e62', r3:'#9a8c7c', edge:'#1c1612', boul:'#6a5e52', rim:'#32291f', key:'#c8b48a', in0:'#2a1e16', in1:'#040201'},
    manorGate:{r1:'#3a2a30', r2:'#52404a', r3:'#6e5a66', edge:'#120a0e', boul:'#46343c', rim:'#241820', key:'#9ae8d8', in0:'#0e2a28', in1:'#010606'}
  };
  const abyss = !!PALS[kind];
  const C = abyss
    ? PALS[kind]
    : {r1:'#5f5f68', r2:'#77777f', r3:'#8d8d96', edge:'#2c2c33', boul:'#6a6a73', rim:'#47474f', key:'#a2a2ab', in0:'#1a120c', in1:'#030201'};
  const c = document.createElement('canvas'); c.width = 76; c.height = 68;
  const g = c.getContext('2d');
  const blob = (cx,cy,rx,ry,seed,wob)=>{
    g.beginPath();
    for(let i=0;i<=40;i++){ const a=i/40*Math.PI*2, r=1+wob*(0.6*Math.sin(5*a+seed)+0.4*Math.sin(9*a+seed*2));
      const x=cx+Math.cos(a)*rx*r, y=cy+Math.sin(a)*ry*r; if(i) g.lineTo(x,y); else g.moveTo(x,y); }
    g.closePath();
  };
  const rock = (x,y,rx,ry,seed,col)=>{            // отдельный валун с гранями
    g.fillStyle = col; g.strokeStyle = C.edge; g.lineWidth = 1.1; blob(x,y,rx,ry,seed,0.12); g.fill(); g.stroke();
    g.fillStyle='rgba(255,255,255,0.16)'; g.beginPath(); g.ellipse(x-rx*0.25,y-ry*0.35,rx*0.5,ry*0.28,-0.3,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(x+rx*0.3,y+ry*0.4,rx*0.55,ry*0.3,0.2,0,Math.PI*2); g.fill();
  };
  g.fillStyle='rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(38,59,32,7,0,0,Math.PI*2); g.fill();
  g.strokeStyle=C.edge; g.lineWidth=1.3;
  g.fillStyle=C.r1; blob(38,36,30,24,1.1,0.1); g.fill(); g.stroke();
  g.fillStyle=C.r2; blob(36,32,26,19,2.3,0.12); g.fill();
  g.fillStyle=C.r3; blob(33,27,18,12,3.7,0.14); g.fill();
  g.strokeStyle='rgba(0,0,0,0.2)'; g.lineWidth=1;                       // слои породы
  for(const y of [20,27,34]){ g.beginPath(); g.moveTo(14+(y-20)*0.5,y); g.quadraticCurveTo(38,y-3,62-(y-20)*0.5,y); g.stroke(); }
  rock(14,46,8,6.5,1.7,C.boul); rock(63,47,9,6.5,2.9,C.boul); rock(8,54,5.5,4,4.1,C.r1); rock(69,55,6,4,5.3,C.r1);
  rock(23,58,6,4,6.2,C.r2); rock(54,59,7,4.2,7.4,C.r2); rock(27,15,6,4.2,8.1,C.r2); rock(51,14,5.5,4,9.3,C.r3);
  // тёмный проём
  g.beginPath(); g.moveTo(25,58); g.lineTo(25,42); g.quadraticCurveTo(25,27,38,27); g.quadraticCurveTo(51,27,51,42); g.lineTo(51,58); g.closePath();
  const gr = g.createLinearGradient(0,27,0,58); gr.addColorStop(0,C.in0); gr.addColorStop(1,C.in1); g.fillStyle=gr; g.fill();
  g.strokeStyle=C.rim; g.lineWidth=3; g.stroke();
  g.fillStyle=C.key; g.strokeStyle=C.edge; g.lineWidth=1;
  for(let i=0;i<7;i++){ const a=Math.PI*(1-i/6), x=38+Math.cos(a)*13.4, y=42-Math.sin(a)*15.6;
    g.save(); g.translate(x,y); g.rotate(-a+Math.PI/2); g.beginPath(); g.roundRect ? g.roundRect(-3,-2.6,6,5.2,1.4) : g.rect(-3,-2.6,6,5.2); g.fill(); g.stroke(); g.restore(); }
  if(kind==='abyss'){
    const cr=(x,y,w,h,col)=>{ g.fillStyle=col; g.strokeStyle='#1c1230'; g.beginPath(); g.moveTo(x,y); g.lineTo(x+w*0.5,y-h); g.lineTo(x+w,y); g.closePath(); g.fill(); g.stroke(); g.fillStyle='rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x+w*0.35,y-h*0.3); g.lineTo(x+w*0.5,y-h*0.9); g.lineTo(x+w*0.55,y-h*0.3); g.fill(); };
    cr(18,24,5,11,'#a47be0'); cr(23,26,4,7,'#7a4fbd'); cr(49,23,5,13,'#c9a8ff'); cr(54,26,4,8,'#8a5fd0'); cr(36,14,5,9,'#a47be0');
    g.strokeStyle='#d8d3bd'; g.lineWidth=2.2; g.lineCap='round'; g.beginPath(); g.moveTo(10,52); g.lineTo(18,58); g.moveTo(60,57); g.lineTo(68,51); g.stroke();
  } else if(kind==='lavaGate'){
    const fl=(x,y,w,h,c1,c2)=>{ g.fillStyle=c1; g.beginPath(); g.moveTo(x-w/2,y); g.quadraticCurveTo(x-w*0.6,y-h*0.5,x,y-h); g.quadraticCurveTo(x+w*0.6,y-h*0.5,x+w/2,y); g.closePath(); g.fill(); g.fillStyle=c2; g.beginPath(); g.moveTo(x-w*0.25,y); g.quadraticCurveTo(x-w*0.3,y-h*0.35,x,y-h*0.62); g.quadraticCurveTo(x+w*0.3,y-h*0.35,x+w*0.25,y); g.closePath(); g.fill(); };
    fl(20,31,7,14,'#ff6a1a','#ffd24a'); fl(56,31,7,16,'#ff6a1a','#ffd24a'); fl(38,19,9,17,'#ff5a14','#ffe04a'); fl(12,50,5,9,'#ff7a1a','#ffd24a'); fl(64,50,5,10,'#ff7a1a','#ffd24a');
    g.fillStyle='#ff8a1a'; g.fillRect(33,58,10,3); g.fillStyle='#ffd24a'; g.fillRect(36,58,4,2);
  } else if(kind==='tomb'){
    g.fillStyle='#e8c878'; g.strokeStyle='#5a4018'; g.lineWidth=1; g.fillRect(21,22,34,4); g.strokeRect(21,22,34,4);
    g.strokeStyle='#f0d070'; g.lineWidth=2.2; g.beginPath(); g.arc(38,13,3.6,0,Math.PI*2); g.moveTo(38,16.6); g.lineTo(38,22); g.moveTo(34,19); g.lineTo(42,19); g.stroke();
    g.fillStyle='#f0d070'; for(const x of [24,29,47,52]) g.fillRect(x,23,2,2);
    g.strokeStyle='#e6e1cf'; g.lineWidth=2.2; g.beginPath(); g.moveTo(10,52); g.lineTo(18,58); g.moveTo(60,57); g.lineTo(68,51); g.stroke();
  } else if(kind==='iceGate'){
    const cr=(x,y,w,h,col)=>{ g.fillStyle=col; g.strokeStyle='#1c3048'; g.lineWidth=1; g.beginPath(); g.moveTo(x,y); g.lineTo(x+w*0.5,y-h); g.lineTo(x+w,y); g.closePath(); g.fill(); g.stroke(); g.fillStyle='rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(x+w*0.35,y-h*0.3); g.lineTo(x+w*0.5,y-h*0.9); g.lineTo(x+w*0.55,y-h*0.3); g.fill(); };
    cr(16,26,6,13,'#bfe6ff'); cr(22,28,4,8,'#8cc8f0'); cr(50,25,6,14,'#d8f2ff'); cr(56,28,4,9,'#8cc8f0'); cr(34,15,6,11,'#bfe6ff');
    g.fillStyle='rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(38,17,17,5,0,0,Math.PI*2); g.fill(); g.beginPath(); g.ellipse(14,45,7,3,0,0,Math.PI*2); g.fill(); g.beginPath(); g.ellipse(64,46,8,3,0,0,Math.PI*2); g.fill();
    g.fillStyle='#e8f6ff'; g.strokeStyle='#34506c'; g.lineWidth=0.8; for(const x of [29,34,39,44,48]){ g.beginPath(); g.moveTo(x-2,27.5); g.lineTo(x,27.5+5+((x*7)%4)); g.lineTo(x+2,27.5); g.closePath(); g.fill(); g.stroke(); }
  } else if(kind==='graveGate'){
    g.fillStyle='#8a948c'; g.strokeStyle='#161a18'; g.lineWidth=1;
    for(const [x,y,w,h] of [[13,30,8,13],[56,29,8,14]]){ g.beginPath(); g.moveTo(x,y+h); g.lineTo(x,y+3); g.quadraticCurveTo(x+w/2,y-4,x+w,y+3); g.lineTo(x+w,y+h); g.closePath(); g.fill(); g.stroke(); }
    g.strokeStyle='#d0d8d2'; g.lineWidth=2.2; g.beginPath(); g.moveTo(38,8); g.lineTo(38,22); g.moveTo(33,12.5); g.lineTo(43,12.5); g.stroke();
    g.strokeStyle='#e6e1cf'; g.lineWidth=2.2; g.lineCap='round'; g.beginPath(); g.moveTo(10,52); g.lineTo(18,58); g.moveTo(60,57); g.lineTo(68,51); g.stroke();
    g.fillStyle='rgba(150,255,190,0.35)'; g.beginPath(); g.ellipse(38,56,22,4,0,0,Math.PI*2); g.fill();
  } else if(kind==='jungleGate'){
    g.strokeStyle='#2a5a1a'; g.lineWidth=2.4; g.lineCap='round';
    for(const x of [27,33,43,49]){ g.beginPath(); g.moveTo(x,28); g.quadraticCurveTo(x+(x<38?-4:4),42,x+(x<38?-2:2),57); g.stroke(); }
    g.fillStyle='#78c040'; g.strokeStyle='#14320c'; g.lineWidth=1;
    for(const [x,y,r] of [[22,26,0.7],[54,24,-0.7],[38,17,0],[16,44,0.4],[61,45,-0.4],[30,15,-0.3],[47,15,0.3]]){ g.save(); g.translate(x,y); g.rotate(r); g.beginPath(); g.ellipse(0,0,6.5,3,0,0,Math.PI*2); g.fill(); g.stroke(); g.restore(); }
    for(const [x,y,c] of [[20,22,'#ff6a9a'],[57,21,'#ffd34a'],[34,13,'#ff8a3a']]){ g.fillStyle=c; g.beginPath(); g.arc(x,y,2.4,0,Math.PI*2); g.fill(); g.fillStyle='#fff6c0'; g.beginPath(); g.arc(x,y,0.9,0,Math.PI*2); g.fill(); }
  } else if(kind==='cityGate'){                                          // ворота города: зубцы и факелы
    g.fillStyle='#8a7c6a'; g.strokeStyle='#241c14'; g.lineWidth=1;
    for(const x of [22,29,36,43,50]){ g.fillRect(x-2.4,15,4.8,6); g.strokeRect(x-2.4,15,4.8,6); }
    for(const x of [16,62]){ g.fillStyle='#6a4a22'; g.fillRect(x-1,28,2,12); g.fillStyle='#ffb84a'; g.beginPath(); g.ellipse(x,26,2.6,4,0,0,Math.PI*2); g.fill(); }
  } else if(kind==='manorGate'){                                         // дверь особняка: призрачный свет и паутина
    g.strokeStyle='rgba(220,240,240,0.7)'; g.lineWidth=0.8;
    g.beginPath(); g.moveTo(20,20); g.lineTo(34,30); g.moveTo(20,26); g.lineTo(32,30); g.moveTo(20,20); g.lineTo(20,32); g.stroke();
    g.beginPath(); g.moveTo(58,20); g.lineTo(44,30); g.moveTo(58,26); g.lineTo(46,30); g.moveTo(58,20); g.lineTo(58,32); g.stroke();
    g.fillStyle='#9ae8d8'; g.beginPath(); g.arc(38,22,2,0,Math.PI*2); g.fill();
  } else if(kind==='dungeon2'){                                         // логово Мортракса: черепа и кости
    const skull = (x,y,r)=>{ g.fillStyle='#e6e1cf'; g.strokeStyle='#5a5546'; g.lineWidth=1; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.stroke();
      g.fillRect(x-r*0.55,y+r*0.6,r*1.1,r*0.55); g.fillStyle='#14110c'; g.beginPath(); g.arc(x-r*0.4,y-r*0.1,r*0.28,0,Math.PI*2); g.arc(x+r*0.4,y-r*0.1,r*0.28,0,Math.PI*2); g.fill(); };
    g.strokeStyle='#d8d3bd'; g.lineWidth=2.4; g.lineCap='round';
    g.beginPath(); g.moveTo(28,22); g.lineTo(48,14); g.moveTo(48,22); g.lineTo(28,14); g.stroke();
    skull(38,18,5.4); skull(15,50,3.6); skull(62,52,3.6);
  } else {                                                              // обычная пещера: мох и трава на камнях
    g.fillStyle='rgba(88,150,60,0.8)';
    for(const [x,y,rx,ry,r] of [[26,24,7,3.2,-0.3],[50,22,6,3,0.3],[16,43,4,2,0],[60,40,5,2.4,0.2]]){ g.beginPath(); g.ellipse(x,y,rx,ry,r,0,Math.PI*2); g.fill(); }
    g.strokeStyle='rgba(110,180,80,0.9)'; g.lineWidth=1.3;
    for(const x of [28,34,44,50]){ g.beginPath(); g.moveTo(x,29); g.lineTo(x-1.5,24); g.moveTo(x,29); g.lineTo(x+1,23.5); g.stroke(); }
  }
  return c;
}
function drawCaveAt(kind,tcx,tcy,SC){
  const spr = caveSprites[kind] || (caveSprites[kind] = makeCaveSprite(kind));
  if(!onScreen(tcx-60,tcy-70,120,100)) return;
  const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(spr, tcx-38*SC, tcy+12-58*SC, 76*SC, 68*SC);
  ctx.imageSmoothingEnabled = prev;
  const now = Date.now()/1000;
  const ox = tcx, oy = tcy+12-13*SC;                 // центр проёма
  if(kind==='dungeon2'){
    const a = 0.45+0.35*Math.sin(now*3+tcx*0.01);
    ctx.fillStyle='rgba(255,60,40,'+a+')'; ctx.beginPath(); ctx.arc(ox-5*SC,oy+1*SC,1.9,0,Math.PI*2); ctx.arc(ox+5*SC,oy+1*SC,1.9,0,Math.PI*2); ctx.fill();
  } else if(GLOW_COL[kind]){
    const [gr0,gg0,gb0] = GLOW_COL[kind], pulse = 0.5+0.5*Math.sin(now*2.2);
    const gr = ctx.createRadialGradient(ox,oy,2,ox,oy,18*SC); gr.addColorStop(0,'rgba('+gr0+','+gg0+','+gb0+','+(0.55+0.3*pulse)+')'); gr.addColorStop(1,'rgba('+gr0+','+gg0+','+gb0+',0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(ox,oy,18*SC,0,Math.PI*2); ctx.fill();
    for(let k=0;k<5;k++){ const t=(now*0.35+k/5)%1; ctx.fillStyle='rgba('+Math.min(255,gr0+30)+','+Math.min(255,gg0+40)+','+Math.min(255,gb0+30)+','+(0.8*(1-t))+')'; ctx.beginPath(); ctx.arc(ox+Math.sin(k*2.7+now)*7*SC, oy+8*SC-t*34*SC, 1.4, 0, Math.PI*2); ctx.fill(); }
  }
}
// входы в пещеры на поверхности (рисуются поверх игрока: за холмом герой скрывается)
function drawCaves(camX,camY){
  if(!loc.entrances) return;
  for(const en of loc.entrances) if(!(en.hidden && !en.found)) drawCaveAt(en.dungeon==='lair1' ? 'dungeon2' : en.dungeon, en.tx*TILE+TILE/2-camX, en.ty*TILE+TILE/2-camY, 1.3);
}
// пещера в пещере: открывается после победы над Мортраксом
function drawPortalCave(camX,camY){
  if(!(loc.portal && loc.portal.open)) return;
  drawCaveAt(PORTAL_KIND[currentLocId]||'abyss', loc.portal.tx*TILE+TILE/2-camX, loc.portal.ty*TILE+TILE/2-camY, 1.2);
}

