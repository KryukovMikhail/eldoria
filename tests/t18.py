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
        E=lambda js,a=None: pg.evaluate(js,a)
        # menu
        r=await E("()=>[document.getElementById('buildTag').textContent, document.getElementById('startScreen').innerText]")
        chk('buildTag',  'D001.038' in r[0], r[0])
        chk('menu: no old text/scheme', 'Этапы' not in r[1], '')
        await pg.screenshot(path=SC+'z_menu.png')
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        for i in range(3): await pg.click('#dlgBtn')
        await E("()=>{__t.loc.enemies.length=0}")
        r=await E("()=>{__t.renderDiff&&__t.renderDiff(); return document.documentElement.innerHTML.includes('Уровень сложности можно выбрать только при запуске новой игры')}"); chk('locked-diff text present in code', r, r)
        r=await E("()=>__t.getLocName(__t.loc)"); chk('overworld name',r=='Оверворлд',r)
        # statuses
        r=await E("""()=>{const P=__t.player; P.shield=0;P.buff.guard=0;P.dashT=0; P.fx.freeze=0;P.fx.freezeImm=0;
          const a=__t.inflictStatus('freeze',1000,10); const b=__t.inflictStatus('freeze',1000,10);
          const x0=P.x; __t.keys['KeyD']=true; for(let i=0;i<20;i++) __t.update(0.016); __t.keys['KeyD']=false;
          const moved=Math.abs(P.x-x0); for(let i=0;i<80;i++) __t.statusTick(0.016);
          return [a,b,moved,P.fx.freeze,P.fx.freezeImm]}""")
        chk('freeze immobilizes once, then immunity', r[0] and not r[1] and r[2]<1 and r[3]==0 and r[4]>0, r)
        r=await E("""()=>{const P=__t.player; P.fx.burn=0;P.fx.poison=0;P.hp=P.maxHp; __t.inflictStatus('burn',3000,20); __t.inflictStatus('poison',3000,20); const h=P.hp; for(let i=0;i<100;i++) __t.statusTick(0.016); const h2=P.hp; for(let i=0;i<200;i++) __t.statusTick(0.016); return [h,h2,P.hp,P.fx.burn,P.fx.poison]}""")
        chk('burn+poison tick and expire', r[1]<r[0] and r[2]<r[1]+1 and r[3]==0 and r[4]==0, r)
        r=await E("""()=>{const P=__t.player; P.buff.guard=5000; const a=__t.inflictStatus('burn',3000,20); P.buff.guard=0; return a}""")
        chk('guard immune', r is False, r)
        # swim
        r=await E("""()=>{const L=__t.loc; for(let y=2;y<L.height-2;y++) for(let x=3;x<L.width-4;x++) if(L.grid[y][x]!=='~'&&L.grid[y][x]!=='#'&&L.grid[y][x+1]==='~'&&L.grid[y][x+2]==='~'&&L.grid[y][x+3]==='~'&&L.grid[y][x]==='.') return [x,y]; return null}""")
        print('shore',r)
        if r:
            res=await E("""(w)=>{const P=__t.player,L=__t.loc; const run=()=>{P.x=w[0]*32+4;P.y=w[1]*32+8; __t.keys['KeyD']=true; for(let i=0;i<40;i++) __t.update(0.016); __t.keys['KeyD']=false; return P.x-(w[0]*32+4)};
              P.buff.swim=0; const d1=run(); P.x=w[0]*32+4;
              P.elix.swim=1; __t.useElixir('swim'); const d2=run(); const tx=Math.floor((P.x+P.w/2)/32); const inW=L.grid[Math.floor((P.y+P.h/2)/32)][tx]==='~';
              P.buff.swim=0; __t.rescuePlayer(); const blocked3=__t.isBlocked(L,P.x,P.y,P.w,P.h);
              return [d1,d2,inW,blocked3]}""", r)
            chk('swim: stopped w/o potion, enters water with, rescued after', res[0]<40 and res[1]>res[0]+10 and res[2] and not res[3], res)
        # enemies codex + draw
        r=await E("()=>Object.keys(__t.ENEMY_BASE).filter(k=>k!=='goblin'&&!__t.ENEMY_INFO[k])"); chk('codex entries all',r==[],r)
        r=await E("""()=>{const out=[];for(const k of ['frostmite','cinderhound','pyromancer','blizzardmage','venomtoad']){const e=__t.makeEnemy(k,100,100,1); out.push(!!e && e.hp>0);} return out}""")
        chk('new enemies make', all(r), r)
        # lava / water entrance worlds
        r=await E("""()=>{let bad=0,badE=0; for(let i=0;i<12;i++){ const L=__t.genLoc('lava'); const sx=Math.floor((L.spawn.x+12)/32), sy=Math.floor((L.spawn.y+12)/32);
            for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) if(L.grid[sy+dy][sx+dx]==='L') bad++; }
          return bad}""")
        chk('lava spawn clear x12', r==0, r)
        r=await E("""()=>{let bad=0; for(let i=0;i<8;i++){ __t.beginNewGame(); const O=__t.world.overworld; const en=O.entrances.find(e=>e.dungeon==='lair1')||O.entrances[0];
           const t=O.grid[en.ty+1]&&O.grid[en.ty+1][en.tx]; const c=O.grid[en.ty][en.tx]; if(c==='~'||t==='~') bad++; if(__t.floodFrom){ } } return bad}""")
        chk('entrance not in water x8', r==0, r)
        # events
        r=await E("""()=>{__t.beginNewGame&&0; const out={}; for(const k of Object.keys(__t.EVENT_TABLE)) out[k]=__t.EVENT_TABLE[k].map(e=>e[0]); return out}""")
        print(r)
        # boots
        await E("()=>{__t.goTo('desert', __t.world.desert.spawn.x, __t.world.desert.spawn.y,'t'); __t.loc.enemies.length=0}")
        r=await E("""()=>{const P=__t.player; P.gold=2000; P.boots=false; const s0=__t.spdNow(); P.boots=true; const s1=__t.spdNow(); P.boots=false;
            const tabsNo=(__t.shopTabsNow().map(t=>t[0])); __t.shopMode='caravan'; const tabsC=__t.shopTabsNow().map(t=>t[0]); __t.shopMode=null; return [s1/s0,tabsNo,tabsC]}""")
        chk('boots speed x1.18, tabs only in caravan', abs(r[0]-1.18)<0.01 and 'boots' not in r[1] and 'boots' in r[2], r)
        r=await E("""()=>{const P=__t.player; P.boots=true; __t.saveGame(); P.boots=false; __t.loadGame(); return P.boots}""")
        chk('boots saved/loaded', r is True, r)
        # hordes in each location
        r=await E("""()=>{const res={}; for(const [id,list] of Object.entries(__t.EVENT_TABLE)){ const L=__t.world[id]; if(!L){res[id]='noloc';continue} __t.goTo(id,L.spawn.x,L.spawn.y,'t'); L.enemies.length=0; { const cx=Math.floor(L.width/2), cy=Math.floor(L.height/2); let f=null; for(let rr=0;rr<30&&!f;rr++) for(let dy=-rr;dy<=rr&&!f;dy++) for(let dx=-rr;dx<=rr;dx++){ const X=cx+dx,Y=cy+dy; if(L.grid[Y]&&L.grid[Y][X]==='.'&&!__t.isBlocked(L,X*32+4,Y*32+4,24,24)){f=[X,Y];break} } if(f){__t.player.x=f[0]*32+4;__t.player.y=f[1]*32+4} } for(const [k] of list){ if(!__t.HORDES[k]) continue; __t.ev.ambush=null; L.enemies.length=0; const ok=__t.spawnHorde(k); res[id+':'+k]=ok?L.enemies.length:0 } } return res}""")
        print(r)
        chk('hordes spawn (>=2) where possible', all((v>=2) for k,v in r.items() if ':' in k), {k:v for k,v in r.items() if ':' in k and v<2})
        chk('no page errors', not errs, errs[:3])
        await b.close()
    print('ALL OK' if ok else 'SOME FAIL')
asyncio.run(main())
