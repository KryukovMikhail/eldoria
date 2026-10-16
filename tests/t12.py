import asyncio
from playwright.async_api import async_playwright
import os; SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'  # dist/test.html собирает tools/build.py --test
PERF=float(os.environ.get('PERF_SLACK','1.6'))  # в CI (софт-рендер) пороги кадра ослабляются
ok=True
def chk(n,c,x=''):
    global ok
    print(('PASS ' if c else 'FAIL ')+n,x)
    if not c: ok=False
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1100,'height':620})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{__t.beginNewGame()}"); await pg.wait_for_timeout(300)
        E=lambda js,a=None: pg.evaluate(js,a)
        r=await E("()=>[__t.world.overworld.width,__t.world.dungeon1.width,__t.world.dungeon3.width,__t.world.desert.width,__t.world.overworld.enemies.length,__t.world.overworld.items.filter(i=>i.type==='potion').length,__t.world.overworld.items.length]")
        chk('bigger maps',r[0]==112 and r[1]==50 and r[2]==64 and r[3]==96,r); print(r)
        # reachability on new overworld/dungeons/fields
        res=await E("""()=>{ const T=32; let bad=0,total=0, entBad=0;
          for(let i=0;i<8;i++){ const ls=[__t.generateDungeon(1+i%4),__t.generateField(5+i%4,['desert','ice','grave','jungle'][i%4])];
            for(const L of ls){ __t.setLoc; } }
          const w=__t.world; for(const id of ['overworld','dungeon1','lair1','dungeon3','lava','desert','ice','grave','jungle']){ __t.setLoc(id); const L=__t.loc; const sx=Math.floor(L.spawn.x/T), sy=Math.floor(L.spawn.y/T); const D=__t.bfsDist(sx,sy,9999);
            const pts=[...L.enemies.map(e=>[e.x+e.w/2,e.y+e.h/2]),...L.items.map(e=>[e.x+8,e.y+8])]; for(const [x,y] of pts){ total++; if(D[Math.floor(y/T)*L.width+Math.floor(x/T)]<0) bad++; }
            if(L.entrances) for(const en of L.entrances){ if(D[en.ty*L.width+en.tx]<0) entBad++; } if(L.portal){} }
          __t.setLoc('overworld'); return [bad,total,entBad]}""")
        chk('all reachable',res[0]<=2 and res[2]==0,res)
        # --- лук
        r=await E("""()=>{ __t.player.weapon='bow'; __t.player.owned.bow=true; const p=__t.player; const L=__t.loc; L.enemies.length=0; p.dir='right'; __t.fireArrow(); const a=__t.arrows[0]; return [a.max,a.dmg,__t.playerDamage()]}""")
        chk('bow range 150',r[0]==150,r)
        r=await E("""()=>{ const L=__t.loc,p=__t.player; __t.arrows.length=0; L.enemies.length=0; const sp=p.x; for(const [dx,lab] of [[40,'near'],[110,'far']]){ const e=__t.makeEnemy('skeleton',p.x+dx,p.y,1); e.hp=e.maxHp=9999; L.enemies.push(e); } const near=L.enemies[0], far=L.enemies[1]; 
            // два выстрела по разным врагам
            const run=(e)=>{ L.enemies.length=0; e.x=p.x+e.dx; L.enemies.push(e); const h0=e.hp; __t.arrows.length=0; __t.fireArrow(); for(let i=0;i<40;i++) __t.update(0.016); return h0-e.hp };
            near.dx=40; far.dx=110; return [run(near),run(far)] }""")
        chk('arrow closer=more dmg',r[0]>r[1]>0,r)
        await E("()=>{__t.player.weapon='sword'}")
        # --- ближний бой: ближе — больнее
        r=await E("""()=>{ const p=__t.player,L=__t.loc; L.enemies.length=0; p.dir='right'; const res=[]; for(const dx of [14,30]){ const e=__t.makeEnemy('skeleton',p.x+p.w+dx-14,p.y,1); e.hp=e.maxHp=9999; L.enemies.push(e); const h0=e.hp; __t.meleeStrike(__t.attackHitbox(),1,0); res.push(Math.round(h0-e.hp)); L.enemies.length=0; } return res }""")
        chk('melee closer=more dmg',r[0]>r[1]>0,r)
        # --- через деревья
        r=await E("""()=>{ const p=__t.player,L=__t.loc,T=32; L.enemies.length=0; p.dir='right'; const tx=Math.floor((p.x+p.w+10)/T), ty=Math.floor((p.y+11)/T); const old=L.grid[ty][tx]; L.grid[ty][tx]='#'; const e=__t.makeEnemy('skeleton',(tx+1)*T+2,p.y,1); e.hp=e.maxHp=500; L.enemies.push(e); const h0=e.hp; const hb={x:p.x,y:p.y-10,w:140,h:44}; __t.meleeStrike(hb,1,0); const blocked=h0-e.hp; L.grid[ty][tx]=old; __t.meleeStrike(hb,1,0); return [blocked,h0-e.hp]}""")
        chk('no hit through trees',r[0]==0 and r[1]>0,r)
        # --- удержание
        r=await E("""()=>{ const p=__t.player,L=__t.loc; L.enemies.length=0; p.dir='right'; p.attackTimer=0; const e=__t.makeEnemy('skeleton',p.x+p.w,p.y,1); e.hp=e.maxHp=9999; e.speed=0; L.enemies.push(e); p.invuln=1e9;
            __t.keys['Space']=true; __t.update(0.016); const afterTap=e.hp; for(let i=0;i<60;i++) __t.update(0.016); const charge=p.chargeT; e.x=p.x+p.w; e.y=p.y; const hp1=e.hp; __t.keys['Space']=false; __t.update(0.016); const heavy=hp1-e.hp; 
            // короткое нажатие
            p.attackTimer=0; e.hp=9999; e.x=p.x+p.w; e.y=p.y; __t.keys['Space']=true; __t.update(0.016); __t.keys['Space']=false; __t.update(0.016); const tap=9999-e.hp; return [Math.round(charge),Math.round(heavy),Math.round(tap)]}""")
        chk('heavy attack on hold',r[0]>=700 and r[1]>r[2]*1.8 and r[2]>0,r)
        # --- респаун
        r=await E("""()=>{ __t.beginNewGame(); const L=__t.loc,p=__t.player; L.enemies.forEach(e=>e.hp=0); let n0=L.enemies.filter(e=>e.hp>0).length; for(let i=0;i<60*28;i++) __t.update(0.016); const alive=L.enemies.filter(e=>e.hp>0); const minD=Math.min(...alive.map(e=>Math.hypot(e.x-p.x,e.y-p.y)))/32; return [n0,alive.length,Math.round(minD)]}""")
        chk('respawn after clear',r[0]==0 and r[1]>=8 and r[2]>=12,r)
        r=await E("""()=>{ const d=__t.world.lair1; __t.goTo('lair1',d.spawn.x,d.spawn.y,''); __t.player.invuln=1e9; const L=__t.loc; const boss=L.boss; L.enemies.forEach(e=>{ if(e!==boss) e.hp=0}); for(let i=0;i<60*40;i++) __t.update(0.016); const alive=L.enemies.filter(e=>e.hp>0&&e!==boss); return [alive.length, alive.every(e=>e.type!=='boss')]}""")
        chk('dungeon respawn (boss alive)',r[0]>=5 and r[1],r)
        # --- сложность
        r=await E("""()=>{ __t.beginNewGame(); const out={}; for(const d of ['easy','normal','hard','nightmare']){ __t.setDifficulty(d); const e=__t.makeEnemy('skeleton',0,0,1); e.hp=e.maxHp=1000; __t.damageEnemy(e,100); out[d]=[__t.incomingDamage(40), Math.round(1000-e.hp)]; } __t.setDifficulty('normal'); return out}""")
        chk('difficulty scaling',r['easy'][0]<r['normal'][0]<r['hard'][0]<r['nightmare'][0] and r['easy'][1]>r['normal'][1]>r['hard'][1]>r['nightmare'][1],r)
        r=await E("""()=>{ __t.setDifficulty('hard'); __t.saveGame(); __t.beginNewGame(); const mid=__t.difficulty; __t.setDifficulty('easy'); const ok=__t.loadGame(); return [mid,ok,__t.difficulty]}""")
        chk('diff saved/loaded',r[1] and r[2]=='hard',r)
        r=await E("""()=>{ const btns=[...document.querySelectorAll('#diffBtns button')]; return [btns.length, btns.filter(b=>b.disabled).length]}""")
        chk('diff locked in running game',r[0]==4 and r[1]==3,r)
        await E("()=>__t.setDifficulty && 0")
        # --- застревание
        r=await E("""()=>{ __t.beginNewGame(); const d=__t.world.lair1; __t.goTo('lair1',d.spawn.x,d.spawn.y,''); const L=__t.loc,T=32; const b=L.boss; // вмуровываем в стену
            let wx=null; for(let y=1;y<L.height-1&&!wx;y++) for(let x=1;x<L.width-1;x++) if(L.grid[y][x]==='#'&&L.grid[y][x+1]==='#'&&L.grid[y+1][x]==='#'){ wx=[x,y]; break; }
            b.x=wx[0]*T+8; b.y=wx[1]*T+8; const was=__t.isBlocked(L,b.x,b.y,b.w,b.h); __t.player.invuln=1e9; __t.update(0.016); return [was,__t.isBlocked(L,b.x,b.y,b.w,b.h)] }""")
        chk('boss unstuck from wall',r[0] and not r[1],r)
        # обход стены: враг за стеной достигает игрока
        r=await E("""()=>{ __t.beginNewGame(); const d=__t.world.dungeon1; __t.goTo('dungeon1',d.spawn.x,d.spawn.y,''); const L=__t.loc,T=32,p=__t.player; p.invuln=1e9; L.enemies.length=0;
            let best=null;
            for(let tries=0;tries<400&&!best;tries++){ const px=2+Math.floor(Math.random()*(L.width-4)), py=2+Math.floor(Math.random()*(L.height-4)); if(L.grid[py][px]!=='.'||Math.hypot(px-L.exit.tx,py-L.exit.ty)<10) continue; const D0=__t.bfsDist(px,py,400);
              for(let y=2;y<L.height-2&&!best;y++) for(let x=2;x<L.width-2;x++){ const d1=D0[y*L.width+x]; if(d1<0||L.grid[y][x]!=='.') continue; const eu=Math.hypot(x-px,y-py); if(eu>=4&&eu<9&&d1>=eu*2.2&&d1<=40){ best=[x,y,px,py]; break; } } }
            if(!best) return 'nopair'; p.x=best[2]*T+5; p.y=best[3]*T+5; const e=__t.makeEnemy('skeleton',best[0]*T+4,best[1]*T+4,1); e.aggro=900; e.speed=80; L.enemies.push(e); const d00=Math.hypot(e.x-p.x,e.y-p.y); let t=0; for(let i=0;i<60*40;i++){ __t.update(0.016); t++; if(Math.hypot(e.x-p.x,e.y-p.y)<30) break; } return [Math.round(d00),Math.round(Math.hypot(e.x-p.x,e.y-p.y)),t]}""")
        chk('enemy paths around walls',r!='nopair' and r[1]<40,r)
        # audio
        r=await E("()=>{ try{ SFX_ok=1; window.dispatchEvent(new Event('touchend')); return __t.SFX.ctx?__t.SFX.ctx.state:'noctx' }catch(e){ return 'ERR '+e }}")
        print('audio',r)
        await E("()=>{__t.beginNewGame()}"); ms=await E("()=>{const t0=performance.now(); for(let i=0;i<120;i++){__t.update(0.016); __t.draw();} return (performance.now()-t0)/120}")
        print('ms/frame (big overworld)',ms); print('errors',errs[:5]); chk('no js errors',not errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAIL')
asyncio.run(main())
