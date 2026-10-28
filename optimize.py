#!/usr/bin/env python3
"""Pakai: letakkan file ini sejajar index.html & lentera-bg.js, lalu:  python3 optimize.py
Membuat cadangan *.bak, lalu menerapkan optimasi. Berhenti tanpa mengubah apa pun bila ada potongan kode yang tidak cocok."""
import sys,os,shutil
JS=[
("mob=innerWidth<700;","mob=innerWidth<700||matchMedia('(pointer:coarse)').matches,LOW=mob||(navigator.hardwareConcurrency||4)<=4||(navigator.deviceMemory||4)<=2;"),
("const CFG={fogD:.0042,grass:mob?15000:34000,houses:mob?14:24,trees:mob?150:260,eye:3.3};",
 "const CFG={fogD:.0042,grass:mob?6000:LOW?14000:24000,houses:mob?12:LOW?18:24,trees:mob?90:LOW?160:220,eye:3.3},Y=()=>new Promise(r=>setTimeout(r,0));"),
("let sd=9,W,H,dp,U,","let sd=9,QS=1,W,H,dp,U,"),
("dp=Math.min(devicePixelRatio||1,mob?1.25:1.5);","dp=Math.min(devicePixelRatio||1,mob?1:LOW?1.1:1.5)*QS;"),
("function moonVis(x,y,z,n=5){let o=0;",
 "const VC=new Map();function moonVis(x,y,z,n=5){const k=(((Math.round(x/3)+4096)*8192+Math.round(z/3)+4096)*128+Math.round(y/2)+8)*8+n;let v=VC.get(k);if(v===undefined){v=mv0(x,y,z,n);VC.set(k,v)}return v}\nfunction mv0(x,y,z,n){let o=0;"),
("function buildTerrain(){const NR=mob?120:170,NC=mob?150:210,","async function buildTerrain(){const NR=mob?80:LOW?120:160,NC=mob?100:LOW?150:200,"),
("for(let j=0;j<NR;j++){const t=j/(NR-1),","for(let j=0;j<NR;j++){if(j%10==0)await Y();const t=j/(NR-1),"),
("for(let j=0;j<NR;j++)for(let i=0;i<NC;i++,k++){","for(let j=0;j<NR;j++){if(j%10==0)await Y();for(let i=0;i<NC;i++,k++){"),
("M[k*2]=0;M[k*2+1]=moonVis(x,y,z,5)}","M[k*2]=0;M[k*2+1]=moonVis(x,y,z,mob?3:5)}}"),
("function buildGrass(){","async function buildGrass(){"),
("while(k<n&&tr++<n*3){","while(k<n&&tr++<n*3){if(tr%2500==0)await Y();"),
("function initScene(){","async function initScene(){"),
("{antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'}",
 "{antialias:!LOW,alpha:true,premultipliedAlpha:true,powerPreference:LOW?'default':'high-performance',failIfMajorPerformanceCaveat:true}"),
("const hs=placeHouses(),ter=buildTerrain();","const hs=placeHouses();await Y();const ter=await buildTerrain();await Y();"),
("for(const o of hs)house(o);posts();trees();","for(const o of hs)house(o);await Y();posts();trees();await Y();"),
("const gr=buildGrass(),GT=","const gr=await buildGrass(),GT="),
("Lx.cl=Array.from({length:6},","Lx.cl=Array.from({length:LOW?3:6},"),
("F.drawImage(Lx.vg,0,0);F.globalAlpha=.035;F.fillStyle=Lx.gp;F.fillRect(0,0,W,H);F.globalAlpha=1}",
 "F.drawImage(Lx.vg,0,0);if(!LOW){F.globalAlpha=.035;F.fillStyle=Lx.gp;F.fillRect(0,0,W,H);F.globalAlpha=1}}"),
("{const im=new Image();im.onload=","if(!LOW)setTimeout(()=>{const im=new Image();im.onload="),
("im.src=window.LENTERA_DRAGON||'naga.webp'}","im.src=window.LENTERA_DRAGON||'naga.webp'},3000)"),
("function frame(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;T+=dt;",
 "let fn=0,fa=0;function frame(now){if(LOW&&now-last<30){requestAnimationFrame(frame);return}const dt=Math.min(.05,(now-last)/1000||.016);last=now;T+=dt;if(GLok){fa+=dt;if(++fn>=90){const av=fa/fn;fa=fn=0;if(av>(LOW?.045:.026)&&QS>.55){QS*=.8;layout()}}}"),
("let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{layout();if(reduce)draw(0)},150)});",
 "addEventListener('touchmove',e=>{const t=e.touches[0];cm.tx=(t.clientX/innerWidth-.5)*2;cm.ty=(t.clientY/innerHeight-.5)*2},{passive:true});\nlet rt,lw=innerWidth,lh=innerHeight;addEventListener('resize',()=>{if(innerWidth===lw&&Math.abs(innerHeight-lh)<140)return;clearTimeout(rt);rt=setTimeout(()=>{lw=innerWidth;lh=innerHeight;layout();if(reduce)draw(0)},250)});"),
("setTimeout(()=>{try{initScene()}catch(err){console.warn('Lentera 3D gagal dibuat:',err);GLok=false}if(reduce)draw(0)},40);",
 "{const boot=()=>initScene().then(()=>{if(reduce)draw(0)}).catch(err=>{console.warn('Lentera 3D gagal dibuat:',err);GLok=false});const go=()=>setTimeout(boot,150);D.readyState==='complete'?go():addEventListener('load',go,{once:true})}"),
]
CSS="""@media(max-width:820px),(hover:none){
 .glass,.btn,.nav,.nav.scrolled{-webkit-backdrop-filter:none;backdrop-filter:none}
 .glass{background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02)),rgba(10,15,52,.62);box-shadow:0 6px 18px rgba(0,0,20,.3)}
 .nav,.nav.scrolled{background:rgba(8,12,44,.86)}
 dialog{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}dialog::backdrop{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(3,5,24,.72)}
 .tilt{transform:none}.rv.in{animation-duration:.6s}}
"""
HTML=[
('<meta name="theme-color" content="#050824">',
 '<meta name="theme-color" content="#050824"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-180.png"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Myzulll"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'),
("@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}",CSS+"@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}"),
('<script src="lentera-bg.js"></script>',
 "<script>if('serviceWorker'in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))</script>\n<script src=\"lentera-bg.js\"></script>"),
]
def run(path,rules):
    s=open(path,encoding='utf-8',newline='').read();bad=[]
    for i,(a,b) in enumerate(rules):
        c=s.count(a)
        if c!=1:bad.append((i+1,c,a[:60]))
        else:s=s.replace(a,b)
    return s,bad
d=sys.argv[1] if len(sys.argv)>1 else '.'
out={};fail=False
for f,r in(('lentera-bg.js',JS),('index.html',HTML)):
    p=os.path.join(d,f)
    if not os.path.exists(p):print('tidak ada:',p);fail=True;continue
    s,bad=run(p,r)
    for n,c,a in bad:print(f'GAGAL {f} #{n}: ditemukan {c}x -> {a}...');fail=True
    out[p]=s
if fail:sys.exit('Dibatalkan, tidak ada file yang diubah. Kirim pesan galatnya ke saya.')
for p,s in out.items():
    shutil.copy(p,p+'.bak');open(p,'w',encoding='utf-8',newline='').write(s);print('OK',p)
print('Selesai. Upload juga: manifest.webmanifest, sw.js, icon-180/192/512.png (lewat HTTPS).')
