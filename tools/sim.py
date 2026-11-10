# Basit bir bot oynar. mode=ucuz: (piyasa fiyatı - net) x kalite hızı en yüksek ilanı alır. mode=sys: yalnızca sistem toptancısı.
import sys,json
from playwright.sync_api import sync_playwright
url='file://'+sys.argv[1]+'?sim'
JS='''(arg)=>{const [sd,mode]=arg;const k=__k,C=k.CONFIG;try{localStorage.clear()}catch(e){};k.seed(sd);k.newGame();const S=k.S;const res={lv:{},ev:[],dead:null};let lv=1;
const m=()=>+(S.t/60).toFixed(0);
for(let i=0;i<60*60*5;i++){k.step(1);if(S.dead){res.dead=m();break}
  if(S.level>lv){lv=S.level;res.lv[lv]=m()}
  if(i%5)continue;
  const stockVal=S.shops.reduce((s,sh)=>s+Object.values(sh.stock).reduce((a,x)=>a+x.q*x.cost,0),0);
  for(const t of C.types){if(!S.shops.some(s=>s.type==t.id)&&S.level>=t.level&&S.cash>=t.cost+1500){if(k.openShop(t.id))res.ev.push(t.id+"@"+m())}}
  for(const sh of S.shops){const c=k.upCost(sh);if(c!=null&&S.cash>=c+1500&&sh.shelves.every(x=>x)){if(k.upgrade(sh))res.ev.push(sh.type+"^"+sh.size+"@"+m())}}
  for(const sh of S.shops){const prods=k.T[sh.type].products.map(a=>a[0]);
    const best=pid=>{const L=k.allListings(pid);if(mode=='sys')return L[L.length-1];let b=null,bv=-1;for(const l of L){const v=(k.refPrice(pid)-k.net(l))*k.qualMult(l.q);if(v>bv){bv=v;b=l}}return b};
    const ranked=prods.map(pid=>({pid,l:best(pid)})).map(o=>({...o,v:(k.refPrice(o.pid)-k.net(o.l))*k.P[o.pid].rate})).sort((a,b)=>b.v-a.v);
    const onShelf=sh.shelves.filter(x=>x).map(x=>x.pid);const want=onShelf.concat(ranked.map(o=>o.pid).filter(p=>!onShelf.includes(p))).slice(0,sh.shelves.length);
    for(const pid of want){const st=sh.stock[pid];if(st.q<30){const l=best(pid);if(k.net(l)<k.refPrice(pid)*0.97){const budget=Math.floor(S.cash/want.length/k.net(l));k.buy(l,Math.min(budget,400))}}
      const sf=sh.shelves.find(s=>s&&s.pid==pid);if(sf)sf.price=Math.round(k.refPrice(pid)*20)/20}}
}
res.end={t:m(),cash:Math.round(S.cash),day:S.day,level:S.level,shops:S.shops.map(s=>s.type[0]+s.size).join(" ")};return res}'''
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page();pg.goto(url)
    for mode in ['ucuz','sys']:
        for sd in [11,222,3333]:
            print(mode,sd,json.dumps(pg.evaluate(JS,[sd,mode]),ensure_ascii=False))
    b.close()
