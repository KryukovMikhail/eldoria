// ---------- Рисунки новых врагов ----------
// Холст уже сдвинут в центр врага (см. drawEnemy). Каждая функция: (e, K, flash, now, t, face)
const NEW_OUT = 'rgba(0,0,0,0.5)';
function warnMark(y, col){            // восклицательный знак над врагом перед рывком
  ctx.save(); ctx.fillStyle = col||'#ff3a2a'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
  ctx.strokeText('!',0,y); ctx.fillText('!',0,y); ctx.restore();
}
function drawJelly(e,K,flash,now,t,sc){
  const wob = Math.sin(now*4+e.x*0.07)*0.07;
  ctx.save(); ctx.translate(0,8*sc); ctx.scale(sc*(1+wob), sc*(1-wob));
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ell(0,3,12,3); ctx.fill();
  ctx.fillStyle = K('#58b8e8'); ctx.strokeStyle = K('#1c5a8a'); ctx.lineWidth = 1.6;
  rrect(-11,-19,22,21,6); ctx.fill(); ctx.stroke();
  if(!flash){
    ctx.fillStyle = 'rgba(20,80,140,0.35)'; rrect(-8,-15,16,14,4); ctx.fill();
    ctx.fillStyle = 'rgba(230,248,255,0.55)'; ell(-6,-15,3.2,1.5,-0.4); ctx.fill();
    ctx.fillStyle = '#e8c860'; circ(4,-6,3.4); ctx.fill(); ctx.fillStyle = 'rgba(120,80,10,0.7)'; circ(4,-6,1.5); ctx.fill();   // монета внутри
    ctx.fillStyle = 'rgba(220,250,255,0.6)'; const bp = (now*0.7+e.x*0.01)%1; circ(-5,-2-bp*9,1.1); ctx.fill(); circ(-1,-4-((bp+0.5)%1)*8,0.8); ctx.fill();
  }
  ctx.fillStyle = flash ? '#fff' : '#fff35a'; circ(-4.4,-12,2.2); ctx.fill(); circ(4.4,-12,2.2); ctx.fill();
  if(!flash){ ctx.fillStyle = '#16303f'; circ(-4,-11.8,1); ctx.fill(); circ(4.8,-11.8,1); ctx.fill(); ctx.strokeStyle = '#16303f'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-3.5,-6.6); ctx.quadraticCurveTo(0,-4.4,3.5,-6.6); ctx.stroke(); }
  ctx.restore();
}
function drawHornBeast(e,K,flash,now,t,face,P){
  const f = face==='left'?-1:1, ai = e.ai||{}, wind = ai.st==='wind', dash = ai.st==='dash', S = P.s;
  if(wind) warnMark(-17*S-4);
  shadowAt(0,11*S,13*S,3.4);
  ctx.scale(f*S,S);
  if(wind) ctx.translate(Math.sin(now*60)*1.3,2);
  if(dash){ ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-14-i*4,-4+i*4); ctx.lineTo(-24-i*4,-4+i*4); ctx.stroke(); } ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1; }
  const lg = Math.sin(t*(dash?3:1.4))*(dash?3.4:2);
  ctx.fillStyle = K(P.leg); for(const [x,l] of [[-8,lg],[-3,-lg],[5,lg],[10,-lg]]) ctx.fillRect(x-1.5,6,3,6+l*0.4);
  ctx.fillStyle = K(P.body); ell(-1,1,13,8.6); ctx.fill(); ctx.stroke();
  if(P.wool){ ctx.fillStyle = K('#efe4c8'); for(const [x,y,r] of [[-9,-3,4],[-3,-5,4.4],[3,-4,4],[-6,3,4],[1,3,4.4],[-11,2,3.4]]){ circ(x,y,r); ctx.fill(); } }
  if(P.plates){ ctx.fillStyle = K('#6e6e78'); for(let i=0;i<4;i++){ rrect(-9+i*5,-6,4.4,11,1.6); ctx.fill(); } }
  ctx.fillStyle = K(P.head); ell(11,2,6.2,5.4*(wind?1.1:1)); ctx.fill(); ctx.stroke();
  if(P.horn==='curl'){
    ctx.strokeStyle = K('#5a4a32'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(9,-2); ctx.quadraticCurveTo(3,-13,-1,-5); ctx.quadraticCurveTo(0,-2,3,-3); ctx.stroke();
    ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1;
  } else {
    ctx.fillStyle = K('#e8e4d4'); ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(21,-10); ctx.lineTo(17.4,2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#cfcab8'); ctx.beginPath(); ctx.moveTo(10,-3); ctx.lineTo(12,-9); ctx.lineTo(13,-2.6); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = K('#d8a090'); ell(15.6,4,2.6,2.2); ctx.fill();
  if(!flash){ ctx.fillStyle = (wind||dash) ? '#ff2a1a' : '#ffd34a'; circ(11,-0.6,1.3); ctx.fill(); }
}
const NEW_ENEMY_DRAW = {
  ram(e,K,flash,now,t,face){ drawHornBeast(e,K,flash,now,t,face,{s:0.95, body:'#d9ccb0', leg:'#4a3a28', head:'#8a7a62', wool:true, horn:'curl'}); },
  rhino(e,K,flash,now,t,face){ drawHornBeast(e,K,flash,now,t,face,{s:1.22, body:'#8a8a92', leg:'#4a4a52', head:'#7a7a84', plates:true, horn:'nose'}); },
  gelcube(e,K,flash,now,t){ drawJelly(e,K,flash,now,t,1); },
  slimelet(e,K,flash,now,t){ drawJelly(e,K,flash,now,t,0.52); },
  shieldbearer(e,K,flash,now,t,face){
    const ai = e.ai||{}, g = ai.g!==undefined ? ai.g : 0, sw = Math.sin(t)*2;
    shadowAt(0,12,9.5,3);
    const sx = Math.cos(g)*11, sy = Math.sin(g)*6.5-1, front = Math.sin(g)>=-0.15;
    const drawShield = ()=>{
      ctx.save(); ctx.translate(sx,sy); ctx.scale(Math.max(0.35,Math.abs(Math.cos(g))*0.85+0.25),1);
      ctx.fillStyle = K('#7a8294'); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-7,-12); ctx.lineTo(7,-12); ctx.lineTo(7,2); ctx.quadraticCurveTo(7,10,0,14); ctx.quadraticCurveTo(-7,10,-7,2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = K('#a6aebf'); ctx.beginPath(); ctx.moveTo(-4.4,-9.6); ctx.lineTo(4.4,-9.6); ctx.lineTo(4.4,1); ctx.quadraticCurveTo(4.4,6.6,0,9.6); ctx.quadraticCurveTo(-4.4,6.6,-4.4,1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = K('#c9a23a'); circ(0,-1,2.6); ctx.fill(); ctx.stroke();
      if(ai.gf>0){ ctx.fillStyle = 'rgba(255,255,255,'+Math.min(0.8,ai.gf/220)+')'; ctx.beginPath(); ctx.moveTo(-7,-12); ctx.lineTo(7,-12); ctx.lineTo(7,2); ctx.quadraticCurveTo(7,10,0,14); ctx.quadraticCurveTo(-7,10,-7,2); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    };
    if(!front) drawShield();
    ctx.fillStyle = K('#575d6b'); rrect(-5,5,3.6,7+sw*0.4,1); ctx.fill(); ctx.stroke(); rrect(1.4,5,3.6,7-sw*0.4,1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#8d96a6'); rrect(-7,-6,14,12,3.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#6a7282'); rrect(-6,2,12,2.2,1); ctx.fill();
    ctx.fillStyle = K('#9aa4b6'); circ(0,-10.5,5.8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#14161c'; rrect(-3.8,-11.6,7.6,2.2,1); ctx.fill();
    ctx.fillStyle = K('#b02a2a'); ctx.beginPath(); ctx.moveTo(-1.2,-16); ctx.quadraticCurveTo(0,-21,2.4,-19); ctx.lineTo(1.4,-15.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a0a8b6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-sx*0.5-4,-6); ctx.lineTo(-sx*0.5-9,-12+sw*0.3); ctx.stroke(); ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1;
    if(front) drawShield();
  },
  necromancer(e,K,flash,now,t,face){
    const ai = e.ai||{}, f = face==='left'?-1:1, bob = Math.sin(now*2.4+e.x)*1.2;
    if(ai.sa>0){ const p = 1-ai.sa/700; ctx.strokeStyle = 'rgba(70,214,138,'+(0.9-p*0.6)+')'; ctx.lineWidth = 1.6; ell(0,11,10+p*18,4+p*7); ctx.stroke(); ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1; }
    shadowAt(0,12,9,3);
    ctx.translate(0,bob);
    ctx.fillStyle = K('#2a1a3e'); ctx.beginPath(); ctx.moveTo(-6,-6); ctx.lineTo(6,-6); ctx.lineTo(11,13); for(let i=0;i<=4;i++) ctx.lineTo(11-i*5.5, 13+(i%2?2.4:0)); ctx.lineTo(-11,13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#46d68a'); ctx.fillRect(-9,3,18,1.8);
    ctx.fillStyle = K('#1c1030'); ell(0,-9,7,7.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#d8d2bc'; ell(0,-8.6,4.4,5); ctx.fill();
    ctx.fillStyle = '#0a0612'; ell(-1.8,-9.2,1.4,1.9); ctx.fill(); ell(1.8,-9.2,1.4,1.9); ctx.fill(); ctx.fillRect(-2,-5.8,4,1.4);
    if(!flash){ ctx.fillStyle = '#46d68a'; circ(-1.8,-9.2,0.7); ctx.fill(); circ(1.8,-9.2,0.7); ctx.fill(); }
    const raise = ai.sa>0 ? -5 : 0;
    ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f*10,13); ctx.lineTo(f*10,-14+raise); ctx.stroke();
    ctx.fillStyle = K('#d8d2bc'); circ(f*10,-17+raise,3.4); ctx.fill(); ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1; ctx.stroke();
    if(!flash){ const fl = Math.sin(now*9+e.x); ctx.fillStyle = 'rgba(70,214,138,0.55)'; ctx.beginPath(); ctx.moveTo(f*10-3,-20+raise); ctx.quadraticCurveTo(f*10+fl,-27+raise,f*10+3,-20+raise); ctx.fill(); ctx.fillStyle = '#0a0612'; circ(f*10-1.2,-17.4+raise,0.8); ctx.fill(); circ(f*10+1.2,-17.4+raise,0.8); ctx.fill(); }
  },
  emberbomb(e,K,flash,now,t,face){
    const ai = e.ai||{}, lit = ai.f>0, pulse = lit ? 1+Math.sin(now*40)*0.12 : 1, hot = lit && Math.floor(now*14)%2===0;
    shadowAt(0,11,9,2.8);
    const lg = Math.sin(t*2.2)*2.2;
    ctx.fillStyle = K('#1a1410'); rrect(-5,7,3,5+lg*0.5,1); ctx.fill(); rrect(2,7,3,5-lg*0.5,1); ctx.fill();
    ctx.save(); ctx.scale(pulse,pulse);
    ctx.fillStyle = flash||hot ? '#fff' : K('#2c2420'); circ(0,0,10); ctx.fill(); ctx.stroke();
    if(!flash){
      ctx.strokeStyle = lit ? '#ffd34a' : '#ff6a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6,-3); ctx.lineTo(-2,0); ctx.lineTo(-5,5); ctx.moveTo(5,-5); ctx.lineTo(2,-1); ctx.lineTo(6,4); ctx.stroke();
      ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1;
      ctx.fillStyle = '#ffd34a'; circ(-3,-2,1.6); ctx.fill(); circ(3,-2,1.6); ctx.fill(); ctx.fillStyle = '#2c1010'; ctx.beginPath(); ctx.moveTo(-3,3.4); ctx.lineTo(3,3.4); ctx.lineTo(0,5.4); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0,-10); ctx.quadraticCurveTo(3,-14,6,-13); ctx.stroke();
    if(!flash){ const sp = Math.sin(now*30)*1.4; ctx.fillStyle = '#ffd34a'; circ(6.4+sp*0.4,-14-Math.abs(sp),2.2); ctx.fill(); ctx.fillStyle = '#ff5a1a'; circ(6.4,-14,1.2); ctx.fill(); }
    ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1;
  },
  dunepriest(e,K,flash,now,t,face){
    const ai = e.ai||{}, f = face==='left'?-1:1, bob = Math.sin(now*2+e.x)*1;
    if(ai.hf>0){ const p = 1-ai.hf/600; ctx.strokeStyle = 'rgba(122,255,154,'+(0.9-p*0.8)+')'; ctx.lineWidth = 2; ell(0,8,20+p*130,8+p*60); ctx.stroke(); ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1; }
    shadowAt(0,12,9,3); ctx.translate(0,bob);
    ctx.fillStyle = K('#c9a458'); ctx.beginPath(); ctx.moveTo(-5.5,-5); ctx.lineTo(5.5,-5); ctx.lineTo(10,13); ctx.lineTo(-10,13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#f2e6c0'); ctx.beginPath(); ctx.moveTo(-3,-5); ctx.lineTo(3,-5); ctx.lineTo(4.4,13); ctx.lineTo(-4.4,13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = K('#2a6ab0'); ctx.fillRect(-9,8,18,2);
    ctx.fillStyle = K('#e0b83a'); rrect(-7,-7,14,3.4,1.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#7a5a38'); circ(0,-10,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#e0b83a'); ctx.beginPath(); ctx.moveTo(-6,-10); ctx.lineTo(-4,-22); ctx.lineTo(0,-16); ctx.lineTo(4,-22); ctx.lineTo(6,-10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#2a6ab0'); ctx.beginPath(); ctx.moveTo(-1.6,-15); ctx.lineTo(0,-19); ctx.lineTo(1.6,-15); ctx.fill();
    if(!flash){ ctx.fillStyle = '#14100a'; circ(-1.8,-10,0.9); ctx.fill(); circ(1.8,-10,0.9); ctx.fill(); }
    ctx.strokeStyle = '#6a4a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f*10,13); ctx.lineTo(f*10,-9); ctx.stroke();
    ctx.strokeStyle = K('#e0b83a'); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(f*10,-13,2.6,3.6,0,0,6.283); ctx.moveTo(f*10-3.4,-8.6); ctx.lineTo(f*10+3.4,-8.6); ctx.stroke();
    if(!flash){ ctx.fillStyle = 'rgba(122,255,154,0.35)'; circ(f*10,-13,6+Math.sin(now*5)*1); ctx.fill(); }
    ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1;
  },
  snowstalker(e,K,flash,now,t,face){
    const ai = e.ai||{}, sw = Math.sin(t)*2, f = face==='left'?-1:1;
    const a = ai.bl>0 ? 0.35+0.65*(1-ai.bl/450) : 1;
    ctx.globalAlpha = a;
    shadowAt(0,12,8,2.6);
    ctx.fillStyle = K('#7ab0d0'); rrect(-4.4,4,3.2,8+sw*0.4,1); ctx.fill(); ctx.stroke(); rrect(1.2,4,3.2,8-sw*0.4,1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#d8ecf8'); ctx.beginPath(); ctx.moveTo(-6,-8); ctx.lineTo(6,-8); ctx.lineTo(9,6); for(let i=0;i<=4;i++) ctx.lineTo(9-i*4.5, 6+(i%2?4:0)); ctx.lineTo(-9,6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#a8d0e8'); ctx.beginPath(); ctx.moveTo(-6,-8); ctx.lineTo(-11,-14); ctx.lineTo(-4,-10); ctx.moveTo(6,-8); ctx.lineTo(11,-14); ctx.lineTo(4,-10); ctx.fill();
    ctx.fillStyle = K('#bfe0f4'); ctx.beginPath(); ctx.moveTo(-5.4,-11); ctx.lineTo(0,-22); ctx.lineTo(5.4,-11); ctx.lineTo(0,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#0a1a2a'; ell(0,-11,3.2,3.6); ctx.fill();
    if(!flash){ ctx.fillStyle = '#7ae8ff'; circ(-1.4,-11.4,1); ctx.fill(); circ(1.4,-11.4,1); ctx.fill(); ctx.fillStyle = 'rgba(230,250,255,0.7)'; for(let i=0;i<3;i++){ const p=(now*0.6+i/3)%1; circ(-6+i*6+Math.sin(now*3+i)*2, 10-p*22, 1.1); ctx.fill(); } }
    ctx.strokeStyle = K('#e8f8ff'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(f*6,-4); ctx.lineTo(f*13,2+sw*0.3); ctx.stroke(); ctx.lineWidth = 1.2; for(const k of [-1,0,1]){ ctx.beginPath(); ctx.moveTo(f*13,2+sw*0.3); ctx.lineTo(f*(16+k),5+k*2); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.strokeStyle = NEW_OUT; ctx.lineWidth = 1;
  },
  vampbat(e,K,flash,now,t){
    const fl = Math.sin(now*17+e.x*0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ell(0,15,6.5,2); ctx.fill();
    ctx.translate(0,Math.sin(now*5+e.x)*1.6-2);
    for(const s of [-1,1]){
      ctx.fillStyle = K('#5a1230'); ctx.strokeStyle = NEW_OUT;
      ctx.beginPath(); ctx.moveTo(s*3,-3); ctx.quadraticCurveTo(s*10,-16-fl*6,s*21,-9-fl*8); ctx.lineTo(s*17,-4-fl*4); ctx.lineTo(s*18,-1-fl*3); ctx.lineTo(s*13,-1-fl*2); ctx.lineTo(s*13,3-fl*2); ctx.lineTo(s*8,0); ctx.lineTo(s*6,3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,90,120,0.45)'; ctx.beginPath(); ctx.moveTo(s*3,-3); ctx.lineTo(s*19,-8-fl*7); ctx.moveTo(s*3,-3); ctx.lineTo(s*13,1-fl*2); ctx.stroke();
    }
    ctx.strokeStyle = NEW_OUT; ctx.fillStyle = K('#7a1f3a'); ell(0,0,4.6,6); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4,-4); ctx.lineTo(-5.6,-11); ctx.lineTo(-1,-5.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(4,-4); ctx.lineTo(5.6,-11); ctx.lineTo(1,-5.6); ctx.fill();
    if(!flash){ ctx.fillStyle = '#ffe24a'; circ(-1.9,-2.2,1.3); ctx.fill(); circ(1.9,-2.2,1.3); ctx.fill(); ctx.fillStyle = 'rgba(255,60,90,0.25)'; circ(0,0,10); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-2.6,2); ctx.lineTo(-1,2); ctx.lineTo(-1.8,6.2); ctx.fill(); ctx.beginPath(); ctx.moveTo(2.6,2); ctx.lineTo(1,2); ctx.lineTo(1.8,6.2); ctx.fill();
    ctx.fillStyle = '#c0203a'; circ(-1.8,6.6,0.7); ctx.fill();
  },
  bombardier(e,K,flash,now,t,face){
    const ai = e.ai||{}, f = face==='left'?-1:1, sw = Math.sin(t)*2, kick = ai.mf>0 ? 1.6 : 0;
    shadowAt(0,12,9.5,3);
    ctx.fillStyle = K('#4a3a28'); rrect(-5,5,3.6,7+sw*0.4,1); ctx.fill(); ctx.stroke(); rrect(1.4,5,3.6,7-sw*0.4,1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#6a5a3a'); rrect(-7.5,-6,15,12,3.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#8a2a2a'); ctx.fillRect(-7.5,0,15,2.4);
    ctx.fillStyle = K('#c9a23a'); for(const x of [-4,0,4]){ circ(x,-2.4,0.9); ctx.fill(); }
    ctx.fillStyle = K('#d8a888'); circ(0,-10,5.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = K('#4a4a52'); ctx.beginPath(); ctx.moveTo(-6.4,-10); ctx.quadraticCurveTo(0,-20,6.4,-10); ctx.lineTo(7.6,-8.4); ctx.lineTo(-7.6,-8.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!flash){ ctx.fillStyle = '#14100a'; circ(-1.8,-9.6,0.9); ctx.fill(); circ(1.8,-9.6,0.9); ctx.fill(); }
    ctx.save(); ctx.translate(f*(5-kick),-8); ctx.rotate(f*-0.9);
    ctx.fillStyle = K('#3a3a42'); rrect(-2.6,-14,5.2,17,1.4); ctx.fill(); ctx.stroke(); ctx.fillStyle = K('#2a2a30'); rrect(-3.6,-15.6,7.2,3.4,1); ctx.fill();
    ctx.restore();
    if(ai.mf>0 && !flash){ ctx.fillStyle = 'rgba(255,214,90,0.85)'; circ(f*(5-kick)+f*-10,-24,3.4+ai.mf/150); ctx.fill(); ctx.fillStyle = '#fff'; circ(f*(5-kick)+f*-10,-24,1.6); ctx.fill(); }
    ctx.fillStyle = K('#7a5a2a'); rrect(f*-9-3.6,-1,7.2,8,1.6); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#2a1a0a'; ctx.beginPath(); ctx.moveTo(f*-9-3.6,2); ctx.lineTo(f*-9+3.6,2); ctx.stroke(); ctx.strokeStyle = NEW_OUT;
  },
};
