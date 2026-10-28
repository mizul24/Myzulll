#!/usr/bin/env python3
"""Pakai: python3 smooth-intro.py  (folder yang sama dengan index.html & lentera-bg.js)
WAJIB sudah menjalankan optimize.py dan blur-intro.py lebih dulu. Membuat cadangan *.bak3.
Berhenti tanpa mengubah apa pun bila ada potongan kode yang tidak cocok."""
import sys,os,shutil
d=sys.argv[1] if len(sys.argv)>1 else '.'
CSS=""":root{--ease2:cubic-bezier(.16,1,.3,1)}
@keyframes fade{from{opacity:0}}
@keyframes foc{from{opacity:0;filter:blur(14px)}60%{opacity:1}}
.rv.in{animation:fade .7s var(--ease2) var(--d,0s) backwards}
.rv.in>*{animation:foc 1s var(--ease2) var(--d,0s) backwards}
.js .hero{animation:fade .7s var(--ease2) backwards}
.js .hero .roles,.js .hero h1,.js .hero p,.js .hero .links{animation:foc 1s var(--ease2) 0s backwards}
.lany{animation:foc 1s var(--ease2) 0s backwards}
.low .glass,.low .btn,.low .nav,.low .nav.scrolled{-webkit-backdrop-filter:none;backdrop-filter:none}
.low .glass{background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02)),rgba(10,15,52,.62)}
.low .nav,.low .nav.scrolled{background:rgba(8,12,44,.86)}
.low .tilt{transform:none}
"""
F={'lentera-bg.js':[
("Y=()=>new Promise(r=>setTimeout(r,0))","YT=0,Y=()=>performance.now()-YT<6?0:new Promise(r=>setTimeout(()=>{YT=performance.now();r()},0))",1),
("if(j%10==0)await Y();","if(j%2==0)await Y();",2),
("tr%2500==0","tr%300==0",1),
("const go=()=>setTimeout(boot,150)","const go=()=>setTimeout(boot,1400)",1),
("const sty=D.createElement('style');","LOW&&D.documentElement.classList.add('low');const sty=D.createElement('style');",1)],
'index.html':[
("@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}",CSS+"@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}",1),
("c.style.setProperty('--d','0ms')","c.style.setProperty('--d',(i%3)*50+'ms')",1)]}
out={};bad=False
for f,R in F.items():
    p=os.path.join(d,f)
    if not os.path.exists(p):print('tidak ada:',p);bad=True;continue
    s=open(p,encoding='utf-8',newline='').read()
    for a,b,n in R:
        if s.count(a)!=n:print(f'GAGAL {f}: ditemukan {s.count(a)}x (harus {n}x) -> {a[:55]}');bad=True
        else:s=s.replace(a,b)
    out[p]=s
if bad:sys.exit('Dibatalkan, tidak ada file yang diubah. Kirim pesan galatnya ke saya.')
for p,s in out.items():shutil.copy(p,p+'.bak3');open(p,'w',encoding='utf-8',newline='').write(s);print('OK',p)