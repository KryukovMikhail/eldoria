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
        r=await E("()=>[__t.CHAIN.length, __t.CHAIN.every(id=>__t.world[id]), __t.world.overworld.entrances.map(e=>e.dungeon).join(','), !!__t.world.town, !__t.world.dungeon2]")
        chk('world has 19 chain locations, entrance->lair1',r==[19,True,'lair1,town,secret1,secret2,deep,sky',True,True],r)
        r=await E("""()=>{ const exp={lair1:'boss',lair2:'spiderqueen',lair3:'shadowlord',lair4:'lavalord',lair5:'pharaoh',lair6:'frostking',lair7:'lich',lair8:'treant',lair9:'warlord',lair10:'phantom'}; const bad=[];
          for(const id of __t.CHAIN){ const L=__t.world[id]; const bs=L.enemies.filter(e=>__t.BOSS_TYPES.includes(e.type)).map(e=>e.type);
            if(exp[id]){ if(bs.join()!==exp[id]||!L.boss||L.boss.type!==exp[id]) bad.push(id+':boss '+bs); } else if(bs.length) bad.push(id+':unexpected boss');
            if(id==='lair10'){ if(L.portal) bad.push('lair10 portal'); } else { if(!L.portal) bad.push(id+':noportal'); else { const ch=L.grid[L.portal.ty][L.portal.tx]; if(exp[id]&&ch==='v') bad.push(id+':open at start'); if(!exp[id]&&ch!=='v') bad.push(id+':closed'); } } }
          return bad }""")
        chk('bosses only in lairs, portals open in levels/closed in lairs',r==[],r)
        r=await E("""()=>{ const bad=[]; const reach=(id)=>{ const L=__t.world[id]; const seen=__t.floodFrom(L.grid,L.exit.tx,L.exit.ty+1,['#','L']); const W=L.width;
              const okp=(x,y)=>seen[x+y*W]===1; if(!okp(L.spawn.x/32|0, L.spawn.y/32|0)) bad.push(id+':spawn'); if(L.portal){ if(!okp(L.portal.tx,L.portal.ty)||!okp(L.portal.tx,L.portal.ty+1)) bad.push(id+':portal unreachable'); }
              for(const e of L.enemies) if(!okp(Math.floor((e.x+e.w/2)/32),Math.floor((e.y+e.h/2)/32))) bad.push(id+':enemy '+e.type); };
            for(const id of __t.CHAIN) reach(id);
            for(let i=0;i<8;i++){ for(const [id,f] of [['city',()=>__t.generateField(11,'city')],['manor',()=>__t.generateDungeon(12)],['d3',()=>__t.generateDungeon(3)],['lava',()=>__t.generateDungeon(4)],['desert',()=>__t.generateField(5,'desert')]]){ __t.world['_x']=f(); const L=__t.world['_x']; const seen=__t.floodFrom(L.grid,L.exit.tx,L.exit.ty+1,['#','L']); if(seen[L.portal.tx+L.portal.ty*L.width]!==1||seen[L.portal.tx+(L.portal.ty+1)*L.width]!==1) bad.push(id+' unreachable portal #'+i); } }
            delete __t.world['_x']; return bad }""")
        chk('everything reachable (spawn, enemies, portals), 8x regen',r==[],r)
        # проход по всей цепочке
        r=await E("""()=>{ const T=32, log=[]; const w=__t.world; __t.player.invuln=1e9; __t.player.hp=__t.player.maxHp=1e9;
            const step=(x,y)=>{ __t.player.x=x; __t.player.y=y; __t.transitionCooldown=0; __t.update(0.016); };
            const en=w.overworld.entrances[0]; __t.goTo('overworld',en.tx*T+5,en.ty*T+5,''); step(en.tx*T+5,en.ty*T+5); log.push(__t.locId);
            for(let i=0;i<__t.CHAIN.length;i++){
              const id=__t.CHAIN[i]; if(__t.locId!==id){ log.push('STUCK@'+id+' at '+__t.locId); break; }
              const L=__t.loc;
              if(L.boss){ const bb=__t.loc.enemies.find(e=>__t.BOSS_TYPES.includes(e.type)); bb.hp=0; __t.killEnemy(bb); }
              if(id==='lair10'){ const t=L.items.find(it=>it.type==='treasure'); log.push('treasure:'+!!t); if(t){ __t.player.x=t.x; __t.player.y=t.y; __t.update(0.016); log.push(__t.state);} break; }
              if(!L.portal.open) { log.push('PORTAL CLOSED '+id); break; }
              // назад и снова вперёд
              if(i>0){ step(L.exit.tx*T+5,L.exit.ty*T+5); const back=__t.locId, pp=__t.loc.portal; const near=Math.hypot(__t.player.x-pp.tx*T,__t.player.y-(pp.ty+1)*T)<20; log.push('back:'+back+(near?'+':'-')); if(back!==__t.CHAIN[i-1]) break;
                step(pp.tx*T+5,pp.ty*T+5); if(__t.locId!==id){ log.push('re-enter failed '+__t.locId); break; } }
              step(L.portal.tx*T+5,L.portal.ty*T+5); log.push(__t.locId);
            }
            return log }""")
        print(r)
        exp_len=1+1+9*3  # approx
        chk('chain walk ends with won',r[-1]=='won' and r[-2]=='treasure:true' and not any('STUCK' in str(x) or 'CLOSED' in str(x) or 'failed' in str(x) or x.endswith('-') for x in r),r[-4:])
        # миграция старого сохранения
        await pg.evaluate("()=>{__t.beginNewGame()}"); await pg.wait_for_timeout(200)
        r=await E("""()=>{ __t.player.level=7; __t.player.gold=777; __t.goTo('dungeon3',100,100,''); __t.saveGame(); const k=__t.latestSaveKey(); const d=JSON.parse(localStorage.getItem(k));
            for(const id of Object.keys(d.world)) if(!['overworld','town','house1','house2','dungeon1','dungeon3','lava','desert','ice','grave','jungle'].includes(id)) delete d.world[id];
            d.world.dungeon2=d.world.dungeon1; delete d.world.lair1; d.world.overworld.entrances.forEach(e=>{ if(e.dungeon==='lair1') e.dungeon='dungeon1'; });
            localStorage.setItem(k,JSON.stringify(d)); const res=__t.loadGame(k);
            return [res,__t.locId,__t.player.level,__t.player.gold,!!__t.world.lair1&&!!__t.world.city&&!!__t.world.manor&&!__t.world.dungeon2,__t.world.overworld.entrances.map(e=>e.dungeon).join(','), Math.round(__t.player.x/32)+','+Math.round(__t.player.y/32)] }""")
        chk('legacy save migrates: hero kept, back on surface',r[0]==True and r[1]=='overworld' and r[2]==7 and r[3]==777 and r[4]==True and r[5]=='lair1,town,secret1,secret2,deep,sky',r)
        # сохранение/загрузка нового мира с лairами
        r=await E("""()=>{ __t.goTo('lair5',100,100,''); __t.saveGame(); const k=__t.latestSaveKey(); const ok=__t.loadGame(k); return [ok,__t.locId,!!__t.loc.boss,__t.loc.boss&&__t.loc.boss.type,__t.loc.title] }""")
        chk('new save round-trip in lair (boss restored)',r[0]==True and r[1]=='lair5' and r[3]=='pharaoh' and r[4]=='Логово Хар-Атепа',r)
        chk('no page errors',errs==[],errs[:5])
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
