# Basit bir bot oyunu oynar: en iyi marjlı ilanı alır, rafı piyasa fiyatında tutar. Hedeflere kaç oyun dakikasında ulaştığını basar.
import sys,json
from playwright.sync_api import sync_playwright
url='file://'+sys.argv[1]+'?sim'
JS='''(arg)=>{const [sd,mode]=arg;const k=__k,C=k.CONFIG;try{localStorage.clear()}catch(e){};k.seed(sd);k.newGame();const S=k.S;const res={slot:[],shop2:null,dead:null,minCash:1e9};
for(let i=0;i<60*60*4;i++){ // 4 oyun saati, 1 sn adım
  k.step(1);if(S.dead){res.dead=S.t/60;break}
  res.minCash=Math.min(res.minCash,S.cash);
  if(i%5==0){
    if(S.slots<C.slotCosts.length&&S.cash>=C.slotCosts[S.slots]+800){S.cash-=C.slotCosts[S.slots];S.slots++;S.shelves.push(null);res.slot.push(+(S.t/60).toFixed(1))}
    if(S.slots>=C.slotCosts.length&&S.cash>=C.shop2Cost){res.shop2=+(S.t/60).toFixed(1);break}
    // her raf için: stok 40'ın altındaysa mal al
    const want=S.shelves.map(s=>s?s.pid:null);
    for(let si=0;si<S.slots;si++){let pid=want[si];
      if(!pid){ // boş raf: rafta olmayan en kârlı ürünü seç
        let best=null;for(const p of C.products){if(want.includes(p.id))continue;const l=mode=='sys'?k.allListings(p.id).slice(-1)[0]:k.allListings(p.id)[0];const v=(k.refPrice(p.id)-k.net(l))*p.rate;if(!best||v>best.v)best={v,pid:p.id}}
        pid=best.pid;want[si]=pid}
      if(S.stock[pid].q<40){const L=k.allListings(pid);const l=mode=='sys'?L[L.length-1]:L[0];
        if(k.net(l)<k.refPrice(pid)*0.97){const budget=Math.floor(S.cash/S.slots/k.net(l));k.buy(l,Math.min(budget,300))}}
      const sh=S.shelves.find(s=>s&&s.pid==pid);if(sh)sh.price=Math.round(k.refPrice(pid)*20)/20}
  }}
res.end={t:+(S.t/60).toFixed(0),cash:Math.round(S.cash),day:S.day,slots:S.slots};return res}'''
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page();pg.goto(url)
    for mode in ['ucuz','sys']:
        for sd in [11,222,3333,44444]:
            print(mode,sd,json.dumps(pg.evaluate(JS,[sd,mode])))
    b.close()
