// ---------- Генерация открытого мира ----------
function generateOverworld(){
  const W=112,H=112;
  const grid = makeGrid(W,H,'.');
  for(let x=0;x<W;x++){ grid[0][x]='^'; grid[H-1][x]='^'; }
  for(let y=0;y<H;y++){ grid[y][0]='^'; grid[y][W-1]='^'; }
  // извилистая полоса гор вдоль края: глубина 1–4 клетки, плавно меняется
  const bandDepth = ()=>{ const a = Math.random()*6.3, b = Math.random()*6.3, c = Math.random()*6.3; return i=>{ const v = 0.5+0.5*(0.5*Math.sin(i*0.13+a)+0.3*Math.sin(i*0.31+b)+0.2*Math.sin(i*0.77+c)); return 1+Math.floor(clamp(v,0,0.999)*4); }; };
  { const dT = bandDepth(), dB = bandDepth(), dL = bandDepth(), dR = bandDepth();
    for(let x=0;x<W;x++){ for(let k=0;k<dT(x);k++) grid[k][x]='^'; for(let k=0;k<dB(x);k++) grid[H-1-k][x]='^'; }
    for(let y=0;y<H;y++){ for(let k=0;k<dL(y);k++) grid[y][k]='^'; for(let k=0;k<dR(y);k++) grid[y][W-1-k]='^'; } }
  // озёра — сплошные (без случайных дыр/одиночных клеток внутри)
  for(let i=0;i<26;i++){
    const cx=rnd(6,W-6), cy=rnd(6,H-6), r=rnd(3,8);
    for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++){
      if(x<1||y<1||x>=W-1||y>=H-1 || grid[y][x]==='^') continue;
      if(Math.hypot(x-cx,y-cy)<r*0.85) grid[y][x]='~';
    }
  }
  // убираем случайные одиночные клетки воды (без соседей-воды)
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    if(grid[y][x]==='~'){
      const neighbors=[grid[y-1][x],grid[y+1][x],grid[y][x-1],grid[y][x+1]];
      if(!neighbors.includes('~')) grid[y][x]='.';
    }
  }
  // деревья
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++)
    if(grid[y][x]==='.' && Math.random()<0.09) grid[y][x]='#';

  const cx=Math.floor(W/2), cy=Math.floor(H/2);
  clearArea(grid,cx,cy,3,'.');

  // торговая лавка — в случайном углу карты
  const shopLeft = Math.random()<0.5, shopTop = Math.random()<0.5;
  const shopX = shopLeft ? 9 : W-10, shopY = shopTop ? 9 : H-10;   // чуть вглубь от края, чтобы лавку не закрывал интерфейс
  clearArea(grid,shopX,shopY,4,'.');
  // дорога от лавки к центру: прорубаем воду и лес, чтобы лавка всегда была достижима
  for(let x=Math.min(shopX,cx); x<=Math.max(shopX,cx); x++) for(let d=0; d<2; d++){
    const t=grid[shopY+d][x]; if(t==='~'||t==='#') grid[shopY+d][x]='.';
  }
  for(let y=Math.min(shopY,cy); y<=Math.max(shopY,cy); y++) for(let d=0; d<2; d++){
    const t=grid[y][cx+d]; if(t==='~'||t==='#') grid[y][cx+d]='.';
  }
  const stallY = shopY+1;                       // прилавок перед торговцем, покупатель подходит с юга
  for(let dx=-1; dx<=1; dx++) grid[stallY][shopX+dx]='S';
  grid[stallY][shopX-2]='B'; grid[stallY][shopX+2]='B';   // бочка и ящики по краям
  const farShop = p => Math.hypot(p.x-shopX,p.y-shopY) >= 10;

  // входы в подземелья, подальше друг от друга и от центра
  let e1 = findFloor(grid,W,H,'.',30,cx,cy);
  for(let t=0; !farShop(e1) && t<100; t++) e1 = findFloor(grid,W,H,'.',30,cx,cy);
  clearArea(grid,e1.x,e1.y,2,'.');
  grid[e1.y][e1.x]='>';
  { const seenE = floodFrom(grid,cx,cy,'~^#SB'); if(!seenE[e1.x+(e1.y+2)*W]) carveRoad(grid,e1.x,e1.y+2,cx,cy); }   // вход не должен оказаться на острове посреди озера
  const enemies=[];
  for(let i=0;i<58;i++){
    let p=findFloor(grid,W,H,'.',9,cx,cy);
    const nearCave = (q)=>Math.hypot(q.x-e1.x,q.y-e1.y)<11;
    for(let t=0; (Math.hypot(p.x-shopX,p.y-shopY)<8 || nearCave(p)) && t<120; t++) p=findFloor(grid,W,H,'.',9,cx,cy);
    { const ro=LEVEL_ROSTER[0]; enemies.push(makeEnemy(ro[rnd(0,ro.length-1)], p.x*TILE+4, p.y*TILE+4)); }
  }
  const items=[];
  for(let i=0;i<40;i++){
    const p=findFloor(grid,W,H,'.',3,cx,cy);
    const pt = pickupType(0.17); if(pt) items.push(makeItem(pt, p.x*TILE+10, p.y*TILE+10));
  }

  const ow = {
    type:'overworld', grid, width:W, height:H, enemies, items,
    spawn:{x:cx*TILE, y:cy*TILE},
    shop:{tx:shopX, ty:shopY},
    merchant:{x:shopX*TILE+5, y:shopY*TILE+5, w:22, h:22},
    entrances:[
      {tx:e1.x, ty:e1.y, dungeon:'lair1', back:{x:e1.x*TILE, y:(e1.y+2)*TILE}}
    ]
  };
  placeTownGate(ow, ow.entrances[0]);
  return ow;
}

// ---------- Генерация подземелья ----------
function generateDungeonOnce(level){
  const W = level<3 ? 50 : level===12 ? 60 : 64, H = W;
  const grid = makeGrid(W,H,'#');
  const setFloor=(x,y)=>{ if(x>0&&y>0&&x<W-1&&y<H-1) grid[y][x]='.'; };
  const carveH=(y,x1,x2)=>{ for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++){ setFloor(x,y); setFloor(x,y+1); } };
  const carveV=(x,y1,y2)=>{ for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++){ setFloor(x,y); setFloor(x+1,y); } };
  const roomCount = level<3 ? 14+level*3 : level===12 ? 36 : 46;
  const rooms=[];
  for(let i=0;i<roomCount;i++){
    const rw=rnd(4,7), rh=rnd(4,7);
    const rx=rnd(1,W-rw-2), ry=rnd(1,H-rh-2);
    for(let y=ry;y<ry+rh;y++) for(let x=rx;x<rx+rw;x++) grid[y][x]='.';
    rooms.push({x:rx,y:ry,w:rw,h:rh,cx:rx+Math.floor(rw/2),cy:ry+Math.floor(rh/2)});
  }
  // комната босса (и спуска вглубь) — самая дальняя от входа, чтобы выход и спуск не оказывались рядом
  { let far=1, best=-1;
    for(let i=1;i<rooms.length;i++){ const d=Math.hypot(rooms[i].cx-rooms[0].cx, rooms[i].cy-rooms[0].cy); if(d>best){ best=d; far=i; } }
    const t=rooms[far]; rooms[far]=rooms[rooms.length-1]; rooms[rooms.length-1]=t; }
  // коридоры шириной 2 клетки, чтобы крупные враги (Мортракс) могли проходить
  for(let i=1;i<rooms.length;i++){
    const a=rooms[i-1], b=rooms[i];
    if(Math.random()<0.5){
      carveH(a.cy, a.cx, b.cx);
      carveV(b.cx, a.cy, b.cy);
    } else {
      carveV(a.cx, a.cy, b.cy);
      carveH(b.cy, a.cx, b.cx);
    }
  }
  const entrance = rooms[0];
  grid[entrance.cy][entrance.cx]='<';

  const enemies=[];
  const types = LEVEL_ROSTER[level] || LEVEL_ROSTER[1];
  const fillChance = level<3 ? 0.75 : 0.85;
  for(let i=1;i<rooms.length-1;i++){
    if(Math.random()<fillChance){
      const r=rooms[i];
      if(Math.hypot(r.cx-entrance.cx, r.cy-entrance.cy) < 9) continue;
      const t=types[rnd(0,types.length-1)];
      enemies.push(makeEnemy(t, r.cx*TILE+4, r.cy*TILE+4, level));
    }
  }
  const items=[];
  for(let i=1;i<rooms.length-1;i++){
    if(Math.random()<0.5){
      const r=rooms[i];
      const pt = pickupType(0.2); if(pt) items.push(makeItem(pt, r.cx*TILE+10+rnd(-8,8), r.cy*TILE+10+rnd(-8,8)));
    }
  }
  const lastRoom = rooms[rooms.length-1];
  // боссы теперь живут в отдельных логовах между уровнями; здесь в глубине всегда открыт проход к следующему логову
  const boss=null, portal = {tx:lastRoom.cx, ty:lastRoom.cy, open:true};
  grid[lastRoom.cy][lastRoom.cx] = 'v';
  if(level===4) addLavaPools(grid, rooms, [[entrance.cx,entrance.cy+1],[lastRoom.cx,lastRoom.cy+1]]);

  return {
    type:'dungeon', level, grid, width:W, height:H, enemies, items, boss, portal,
    spawn:{x:entrance.cx*TILE, y:(entrance.cy+1)*TILE},
    exit:{tx:entrance.cx, ty:entrance.cy}
  };
}

// лавовые озёра в комнатах: непроходимы, но все комнаты должны оставаться достижимыми
function addLavaPools(grid, rooms, keep){
  keep = keep||[];
  const nearKeep = (x,y)=> keep.some(k=>Math.hypot(x-k[0],y-k[1])<4);
  const H = grid.length, W = grid[0].length;
  const reachable = ()=>{
    const seen = makeGrid(W,H,false), q = [[rooms[0].cx, rooms[0].cy]]; seen[rooms[0].cy][rooms[0].cx] = true;
    while(q.length){
      const [x,y] = q.pop();
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy;
        if(nx<0||ny<0||nx>=W||ny>=H||seen[ny][nx]) continue;
        const t = grid[ny][nx]; if(t==='#'||t==='L') continue;
        seen[ny][nx] = true; q.push([nx,ny]);
      }
    }
    return rooms.every(r=>seen[r.cy][r.cx]);
  };
  for(let i=1;i<rooms.length-1;i++){
    const r = rooms[i];
    for(let tries=0; tries<3; tries++){
      if(Math.random()<0.35) continue;
      const px = rnd(r.x+1, r.x+r.w-2), py = rnd(r.y+1, r.y+r.h-2);
      if(Math.abs(px-r.cx)<=1 && Math.abs(py-r.cy)<=1) continue;
      const cells = [[px,py]];
      if(Math.random()<0.6) cells.push([px+(Math.random()<0.5?1:-1), py]);
      if(Math.random()<0.4) cells.push([px, py+(Math.random()<0.5?1:-1)]);
      const changed = [];
      for(const [x,y] of cells){
        if(x<1||y<1||x>=W-1||y>=H-1||grid[y][x]!=='.') continue;
        if(Math.abs(x-r.cx)<=1 && Math.abs(y-r.cy)<=1) continue;
        if(nearKeep(x,y)) continue;
        grid[y][x] = 'L'; changed.push([x,y]);
      }
      if(changed.length && !reachable()) for(const [x,y] of changed) grid[y][x] = '.';
    }
  }
}

// открытые карты (пустыня, ледяной край): широкое поле, вход слева, арена с владыкой справа
// торговая лавка на открытых картах: рядом со входом, чтобы можно было закупиться
function fieldShop(grid, sxx, syy){
  const H = grid.length, W = grid[0].length, sx = sxx===undefined ? 10 : sxx, sy = syy===undefined ? Math.floor(H/2)-7 : syy;
  for(let y=sy-3;y<=sy+3;y++) for(let x=sx-3;x<=sx+3;x++)
    if(Math.hypot(x-sx,y-sy)<=3.4 && x>=2 && y>=2 && x<W-2 && y<H-2) grid[y][x] = '.';
  for(let dx=-1;dx<=1;dx++) grid[sy+1][sx+dx] = 'S';
  grid[sy+1][sx-2] = 'B'; grid[sy+1][sx+2] = 'B';
  return { shop:{tx:sx, ty:sy}, merchant:{x:sx*TILE+5, y:sy*TILE+5, w:22, h:22} };
}
function generateField(level, biome){
  const W=96, H=96, my=Math.floor(H/2), ax=W-11;
  const grid = makeGrid(W,H,'.');
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x<2||y<2||x>=W-2||y>=H-2) grid[y][x]='#';
  if(biome==='city'){                                   // кварталы: прямоугольные дома, между ними улицы
    for(let i=0;i<84;i++){
      const bw=rnd(3,6), bh=rnd(3,5), bx=rnd(4,W-bw-4), by=rnd(3,H-bh-3);
      for(let y=by;y<by+bh;y++) for(let x=bx;x<bx+bw;x++) if(x>=2&&y>=2&&x<W-2&&y<H-2) grid[y][x]='#';
    }
  } else
  for(let i=0;i<136;i++){
    const cx=rnd(5,W-6), cy=rnd(4,H-5), r=rnd(1,3);
    for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++)
      if(x>=2&&y>=2&&x<W-2&&y<H-2 && Math.hypot(x-cx,y-cy)<=r+0.2) grid[y][x]='#';
  }
  const clearC=(cx,cy,r)=>{ for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++) if(x>=2&&y>=2&&x<W-2&&y<H-2 && Math.hypot(x-cx,y-cy)<=r) grid[y][x]='.'; };
  clearC(5,my,4); clearC(ax,my,6);
  for(let x=2;x<=ax;x++) for(let d=-1;d<=1;d++) grid[my+d][x]='.';
  grid[my][3]='<';
  const fs = fieldShop(grid);
  // клетки, достижимые от входа и окружённые свободным местом (чтобы враги не застревали)
  const seen = makeGrid(W,H,false), q=[[5,my]]; seen[my][5]=true;
  while(q.length){ const [x,y]=q.pop(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H||seen[ny][nx]||'#SB'.includes(grid[ny][nx])) continue; seen[ny][nx]=true; q.push([nx,ny]); } }
  const open8 = (x,y)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if('#SB'.includes(grid[y+dy][x+dx])) return false; return true; };
  const cells=[];
  for(let y=3;y<H-3;y++) for(let x=3;x<W-3;x++) if(seen[y][x] && grid[y][x]==='.' && open8(x,y) && Math.hypot(x-fs.shop.tx,y-fs.shop.ty)>=5) cells.push([x,y]);
  const take=(pred)=>{ const c = cells.filter(pred); return c.length ? c[rnd(0,c.length-1)] : [Math.floor(W/2), my]; };
  const dEnt=(c)=>Math.hypot(c[0]-5,c[1]-my), dArena=(c)=>Math.hypot(c[0]-ax,c[1]-my);
  const roster = LEVEL_ROSTER[({desert:5, ice:6, grave:7, jungle:8, city:11})[biome]];
  const enemies=[], items=[];
  for(let i=0;i<62;i++){ const c=take(c=>dEnt(c)>=12 && dArena(c)>=8); enemies.push(makeEnemy(roster[rnd(0,roster.length-1)], c[0]*TILE+3, c[1]*TILE+3, level)); }
  for(let i=0;i<4;i++){ const c=take(c=>dArena(c)>=8 && dArena(c)<=12); enemies.push(makeEnemy(roster[rnd(0,roster.length-1)], c[0]*TILE+3, c[1]*TILE+3, level)); }
  for(let i=0;i<30;i++){ const c=take(c=>dEnt(c)>=5); const pt = pickupType(0.2); if(pt) items.push(makeItem(pt, c[0]*TILE+10, c[1]*TILE+10)); }
  grid[my][ax] = 'v';                                   // проход к логову следующего босса — всегда открыт
  return { type:'dungeon', level, biome, grid, width:W, height:H, enemies, items, boss:null, shop:fs.shop, merchant:fs.merchant,
    portal:{tx:ax, ty:my, open:true},
    spawn:{x:5*TILE, y:my*TILE}, exit:{tx:3, ty:my} };
}

// генерируем подземелье заново, пока выход и комната босса/спуска не окажутся достаточно далеко друг от друга
function generateDungeon(level){
  const minDist = level===1 ? 22 : level===2 ? 26 : 34;
  let L = null;
  for(let i=0;i<40;i++){
    L = generateDungeonOnce(level);
        const tx = L.portal ? L.portal.tx : L.boss ? Math.floor(L.boss.x/TILE) : null, ty = L.portal ? L.portal.ty : L.boss ? Math.floor(L.boss.y/TILE) : null;
    if(tx===null || Math.hypot(tx-L.exit.tx, ty-L.exit.ty) >= minDist) return L;
  }
  return L;
}

// ---------- Город Лиссарен и дома внутри ----------
function floodFrom(grid, sx, sy, bad){
  const H = grid.length, W = grid[0].length, seen = new Uint8Array(W*H), q = [sx+sy*W]; seen[q[0]] = 1;
  for(let h=0; h<q.length; h++){
    const c = q[h], x = c%W, y = (c/W)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x+dx, ny = y+dy;
      if(nx<0||ny<0||nx>=W||ny>=H||seen[nx+ny*W]||bad.includes(grid[ny][nx])) continue;
      seen[nx+ny*W] = 1; q.push(nx+ny*W);
    }
  }
  return seen;
}
function carveRoad(grid,x0,y0,x1,y1){
  const cut = (x,y)=>{ if(y>0&&x>0&&y<grid.length-1&&x<grid[0].length-1&&(grid[y][x]==='~'||grid[y][x]==='#')) grid[y][x] = '.'; };
  for(let x=Math.min(x0,x1); x<=Math.max(x0,x1); x++){ cut(x,y0); cut(x,y0+1); }
  for(let y=Math.min(y0,y1); y<=Math.max(y0,y1); y++){ cut(x1,y); cut(x1+1,y); }
}
// ворота города на поверхности: далеко от пещеры и лавки, и обязательно достижимы
function placeTownGate(ow, e1){
  const grid = ow.grid, W = ow.width, H = ow.height, cx = Math.floor(W/2), cy = Math.floor(H/2), sh = ow.shop;
  let p = null;
  for(let t=0; t<600 && !p; t++){
    const x = rnd(8,W-9), y = rnd(8,H-9);
    if(grid[y][x]!=='.') continue;
    if(e1 && Math.hypot(x-e1.tx,y-e1.ty)<(t<300?26:16)) continue;
    if(sh && Math.hypot(x-sh.tx,y-sh.ty)<14) continue;
    if(Math.hypot(x-cx,y-cy)<14) continue;
    p = {x,y};
  }
  if(!p) p = {x:Math.min(W-9,cx+18), y:Math.min(H-9,cy+14)};
  clearArea(grid,p.x,p.y,2,'.'); grid[p.y][p.x] = '>';
  const seen = floodFrom(grid,cx,cy,'~^#SB');
  if(!seen[p.x+(p.y+1)*W]) carveRoad(grid,p.x,p.y+2,cx,cy);
  const en = {tx:p.x, ty:p.y, dungeon:'town', back:{x:p.x*TILE, y:(p.y+2)*TILE}};
  ow.entrances.push(en);
  ow.enemies = ow.enemies.filter(e=> Math.hypot(e.x/TILE-p.x, e.y/TILE-p.y)>=11);
  return en;
}

const TOWN_W = 46, TOWN_H = 34;
function townPaths(L){
  const W = L.width, H = L.height, P = makeGrid(W,H,false);
  const rect = (x0,y0,x1,y1)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(x>0&&y>0&&x<W-1&&y<H) P[y][x] = true; };
  rect(2,9,W-3,10); rect(2,27,W-3,28); rect(22,9,24,H-1);
  for(const h of L.houses){ const dx = h.x+3, dy = h.y+3; if(h.y<14) rect(dx,dy+1,dx,8); else rect(dx,dy+1,dx,26); }
  return P;
}
function generateTown(){
  const W = TOWN_W, H = TOWN_H, grid = makeGrid(W,H,'.');
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x===0||y===0||x===W-1||y===H-1) grid[y][x] = '#';
  for(let x=22;x<=24;x++) grid[H-1][x] = '.';                               // ворота
  const houses = [
    {x:4,  y:4,  to:'house1', kind:'inn',   roof:'#9a3b2e', wall:'#dccdb0', sign:'inn'},
    {x:14, y:4,  roof:'#3b5c8a', wall:'#d6c7a8'},
    {x:26, y:4,  roof:'#7a5a2e', wall:'#d9ceb6'},
    {x:36, y:4,  to:'house2', kind:'alch',  roof:'#5a3a7a', wall:'#d4cbbb', sign:'alch'},
    {x:4,  y:20, roof:'#2e6a4a', wall:'#d8cbb0'},
    {x:36, y:20, roof:'#9a3b2e', wall:'#d6c9ae'}
  ];
  const doors = [];
  for(const h of houses){
    for(let y=h.y;y<h.y+4;y++) for(let x=h.x;x<h.x+6;x++) grid[y][x] = '#';
    if(h.to){ grid[h.y+3][h.x+3] = 'D'; doors.push({tx:h.x+3, ty:h.y+3, to:h.to, msg:h.kind==='inn' ? 'Вы входите в трактир «Дремлющий Грифон»' : 'Вы входите в лавку «Дымный Тигель»'}); }
  }
  const fs = fieldShop(grid, 23, 15);
  const props = [{k:'fountain', tx:13, ty:14, w:2, h:2}, {k:'well', tx:31, ty:14, w:2, h:2}];
  for(const p of props) for(let y=p.ty;y<p.ty+p.h;y++) for(let x=p.tx;x<p.tx+p.w;x++) grid[y][x] = 'B';
  const L = {width:W, height:H, houses};
  const P = townPaths(L), trees = [];
  for(let tries=0; tries<600 && trees.length<42; tries++){
    const x = rnd(2,W-3), y = rnd(11,H-4);
    if(P[y][x] || grid[y][x]!=='.') continue;
    if(Math.hypot(x-23,y-16)<7.5 || Math.hypot(x-23,y-(H-1))<6) continue;
    if(houses.some(h=> x>=h.x-1 && x<=h.x+6 && y>=h.y-1 && y<=h.y+4)) continue;
    if(props.some(p=> x>=p.tx-1 && x<=p.tx+p.w && y>=p.ty-1 && y<=p.ty+p.h)) continue;
    if(trees.some(t=> Math.abs(t.tx-x)<=1 && Math.abs(t.ty-y)<=1)) continue;
    grid[y][x] = '#'; trees.push({tx:x, ty:y});
  }
  const lamps = [[3,11],[12,8],[20,11],[26,11],[34,8],[43,11],[20,26],[26,26],[3,26],[43,26],[21,30],[25,30]].map(([tx,ty])=>({tx,ty}));
  return { type:'dungeon', level:9, biome:'town', title:'Город Лиссарен', safe:true, nofog:true, fog:'9'.repeat(W*H),
    grid, width:W, height:H, enemies:[], items:[], shop:fs.shop, merchant:fs.merchant, houses, doors, props, trees, lamps, portal:null,
    spawn:{x:23*TILE+5, y:30*TILE}, exit:{tx:23, ty:H-1} };
}
function generateHouse(kind){
  const W = 14, H = 11, grid = makeGrid(W,H,'.');
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x===0||y===0||x===W-1||y===H-1) grid[y][x] = '#';
  const L = { type:'dungeon', level:10, biome:'house', kind, title: kind==='inn' ? 'Трактир «Дремлющий Грифон»' : kind==='home' ? 'Ваш дом' : 'Лавка «Дымный Тигель»', safe:true, nofog:true, fog:'9'.repeat(W*H),
    grid, width:W, height:H, enemies:[], items:[], furn:[], portal:null, spawn:{x:7*TILE+5, y:7*TILE}, exit:{tx:7, ty:H-2} };
  const F = (k,tx,ty,w,h,block)=>{ L.furn.push({k,tx,ty,w,h}); if(block!==false) for(let y=ty;y<ty+h;y++) for(let x=tx;x<tx+w;x++) grid[y][x] = 'B'; };
  if(kind==='inn'){
    F('bed',1,2,2,2); F('bed',1,5,2,2); F('fire',9,1,3,1); F('table',5,3,3,2); F('barrel',12,2,1,1); F('barrel',12,3,1,1); F('shelf',3,1,4,1);
    F('stool',4,3,1,1,false); F('stool',8,4,1,1,false); F('rug',5,6,5,2,false); F('plant',12,8,1,1);
    F('chestbox',11,7,1,1);
    L.chest = {tx:11, ty:7, opened:false};
    L.bed = {x:2*TILE, y:3*TILE};
  } else if(kind==='home'){
    F('bed',1,2,2,2); F('fire',9,1,3,1); F('table',5,3,3,2); F('shelf',3,1,4,1); F('barrel',12,3,1,1); F('plant',12,8,1,1); F('plant',1,8,1,1);
    F('stool',4,3,1,1,false); F('stool',8,4,1,1,false); F('rug',4,6,6,2,false);
    F('chestbox',11,7,1,1);
    L.chest = {tx:11, ty:7, opened:true, home:true};
    L.bed = {x:2*TILE, y:3*TILE};
  } else {
    F('shelf',2,1,10,1); F('counter',3,3,8,1); F('cauldron',11,5,2,2); F('table',1,6,2,1); F('plant',1,8,1,1); F('rug',4,6,6,2,false); F('barrel',12,8,1,1);
    L.merchant = {x:6*TILE+10, y:2*TILE+5, w:22, h:22, look:'alch'};
  }
  return L;
}
function makeTownSet(){
  const town = generateTown(), house1 = generateHouse('inn'), house2 = generateHouse('alch');
  for(const [id,h] of [['house1',house1],['house2',house2]]){
    const d = town.doors.find(dd=>dd.to===id);
    h.backTo = {loc:'town', x:d.tx*TILE+5, y:(d.ty+1)*TILE+5};
  }
  return {town, house1, house2};
}

