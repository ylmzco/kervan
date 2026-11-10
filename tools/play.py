import sys,json
from playwright.sync_api import sync_playwright
url=sys.argv[1]; out=sys.argv[2]
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(400); pg.screenshot(path=out+'/1-ilk.png')
    pg.click('text=Pazara git'); pg.wait_for_timeout(200); pg.screenshot(path=out+'/2-pazar.png')
    pg.click('.lst >> nth=0'); pg.wait_for_timeout(200); pg.screenshot(path=out+'/3-al.png')
    pg.click('[data-a=qk][data-v="1"]'); pg.click('#sbuy'); pg.wait_for_timeout(300)
    pg.click('#spd'); pg.click('#spd'); pg.wait_for_timeout(6000)
    pg.click('[data-a=price][data-v="1"]'); pg.wait_for_timeout(300); pg.screenshot(path=out+'/4-dukkan.png')
    pg.click('[data-a=settings]'); pg.wait_for_timeout(200); pg.screenshot(path=out+'/5-ayar.png'); pg.click('[data-a=close]')
    pg.click('#t-market'); pg.wait_for_timeout(200); pg.screenshot(path=out+'/6-pazar2.png'); pg.evaluate('()=>{const S=__k.S;S.cash=40000;S.xp=20000;S.speed=1}'); pg.wait_for_timeout(600); pg.click('#t-home'); pg.wait_for_timeout(300); pg.click('[data-a=openshop]'); pg.wait_for_timeout(300); pg.click('.lst >> nth=0'); pg.click('#sbuy'); pg.wait_for_timeout(300); pg.click('[data-a=upgrade]'); pg.wait_for_timeout(300); pg.screenshot(path=out+'/7-manav.png'); pg.click('#t-home'); pg.wait_for_timeout(400); pg.click('[data-a=bank]'); pg.wait_for_timeout(200); pg.screenshot(path=out+'/9-banka.png'); pg.click('[data-a=borrow]'); pg.wait_for_timeout(200); pg.click('#sheet [data-a=close]'); pg.wait_for_timeout(300); pg.click('[data-a=tax]'); pg.wait_for_timeout(200); pg.screenshot(path=out+'/10-vergi.png'); pg.click('#sheet [data-a=close]'); pg.wait_for_timeout(1200); pg.screenshot(path=out+'/8-ana.png',full_page=False); pg.click('#t-shop'); pg.wait_for_timeout(300); pg.click('[data-a=sellback] >> nth=0'); pg.wait_for_timeout(200); pg.screenshot(path=out+'/11-gerisat.png'); pg.click('[data-a=dosell]'); pg.wait_for_timeout(300)
    info=pg.evaluate('''()=>{const S=__k.S;const over=[...document.querySelectorAll("#app *")].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>391||r.left<-1)&&!e.closest(".prods")}).length;
      const small=[...document.querySelectorAll("#app *")].filter(e=>e.children.length==0&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<11).length;
      return {cash:S.cash,day:S.day,level:S.level,shops:S.shops.map(s=>s.type+s.size+':'+s.shelves.length),over,small,sw:document.documentElement.scrollWidth}}''')
    print(json.dumps(info,ensure_ascii=False)); print('ERRORS',errs); b.close()
