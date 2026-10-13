// ---------- Ветер в траве, следы ----------
function drawGrassAnim(x0,y0,x1,y1,camX,camY){
  const now = Date.now()/1000, px = player.x+player.w/2, py = player.y+player.h-4;
  const lean = (bx,by)=>{
    let l = Math.sin(now*1.5+bx*0.012+by*0.006)*1.5 + Math.sin(now*0.5+bx*0.003)*1.1;
    const dx = bx-px, dy = by-py, d = Math.hypot(dx,dy);
    if(d<22) l += (dx/(d||1))*(1-d/22)*8;                       // трава расступается перед героем
    return l;
  };
  ctx.lineCap='round'; ctx.lineWidth=1.3;
  for(let pass=0; pass<2; pass++){
    ctx.strokeStyle = pass ? 'rgba(150,215,100,0.7)' : 'rgba(30,88,32,0.65)';
    ctx.beginPath();
    for(let y=y0;y<y1;y++){
      for(let x=x0;x<x1;x++){
        if(loc.grid[y][x]!=='.') continue;
        const bx = x*TILE+4+hash2(x,y,800+pass)*24, by = y*TILE+10+hash2(x,y,810+pass)*18, l = lean(bx,by);
        const sx = bx-camX, sy = by-camY;
        ctx.moveTo(sx,sy); ctx.lineTo(sx-2+l*0.5,sy-5.5);
        ctx.moveTo(sx,sy); ctx.lineTo(sx+l,sy-7);
        ctx.moveTo(sx,sy); ctx.lineTo(sx+2+l*0.7,sy-5);
      }
    }
    ctx.stroke();
  }
  // цветы на гибких стеблях
  for(let y=y0;y<y1;y++){
    for(let x=x0;x<x1;x++){
      if(loc.grid[y][x]!=='.' || hash2(x,y,77)>=0.17) continue;
      const col = FLOWER_COLORS[Math.floor(hash2(x,y,78)*FLOWER_COLORS.length)], cnt = 1+Math.floor(hash2(x,y,79)*3);
      for(let c=0;c<cnt;c++){
        const fx = x*TILE+5+hash2(x,y,80+c*2)*22, fy = y*TILE+6+hash2(x,y,81+c*2)*20;
        const l = lean(fx,fy)*0.8, sx = fx-camX, sy = fy-camY, hx = sx+l, hy = sy-0.4*Math.abs(l)*0.2;
        ctx.strokeStyle='rgba(30,90,30,0.85)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(sx,sy+3.5); ctx.quadraticCurveTo(sx+l*0.2,sy+1,hx,hy); ctx.stroke();
        ctx.fillStyle=col;
        for(let k=0;k<5;k++){ const a = k/5*Math.PI*2; ctx.beginPath(); ctx.arc(hx+Math.cos(a)*2.2, hy+Math.sin(a)*2.2, 1.45, 0, Math.PI*2); ctx.fill(); }
        ctx.fillStyle='#f6c93a'; ctx.beginPath(); ctx.arc(hx,hy,1.2,0,Math.PI*2); ctx.fill();
      }
    }
  }
}
const prints = []; let stepSide = 1;
function footstep(){
  stepSide = -stepSide;
  const fx = player.x+player.w/2+stepSide*3.5, fy = player.y+player.h-2;
  const ang = {down:Math.PI/2, up:-Math.PI/2, left:Math.PI, right:0}[player.dir] || 0;
  const deep = currentLocId==='ice' || currentLocId==='desert';              // на снегу и песке следы держатся долго
  const lf = deep ? 9000 : 1800;
  prints.push({x:fx, y:fy, life:lf, max:lf, ang, deep});
  if(prints.length>(deep?150:60)) prints.shift();
  if(loc.type==='overworld') burst(fx,fy,3,{colors:['#7fc45a','#4f9a3a','#a6dc78'],sp:28,up:22,g:90,life:420,size:1.2});
  else if(currentLocId==='ice') burst(fx,fy,4,{colors:['#ffffff','#dff0ff'],sp:26,up:16,g:50,life:520,size:1.5});
  else if(currentLocId==='desert') burst(fx,fy,4,{colors:['#e8cf94','#c9a864'],sp:26,up:14,g:50,life:520,size:1.5});
  else burst(fx,fy,3,{colors:['#a9a39a','#8d877e'],sp:22,up:12,g:60,life:420,size:1.6});
}
function drawPrints(camX,camY){
  for(let i=prints.length-1;i>=0;i--){
    const q = prints[i];
    q.life -= 16.7; if(q.life<=0){ prints.splice(i,1); continue; }
    const k = Math.min(1, q.life/q.max*1.6);
    if(q.deep){
      const snow = currentLocId==='ice', px = q.x-camX, py = q.y-camY;
      ctx.fillStyle = snow ? 'rgba(255,255,255,'+(0.55*k)+')' : 'rgba(255,236,190,'+(0.35*k)+')';          // светлый валик вокруг отпечатка
      ctx.beginPath(); ctx.ellipse(px+0.8, py+1, 3.4, 4.5, q.ang+Math.PI/2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = snow ? 'rgba(88,118,158,'+(0.6*k)+')' : 'rgba(128,92,44,'+(0.55*k)+')';
      ctx.beginPath(); ctx.ellipse(px, py, 2.6, 3.7, q.ang+Math.PI/2, 0, Math.PI*2); ctx.fill();
      continue;
    }
    ctx.fillStyle = (loc.type==='overworld' ? 'rgba(28,66,24,' : 'rgba(18,16,14,') + (0.34*q.life/q.max) + ')';
    ctx.beginPath(); ctx.ellipse(q.x-camX, q.y-camY, 2.2, 3.3, q.ang+Math.PI/2, 0, Math.PI*2); ctx.fill();
  }
}

// ---------- Стрелы (лук) ----------
const arrows = [];
function fireArrow(heavy){
  const W = WEAPONS[player.weapon] || WEAPONS.bow, sp = W.pspeed||430;
  const vx = player.dir==='left'?-1:player.dir==='right'?1:0, vy = player.dir==='up'?-1:player.dir==='down'?1:0;
  const px = player.x+player.w/2+vx*10, py = player.y+player.h/2+vy*10-2;
  arrows.push({ x:px, y:py, vx:vx*sp, vy:vy*sp, dmg:playerDamage()*(heavy?2.2:1), dist:0, max:W.prange||150, pierce:!!heavy || W.proj==='bullet' && false, hit:[], ang:Math.atan2(vy,vx), proj:W.proj||'arrow' });
  if(W.proj==='bullet'){
    burst(px+vx*6,py+vy*6,9,{colors:['#fff3b0','#ffb84a','#9a9a9a'],sp:110,up:10,g:0,life:260,size:2.2});
    burst(px+vx*4,py+vy*4,5,{colors:['#8a8a8a','#b8b8b8'],sp:30,up:25,g:-40,life:700,size:3.6});
    shakeT = Math.max(shakeT, 90);
  }
}
function updateArrows(dt){
  for(let i=arrows.length-1;i>=0;i--){
    const a = arrows[i], dx = a.vx*dt, dy = a.vy*dt;
    a.x += dx; a.y += dy; a.dist += Math.hypot(dx,dy);
    let remove = a.dist>=a.max;
    if(!remove){
      const tx = Math.floor(a.x/TILE), ty = Math.floor(a.y/TILE);
      if(tx<0||ty<0||tx>=loc.width||ty>=loc.height || (loc.grid[ty][tx]!=='L' && blockedTiles(loc.type).has(loc.grid[ty][tx]))){
        remove = true; burst(a.x,a.y,3,{colors:['#d8d3bd','#9a9aa0'],sp:40,up:10,g:200,life:240,size:1.4});
      }
    }
    if(!remove){
      for(const e of loc.enemies){
        if(e.hp<=0 || (a.hit && a.hit.includes(e))) continue;
        if(a.x>e.x && a.x<e.x+e.w && a.y>e.y && a.y<e.y+e.h){
          if(a.hit) a.hit.push(e);
          damageEnemy(e, Math.round(a.dmg*(1.5-0.75*Math.min(1,a.dist/a.max)))); SFX.play('hit');
          burst(a.x,a.y,5,{colors:['#fff6c8','#ffd34a','#ffffff'],sp:90,up:20,g:200,life:260,size:1.8});
          tryPush(e, a.vx*0.03, a.vy*0.03, loc);
          if(e.hp<=0) killEnemy(e);
          if(!a.pierce){ remove = true; break; }
        }
      }
    }
    if(remove) arrows.splice(i,1);
  }
}
function drawArrows(camX,camY){
  for(const a of arrows){
    ctx.save(); ctx.translate(a.x-camX, a.y-camY); ctx.rotate(a.ang);
    if(a.proj==='bullet'){
      ctx.strokeStyle='rgba(255,236,170,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-34,0); ctx.lineTo(-3,0); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-50,0); ctx.lineTo(-20,0); ctx.stroke();
      ctx.fillStyle='#3a3a40'; ctx.beginPath(); ctx.arc(0,0,3.2,0,6.283); ctx.fill(); ctx.fillStyle='#d8d8e0'; ctx.beginPath(); ctx.arc(-0.8,-0.8,1.3,0,6.283); ctx.fill();
      ctx.restore(); continue;
    }
    if(a.proj==='bolt'){
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(-9,0); ctx.stroke();
      ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(7,0); ctx.stroke();
      ctx.fillStyle='#e8ecf2'; ctx.strokeStyle='#2a2e34'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(6,-3.2); ctx.lineTo(13,0); ctx.lineTo(6,3.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#c9b48a'; ctx.fillRect(-11,-1.8,4,3.6);
      ctx.restore(); continue;
    }
    ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-24,0); ctx.lineTo(-9,0); ctx.stroke();
    ctx.strokeStyle='#caa86a'; ctx.lineWidth=1.7; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(6,0); ctx.stroke();
    ctx.fillStyle='#dfe4ea'; ctx.beginPath(); ctx.moveTo(6,-2.4); ctx.lineTo(11,0); ctx.lineTo(6,2.4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#e8e0cc'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(-12,-2.4); ctx.moveTo(-9,0); ctx.lineTo(-12,2.4); ctx.moveTo(-7,0); ctx.lineTo(-10,-2.2); ctx.moveTo(-7,0); ctx.lineTo(-10,2.2); ctx.stroke();
    ctx.restore();
  }
}

// ---------- Частицы и анимация смерти ----------
const particles = [], dying = [];
let shakeT = 0, stepT = 0;
function clearFx(){ aoes.length = 0; eshots.length = 0; particles.length = 0; dying.length = 0; shakeT = 0; prints.length = 0; arrows.length = 0; }
function burst(x,y,n,o){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, sp = (o.sp||60)*(0.4+Math.random()*0.8);
    const life = (o.life||500)*(0.7+Math.random()*0.5);
    particles.push({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-(o.up||0), g:(o.g===undefined?120:o.g), life, max:life,
      size:(o.size||2.5)*(0.7+Math.random()*0.6), color:o.colors[Math.floor(Math.random()*o.colors.length)], shape:o.shape||'c', rot:Math.random()*6, vr:(Math.random()-0.5)*10 });
  }
}
function startDeathFx(e){
  const cx = e.x+e.w/2, cy = e.y+e.h/2, t = e.type, big = BOSS_TYPES.includes(t);
  dying.push({ type:t, x:e.x, y:e.y, w:e.w, h:e.h, face:e.face||'right', walkT:e.walkT||0, color:e.color, t:0, dur:big?1300:600 });
  if(t==='slime') burst(cx,cy,16,{colors:['#4fd15b','#7fe88a','#2f8f3a'],sp:90,up:50,g:300,life:600,size:3});
  else if(t==='skeleton') burst(cx,cy,14,{colors:['#e6e1cf','#cfc9b0','#a9a38c'],sp:100,up:60,g:340,life:750,size:2.6,shape:'r'});
  else if(t==='wolf') burst(cx,cy,14,{colors:['#9a9aa3','#b8b8c0','#7a7a82'],sp:55,up:25,g:-30,life:700,size:4.2});
  else if(t==='wraith') burst(cx,cy,18,{colors:['#a47be0','#c9a8ff','#7a4fbd'],sp:38,up:30,g:-90,life:950,size:3.6});
  else if(t==='boss'){ burst(cx,cy,26,{colors:['#e6e1cf','#cfc9b0'],sp:130,up:80,g:300,life:900,size:3,shape:'r'}); burst(cx,cy,20,{colors:['#e0b23a','#ffe28a'],sp:110,up:60,g:200,life:900,size:2.4}); shakeT = 800; }
  else if(t==='shadowlord'){ burst(cx,cy,40,{colors:['#3b1a5c','#7a4fbd','#d28bff'],sp:90,up:20,g:-40,life:1200,size:4.4}); shakeT = 1000; }
  else if(t==='bat') burst(cx,cy,10,{colors:['#4a3358','#6a4a80','#2a1838'],sp:80,up:30,g:260,life:600,size:2.6});
  else if(t==='webspider') burst(cx,cy,16,{colors:['#34465a','#eef2fa','#c8ff4a'],sp:85,up:40,g:300,life:700,size:2.6});
  else if(t==='spider') burst(cx,cy,14,{colors:['#2e1b3a','#5a3a70','#8bd04a'],sp:85,up:40,g:300,life:650,size:2.6});
  else if(t==='goblin') burst(cx,cy,14,{colors:['#7fae3a','#5a8a28','#b02a2a'],sp:95,up:45,g:320,life:650,size:3});
  else if(t==='zombie') burst(cx,cy,16,{colors:['#7f9a6a','#5a6b4a','#a01c1c'],sp:80,up:40,g:320,life:750,size:3.2});
  else if(t==='darkknight') burst(cx,cy,18,{colors:['#3a3d4d','#6a6e80','#a01e26'],sp:110,up:60,g:360,life:800,size:2.8,shape:'r'});
  else if(t==='imp') burst(cx,cy,18,{colors:['#ff7a1a','#ffd34a','#c7352a'],sp:90,up:30,g:-60,life:800,size:2.8});
  else if(t==='lavaslime') burst(cx,cy,18,{colors:['#ff7a1a','#ffd34a','#8a1f0a'],sp:95,up:50,g:300,life:650,size:3.2});
  else if(t==='golem'){ burst(cx,cy,18,{colors:['#6b646f','#4a4550','#8a8490'],sp:110,up:60,g:380,life:850,size:4,shape:'r'}); burst(cx,cy,10,{colors:['#ff8a1a','#ffd34a'],sp:90,up:50,g:200,life:700,size:2.2}); shakeT = 300; }
  else if(t==='lavalord'){ burst(cx,cy,34,{colors:['#ff5a14','#ffd24a','#ff9a2a'],sp:130,up:70,g:-30,life:1100,size:4}); burst(cx,cy,20,{colors:['#3a1208','#5a2012'],sp:110,up:60,g:300,life:900,size:3.4,shape:'r'}); shakeT = 1000; }
  else if(t==='scorpion') burst(cx,cy,14,{colors:['#b8742e','#d49048','#9aff4a'],sp:90,up:40,g:300,life:650,size:2.8});
  else if(t==='mummy') burst(cx,cy,18,{colors:['#e0d6b0','#d9cfa8','#a89c74'],sp:90,up:50,g:280,life:850,size:3,shape:'r'});
  else if(t==='cobra') burst(cx,cy,14,{colors:['#8a9a30','#e8d870','#6a7a22'],sp:90,up:40,g:300,life:650,size:2.8});
  else if(t==='pharaoh'){ burst(cx,cy,30,{colors:['#d8a824','#ffe28a','#2a6ab0'],sp:120,up:70,g:200,life:1000,size:3.2}); burst(cx,cy,24,{colors:['#e3d6a0','#c9a050'],sp:80,up:30,g:60,life:1200,size:3.6}); shakeT = 900; }
  else if(t==='icewolf') burst(cx,cy,16,{colors:['#f0f8ff','#b4cbe0','#7ad4ff'],sp:75,up:30,g:200,life:700,size:3.2});
  else if(t==='yeti') burst(cx,cy,22,{colors:['#f2f8fc','#c0d4e4','#ffffff'],sp:80,up:40,g:120,life:900,size:4.2});
  else if(t==='frostwraith') burst(cx,cy,18,{colors:['#bfeaff','#7ad4ff','#ffffff'],sp:38,up:30,g:-90,life:950,size:3.4});
  else if(t==='frostking'){ burst(cx,cy,34,{colors:['#bfe6ff','#e8fbff','#7ab4e0'],sp:120,up:60,g:200,life:1100,size:3.6,shape:'r'}); burst(cx,cy,20,{colors:['#4ad8ff','#ffffff'],sp:90,up:40,g:-40,life:1100,size:2.6}); shakeT = 1000; }
  else if(t==='spiderqueen'){ burst(cx,cy,34,{colors:['#6a3a8a','#c890ff','#ffffff'],sp:130,up:60,g:200,life:1000,size:3.4}); burst(cx,cy,18,{colors:['#e03a4a','#2a1738'],sp:100,up:50,g:300,life:900,size:3}); }
  else if(t==='warlord'){ burst(cx,cy,34,{colors:['#2b2e3a','#8a1f2a','#c8cede'],sp:130,up:70,g:320,life:1000,size:3.6,shape:'r'}); burst(cx,cy,18,{colors:['#ff5a3a','#ffd34a'],sp:100,up:60,g:100,life:800,size:3}); }
  else if(t==='phantom'){ burst(cx,cy,36,{colors:['#8ff0e0','#e0fff8','#46587a'],sp:80,up:40,g:-70,life:1300,size:3.8}); burst(cx,cy,18,{colors:['#ffffff','#b8c6dc'],sp:120,up:60,g:-30,life:1100,size:3}); }
  else if(t==='ghoul') burst(cx,cy,16,{colors:['#7d8a70','#5a6650','#a01c1c'],sp:85,up:40,g:320,life:750,size:3.2});
  else if(t==='banshee') burst(cx,cy,18,{colors:['#a8ffd0','#7fd8a8','#ffffff'],sp:38,up:30,g:-90,life:950,size:3.4});
  else if(t==='lich'){ burst(cx,cy,34,{colors:['#46d68a','#b8ffd0','#1c6a40'],sp:120,up:60,g:-20,life:1100,size:3.8}); burst(cx,cy,20,{colors:['#e6e1cf','#cfc9b0'],sp:110,up:70,g:300,life:900,size:3,shape:'r'}); shakeT = 1000; }
  else if(t==='panther') burst(cx,cy,14,{colors:['#2a2a38','#4a4a60','#7aff9a'],sp:80,up:30,g:260,life:700,size:3});
  else if(t==='shroom') burst(cx,cy,20,{colors:['#9a4fc0','#d8a0ff','#b8e84a'],sp:70,up:50,g:120,life:900,size:3.2});
  else if(t==='gorilla') burst(cx,cy,18,{colors:['#4a4a4e','#6a6a70','#2a2a2e'],sp:90,up:50,g:340,life:800,size:3.6});
  else if(t==='treant'){ burst(cx,cy,34,{colors:['#5a8a2a','#8ac84a','#3a2a14'],sp:120,up:70,g:200,life:1100,size:4,shape:'r'}); burst(cx,cy,24,{colors:['#b8e84a','#f4ffd0'],sp:80,up:40,g:-30,life:1200,size:2.6}); shakeT = 1100; }
  else burst(cx,cy,14,{colors:[e.color,'#ffffff','#8a8a90'],sp:85,up:40,g:280,life:700,size:3});
  SFX.play(big ? 'boss' : 'kill');
}
function updateFx(dt){
  const ms = dt*1000;
  for(let i=particles.length-1;i>=0;i--){
    const q = particles[i]; q.life -= ms;
    if(q.life<=0){ particles.splice(i,1); continue; }
    q.x += q.vx*dt; q.y += q.vy*dt; q.vy += q.g*dt; q.vx *= 0.985; q.rot += q.vr*dt;
  }
  for(let i=dying.length-1;i>=0;i--){ dying[i].t += ms; if(dying[i].t>=dying[i].dur) dying.splice(i,1); }
  if(shakeT>0) shakeT -= ms;
}
function drawDying(camX,camY){
  for(const d of dying){
    const p = d.t/d.dur, sx = d.x-camX, sy = d.y-camY;
    const fake = { type:d.type, w:d.w, h:d.h, x:d.x, y:d.y, face:d.face, walkT:d.walkT, moving:false, hitFlash:(p<0.28?1:0), lookX:0, lookY:0, color:d.color };
    const dir = d.face==='left' ? -1 : 1;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1-p*p);
    const bx = sx+d.w/2, by = sy+d.h;
    ctx.translate(bx,by);
    if(d.type==='slime'||d.type==='lavaslime') ctx.scale(1+p*0.6, Math.max(0.05,1-p*0.9));
    else if(d.type==='wraith'||d.type==='frostwraith'||d.type==='banshee'||d.type==='bat'||d.type==='imp'){ ctx.translate(0,-p*16); ctx.scale(1-p*0.3,1+p*0.2); }
    else if(d.type==='skeleton'||d.type==='zombie'||d.type==='ghoul'||d.type==='mummy'||d.type==='goblin'||d.type==='darkknight'){ ctx.rotate(p*0.5*dir); ctx.scale(1,1-p*0.5); }
    else if(d.type==='wolf'||d.type==='icewolf'||d.type==='panther'||d.type==='scorpion'||d.type==='spider'||d.type==='webspider'||d.type==='cobra'){ ctx.rotate(p*0.9*dir); ctx.scale(1,1-p*0.5); }
    else ctx.scale(1+p*0.12,1-p*0.35);
    ctx.translate(-bx,-by);
    drawEnemy(fake, sx, sy);
    ctx.restore();
  }
}
function drawParticles(camX,camY){
  for(const q of particles){
    ctx.globalAlpha = Math.max(0,Math.min(1,q.life/q.max));
    ctx.fillStyle = q.color;
    const x = q.x-camX, y = q.y-camY;
    if(q.shape==='r'){ ctx.save(); ctx.translate(x,y); ctx.rotate(q.rot); ctx.fillRect(-q.size,-q.size*0.4,q.size*2,q.size*0.8); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(x,y,q.size,0,Math.PI*2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}

function addNote(text, color='#f4d98a'){
  notifications.push({text, color, timer:2600, max:2600});
}

function generateLair(id){
  const S = LAIR[id], W = 44, H = 26, acx = 31, acy = 13, rx = 11, ry = 9;
  const grid = makeGrid(W,H,'#');
  const fl = (x,y)=>{ if(x>0&&y>0&&x<W-1&&y<H-1) grid[y][x]='.'; };
  for(let y=8;y<=17;y++) for(let x=3;x<=11;x++) fl(x,y);            // передняя комната
  for(let x=11;x<=21;x++){ fl(x,12); fl(x,13); }                     // коридор шириной 2 клетки
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const dx=(x-acx)/rx, dy=(y-acy)/ry; if(dx*dx+dy*dy<=1) fl(x,y); }   // зал босса
  for(let k=0;k<6;k++){                                              // колонны по кругу
    const a = k/6*Math.PI*2+0.5, px = Math.round(acx+Math.cos(a)*6.5), py = Math.round(acy+Math.sin(a)*5);
    if(grid[py][px]==='.') grid[py][px] = '#';
  }
  grid[12][4] = '<';
  const roster = LEVEL_ROSTER[S.level] || ['skeleton'];
  const enemies = [], items = [];
  for(const [x,y] of [[23,9],[23,17],[36,8],[36,18]]) if(grid[y][x]==='.')
    enemies.push(makeEnemy(roster[rnd(0,roster.length-1)], x*TILE+3, y*TILE+3, S.level));
  for(const [x,y] of [[6,9],[6,17],[9,13]]) items.push(makeItem(Math.random()<0.5?'potion':'gold', x*TILE+8, y*TILE+8));
  const boss = makeEnemy(S.boss, (acx-1)*TILE, (acy-1)*TILE, S.level);
  enemies.push(boss);
  const portal = S.last ? null : {tx:acx+9, ty:acy, open:false};
  return { type:'dungeon', level:S.level, pal:S.pal, lair:true, title:S.title, grid, width:W, height:H, enemies, items, boss, portal,
    spawn:{x:4*TILE, y:13*TILE}, exit:{tx:4, ty:12} };
}
function genLoc(id){
  if(LAIR[id]) return generateLair(id);
  return { dungeon1:()=>generateDungeon(1), dungeon3:()=>generateDungeon(3), lava:()=>generateDungeon(4), desert:()=>generateField(5,'desert'), ice:()=>generateField(6,'ice'),
    grave:()=>generateField(7,'grave'), jungle:()=>generateField(8,'jungle'), city:()=>generateField(11,'city'), manor:()=>generateDungeon(12) }[id]();
}
function buildWorld(ow){
  const w = { overworld: ow || generateOverworld() };
  for(const id of CHAIN) w[id] = genLoc(id);
  ensureSecrets(w); ensurePOIs(w);
  return w;
}
// ======================= Сюжет, тайники и мини-события =======================
const STORY_INTRO = [
  'Эльдория погружается во тьму. Эфирий — когда-то страж Обители — похитил Сердце Эльдории, древний камень, хранивший свет королевства, и заперся в Обители Пустых Зеркал на краю мира.',
  'Десять его слуг-стражей запечатали путь: у каждого своё логово, и пока страж жив, врата вглубь закрыты. Первый из них — Мортракс — засел в пещере на поверхности.',
  'Вы — последний, кто решился идти за светом. Закупитесь у торговца, наберитесь сил в бою и ищите тайные места: говорят, где-то в лесу прячется грот мудреца Орбина, который знает об Эфирии больше всех.'
];
const LAIR_ORDER = ['lair1','lair2','lair3','lair4','lair5','lair6','lair7','lair8','lair9','lair10'];
function storyStage(){
  let n = 0;
  for(const id of LAIR_ORDER){
    const L = world[id]; if(!L) break;
    const dead = L.portal ? L.portal.open : !!(L.boss && L.boss.hp<=0);
    if(dead) n++; else break;
  }
  return n;
}
const STORY_TIPS = [
  'Путь начинается в пещере на поверхности. Мортракс силён — сперва наберись опыта и купи броню.',
  'Мортракс пал — отлично! Идите дальше, в Грот Шорохов: там прячется Шелиба. Берегите зелье скорости, её паутина замедляет.',
  'Шелиба повержена. Впереди Провал Безмолвия и Ноктурн — щит хорошо гасит его удары.',
  'Тьма отступает. Дальше — Кузни Гхарраш: без зелья стойкости там тяжело.',
  'Игнаррок пал. Пустошь Зарахаб ждёт — берите побольше эликсиров, лавка там есть.',
  'Хар-Атеп повержен. Край Белого Эха холоден и опасен — ищите лавку у входа.',
  'Криомир побеждён. Погост — вотчина Морвейна, он не любит живых.',
  'Морвейн сгинул. Дебри Ксилотара хранят Ольхарона — он не злодей, но Эфирий его околдовал.',
  'Ольхарон освобождён. Теперь Град Вельмор, где правит Вархаал. Берегитесь стрелков.',
  'Вархаал пал. Остались Обитель Пустых Зеркал — и сам Эфирий. Заберите Сердце!',
  'Вы прошли весь путь. Остался последний шаг — Сердце Эльдории.'
];
const STORY_LORE = [
  'Мортракс был владыкой, что продал душу Эфирию ради вечной жизни. Его кости — его сила: бейте, пока не рассыплется, и не стойте на месте — он бьёт по площади.',
  'Шелиба сплела сети на пути в Провал. Её плевки замедляют — пользуйтесь рывком и зельем скорости.',
  'Ноктурн питается страхом. В Провале темно, но враги там боятся света факелов — держитесь вместе с тропой.',
  'В Кузнях Гхарраш живёт Игнаррок. Лава непроходима, а его огненные шары больно жгут — щит и зелье стойкости спасают.',
  'Хар-Атеп стережёт Пустошь. Песок слепит и режет, бейте издали и берегите здоровье.',
  'Криомир заморозил целый край. Белые волки ходят стаями — не дайте себя окружить.',
  'Морвейн поднимает павших. Убивайте помощников быстро, пока не набрались числом.',
  'Ольхарон — дух леса, которого Эфирий околдовал. Когда падёт — лес снова вздохнёт свободно.',
  'Вархаал — командир войска, что некогда осадило Лиссарен. Город давно мёртв, а его солдаты всё ещё несут караул.',
  'Обитель Пустых Зеркал — последний оплот Эфирия. Говорят, Сердце бьётся там, где холоднее всего.',
  'Вы победили почти всех. Ступайте — свет Эльдории ждёт вас.'
];
const LAIR_TAUNT = {
  lair1:'Мортракс: «Ещё один глупец пришёл умереть…»',
  lair2:'Шелиба: «Вы запутались в моих сетях…»',
  lair3:'Ноктурн: «Свет здесь долго не живёт.»',
  lair4:'Игнаррок: «Сгори!»',
  lair5:'Хар-Атеп: «Пески поглотят вас, как и многих до вас.»',
  lair6:'Криомир: «Холод — мой вечный друг.»',
  lair7:'Морвейн: «Ещё один в мою армию…»',
  lair8:'Ольхарон: «Эфирий… велел… не пускать…»',
  lair9:'Вархаал: «Город мой. Преклонись или умри.»',
  lair10:'Эфирий: «Добро пожаловать в мой дом, гость. Останься навсегда.»'
};
function goalText(){
  const st = storyStage();
  if(st>=LAIR_ORDER.length) return 'Цель: заберите Сердце Эльдории';
  return 'Цель: '+LAIR[LAIR_ORDER[st]].title;
}

