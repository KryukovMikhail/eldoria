'use strict';
const TILE = 32, VIEW_W = 30, VIEW_H = 16;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gameWrap = document.getElementById('gameWrap');
const UI = {l:0,t:0,r:0,b:0}; // безопасные отступы под вырез, в логических пикселях холста
// Холст подстраивается под всё окно: логический размер = размер окна / масштаб
function resizeCanvas(){
  const w = gameWrap.clientWidth || window.innerWidth, h = gameWrap.clientHeight || window.innerHeight;
  const zoom = Math.max(0.8, Math.min(3, h/540));
  const probe = document.getElementById('safeProbe');
  if(probe){ const cs = getComputedStyle(probe);
    UI.l=(parseFloat(cs.paddingLeft)||0)/zoom; UI.t=(parseFloat(cs.paddingTop)||0)/zoom;
    UI.r=(parseFloat(cs.paddingRight)||0)/zoom; UI.b=(parseFloat(cs.paddingBottom)||0)/zoom; }
  const bw = Math.max(320, Math.ceil(w/zoom)), bh = Math.max(240, Math.ceil(h/zoom));
  if(canvas.width!==bw) canvas.width=bw;
  if(canvas.height!==bh) canvas.height=bh;
  ctx.imageSmoothingEnabled = false;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', ()=>{ resizeCanvas(); setTimeout(resizeCanvas,200); setTimeout(resizeCanvas,600); });
if(window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);
const rnd = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const rndf = (a,b) => Math.random()*(b-a)+a;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const overlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;

function makeGrid(w,h,fill){ return Array.from({length:h},()=>Array(w).fill(fill)); }
function clearArea(grid,cx,cy,r,tile){
  for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++)
    if(y>0&&y<grid.length-1&&x>0&&x<grid[0].length-1) grid[y][x]=tile;
}
function findFloor(grid,w,h,tile,minDist,fromX,fromY){
  for(let tries=0;tries<400;tries++){
    const x=rnd(2,w-3), y=rnd(2,h-3);
    if(grid[y][x]!==tile) continue;
    if(minDist && Math.hypot(x-fromX,y-fromY)<minDist) continue;
    return {x,y};
  }
  return {x: Math.floor(w/2), y: Math.floor(h/2)};
}

