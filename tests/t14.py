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
        # --- паук
        r=await E("""()=>{ const e=__t.makeEnemy('webspider',100,100,2); return [e.type,e.shoot.kind,Math.round(e.hp)] }""")
        chk('webspider created',r[0]=='webspider' and r[1]=='web',r)
        r=await E("""()=>{ const P=__t.player; __t.setLoc('overworld'); __t.loc.enemies.length=0; for(let yy=14;yy<=17;yy++) for(let xx=14;xx<=17;xx++) __t.loc.grid[yy][xx]='.'; P.x=500;P.y=500;P.invuln=0;P.shield=0;P.dashT=0;P.slowT=0; const base=__t.spdNow();
            __t.eshots.length=0; __t.eshots.push({x:P.x+10,y:P.y+10,vx:0,vy:0,kind:'web',dmg:10,life:1000}); __t.update(0.016);
            const s1=P.slowT, sp=__t.spdNow(); P.slowT=0; P.shield=2000; __t.eshots.push({x:P.x+10,y:P.y+10,vx:0,vy:0,kind:'web',dmg:10,life:1000}); P.invuln=0; __t.update(0.016); const s2=P.slowT; P.shield=0;
            return [base,sp,s1>2000,s2] }""")
        chk('web shot slows (x0.6) and shield blocks',r[2] and abs(r[1]/r[0]-0.6)<0.01 and r[3]==0,r)
        # --- эликсиры
        r=await E("""()=>{ const P=__t.player; __t.resetHero(); P.hp=20; P.maxHp=100; P.elix.big=2; P.elix.speed=1; P.elix.might=1; P.elix.guard=1; P.slowT=2000;
            const a=__t.useElixir('big'); const hp=P.hp; const base=P.speed; const d0=__t.playerDamage(); const i0=__t.incomingDamage(40);
            __t.useElixir('speed'); const sp=__t.spdNow()/P.speed; const sl=P.slowT; __t.useElixir('might'); const d1=__t.playerDamage(); __t.useElixir('guard'); const i1=__t.incomingDamage(40);
            return [a,hp,sp,sl,d1/d0,i1/i0,P.elix.big] }""")
        chk('big potion +80',r[0] and r[1]==100 and r[6]==1,r)
        chk('speed x1.4 clears slow, might +, guard 0.5',abs(r[2]-1.4)<0.01 and r[3]==0 and r[4]>1.3 and abs(r[5]-0.5)<0.1,r)
        r=await E("""()=>{ const P=__t.player; const before=P.buff.speed; for(let i=0;i<30;i++) __t.elixTick(1); return [before>0,P.buff.speed,P.buff.might,P.buff.guard] }""")
        chk('buffs expire',r[0] and r[1]==0 and r[2]==0 and r[3]==0,r)
        r=await E("""()=>{ const P=__t.player; __t.resetHero(); P.hp=P.maxHp; const a=__t.useElixir('big'); const b=__t.useElixir('might'); return [a,b] }""")
        chk('no use when none / full hp',r[0]==False and r[1]==False,r)
        # дроп и подбор
        r=await E("""()=>{ const P=__t.player; __t.resetHero(); __t.setLoc('overworld'); const L=__t.loc; let n=0; for(let i=0;i<400;i++){ const before=L.items.length; __t.maybeDropElixir({type:'wolf',x:100,y:100,w:20,h:20}); if(L.items.length>before) n++; }
            L.items=L.items.filter(i=>i.type!=='elixir'); __t.maybeDropElixir({type:'boss',x:100,y:100,w:20,h:20}); const bossDrop=L.items.some(i=>i.type==='elixir');
            L.items.push({type:'elixir',kind:'guard',x:P.x,y:P.y,w:16,h:16,value:1}); __t.update(0.016); return [n,bossDrop,P.elix.guard] }""")
        chk('elixir drops ~4.5% and boss drops; pickup',5<r[0]<40 and r[1] and r[2]==1,r)
        # покупка
        r=await E("""()=>{ const P=__t.player; __t.resetHero(); P.gold=500; __t.setLoc('overworld'); __t.setShopTab('elixirs'); __t.openShop(''); const btns=[...document.querySelectorAll('#shopList .shopBtn')]; const buy=btns.find(b=>/Купить/.test(b.textContent)); const price=buy.textContent;
            buy.click(); const after=[P.gold,P.elix.speed]; const tabs=[...document.querySelectorAll('#shopTabs .tabBtn')].map(t=>t.textContent).join('|'); __t.closeShop(); return [price,after,tabs] }""")
        chk('shop elixir buy',r[1][1]==1 and r[1][0]==455 and 'Зелья' in r[2],r)
        # сохранение
        r=await E("""()=>{ const P=__t.player; P.elix.speed=3; __t.saveGame(); P.elix.speed=0; const ok=__t.loadGame(); return [ok,P.elix.speed,P.slowT,P.buff.speed] }""")
        chk('elixirs saved/loaded',r[0] and r[1]==3 and r[2]==0,r)
        # --- город
        r=await E("""()=>{ const ow=__t.world.overworld; const g=ow.entrances.find(e=>e.dungeon==='town'); const e1=ow.entrances[0]; const cx=56,cy=56;
            const seen=__t.floodFrom(ow.grid,cx,cy,'~^#SB'); return [!!g, g&&Math.hypot(g.tx-e1.tx,g.ty-e1.ty), g&&seen[g.tx+(g.ty+1)*112], g&&ow.grid[g.ty][g.tx], !!__t.world.town,!!__t.world.house1,!!__t.world.house2] }""")
        chk('town gate on overworld reachable/far',r[0] and r[1]>=16 and r[2]==1 and r[3]=='>' and r[4] and r[5] and r[6],r)
        r=await E("""()=>{ let bad=0; for(let i=0;i<40;i++){ __t.resetGame(); const ow=__t.world.overworld; const g=ow.entrances.find(e=>e.dungeon==='town'); const seen=__t.floodFrom(ow.grid,56,56,'~^#SB'); if(!g||!seen[g.tx+(g.ty+1)*112]) bad++; const sh=ow.shop; if(Math.hypot(g.tx-sh.tx,g.ty-sh.ty)<12) bad++; } return bad}""")
        chk('gate reachable (40 worlds)',r==0,r)
        r=await E("""()=>{ __t.beginNewGame(); const w=__t.world, T=32, ow=w.overworld; const g=ow.entrances.find(e=>e.dungeon==='town'); __t.goTo('overworld',g.tx*T+5,g.ty*T+5,''); __t.transitionCooldown=0; __t.player.invuln=1e9; __t.update(0.016); const a=__t.locId;
            const town=w.town; const L=town; const D=__t.bfsDist; __t.setLoc('town'); const dist=__t.bfsDist(Math.floor((__t.player.x+11)/T),Math.floor((__t.player.y+11)/T),9999);
            const reach=(tx,ty)=>dist[ty*L.width+tx]; 
            const info={exit:reach(L.exit.tx,L.exit.ty), doors:L.doors.map(d=>reach(d.tx,d.ty)), market:reach(L.shop.tx,L.shop.ty+2)};
            return [a,info,__t.getLocName(L)] }""")
        chk('enter town; exit/doors/market reachable',r[0]=='town' and r[1]['exit']>0 and all(x>0 for x in r[1]['doors']) and r[1]['market']>0,r)
        r=await E("""()=>{ const w=__t.world,T=32; const d=w.town.doors[0]; __t.setLoc('town'); __t.player.x=d.tx*T+5; __t.player.y=d.ty*T+5; __t.transitionCooldown=0; __t.update(0.016); const a=__t.locId; const loc=__t.loc;
            const e=loc.exit; __t.player.x=e.tx*T+5; __t.player.y=e.ty*T+5; __t.transitionCooldown=0; __t.update(0.016); const b=__t.locId; const back=[__t.player.x/T,__t.player.y/T,d.tx,d.ty+1];
            const d2=w.town.doors[1]; __t.player.x=d2.tx*T+5; __t.player.y=d2.ty*T+5; __t.transitionCooldown=0; __t.update(0.016); const c=__t.locId;
            const e2=__t.loc.exit; __t.player.x=e2.tx*T+5; __t.player.y=e2.ty*T+5; __t.transitionCooldown=0; __t.update(0.016); const dd=__t.locId;
            const te=w.town.exit; __t.player.x=te.tx*T+5; __t.player.y=te.ty*T+5; __t.transitionCooldown=0; __t.update(0.016); const f=__t.locId;
            return [a,b,back,c,dd,f] }""")
        chk('doors in/out, town exit to overworld',r[0]=='house1' and r[1]=='town' and abs(r[2][0]-r[2][2])<0.5 and r[3]=='house2' and r[4]=='town' and r[5]=='overworld',r)
        # дом-трактир
        r=await E("""()=>{ const w=__t.world,T=32,P=__t.player; __t.goTo('house1',w.house1.spawn.x,w.house1.spawn.y,''); P.hp=40; P.invuln=1e9; const bed=w.house1.bed; P.x=bed.x+40; P.y=bed.y; __t.update(0.016); const hp=P.hp; const fade=__t.restFade>0;
            P.x=bed.x+40;P.y=bed.y; __t.bedLock=false; P.gold=0; const c=w.house1.chest; P.x=c.tx*T-10; P.y=c.ty*T+5; __t.update(0.016); return [hp,fade,c.opened,P.gold>=90,P.bag.length+Object.values(P.elix).reduce((a,b)=>a+b,0)] }""")
        chk('inn: bed heals, chest gives loot once',r[0]==100 and r[1] and r[2] and r[3] and r[4]>=1,r)
        r=await E("""()=>{ const w=__t.world,T=32,P=__t.player; const c=w.house1.chest; const g=P.gold; P.x=c.tx*T-10; P.y=c.ty*T+5; __t.update(0.016); return P.gold-g }""")
        chk('chest only once',r==0,r)
        # лавка алхимика
        r=await E("""()=>{ const w=__t.world,T=32,P=__t.player; __t.goTo('house2',w.house2.spawn.x,w.house2.spawn.y,''); P.gold=1000; P.elix.big=0; const m=w.house2.merchant; P.x=m.x; P.y=m.y+60; __t.update(0.016); const st=__t.state;
            const tabs=__t.shopTabsNow().map(t=>t[0]).join(','); const btns=[...document.querySelectorAll('#shopList .shopBtn')]; const buy=btns.find(b=>/Купить/.test(b.textContent)); const txt=buy.textContent; buy.click(); const spent=1000-P.gold; __t.closeShop(); return [st,tabs,txt,spent] }""")
        chk('alchemist opens with discount (45->36)',r[0]=='shop' and r[1]=='potions,elixirs' and r[3]==36,r)
        # безопасность: нет врагов и респауна
        r=await E("""()=>{ __t.setLoc('town'); __t.respawnTick(30); for(let i=0;i<40;i++) __t.respawnTick(1); return __t.loc.enemies.length }""")
        chk('town safe: no respawn',r==0,r)
        # жители
        r=await E("""()=>{ __t.goTo('town',__t.world.town.spawn.x,__t.world.town.spawn.y,''); for(let i=0;i<600;i++) __t.folkTick(0.05); const f=__t.folk; const T=32; let inWall=0; for(const x of f){ const tx=Math.floor((x.x+7)/T), ty=Math.floor((x.y+7)/T); if('#BS'.includes(__t.loc.grid[ty][tx])) inWall++; } return [f.length,inWall] }""")
        chk('citizens exist and not in walls',r[0]==6 and r[1]==0,r)
        # старое сохранение без города
        r=await E("""()=>{ __t.beginNewGame(); const w=__t.world; delete w.town; delete w.house1; delete w.house2; w.overworld.entrances=w.overworld.entrances.filter(e=>e.dungeon!=='town'); __t.saveGame(); const ok=__t.loadGame(); const W=__t.world; const g=W.overworld.entrances.find(e=>e.dungeon==='town'); const seen=__t.floodFrom(W.overworld.grid,56,56,'~^#SB');
            return [ok,!!W.town,!!W.house1,!!W.house2,!!g,g&&seen[g.tx+(g.ty+1)*112]] }""")
        chk('old save migrated with town',r[0] and r[1] and r[2] and r[3] and r[4] and r[5]==1,r)
        # сохранение в доме и загрузка
        r=await E("""()=>{ const W=__t.world; __t.goTo('house2',W.house2.spawn.x,W.house2.spawn.y,''); __t.saveToSlot(0); __t.goTo('overworld',500,500,''); const ok=__t.loadGame('eldoria_slot_1'); return [ok,__t.locId,__t.getLocName(__t.loc),__t.loc.merchant.look] }""")
        chk('save inside house reloads',r[0] and r[1]=='house2' and r[3]=='alch',r)
        # отрисовка без ошибок во всех локациях
        for loc_ in ['town','house1','house2','overworld']:
            await E("(id)=>{ const W=__t.world; if(id==='overworld'){__t.goTo('overworld',W.overworld.spawn.x,W.overworld.spawn.y,'')} else __t.goTo(id,W[id].spawn.x,W[id].spawn.y,''); __t.player.invuln=1e9; }",loc_)
            await pg.wait_for_timeout(500); await pg.screenshot(path=SC+'z_'+loc_+'.png')
        print('errors',errs[:5]); chk('no js errors',not errs)
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
