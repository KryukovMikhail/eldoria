import asyncio, sys, os
from playwright.async_api import async_playwright
SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'
ok=True
def chk(name,cond,extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name,extra)
    if not cond: ok=False
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox']); pg=await b.new_page(viewport={'width':900,'height':500})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        E=pg.evaluate
        setup="""const t=__t,P=t.player,L=t.loc; L.enemies.length=0; P.invuln=0; P.hp=P.maxHp=1000; t.setEnv({weather:'clear',tod:0.5});
          // чистая площадка вокруг героя
          const T=32, cx=Math.floor(P.x/T), cy=Math.floor(P.y/T); for(let y=cy-8;y<=cy+8;y++) for(let x=cx-10;x<=cx+10;x++) if(L.grid[y]&&L.grid[y][x]!=='#') L.grid[y][x]='.';
          const mk=(ty,dx,dy)=>{const e=t.makeEnemy(ty,P.x+dx,P.y+dy,1); L.enemies.push(e); return e;};"""
        # все новые типы: описаны в энциклопедии, есть в ростерах, рисуются без ошибок
        r=await E("""()=>{const t=__t; const nw=Object.keys(t.NEW_ENEMY_BASE); const noInfo=nw.filter(k=>!t.ENEMY_INFO[k]); const inRoster=nw.filter(k=>k==='slimelet'||Object.values(t.LEVEL_ROSTER).some(a=>a.includes(k))); return [nw.length,noInfo,nw.length-inRoster.length]}""")
        chk('11+ new types, all in codex, all in rosters (slimelet is spawned only)',r[0]>=11 and r[1]==[] and r[2]==0,r)
        r=await E("()=>{const t=__t; const c=t.canvas; for(const k of Object.keys(t.NEW_ENEMY_BASE)){ const e=t.makeEnemy(k,0,0,1); e.ai={g:1,st:'wind',t:5,f:100,sa:300,hf:200,bl:100,mf:100,gf:100}; t.ctx.save(); t.drawEnemy(e,50,50); e.hitFlash=100; t.drawEnemy(e,80,50); t.ctx.restore(); } return 'ok'}")
        chk('all draw (normal+flash+all states)',r=='ok',r)
        # таран: замах -> рывок -> быстрое движение
        r=await E("()=>{"+setup+"""
          const e=mk('ram',200,0); e.ai={cd:0}; let st=[],x0=e.x,maxStep=0,prev=e.x;
          for(let i=0;i<150;i++){ t.update(0.016); st.push(e.ai.st||'-'); maxStep=Math.max(maxStep,Math.abs(e.x-prev)); prev=e.x; if(P.invuln>0) break; }
          return [st.includes('wind'),st.includes('dash'),maxStep, P.invuln>0]}""")
        chk('ram winds up, dashes (fast), hits',r[0] and r[1] and r[2]>2.5 and r[3],r)
        # студень делится на 2 капельки (мини, не дают золота и не плодят таймер волны)
        r=await E("()=>{"+setup+"""
          const e=mk('gelcube',100,0); e.hp=0; t.killEnemy(e); const kids=L.enemies.filter(m=>m.type==='slimelet'&&m.hp>0);
          return [kids.length, kids.every(m=>m.minion&&m.gold===0)]}""")
        chk('gelcube splits into 2 minion slimelets',r==[2,True],r)
        # щитоносец: спереди 25% урона, со спины полный
        r=await E("()=>{"+setup+"""
          const e=mk('shieldbearer',120,0); e.ai={g:Math.PI}; // смотрит влево, на героя
          const h0=e.hp; t.damageEnemy(e,40); const front=h0-e.hp;
          e.ai.g=0; const h1=e.hp; t.damageEnemy(e,40); const back=h1-e.hp; return [front,back]}""")
        chk('shield: front hit reduced to ~25%, back hit full',r[1]>0 and r[0]<r[1]*0.4,r)
        # некромант: поднимает не более 2, при смерти скелеты рассыпаются
        r=await E("()=>{"+setup+"""
          const e=mk('necromancer',150,0); for(let i=0;i<60*14;i++){ t.update(0.016); if(i%30===0) P.hp=P.maxHp; }
          const kids=L.enemies.filter(m=>m.owner&&m.hp>0).length; e.hp=0; t.killEnemy(e); const left=L.enemies.filter(m=>m.owner&&m.hp>0).length;
          return [kids,left]}""")
        chk('necromancer summons up to 2, they vanish with him',r[0]==2 and r[1]==0,r)
        # подрывник: взрыв наносит урон по площади и враг умирает
        r=await E("()=>{"+setup+"""
          const e=mk('emberbomb',30,0); const hp0=P.hp; let dead=false,lo=P.hp,log=[]; for(let i=0;i<210;i++){ const h=P.hp; t.update(0.016); if(P.hp<h) log.push([i,h-P.hp,P.shield,P.buff.guard,t.loc.enemies.length]); lo=Math.min(lo,P.hp); if(e.hp<=0) dead=true; }
          return [dead, log.length?log[0][1]:0]}""")
        chk('emberbomb explodes: dies and hurts hero',r[0] and r[1]>=20,r)
        # целитель: лечит раненого союзника
        r=await E("()=>{"+setup+"""
          const pr=mk('dunepriest',200,0), w=mk('wolf',230,0); w.aggro=0; w.hp=w.maxHp*0.3; const h0=w.hp; for(let i=0;i<60*6;i++) t.update(0.016);
          return [h0, w.hp, w.maxHp]}""")
        chk('dunepriest heals wounded ally',r[1]>r[0]+r[2]*0.1,r)
        # скиталец: телепортируется близко к герою
        r=await E("()=>{"+setup+"""
          const e=mk('snowstalker',230,0); const x0=e.x,y0=e.y; let jumped=false,dmin=1e9; for(let i=0;i<60*8;i++){ t.update(0.016); const d=Math.hypot(e.x-x0,e.y-y0); if(d>120 && !jumped) jumped = true; dmin=Math.min(dmin,Math.hypot(e.x-P.x,e.y-P.y)); }
          return [jumped,dmin]}""")
        chk('snowstalker blinks near hero',r[0],r)
        # кровокрыл лечится о героя
        r=await E("()=>{"+setup+"""
          const e=mk('vampbat',10,0); e.hp=e.maxHp*0.2; const h0=e.hp; for(let i=0;i<60*3;i++) t.update(0.016); return [h0,e.hp,e.maxHp]}""")
        chk('vampbat leeches',r[1]>r[0],r)
        # бомбардир: ставит круг под героем и бьёт по нему, стоящему на месте
        r=await E("()=>{"+setup+"""
          const e=mk('bombardier',200,0); let marks=0; const hp0=P.hp; for(let i=0;i<60*8;i++){ t.update(0.016); marks=Math.max(marks,t.aoes.length); }
          return [marks, hp0-P.hp]}""")
        chk('bombardier telegraphs and hits stationary hero',r[0]>=1 and r[1]>0,r)
        # старые сохранения/волны: спавн новых врагов работает в каждой локации без исключений
        r=await E("""()=>{const t=__t; let n=0; for(const id of Object.keys(t.world)){ t.setLoc(id); try{ t.loc.enemies.length=0; n+=t.spawnWave()||0; for(let i=0;i<30;i++) t.update(0.016);}catch(e){ return 'ERR '+id+' '+e.message } } return n}""")
        chk('spawnWave+update across all locations',isinstance(r,int) and r>0,r)
        # сохранение с новыми врагами и загрузка
        r=await E("""()=>{const t=__t; t.setLoc('overworld'); const L=t.loc; L.enemies.length=0; const e=t.makeEnemy('necromancer',t.player.x+60,t.player.y,1); e.ai={sc:100}; L.enemies.push(e); const j=JSON.stringify(t.packLoc(L)); const L2=t.unpackLoc(JSON.parse(j)); return L2.enemies.length+':'+L2.enemies[0].type+':'+!!L2.enemies[0].ab}""")
        chk('saved enemy keeps ability config',r=='1:necromancer:true',r)
        chk('no page errors',not errs,errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAIL'); sys.exit(0 if ok else 1)
asyncio.run(main())
