import sys,json
from playwright.sync_api import sync_playwright
url='file://'+sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for trial in range(6):
        pg=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.goto(url);pg.evaluate('()=>{try{localStorage.clear()}catch(e){}}');pg.reload();pg.wait_for_timeout(300)
        pg.evaluate('()=>{const S=__k.S;S.cash=40000;S.xp=20000}');pg.wait_for_timeout(700)
        pg.click('[data-a=openshop]');pg.wait_for_timeout(300);pg.click('.lst >> nth=0');pg.wait_for_timeout(200)
        has=pg.evaluate('()=>!!document.getElementById("sbuy")')
        if has: pg.click('#sbuy')
        pg.wait_for_timeout(300)
        print(trial,has,pg.evaluate('()=>({tab:__k.S.tab,cur:__k.S.cur,up:!!document.querySelector("[data-a=upgrade]"),sheet:document.getElementById("sheetbg").className,main:document.getElementById("main").innerText.slice(0,60)})'),errs)
        pg.close()
    b.close()
