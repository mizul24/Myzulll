/* Lentera background v2 — pemandangan malam 3D (WebGL2)
   Pasang: <script src="lentera-bg.js"></script> sebelum </body>
   Opsional (sebelum script ini): <script>window.LENTERA_DRAGON='naga.webp'</script>
   Lapisan: canvas langit (2D) -> canvas 3D (gunung, bukit, rumah tinggi, pohon, rumput) -> canvas efek (2D) */
(()=>{'use strict';
const D=document,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,mob=innerWidth<700;

/* ---------- pengaturan (silakan diutak-atik) ---------- */
const CFG={fogD:.0042,grass:mob?15000:34000,houses:mob?14:24,trees:mob?150:260,eye:3.3};
const HZ=[.215,.29,.62],MOON=[.62,.72,1.05],SKYA=[.30,.38,.78],GND=[.10,.11,.27],FOV=.9,CAM0=[2,0,0];
const HZC='rgb(77, 77, 110)';

const sty=D.createElement('style');
sty.textContent='html{background:#050824}body{background:transparent!important}.lentera-cv{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block}#lentera-gl{opacity:0;transition:opacity 2s ease}';
D.head.appendChild(sty);
const mkCv=id=>{const c=D.createElement('canvas');c.id=id;c.className='lentera-cv';return c};
const cvS=mkCv('lentera-bg'),cvG=mkCv('lentera-gl'),cvF=mkCv('lentera-fx');
D.body.prepend(cvF);D.body.prepend(cvG);D.body.prepend(cvS);
const S=cvS.getContext('2d',{alpha:false}),F=cvF.getContext('2d');
let GL=null,GLok=false;

/* ---------- util ---------- */
let sd=9,W,H,dp,U,T=reduce?9:0,last=0,fc=0,gy0=0,VP=new Float32Array(16);
const cm={x:0,y:0,tx:0,ty:0},Lx={};
const R=()=>(sd=sd*16807%2147483647)/2147483647,rr=(a,b)=>a+(b-a)*R(),
cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),mix=(a,b,t)=>a+(b-a)*t,
ss=(a,b,x)=>{x=cl((x-a)/(b-a));return x*x*(3-2*x)},
mc=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)],
shade=(c,f)=>[c[0]*f,c[1]*f,c[2]*f],pick=a=>a[(R()*a.length)|0],
mk=(w,h)=>{const c=D.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return[c,c.getContext('2d')]},
glow=rgb=>{const[c,g]=mk(128,128),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,`rgba(${rgb},1)`);r.addColorStop(.22,`rgba(${rgb},.45)`);r.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=r;g.fillRect(0,0,128,128);return c},
gw=(ctx,c,x,y,r,a)=>{ctx.globalAlpha=a;ctx.drawImage(c,x-r,y-r,r*2,r*2);ctx.globalAlpha=1};

/* ---------- noise & medan ---------- */
const NT=new Float32Array(65536);for(let i=0;i<65536;i++)NT[i]=R();
const nz=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*fx*(fx*(fx*6-15)+10),v=fy*fy*fy*(fy*(fy*6-15)+10),
 a=NT[((j&255)<<8)|(i&255)],b=NT[((j&255)<<8)|((i+1)&255)],c=NT[(((j+1)&255)<<8)|(i&255)],d=NT[(((j+1)&255)<<8)|((i+1)&255)];
 return mix(mix(a,b,u),mix(c,d,u),v)};
const fbm=(x,y,o=5)=>{let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=a*nz(x,y);n+=a;const t=x*1.9+y*.6+17.3;y=y*1.9-x*.6+9.1;x=t;a*=.5}return s/n};
const rdg=(x,y,o=5)=>{let s=0,a=.5,n=0,w=1;for(let i=0;i<o;i++){let v=1-Math.abs(nz(x,y)*2-1);v*=v*w;w=cl(v*1.6);s+=a*v;n+=a;const t=x*1.9+y*.6+17.3;y=y*1.9-x*.6+9.1;x=t;a*=.5}return s/n};
const mea=d=>7*Math.sin(d*.026)+4*Math.sin(d*.011+1);   // jalan setapak berkelok
const pads=[];                                           // halaman rumah (tanah diratakan)
function th0(x,z){const d=-z,dd=Math.max(d,0),ax=Math.abs(x-mea(dd)),side=ss(12,95,ax),far=ss(70,340,dd);
 let h=(fbm(x*.022,z*.022,4)-.5)*4.5+(fbm(x*.13,z*.13,2)-.5)*.7;
 if(side>0)h+=(fbm(x*.017+5,z*.017,5)-.28)*34*side*(.3+.7*ss(0,150,dd));          // perbukitan
 const mk_=far*.85+ss(28,170,ax)*ss(20,220,dd)*.5;
 if(mk_>.01)h+=rdg(x*.0062+1.7,z*.0062,5)*60*mk_;                                 // pegunungan
 h+=ss(110,380,dd)*10+34*Math.exp(-Math.pow((x/Math.max(dd,60)+.55)/.16,2))*far;  // puncak besar di kiri
 return Math.max(h,-3)}
const TH=(x,z)=>{let h=th0(x,z);for(let i=0;i<pads.length;i++){const p=pads[i],dx=x-p[0],dz=z-p[1],q=dx*dx+dz*dz;if(q<p[3]*p[3]*3.61)h=mix(p[2],h,ss(p[3],p[3]*1.9,Math.sqrt(q)))}return h};
const LD=(()=>{const v=[.6,.55,-.05],l=Math.hypot(...v);return v.map(a=>a/l)})(),LH=Math.hypot(LD[0],LD[2]),LHX=LD[0]/LH,LHZ=LD[2]/LH,LTAN=LD[1]/LH,ST=[4,10,19,32,52];
function moonVis(x,y,z,n=5){let o=0;for(let i=0;i<n;i++){const s=ST[i];o=Math.max(o,cl((TH(x+LHX*s,z+LHZ*s)-y-.6-s*LTAN)/6))}return 1-.8*o}

/* ---------- geometri statis: rumah, pohon, lentera jalan ---------- */
const G={p:[],n:[],c:[],m:[]},GLW=[];let VIS=1;
const glw=(p,s,c,a)=>GLW.push({p,s,c,a,ph:R()*9,v:0,t:1});
const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]};
const tri=(a,b,c,na,nb,nc,col,em)=>{G.p.push(...a,...b,...c);G.n.push(...na,...nb,...nc);G.c.push(...col,...col,...col);G.m.push(em,VIS,em,VIS,em,VIS)};
const quad=(a,b,c,d,cen,col,em=0)=>{let n=nrm([(b[1]-a[1])*(d[2]-a[2])-(b[2]-a[2])*(d[1]-a[1]),(b[2]-a[2])*(d[0]-a[0])-(b[0]-a[0])*(d[2]-a[2]),(b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0])]);
 if(n[0]*((a[0]+c[0])/2-cen[0])+n[1]*((a[1]+c[1])/2-cen[1])+n[2]*((a[2]+c[2])/2-cen[2])<0)n=[-n[0],-n[1],-n[2]];tri(a,b,c,n,n,n,col,em);tri(a,c,d,n,n,n,col,em)};
const CN=[[-1,-1],[1,-1],[1,1],[-1,1]];
function box(tf,cx,y0,cz,hw,h,hd,col,em=0){const b=CN.map(([a,e])=>tf(cx+a*hw,y0,cz+e*hd)),t=CN.map(([a,e])=>tf(cx+a*hw,y0+h,cz+e*hd)),cen=tf(cx,y0+h/2,cz);
 for(let i=0;i<4;i++){const j=(i+1)%4;quad(b[i],b[j],t[j],t[i],cen,col,em)}quad(t[0],t[1],t[2],t[3],cen,col,em);quad(b[0],b[1],b[2],b[3],cen,col,em)}
function strips(a,b,c,d,cen,col){const n=4,L=(p,q,t)=>[mix(p[0],q[0],t),mix(p[1],q[1],t),mix(p[2],q[2],t)];
 for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n;quad(L(a,d,t0),L(b,c,t0),L(b,c,t1),L(a,d,t1),cen,shade(col,k%2?.8:1))}}
function roof(tf,cx,y0,cz,hw,hd,o,h,col){const lift=Math.min(.55,h*.45),
 B=CN.map(([a,e])=>tf(cx+a*(hw+o),y0+lift,cz+e*(hd+o))),Tp=CN.map(([a,e])=>tf(cx+a*hw*.2,y0+h,cz+e*hd*.2)),cen=tf(cx,y0+h*.3,cz),
 md=(p,q,dy=0)=>[(p[0]+q[0])/2,(p[1]+q[1])/2+dy,(p[2]+q[2])/2];
 for(let i=0;i<4;i++){const j=(i+1)%4,m=md(B[i],B[j],-lift),tm=md(Tp[i],Tp[j]);strips(B[i],m,tm,Tp[i],cen,col);strips(m,B[j],Tp[j],tm,cen,col)}  // tepi atap melengkung ke atas
 quad(Tp[0],Tp[1],Tp[2],Tp[3],cen,col);
 const lo=CN.map(([a,e])=>tf(cx+a*(hw+o),y0+lift*.15,cz+e*(hd+o)));quad(lo[0],lo[1],lo[2],lo[3],tf(cx,y0+4,cz),[.18,.07,.05])}
function cone(x,y,z,r0,r1,hh,col,sg=7,em=0){const k=(r0-r1)/hh;for(let i=0;i<sg;i++){const a0=i/sg*6.2832,a1=(i+1)/sg*6.2832,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),
 b0=[x+c0*r0,y,z+s0*r0],b1=[x+c1*r0,y,z+s1*r0],t0=[x+c0*r1,y+hh,z+s0*r1],t1=[x+c1*r1,y+hh,z+s1*r1],n0=nrm([c0,k,s0]),n1=nrm([c1,k,s1]),cc=shade(col,.9+.04*(i%5));
 tri(b0,b1,t1,n0,n1,n1,cc,em);tri(b0,t1,t0,n0,n1,n0,cc,em)}}
function blob(x,y,z,rx,ry,col,sg=8,rg=5){const V=[];
 for(let a=0;a<=rg;a++){const ph=a/rg*Math.PI,r=Math.sin(ph),yy=Math.cos(ph),row=[];
  for(let b=0;b<sg;b++){const th=b/sg*6.2832,q=(a==0||a==rg)?1:.86+.28*R();row.push({p:[x+Math.cos(th)*r*rx*q,y+yy*ry*q,z+Math.sin(th)*r*rx*q],n:nrm([Math.cos(th)*r/rx,yy/ry,Math.sin(th)*r/rx])})}V.push(row)}
 for(let a=0;a<rg;a++)for(let b=0;b<sg;b++){const b2=(b+1)%sg,A=V[a][b],B=V[a][b2],C=V[a+1][b2],E=V[a+1][b],cc=shade(col,.88+.24*R());tri(A.p,B.p,C.p,A.n,B.n,C.n,cc,0);tri(A.p,C.p,E.p,A.n,C.n,E.n,cc,0)}}

const FH=2.35,WALLS=[[.58,.52,.42],[.52,.54,.60],[.62,.48,.38]],TILES=[[.55,.14,.12],[.22,.30,.38],[.42,.12,.15]];
function placeHouses(){const hs=[];let tr=0;
 while(hs.length<CFG.houses&&tr++<5000){const d=22+148*Math.pow(R(),1.25),x=mea(d)+(R()<.5?-1:1)*rr(8,38),z=-d,y=th0(x,z);
  if(y>12||y<-1.5)continue;
  const e=2,sl=Math.hypot(th0(x+e,z)-th0(x-e,z),th0(x,z+e)-th0(x,z-e))/(2*e);if(sl>.22)continue;
  const w=rr(1.9,3.3),r=w*1.6+4;if(hs.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+r))continue;
  const dx=mea(d)-x;
  hs.push({x,z,y:y+.05,w,r,ar:rr(.8,1),fl:hs.length<3?6+((R()*2)|0):3+((R()*4)|0),rot:Math.atan2(dx,rr(-.8,.8)*Math.abs(dx))});
  pads.push([x,z,y+.05,r])}
 return hs.sort((a,b)=>b.z-a.z)}
function house(o){const{x,z,y,w,fl,rot,ar}=o,co=Math.cos(rot),si=Math.sin(rot),tf=(a,b,c)=>[x+a*co+c*si,y+b,z-a*si+c*co],
 wall=pick(WALLS),wood=[.34,.12,.09],tile=pick(TILES),stone=[.40,.41,.50],gold=[.95,.72,.25],red=[1,.2,.1];
 VIS=moonVis(x,y+5,z,3);
 box(tf,0,-.2,0,w*1.15,.9,w*ar*1.15,stone);
 let yb=.6;
 for(let f=0;f<fl;f++){const k=1-.075*f,hw=w*k,hd=w*ar*k,top=f==fl-1;let glowed=false;
  box(tf,0,yb,0,hw,FH,hd,wall);
  for(const sx of[-1,1])for(const sz of[-1,1])box(tf,sx*hw,yb,sz*hd,.14,FH,.14,wood);
  box(tf,0,yb+FH-.12,0,hw+.09,.24,hd+.09,wood);
  for(let s=0;s<4;s++){const nx=[0,1,0,-1][s],nz=[1,0,-1,0][s],tx=nz,tz=-nx,wl=s%2?hd:hw,off=s%2?hw:hd,nw=wl>1.8?2:1;
   for(let q=0;q<nw;q++){const u=nw>1?(q?.5:-.5)*wl:0,lit=R()<.78,cc=lit?[1,.74,.38]:[.09,.12,.26],cx_=nx*(off+.04)+tx*u,cz_=nz*(off+.04)+tz*u,yc=yb+1.25,
    P4=CN.map(([a,b])=>tf(cx_+tx*a*.36,yc+b*.5,cz_+tz*a*.36));
    quad(P4[0],P4[1],P4[2],P4[3],tf(0,yb+1.2,0),cc,lit?1:0);
    if(lit&&!glowed&&R()<.6){glowed=true;glw(tf(cx_+nx*.4,yc,cz_+nz*.4),3.2,'gg',.5)}}}
  roof(tf,0,yb,0,hw,hd,.95,top?2.9:1.2,tile);
  if(f>=fl-2)for(const sx of[-1,1])for(const sz of[-1,1]){box(tf,sx*(hw+.82),yb-.15,sz*(hd+.82),.13,.38,.13,red,1.4);if(R()<.5)glw(tf(sx*(hw+.82),yb+.05,sz*(hd+.82)),1.5,'gr',.9)}
  yb+=FH}
 box(tf,0,yb-FH+2.6,0,.06,1.5,.06,gold,.4)}
function posts(){for(let d=8;d<170;d+=rr(13,17))for(const s of[-1,1]){const x=mea(d)+s*2.6,z=-d;if(pads.some(p=>Math.hypot(x-p[0],z-p[1])<p[3]))continue;
 const y=TH(x,z),tf=(a,b,c)=>[x+a,y+b,z+c];VIS=1;
 box(tf,0,0,0,.05,2.3,.05,[.3,.1,.08]);box(tf,0,1.9,0,.2,.4,.2,[1,.2,.1],1.4);box(tf,0,2.3,0,.28,.07,.28,[.2,.07,.05]);glw([x,y+2.1,z],2,'gr',.9)}}
function tree(x,y,z){const s=rr(.8,1.5),h=rr(6,11)*s,g=[rr(.06,.12),rr(.2,.32),rr(.1,.16)];VIS=moonVis(x,y+h*.5,z,3);
 cone(x,y-.3,z,.28*s,.16*s,h*.5,[.26,.17,.12],6);
 if(R()<.55){for(let i=0;i<4;i++)cone(x,y+h*(.2+.18*i),z,h*(.30-.055*i),h*.02,h*.34,g,8)}   // cemara
 else{blob(x,y+h*.62,z,h*.3,h*.26,g);blob(x+h*.14,y+h*.5,z+h*.06,h*.2,h*.18,g);blob(x-h*.12,y+h*.55,z-h*.08,h*.2,h*.2,g)}}   // pohon rindang
function trees(){let n=0,tr=0;while(n<CFG.trees&&tr++<9000){const d=6+300*Math.pow(R(),1.7),x=CAM0[0]+(R()*2-1)*(40+d*1.2),z=-d;
 if(d<200&&Math.abs(x-mea(d))<5.5)continue;if(d<45&&Math.abs(x-CAM0[0])<d*.6+8)continue;if(fbm(x*.03+9,z*.03,3)<.5)continue;
 const y=TH(x,z);if(y>44||y<-2)continue;const e=1.5;if(Math.hypot(TH(x+e,z)-TH(x-e,z),TH(x,z+e)-TH(x,z-e))/(2*e)>.8)continue;
 if(pads.some(p=>Math.hypot(x-p[0],z-p[1])<p[3]*1.15))continue;tree(x,y,z);n++}}

/* ---------- terrain ---------- */
const GRA=[.20,.36,.16],GRB=[.27,.43,.16],GRD=[.10,.22,.13],ROCK=[.34,.35,.45],DIRT=[.42,.32,.24];
function buildTerrain(){const NR=mob?120:170,NC=mob?150:210,NV=NR*NC,P=new Float32Array(NV*3),N=new Float32Array(NV*3),C=new Float32Array(NV*3),M=new Float32Array(NV*2);
 let k=0;
 for(let j=0;j<NR;j++){const t=j/(NR-1),d=-30+470*Math.pow(t,2.2),hw=34+Math.max(d,0)*1.25;       // jaring rapat di dekat, jarang di jauh
  for(let i=0;i<NC;i++,k++){const x=(i/(NC-1)*2-1)*hw,z=-d;P[k*3]=x;P[k*3+1]=TH(x,z);P[k*3+2]=z}}
 k=0;
 for(let j=0;j<NR;j++)for(let i=0;i<NC;i++,k++){
  const a=(j*NC+Math.max(i-1,0))*3,b=(j*NC+Math.min(i+1,NC-1))*3,c=(Math.max(j-1,0)*NC+i)*3,e=(Math.min(j+1,NR-1)*NC+i)*3,
  tx=[P[b]-P[a],P[b+1]-P[a+1],P[b+2]-P[a+2]],tz=[P[c]-P[e],P[c+1]-P[e+1],P[c+2]-P[e+2]],
  n=nrm([tz[1]*tx[2]-tz[2]*tx[1],tz[2]*tx[0]-tz[0]*tx[2],tz[0]*tx[1]-tz[1]*tx[0]]),
  x=P[k*3],y=P[k*3+1],z=P[k*3+2],d=-z,ax=Math.abs(x-mea(Math.max(d,0)));
  N[k*3]=n[0];N[k*3+1]=n[1];N[k*3+2]=n[2];
  let col=mc(GRA,GRB,fbm(x*.08,z*.08,3));
  col=mc(col,GRD,ss(.5,.62,fbm(x*.03+9,z*.03,3))*.8);
  col=mc(col,ROCK,cl(ss(.3,.5,1-n[1])+ss(32,62,y)*.7));
  if(d<190)col=mc(col,DIRT,(1-ss(1.3,2.8,ax))*.9);
  for(let q=0;q<pads.length;q++){const p=pads[q],pd=Math.hypot(x-p[0],z-p[1]);if(pd<p[3]*1.5)col=mc(col,DIRT,(1-ss(p[3]*.8,p[3]*1.5,pd))*.7)}
  C[k*3]=col[0];C[k*3+1]=col[1];C[k*3+2]=col[2];M[k*2]=0;M[k*2+1]=moonVis(x,y,z,5)}
 const I=new Uint32Array((NR-1)*(NC-1)*6);let q=0;
 for(let j=0;j<NR-1;j++)for(let i=0;i<NC-1;i++){const a=j*NC+i,b=a+1,c=a+NC,d=c+1;I[q++]=a;I[q++]=c;I[q++]=b;I[q++]=b;I[q++]=c;I[q++]=d}
 return{P,N,C,M,I}}

/* ---------- rumput ---------- */
function buildGrass(){const n=CFG.grass,AO=new Float32Array(n*4),AP=new Float32Array(n*4);let k=0,tr=0;
 while(k<n&&tr++<n*3){const d=.5+Math.pow(R(),2.2)*100,x=CAM0[0]+(R()*2-1)*(d*.95+9),z=-d;
  if(d<160&&Math.abs(x-mea(d))<1.6)continue;
  let bad=false;for(let i=0;i<pads.length;i++){const p=pads[i];if(Math.hypot(x-p[0],z-p[1])<p[3]*.95){bad=true;break}}if(bad)continue;
  const y=TH(x,z);if(y>26)continue;const e=.7,gx=(TH(x+e,z)-TH(x-e,z))/(2*e),gz=(TH(x,z+e)-TH(x,z-e))/(2*e);if(1/Math.sqrt(1+gx*gx+gz*gz)<.8)continue;
  AO[k*4]=x;AO[k*4+1]=y-.05;AO[k*4+2]=z;AO[k*4+3]=moonVis(x,y,z,3);
  AP[k*4]=R()*6.2832;AP[k*4+1]=rr(.5,1.05)*(1+d*.01)*(1-ss(75,100,d));AP[k*4+2]=rr(.045,.085)*(1+d*.012);AP[k*4+3]=R();k++}
 return{AO:AO.subarray(0,k*4),AP:AP.subarray(0,k*4),n:k}}

/* ---------- shader ---------- */
const COMMON=`#version 300 es
precision highp float;
uniform mat4 u_vp;uniform vec3 u_cam,u_fog,u_L,u_moon,u_sky,u_gnd,u_plc;uniform float u_fogD;uniform vec4 u_pl[12];
float fogF(vec3 p){float d=length(p-u_cam);float f=1.-exp(-pow(d*u_fogD,1.6));float m=exp(-max(p.y,0.)*.05)*.28*smoothstep(25.,220.,d);return clamp(f+m*(1.-f),0.,1.);}
vec3 plights(vec3 p,vec3 n){vec3 s=vec3(0.);for(int i=0;i<12;i++){vec3 d=u_pl[i].xyz-p;float r=u_pl[i].w;float a=max(1.-dot(d,d)/(r*r),0.);a*=a;s+=a*(max(dot(n,normalize(d+1e-4)),0.)*.75+.25);}return s*u_plc;}
`;
const VS_M=COMMON+`layout(location=0)in vec3 a_pos;layout(location=1)in vec3 a_nrm;layout(location=2)in vec3 a_col;layout(location=3)in vec2 a_mat;
out vec3 v_p;out vec3 v_n;out vec3 v_c;out vec2 v_m;
void main(){v_p=a_pos;v_n=a_nrm;v_c=a_col;v_m=a_mat;gl_Position=u_vp*vec4(a_pos,1.);}`;
const FS_M=COMMON+`in vec3 v_p;in vec3 v_n;in vec3 v_c;in vec2 v_m;out vec4 o;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
void main(){vec3 n=normalize(v_n);float dist=length(v_p-u_cam);
 vec2 q=n.y>.6?v_p.xz:vec2(v_p.x+v_p.z,v_p.y);
 float dt=vn(q*2.3)*.55+vn(q*7.1)*.3+vn(q*21.)*.15;
 vec3 alb=v_c*mix(1.,.72+.56*dt,1.-smoothstep(40.,170.,dist));
 float ndl=max(dot(n,u_L),0.)*v_m.y;
 vec3 amb=mix(u_gnd,u_sky,n.y*.5+.5);
 vec3 c=alb*(amb+u_moon*ndl)+alb*plights(v_p,n)+v_c*v_m.x*1.5;
 c=mix(c,u_fog,fogF(v_p));
 c+=(hs(gl_FragCoord.xy)-.5)/255.;
 o=vec4(c,1.);}`;
const VS_G=COMMON+`layout(location=0)in vec2 a_t;layout(location=1)in vec4 a_o;layout(location=2)in vec4 a_p;uniform float u_time;out vec3 v_c;
void main(){float v=a_t.y,rot=a_p.x,h=a_p.y,w=a_p.z,tn=a_p.w;
 float bend=(.2+tn*.55)*h*v*v;
 vec3 l=vec3(a_t.x*w,v*h,bend);float co=cos(rot),si=sin(rot);
 vec3 p=a_o.xyz+vec3(l.x*co+l.z*si,l.y,-l.x*si+l.z*co);
 float ws=sin(u_time*1.6+a_o.x*.42+a_o.z*.3)*.55+sin(u_time*3.3+a_o.x*1.25+a_o.z*.9)*.2+.2*sin(u_time*.5+a_o.z*.08);
 p.x+=ws*h*.4*v*v;p.z+=ws*h*.15*v*v;p.y-=abs(ws)*h*.06*v*v;
 vec3 n=normalize(vec3(ws*.25,1.,0.));
 vec3 base=vec3(.05,.13,.06),tip=mix(vec3(.17,.36,.15),vec3(.38,.42,.16),tn*tn),alb=mix(base,tip,v);
 float vis=a_o.w;vec3 amb=mix(u_gnd,u_sky,.5+.45*n.y);
 vec3 c2=alb*(amb*(.55+.45*v)+u_moon*vis*(.5+.4*v))+alb*plights(p,n)+tip*u_moon*vis*.18*v*v;
 c2=mix(c2,u_fog,fogF(p));v_c=c2;gl_Position=u_vp*vec4(p,1.);}`;
const FS_G=`#version 300 es
precision highp float;in vec3 v_c;out vec4 o;void main(){o=vec4(v_c,1.);}`;

/* ---------- WebGL ---------- */
let PM,PG,vT,vH,vG,nI=0,nH=0,nG=0,PLA=new Float32Array(48);
const ul=(p,n)=>{p.u=p.u||{};return n in p.u?p.u[n]:(p.u[n]=GL.getUniformLocation(p,n))};
function vao(attrs,idx){const v=GL.createVertexArray();GL.bindVertexArray(v);
 for(const[data,loc,size,div]of attrs){const b=GL.createBuffer();GL.bindBuffer(GL.ARRAY_BUFFER,b);GL.bufferData(GL.ARRAY_BUFFER,data,GL.STATIC_DRAW);GL.enableVertexAttribArray(loc);GL.vertexAttribPointer(loc,size,GL.FLOAT,false,0,0);if(div)GL.vertexAttribDivisor(loc,1)}
 if(idx){const b=GL.createBuffer();GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER,b);GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,idx,GL.STATIC_DRAW)}
 GL.bindVertexArray(null);return v}
function prog(vs,fs){const sh=(t,s)=>{const o=GL.createShader(t);GL.shaderSource(o,s);GL.compileShader(o);if(!GL.getShaderParameter(o,GL.COMPILE_STATUS))throw new Error(GL.getShaderInfoLog(o));return o};
 const p=GL.createProgram();GL.attachShader(p,sh(GL.VERTEX_SHADER,vs));GL.attachShader(p,sh(GL.FRAGMENT_SHADER,fs));GL.linkProgram(p);
 if(!GL.getProgramParameter(p,GL.LINK_STATUS))throw new Error(GL.getProgramInfoLog(p));return p}
function initScene(){
 GL=cvG.getContext('webgl2',{antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});
 if(!GL){console.warn('Lentera: WebGL2 tidak tersedia, hanya langit 2D yang ditampilkan.');return}
 PM=prog(VS_M,FS_M);PG=prog(VS_G,FS_G);
 sd=77;
 const hs=placeHouses(),ter=buildTerrain();
 for(const o of hs)house(o);posts();trees();
 gy0=TH(CAM0[0],0);
 hs.slice(0,12).forEach((o,i)=>{PLA.set([o.x,o.y+3.5,o.z,24],i*4)});
 vT=vao([[ter.P,0,3],[ter.N,1,3],[ter.C,2,3],[ter.M,3,2]],ter.I);nI=ter.I.length;
 vH=vao([[new Float32Array(G.p),0,3],[new Float32Array(G.n),1,3],[new Float32Array(G.c),2,3],[new Float32Array(G.m),3,2]]);nH=G.p.length/3;
 const gr=buildGrass(),GT=new Float32Array([-1,0,1,0,-.6,.4,.6,.4,-.25,.75,.25,.75,0,1]),GI=new Uint16Array([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6]);
 vG=vao([[GT,0,2,0],[gr.AO,1,4,1],[gr.AP,2,4,1]],GI);nG=gr.n;
 GLok=true;cvG.style.opacity=1}

/* ---------- kamera ---------- */
const mm=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o};
function viewProj(e,yaw,pit,asp){const cp=Math.cos(pit),f=[Math.sin(yaw)*cp,Math.sin(pit),-Math.cos(yaw)*cp],sl=Math.hypot(f[2],f[0]),s=[-f[2]/sl,0,f[0]/sl],
 u=[-s[2]*f[1],s[2]*f[0]-s[0]*f[2],s[0]*f[1]],
 V=new Float32Array([s[0],u[0],-f[0],0,s[1],u[1],-f[1],0,s[2],u[2],-f[2],0,-(s[0]*e[0]+s[1]*e[1]+s[2]*e[2]),-(u[0]*e[0]+u[1]*e[1]+u[2]*e[2]),f[0]*e[0]+f[1]*e[1]+f[2]*e[2],1]),
 t=1/Math.tan(FOV/2),n=.3,fa=900,P=new Float32Array([t/asp,0,0,0,0,t,0,0,0,0,(fa+n)/(n-fa),-1,0,0,2*fa*n/(n-fa),0]);
 return mm(P,V)}
const prj=p=>{const m=VP,x=p[0],y=p[1],z=p[2],w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.3)return null;
 return[((m[0]*x+m[4]*y+m[8]*z+m[12])/w*.5+.5)*W,(1-((m[1]*x+m[5]*y+m[9]*z+m[13])/w*.5+.5))*H,w]};

function renderGL(eye){
 GL.viewport(0,0,W,H);GL.clearColor(0,0,0,0);GL.clear(GL.COLOR_BUFFER_BIT|GL.DEPTH_BUFFER_BIT);GL.enable(GL.DEPTH_TEST);GL.disable(GL.CULL_FACE);
 const fl=1.15+.07*Math.sin(T*5)*Math.sin(T*2.3),plc=[1.0*fl,.58*fl,.25*fl];
 const common=p=>{GL.useProgram(p);GL.uniformMatrix4fv(ul(p,'u_vp'),false,VP);GL.uniform3fv(ul(p,'u_cam'),eye);GL.uniform3fv(ul(p,'u_fog'),HZ);GL.uniform1f(ul(p,'u_fogD'),CFG.fogD);
  GL.uniform3fv(ul(p,'u_L'),LD);GL.uniform3fv(ul(p,'u_moon'),MOON);GL.uniform3fv(ul(p,'u_sky'),SKYA);GL.uniform3fv(ul(p,'u_gnd'),GND);GL.uniform4fv(ul(p,'u_pl'),PLA);GL.uniform3fv(ul(p,'u_plc'),plc)};
 common(PM);GL.bindVertexArray(vT);GL.drawElements(GL.TRIANGLES,nI,GL.UNSIGNED_INT,0);GL.bindVertexArray(vH);GL.drawArrays(GL.TRIANGLES,0,nH);
 common(PG);GL.uniform1f(ul(PG,'u_time'),T);GL.bindVertexArray(vG);GL.drawElementsInstanced(GL.TRIANGLES,15,GL.UNSIGNED_SHORT,0,nG);
 GL.bindVertexArray(null)}

/* ---------- sprite layar (lentera, awan) ---------- */
function skyL(){const[c,g]=mk(60,96);g.translate(30,0);const bt=17,bw=26,bh=70,y0=8;
 g.beginPath();g.moveTo(-bt,y0);g.quadraticCurveTo(0,y0-8,bt,y0);g.lineTo(bw,y0+bh);g.lineTo(-bw,y0+bh);g.closePath();
 const r=g.createLinearGradient(0,y0,0,y0+bh);r.addColorStop(0,'#7a1608');r.addColorStop(.45,'#e04a14');r.addColorStop(.8,'#ffb23d');r.addColorStop(1,'#fff0a8');g.fillStyle=r;g.fill();
 g.strokeStyle='rgba(90,20,5,.35)';g.lineWidth=1.2;[-.5,0,.5].forEach(k=>{g.beginPath();g.moveTo(k*bt*1.2,y0);g.lineTo(k*bw*1.2,y0+bh);g.stroke()});
 g.fillStyle='rgba(60,15,5,.9)';g.beginPath();g.ellipse(0,y0+bh,bw,5,0,0,7);g.fill();
 const f=g.createRadialGradient(0,y0+bh-4,0,0,y0+bh-4,16);f.addColorStop(0,'rgba(255,250,200,1)');f.addColorStop(1,'rgba(255,170,60,0)');g.fillStyle=f;g.fillRect(-20,y0+bh-24,40,36);return c}
function roundL(){const[c,g]=mk(80,120);g.translate(40,0);g.strokeStyle='#c9922e';g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(0,18);g.stroke();
 const cy=58,rx=32,ry=36,r=g.createRadialGradient(-6,cy-8,4,0,cy,rx*1.2);r.addColorStop(0,'#ff8a50');r.addColorStop(.5,'#e0261c');r.addColorStop(1,'#7a0a0c');
 g.fillStyle=r;g.beginPath();g.ellipse(0,cy,rx,ry,0,0,7);g.fill();g.strokeStyle='rgba(70,5,5,.45)';g.lineWidth=1.4;
 for(let k=0;k<=3;k++){g.beginPath();g.ellipse(0,cy,rx*k/3.4+.01,ry,0,0,7);g.stroke()}
 g.fillStyle='#e0b24a';g.fillRect(-15,cy-ry-4,30,9);g.fillRect(-15,cy+ry-5,30,9);
 g.strokeStyle='#e0b24a';g.lineWidth=1.6;g.beginPath();g.moveTo(0,cy+ry+4);g.lineTo(0,cy+ry+24);g.moveTo(-3,cy+ry+4);g.lineTo(-5,cy+ry+22);g.moveTo(3,cy+ry+4);g.lineTo(5,cy+ry+22);g.stroke();return c}
function cloud(w,h){const[c,g]=mk(w,h);for(let k=0;k<2;k++)for(let i=0;i<70;i++){const x=w*(.1+.8*R()),y=h*(.5+(R()-.5)*.8*Math.sin(Math.PI*x/w))-(k?h*.05:0),r=h*rr(.12,.3),col=k?'150,165,255':'58,60,150',q=g.createRadialGradient(x+(k?r*.25:0),y,0,x,y,r);q.addColorStop(0,`rgba(${col},${k?.1:.17})`);q.addColorStop(1,`rgba(${col},0)`);g.fillStyle=q;g.fillRect(x-r,y-r,2*r,2*r)}return c}

/* ---------- aset yang bergantung ukuran layar ---------- */
function layout(){sd=9;dp=Math.min(devicePixelRatio||1,mob?1.25:1.5);W=innerWidth*dp|0;H=innerHeight*dp|0;U=Math.min(W,H*1.5);
 for(const c of[cvS,cvG,cvF]){c.width=W;c.height=H}
 const mr=Lx.mr=U*.055;Lx.gg=glow('255,190,90');Lx.gr=glow('255,80,40');Lx.gm=glow('190,210,255');Lx.gv=glow('185,70,255');Lx.gf=glow('200,255,120');
 if(!Lx.sl){Lx.sl=skyL();Lx.rd=roundL()}
 let s,g,q;
 [s,g]=mk(mr*2+4,mr*2+4);g.translate(mr+2,mr+2);g.save();g.beginPath();g.arc(0,0,mr,0,7);g.clip();g.fillStyle='#f6f2e4';g.fillRect(-mr,-mr,mr*2,mr*2);
 for(let i=0;i<9;i++){const x=rr(-.6,.6)*mr,y=rr(-.6,.6)*mr,r=rr(.12,.3)*mr;q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(120,125,150,.24)');q.addColorStop(1,'rgba(120,125,150,0)');g.fillStyle=q;g.fillRect(x-r,y-r,r*2,r*2)}
 for(let i=0;i<16;i++){g.strokeStyle='rgba(100,105,130,.12)';g.beginPath();g.arc(rr(-.8,.8)*mr,rr(-.8,.8)*mr,rr(.03,.08)*mr,0,7);g.stroke()}
 q=g.createRadialGradient(-mr*.2,-mr*.2,mr*.5,0,0,mr);q.addColorStop(0,'rgba(60,70,110,0)');q.addColorStop(1,'rgba(60,70,110,.3)');g.fillStyle=q;g.fillRect(-mr,-mr,mr*2,mr*2);g.restore();Lx.moon=s;
 Lx.st=Array.from({length:150},()=>[R(),R()*.6,rr(.8,2.2),rr(.5,2.5),R()*9]);
 const cs=[0,1,2,3].map(()=>cloud(U*.9,U*.28));Lx.cl=Array.from({length:6},(_,i)=>({i:cs[i%4],y:rr(.03,.38),o:rr(0,W*2),sp:(5+R()*9)*dp,a:rr(.35,.7)}));
 [s,g]=mk(W*2,H*.3);for(let i=0;i<50;i++){const x=R()*W*2,y=H*.15+(R()-.5)*H*.1,r=rr(.08,.2)*W;q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(140,160,255,.1)');q.addColorStop(1,'rgba(140,160,255,0)');g.save();g.translate(0,y);g.scale(1,.25);g.translate(0,-y);g.fillStyle=q;g.fillRect(x-r,y-r,r*2,r*2);g.restore()}Lx.ms=s;
 Lx.lt=Array.from({length:mob?7:12},()=>({x:R(),y:rr(0,1.2),z:rr(.2,1),ph:R()*9}));
 Lx.em=Array.from({length:mob?16:34},()=>({x:R(),y:rr(.58,1),ph:R()*9,s:rr(.6,1.5)}));
 [s,g]=mk(W,H);q=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);q.addColorStop(0,'rgba(2,4,22,0)');q.addColorStop(1,'rgba(2,4,22,.6)');g.fillStyle=q;g.fillRect(0,0,W,H);
 q=g.createLinearGradient(0,0,0,H);q.addColorStop(0,'rgba(2,4,22,.35)');q.addColorStop(.3,'rgba(2,4,22,0)');q.addColorStop(.7,'rgba(2,4,22,0)');q.addColorStop(1,'rgba(2,4,22,.4)');g.fillStyle=q;g.fillRect(0,0,W,H);Lx.vg=s;
 [s,g]=mk(128,128);const im=g.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){im.data[i]=im.data[i+1]=im.data[i+2]=R()*255;im.data[i+3]=255}g.putImageData(im,0,0);Lx.gp=F.createPattern(s,'repeat')}

/* ---------- naga: rekaman dari video (sprite sheet naga.webp, 100 frame @10fps) ---------- */
const DF={w:288,h:512,cols:10,n:100,fps:10};let DG=null,DS=null;
{const im=new Image();im.onload=()=>{DG=im;DS=mk(DF.w,DF.h)};im.src=window.LENTERA_DRAGON||'naga.webp'}
function dragon(ox,oy){if(!DG)return;const a=T%34-3,dur=15;if(a<0||a>dur)return;
 const sm=v=>{v=cl(v);return v*v*(3-2*v)},p=a/dur,z=Math.pow(Math.sin(Math.PI*p),.8),
 pos=q=>{const s=-.2+1.4*(q*.5+sm(q)*.5);return[W*(-.1+1.2*s)+Math.sin(s*8)*U*.02+ox*.4,H*(.34+.045*Math.sin(s*5.2+.5)+.025*Math.sin(s*12.5))+oy*.5]},
 [x,y0]=pos(p),[x2,y2]=pos(Math.min(1,p+.01)),an=cl(Math.atan2(y2-y0,x2-x)*.5,-.3,.3),
 sh=Math.min(H*.85,U*.62)*(.45+.62*z)*(1+.012*Math.sin(T*1.7)),sw=sh*DF.w/DF.h,y=y0+(1-z)*H*.06+Math.sin(T*1.3)*sh*.012;
 if(x<-sw||x>W+sw)return;
 const fade=sm(p/.14)*sm((1-p)/.14),f=(T*DF.fps)%DF.n,i=f|0,j=(i+1)%DF.n,k=f-i,g=DS[1],
 cell=(n,al,op)=>{g.globalAlpha=al;g.globalCompositeOperation=op;g.drawImage(DG,(n%DF.cols)*DF.w,((n/DF.cols)|0)*DF.h,DF.w,DF.h,0,0,DF.w,DF.h)};
 g.clearRect(0,0,DF.w,DF.h);cell(i,1-k,'source-over');cell(j,k,'lighter');
 g.globalAlpha=1;g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(55,75,185,${(1-z)*.5})`;g.fillRect(0,0,DF.w,DF.h);g.globalCompositeOperation='source-over';
 S.globalCompositeOperation='lighter';gw(S,Lx.gv,x,y+sh*.1,sh*.75,.14*z*fade);S.globalCompositeOperation='source-over';
 S.save();S.translate(x,y);S.rotate(an+Math.sin(T*.9)*.035);S.globalAlpha=fade;S.imageSmoothingQuality='high';S.drawImage(DS[0],-sw*.5,-sh*.42,sw,sh);S.restore();S.globalAlpha=1}

/* ---------- langit ---------- */
function drawSky(yh,ox,oy){
 const g=S.createLinearGradient(0,0,0,yh);g.addColorStop(0,'#03061c');g.addColorStop(.55,'#141a62');g.addColorStop(1,HZC);
 S.globalCompositeOperation='source-over';S.fillStyle=g;S.fillRect(0,0,W,yh+1);S.fillStyle=HZC;S.fillRect(0,yh,W,H-yh);
 S.fillStyle='#e8eeff';
 for(const s of Lx.st){const y=s[1]/.6*yh*.93+oy*.3;if(y>yh*.95)continue;S.globalAlpha=(.25+.6*Math.abs(Math.sin(T*s[3]+s[4])))*(1-y/yh*.5);S.fillRect(((s[0]*W+ox*.3)%W+W)%W,y,s[2]*dp,s[2]*dp)}
 S.globalAlpha=1;
 const mx=W*.8+ox*.5,my=H*.2+oy*.5,mr=Lx.mr;
 S.globalCompositeOperation='lighter';gw(S,Lx.gm,mx,my,mr*6,.45+.05*Math.sin(T*.5));S.globalCompositeOperation='source-over';S.drawImage(Lx.moon,mx-mr-2,my-mr-2);
 for(const c of Lx.cl){const x=((T*c.sp+c.o)%(W+c.i.width))-c.i.width;S.globalAlpha=c.a;S.drawImage(c.i,x,c.y*H+oy*.5);S.globalAlpha=1}
 dragon(ox,oy)}

/* ---------- efek depan: kabut, cahaya jendela, lentera, kunang-kunang ---------- */
function strg(x0,y0,x1,y1,sag,n,sz,ph){const pos=f=>[x0+(x1-x0)*f,y0+(y1-y0)*f+sag*4*f*(1-f)+Math.sin(T*.5+ph+f*3)*U*.004];
 F.strokeStyle='rgba(222,170,80,.75)';F.lineWidth=1.3*dp;F.beginPath();for(let i=0;i<=30;i++){const[x,y]=pos(i/30);i?F.lineTo(x,y):F.moveTo(x,y)}F.stroke();
 for(let k=0;k<n;k++){const[x,y]=pos((k+.5)/n),fl=.8+.2*Math.sin(T*7+k*3)*Math.sin(T*3.3+k);
  F.globalCompositeOperation='lighter';gw(F,Lx.gr,x,y+sz*.75,sz*2.2,.55*fl);F.globalCompositeOperation='source-over';
  F.save();F.translate(x,y);F.rotate(Math.sin(T*1.1+k*1.7+ph)*.08);F.drawImage(Lx.rd,-sz*.5,0,sz,sz*1.5);F.restore()}}
function drawFX(dt,yh,ox,oy,fpx,eye){
 F.globalCompositeOperation='source-over';F.clearRect(0,0,W,H);
 const mw=Lx.ms.width;
 for(const[k,y,a]of[[5,yh-H*.08,.6],[9,yh+H*.1,.45]]){const x=-((T*k*dp)%mw);F.globalAlpha=a;F.drawImage(Lx.ms,x,y);F.drawImage(Lx.ms,x+mw,y)}F.globalAlpha=1;
 if(GLok){F.globalCompositeOperation='lighter';
  for(let i=0;i<GLW.length;i++){const l=GLW[i];
   if((i+fc)%6===0){let vis=1;for(let s=1;s<10;s++){const t=s/10,px=eye[0]+(l.p[0]-eye[0])*t,pz=eye[2]+(l.p[2]-eye[2])*t,py=eye[1]+(l.p[1]-eye[1])*t;if(TH(px,pz)>py+.6){vis=0;break}}l.t=vis}
   l.v+=(l.t-l.v)*.15;if(l.v<.02)continue;
   const q=prj(l.p);if(!q)continue;const r=l.s*fpx/q[2];if(r<2||q[0]<-r||q[0]>W+r||q[1]<-r||q[1]>H+r)continue;
   const fl=.85+.15*Math.sin(T*6+l.ph)*Math.sin(T*2.7+l.ph*2);
   gw(F,Lx[l.c],q[0],q[1],r*(l.c=='gr'?1.6:1.2),l.a*l.v*fl*Math.exp(-q[2]*.0045))}}
 // lentera langit
 for(const l of Lx.lt){l.y-=dt*(.012+.02*l.z);if(l.y<-.1){l.y=1.1;l.x=R()}
  const sz=U*(.022+.04*l.z),x=W*l.x+Math.sin(T*.5+l.ph)*U*.02*l.z-cm.x*l.z*U*.01,y=H*l.y,fl=.8+.2*Math.sin(T*7+l.ph*3)*Math.sin(T*3.3+l.ph);
  F.globalCompositeOperation='lighter';gw(F,Lx.gg,x,y+sz*.9,sz*(2.4+l.z),.55*l.z*fl);F.globalCompositeOperation='source-over';
  F.save();F.translate(x,y);F.rotate(Math.sin(T*.8+l.ph)*.05);F.globalAlpha=.55+.45*l.z;F.drawImage(Lx.sl,-sz/2,0,sz,sz*1.6);F.restore();F.globalAlpha=1}
 // kunang-kunang di atas rumput
 F.globalCompositeOperation='lighter';
 for(const e of Lx.em){e.x+=Math.cos(T*.35+e.ph)*dt*.012;e.y+=Math.sin(T*.5+e.ph*2)*dt*.01;if(e.y<.55)e.y=.55;if(e.y>1.02)e.y=1.02;
  gw(F,Lx.gf,W*(((e.x%1)+1)%1)-cm.x*U*.004,H*e.y,e.s*(3+e.y*5)*dp,Math.max(0,.1+.6*Math.sin(T*1.7+e.ph*3)))}
 F.globalCompositeOperation='source-over';
 const m=mob?3:5,z=U*.05;strg(-W*.02,H*.03,W*.3,H*.01,U*.05,m,z,0);strg(W*.7,0,W*1.02,H*.05,U*.05,m,z,2);
 F.drawImage(Lx.vg,0,0);F.globalAlpha=.035;F.fillStyle=Lx.gp;F.fillRect(0,0,W,H);F.globalAlpha=1}

/* ---------- loop ---------- */
function draw(dt){
 const sc=Math.min(scrollY/innerHeight,3),yaw=cm.x*.06+Math.sin(T*.05)*.012,pit=.035-cm.y*.02-sc*.006,
 eye=[CAM0[0]+cm.x*1.6+Math.sin(T*.07)*.7,gy0+CFG.eye-cm.y*.35+sc*.5,-sc*5],
 fpx=H*.5/Math.tan(FOV/2),yh=H*.5+fpx*Math.tan(pit),ox=-Math.tan(yaw)*fpx,oy=(Math.tan(pit)-Math.tan(.035))*fpx;
 VP=viewProj(eye,yaw,pit,W/H);fc++;
 drawSky(yh,ox,oy);
 if(GLok)renderGL(eye);
 drawFX(dt,yh,ox,oy,fpx,eye)}
function frame(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;T+=dt;const k=1-Math.exp(-dt*3);cm.x+=(cm.tx-cm.x)*k;cm.y+=(cm.ty-cm.y)*k;draw(dt);requestAnimationFrame(frame)}
addEventListener('mousemove',e=>{cm.tx=(e.clientX/innerWidth-.5)*2;cm.ty=(e.clientY/innerHeight-.5)*2},{passive:true});
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{layout();if(reduce)draw(0)},150)});

layout();draw(0);
setTimeout(()=>{try{initScene()}catch(err){console.warn('Lentera 3D gagal dibuat:',err);GLok=false}if(reduce)draw(0)},40);   // langit tampil dulu, 3D menyusul
if(!reduce)requestAnimationFrame(frame);
})();