import * as T from 'three';
import {box,rod,material,sign} from './world';
import {queenZ} from './geography';
import {STREET} from './street-data';
import {foliageTexture} from './foliage';
import type {Obstacle} from './motion';
import type {buildVideoArchitecture} from './video-architecture';
type Factory=(x:number,z:number)=>T.Group;
// Placement estimates follow the user's walk past the City-registered fronts.
// These are street objects, not a painted photograph of the real people/cars.
export function buildVideoStreets(detail:Factory,kit:ReturnType<typeof buildVideoArchitecture>,obstacles:Obstacle[],roadMaterial:T.MeshStandardMaterial){
 const {root,label}=kit;
 const line=(g:T.Group,a:number[],b:number[],r=.025,c=0x4f5953)=>rod(g,new T.Vector3(a[0],a[1],a[2]),new T.Vector3(b[0],b[1],b[2]),r,c);
 let seed=981;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const leafTex=foliageTexture(),leafMat=new T.MeshStandardMaterial({map:leafTex,alphaTest:.38,side:T.DoubleSide,roughness:.94,color:0xa5b394});const card=new T.PlaneGeometry(1,1);

 function planting(g:T.Group,x:number,z:number,w:number,d:number,base:number,height:number,flowers=false){
  for(let k=0;k<Math.ceil(w*d*22);k++){const leaf=new T.Mesh(card,leafMat);leaf.position.set(x+(rand()-.5)*w,base+rand()*height,z+(rand()-.5)*d);leaf.scale.set(.35+rand()*.45,.4+rand()*.5,1);leaf.rotation.set((rand()-.5)*2,rand()*6.28,rand());leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);}
  if(flowers)for(let k=0;k<Math.ceil(w*d*16);k++){const x1=x+(rand()-.5)*w,z1=z+(rand()-.5)*d,y=base+height*.6+rand()*.25;const flower=new T.Mesh(new T.CircleGeometry(.06+rand()*.045,7),material(k%3===0?0xe78947:0xc7b744));flower.position.set(x1,y,z1);flower.rotation.x=-.8;g.add(flower);}
 }
 function roundedPlanter(x:number,z:number,w:number,d:number,color:number,rim=0xa56852,h=.57){
  const g=root(x,z),r=.20,s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
  const hole=new T.Path();hole.moveTo(-w/2+.13,-d/2+.13);hole.lineTo(-w/2+.13,d/2-.13);hole.lineTo(w/2-.13,d/2-.13);hole.lineTo(w/2-.13,-d/2+.13);hole.closePath();s.holes.push(hole);
  const geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:5});geo.rotateX(-Math.PI/2);const mesh=new T.Mesh(geo,material(color));mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);
  for(const y of [.16,.40])for(const side of [-1,1])box(g,0,y,side*d/2,w-.25,.018,.009,0x676c68);
  for(const side of [-1,1]){box(g,0,h+.015,side*(d/2-.055),w-.22,.05,.11,rim);box(g,side*(w/2-.055),h+.015,0,.11,.05,d-.22,rim);}
  box(g,0,h-.07,0,w-.22,.07,d-.22,0x5b5741);planting(g,0,0,w-.26,d-.26,h,.30);
  obstacles.push({x,z,w,d,h:h+.10,tag:'video-reference tree planter'});return g;
 }
 // The one tree visible at 10 s was represented by two near-identical City
 // points. Landscape now resolves those to a single trunk before this planter.
 roundedPlanter(238.64,-6.40,2.08,1.79,0x777e7c,0xb96f56,.60);
 roundedPlanter(222.45,-6.43,1.88,1.62,0xb9bcb2,0xa6a99f,.52);
 const first=roundedPlanter(254.10,-6.27,1.20,1.15,0x747c75,0x71866c,.91);planting(first,0,0,1.35,1.3,.87,.36,true);
 // Ring-and-post cycle stands shown between the planted trees and shop wall.
 for(const [x,z] of [[246.1,-6.02],[231.0,-6.50],[226.5,-6.6]]){
  const g=detail(x,z);line(g,[x,.08,z],[x,.94,z],.030,0x8b9690);const ring=new T.Mesh(new T.TorusGeometry(.23,.031,7,28),material(0x9da69d));ring.rotation.y=Math.PI/2;ring.position.set(x,.77,z);g.add(ring);obstacles.push({x,z,w:.16,d:.56,h:1.05,tag:'video-reference bicycle ring'});
 }
 // Park entrance at Queen and Booth: broad paved apron, pale seat walls,
 // burgundy name slab and a tall drinking-water column visible at 26–42 s.
 const park=root(195.2,-14.3);
 const paverCanvas=document.createElement('canvas');paverCanvas.width=paverCanvas.height=512;const pc=paverCanvas.getContext('2d')!;pc.fillStyle='#68685d';pc.fillRect(0,0,512,512);
 for(let y=0;y<512;y+=32)for(let x=-64;x<512;x+=64){const xx=x+((y/32)%2)*32;pc.fillStyle=`hsl(37,4%,${43+rand()*10}%)`;pc.fillRect(xx+1,y+1,62,30);}
 const paverMap=new T.CanvasTexture(paverCanvas);paverMap.colorSpace=T.SRGBColorSpace;paverMap.wrapS=paverMap.wrapT=T.RepeatWrapping;paverMap.repeat.set(10.34,6.1875);const paverMat=new T.MeshStandardMaterial({map:paverMap,roughness:1});
 const apron=new T.Mesh(new T.PlaneGeometry(18.2,9.9,10,6),paverMat);apron.rotation.x=-Math.PI/2;apron.position.set(0,.062,-1.75);apron.receiveShadow=true;park.add(apron);
 for(const [x,z,w,d] of [[-5.8,-1.9,5.8,1.25],[5.30,-5.0,3.5,1.4]]){
  box(park,x,.28,z,w,.54,d,0xb4b7aa);box(park,x,.56,z,w+.04,.06,d+.04,0x969e91);planting(park,x,z,w-.15,d-.18,.59,x>0?.34:.72,x<0);obstacles.push({x:195.2+x,z:-14.3+z,w,d,h:.65,tag:'park entrance seat wall'});
 }
 box(park,5.25,1.35,-5.40,4.90,1.65,.26,0x614a47);label(park,9,5.25,1.60,-5.245,4.55,.55);obstacles.push({x:200.45,z:-19.7,w:4.9,d:.28,h:2.2,tag:'Jimmie Simpson name slab'});
 const fountain=root(193.1,-15.5);box(fountain,0,.91,0,.39,1.82,.35,0x946e5a);box(fountain,0,1.84,0,.43,.055,.40,0xb8b2a1);box(fountain,0,1.41,.18,.28,.61,.015,0x65493c);for(const x of [-.17,.17])box(fountain,x,1.44,.205,.04,.73,.055,0xa17b66);box(fountain,0,1.11,.20,.30,.075,.07,0xa17b66);const push=new T.Mesh(new T.SphereGeometry(.056,10,7),material(0xadb7af));push.scale.z=.35;push.position.set(0,.92,.183);fountain.add(push);obstacles.push({x:193.1,z:-15.5,w:.44,d:.42,h:1.9,tag:'park drinking fountain'});
 function bench(x:number,z:number,yaw:number){const g=root(x,z,yaw);for(let k=0;k<4;k++){box(g,0,.46,k*.105-.16,1.85,.055,.09,0x8e8064);const back=box(g,0,.68+k*.115,-.24-k*.024,1.85,.084,.055,0x9b8b6d);back.rotation.x=-.12;}for(const x of [-.67,.67]){box(g,x,.26,0,.065,.51,.43,0x3e5146);line(g,[x,.41,.25],[x,.77,.19],.028,0x3e5146);line(g,[x,.77,.19],[x,.77,-.27],.028,0x3e5146);line(g,[x,.38,-.23],[x,1.10,-.37],.027,0x3e5146);}obstacles.push({x,z,w:yaw===0?1.95:.65,d:yaw===0?.65:1.95,h:1.2,tag:'video-reference park bench'});}
 bench(194.4,-17.4,0);bench(188.7,-21.0,Math.PI/2);bench(286.7,-6.45,0);
 // Video reference: the western lawn has a separate blue-post park sign and
 // a coloured slat bench. Positions are perspective estimates inside the
 // mapped lawn, not a replacement for the stone sign at the Booth entrance.
 const lawnSign=root(155.7,-16.4),shape=new T.Shape();shape.moveTo(-1.65,1.04);shape.lineTo(1.65,1.04);shape.lineTo(1.65,2.42);shape.quadraticCurveTo(0,2.96,-1.65,2.42);shape.closePath();
 const face=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:false,curveSegments:16}),material(0xd5dcd5));lawnSign.add(face);
 for(const x of [-1.72,1.72])box(lawnSign,x,1.35,.035,.11,2.7,.13,0x41627e);
 box(lawnSign,0,1.25,.103,3.24,.35,.026,0x426781);
 sign(lawnSign,'Jimmie Simpson Park','',0,2.20,.112,3.05,.44,'#d5dcd5','#294860','Georgia');
 sign(lawnSign,'A CITY WITHIN A PARK','',0,2.60,.112,2.5,.14,'#d5dcd5','#6a807c','Arial');
 obstacles.push({x:155.7,z:-16.4,w:3.56,d:.18,h:2.8,tag:'western lawn park sign'});
 const lawnBench=root(146.5,-17.8),seatColors=[0xbe615b,0xce9a49,0x728a6a,0xb35e59];
 for(let k=0;k<4;k++){box(lawnBench,0,.46,-.17+k*.11,1.9,.045,.09,seatColors[k]);box(lawnBench,0,.65+k*.11,-.28-k*.02,1.9,.08,.05,seatColors[3-k]);}
 for(const x of [-.73,.73]){line(lawnBench,[x,.05,.25],[x,.46,.13],.045,0x354c43);line(lawnBench,[x,.05,-.35],[x,.46,-.14],.045,0x354c43);line(lawnBench,[x,.46,-.14],[x,1.05,-.37],.04,0x354c43);line(lawnBench,[x,.70,.16],[x,.70,-.30],.035,0x354c43);}
 obstacles.push({x:146.5,z:-17.8,w:2,d:.70,h:1.12,tag:'western lawn coloured bench'});
 // Broad shrub masses behind the pale seat wall and beside the sign, seen
 // at26–42s. Their footprints stay inside the park, beyond the paved apron.
 for(const [x,z,w,d,h] of [[187.9,-18.2,5.0,2.4,3.1],[201.6,-22.0,5.2,3.4,2.5],[197.8,-23.2,3.3,2.8,1.8]]){
  const g=root(x,z);for(let k=0;k<Math.ceil(w*d*24);k++){const az=rand()*6.28,r=Math.sqrt(rand()),hh=.5+rand()*h,leaf=new T.Mesh(card,leafMat);leaf.position.set(Math.sin(az)*w*.5*r,hh,Math.cos(az)*d*.5*r);leaf.scale.set(.7+rand()*.5,.9+rand()*.7,1);leaf.rotation.set((rand()-.5)*1.7,rand()*6.28,rand()*.7);leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);}
 }
 // Purple fountain grass arcs away from its clump, beside (not in front of)
 // the park lettering. Narrow ribbons remain cheap after static batching.
 const purpleGrass=root(203.0,-18.9),grassMat=material(0x72545a);
 for(let k=0;k<150;k++){const a=rand()*6.28,h=.7+rand()*.8,r=.15+rand()*.60,points=[];for(let j=0;j<=5;j++){const t=j/5;points.push(new T.Vector3(Math.sin(a)*r*t*t,Math.sin(t*1.75)*h,Math.cos(a)*r*t*t));}const geom=new T.BufferGeometry(),verts:number[]=[],idx:number[]=[];for(let j=0;j<points.length;j++){const p=points[j],w=.012*(1-j/points.length);verts.push(p.x-w,p.y,p.z,p.x+w,p.y,p.z);if(j<points.length-1)idx.push(j*2,j*2+1,j*2+2,j*2+1,j*2+3,j*2+2);}geom.setAttribute('position',new T.Float32BufferAttribute(verts,3));geom.setIndex(idx);geom.computeVertexNormals();const mesh=new T.Mesh(geom,grassMat);purpleGrass.add(mesh);}
 planting(root(192.5,-16.8),0,0,1.0,.7,.05,.38,true);planting(root(199.1,-19.0),0,0,.8,.7,.05,.38,true);
 // Fine street wear: brick strip by the curb, small covers and irregular road
 // repair patches. Their exact outlines are approximate, not surveyed decals.
 for(let x=216;x<295;x+=.23){box(detail(x,-5.6),x,.061,-5.69,.215,.016,.66,0x898273);}
 for(const [x,z,r] of [[302.1,-5.25,.40],[209.9,-8.4,.38],[230.0,-7.0,.25]]){
  const g=detail(x,z),disk=new T.Mesh(new T.CircleGeometry(r,32),material(0x5a6059));disk.rotation.x=-Math.PI/2;disk.position.set(x,.076,z);g.add(disk);for(let a=0;a<Math.PI*2;a+=Math.PI/8)line(g,[x+Math.sin(a)*r*.25,.078,z+Math.cos(a)*r*.25],[x+Math.sin(a)*r*.87,.078,z+Math.cos(a)*r*.87],.006,0x333d37);
 }
 for(const [x,z,w,d] of [[295,3.9,3.6,2.5],[305,-3.9,4.3,3.2],[222,-3.1,3.0,1.4],[209,3.5,1.4,3.7],[282,-1.1,1.5,2.3]]){
  const g=detail(x,z),s=new T.Shape();s.moveTo(-w/2,-d/2);s.lineTo(w*.45,-d*.48);s.lineTo(w*.53,d*.35);s.lineTo(w*.20,d*.53);s.lineTo(-w*.51,d*.44);s.closePath();const patch=roadMaterial.clone();patch.color.setHex(0x8f928c);const p=new T.Mesh(new T.ShapeGeometry(s),patch);p.rotation.x=-Math.PI/2;p.position.set(x,.047,z);p.receiveShadow=true;g.add(p);
 }
 // Video reference shows a narrow cross-track slot drain at the Logan approach.
 // The grating is flush so neither Pip nor the cart catches an invented lip.
 const drain=detail(286.1,0);for(const z of [-1.55,1.55]){box(drain,286.1,.052,z,.32,.014,1.42,0x464943);for(let k=0;k<24;k++)box(drain,286.1,.062,z-.68+k*.058,.30,.008,.021,0x252e2c);}
 // City-registered timber utility poles replace the uniformly spaced grey
 // rods in the filmed block. Streetlight arms curve over the carriageway.
 const selected=STREET.objects['city-poles'].filter(p=>p.p[0]>180&&p.p[0]<332&&Math.abs(p.p[1]-queenZ(p.p[0]))<16),used:number[][]=[];
 for(const p of selected){const [x,z]=p.p;if(used.some(q=>Math.hypot(q[0]-x,q[1]-z)<1.2))continue;used.push(p.p);const g=detail(x,z),side=z<queenZ(x)?1:-1;
  const timber=rod(g,new T.Vector3(x,0,z),new T.Vector3(x+.09,8.65,z),.155,0x7c7765);timber.receiveShadow=true;
  for(const y of [1.15,3.2,5.9]){const band=new T.Mesh(new T.CylinderGeometry(.160,.160,.045,10),material(0x595f58));band.position.set(x,y,z);g.add(band);}
  let prev=[x,6.9,z];for(let k=1;k<=14;k++){const t=k/14,now=[x+.4*t,6.9+1.12*Math.sin(t*Math.PI*.67),z+side*3.1*t];line(g,prev,now,.036,0x959d93);prev=now;}
  const bell=new T.Mesh(new T.CylinderGeometry(.12,.25,.18,12),material(0x9ca298));bell.position.set(prev[0],prev[1]-.12,prev[2]);g.add(bell);box(g,prev[0],prev[1]-.22,prev[2],.35,.04,.26,0xd2d3b7);
  for(const off of [-1.55,1.55])line(g,[x,7.65,z],[x,6.20,queenZ(x)+off],.012,0x404c45);
  obstacles.push({x,z,w:.32,d:.32,h:8.65,tag:'video-block mapped utility pole'});
 }
 // Observed Logan signal approaches; Ontario yellow backs, black visors,
 // pedestrian heads and blue blades. These replace the generic two-head kit.
 const cross=detail(302,0);
 function head(x:number,y:number,z:number,yaw:number,green:boolean){const g=root(x,z,yaw);g.position.y=y;box(g,0,0,0,.41,1.23,.25,0xd5a324);box(g,0,0,.14,.31,1.13,.055,0x2a302b);for(let k=0;k<3;k++){const yy=.37-k*.37,on=(green&&k===2)||(!green&&k===0);const lamp=new T.Mesh(new T.CircleGeometry(.117,24),new T.MeshStandardMaterial({color:k===0?on?0xe0402f:0x592d25:k===1?0x67592a:on?0x42af78:0x2b5342,emissive:on?(green?0x1d7c50:0xa22118):0x000000,emissiveIntensity:.22,roughness:.6}));lamp.position.set(0,yy,.176);g.add(lamp);const visor=new T.Mesh(new T.CylinderGeometry(.135,.135,.22,16,1,true,0,Math.PI),material(0x303931));visor.rotation.x=Math.PI/2;visor.position.set(0,yy,.24);g.add(visor);}}
 for(const [x,z,side] of [[295.0,-7.15,1],[310.0,8.5,-1]]){
  const g=detail(x,z);line(g,[x,0,z],[x,6.20,z],.10,0x87928c);line(g,[x,6.05,z],[x+.40,6.18,z+side*2.25],.055,0x87928c);
  head(x+.4,5.50,z+side*2.25,side>0?Math.PI/2:-Math.PI/2,true);
  line(g,[x,4.88,z],[x-side*2.3,4.98,z],.047,0x87928c);head(x-side*2.3,4.33,z,side>0?0:Math.PI,false);
  const pedestrian=root(x,z,side>0?0:Math.PI);box(pedestrian,0,2.82,.15,.34,.43,.18,0x41453b);box(pedestrian,0,2.82,.25,.28,.34,.035,0x171e1b);
  // Lit hand is geometry, independent of a font glyph's platform rendering.
  for(const xx of [-.068,-.023,.023,.068])box(pedestrian,xx,2.89,.277,.026,.12,.012,0xcf7b39);box(pedestrian,0,2.79,.277,.15,.14,.012,0xcf7b39);
  obstacles.push({x,z,w:.23,d:.23,h:6.2,tag:'Logan signal pole'});
 }
 // Slightly worn flat paint rather than raised, spotless white bars.
 const paintCanvas=document.createElement('canvas');paintCanvas.width=512;paintCanvas.height=64;const paintCtx=paintCanvas.getContext('2d')!;paintCtx.fillStyle='#d1d1c3';paintCtx.fillRect(0,0,512,64);
 paintCtx.globalCompositeOperation='destination-out';for(let k=0;k<1700;k++){const x=rand()*512,y=rand()*64,edge=y<4||y>60;paintCtx.globalAlpha=edge?.65:.18;paintCtx.fillRect(x,y,1+rand()*3,1+rand()*2);}paintCtx.globalCompositeOperation='source-over';paintCtx.globalAlpha=1;
 const paintMap=new T.CanvasTexture(paintCanvas);paintMap.colorSpace=T.SRGBColorSpace;paintMap.anisotropy=8;const paintMat=new T.MeshStandardMaterial({map:paintMap,alphaTest:.35,roughness:.98,color:0xd4d4ca});
 paintMat.userData.streetSurface='paint';
 function paint(x:number,z:number,w:number,d:number){const mesh=new T.Mesh(new T.PlaneGeometry(w,d),paintMat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.058,z);mesh.receiveShadow=true;cross.add(mesh);}
 for(const x of [294.0,309.1])for(let z=-5.0;z<5.4;z+=.80)paint(x,z,3.2,.38);
 for(const z of [-8.0,9.1])for(let x=295.5;x<309;x+=.85)paint(x,z,.41,2.6);
 // The tactile warning strip follows the mapped rounded Booth curb. Fine
 // domes use a bump texture; they do not create movement-blocking colliders.
 const tactileCanvas=document.createElement('canvas');tactileCanvas.width=tactileCanvas.height=256;const tc=tactileCanvas.getContext('2d')!;tc.fillStyle='#766e62';tc.fillRect(0,0,256,256);for(let x=16;x<256;x+=32)for(let y=16;y<256;y+=32){tc.fillStyle='#4c4c43';tc.beginPath();tc.arc(x,y,6,0,Math.PI*2);tc.fill();tc.fillStyle='#9b9484';tc.beginPath();tc.arc(x-1,y-1,4,0,Math.PI*2);tc.fill();}
 const tactileMap=new T.CanvasTexture(tactileCanvas);tactileMap.colorSpace=T.SRGBColorSpace;tactileMap.wrapS=tactileMap.wrapT=T.RepeatWrapping;tactileMap.anisotropy=8;const tactileMat=new T.MeshStandardMaterial({map:tactileMap,bumpMap:tactileMap,bumpScale:.003,roughness:1});
 const curb=[[206.908,-11.159],[206.343,-8.311],[205.856,-7.416],[205.14,-6.693],[204.253,-6.198]];
 for(let i=1;i<curb.length;i++){const a=curb[i-1],b=curb[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),mesh=new T.Mesh(new T.PlaneGeometry(.60,len),tactileMat);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=-Math.atan2(dx,dz);mesh.position.set((a[0]+b[0])/2-.30,.080,(a[1]+b[1])/2-.20);const uv=mesh.geometry.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*1.5,uv.getY(k)*len/.40);detail(mesh.position.x,mesh.position.z).add(mesh);}
 // Unique seal lines/repairs at the filmed junctions break the repetition of
 // small aggregate without stamping the same giant crack over every road.
 const crackMat=material(0x5d615b);
 for(const [x,z,w,d] of [[302,4.2,5.2,1.2],[307,-4.2,4.1,1.3],[209,-2.7,4.6,2.0],[218,-4.6,2.4,.8],[284,4.3,3.2,.8]]){const g=detail(x,z);let px=x-w/2,pz=z-d/2;for(let k=0;k<11;k++){const nx=px+w/11,nz=z-d/2+k*d/11+(rand()-.5)*.16,len=Math.hypot(nx-px,nz-pz),seg=new T.Mesh(new T.PlaneGeometry(.018+rand()*.014,len),crackMat);seg.rotation.x=-Math.PI/2;seg.rotation.z=-Math.atan2(nx-px,nz-pz);seg.position.set((px+nx)/2,.052,(pz+nz)/2);g.add(seg);px=nx;pz=nz;}}
 // The glass-roof shelter outside Queen Books is visible at 0–6 seconds.
 const shelter=root(320.6,-6.46);for(const x of [-2.05,2.05])for(const z of [-.58,.58])line(shelter,[x,0,z],[x,2.62,z],.055,0x879c96);
 const clear=new T.MeshStandardMaterial({color:0x9fbfb5,transparent:true,opacity:.16,roughness:.14,metalness:.1,side:T.DoubleSide,depthWrite:false});
 for(const x of [-2.05,2.05]){const side=new T.Mesh(new T.PlaneGeometry(1.16,2.42),clear);side.rotation.y=Math.PI/2;side.position.set(x,1.32,0);shelter.add(side);}
 const rear=new T.Mesh(new T.PlaneGeometry(4.1,2.42),clear);rear.position.set(0,1.32,-.58);shelter.add(rear);
 const roof=new T.Mesh(new T.CylinderGeometry(1.0,1.0,4.48,24,1,true,Math.PI*.20,Math.PI*.60),clear);roof.rotation.z=Math.PI/2;roof.position.y=2.21;shelter.add(roof);for(const x of [-2.2,2.2]){let prev=[x,2.5,-.78];for(let k=1;k<=20;k++){const z=-.78+k*1.56/20,now=[x,2.93-.44*(z/.78)**2,z];line(shelter,prev,now,.035,0x6c847d);prev=now;}}
 box(shelter,0,.062,0,4.45,.02,1.55,0xa1a79f);for(const x of [-2.05,2.05])obstacles.push({x:320.6+x,z:-6.46,w:.14,d:1.2,h:2.65,tag:'Queen Books shelter end'});
 // Accessible centre remains open; yellow visibility strip follows the glass.
 box(shelter,0,1.06,-.565,4.08,.055,.022,0xc6cf65);
}
