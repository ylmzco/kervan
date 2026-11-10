// @ts-nocheck
// Arayüz katmanı. Prototipten olduğu gibi taşındı; tip denetimi henüz kapalı (bkz. CLAUDE.md, "Bilinen borç").
import {CONFIG} from "./data/config";
import {TYPES} from "./data/shops";
import {tl,clamp} from "./format";
import {S,P,T,PIDS,roundP,sysPrice,refPrice,ship,net,sysListing,allListings,shopOf,depotUsed,depotCap,qualMult,shelfRate,shopProfit,profitPerMin,shopRent,upCost,xpNeed,maxBuy,buy,upgrade,openShop,loanLimit,borrow,repay,step,newGame,setOnEv,snapshot,restore,interestRate,taxFor,dayProfit,rentTotal,sellBack,sellBackPrice,dayProfitEstimate,shopOffers,offerFair,offerRateAt,offerSlots,createOffer,cancelOffer} from "./engine";

/* ---- Arayüz ---- */
const $=id=>document.getElementById(id);
let dirty=true,pend={},sheetL=null,sheetQ=0,toastT;
const cur=()=>S.shops[S.cur];
function toast(m){const t=$("toast"),up=$("sheetbg").classList.contains("on");t.style.top=up?"104px":"auto";t.style.bottom=up?"auto":"66px";t.textContent=m;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),2600)}
setOnEv((k,d)=>{
  if(k==="sale"){const p=pend[d.pid]||(pend[d.pid]={n:0,r:0,si:d.si,pid:d.pid});p.n+=d.n;p.r+=d.r}
  else if(k==="offerSale"){const p=pend["o_"+d.pid]||(pend["o_"+d.pid]={n:0,r:0,si:d.si,pid:d.pid,o:1});p.n+=d.n;p.r+=d.r}
  else if(k==="offerDone"){toast(P[d.pid].ad+" ilanın tükendi.");dirty=true}
  else if(k==="market"){const s=S.market.state;toast("Piyasa güncellendi: "+CONFIG.states[s].ad+(s==="canli"?". Fiyatlar yükseldi.":s==="kotu"?". Fiyatlar düştü.":"."));dirty=true}
  else if(k==="listings"){if(S.tab==="market"&&!sheetL)dirty=true}
  else if(k==="empty"){toast(P[d.pid].ad+" bitti. Raf boş.");dirty=true}
  else if(k==="level"){toast(S.level+". seviye oldun. "+reward(S.level));dirty=true}
  else if(k==="day"){S.feed.unshift({t:d.day+". gün kapandı: "+d.sold+" satış; kira"+(d.interest>0?", faiz":"")+(d.tax>0?", vergi":""),v:-d.total,si:-1});dirty=true}
  else if(k==="dead"){openEnd()}
});
function flushFeed(){let ch=false;for(const id in pend){const p=pend[id];S.feed.unshift({t:(p.o?"Pazar: ":"")+p.n+" × "+P[p.pid].ad,v:p.r,nw:1,si:p.si});ch=true}pend={};if(S.feed.length>40)S.feed.length=40;
  if(ch&&S.tab==="shop"){const f=$("feed");if(f)f.innerHTML=feedHtml()}S.feed.forEach(x=>x.nw=0)}
const feedHtml=()=>{const F=S.feed.filter(x=>x.si===S.cur||x.si===-1).slice(0,10);return F.length?F.map(x=>`<div class="${x.nw?"new":""}"><span>${x.t}</span><b class="num ${x.v<0?"dn":"up"}">${x.v<0?"−":"+"}${tl(Math.abs(x.v))} TL</b></div>`).join(""):`<div><span class="sub">Henüz satış yok.</span></div>`};
function qTag(q){return `<span class="tag q ${q>=70?"hi":""}">%${Math.round(q)} kalite</span>`}
function spark(id){const h=S.market.hist[id];if(h.length<2)return"";const mn=Math.min(...h),mx=Math.max(...h),w=300,H=38;
  const pts=h.map((v,i)=>(i/(h.length-1)*w).toFixed(1)+","+(H-4-(mx===mn?.5:(v-mn)/(mx-mn))*(H-8)).toFixed(1)).join(" ");
  return `<svg class="sp" viewBox="0 0 ${w} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#17794a" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`}
function reward(n){const a=TYPES.filter(t=>t.level===n).map(t=>t.ad+" açılabilir"),b=PIDS.filter(id=>P[id].lvl===n&&n>T[P[id].type].level).map(id=>T[P[id].type].ad+": "+P[id].ad);return a.concat(b.length?["yeni ürün: "+b.join(", ")]:[]).join(" · ")}
const shopChips=()=>S.shops.length<2?"":`<div class="prods">`+S.shops.map((sh,i)=>`<button class="${i===S.cur?"on":""}" data-a="shopsel" data-v="${i}"><b>${T[sh.type].ad}</b><span>${CONFIG.sizes[sh.size].ad}</span></button>`).join("")+`</div>`;
const costBtn=(a,c,extra,dis)=>`<button class="btn" data-a="${a}" ${extra||""} data-cost="${c}" ${S.cash<c||dis?"disabled":""}>${tl(c,0)} TL</button>`;
function renderHome(){
  const nx=xpNeed(S.level+1),pv=xpNeed(S.level),nu=reward(S.level+1);
  let h=`<div class="card lvl"><div class="row"><div><div class="lbl">Seviye</div><b class="big num">${S.level}</b></div><div style="text-align:right"><div class="sub num" id="xpT">Sonraki seviyeye ${tl(Math.max(0,nx-S.xp),0)} TL ciro</div>${nu?`<div class="sub">${S.level+1}. seviyede: ${nu}</div>`:""}</div></div><div class="depo"><i id="xpB" data-a0="${pv}" data-a1="${nx}" style="width:${clamp((S.xp-pv)/(nx-pv)*100,0,100)}%"></i></div></div>`;
  if(S.first)h+=`<div class="card hint"><b>Rafların boş.</b><div class="sub" style="color:inherit;margin:4px 0 12px">Pazardan mal al. Aldığın mal anında depoya girer ve satılmaya başlar.</div><button class="btn full" data-a="tab" data-v="market">Pazara git</button></div>`;
  else{let al="";S.shops.forEach((sh,i)=>{sh.shelves.forEach(sf=>{if(sf&&sh.stock[sf.pid].q<=0)al+=`<div class="al"><span><b>${T[sh.type].ad}:</b> ${P[sf.pid].ad} bitti</span><button class="btn sm g" data-a="goto" data-v="${sf.pid}">Mal al</button></div>`});
      const e=sh.shelves.filter(x=>!x).length;if(e)al+=`<div class="al"><span><b>${T[sh.type].ad}:</b> ${e} raf boş</span><button class="btn sm ghost" data-a="gomarket" data-v="${i}">Pazar</button></div>`});
    if(S.debt>loanLimit())al+=`<div class="al"><span><b>Banka:</b> borcun kredi limitinin üstünde</span><button class="btn sm ghost" data-a="bank">Banka</button></div>`;
    if(al)h+=`<div class="card"><h2 style="margin-bottom:4px">Bekleyen işler</h2>${al}</div>`}
  h+=`<h3>Dükkânlarım</h3>`;
  S.shops.forEach((sh,i)=>{const u=depotUsed(sh),pr=shopProfit(sh);h+=`<button class="lst" data-a="shopgo" data-v="${i}"><div class="row"><div><b>${T[sh.type].ad}</b><div class="sm">${CONFIG.sizes[sh.size].ad} · İstanbul · ${sh.shelves.filter(x=>x).length}/${sh.shelves.length} raf dolu</div></div><div style="text-align:right"><b class="num ${pr>=0?"up":"dn"}">${pr>=0?"+":"−"}${tl(Math.abs(pr),0)} TL/dk</b><div class="sm num">kira ${tl(shopRent(sh),0)} TL/gün</div></div></div><div class="depo"><i style="width:${u/depotCap(sh)*100}%"></i></div></button>`});
  const lim=loanLimit();h+=`<h3>Banka</h3><button class="lst" data-a="bank"><div class="row"><div><b>${S.debt>0?"Borç "+tl(S.debt,0)+" TL":"Borcun yok"}</b><div class="sm num">Kredi limiti ${tl(lim,0)} TL · faiz günde %${tl(interestRate()*100,1)}</div></div><div style="text-align:right"><b class="num ${S.debt>0?"dn":""}">${S.debt>0?"−"+tl(S.debt*interestRate(),0)+" TL/gün":tl(Math.max(0,lim-S.debt),0)+" TL"}</b><div class="sm">${S.debt>0?"faiz":"çekilebilir"}</div></div></div></button>`;
  const dp=dayProfit(),tx=taxFor(Math.max(0,dp));h+=`<h3>Devlet</h3><button class="lst" data-a="tax"><div class="row"><div><b>Vergi dairesi</b><div class="sm num">Bugünkü kâr <span id="dpT">${tl(dp,0)}</span> TL</div></div><div style="text-align:right"><b class="num ${tx>0?"dn":""}" id="txT">${tx>0?"−"+tl(tx,0)+" TL":"vergi yok"}</b><div class="sm">gün sonunda</div></div></div></button>`;
  const rest=TYPES.filter(t=>!S.shops.some(s=>s.type===t.id));
  if(rest.length){h+=`<h3>Yeni dükkân</h3>`;rest.forEach(t=>{const lk=S.level<t.level;h+=`<div class="card ${lk?"lock":""}"><div class="row"><div><h2>${t.ad}</h2><div class="sub">${t.products.slice(0,3).map(a=>a[1]).join(", ")} ve ${t.products.length-3} ürün daha</div></div>${lk?`<span class="tag q">${t.level}. seviyede açılır</span>`:costBtn("openshop",t.cost,`data-v="${t.id}"`)}</div></div>`})}
  return h}
function renderShop(){
  const sh=cur(),t=T[sh.type],u=depotUsed(sh);
  let h=shopChips()+`<div class="card"><div class="row"><div><h2>${t.ad}</h2><div class="sub">${CONFIG.sizes[sh.size].ad} dükkân · İstanbul · ${sh.shelves.length} raf</div></div><div style="text-align:right"><b class="num" id="depoN">${u}</b><span class="sub"> / ${depotCap(sh)} birim</span></div></div><div class="depo"><i id="depoB" style="width:${u/depotCap(sh)*100}%"></i></div></div>`;
  sh.shelves.forEach((sf,i)=>{
    if(!sf){h+=`<div class="card"><div class="row"><div><h2>${i+1}. raf</h2><div class="sub">Boş. Pazardan aldığın yeni ürün buraya yerleşir.</div></div><button class="btn ghost" data-a="gomarket" data-v="${S.cur}">Pazar</button></div></div>`;return}
    const st=sh.stock[sf.pid],ref=refPrice(sf.pid),r=sf.price/ref,rate=st.q>0?shelfRate(sh,sf):0,diff=(r-1)*100,pr=rate*(sf.price-st.cost);
    h+=`<div class="card"><div class="row"><div><h2>${P[sf.pid].ad}</h2><div class="sub">${i+1}. raf</div></div><div>${st.q>0?qTag(st.qual):`<span class="tag k">Stok yok</span>`}</div></div>
    <div class="kv"><div><b class="num" id="q-${sf.pid}">${st.q}</b><span>stok</span></div><div><b class="num">${tl(rate,1)}/dk</b><span>satış hızı</span></div><div><b class="num ${pr>=0?"up":"dn"}">${st.q>0?(pr>=0?"+":"−")+tl(Math.abs(pr),0):"0"} TL/dk</b><span>kâr</span></div></div>
    <div class="price"><button class="step" data-a="price" data-i="${i}" data-v="-1" aria-label="Fiyatı azalt">−</button><div class="pmid"><b class="num">${tl(sf.price)} TL</b><div class="sub num">piyasa ${tl(ref)} · <span class="${diff>0.5?"dn":diff<-0.5?"up":""}">${Math.abs(diff)<.5?"":diff>0?"+":"−"}%${tl(Math.abs(diff),0)}</span> · maliyet ${tl(st.cost)}</div></div><button class="step" data-a="price" data-i="${i}" data-v="1" aria-label="Fiyatı artır">+</button></div>
    <div class="row" style="margin-top:12px"><button class="btn ghost" style="flex:1" data-a="swap" data-i="${i}">Ürünü değiştir</button><button class="btn g" style="flex:1" data-a="goto" data-v="${sf.pid}">Mal al</button></div>${st.q>0?`<button class="btn ghost sm full" style="margin-top:8px" data-a="sellback" data-v="${sf.pid}">Zararına hemen sat</button>`:""}</div>`});
  const c=upCost(sh);if(c!=null){const z=CONFIG.sizes[sh.size+1];h+=`<div class="card goal"><div class="row"><div><h2>${z.ad} dükkâna büyüt</h2><div class="sub">${z.shelves} raf, ${tl(z.depot,0)} birim depo. Kira ${tl(Math.round(z.rent*t.tier*CONFIG.rentScale),0)} TL/gün olur.</div></div>${costBtn("upgrade",c)}</div><div class="depo"><i id="goalB" data-c="${c}" style="width:${clamp(S.cash/c*100,0,100)}%"></i></div></div>`}
  h+=`<div class="card"><h2 style="margin-bottom:6px">Son satışlar</h2><div class="feed" id="feed">${feedHtml()}</div></div>`;
  return h}
function renderMarket(){const sh=cur(),n=shopOffers(sh).length,mv=S.mview==="offers"?"offers":"buy";
  const seg=`<div class="seg"><button class="${mv==="buy"?"on":""}" data-a="mview" data-v="buy">Mal al</button><button class="${mv==="offers"?"on":""}" data-a="mview" data-v="offers">İlanlarım (${n}/${offerSlots(sh)})</button></div>`;
  return mv==="offers"?shopChips()+seg+renderOffers():renderBuy(seg)}
function renderOffers(){const sh=cur(),os=shopOffers(sh),slots=offerSlots(sh);
  let h=`<div class="card"><h2>Pazarda ilan</h2><div class="sub" style="margin-top:4px">Depondaki malı toptan satışa çıkar. Alıcılar piyasa değerine yakın fiyatlı ilanları alır; fiyatı düşürdükçe hızlanır. Komisyon %${tl(CONFIG.offerFee*100,0)}. İlandaki mal depoda yer tutar, raftan satılmaz.</div></div>`;
  os.forEach(o=>{const fair=offerFair(o.pid,o.q),rate=offerRateAt(o.pid,o.q,o.price),df=(o.price/fair-1)*100,unit=o.price*(1-CONFIG.offerFee)-o.cost;
    h+=`<div class="card"><div class="row"><div><h2>${P[o.pid].ad}</h2><div class="sub num"><span id="o-${o.id}">${o.qty}</span> birim kaldı</div></div>${qTag(o.q)}</div>
    <div class="kv"><div><b class="num">${tl(o.price)} TL</b><span>ilan fiyatı</span></div><div><b class="num ${rate>0?"":"dn"}">${tl(rate,1)}/dk</b><span>${rate>0?"alıcı hızı":"alıcı yok"}</span></div><div><b class="num ${unit>=0?"up":"dn"}">${unit>=0?"+":"−"}${tl(Math.abs(unit))} TL</b><span>birim kâr</span></div></div>
    <div class="sub num" style="margin-top:10px">Piyasa değeri ${tl(fair)} TL · ilanın ${Math.abs(df)<.5?"tam değerinde":"%"+tl(Math.abs(df),0)+(df>0?" üstünde":" altında")} · maliyetin ${tl(o.cost)} TL</div>
    <button class="btn ghost full sm" style="margin-top:10px" data-a="ocancel" data-v="${o.id}">İlanı geri çek</button></div>`});
  h+=os.length<slots?`<button class="btn full" data-a="offernew">İlan ver</button>`:`<div class="sub" style="text-align:center;padding:8px">İlan hakkın doldu. Dükkânı büyütünce artar.</div>`;
  return h}
function renderBuy(seg){
  const sh=cur(),t=T[sh.type],id=S.sel[t.id],p=P[id],h0=S.market.hist[id],prev=h0.length>1?h0[h0.length-2]:h0[0],c0=sysPrice(id),ch=(c0/prev-1)*100,st=sh.stock[id];
  let h=shopChips()+seg+`<div class="prods">`+t.products.map(a=>{if(S.level<P[a[0]].lvl)return `<button class="lock" data-a="sel" data-v="${a[0]}"><b>${a[1]}</b><span>${P[a[0]].lvl}. seviye</span></button>`;const b=allListings(a[0])[0];return `<button class="${a[0]===id?"on":""}" data-a="sel" data-v="${a[0]}"><b>${a[1]}</b><span class="num">${tl(net(b))} TL</span></button>`}).join("")+`</div>`;
  h+=`<div class="card"><div class="row"><div><h2>${p.ad}</h2><div class="sub num">Sistem fiyatı ${tl(c0)} TL <span class="${ch>0.5?"up":ch<-0.5?"dn":""}">${Math.abs(ch)<.5?"":(ch>0?"▲":"▼")+" %"+tl(Math.abs(ch),0)}</span></div></div><div style="text-align:right"><b class="num">${tl(refPrice(id))} TL</b><div class="sub">dükkânda satılır</div></div></div>${spark(id)}<div class="sub num">${t.ad} deposunda: ${st.q} birim${st.q?` · %${Math.round(st.qual)} kalite · ${tl(st.cost)} TL maliyet`:""} · temel hız ${tl(p.rate,1)}/dk</div></div>`;
  allListings(id).forEach((l,i)=>{const mrg=(refPrice(id)/net(l)-1)*100;
    h+=`<button class="lst ${l.sys?"sys":""}" data-a="open" data-v="${l.id}"><div class="row"><div><b>${l.seller}</b> ${i===0&&!l.sys?`<span class="tag best">En ucuz</span>`:""} ${l.kelepir?`<span class="tag k">Kelepir</span>`:""}<div class="sm">${l.city} · ${l.km} km · ${l.sys?"sınırsız":l.qty+" birim"}</div></div><div style="text-align:right"><div class="net num">${tl(net(l))} TL</div><div class="sm num">${tl(l.price)} + ${tl(ship(l))} nakliye</div></div></div><div class="row" style="margin-top:8px">${qTag(l.q)}<span class="sm num">hız ×${tl(qualMult(l.q),1)} · <span class="${mrg>0?"up":"dn"}">${mrg>=0?"+":"−"}%${tl(Math.abs(mrg),0)} marj</span></span></div></button>`});
  return h}
function render(){
  $("main").innerHTML=S.tab==="home"?renderHome():S.tab==="shop"?renderShop():renderMarket();
  ["home","shop","market"].forEach(k=>$("t-"+k).className=S.tab===k?"on":"");dirty=false;tickUI()}
function tickUI(){
  const c=$("cash");c.textContent=tl(S.cash,S.cash<10000?2:0)+" TL";c.className="num"+(S.cash<0?" neg":"");
  const pm=profitPerMin();$("ppm").textContent=(pm>=0?"+":"−")+tl(Math.abs(pm),0)+" TL/dk";$("day").textContent=S.day+". gün";
  const m=$("mst");m.textContent=CONFIG.states[S.market.state].ad;m.className="chip st-"+S.market.state;
  const left=Math.max(0,S.market.nextAt-S.t);$("mcd").textContent=Math.floor(left/60)+":"+String(Math.floor(left%60)).padStart(2,"0");$("mbar").style.width=(100-left/CONFIG.marketSec*100)+"%";
  $("spd").textContent=S.speed+"×";
  if(S.tab==="shop"){const sh=cur(),d=depotUsed(sh),n=$("depoN");if(n){n.textContent=d;$("depoB").style.width=d/depotCap(sh)*100+"%"}
    sh.shelves.forEach(sf=>{if(sf){const e=$("q-"+sf.pid);if(e)e.textContent=sh.stock[sf.pid].q}});
    const g=$("goalB");if(g)g.style.width=clamp(S.cash/+g.dataset.c*100,0,100)+"%"}
  if(S.tab==="market")shopOffers(cur()).forEach(o=>{const e=$("o-"+o.id);if(e)e.textContent=o.qty});
  if(S.tab==="home"){const b=$("xpB");if(b){const a0=+b.dataset.a0,a1=+b.dataset.a1;b.style.width=clamp((S.xp-a0)/(a1-a0)*100,0,100)+"%";const dp=dayProfit(),tx=taxFor(Math.max(0,dp));$("dpT").textContent=tl(dp,0);$("txT").textContent=tx>0?"−"+tl(tx,0)+" TL":"vergi yok";$("xpT").textContent="Sonraki seviyeye "+tl(Math.max(0,a1-S.xp),0)+" TL ciro"}}
  $("main").querySelectorAll("[data-cost]").forEach(b=>{if(b.disabled!==(S.cash<+b.dataset.cost))dirty=true});
}
/* ---- Alt sayfalar ---- */
function openSheet(html){$("sheet").innerHTML=html;$("sheetbg").classList.add("on")}
function closeSheet(){$("sheetbg").classList.remove("on");sheetL=null;dirty=true}
function findL(v){const id=S.sel[cur().type];return v==="0"?sysListing(id):S.listings[id].find(l=>l.id==v)}
function buyCalc(){const l=sheetL,st=shopOf(l.pid).stock[l.pid],nq=st.q+sheetQ,nqual=nq?(st.qual*st.q+l.q*sheetQ)/nq:0,ncost=nq?(st.cost*st.q+net(l)*sheetQ)/nq:0,pr=refPrice(l.pid)-ncost;
  $("sq").textContent=sheetQ+" birim";$("stot").textContent=tl(sheetQ*net(l))+" TL";$("savg").textContent="%"+Math.round(nqual)+" kalite · "+tl(ncost)+" TL";
  const e=$("sprof");e.textContent="birim başı "+tl(pr)+" TL";e.className=pr>0?"up":"dn";$("sbuy").textContent=sheetQ+" birim al";$("qr").value=sheetQ}
function buySheet(){
  const l=sheetL,mx=maxBuy(l),sh=shopOf(l.pid);sheetQ=clamp(sheetQ,mx>0?1:0,mx);
  const why=mx>0?"":S.cash<net(l)?"Kasada yeterli para yok.":depotCap(sh)-depotUsed(sh)<=0?"Depo dolu.":"";
  openSheet(`<div class="row"><div><h2>${P[l.pid].ad}</h2><div class="sub">${l.seller} · ${l.city} (${l.km} km)</div></div>${qTag(l.q)}</div>
  <table class="tbl num"><tr><td>Birim fiyat</td><td>${tl(l.price)} TL</td></tr><tr><td>Nakliye</td><td>${tl(ship(l))} TL</td></tr><tr><td>Net fiyat</td><td class="up">${tl(net(l))} TL</td></tr></table>
  ${mx>0?`<div class="row"><b>Miktar</b><b class="num" style="font-size:20px" id="sq"></b></div><input type="range" id="qr" min="1" max="${mx}" value="${sheetQ}">
  <div class="qk"><button data-a="qk" data-v=".25">%25</button><button data-a="qk" data-v=".5">%50</button><button data-a="qk" data-v="1">En fazla (${mx})</button></div>
  <table class="tbl num"><tr><td>Toplam</td><td id="stot"></td></tr><tr><td>Depoda yeni ortalama</td><td id="savg"></td></tr><tr><td>Piyasa fiyatından satarsan</td><td id="sprof"></td></tr></table>
  <button class="btn g full" data-a="buy" id="sbuy"></button>`:`<div class="card hint">${why}</div><button class="btn ghost full" data-a="close">Kapat</button>`}
  ${S.cash<net(l)*Math.min(l.qty,depotCap(sh)-depotUsed(sh))&&loanLimit()-S.debt>=100?`<button class="btn ghost full" style="margin-top:8px" data-a="bank">Kasan yetmiyor: bankadan kredi çek (${tl(loanLimit()-S.debt,0)} TL)</button>`:""}`);
  const r=$("qr");if(r){r.oninput=()=>{sheetQ=+r.value;buyCalc()};buyCalc()}}
function swapSheet(i){const sh=cur(),have=T[sh.type].products.map(a=>P[a[0]]).filter(p=>sh.stock[p.id].q>0&&!sh.shelves.some(s=>s&&s.pid===p.id));
  openSheet(`<h2 style="margin-bottom:10px">${i+1}. rafta ne satılsın?</h2>`+(have.length?have.map(p=>`<button class="lst" data-a="setp" data-i="${i}" data-v="${p.id}"><div class="row"><b>${p.ad}</b><span class="sm num">${sh.stock[p.id].q} birim · %${Math.round(sh.stock[p.id].qual)}</span></div></button>`).join(""):`<div class="sub" style="margin-bottom:12px">Depoda rafta olmayan başka ürün yok. Önce pazardan al.</div>`)+`<button class="btn ghost full" data-a="close">Kapat</button>`)}
function bankSheet(){sheetL=null;const lim=loanLimit(),av=Math.floor(Math.max(0,lim-S.debt)/100)*100,rp=Math.floor(Math.min(S.debt,Math.max(0,S.cash))),f=x=>tl(x,0)+" TL";
  openSheet(`<h2>Banka</h2><div class="sub">Kredi limitin, dükkânlarının ve depodaki malın değerinin %${Math.round(CONFIG.loanRatio*100)} kadarıdır. Faiz her gün sonunda kasadan kesilir. Borcun limitin yarısını geçince faiz artar: %${tl(CONFIG.interestDay*100,0)}, yarıdan sonra %${tl(CONFIG.interestDay*CONFIG.interestSteps[0].k*100,0)}, %80 üstünde %${tl(CONFIG.interestDay*CONFIG.interestSteps[1].k*100,0)}.</div>
  <table class="tbl num"><tr><td>Borç</td><td>${f(S.debt)}</td></tr><tr><td>Kredi limiti</td><td>${f(lim)}</td></tr><tr><td>Günlük faiz (%${tl(interestRate()*100,1)})</td><td>${f(S.debt*interestRate())}</td></tr><tr><td>Tahmini günlük kâr (faiz hariç)</td><td>${f(dayProfitEstimate())}</td></tr></table>
  ${av>=100?`<div class="row"><b>Kredi çek</b><b class="num" id="bv"></b></div><input type="range" id="bq" min="100" max="${av}" step="100" value="${Math.max(100,Math.floor(av/200)*100)}"><div class="sub" id="bw" style="margin-bottom:8px"></div><button class="btn g full" data-a="borrow">Kredi çek</button>`:`<div class="card hint">Çekilebilir kredin yok.</div>`}
  ${rp>=1?`<div class="row" style="margin-top:16px"><b>Borç öde</b><b class="num" id="pv"></b></div><input type="range" id="pq" min="1" max="${rp}" value="${rp}"><button class="btn full" data-a="repay">Borç öde</button>`:""}
  <button class="btn ghost full" style="margin-top:10px" data-a="close">Kapat</button>`);
  const b=$("bq"),q=$("pq");if(b){const u=()=>{const nd=S.debt+ +b.value,fi=nd*interestRate(nd),est=dayProfitEstimate(),w=$("bw");$("bv").textContent=f(+b.value)+" · faizi "+f(fi)+"/gün";
    if(est<=0){w.textContent="Rafların şu an kâr üretmiyor; bu faizi mal satarak karşılaman gerekecek.";w.className="sub dn"}
    else if(fi>est*.5){w.textContent="Dikkat: bu faiz, tahmini günlük kârının (%"+tl(est?fi/est*100:0,0)+") yarısından fazlasını götürür.";w.className="sub dn"}
    else{w.textContent="Bu faiz, tahmini günlük kârının %"+tl(fi/est*100,0)+" kadarı.";w.className="sub"}};b.oninput=u;u()}if(q){const u=()=>$("pv").textContent=f(+q.value);q.oninput=u;u()}}
let sheetO=null;
function offerPick(){sheetL=null;const sh=cur(),have=T[sh.type].products.map(a=>P[a[0]]).filter(p=>sh.stock[p.id].q>0);
  openSheet(`<h2 style="margin-bottom:10px">Hangi malı ilana çıkaracaksın?</h2>`+(have.length?have.map(p=>{const st=sh.stock[p.id];return `<button class="lst" data-a="offerpid" data-v="${p.id}"><div class="row"><b>${p.ad}</b><span class="sm num">${st.q} birim · %${Math.round(st.qual)} · maliyet ${tl(st.cost)}</span></div></button>`}).join(""):`<div class="sub" style="margin-bottom:12px">Depoda mal yok. Önce pazardan al.</div>`)+`<button class="btn ghost full" data-a="close">Kapat</button>`)}
function offerCalc(){const o=sheetO,sh=cur(),st=sh.stock[o.pid],fair=offerFair(o.pid,st.qual),rate=offerRateAt(o.pid,st.qual,o.price),df=(o.price/fair-1)*100,unit=o.price*(1-CONFIG.offerFee)-st.cost;o.qty=+$("oq").value;
  $("oqv").textContent=o.qty+" birim";$("opv").textContent=tl(o.price)+" TL";$("opd").textContent=Math.abs(df)<.5?"piyasa değerinde":"piyasa değerinin %"+tl(Math.abs(df),0)+(df>0?" üstünde":" altında");
  const r=$("ort");r.textContent=rate>0?tl(rate,1)+"/dk · yaklaşık "+tl(o.qty/rate,0)+" dk":"alıcı çıkmaz";r.className=rate>0?"":"dn";
  const u=$("oun");u.textContent=(unit>=0?"+":"−")+tl(Math.abs(unit))+" TL";u.className=unit>=0?"up":"dn";$("otot").textContent=tl(o.qty*o.price*(1-CONFIG.offerFee),0)+" TL"}
function offerForm(pid){const sh=cur(),st=sh.stock[pid],fair=offerFair(pid,st.qual);sheetO={pid,qty:st.q,price:roundP(fair)};
  openSheet(`<div class="row"><div><h2>${P[pid].ad}: ilan ver</h2><div class="sub num">Piyasa değeri ${tl(fair)} TL · maliyetin ${tl(st.cost)} TL</div></div>${qTag(st.qual)}</div>
  <div class="price"><button class="step" data-a="oprice" data-v="-1" aria-label="Fiyatı azalt">−</button><div class="pmid"><b class="num" id="opv"></b><div class="sub num" id="opd"></div></div><button class="step" data-a="oprice" data-v="1" aria-label="Fiyatı artır">+</button></div>
  <div class="row" style="margin-top:14px"><b>Miktar</b><b class="num" style="font-size:20px" id="oqv"></b></div><input type="range" id="oq" min="1" max="${st.q}" value="${st.q}">
  <table class="tbl num"><tr><td>Tahmini satış</td><td id="ort"></td></tr><tr><td>Komisyon sonrası birim kâr</td><td id="oun"></td></tr><tr><td>Hepsi satılırsa kasaya girer</td><td id="otot"></td></tr></table>
  <button class="btn g full" data-a="ocreate">İlana çıkar</button><button class="btn ghost full" style="margin-top:8px" data-a="close">Vazgeç</button>`);
  $("oq").oninput=offerCalc;offerCalc()}
let sheetP=null;
function sellCalc(){const sh=cur(),st=sh.stock[sheetP],q=+$("sr").value,p=sellBackPrice(sh,sheetP);$("sv").textContent=q+" birim";$("st1").textContent=tl(q*p)+" TL";const z=q*(st.cost-p);$("st2").textContent=z>0.005?"−"+tl(z)+" TL":"yok";$("st2").className=z>0.005?"dn":"";$("sdo").textContent=q+" birimi hemen sat"}
function sellSheet(pid){sheetL=null;sheetP=pid;const sh=cur(),st=sh.stock[pid],p=sellBackPrice(sh,pid);
  openSheet(`<h2>${P[pid].ad}: zararına hemen sat</h2><div class="sub">Mal anında nakde döner ama maliyetinin %${tl(CONFIG.sellBackLoss*100,0)} altında. Nakde sıkıştığında çıkış yoludur; zarar etmeden satmak için rafı ya da pazarda ilanı kullan.</div>
  <table class="tbl num"><tr><td>Maliyetin</td><td>${tl(st.cost)} TL</td></tr><tr><td>Hemen satış fiyatı</td><td class="${p<st.cost-.005?"dn":""}">${tl(p)} TL</td></tr></table>
  <div class="row"><b>Miktar</b><b class="num" style="font-size:20px" id="sv"></b></div><input type="range" id="sr" min="1" max="${st.q}" value="${st.q}">
  <table class="tbl num"><tr><td>Kasaya girecek</td><td id="st1"></td></tr><tr><td>Zarar</td><td id="st2"></td></tr></table>
  <button class="btn full" data-a="dosell" id="sdo"></button><button class="btn ghost full" style="margin-top:8px" data-a="close">Vazgeç</button>`);
  $("sr").oninput=sellCalc;sellCalc()}
function taxSheet(){sheetL=null;const dp=dayProfit(),f=x=>tl(x,0)+" TL";let lo=0;
  openSheet(`<h2>Vergi dairesi</h2><div class="sub">Her gün sonunda o günün kârından vergi kesilir. Kâr; cirodan satılan malın maliyeti, kira ve faiz düşülerek hesaplanır. Oranlar dilimlidir: her oran yalnızca kendi dilimindeki kâra uygulanır.</div>
  <table class="tbl num">${CONFIG.taxBrackets.map(b=>{const r=`<tr><td>${b.upTo===Infinity?f(lo)+" üstü":f(lo)+" – "+f(b.upTo)}</td><td>%${tl(b.rate*100,0)}</td></tr>`;lo=b.upTo;return r}).join("")}</table>
  <table class="tbl num"><tr><td>Bugünkü ciro</td><td>${f(S.d.rev)}</td></tr><tr><td>Satılan malın maliyeti</td><td>${f(S.d.cogs||0)}</td></tr><tr><td>Kira ve faiz</td><td>${f(rentTotal()+S.debt*interestRate())}</td></tr><tr><td>Bugünkü kâr</td><td>${f(dp)}</td></tr><tr><td>Tahmini vergi</td><td class="${dp>0?"dn":""}">${f(taxFor(Math.max(0,dp)))}</td></tr></table>
  <button class="btn ghost full" data-a="close">Kapat</button>`)}
function settingsSheet(){const r=(k,a,b,s,lab)=>`<div class="row" style="margin-top:10px"><span>${lab}</span><b class="num" id="v-${k}">${CONFIG[k]}</b></div><input type="range" id="r-${k}" data-k="${k}" min="${a}" max="${b}" step="${s}" value="${CONFIG[k]}">`;
  openSheet(`<h2>Ayar paneli</h2><div class="sub">Denge değerleri. Değişiklik anında uygulanır.</div>${r("marketSec",30,1200,30,"Piyasa güncelleme aralığı (sn)")}${r("rateScale",.5,3,.1,"Satış hızı çarpanı")}${r("rentScale",0,3,.1,"Kira çarpanı")}${r("daySec",60,600,30,"Bir günün süresi (sn)")}${r("shipPerKm",0,.02,.001,"Nakliye (TL/km)")}${r("loanRatio",0,1,.05,"Kredi limiti oranı")}${r("interestDay",0,.1,.005,"Taban günlük faiz oranı")}
  <div class="row" style="margin-top:14px"><button class="btn ghost" style="flex:1" data-a="reset">Oyunu sıfırla</button><button class="btn" style="flex:1" data-a="close">Tamam</button></div>`);
  $("sheet").querySelectorAll("input").forEach(i=>i.oninput=()=>{CONFIG[i.dataset.k]=+i.value;$("v-"+i.dataset.k).textContent=i.value})}
function openEnd(){S.speed=1;openSheet(`<h2>İflas ettin.</h2><p>Kasa ekside ve depolarda satacak mal kalmadı (${S.day-1}. gün).</p><button class="btn full" data-a="reset">Yeniden başla</button>`)}
/* ---- Dokunma ---- */
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-a]");if(!b)return;const a=b.dataset.a,v=b.dataset.v,i=+b.dataset.i,top=()=>$("main").scrollTop=0;
  if(a==="closebg"){if(e.target===b&&!S.dead)closeSheet();return}
  if(a==="tab"){S.tab=v;top()}
  else if(a==="shopsel")S.cur=+v;
  else if(a==="shopgo"){S.cur=+v;S.tab="shop";top()}
  else if(a==="gomarket"){S.cur=+v;S.tab="market";top()}
  else if(a==="sel"){if(S.level<P[v].lvl){toast(P[v].ad+" "+P[v].lvl+". seviyede açılır.");return}S.sel[cur().type]=v}
  else if(a==="bank"){bankSheet();return}
  else if(a==="tax"){taxSheet();return}
  else if(a==="sellback"){sellSheet(v);return}
  else if(a==="mview"){S.mview=v;top()}
  else if(a==="offernew"){offerPick();return}
  else if(a==="offerpid"){offerForm(v);return}
  else if(a==="oprice"){const f=offerFair(sheetO.pid,cur().stock[sheetO.pid].qual),stp=Math.max(.05,roundP(f*.02));sheetO.price=clamp(roundP(sheetO.price+stp*v),roundP(f*.5),roundP(f*1.5));offerCalc();return}
  else if(a==="ocreate"){const o=createOffer(cur(),sheetO.pid,sheetO.qty,sheetO.price);closeSheet();if(o)toast(o.qty+" birim "+P[o.pid].ad+" ilana çıktı.");else toast("İlan verilemedi.")}
  else if(a==="ocancel"){if(cancelOffer(+v))toast("İlan geri çekildi, mal depoya döndü.")}
  else if(a==="dosell"){const q=+$("sr").value,r=sellBack(cur(),sheetP,q);closeSheet();if(r)toast(q+" birim "+P[sheetP].ad+" satıldı: "+tl(r,0)+" TL.")}
  else if(a==="borrow"){const x=borrow(+$("bq").value);if(x)toast(tl(x,0)+" TL kredi çekildi.");bankSheet();tickUI();return}
  else if(a==="repay"){const x=repay(+$("pq").value);if(x)toast(tl(x,0)+" TL borç ödendi.");bankSheet();tickUI();return}
  else if(a==="goto"){S.cur=S.shops.indexOf(shopOf(v));S.sel[P[v].type]=v;S.tab="market";top()}
  else if(a==="speed")S.speed=S.speed===1?3:S.speed===3?10:1;
  else if(a==="price"){const sf=cur().shelves[i],ref=refPrice(sf.pid),stp=Math.max(.05,roundP(ref*.02));sf.price=clamp(roundP(sf.price+stp*v),roundP(ref*.7),roundP(ref*1.3))}
  else if(a==="open"){const l=findL(v);if(!l){toast("Bu ilan az önce tükendi.");dirty=true;return}sheetL=l;sheetQ=Math.ceil(maxBuy(l)/2);buySheet();return}
  else if(a==="qk"){sheetQ=Math.max(1,Math.floor(maxBuy(sheetL)*v));buyCalc();return}
  else if(a==="buy"){const l=sheetL;if(!l.sys&&!S.listings[l.pid].includes(l)){toast("Bu ilan az önce tükendi.");closeSheet();return}
    const n=buy(l,sheetQ);closeSheet();if(n){toast(n+" birim "+P[l.pid].ad+" depoya girdi.");S.tab="shop";top()}}
  else if(a==="swap"){swapSheet(i);return}
  else if(a==="setp"){cur().shelves[i]={pid:v,price:roundP(refPrice(v))};closeSheet()}
  else if(a==="upgrade"){const sh=cur();if(upgrade(sh))toast(T[sh.type].ad+" artık "+CONFIG.sizes[sh.size].ad.toLowerCase()+" dükkân.")}
  else if(a==="openshop"){if(openShop(v)){S.cur=S.shops.length-1;S.tab="market";top();toast(T[v].ad+" açıldı. Raflar için mal al.")}}
  else if(a==="settings"){settingsSheet();return}
  else if(a==="reset"){newGame();closeSheet();save()}
  else if(a==="close"){closeSheet()}
  dirty=true;render()});
/* ---- Kayıt ve döngü ---- */
function save(){try{localStorage.setItem("kervan-dp4",JSON.stringify(snapshot()))}catch(e){}}
function load(){try{const j=JSON.parse(localStorage.getItem("kervan-dp4"));if(j&&j.S&&j.S.shops&&!j.S.dead&&PIDS.every(id=>j.S.listings[id])){restore(j);return true}}catch(e){}return false}
if(!load())newGame();
render();
let fc=0;
setInterval(()=>{step(.25*S.speed);if(++fc%4===0)flushFeed();if(fc%40===0)save();if(dirty&&!$("sheetbg").classList.contains("on"))render();else tickUI()},250);
(window as any).__k={get S(){return S},CONFIG};
