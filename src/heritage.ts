import * as T from 'three';
import {box,rod,material,sign} from './world';
import {facadeBox} from './architecture';
import {buildStreetArchitecture} from './street-architecture';
import type {Point} from './game';
type Factory=(x:number,z:number)=>T.Group;
type Masonry={red:T.MeshStandardMaterial;aged:T.MeshStandardMaterial;cream:T.MeshStandardMaterial;black:T.MeshStandardMaterial};
export const HERITAGE_HEIGHTS:Record<number,number>={4420420:13.13,1846331:14.4,29558915:13.05};
export const AUTHORED_HERITAGE=new Set([4420420,1846331,29558915,3074002]);
// Projective UV mapping rectifies a licensed photograph onto a measured plane.
// Source files remain unaltered. This is not a photogrammetric reconstruction.
export function photoUV(q:Point[],u:number,v:number):Point{
 const [a,b,c,d]=q,dx1=b[0]-c[0],dx2=d[0]-c[0],dx3=a[0]-b[0]+c[0]-d[0],dy1=b[1]-c[1],dy2=d[1]-c[1],dy3=a[1]-b[1]+c[1]-d[1],det=dx1*dy2-dx2*dy1;
 const g=Math.abs(det)<1e-9?0:(dx3*dy2-dx2*dy3)/det,h=Math.abs(det)<1e-9?0:(dx1*dy3-dx3*dy1)/det,w=g*u+h*v+1;
 return [((b[0]-a[0]+g*b[0])*u+(d[0]-a[0]+h*d[0])*v+a[0])/w,((b[1]-a[1]+g*b[1])*u+(d[1]-a[1]+h*d[1])*v+a[1])/w];
}
export function buildHeritage(detail:Factory,m:Masonry,glass:T.MeshStandardMaterial,kit:ReturnType<typeof buildStreetArchitecture>){
 const face=(x:number,z:number,yaw=0)=>{const g=new T.Group();g.position.set(x,0,z);g.rotation.y=yaw;detail(x,z).add(g);return g;};
 const line=(g:T.Group,a:number[],b:number[],r:number,c:number)=>rod(g,new T.Vector3(a[0],a[1],a[2]),new T.Vector3(b[0],b[1],b[2]),r,c);
 const stone=material(0xbeb8a3),stoneLight=0xc8c3af;
 function column(g:T.Group,x:number,z:number,base:number,h:number,r:number){
  for(const [y,rr,hh] of [[base+.14,r*1.35,.28],[base+.37,r*1.14,.18],[base+h-.25,r*1.2,.20]]){const s=new T.Mesh(new T.CylinderGeometry(rr,rr,hh,20),stone);s.position.set(x,y,z);s.castShadow=true;g.add(s);}
  const shaft=new T.Mesh(new T.CylinderGeometry(r*.89,r,h-.72,24),stone);shaft.position.set(x,base+h/2+.1,z);shaft.castShadow=shaft.receiveShadow=true;g.add(shaft);box(g,x,base+h-.03,z,r*2.8,.2,r*2.3,stoneLight);
  for(const side of [-1,1]){const ring=new T.Mesh(new T.TorusGeometry(r*.29,r*.07,7,20),stone);ring.position.set(x+side*r*.84,base+h-.14,z+r*.92);g.add(ring);}
 }
 function stoneWall(g:T.Group,w:number,h:number){facadeBox(g,0,h/2,-.03,w,h,.10,stone);for(let y=.65;y<h;y+=.53){box(g,0,y,.026,w,.009,.018,0x9f9e91);for(let x=-w/2+((Math.floor(y/.53)%2)*.65);x<w/2;x+=1.3)box(g,x,y-.26,.027,.009,.52,.018,0xaaa89a);}}
 // 744 Queen E: the convex Ionic front follows the City's curved wall vertices.
 const bank=face(-188.60,-10.51);const curve=(x:number)=>-0.058*x*x;
 for(let x=-6.0;x<6;x+=.6){const f=new T.Group();f.position.set(x+.3,0,curve(x+.3));f.rotation.y=Math.atan(.116*(x+.3));bank.add(f);stoneWall(f,.64,13.05);for(const y of [10.32,10.54,11.02,11.22,12.92])box(f,0,y,.14,.68,.12,.43,stoneLight);if(Math.round(x*10)%12===0)box(f,0,10.84,.20,.23,.18,.38,0xb1ad9b);}
 for(const x of [-4.6,-1.57,1.57,4.6])column(bank,x,curve(x)+.36,1.15,9.02,.50);
 for(const x of [-3.12,0,3.12]){const f=new T.Group();f.position.set(x,0,curve(x)+.09);f.rotation.y=Math.atan(.116*x);bank.add(f);kit.window(f,0,8.35,2.06,2.02,0x454a45,.11,1);box(f,0,8.35,.18,.065,2,.07,0x494c44);
  kit.window(f,0,3.36,1.87,2.62,0x56594c,.15,0);if(x===0){box(f,0,2.66,.19,1.78,3.0,.09,0x5d2727);for(const xx of [-.43,.43])for(let y=1.47;y<4;y+=.61){box(f,xx,y,.26,.65,.48,.035,0xc2af7a);box(f,xx,y,.285,.54,.38,.02,0x672b28);}}
  box(f,0,5.05,.20,2.25,.16,.40,stoneLight);const medallion=new T.Mesh(new T.TorusGeometry(.63,.08,7,30),stone);medallion.scale.y=.65;medallion.position.set(0,5.75,.18);f.add(medallion);for(let k=0;k<12;k++){const a=k*Math.PI/6;const leaf=new T.Mesh(new T.SphereGeometry(.11,6,4),stone);leaf.scale.set(1.8,.7,.45);leaf.position.set(Math.cos(a)*.64,5.75+Math.sin(a)*.42,.20);leaf.rotation.z=a;f.add(leaf);}}
 const textCanvas=document.createElement('canvas');textCanvas.width=1536;textCanvas.height=96;const tc=textCanvas.getContext('2d')!;tc.clearRect(0,0,1536,96);tc.fillStyle='#7e7b6a';tc.font='45px Georgia';tc.textAlign='center';tc.fillText('THE CANADIAN BANK OF COMMERCE',768,65,1490);const nameMap=new T.CanvasTexture(textCanvas);nameMap.colorSpace=T.SRGBColorSpace;const nameMat=new T.MeshStandardMaterial({map:nameMap,transparent:true,alphaTest:.05,roughness:1});
 for(let k=0;k<32;k++){const x=-5.2+(k+.5)*10.4/32,geom=new T.PlaneGeometry(10.4/32,.58),uv=geom.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(k+uv.getX(i))/32,uv.getY(i));const letter=new T.Mesh(geom,nameMat);letter.position.set(x,10.09,curve(x)+.20);letter.rotation.y=Math.atan(.116*x);bank.add(letter);}
 for(const x of [-5.95,5.95]){box(bank,x,12.2,curve(x)+.01,.60,2.10,.5,stoneLight);box(bank,x,13.26,curve(x),.76,.12,.70,0x827f75);}
 const bankSide=face(-194.98,-22.0,-Math.PI/2);stoneWall(bankSide,19.0,11.65);for(let x=-7.4;x<8;x+=3.6){facadeBox(bankSide,x,5.8,.035,2.8,9.3,.09,m.aged);for(const y of [3.1,8.0])kit.window(bankSide,x,y,1.4,2.6,0x6b6b5d,.13,1);}kit.cornice(bankSide,19,11.5,stoneLight,true);
 for(const x of [-3.8,3.8]){box(bank,x,.50,.9,5.45,1,2.0,stoneLight);for(let xx=x-2.7;xx<x+2.7;xx+=.13){box(bank,xx,1.67,1.80,.029,1.45,.035,0x343e36);const tip=new T.Mesh(new T.ConeGeometry(.055,.13,4),material(0x343e36));tip.position.set(xx,2.46,1.8);bank.add(tip);}for(const y of [1.13,2.22])box(bank,x,y,1.80,5.5,.045,.055,0x343e36);}
 for(let k=0;k<5;k++)box(bank,0,.1+k*.18,1.79-k*.31,1.9,.2,.35,0xb1ad9d);
 // Surviving Smith Block wings: three round-headed upper lights per bay,
 // paired rectangular middle windows, parapet piers and low central infill.
 for(const [cx,w] of [[-534.5,18.0],[-501.7,17.6]]){const smith=face(cx,12.0,Math.PI);for(let k=0;k<3;k++){const x=(k+.5)*w/3-w/2;for(const dx of [-1.45,0,1.45])kit.arch(smith,x+dx,8.5,1.03,2.24,0xa19f88,m.red);for(const dx of [-1.05,1.05])kit.window(smith,x+dx,6.07,1.2,2.05,0xa4a48f,.16,0);kit.window(smith,x,1.97,w/3-.62,3.22,0x667267,.17,2);box(smith,x,3.90,.15,w/3-.18,.58,.35,0x3c4440);for(const xx of [-w/6,w/6])facadeBox(smith,x+xx,8.32,.1,.34,8.85,.28,m.aged);box(smith,x,12.85,.10,w/3-.16,.13,.25,0x95927f);}for(const y of [4.45,7.42,11.44])box(smith,0,y,.15,w,.16,.27,0x8b7458);kit.cornice(smith,w,11.62,0x78614e,true);}
 // Queen/Saulter library: limestone civic facade, giant-order portico and clock.
 const library=face(-131.2,10.72,Math.PI);stoneWall(library,9.08,15.25);
 for(const x of [-3.35,-1.13,1.13,3.35])column(library,x,.67,1.4,10.90,.43);
 for(const x of [-2.23,0,2.23]){kit.window(library,x,9.20,1.34,3.40,0x61675c,.14,1);kit.window(library,x,2.77,1.40,2.70,0x626d60,.16,1);}
 kit.cornice(library,10.5,12.6,stoneLight,true);box(library,0,13.46,.60,10.4,1.25,1.13,stoneLight);
 const ped=new T.Shape();ped.moveTo(-5.45,14.05);ped.lineTo(0,16.82);ped.lineTo(5.45,14.05);ped.closePath();const pediment=new T.Mesh(new T.ExtrudeGeometry(ped,{depth:.6,bevelEnabled:false}),stone);pediment.position.z=.35;library.add(pediment);for(const side of [-1,1])line(library,[side*5.6,14.09,1.05],[0,16.97,1.05],.12,stoneLight);
 for(let x=-4.8;x<5;x+=.27)box(library,x,14.0,1.03,.11,.20,.25,stoneLight);
 const librarySide=face(-123.23,27.8,Math.PI/2);stoneWall(librarySide,25.5,13.7);for(let x=-9.0;x<10;x+=4.35){for(const y of [3.4,7.9,11.45])kit.window(librarySide,x,y,1.60,y>10?1.5:2.3,0x758075,.11,0);box(librarySide,x+1.72,7.2,.1,.40,10.9,.26,stoneLight);}kit.cornice(librarySide,25.6,13.55,stoneLight,true);
 const corner=face(-125.0,12.95,2.35);stoneWall(corner,4.15,19.15);kit.arch(corner,0,.55,2.34,4.52,0x516157,stone);box(corner,0,2.05,.17,.075,3.2,.08,0xc2c6b8);kit.cornice(corner,4.5,14.40,stoneLight,true);
 const clock=new T.Mesh(new T.CircleGeometry(.87,48),material(0xe6e4d7));clock.position.set(0,17.38,.20);corner.add(clock);const bezel=new T.Mesh(new T.TorusGeometry(.90,.12,9,48),stone);bezel.position.copy(clock.position);corner.add(bezel);for(let k=0;k<12;k++){const a=k*Math.PI/6;const tick=box(corner,Math.sin(a)*.69,17.38+Math.cos(a)*.69,.23,.055,.18,.025,0x465348);tick.rotation.z=-a;}line(corner,[0,17.38,.25],[.35,17.57,.25],.043,0x374b3c);line(corner,[0,17.38,.26],[-.36,16.94,.26],.035,0x374b3c);
 kit.window(corner,0,10.05,1.50,2.33,0xb7b9aa,.18,0);box(corner,0,7.79,.41,3.60,.23,.90,stoneLight);for(let x=-1.64;x<1.7;x+=.32){box(corner,x,8.25,.81,.12,.74,.13,stoneLight);}box(corner,0,8.66,.78,3.65,.13,.27,stoneLight);kit.cornice(corner,4.65,19.05,0xa9a593,true);
 for(let k=0;k<4;k++)box(corner,0,.07+k*.13,.30+(3-k)*.28,3.0,.16,.34,0xb2b09f);
 // Opera House street face, observed in Denise Marie's 2023 exterior photograph.
 const opera=face(-233.07,11.53,Math.PI);facadeBox(opera,0,6.51,0,16.18,13.02,.10,m.aged);kit.cornice(opera,16.3,11.88,0x414c4e,true);box(opera,0,13.0,.11,16.35,.12,.30,0x5d6766);
 for(const x of [-5.3,0,5.3]){for(const dx of [-.67,.67])kit.window(opera,x+dx,10.17,.92,2.04,0xcdc9b8,.16,0);box(opera,x,8.84,.1,2.85,.11,.19,0xa7a18d);}
 for(const side of [-1,1]){const bay=new T.Group();bay.position.set(side*5.3,0,.18);opera.add(bay);box(bay,0,6.63,.34,2.97,3.16,.64,0x354443);kit.window(bay,0,6.61,1.5,2.67,0xb6baaa,.69,1);for(const s of [-1,1]){const angled=new T.Group();angled.position.set(s*1.04,0,.39);angled.rotation.y=s*.67;bay.add(angled);kit.window(angled,0,6.61,.71,2.67,0xb6baaa,.15,0);}box(bay,0,8.31,.3,3.55,.22,1.15,0x46504d);}
 box(opera,0,6.52,.16,4.1,3.22,.36,0xb5ad93);for(const x of [-1.2,0,1.2])kit.window(opera,x,6.5,.85,2.65,0xc9c8b6,.38,0);box(opera,0,8.24,.22,4.65,.23,.71,0x989783);
 box(opera,0,2.19,.10,16.05,4.31,.16,0x313c42);for(const x of [-5.3,5.3]){kit.window(opera,x,1.86,4.24,2.93,0x526365,.21,2);box(opera,x,.36,.26,4.37,.52,.12,0x344246);}box(opera,0,1.79,.22,4.12,3.48,.10,0x1d292e);for(const x of [-.98,.98])kit.window(opera,x,1.64,1.61,2.98,0x3a474c,.27,1);
 kit.cornice(opera,16.3,4.31,0x35464c,true);const awning=box(opera,0,4.51,.98,6.58,.42,2.13,0x6b3435);void awning;sign(opera,'THE OPERA HOUSE','',0,4.50,2.06,6.65,.70,'#633532','#e1bd53','Georgia');
 const lewis=face(-224.92,30.3,Math.PI/2);facadeBox(lewis,0,6.1,0,36.8,12.2,.08,m.aged);kit.cornice(lewis,37,11.91,0x49534e,true);for(let x=-14;x<14;x+=4.9){kit.arch(lewis,x,3.0,1.23,4.15,0x596760,m.red);box(lewis,x+1.85,6.13,.10,.43,11.6,.25,0x69554a);}for(const x of [11.6,15.8]){kit.window(lewis,x,6.58,1.03,2.25,0xc7c5b6,.17,0);kit.window(lewis,x,10.1,1.03,2.04,0xc7c5b6,.17,0);}
 // Poulton's preserved upper masonry is sampled from GTD Aquitaine's unaltered
 // 2008 public-domain photograph; the current Amber ground level stays authored.
 const photo=new T.TextureLoader().load('/materials/poulton-2008.jpg');photo.colorSpace=T.SRGBColorSpace;photo.anisotropy=16;
 const photoMat=new T.MeshStandardMaterial({map:photo,roughness:.95,color:0xe4e1d8});
 function upper(g:T.Group,w:number,quad:Point[]){const nx=48,ny=24,pos:number[]=[],uv:number[]=[],ix:number[]=[];for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const u=x/nx,v=y/ny,p=photoUV(quad,u,v);pos.push((u-.5)*w,12.95-v*4.65,.14);uv.push(p[0]/633,1-p[1]/720);}for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const i=y*(nx+1)+x;ix.push(i,i+nx+1,i+1,i+1,i+nx+1,i+nx+2);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(ix);geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,photoMat);mesh.receiveShadow=true;g.add(mesh);}
 const poulton=face(-75.215,-8.84);upper(poulton,19.97,[[7,184],[258,32],[258,280],[7,380]]);
 const poultonSide=face(-63.22,-25.18,Math.PI/2);upper(poultonSide,29.12,[[358,37],[609,201],[612,389],[358,280]]);
 const chamfer=face(-64.22,-9.69,.826);upper(chamfer,2.50,[[261,24],[356,24],[356,280],[261,280]]);
 // Video reference shows the current dark frames, three-circle fanlights,
 // black shop piers and St. Mary Pharmacy. The upper photo remains separate.
 const frame=0x30383c,poultonGlass=glass.clone();poultonGlass.color.setHex(0xa3b1b4);poultonGlass.roughness=.23;poultonGlass.metalness=.26;
 function middleArch(g:T.Group,x:number,w:number){
  const base=5.22,shoulder=7.12,r=w/2;
  kit.window(g,x,(base+shoulder)/2,w,shoulder-base,frame,.19,0,0x8d806d,poultonGlass);
  box(g,x,(base+shoulder)/2,.29,.075,shoulder-base,.08,frame);
  const s=new T.Shape();s.moveTo(-r,0);s.absarc(0,0,r,Math.PI,0,true);s.closePath();
  const fan=new T.Mesh(new T.ShapeGeometry(s,28),poultonGlass);fan.scale.y=.69;fan.position.set(x,shoulder,.21);g.add(fan);
  const brickRing=new T.Mesh(new T.TorusGeometry(r+.09,.10,6,32,Math.PI),m.red);brickRing.scale.y=.69;brickRing.position.set(x,shoulder,.21);g.add(brickRing);
  const trimRing=new T.Mesh(new T.TorusGeometry(r-.04,.035,5,32,Math.PI),material(frame));trimRing.scale.y=.69;trimRing.position.set(x,shoulder,.265);g.add(trimRing);
  box(g,x,shoulder,.29,w,.095,.12,frame);
  for(const [dx,rr,dy] of [[0,w*.15,w*.17],[-w*.29,w*.093,w*.11],[w*.29,w*.093,w*.11]]){const rim=new T.Mesh(new T.TorusGeometry(rr,.033,5,24),material(frame));rim.position.set(x+dx,shoulder+dy,.275);g.add(rim);}
 }
 for(const [g,w] of [[poulton,19.97],[poultonSide,29.12]] as [T.Group,number][]){
  facadeBox(g,0,6.58,.07,w,3.37,.10,m.aged);
  for(let k=0;k<4;k++){const x=(k+.5)*w/4-w/2;
   if(k===0||k===3){for(const dx of [-.83,.83]){kit.window(g,x+dx,6.29,1.04,2.08,frame,.19,0,0x8d806d,poultonGlass);kit.window(g,x+dx,7.68,1.04,.63,frame,.19,0,0x8d806d,poultonGlass);}}
   else middleArch(g,x,2.55);
   facadeBox(g,x+w/8-.15,6.58,.17,.24,3.29,.20,m.red);
  }for(const y of [8.05,8.23,5.06])box(g,0,y,.17,w,.12,.27,0x96715a);
 }
 facadeBox(chamfer,0,6.58,.07,2.5,3.37,.10,m.aged);middleArch(chamfer,0,1.34);
 for(const g of [poulton,poultonSide,chamfer]){const w=g===poulton?19.97:g===poultonSide?29.12:2.50;kit.cornice(g,w,4.90,frame,true);box(g,0,12.98,.10,w,.10,.24,0x8f7a62);}
 for(const [i,x] of [-7.49,-2.49,2.50,7.49].entries()){
  box(poulton,x,2.12,.08,4.75,4.24,.16,frame);
  kit.window(poulton,x,2.07,4.12,3.04,frame,.25,0,frame,poultonGlass);
  for(const dx of [-.69,.69])box(poulton,x+dx,2.07,.34,.060,3.0,.11,frame);
  box(poulton,x,4.33,.18,4.82,.74,.30,frame);
  for(const y of [.30,.55,3.60,3.87,4.77])box(poulton,x,y,.29,4.68,.065,.15,frame);
  if(i===2){sign(poulton,'ST. MARY PHARMACY','',x,4.43,.347,3.72,.44,'#deddd1','#294860','Arial');sign(poulton,'PharmaChoice','',x,3.94,.35,3.06,.28,'#272e32','#ece5e1','Georgia');}
  if(i===3)sign(poulton,'chez nous','',x,.68,.36,2.0,.26,'#30383c','#e5e4d8','cursive');
 }
 for(const x of [-9.98,-4.99,0,4.99,9.96]){box(poulton,x,2.31,.21,.40,4.55,.43,frame);box(poulton,x,4.46,.26,.52,.51,.52,frame);for(const dx of [-.12,0,.12])box(poulton,x+dx,4.46,.54,.045,.41,.05,0x59605e);}
 // The chamfered 798 entrance has two rounded pale steps and bronze trim.
 box(chamfer,0,2.18,.13,2.5,4.36,.20,frame);
 kit.window(chamfer,0,2.02,1.58,2.95,0x8d826b,.29,0,frame,poultonGlass);box(chamfer,.38,2.02,.40,.055,2.9,.07,0x8d826b);
 sign(chamfer,'798','',0,3.78,.39,1.15,.40,'#30383c','#e7e3d2','cursive');
 sign(chamfer,'chez nous','',.12,2.80,.405,.94,.24,'#30383c','#eee9d7','cursive');
 for(const [w,d,y] of [[2.44,.82,.12],[2.10,.55,.27]]){const step=new T.Mesh(new T.CylinderGeometry(w/2,w/2,.15,32,1,false,-Math.PI/2,Math.PI),material(0xb7b09b));step.scale.z=d/(w/2);step.position.set(0,y,.32);step.castShadow=step.receiveShadow=true;chamfer.add(step);}
 // Slatted planters along Boulton, visible at21–24s, behind the clear walk.
 for(const x of [-12.4,-10.0]){for(let k=0;k<5;k++){box(poultonSide,x,.15+k*.14,1.26,1.75,.115,.06,0x5b544c);for(const dx of [-.84,.84])box(poultonSide,x+dx,.15+k*.14,.89,.065,.115,.80,0x5b544c);}box(poultonSide,x,.72,.9,1.69,.055,.73,0x4d493d);}

}
