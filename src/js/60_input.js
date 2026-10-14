// ---------- Защита от зума/двойного тапа (iOS Safari игнорирует user-scalable=no) ----------
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t, e=>e.preventDefault(), {passive:false}));
let ovY = null;
document.addEventListener('touchstart', e=>{ ovY = e.touches.length===1 ? e.touches[0].clientY : null; }, {passive:true});
document.addEventListener('touchmove', e=>{
  const ov = e.target.closest && e.target.closest('.overlay');
  if(e.touches.length>1 || !ov){ e.preventDefault(); return; }
  // свайп внутри экрана-оверлея: прокручиваем вручную (надёжно на iOS и Android); во «свитке» крутится его внутренняя область
  const sc = e.target.closest('.scrollIn') || ov;
  if(sc.scrollHeight > sc.clientHeight && ovY!==null){
    const y = e.touches[0].clientY;
    sc.scrollTop += ovY - y; ovY = y;
    e.preventDefault();
  } else if(ovY!==null && sc!==ov && ov.scrollHeight > ov.clientHeight){
    const y = e.touches[0].clientY; ov.scrollTop += ovY - y; ovY = y; e.preventDefault();
  }
}, {passive:false});
let lastTouchEnd = 0;
document.addEventListener('touchend', e=>{
  const now = Date.now();
  // кнопки и оверлеи не трогаем: иначе быстрый тап после другого касания «съедает» их click
  const ui = e.target.closest && e.target.closest('button, .overlay, #touchControls, #topBtns');
  if(!ui && now-lastTouchEnd < 350) e.preventDefault();
  lastTouchEnd = now;
}, {passive:false});
document.addEventListener('dblclick', e=>e.preventDefault(), {passive:false});
document.addEventListener('contextmenu', e=>e.preventDefault());

// ---------- Ввод ----------
const keys = {};
let attackKeyLatch = false, potionKeyLatch = false;
// Используем e.code вместо e.key: код физической клавиши не зависит от раскладки
// (при русской раскладке e.key для W/A/S/D/E вернул бы кириллицу).
window.addEventListener('keydown', e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyE'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
});
window.addEventListener('keyup', e=>{ keys[e.code] = false; });

// ---------- Сенсорное управление ----------
const virtualMove = {x:0, y:0};
(function setupTouchControls(){
  const base = document.getElementById('joystickBase');
  const knob = document.getElementById('joystickKnob');
  const attackBtn = document.getElementById('attackBtn');
  const potionBtn = document.getElementById('potionBtn');
  const maxR = 22;
  let activePointerId = null;

  function setKnob(dx,dy){ knob.style.transform = `translate(${dx}px, ${dy}px)`; }
  function resetKnob(){ setKnob(0,0); virtualMove.x=0; virtualMove.y=0; }

  base.addEventListener('pointerdown', e=>{
    activePointerId = e.pointerId;
    base.setPointerCapture(e.pointerId);
    updateFromEvent(e);
  });
  base.addEventListener('pointermove', e=>{
    if(e.pointerId!==activePointerId) return;
    updateFromEvent(e);
  });
  function endTouch(e){
    if(e.pointerId!==activePointerId) return;
    activePointerId = null;
    resetKnob();
  }
  base.addEventListener('pointerup', endTouch);
  base.addEventListener('pointercancel', endTouch);

  function updateFromEvent(e){
    const rect = base.getBoundingClientRect();
    const cx = rect.left+rect.width/2, cy = rect.top+rect.height/2;
    let dx = e.clientX-cx, dy = e.clientY-cy;
    const dist = Math.hypot(dx,dy);
    if(dist > maxR){ dx = dx/dist*maxR; dy = dy/dist*maxR; }
    setKnob(dx,dy);
    virtualMove.x = dx/maxR; virtualMove.y = dy/maxR;
  }

  // Кнопки атаки и зелья — работают как удержание клавиш пробел/E
  function bindHoldButton(el, code){
    el.addEventListener('pointerdown', e=>{ e.preventDefault(); keys[code]=true; });
    el.addEventListener('pointerup', ()=>{ keys[code]=false; });
    el.addEventListener('pointercancel', ()=>{ keys[code]=false; });
    el.addEventListener('pointerleave', ()=>{ keys[code]=false; });
  }
  bindHoldButton(attackBtn, 'Space');
  bindHoldButton(potionBtn, 'KeyE');
})();

// ---------- Коллизии ----------
function blockedTiles(locType){
  return locType==='overworld' ? new Set(['~','^','#','S','B']) : new Set(['#','L','S','B']);
}
const SWIM_SET = new Set(['^','#','S','B']);
let _swimMove = false;
function swimOn(){ return !!(player.buff && player.buff.swim>0) && loc.type==='overworld'; }
function onWater(){
  if(loc.type!=='overworld') return false;
  const tx = Math.floor((player.x+player.w/2)/TILE), ty = Math.floor((player.y+player.h/2)/TILE);
  return !!(loc.grid[ty] && loc.grid[ty][tx]==='~');
}
function isBlocked(gridInfo, x, y, w, h){
  const blocked = (_swimMove && gridInfo.type==='overworld') ? SWIM_SET : blockedTiles(gridInfo.type);
  const nx = Math.max(1,Math.ceil(w/14)), ny = Math.max(1,Math.ceil(h/14));     // крупные враги: проверяем и середины сторон, не только углы
  const hit = (px,py)=>{
    const tx = Math.floor(px/TILE), ty = Math.floor(py/TILE);
    if(tx<0||ty<0||tx>=gridInfo.width||ty>=gridInfo.height) return true;
    return blocked.has(gridInfo.grid[ty][tx]);
  };
  for(let i=0;i<=nx;i++){ const px = x+w*i/nx; if(hit(px,y)||hit(px,y+h)) return true; }
  for(let j=1;j<ny;j++){ const py = y+h*j/ny; if(hit(x,py)||hit(x+w,py)) return true; }
  return gridInfo.props && gridInfo.props.length ? propBlocks(gridInfo, x, y, w, h) : false;
}
function tryMove(entity, dx, dy, gridInfo){
  _swimMove = entity===player && swimOn();
  try{ tryMoveInner(entity, dx, dy, gridInfo); } finally { _swimMove = false; }
}
function tryMoveInner(entity, dx, dy, gridInfo){
  if(dx!==0){
    const nx = entity.x+dx;
    if(!isBlocked(gridInfo, nx, entity.y, entity.w, entity.h)) entity.x = nx;
  }
  if(dy!==0){
    const ny = entity.y+dy;
    if(!isBlocked(gridInfo, entity.x, ny, entity.w, entity.h)) entity.y = ny;
  }
}
// Как tryMove, но для рывков/отбрасывания — не даёт "телепортироваться" сквозь стены,
// проверяя коллизию так же, как при обычном движении.
function tryPush(entity, dx, dy, gridInfo){ tryMove(entity, dx, dy, gridInfo); }

