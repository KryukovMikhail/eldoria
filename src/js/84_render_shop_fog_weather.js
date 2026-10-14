// ---------- Лавка торговца (приглушённые тона: потёртое дерево и холст) ----------
function shopGeom(){
  const sh = loc.shop; if(!sh) return null;
  let row = null;
  if(loc.grid[sh.ty+1] && loc.grid[sh.ty+1][sh.tx]==='S') row = sh.ty+1;
  else if(loc.grid[sh.ty-1] && loc.grid[sh.ty-1][sh.tx]==='S') row = sh.ty-1;   // старые сохранения
  if(row===null) return null;
  return { x0:(sh.tx-1)*TILE, y0:row*TILE, row, tx:sh.tx, south: row>sh.ty };
}
function onScreen(x,y,w,h){ return x<canvas.width+40 && y<canvas.height+40 && x+w>-40 && y+h>-40; }
const ST = { wd:'#3a2d22', wm:'#5c4836', wl:'#7d6850', wh:'#9a8462', can:'#d9cdb2', canD:'#bcae8e', red:'#8a3b30', blue:'#3f5c7a' };
function jarAt(x,y,col){ ctx.fillStyle=col; ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.lineWidth=1; rrect(x-3.2,y-7,6.4,7,2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#6b5036'; ctx.fillRect(x-2.4,y-9,4.8,2.4); ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fillRect(x-2,y-6,1.2,4); }
function flaskAt(x,y,col){ ctx.fillStyle=col; ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x,y-3.5,3.6,3.8,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#cfd8d6'; ctx.fillRect(x-1.2,y-10,2.4,4.5); ctx.fillStyle='#6b5036'; ctx.fillRect(x-1.7,y-11.6,3.4,2); ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(x-2,y-5,1,2.5); }
function loafAt(x,y,col){ ctx.fillStyle=col; ctx.strokeStyle='rgba(60,35,10,0.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x,y,5.2,3.2,-0.2,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(60,35,10,0.45)'; ctx.beginPath(); ctx.moveTo(x-2,y-2); ctx.lineTo(x-0.5,y+1.5); ctx.moveTo(x+0.5,y-2.5); ctx.lineTo(x+2,y+1); ctx.stroke(); }
function barrelAt(x,y,w,h){
  ctx.fillStyle='rgba(0,0,0,0.22)'; ell(x+w/2,y+h+1,w*0.58,3); ctx.fill();
  ctx.fillStyle=ST.wm; ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1; rrect(x,y+3,w,h-3,4); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(30,20,12,0.5)'; for(let i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(x+i*w/4,y+5); ctx.lineTo(x+i*w/4,y+h-1); ctx.stroke(); }
  ctx.fillStyle='#2b2b30'; ctx.fillRect(x,y+h*0.32,w,2.2); ctx.fillRect(x,y+h*0.68,w,2.2);
  ctx.fillStyle=ST.wl; ell(x+w/2,y+3.5,w/2,3.6); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.stroke();
  ctx.fillStyle='#3a2d22'; ell(x+w/2,y+3.5,w*0.33,2.3); ctx.fill();
}
function sackAt(x,y,w,h){
  ctx.fillStyle='rgba(0,0,0,0.2)'; ell(x+w/2,y+h,w*0.55,2.5); ctx.fill();
  ctx.fillStyle='#bfae8a'; ctx.strokeStyle='rgba(60,45,25,0.6)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x+w*0.28,y+2); ctx.quadraticCurveTo(x-1,y+h*0.45,x+1,y+h); ctx.lineTo(x+w-1,y+h); ctx.quadraticCurveTo(x+w+1,y+h*0.45,x+w*0.72,y+2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#6b5a3c'; ctx.fillRect(x+w*0.28,y+1,w*0.44,2.2);
}
function crateAt(x,y,w,h){
  ctx.fillStyle=ST.wl; ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1; rrect(x,y,w,h,1.5); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(40,28,16,0.55)'; ctx.lineWidth=1.3; ctx.strokeRect(x+1.5,y+1.5,w-3,h-3);
  ctx.beginPath(); ctx.moveTo(x+1.5,y+1.5); ctx.lineTo(x+w-1.5,y+h-1.5); ctx.moveTo(x+w-1.5,y+1.5); ctx.lineTo(x+1.5,y+h-1.5); ctx.stroke();
}
function basketAt(x,y,w,fruit){
  ctx.fillStyle='#8a6a3a'; ctx.strokeStyle='rgba(40,25,10,0.6)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x-w/2,y-4); ctx.lineTo(x-w/2+2,y+3); ctx.lineTo(x+w/2-2,y+3); ctx.lineTo(x+w/2,y-4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(50,35,15,0.5)'; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(x+i*w*0.25,y-3); ctx.lineTo(x+i*w*0.22,y+3); ctx.stroke(); }
  if(fruit){ const cols=['#a8473a','#c0703a','#8a8f3a','#a8473a']; for(let i=0;i<4;i++){ ctx.fillStyle=cols[i]; ctx.beginPath(); ctx.arc(x-w*0.3+i*w*0.2,y-5.5-(i%2),2.3,0,Math.PI*2); ctx.fill(); } }
}
function clothAt(x,y,col,t){
  const sw = Math.sin(t*1.8+x)*1.2;
  ctx.fillStyle=col; ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+8,y); ctx.lineTo(x+8+sw,y+16); ctx.lineTo(x+5.5+sw,y+13.5); ctx.lineTo(x+3+sw*0.7,y+17); ctx.lineTo(x+sw*0.5,y+14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.moveTo(x+4,y+1); ctx.lineTo(x+4+sw*0.5,y+13); ctx.stroke();
}
// вытоптанная земля перед лавкой
function drawShopGround(camX,camY){
  const g = shopGeom(); if(!g || !g.south) return;
  const x = g.x0-camX+48, y = g.y0-camY+TILE+16;
  if(!onScreen(x-60,y-30,120,60)) return;
  ctx.fillStyle='rgba(70,52,34,0.34)'; ell(x,y,50,15); ctx.fill();
  ctx.fillStyle='rgba(120,98,66,0.22)'; ell(x+2,y+1,34,9); ctx.fill();
  ctx.fillStyle='rgba(90,80,70,0.8)'; for(const [dx,dy,r] of [[-30,3,2],[26,-4,2.4],[8,8,1.8],[-12,-6,1.6]]){ ctx.beginPath(); ctx.ellipse(x+dx,y+dy,r*1.2,r*0.8,0,0,Math.PI*2); ctx.fill(); }
}
function drawMerchant(m, camX, camY){
  const now = Date.now()/1000, A = m.look==='alch';
  const cx = m.x-camX+m.w/2, cy = m.y-camY+m.h/2+4+Math.sin(now*2)*0.5;
  if(!onScreen(cx-20,cy-30,40,50)) return;
  ctx.save(); ctx.translate(cx,cy); ctx.scale(0.92,0.92);
  ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,0.4)';
  shadowAt(0,10,9,3);
  ctx.fillStyle='#d8ccb0'; rrect(-7.5,-3,15,14,3); ctx.fill(); ctx.stroke();
  ctx.fillStyle=A?'#5a3f7a':'#4e6a54'; rrect(-7.5,-3,5.5,14,2); ctx.fill(); rrect(2,-3,5.5,14,2); ctx.fill();
  ctx.fillStyle='#b89a3a'; circ(-4.7,2,0.9); ctx.fill(); circ(4.7,2,0.9); ctx.fill(); circ(-4.7,6.5,0.9); ctx.fill(); circ(4.7,6.5,0.9); ctx.fill();
  ctx.fillStyle='#d8ccb0'; rrect(-11,2,4,9,1.8); ctx.fill(); ctx.stroke(); rrect(7,2,4,9,1.8); ctx.fill(); ctx.stroke();
  ctx.fillStyle=SKIN; circ(-9,12,2.2); ctx.fill(); circ(9,12,2.2); ctx.fill();
  ctx.fillStyle=SKIN; circ(0,-10,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#5e4630';
  ctx.beginPath(); ctx.moveTo(-6.6,-8); ctx.quadraticCurveTo(-6,2,0,3); ctx.quadraticCurveTo(6,2,6.6,-8); ctx.quadraticCurveTo(0,-4.5,-6.6,-8); ctx.fill();
  ctx.fillStyle='#6e543a'; ell(-2.4,-6.4,3,1.2,0.25); ctx.fill(); ell(2.4,-6.4,3,1.2,-0.25); ctx.fill();
  ctx.fillStyle=SKIN_D; circ(0,-8.2,1.5); ctx.fill();
  ctx.fillStyle='#2a1a10'; circ(-2.5,-10.8,1); ctx.fill(); circ(2.5,-10.8,1); ctx.fill();
  ctx.strokeStyle='#4a3320'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(-4.2,-12.6); ctx.lineTo(-1.2,-12.2); ctx.moveTo(4.2,-12.6); ctx.lineTo(1.2,-12.2); ctx.stroke();
  ctx.fillStyle=A?'#7a58a0':'#cbbd9c'; ell(0,-15.4,8.6,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1; ctx.stroke();
  ctx.strokeStyle=A?'#5a3f7a':'#a89a78'; ctx.beginPath(); ctx.arc(0,-15.4,6,0.1*Math.PI,0.9*Math.PI); ctx.stroke();
  ctx.fillStyle=A?'#7a58a0':'#cbbd9c'; circ(0,-20,3.2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#b89a3a'; circ(0,-15.8,2.2); ctx.fill(); ctx.fillStyle='#8a3b30'; circ(0,-15.8,1.3); ctx.fill();
  ctx.restore();
}
// задняя часть: стойки, стенка с полками, висящие ткани (рисуется до торговца)
function drawStallBack(camX,camY){
  const g = shopGeom(); if(!g) return;
  const x0 = g.x0-camX, y0 = g.y0-camY, now = Date.now()/1000;
  if(!onScreen(x0-50,y0-70,200,120)) return;
  ctx.lineWidth=1;
  ctx.fillStyle='rgba(0,0,0,0.16)'; ell(x0+48,y0+33,44,5.5); ctx.fill();
  ctx.fillStyle='#2e251d'; ctx.fillRect(x0+14,y0-40,68,48);
  ctx.strokeStyle='rgba(0,0,0,0.38)'; for(let i=1;i<7;i++){ ctx.beginPath(); ctx.moveTo(x0+14+i*68/7,y0-40); ctx.lineTo(x0+14+i*68/7,y0+8); ctx.stroke(); }
  for(const sy of [y0-24,y0-6]){ ctx.fillStyle=ST.wm; ctx.fillRect(x0+13,sy,70,3); ctx.fillStyle=ST.wh; ctx.fillRect(x0+13,sy,70,1); }
  jarAt(x0+19,y0-24,'#8a6a45'); jarAt(x0+27,y0-24,'#6e7f5a'); flaskAt(x0+34,y0-24,'#7a6a9a');
  let bx = x0+62; for(const [c,w,h] of [['#7a3a30',5,9],['#3f5c4a',4,11],['#6a5a38',5,8]]){ ctx.fillStyle=c; ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx,y0-24-h,w,h); ctx.strokeRect(bx,y0-24-h,w,h); bx+=w+0.5; }
  jarAt(x0+79,y0-24,'#9a7a4a');
  jarAt(x0+20,y0-6,'#7a5a3a'); flaskAt(x0+29,y0-6,'#6a8f6a'); basketAt(x0+68,y0-6,12,false); jarAt(x0+79,y0-6,'#6e7f5a');
  const post = (px)=>{ ctx.fillStyle=ST.wd; ctx.fillRect(px-2.5,y0-50,5,82); ctx.fillStyle=ST.wh; ctx.fillRect(px-2.5,y0-50,1.2,82);
    ctx.fillStyle=ST.wd; ctx.beginPath(); ctx.moveTo(px-3.6,y0-50); ctx.lineTo(px,y0-60); ctx.lineTo(px+3.6,y0-50); ctx.closePath(); ctx.fill(); };
  post(x0+12); post(x0+84);
  clothAt(x0+4.5,y0-35,ST.red,now); clothAt(x0+87.5,y0-35,ST.blue,now+1);
  // фонарь слева и корзинка на верёвке справа
  const fl = 0.5+0.2*Math.sin(now*6)+0.1*Math.sin(now*11);
  ctx.strokeStyle='#4a3320'; ctx.beginPath(); ctx.moveTo(x0-3,y0-30); ctx.lineTo(x0-3,y0-24); ctx.moveTo(x0+99,y0-30); ctx.lineTo(x0+99,y0-23); ctx.stroke();
  const gl = ctx.createRadialGradient(x0-3,y0-19,1,x0-3,y0-19,13); gl.addColorStop(0,'rgba(255,196,100,'+(0.4*fl)+')'); gl.addColorStop(1,'rgba(255,196,100,0)');
  ctx.fillStyle=gl; circ(x0-3,y0-19,13); ctx.fill();
  ctx.fillStyle='#3a3a40'; ctx.fillRect(x0-6,y0-24,6,1.6); ctx.fillRect(x0-6,y0-15.6,6,1.6);
  ctx.fillStyle='#d9a54a'; ctx.fillRect(x0-5,y0-22.4,4,6.8); ctx.fillStyle='rgba(255,240,200,0.7)'; ctx.fillRect(x0-4,y0-21,2,4);
  basketAt(x0+99,y0-17,10,false);
}
// передняя часть: стол с товарами, нижняя полка, бочки и ящики по краям
function drawStallFront(camX,camY){
  const g = shopGeom(); if(!g) return;
  const x0 = g.x0-camX, y0 = g.y0-camY;
  if(!onScreen(x0-50,y0-70,200,120)) return;
  ctx.lineWidth=1;
  // боковые бочки и ящики (клетки 'B')
  const gr = loc.grid;
  if(gr[g.row][g.tx-2]==='B'){
    const bx = (g.tx-2)*TILE-camX, by = g.row*TILE-camY;
    barrelAt(bx+3,by+7,17,24); barrelAt(bx+16,by+14,13,17); basketAt(bx+9,by+31,10,false);
  }
  if(gr[g.row][g.tx+2]==='B'){
    const bx = (g.tx+2)*TILE-camX, by = g.row*TILE-camY;
    crateAt(bx+3,by+17,17,14); crateAt(bx+8,by+7,14,11); sackAt(bx+19,by+13,12,18); basketAt(bx+13,by+31,11,true);
  }
  // проём под столом и нижняя полка с припасами
  ctx.fillStyle='#231b14'; ctx.fillRect(x0+12,y0+13,72,18);
  sackAt(x0+16,y0+17,14,12); barrelAt(x0+34,y0+17,13,13); crateAt(x0+52,y0+19,15,11); jarAt(x0+75,y0+29,'#7a5a3a');
  ctx.fillStyle=ST.wm; ctx.fillRect(x0+13,y0+28,70,3);
  ctx.fillStyle=ST.wm; ctx.fillRect(x0+9,y0+12,5,20); ctx.fillRect(x0+82,y0+12,5,20);
  ctx.fillStyle=ST.wh; ctx.fillRect(x0+9,y0+12,1.2,20); ctx.fillRect(x0+82,y0+12,1.2,20);
  // столешница
  ctx.fillStyle=ST.wl; ctx.strokeStyle='rgba(0,0,0,0.5)'; rrect(x0+6,y0+4,84,9,2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(40,28,16,0.45)'; for(let i=1;i<7;i++){ ctx.beginPath(); ctx.moveTo(x0+6+i*12,y0+5); ctx.lineTo(x0+6+i*12,y0+12); ctx.stroke(); }
  ctx.fillStyle=ST.wh; ctx.fillRect(x0+8,y0+4.5,80,1.6);
  ctx.fillStyle=ST.wm; ctx.fillRect(x0+6,y0+12,84,2.4);
  // товары на столе
  const by = y0+7;
  basketAt(x0+20,by,15,false); loafAt(x0+16,by-5,'#b88a45'); loafAt(x0+22,by-5.5,'#a87634'); loafAt(x0+19,by-8,'#c09450');
  jarAt(x0+33,by,'#8a6a45'); flaskAt(x0+39,by,'#8a7a5a');
  ctx.fillStyle='#cdbf9e'; rrect(x0+61,by-5,10,5,2.5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.stroke(); ctx.fillStyle=ST.red; ctx.fillRect(x0+64,by-5,2.6,5);
  basketAt(x0+80,by,13,true);
}
// навес из холста с рваным краем и заплаткой, вывеска (рисуется поверх игрока)
function drawStallRoof(camX,camY){
  const g = shopGeom(); if(!g) return;
  const x0 = g.x0-camX, y0 = g.y0-camY, now = Date.now()/1000;
  if(!onScreen(x0-20,y0-70,150,80)) return;
  const sway = Math.sin(now*0.9)*0.7, top = y0-47;
  const bottom = (t)=> top+21 - Math.sin(t*Math.PI)*6 + hash2(Math.floor(t*14),g.tx,700)*2.2 + ((Math.floor(t*14)%2)?2.5:0);
  ctx.beginPath(); ctx.moveTo(x0+5,top+3); ctx.quadraticCurveTo(x0+48,top-6+sway,x0+91,top+3); ctx.lineTo(x0+98,top+20);
  for(let i=0;i<=14;i++){ const t=i/14; ctx.lineTo(x0+98-t*100, bottom(t)+sway*0.6*Math.sin(t*5+now)); }
  ctx.closePath();
  const gr = ctx.createLinearGradient(0,top-6,0,top+26); gr.addColorStop(0,ST.can); gr.addColorStop(1,ST.canD);
  ctx.fillStyle=gr; ctx.fill(); ctx.strokeStyle='rgba(60,45,28,0.55)'; ctx.lineWidth=1; ctx.stroke();
  ctx.strokeStyle='rgba(90,72,48,0.28)';
  for(let i=0;i<7;i++){ const t=(i+0.5)/7; ctx.beginPath(); ctx.moveTo(x0+12+t*72,top+2); ctx.quadraticCurveTo(x0+8+t*80+sway,top+11,x0+t*98,bottom(t)-1); ctx.stroke(); }
  ctx.fillStyle='rgba(120,100,70,0.13)'; ell(x0+30,top+10,10,4,0.2); ctx.fill(); ell(x0+72,top+13,8,3.5,-0.2); ctx.fill();
  ctx.fillStyle='rgba(130,62,50,0.6)'; ctx.fillRect(x0+58,top+6,9,7); ctx.strokeStyle='rgba(60,30,20,0.55)'; ctx.setLineDash([2,2]); ctx.strokeRect(x0+58,top+6,9,7); ctx.setLineDash([]);
  // вывеска на верёвках
  const sg = Math.sin(now*1.5)*1;
  ctx.strokeStyle='#4a3320'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(x0+9,bottom(0.9)); ctx.lineTo(x0+10+sg,y0-27); ctx.moveTo(x0+31,bottom(0.77)); ctx.lineTo(x0+30+sg,y0-27); ctx.stroke();
  ctx.fillStyle='#4e3b2a'; rrect(x0+6+sg,y0-27,28,11,2.5); ctx.fill(); ctx.strokeStyle='#241a10'; ctx.stroke();
  ctx.fillStyle='#d8c8a0'; ctx.font='bold 8px sans-serif'; ctx.textAlign='center'; ctx.fillText('ЛАВКА',x0+20+sg,y0-19); ctx.textAlign='left';
}

function drawHPBar(x,y,w,h,ratio,fg,bg='#2a2a2a'){
  ctx.fillStyle=bg; ctx.fillRect(x,y,w,h);
  ctx.fillStyle=fg; ctx.fillRect(x,y,w*clamp(ratio,0,1),h);
  ctx.strokeStyle='#000'; ctx.lineWidth=1; ctx.strokeRect(x+0.5,y+0.5,w,h);
}

const ENEMY_LIFT = {frostmite:0, cinderhound:2, pyromancer:8, blizzardmage:8, venomtoad:2, boar:0, bandit:8, giantrat:0, gargoyle:8, salamander:2, vulture:6, icegolem:8, skelarcher:8, hunter:10, crossbowman:10, cursedbook:6, webspider:2, ghoul:6, banshee:3, lich:18, panther:3, shroom:5, gorilla:8, treant:22, spiderqueen:10, warlord:21, phantom:24, skeleton:8, wraith:3, frostwraith:3, boss:15, shadowlord:17, darkknight:8, zombie:5, golem:8, yeti:6, lavalord:18, pharaoh:16, frostking:19, goblin:3, imp:4, bat:0};
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(gameState==='start'){ return; }

  const mapPxW = loc.width*TILE, mapPxH = loc.height*TILE;
  // если карта меньше экрана — центрируем её, иначе камера следует за игроком
  const shkX = shakeT>0 ? Math.round((Math.random()-0.5)*7*Math.min(1,shakeT/400)) : 0, shkY = shakeT>0 ? Math.round((Math.random()-0.5)*7*Math.min(1,shakeT/400)) : 0;
  // у края карты камера может выходить за него, чтобы герой оставался в центре экрана
  const ovX = canvas.width/2, ovY2 = canvas.height/2;
  const camX = shkX + Math.round(mapPxW<=canvas.width ? -(canvas.width-mapPxW)/2 : clamp(player.x+player.w/2-canvas.width/2, -ovX, mapPxW-canvas.width+ovX));
  const camY = shkY + Math.round(mapPxH<=canvas.height ? -(canvas.height-mapPxH)/2 : clamp(player.y+player.h/2-canvas.height/2, -ovY2, mapPxH-canvas.height+ovY2));

  const startTX = Math.max(0, Math.floor(camX/TILE));
  const startTY = Math.max(0, Math.floor(camY/TILE));
  const endTX = Math.min(loc.width, Math.ceil((camX+canvas.width)/TILE)+1);
  const endTY = Math.min(loc.height, Math.ceil((camY+canvas.height)/TILE)+1);

  if(loc.type==='overworld'){
    drawGround(camX,camY);
    drawGrassAnim(startTX,startTY,endTX,endTY,camX,camY);
    drawWater(startTX,startTY,endTX,endTY,camX,camY);
    // кроны могут свешиваться на соседние клетки, поэтому берём диапазон шире на 1 тайл
    drawTrees(Math.max(0,startTX-1),Math.max(0,startTY-1),Math.min(loc.width,endTX+1),Math.min(loc.height,endTY+1),camX,camY);
    drawShopGround(camX,camY);
  } else {
    drawDungeonGround(camX,camY);
    drawShopGround(camX,camY);
    if(loc.level===4) drawLavaAnim(startTX,startTY,endTX,endTY,camX,camY);
  }
  drawPrints(camX,camY);
  drawTorchSprites(camX,camY);

  // предметы
  for(const it of loc.items){
    const sx=it.x-camX, sy=it.y-camY;
    if(it.type==='chest'){ drawLootChest(sx,sy,it); }
    else if(it.type==='key'){ drawKeyItem(sx,sy); }
    else if(it.type==='potion'){ ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(sx+8,sy+15,6,2.2,0,0,Math.PI*2); ctx.fill();
      drawPotionIcon(sx+8, sy+7+Math.sin(Date.now()/380+it.x)*1.3, 1.05, true); }
    else if(it.type==='gold'){ drawCoinPile(sx+8, sy+8, it.value); }
    else if(it.type==='gear'){ drawGearItem(sx,sy,it.gear); }
    else if(it.type==='elixir'){ ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(sx+8,sy+15,6,2.2,0,0,Math.PI*2); ctx.fill(); drawElixirIcon(sx+8, sy+7+Math.sin(Date.now()/380+it.x)*1.3, 1.1, it.kind, true); }
    else if(it.type==='amulet'){
      ctx.save(); ctx.translate(sx+8,sy+8); ctx.rotate(Math.PI/4);
      ctx.fillStyle='#c9a8ff'; ctx.fillRect(-8,-8,16,16);
      ctx.strokeStyle='#5c3d99'; ctx.lineWidth=2; ctx.strokeRect(-8,-8,16,16);
      ctx.restore();
    }
    else if(it.type==='treasure'){
      const pulse = 0.5+0.5*Math.sin(Date.now()/280), ice = loc.level===12;
      const gr = ctx.createRadialGradient(sx+8,sy+8,2,sx+8,sy+8,22); gr.addColorStop(0,ice?'rgba(150,255,120,'+(0.5+0.3*pulse)+')':'rgba(255,170,70,'+(0.5+0.3*pulse)+')'); gr.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(sx+8,sy+8,22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=ice?'#9dff6a':'#ff9f4a'; ctx.strokeStyle=ice?'#1c5a14':'#7a3d00'; ctx.lineWidth=2;
      ctx.beginPath(); if(ice){ ctx.moveTo(sx+8,sy-4); ctx.lineTo(sx+17,sy+8); ctx.lineTo(sx+8,sy+20); ctx.lineTo(sx-1,sy+8); ctx.closePath(); } else ctx.arc(sx+8,sy+8,10,0,Math.PI*2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(sx+5.5,sy+5,2,3.4,0.4,0,Math.PI*2); ctx.fill();
    }
  }

  drawChest(camX, camY); drawFolk(camX, camY); drawSage(camX, camY); drawEvents(camX, camY); drawWorldExtras(camX, camY);
  // торговец и прилавок
  if(loc.merchant){ drawStallBack(camX, camY); drawMerchant(loc.merchant, camX, camY); drawStallFront(camX, camY); }

  drawDying(camX, camY);
  drawPOIs(camX, camY);

  // враги
  for(const e of loc.enemies){
    if(e.hp<=0) continue;
    const sx=e.x-camX, sy=e.y-camY;
    if(e.elite){ ctx.strokeStyle='rgba(255,210,70,'+(0.6+0.3*Math.sin(Date.now()/200))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(sx+e.w/2, sy+e.h-2, e.w*0.7, e.w*0.28, 0, 0, 6.283); ctx.stroke(); }
    drawEnemy(e, sx, sy);
    const lift = ENEMY_LIFT[e.type] || 0, isBoss = BOSS_TYPES.includes(e.type);
    drawHPBar(sx, sy-8-lift, e.w, 4, e.hp/e.maxHp, isBoss?'#ff5050':'#e05a5a');
    if(isBoss){
      ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.textAlign='center';
      ctx.fillText(BOSS_LABEL[e.type], sx+e.w/2, sy-12-lift);
    }
  }

  drawAoes(camX, camY);
  // игрок
  {
    const sx=player.x-camX, sy=player.y-camY;
    drawHero(sx, sy);
    drawSkillFx(sx, sy); drawChargeFx(sx, sy); drawStatusFx(sx, sy);
    if(player.attacking) drawAttackFx(sx, sy);
  }
  drawArrows(camX, camY); drawEnemyShots(camX, camY);
  drawCaves(camX, camY); drawPortalCave(camX, camY);   // входы поверх игрока: за холмом герой скрывается
  drawParticles(camX, camY);
  if(loc.merchant) drawStallRoof(camX, camY);   // навес перекрывает всё, что за прилавком

  if(!loc.nofog) drawFog(camX, camY);
  drawAtmosphere(camX, camY);

  // стрелка к открытому спуску, если он за краем экрана
  if(loc.portal && loc.portal.open){
    const px=(loc.portal.tx+0.5)*TILE-camX, py=(loc.portal.ty+0.5)*TILE-camY, m=26;
    if(px<0||py<0||px>canvas.width||py>canvas.height){
      const cxs=canvas.width/2, cys=canvas.height/2, dx=px-cxs, dy=py-cys;
      const k=Math.min((cxs-m)/Math.max(Math.abs(dx),1e-6),(cys-m)/Math.max(Math.abs(dy),1e-6));
      const ax=cxs+dx*k, ay=cys+dy*k;
      ctx.save(); ctx.translate(ax,ay); ctx.rotate(Math.atan2(dy,dx));
      ctx.fillStyle='#c9a8ff'; ctx.strokeStyle='#2a1450'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(-8,-9); ctx.lineTo(-8,9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.fillStyle='#c9a8ff'; ctx.font='10px sans-serif'; ctx.textAlign='center';
      ctx.fillText('Спуск', ax, ay<cys ? ay+24 : ay-14); ctx.textAlign='left';
    }
  }

  drawTrackArrow(camX, camY);
  drawHUD();
  drawSkillBar(); drawElixHUD();
  if(loc.type==='overworld') drawMinimap();
  if(restFade>0){ const p = restFade/1400; ctx.fillStyle = 'rgba(4,4,12,'+(0.92*(1-Math.abs(2*p-1)))+')'; ctx.fillRect(0,0,canvas.width,canvas.height); }
}

const LEVEL_NAMES = {1:'Грот Шорохов', 2:'Логово Мортракса', 3:'Провал Безмолвия', 4:'Кузни Гхарраш', 5:'Пустошь Зарахаб', 6:'Край Белого Эха', 7:'Погост Увядших Звёзд', 8:'Дебри Ксилотара', 9:'Город Лиссарен', 10:'Дом', 11:'Град Вельмор', 12:'Обитель Пустых Зеркал'};
function getLocName(l){
  if(l.title) return l.title;
  if(l.type==='overworld') return 'Оверворлд';
  return LEVEL_NAMES[l.level] || 'Подземелье';
}

function drawHUD(){
  ctx.save(); ctx.translate(UI.l, UI.t);
  ctx.textAlign='left';
  // панель
  ctx.fillStyle='rgba(10,8,4,0.65)';
  ctx.fillRect(8,8,230,186);
  ctx.strokeStyle='#5c4415'; ctx.strokeRect(8,8,230,186);

  ctx.fillStyle='#f0e6c8'; ctx.font='bold 13px sans-serif';
  ctx.fillText(`Уровень ${player.level}`, 16, 24);
  if(player.sp>0){ ctx.fillStyle='#ffd34a'; ctx.font='bold 11px sans-serif'; ctx.fillText(`★ Очки навыков: ${player.sp}`, 92, 24); ctx.fillStyle='#f0e6c8'; }

  drawHPBar(16,30,150,12, player.hp/player.maxHp, '#d9534f');
  ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.textAlign='center';
  ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, 16+75, 39);
  ctx.textAlign='left';
  if(player.vkeys>0){ ctx.fillStyle='#ffd34a'; ctx.font='bold 12px sans-serif'; ctx.fillText('🗝 '+player.vkeys, 176, 40); ctx.fillStyle='#f0e6c8'; }

  drawHPBar(16,46,150,7, player.xp/player.xpNext, '#5aa7e0');

  coinAt(22,64,5.2,0); drawPotionIcon(137,63,0.72,false);
  ctx.fillStyle='#e0c23a'; ctx.font='12px sans-serif';
  ctx.fillText(`Золото: ${player.gold}`, 32, 68);
  ctx.fillStyle='#e05a5a';
  ctx.fillText(`Эликсиры: ${player.potions}`, 146, 68);

  // Инвентарь — слоты с зельями здоровья
  ctx.fillStyle='#cfc7a8'; ctx.font='11px sans-serif';
  ctx.fillText('Инвентарь:', 16, 86);
  const slotSize=18, gap=4, slots=8, startX=16, startY=92;
  for(let i=0;i<slots;i++){
    const sx = startX + i*(slotSize+gap);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(sx, startY, slotSize, slotSize);
    ctx.strokeStyle = '#5c4415';
    ctx.strokeRect(sx+0.5, startY+0.5, slotSize, slotSize);
    if(i < player.potions){
      drawPotionIcon(sx+slotSize/2, startY+slotSize/2+0.5, 0.95, false);
    }
  }
  if(player.potions>slots){
    ctx.fillStyle='#f0e6c8'; ctx.font='11px sans-serif';
    ctx.fillText(`+${player.potions-slots}`, startX+slots*(slotSize+gap), startY+13);
  }

  const locName = getLocName(loc);
  ctx.fillStyle='#cfc7a8'; ctx.font='11px sans-serif';
  ctx.fillText(`Оружие: ${WEAPONS[player.weapon].name}${(player.wLvl[player.weapon]||0) ? ' +'+player.wLvl[player.weapon] : ''}${player.ench[player.weapon] ? ' '+ENCH[player.ench[player.weapon]].icon : ''}  •  Урон: ${playerDamage()}`, 16, 128);
  ctx.fillText(`Броня: ${ARMORS[player.armor].name}  •  Защита: ${Math.round(Math.min(0.85, ARMORS[player.armor].reduce+gearStat('def')/100)*100)}%`, 16, 146);
  if(player.quest && QUESTS[player.quest.id]){
    const qd = QUESTS[player.quest.id];
    ctx.fillStyle = player.quest.done ? '#7fe07f' : '#e0c96a';
    ctx.fillText(player.quest.done ? '✔ «'+qd.name+'» — сдать торговцу' : '📜 '+qd.name+' '+player.quest.progress+'/'+qd.target, 16, 164);
  }
  { ctx.font='italic 11px sans-serif'; ctx.fillStyle='#d8b86a'; let gt = '➤ '+goalText(); while(gt.length>8 && ctx.measureText(gt).width>212) gt = gt.slice(0,-2);
    ctx.fillText(gt, 16, 184); }

  ctx.restore();

  // название локации и уведомления — в свободной полосе между миникартой и кнопками
  ctx.font='bold 14px sans-serif';
  const locName2 = getLocName(loc) + atmoLabel();
  const bw = Math.max(150, ctx.measureText(locName2).width+28);
  const mmRight = UI.l + 246 + (loc.type==='overworld' ? minimapSize()+6 : 0);
  const Lb = mmRight + 8, Rb = canvas.width - UI.r - 260;
  const fits = (Rb-Lb) >= 270;                      // иначе — под верхним рядом
  const cxA = fits ? (Lb+Rb)/2 : canvas.width/2;
  const by0 = fits ? UI.t+8 : UI.t+202, ny0 = fits ? UI.t+40 : UI.t+230;
  ctx.textAlign='center';
  ctx.fillStyle='rgba(10,8,4,0.55)'; ctx.fillRect(cxA-bw/2, by0, bw, 22);
  ctx.fillStyle='#e8c873'; ctx.fillText(locName2, cxA, by0+16);
  ctx.textAlign='left';

  // уведомления
  ctx.textAlign='center';
  notifications.slice(-4).forEach((n,i)=>{
    const alpha = clamp(n.timer/600,0,1);
    ctx.globalAlpha = alpha;
    ctx.font='12px sans-serif';
    ctx.fillStyle='rgba(10,8,4,0.6)';
    const w = ctx.measureText(n.text).width+20;
    ctx.fillRect(cxA-w/2, ny0+i*22, w, 18);
    ctx.fillStyle = n.color;
    ctx.fillText(n.text, cxA, ny0+13+i*22);
    ctx.globalAlpha = 1;
  });
  ctx.textAlign='left';
  if(saveFlash>0){
    ctx.globalAlpha = clamp(saveFlash/500,0,1);
    ctx.fillStyle='#a8d8a8'; ctx.font='11px sans-serif'; ctx.textAlign='right';
    ctx.fillText('💾 Сохранено', canvas.width-UI.r-14, UI.t+70);
    ctx.textAlign='left'; ctx.globalAlpha=1;
  }
}

function minimapSize(){ return canvas.width<900 ? 112 : 146; }
const MM_COL = { '~':[47,102,144], '^':[90,90,90], '#':[31,77,26], 'S':[138,90,43], 'B':[138,90,43], '.':[63,125,50] }, MM_FOG = [74,82,96];
function drawMinimap(){
  const mw=minimapSize(), mh=mw, mx=UI.l+248, my=UI.t+10;   // вверху, правее панели экипировки
  const F = getFog(loc);
  ctx.save();
  ctx.fillStyle='rgba(10,8,4,0.3)'; ctx.fillRect(mx-2,my-2,mw+4,mh+4);
  ctx.strokeStyle='rgba(92,68,21,0.8)'; ctx.strokeRect(mx-2,my-2,mw+4,mh+4);
  const sx = mw/loc.width, sy = mh/loc.height;
  ctx.globalAlpha = 0.5; // сама карта полупрозрачная — сквозь неё видно игру
  for(let y=0;y<loc.height;y+=2){
    for(let x=0;x<loc.width;x+=2){
      const c = MM_COL[loc.grid[y][x]] || MM_COL['.'];
      const v = Math.max(F.data[y*F.W+x], x+1<F.W ? F.data[y*F.W+x+1] : 0, y+1<F.H ? F.data[(y+1)*F.W+x] : 0);   // неоткрытое скрыто туманом
      ctx.fillStyle = 'rgb('+((MM_FOG[0]+(c[0]-MM_FOG[0])*v)|0)+','+((MM_FOG[1]+(c[1]-MM_FOG[1])*v)|0)+','+((MM_FOG[2]+(c[2]-MM_FOG[2])*v)|0)+')';
      ctx.fillRect(mx+x*sx, my+y*sy, sx*2, sy*2);
    }
  }
  ctx.globalAlpha = 0.95;
  // лавка (красная точка) и входы в пещеры (коричневые) показываются, когда их уже нашли
  if(loc.shop && F.data[loc.shop.ty*F.W+loc.shop.tx]>0.5){
    ctx.fillStyle='#e02a2a'; ctx.strokeStyle='#4a0c0c'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(mx+(loc.shop.tx+0.5)*sx, my+(loc.shop.ty+0.5)*sy, 3.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  }
  for(const it of loc.items){                                           // найденные сундуки и ключи
    if((it.type!=='chest' || it.open) && it.type!=='key') continue;
    const tx = Math.floor((it.x+it.w/2)/TILE), ty = Math.floor((it.y+it.h/2)/TILE);
    if(!(F.data[ty*F.W+tx]>0.5)) continue;
    ctx.fillStyle = it.type==='key' ? '#ffe04a' : it.locked ? '#9ab4e8' : '#e8a840'; ctx.strokeStyle='#2a1a06'; ctx.lineWidth=1;
    ctx.fillRect(mx+tx*sx-2, my+ty*sy-2, 5, 5); ctx.strokeRect(mx+tx*sx-2, my+ty*sy-2, 5, 5);
  }
  if(currentLocId==='overworld') for(const n of ev.npcs){
    if(n.loc!=='overworld') continue;
    const pulse = 0.6+0.4*Math.sin(Date.now()/300);
    ctx.globalAlpha = pulse; ctx.fillStyle = n.kind==='caravan' ? '#ff9a2a' : '#5aff9a'; ctx.strokeStyle='#1a1006';
    ctx.beginPath(); ctx.moveTo(mx+(n.x/TILE)*sx, my+(n.y/TILE)*sy-5); ctx.lineTo(mx+(n.x/TILE)*sx+5, my+(n.y/TILE)*sy); ctx.lineTo(mx+(n.x/TILE)*sx, my+(n.y/TILE)*sy+5); ctx.lineTo(mx+(n.x/TILE)*sx-5, my+(n.y/TILE)*sy); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 0.95;
  }
  if(loc.poi) for(const p of loc.poi){
    if(!p.seen && !(F.data[p.door.ty*F.W+p.door.tx]>0.5)) continue;
    ctx.fillStyle = '#ffd34a'; ctx.strokeStyle='#2a1a06'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(mx+(p.door.tx+0.5)*sx, my+(p.door.ty+0.5)*sy-4.5); ctx.lineTo(mx+(p.door.tx+0.5)*sx+4, my+(p.door.ty+0.5)*sy+3); ctx.lineTo(mx+(p.door.tx+0.5)*sx-4, my+(p.door.ty+0.5)*sy+3); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if(loc.entrances){
    for(const e of loc.entrances){
      if(e.hidden && !e.found) continue;
      if(F.data[e.ty*F.W+e.tx]<=0.5 && !e.hidden) continue;
      ctx.fillStyle = e.dungeon==='town' ? '#e8c040' : e.hidden ? '#b06aff' : '#8b5a2b'; ctx.strokeStyle='#2e1a08'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(mx+(e.tx+0.5)*sx, my+(e.ty+0.5)*sy, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
  }
  ctx.fillStyle='#4aa0e0'; ctx.strokeStyle='#0d2a40'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(mx+(player.x/TILE)*sx, my+(player.y/TILE)*sy, 3,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ---------- Туман: местность и карта открываются по мере приближения и больше не закрываются ----------
const FOG_R = 7.5;
const fogs = new WeakMap();
let fogTmp = null, fogTmpG = null, fogPat = null, fogTex = null;
function getFog(L){
  let F = fogs.get(L);
  if(!F){
    const W = L.width, H = L.height;
    F = { W, H, data:new Float32Array(W*H), cv:document.createElement('canvas'), dirty:true };
    F.cv.width = W; F.cv.height = H; F.g = F.cv.getContext('2d'); F.img = F.g.createImageData(W,H);
    if(typeof L.fog==='string' && L.fog.length===W*H) for(let i=0;i<W*H;i++) F.data[i] = (L.fog.charCodeAt(i)-48)/9;
    fogs.set(L,F);
  }
  return F;
}
function fogString(L){
  const F = fogs.get(L); if(!F) return typeof L.fog==='string' ? L.fog : null;
  let out = ''; for(let i=0;i<F.data.length;i++) out += String.fromCharCode(48+Math.round(F.data[i]*9));
  return out;
}
function updateFog(){
  const F = getFog(loc), px = (player.x+player.w/2)/TILE, py = (player.y+player.h/2)/TILE, r = Math.ceil(FOG_R);
  for(let y=Math.max(0,Math.floor(py)-r); y<=Math.min(F.H-1,Math.floor(py)+r); y++)
    for(let x=Math.max(0,Math.floor(px)-r); x<=Math.min(F.W-1,Math.floor(px)+r); x++){
      const v = clamp((FOG_R-Math.hypot(x+0.5-px,y+0.5-py))/3,0,1), i = y*F.W+x;
      if(v>F.data[i]+0.01){ F.data[i] = v; F.dirty = true; }
    }
}
const FOG_TINT = { 1:'rgba(8,8,14,0.5)', 2:'rgba(8,10,18,0.5)', 3:'rgba(14,6,26,0.5)', 4:'rgba(34,6,2,0.5)', 5:'rgba(236,206,150,0.3)', 6:'rgba(236,246,255,0.3)', 7:'rgba(10,18,14,0.5)', 8:'rgba(20,50,30,0.35)', 11:'rgba(26,20,26,0.45)', 12:'rgba(20,10,26,0.55)' };
function drawFog(camX,camY){
  const W = canvas.width, H = canvas.height, F = getFog(loc), FS = Q().fog;
  if(!fogTex){
    fogTex = document.createElement('canvas'); fogTex.width = fogTex.height = 256;
    const g = fogTex.getContext('2d'); g.fillStyle = 'rgb(140,152,168)'; g.fillRect(0,0,256,256);
    let sd = 7; const rr = ()=>{ sd = (sd*1664525+1013904223)>>>0; return sd/4294967296; };
    for(let i=0;i<46;i++){
      const x = rr()*256, y = rr()*256, r = 26+rr()*48, light = rr()<0.6;
      for(const ox of [-256,0,256]) for(const oy of [-256,0,256]){
        const gr = g.createRadialGradient(x+ox,y+oy,2,x+ox,y+oy,r);
        gr.addColorStop(0, light ? 'rgba(214,223,233,0.55)' : 'rgba(96,108,126,0.5)'); gr.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x+ox-r,y+oy-r,r*2,r*2);
      }
    }
  }
  if(!fogTmp || fogTmp.width!==Math.ceil(W*FS) || fogTmp.height!==Math.ceil(H*FS)){
    fogTmp = document.createElement('canvas'); fogTmp.width = Math.ceil(W*FS); fogTmp.height = Math.ceil(H*FS); fogTmpG = fogTmp.getContext('2d'); fogPat = fogTmpG.createPattern(fogTex,'repeat');
  }
  if(F.dirty){
    const d = F.img.data;
    for(let i=0;i<F.data.length;i++){ d[i*4+3] = Math.round((1-F.data[i])*0.97*255); }
    F.g.putImageData(F.img,0,0); F.dirty = false;
  }
  const g = fogTmpG, now = Date.now()/1000;
  g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation = 'source-over'; g.clearRect(0,0,W,H);
  const ox = -(camX*0.5) + now*7, oy = -(camY*0.5) + now*3;
  g.setTransform(FS,0,0,FS,(ox%256)*FS,(oy%256)*FS); g.fillStyle = fogPat; g.fillRect(-256,-256,W+512,H+512); g.setTransform(FS,0,0,FS,0,0);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = FOG_TINT[loc.level||0] || 'rgba(0,0,0,0)'; g.fillRect(0,0,W,H);
  g.globalCompositeOperation = 'destination-in'; g.imageSmoothingEnabled = true;
  g.drawImage(F.cv, 0,0,F.W,F.H, -camX,-camY, F.W*TILE, F.H*TILE);
  g.globalCompositeOperation = 'source-over'; g.setTransform(1,0,0,1,0,0);
  const ps = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.drawImage(fogTmp,0,0,W,H); ctx.imageSmoothingEnabled = ps;
}

// ---------- День, ночь и погода ----------
const DAY_LEN = 300;                                        // секунд на полные сутки
const OUTDOOR = { town:true, overworld:true, desert:true, ice:true, grave:true, jungle:true, city:true };  // под открытым небом: смена дня и ночи
const WEATHER_OPTS = {
  overworld:[['clear',45],['rain',25],['fog',15],['storm',15]],
  desert:[['clear',60],['sand',40]],
  ice:[['snow',60],['blizzard',40]],
  grave:[['fog',60],['clear',25],['rain',15]],
  jungle:[['rain',45],['clear',30],['fog',25]],
  town:[['clear',70],['rain',20],['fog',10]],
  city:[['fog',45],['rain',35],['clear',20]]
};
const env = { t:0.3, b:{}, flash:0, thunderIn:-1, lightCd:6 };
function pickWeather(biome, not){
  const opts = WEATHER_OPTS[biome].filter(o=>o[0]!==not), tot = opts.reduce((a,o)=>a+o[1],0);
  let r = Math.random()*tot; for(const o of opts){ r -= o[1]; if(r<=0) return o[0]; }
  return opts[0][0];
}
function resetEnv(){
  env.t = 0.3; env.flash = 0; env.thunderIn = -1; env.lightCd = 6;
  env.b = {
    overworld:{name:'clear', amt:1, next:null, timer:60+Math.random()*60, opts:true},
    desert:{name:'clear', amt:1, next:null, timer:40+Math.random()*40, opts:true},
    ice:{name:'snow', amt:1, next:null, timer:40+Math.random()*40, opts:true},
    grave:{name:'fog', amt:1, next:null, timer:40+Math.random()*40, opts:true},
    jungle:{name:'clear', amt:1, next:null, timer:40+Math.random()*40, opts:true},
    lava:{name:'embers', amt:1, next:null, timer:1e9, opts:false},
    town:{name:'clear', amt:1, next:null, timer:50+Math.random()*50, opts:true},
    city:{name:'fog', amt:1, next:null, timer:40+Math.random()*40, opts:true}
  };
}
resetEnv();
function packEnv(){ const w = {}; for(const k in env.b) w[k] = env.b[k].name; return {t:env.t, w}; }
function loadEnv(o){
  resetEnv();
  if(!o || typeof o.t!=='number') return;
  env.t = ((o.t%1)+1)%1;
  for(const k in (o.w||{})) if(env.b[k] && env.b[k].opts && WEATHER_OPTS[k].some(x=>x[0]===o.w[k])) env.b[k].name = o.w[k];
}
function sunLevel(){ return Math.sin((env.t-0.25)*Math.PI*2); }     // 1 в полдень, -1 в полночь
function darkness(){ const d = sstep(0,1, clamp((0.12-sunLevel())/0.55,0,1)); return currentLocId==='grave' ? Math.max(d,0.6) : d; }
function twilight(){ return clamp(1-Math.abs(sunLevel()-0.02)/0.36,0,1); }
function weatherName(){ const b = env.b[currentLocId]; return b ? b.name : 'none'; }
function updateEnv(dt){
  env.t = (env.t + dt/DAY_LEN) % 1;
  const b = env.b[currentLocId];
  if(b && b.opts){
    if(b.next){
      b.amt = Math.max(0, b.amt-dt/2.5);
      if(b.amt<=0){ b.name = b.next; b.next = null; }
    } else {
      b.amt = Math.min(1, b.amt+dt/2.5);
      b.timer -= dt;
      if(b.timer<=0){ b.timer = 60+Math.random()*80; const n = pickWeather(currentLocId, b.name); if(Math.random()<0.8) b.next = n; }
    }
  }
  if(b && b.name==='storm' && !b.next && b.amt>0.6){
    env.lightCd -= dt;
    if(env.lightCd<=0){ env.flash = 1; env.thunderIn = 0.25+Math.random()*0.9; env.lightCd = 5+Math.random()*9; }
  }
  if(env.flash>0) env.flash = Math.max(0, env.flash-dt*3);
  if(env.thunderIn>=0){ env.thunderIn -= dt; if(env.thunderIn<0){ SFX.play('thunder'); env.thunderIn = -1; } }
}
const WLABEL = { rain:'🌧 Дождь', storm:'⛈ Гроза', fog:'🌫 Туман', sand:'🌪 Песчаная буря', snow:'❄ Снег', blizzard:'🌨 Метель' };
function timeLabel(){ const dk = darkness(), sun = sunLevel(); return dk>0.6 ? '🌙 Ночь' : sun>0.3 ? '☀ День' : env.t<0.5 ? '🌅 Рассвет' : '🌇 Закат'; }
function atmoLabel(){
  if(!OUTDOOR[currentLocId]) return '';
  const b = env.b[currentLocId], w = b && b.amt>0.4 ? WLABEL[b.name] : '';
  return '  •  '+timeLabel()+(w ? '  '+w : '');
}

const RN = new Float32Array(900); for(let i=0;i<RN.length;i++) RN[i] = Math.random();
const frac = v => v-Math.floor(v);
let lightCv = null, lightG = null, fogSpr = null;
function drawWeather(){
  const b = env.b[currentLocId]; if(!b || b.amt<0.02) return;
  const a = b.amt, W = canvas.width, H = canvas.height, now = Date.now()/1000, area = Math.min(1.6, W*H/(900*500))*Q().part;
  switch(b.name){
    case 'rain': case 'storm': {
      const n = Math.min(300, Math.floor((b.name==='storm'?190:120)*a*area));
      ctx.strokeStyle = 'rgba(206,226,250,'+(0.55+0.2*a)+')'; ctx.lineWidth = 1.4; ctx.beginPath();
      for(let i=0;i<n;i++){
        const sp = 0.9+RN[i*3+2]*0.6, x = frac(RN[i*3]-now*0.1*sp)*(W+30), y = frac(RN[i*3+1]+now*1.35*sp)*(H+30)-15;
        ctx.moveTo(x,y); ctx.lineTo(x-4,y+16);
      }
      ctx.stroke(); break; }
    case 'snow': case 'blizzard': {
      const bl = b.name==='blizzard', n = Math.min(380, Math.floor((bl?230:100)*a*area));
      if(bl){ ctx.fillStyle = 'rgba(170,196,224,'+(0.24*a)+')'; ctx.fillRect(0,0,W,H); }
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = 'rgba(80,115,160,0.45)'; ctx.lineWidth = 1;
      for(let i=0;i<n;i++){
        const sp = 0.6+RN[i*3+2]*0.8, r = 0.9+sp*1.2;
        const x = frac(RN[i*3]+Math.sin(now*0.9+RN[i*3+1]*9)*0.015-now*(bl?0.3:0.025)*sp)*W, y = frac(RN[i*3+1]+now*(bl?0.3:0.1)*sp)*H;
        if(bl){ ctx.fillRect(x,y,r*3.2,r*0.9); } else { ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill(); ctx.stroke(); }
      }
      break; }
    case 'sand': {
      ctx.fillStyle = 'rgba(214,170,96,'+(0.24*a)+')'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = 'rgba(236,200,130,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
      const n = Math.min(220, Math.floor(130*a*area));
      for(let i=0;i<n;i++){ const sp = 0.8+RN[i*3+2], x = frac(RN[i*3]+now*0.55*sp)*(W+40)-20, y = frac(RN[i*3+1]+Math.sin(now*1.2+i)*0.01)*H; ctx.moveTo(x,y); ctx.lineTo(x-9-sp*5,y+1.5); }
      ctx.stroke(); break; }
    case 'fog': {
      if(!fogSpr){ fogSpr = document.createElement('canvas'); fogSpr.width = fogSpr.height = 128; const g = fogSpr.getContext('2d'), gr = g.createRadialGradient(64,64,4,64,64,64); gr.addColorStop(0,'rgba(226,234,240,0.55)'); gr.addColorStop(1,'rgba(226,234,240,0)'); g.fillStyle = gr; g.fillRect(0,0,128,128); }
      ctx.fillStyle = 'rgba(208,218,226,'+(0.2*a)+')'; ctx.fillRect(0,0,W,H);
      for(let i=0;i<9;i++){ const sz = 260+RN[i*3+2]*240, x = frac(RN[i*3]+now*0.006*(0.6+RN[i*3+2]))*(W+sz)-sz, y = RN[i*3+1]*H-sz/2; ctx.globalAlpha = a; ctx.drawImage(fogSpr,x,y,sz,sz); }
      ctx.globalAlpha = 1; break; }
    case 'embers': {
      for(let i=0,ne=Math.floor(46*Q().part);i<ne;i++){
        const sp = 0.5+RN[i*3+2]*0.9, x = frac(RN[i*3]+Math.sin(now*0.7+RN[i*3+1]*9)*0.02)*W, y = H-frac(RN[i*3+1]+now*0.05*sp)*(H+20)+10, k = 0.5+0.5*Math.sin(now*4+i);
        ctx.fillStyle = 'rgba(255,'+((120+k*100)|0)+',40,'+(0.35+0.4*k)+')'; ctx.beginPath(); ctx.arc(x,y,0.9+RN[i*3+2]*1.6,0,6.283); ctx.fill();
      }
      break; }
  }
}
// тёмное время суток: синяя вуаль с «дырами» света вокруг героя, лавки и пещер
function drawDayNight(camX,camY){
  if(!OUTDOOR[currentLocId]) return;
  const W = canvas.width, H = canvas.height, dk = darkness(), tw = twilight(), b = env.b[currentLocId];
  if(tw>0.02 && dk<0.98){ ctx.fillStyle = 'rgba(255,128,60,'+(0.18*tw)+')'; ctx.fillRect(0,0,W,H); }
  if(b){
    const dim = ({rain:0.14, storm:0.28, fog:0.06, snow:0.04, blizzard:0.12, sand:0.1})[b.name]||0;
    if(dim>0){ ctx.fillStyle = 'rgba(46,58,82,'+(dim*b.amt)+')'; ctx.fillRect(0,0,W,H); }
  }
  if(dk>0.02){
    if(!lightCv || lightCv.width!==W || lightCv.height!==H){ lightCv = document.createElement('canvas'); lightCv.width = W; lightCv.height = H; lightG = lightCv.getContext('2d'); }
    const g = lightG;
    g.globalCompositeOperation = 'source-over'; g.clearRect(0,0,W,H);
    g.fillStyle = 'rgba(8,14,44,'+(0.72*dk)+')'; g.fillRect(0,0,W,H);
    g.globalCompositeOperation = 'destination-out';
    const hole = (x,y,r,k)=>{ const gr = g.createRadialGradient(x,y,r*0.08,x,y,r); gr.addColorStop(0,'rgba(0,0,0,'+k+')'); gr.addColorStop(0.55,'rgba(0,0,0,'+(k*0.5)+')'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x-r,y-r,r*2,r*2); };
    const px = player.x+player.w/2-camX, py = player.y+player.h/2-camY;
    hole(px,py,175,0.95);
    let lamp = null;
    if(loc.merchant){ lamp = {x:loc.merchant.x+11-camX, y:loc.merchant.y+4-camY}; hole(lamp.x,lamp.y,125,0.9); }
    if(loc.lamps) for(const l of loc.lamps){ const lx = (l.tx+0.5)*TILE-camX, ly = l.ty*TILE-camY; if(lx>-120&&ly>-120&&lx<W+120&&ly<H+120) hole(lx,ly,105,0.85); }
    if(loc.houses) for(const h of loc.houses){ const hx = (h.x+3.5)*TILE-camX, hy = (h.y+3)*TILE-camY; if(hx>-100&&hy>-100&&hx<W+100&&hy<H+100) hole(hx,hy,78,0.6); }
    if(loc.entrances) for(const en of loc.entrances){ if(en.hidden && !en.found) continue; const ex = en.tx*TILE+16-camX, ey = en.ty*TILE+16-camY; if(ex>-90&&ey>-90&&ex<W+90&&ey<H+90) hole(ex,ey,75,0.6); }
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(lightCv,0,0);
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x,y,r,col)=>{ const gr = ctx.createRadialGradient(x,y,2,x,y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(x-r,y-r,r*2,r*2); };
    glow(px,py,150,'rgba(255,186,100,'+(0.16*dk)+')');
    if(lamp) glow(lamp.x,lamp.y,115,'rgba(255,166,64,'+(0.3*dk)+')');
    ctx.globalCompositeOperation = 'source-over';
    // светлячки на поверхности
    if((currentLocId==='overworld' || currentLocId==='jungle') && dk>0.3 && (!b || (b.name!=='rain' && b.name!=='storm'))){
      const now = Date.now()/1000;
      for(let i=0;i<26;i++){
        const x = frac(RN[i*3]+Math.sin(now*0.3+RN[i*3+1]*9)*0.04)*W, y = frac(RN[i*3+1]+Math.cos(now*0.25+RN[i*3]*9)*0.04)*H, k = 0.5+0.5*Math.sin(now*2.2+i*1.7);
        ctx.fillStyle = 'rgba(210,255,110,'+(0.2*dk*k)+')'; ctx.beginPath(); ctx.arc(x,y,5,0,6.283); ctx.fill();
        ctx.fillStyle = 'rgba(240,255,170,'+(0.9*dk*k)+')'; ctx.beginPath(); ctx.arc(x,y,1.3,0,6.283); ctx.fill();
      }
    }
  }
  if(env.flash>0){ ctx.fillStyle = 'rgba(235,240,255,'+(0.55*env.flash)+')'; ctx.fillRect(0,0,W,H); }
}
const torchCache = new WeakMap();
function getTorches(L){
  let t = torchCache.get(L); if(t) return t;
  t = {torch:[], lava:[]};
  const cT = [], cL = [];
  for(let y=1;y<L.height-1;y++) for(let x=1;x<L.width-1;x++){
    const c = L.grid[y][x];
    if(c==='.' && L.grid[y-1][x]==='#') cT.push([hash2(x,y,501),x,y]);
    else if(c==='L') cL.push([hash2(x,y,503),x,y]);
  }
  cT.sort((a,b)=>a[0]-b[0]); cL.sort((a,b)=>a[0]-b[0]);
  const wantT = Math.min(60, Math.max(4, Math.round(L.width*L.height/260)));
  for(const q of cT){ if(t.torch.length>=wantT) break; if(t.torch.every(o=>Math.hypot(o.tx-q[1],o.ty-q[2])>7)) t.torch.push({tx:q[1],ty:q[2],seed:q[0]*100}); }
  for(const q of cL){ if(t.lava.length>=16) break; if(t.lava.every(o=>Math.hypot(o.tx-q[1],o.ty-q[2])>2.5)) t.lava.push({tx:q[1],ty:q[2],seed:q[0]*100}); }
  torchCache.set(L,t); return t;
}
function caveLit(){ return loc.type==='dungeon' && !loc.safe && !OUTDOOR[currentLocId] && !loc.nofog; }
function flickerAt(seed, now){ return 1 + 0.06*Math.sin(now*9+seed) + 0.04*Math.sin(now*23+seed*2.3) + 0.03*Math.sin(now*41+seed*0.7); }
function drawTorchSprites(camX,camY){
  if(!caveLit() || loc.level===4 && false) return;
  const T = getTorches(loc), now = Date.now()/1000, W = canvas.width, H = canvas.height;
  for(const q of T.torch){
    const x = q.tx*TILE+16-camX, y = q.ty*TILE+2-camY; if(x<-30||y<-30||x>W+30||y>H+30) continue;
    const f = flickerAt(q.seed, now);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x-1.5,y-7,3,9); ctx.fillStyle = '#6a5a4a'; ctx.fillRect(x-3,y-8,6,2);          // кронштейн
    ctx.fillStyle = 'rgba(255,120,30,0.9)'; ctx.beginPath(); ctx.ellipse(x,y-12,3.2*f,6*f,0,0,6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,90,0.95)'; ctx.beginPath(); ctx.ellipse(x,y-11,1.8,3.6*f,0,0,6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.9)'; ctx.beginPath(); ctx.ellipse(x,y-10,0.9,1.8,0,0,6.283); ctx.fill();
  }
}
function drawCaveLight(camX,camY){
  const W = canvas.width, H = canvas.height, now = Date.now()/1000, QL = Q().light;
  if(!lightCv || lightCv.width!==W || lightCv.height!==H){ lightCv = document.createElement('canvas'); lightCv.width = W; lightCv.height = H; lightG = lightCv.getContext('2d'); }
  const g = lightG, T = getTorches(loc), lair = !!LAIR[currentLocId], lava = loc.level===4;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0,0,W,H);
  g.fillStyle = 'rgba(3,4,12,'+(lava ? 0.62 : lair ? 0.8 : 0.74)+')'; g.fillRect(0,0,W,H);
  g.globalCompositeOperation = 'destination-out';
  const hole = (x,y,r,k)=>{ const gr = g.createRadialGradient(x,y,r*0.06,x,y,r); gr.addColorStop(0,'rgba(0,0,0,'+k+')'); gr.addColorStop(0.5,'rgba(0,0,0,'+(k*0.55)+')'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x-r,y-r,r*2,r*2); };
  const px = player.x+player.w/2-camX, py = player.y+player.h/2-camY, pf = QL>0 ? flickerAt(1.7,now) : 1;
  hole(px,py,215*pf,0.97);
  const vis = [];
  for(const q of T.torch){ const x = q.tx*TILE+16-camX, y = q.ty*TILE-8-camY; if(x<-150||y<-150||x>W+150||y>H+150) continue; const f = QL>0 ? flickerAt(q.seed,now) : 1; hole(x,y,135*f,0.92); vis.push([x,y,f,255,150,60]); }
  for(const q of T.lava){ const x = q.tx*TILE+16-camX, y = q.ty*TILE+16-camY; if(x<-120||y<-120||x>W+120||y>H+120) continue; const f = flickerAt(q.seed,now*0.6); hole(x,y,95*f,0.8); vis.push([x,y,f,255,70,20]); }
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(lightCv,0,0);
  if(QL>1){
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x,y,r,col)=>{ const gr = ctx.createRadialGradient(x,y,2,x,y,r); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(x-r,y-r,r*2,r*2); };
    glow(px,py,170*pf,'rgba(255,176,96,0.13)');
    for(const v of vis) glow(v[0],v[1],100*v[2],'rgba(%R,%G,%B,0.22)'.replace('%R',v[3]).replace('%G',v[4]).replace('%B',v[5]));
    ctx.globalCompositeOperation = 'source-over';
  }
}
function drawAtmosphere(camX,camY){ drawWeather(); if(caveLit()) drawCaveLight(camX,camY); drawDayNight(camX,camY); if(loc.level===4 && env.b.lava) { /* угли рисуются в drawWeather */ } }

