import asyncio, json
from playwright.async_api import async_playwright
import os; SC=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'dist')+'/'  # dist/test.html собирает tools/build.py --test
PERF=float(os.environ.get('PERF_SLACK','1.6'))  # в CI (софт-рендер) пороги кадра ослабляются
ok=True
def chk(name,cond,extra=''):
    global ok
    print(('PASS ' if cond else 'FAIL ')+name,extra)
    if not cond: ok=False
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1100,'height':620})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file://'+SC+'test.html'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{__t.beginNewGame(); for(const id of ['lair1','lair2','lair3','lair4','lair5','lair6','lair7','lair8','lair9','lair10']){ const L=__t.world[id]; if(L.portal) L.portal.open=true; if(L.boss) L.boss.hp=0; } }"); await pg.wait_for_timeout(300)
        # --- 1. продажа
        await pg.evaluate("()=>{__t.player.gold=500; __t.openShop(); }")
        btns=await pg.evaluate("()=>[...document.querySelectorAll('#shopList .shopItem')].map(r=>r.querySelector('b').textContent+': '+[...r.querySelectorAll('button')].map(b=>b.textContent+(b.disabled?'(off)':'')).join(' | '))")
        print(btns)
        chk('sell absent when not owned', all('Продать' not in x for x in btns[:4]))
        # купить копьё
        await pg.evaluate("()=>{[...document.querySelectorAll('#shopList .shopItem')][1].querySelectorAll('button')[0].click()}")
        r=await pg.evaluate("()=>({g:__t.player.gold,w:__t.player.weapon,o:Object.keys(__t.player.owned)})"); print(r)
        chk('bought spear',r['w']=='spear' and r['g']==450)
        btns=await pg.evaluate("()=>[...document.querySelectorAll('#shopList .shopItem')].map(r=>[...r.querySelectorAll('button')].map(b=>b.textContent).join(' | '))")
        print(btns); chk('sell btn spear 25','Продать — 25 ◆' in btns[1])
        chk('no sell for sword','Продать' not in btns[0])
        await pg.evaluate("()=>{[...document.querySelectorAll('#shopList .shopItem')][1].querySelectorAll('button')[1].click()}")
        r=await pg.evaluate("()=>({g:__t.player.gold,w:__t.player.weapon,o:Object.keys(__t.player.owned)})"); print(r)
        chk('sold spear -> sword, +25',r['w']=='sword' and r['g']==475 and 'spear' not in r['o'])
        # броня
        await pg.evaluate("()=>{__t.setShopTab('armor'); __t.renderShop('')}")
        await pg.evaluate("()=>{[...document.querySelectorAll('#shopList .shopItem')][2].querySelectorAll('button')[0].click()}") # plate? index0 leather,1 chain,2 plate
        r=await pg.evaluate("()=>({g:__t.player.gold,a:__t.player.armor})"); print(r)
        await pg.evaluate("()=>{[...document.querySelectorAll('#shopList .shopItem')][2].querySelectorAll('button')[1].click()}")
        r=await pg.evaluate("()=>({g:__t.player.gold,a:__t.player.armor})"); print(r)
        chk('sold plate',r['a']=='none' and r['g']==355)
        await pg.evaluate("()=>{__t.setShopTab('quests'); __t.renderShop('')}")
        n=await pg.evaluate("()=>document.querySelectorAll('#shopList .shopItem').length"); chk('19 quests',n==19,n)
        await pg.evaluate("()=>{__t.closeShop()}")
        # --- 2. цепочка боссов и переходов
        chain=[('lair1','dungeon1'),('lair2','dungeon3'),('lair3','lava'),('lair4','desert'),('lair5','ice'),('lair6','grave'),('lair7','jungle'),('lair8','city'),('lair9','manor')]
        for a,bn in chain:
            await pg.evaluate("(id)=>{const d=__t.world[id]; __t.goTo(id,d.spawn.x,d.spawn.y,''); __t.player.hp=__t.player.maxHp; __t.player.invuln=99999; __t.transitionCooldown=0;}",a)
            await pg.wait_for_timeout(100)
            await pg.evaluate("()=>{const l=__t.loc; l.enemies.forEach(e=>{ if(!__t.BOSS_TYPES.includes(e.type)) e.hp=0; }); const bs=l.boss; bs.hp=0; __t.killEnemy(bs); }")
            op=await pg.evaluate("()=>[__t.loc.portal.open, __t.loc.grid[__t.loc.portal.ty][__t.loc.portal.tx]]")
            chk(f'portal opened in {a}',op==[True,'v'],op)
            await pg.evaluate("()=>{const p=__t.loc.portal; __t.player.x=p.tx*32+5; __t.player.y=p.ty*32+5; __t.transitionCooldown=0}")
            await pg.wait_for_timeout(150)
            cur=await pg.evaluate("()=>__t.locId"); chk(f'{a}->{bn}',cur==bn,cur)
            # обратно по выходу
            await pg.evaluate("()=>{const e=__t.loc.exit; __t.player.x=e.tx*32+5; __t.player.y=e.ty*32+5; __t.transitionCooldown=0}")
            await pg.wait_for_timeout(150)
            cur=await pg.evaluate("()=>__t.locId"); chk(f'{bn} exit -> {a}',cur==a,cur)
        # ледяной король -> сокровище -> победа
        await pg.evaluate("()=>{const d=__t.world.lair10; __t.goTo('lair10',d.spawn.x,d.spawn.y,''); __t.player.invuln=99999; __t.transitionCooldown=0; const l=__t.loc; l.enemies.forEach(e=>{ if(e.type!=='phantom') e.hp=0; }); l.boss.hp=0; __t.killEnemy(l.boss); }")
        tr=await pg.evaluate("()=>__t.loc.items.filter(i=>i.type==='treasure').length"); chk('treasure dropped',tr==1)
        await pg.evaluate("()=>{const it=__t.loc.items.find(i=>i.type==='treasure'); __t.player.x=it.x; __t.player.y=it.y;}")
        await pg.wait_for_timeout(200)
        st=await pg.evaluate("()=>__t.state"); chk('win state',st=='won',st)
        # --- 3. стрелки
        await pg.evaluate("()=>{__t.beginNewGame(); __t.player.invuln=0}"); await pg.wait_for_timeout(100)
        await pg.evaluate("()=>{const d=__t.world.lava; __t.goTo('lava',d.spawn.x,d.spawn.y,''); __t.loc.enemies.length=0; __t.loc.exit={tx:1,ty:1}; const P=__t.player; let best=[P.x+160,P.y-4]; for(let a=0;a<360;a+=15){ const x=P.x+Math.cos(a*Math.PI/180)*150, y=P.y+Math.sin(a*Math.PI/180)*150; if(!__t.isBlocked(__t.loc,x,y,20,20) && __t.hasLOS(x+10,y+10,P.x+11,P.y+11)){ best=[x,y]; break; } } const e=__t.makeEnemy('imp',best[0],best[1],4); __t.loc.enemies.push(e); __t.player.invuln=0}")
        await pg.wait_for_timeout(3500)
        r=await pg.evaluate("()=>({hp:__t.player.hp, shots:__t.eshots.length})"); print(r)
        chk('imp shoots / hurts',r['hp']<100 or r['shots']>0,r)
        # --- 4. достижимость
        res=await pg.evaluate("""()=>{ const out=[]; for(let i=0;i<25;i++){ for(const [lv,bi,kind] of [[5,'desert'],[6,'ice']].map(a=>[a[0],a[1]])){} }
          function bfs(L,sx,sy){ const W=L.width,H=L.height; const seen=Array.from({length:H},()=>Array(W).fill(false)); const q=[[sx,sy]]; seen[sy][sx]=true; while(q.length){ const [x,y]=q.pop(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H||seen[ny][nx]) continue; const t=L.grid[ny][nx]; if(t==='#'||t==='L') continue; seen[ny][nx]=true; q.push([nx,ny]); } } return seen; }
          let bad=0, total=0;
          const T=__t.TILE;
          for(let i=0;i<20;i++){ const Ls=[__t.generateField(7,'grave'),__t.generateField(8,'jungle'),__t.generateField(6,'ice'),__t.generateDungeon(4),__t.generateDungeon(3)];
            for(const L of Ls){ const seen=bfs(L,Math.floor(L.spawn.x/T),Math.floor(L.spawn.y/T)); const pts=[...L.enemies.map(e=>[e.x+e.w/2,e.y+e.h/2]),...L.items.map(e=>[e.x+8,e.y+8])]; for(const [x,y] of pts){ total++; if(!seen[Math.floor(y/T)][Math.floor(x/T)]) bad++; }
              // не на лаве/стене
              for(const e of L.enemies){ const t=L.grid[Math.floor((e.y+e.h/2)/T)][Math.floor((e.x+e.w/2)/T)]; if(t==='#'||t==='L') bad++; } } }
          return [bad,total]; }""")
        chk('all spawns reachable & not in walls/lava',res[0]==0,res)
        # сохранение/загрузка новых локаций
        await pg.evaluate("()=>{const d=__t.world.desert; __t.goTo('desert',d.spawn.x,d.spawn.y,''); __t.env.t=0.77; __t.env.b.desert.name='sand'; __t.saveGame()}")
        await pg.evaluate("()=>{__t.beginNewGame()}")
        r=await pg.evaluate("()=>{ const ok=__t.loadGame(); return [ok,__t.locId,__t.env.t.toFixed(2),__t.env.b.desert.name,__t.loc.enemies.length] }"); print(r)
        chk('reload desert + env',r[0] and r[1]=='desert' and r[2]=='0.77' and r[3]=='sand')
        print('errors',errs[:5]); chk('no js errors',not errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAIL')
asyncio.run(main())
