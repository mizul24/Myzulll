#!/usr/bin/env python3
"""Pakai: python3 blur-intro.py  (di folder yang sama dengan index.html)
Mengganti animasi masuk (geser/miring/zoom) menjadi blur-fade saja, lebih singkat & tanpa jeda berurutan.
Aman dijalankan sebelum atau sesudah optimize.py. Membuat index.html.bak2; berhenti tanpa mengubah apa pun bila kode tidak cocok."""
import sys,os,shutil
p=os.path.join(sys.argv[1] if len(sys.argv)>1 else '.','index.html')
s=open(p,encoding='utf-8',newline='').read()
CSS="""/* blur-intro: animasi masuk = blur + fade saja */
@keyframes rise{from{opacity:0;filter:blur(14px)}}
@keyframes up{from{opacity:0;filter:blur(10px)}}
@keyframes drop{from{opacity:0;filter:blur(10px)}}
.rv.in{animation:rise .55s var(--ease) 0s backwards}
.js .hero .roles,.js .hero h1,.js .hero p,.js .hero .links{animation:up .55s var(--ease) 0s backwards}
.lany{animation:drop .6s var(--ease) 0s backwards}
"""
R=[("@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}",CSS+"@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}"),
("{threshold:.12,rootMargin:'0px 0px -5% 0px'}","{threshold:0,rootMargin:'0px 0px 8% 0px'}"),
("c.style.setProperty('--d',(i%3)*90+'ms')","c.style.setProperty('--d','0ms')")]
for a,b in R:
    if s.count(a)!=1:sys.exit(f'Dibatalkan, tidak ada yang diubah. Potongan tidak cocok ({s.count(a)}x): {a[:50]}')
    s=s.replace(a,b)
shutil.copy(p,p+'.bak2');open(p,'w',encoding='utf-8',newline='').write(s);print('OK',p)