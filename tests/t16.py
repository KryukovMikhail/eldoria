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
        # интро через кнопку
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        r=await E("()=>[__t.gs, document.getElementById('dialogScreen').classList.contains('hidden'), document.getElementById('dlgTitle').textContent, document.getElementById('dlgBtn').textContent]")
        chk('intro dialog opens after start',r[0]=='dialog' and r[1]==False and r[3]=='Дальше',r)
        for i in range(2): await pg.click('#dlgBtn')
        r=await E("()=>document.getElementById('dlgBtn').textContent"); chk('last page button',r=='В путь!',r)
        await pg.click('#dlgBtn'); r=await E("()=>__t.gs"); chk('dialog closes -> playing',r=='playing',r)
        # тайники
        r=await E("""()=>{ const w=__t.world, T=32, bad=[]; const ids=['overworld',...__t.CHAIN.filter(i=>!__t.LAIR[i]),'secret1','secret2'];
          const info={}; for(const id of ids){ const L=w[id]; const ch=L.items.filter(i=>i.type==='chest'), keys=L.items.filter(i=>i.type==='key'), lk=ch.filter(c=>c.locked);
            const seen=__t.floodFrom(L.grid,Math.floor(L.spawn.x/T),Math.floor(L.spawn.y/T),L.type==='overworld'?'~^#SB':'#LSB');
            for(const it of [...ch,...keys]){ if(!seen[Math.floor((it.x+it.w/2)/T)+Math.floor((it.y+it.h/2)/T)*L.width]) bad.push(id+':unreachable '+it.type); }
            if(ch.length<2) bad.push(id+':few chests '+ch.length); if(lk.length!==keys.length || (id!=='secret1' && lk.length!==1)) bad.push(id+':lock/key '+lk.length+'/'+keys.length);
            info[id]=ch.length; }
          return [bad,info.overworld] }""")
        chk('every level has chests + 1 locked chest + 1 key, all reachable',r[0]==[] and r[1]==7,r)
        r=await E("""()=>{ const T=32,P=__t.player,ow=__t.world.overworld; const s1=ow.entrances.find(e=>e.dungeon==='secret1'); const out=[s1.hidden,s1.found];
            __t.goTo('overworld',(s1.tx-8)*T,(s1.ty+2)*T,''); P.invuln=1e9; P.hp=P.maxHp; __t.update(0.016); out.push(s1.found);
            __t.goTo('overworld',(s1.tx-9)*T,(s1.ty+2)*T,''); __t.transitionCooldown=0; P.x=s1.tx*T+5; P.y=s1.ty*T+5; // на скрытом входе, но не найден?
            return out }""")
        chk('hidden cave not found until near',r[0]==True and r[1]==False and r[2]==False,r)
        r=await E("""()=>{ const T=32,P=__t.player,ow=__t.world.overworld; const s1=ow.entrances.find(e=>e.dungeon==='secret1'); __t.goTo('overworld',(s1.tx)*T+5,(s1.ty+2)*T+5,''); __t.transitionCooldown=0; __t.update(0.016); const f=s1.found;
            P.x=s1.tx*T+5; P.y=s1.ty*T+5; __t.transitionCooldown=0; __t.update(0.016); const a=__t.locId;
            return [f,a, __t.gs] }""")
        chk('found near + enter secret1, sage dialog starts',r[0]==True and r[1]=='secret1',r)
        r=await E("""()=>{ const T=32,P=__t.player,L=__t.loc; P.x=L.sage.x+4; P.y=L.sage.y+40; __t.transitionCooldown=0; __t.update(0.016); return [__t.gs, document.getElementById('dlgTitle').textContent] }""")
        chk('sage dialog',r[0]=='dialog' and r[1]=='Мудрец Орбин',r)
        k0=await E("()=>[__t.player.vkeys,__t.player.elix.big]")
        for i in range(4):
            await pg.click('#dlgBtn')
        r=await E("()=>[__t.gs,__t.player.vkeys,__t.player.elix.big]"); chk('sage gives key + big elixir',r[0]=='playing' and r[1]==k0[0]+1 and r[2]==k0[1]+1,[k0,r])
        # сундуки
        r=await E("""()=>{ const T=32,P=__t.player,L=__t.loc; const c=L.items.find(i=>i.type==='chest'); const g0=P.gold; P.x=c.x; P.y=c.y; __t.update(0.016); return [c.open,P.gold>g0,L.items.length] }""")
        chk('free chest opens and gives gold',r[0]==True and r[1]==True,r)
        r=await E("""()=>{ const T=32,P=__t.player; __t.goTo('secret2',__t.world.secret2.spawn.x,__t.world.secret2.spawn.y,''); const L=__t.loc; L.enemies.forEach(e=>e.hp=0); P.invuln=1e9; P.vkeys=0; const c=L.items.find(i=>i.type==='chest'&&i.locked); P.x=c.x; P.y=c.y; __t.update(0.016); const a=c.open;
            P.vkeys=1; __t.update(0.016); const n=L.items.length; return [a,c.open,P.vkeys,n, L.items.filter(i=>i.type==='gear').length] }""")
        chk('locked chest needs key, key consumed, rare gear inside',r[0]==False and r[1]==True and r[2]==0 and r[4]>=1,r)
        r=await E("""()=>{ const P=__t.player,L=__t.loc; const k=L.items.find(i=>i.type==='key'); const v=P.vkeys; P.x=k.x; P.y=k.y; __t.update(0.016); return [P.vkeys-v, L.items.some(i=>i.type==='key')] }""")
        chk('key pickup',r[0]==1 and r[1]==False,r)
        # сохранение
        r=await E("""()=>{ const P=__t.player; P.vkeys=3; const L=__t.world.secret2; __t.saveGame(); const k=__t.latestSaveKey(); P.vkeys=0; __t.loadGame(k); const L2=__t.world.secret2; return [__t.player.vkeys, L2.items.filter(i=>i.type==='chest'&&i.open).length, __t.world.overworld.entrances.find(e=>e.dungeon==='secret1').found] }""")
        chk('save keeps keys, opened chests, found cave',r[0]==3 and r[1]>=1 and r[2]==True,r)
        # выход из тайника
        r=await E("""()=>{ const T=32,P=__t.player; __t.goTo('secret1',__t.world.secret1.spawn.x,__t.world.secret1.spawn.y,''); const e=__t.loc.exit; P.x=e.tx*T+5; P.y=e.ty*T+5; __t.transitionCooldown=0; __t.update(0.016); return __t.locId }""")
        chk('exit secret -> overworld',r=='overworld',r)
        # цель и реплики
        r=await E("""()=>{ const a=__t.goalText(), s0=__t.storyStage(); const L=__t.world.lair1; L.boss.hp=0; __t.goTo('lair1',L.spawn.x,L.spawn.y,''); __t.killEnemy(L.boss); return [a,s0,__t.storyStage(),__t.goalText()] }""")
        chk('goal text follows story stage',r[0]=='Цель: Логово Мортракса' and r[1]==0 and r[2]==1 and 'Шелибы' in r[3],r)
        r=await E("""()=>{ __t.goTo('overworld',__t.world.overworld.spawn.x,__t.world.overworld.spawn.y,''); __t.player.invuln=1e9; __t.openShop(); const m=document.getElementById('shopMsg')?document.getElementById('shopMsg').textContent:''; const t=document.body.innerText.includes('Торговец: «'); __t.closeShop(); return t }""")
        chk('merchant says story tip',r==True,r)
        r=await E("""()=>{ const w=__t.world.lair2; __t.goTo('lair2',w.spawn.x,w.spawn.y,''); return __t.notes.map(n=>n.text).join('|') }""")
        chk('boss taunt on lair entry',('Шелиба' in r),r)
        # мини-события
        r=await E("""()=>{ __t.goTo('overworld',__t.world.overworld.spawn.x,__t.world.overworld.spawn.y,''); const P=__t.player; P.invuln=1e9; P.hp=P.maxHp=500; __t.loc.enemies.length=0; const ok=__t.spawnAmbush(); const n=__t.loc.enemies.filter(e=>e.ambush).length; const g0=P.gold;
            __t.loc.enemies.filter(e=>e.ambush).forEach(e=>{ e.hp=0; }); __t.update(0.016); return [ok,n,P.gold>g0,__t.ev.ambush] }""")
        chk('ambush spawns and rewards when cleared',r[0]==True and r[1]>=3 and r[2]==True and r[3]==None,r)
        r=await E("""()=>{ const P=__t.player; __t.ev.npcs.length=0; __t.ev.npcs.push({kind:'healer',loc:__t.locId,x:P.x+10,y:P.y+4,w:28,h:28,ttl:100000,used:false}); P.hp=10; __t.update(0.016); return [P.hp===P.maxHp, __t.ev.npcs[0].used] }""")
        chk('wandering healer heals',r[0]==True and r[1]==True,r)
        r=await E("""()=>{ const P=__t.player; __t.ev.npcs.length=0; __t.ev.npcs.push({kind:'caravan',loc:__t.locId,x:P.x+10,y:P.y+4,w:28,h:28,ttl:100000,used:false}); __t.update(0.016); const st=__t.gs, kind=__t.shopKind(), tabs=__t.shopTabsNow().map(t=>t[0]).join(','); const price=document.querySelector('#shopList .shopBtn').textContent; __t.closeShop(); __t.update(0.016); return [st,kind,tabs,price,__t.gs] }""")
        chk('caravan opens discount shop, no reopen right after',r[0]=='shop' and r[1]=='caravan' and r[2]=='boots,potions,elixirs' and r[4]=='playing',r)
        r=await E("""()=>{ __t.ev.npcs.length=0; __t.ev.timer=0; let seen=0; for(let i=0;i<40;i++){ __t.ev.npcs.length=0; __t.ev.ambush=null; __t.ev.timer=0; __t.update(0.016); if(__t.ev.npcs.length||__t.ev.ambush) seen++; } return seen }""")
        chk('events actually spawn over time',r>=10,r)
        # старое сохранение без тайников
        r=await E("""()=>{ __t.beginNewGame(); __t.saveGame(); const k=__t.latestSaveKey(); const d=JSON.parse(localStorage.getItem(k)); delete d.world.secret1; delete d.world.secret2; d.world.overworld.entrances=d.world.overworld.entrances.filter(e=>!e.dungeon.startsWith('secret')); d.world.overworld.items=d.world.overworld.items.filter(i=>i.type!=='chest'&&i.type!=='key'); delete d.world.overworld.secrets; localStorage.setItem(k,JSON.stringify(d)); const ok=__t.loadGame(k); const w=__t.world; return [ok,!!w.secret1&&!!w.secret2,w.overworld.entrances.filter(e=>e.hidden).length,w.overworld.items.filter(i=>i.type==='chest').length] }""")
        chk('older save gets secrets added',r==[True,True,4,7],r)
        chk('no page errors',errs==[],errs[:5])
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
