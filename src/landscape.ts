import * as T from 'three';
import {LANE} from './laneway';
import {GEO,queenZ,segmentDistance,inside} from './geography';
import {STREET,elevation} from './street-data';
import frontages from './data/frontages.json';
import {LESLIEVILLE} from './ontario-line';
import {buildQueenUnderpass} from './queen-underpass';
import {box,rod,material} from './world';
import {foliageTexture} from './foliage';
import type {Point} from './game';
import type {Obstacle} from './motion';
type Factory=(x:number,z:number)=>T.Group;
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
export function buildLandscape(tile:Factory,detail:Factory,obstacles:Obstacle[],grass:T.Material,paving:T.Material){
 let seed=8703;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const map=foliageTexture();
 const autumnMap=foliageTexture(true);const mapleLeaves=new T.MeshStandardMaterial({map:autumnMap,alphaTest:.38,side:T.DoubleSide,roughness:.9,color:0xb35c69,emissive:0x77374f,emissiveIntensity:.10});const autumnLeaves=[0xf0c867,0xe8a354,0xca7855,0xdeb875,0xbdc987,0xd48a60].map(color=>new T.MeshStandardMaterial({map:autumnMap,alphaTest:.38,side:T.DoubleSide,roughness:.94,color,emissive:0xc4a080,emissiveIntensity:.045}));
 const leaves=[0xe4e4c7,0xd4dec4,0xdcdcb7].map(color=>new T.MeshStandardMaterial({map,alphaTest:.38,side:T.DoubleSide,roughness:.94,color}));
 const evergreen=new T.MeshStandardMaterial({map,alphaTest:.38,side:T.DoubleSide,roughness:.95,color:0x829570});
 const card=new T.PlaneGeometry(1,1,2,1);const cp=card.getAttribute('position');for(let i=0;i<cp.count;i++)cp.setZ(i,.18*(1-4*cp.getX(i)*cp.getX(i)));card.computeVertexNormals();
 const barkCanvas=document.createElement('canvas');barkCanvas.width=128;barkCanvas.height=512;const bc=barkCanvas.getContext('2d')!;bc.fillStyle='#716a59';bc.fillRect(0,0,128,512);for(let i=0;i<350;i++){bc.strokeStyle=i%2?'#393d2e66':'#a5a08977';bc.lineWidth=1+rand()*3;const x=rand()*128,y=rand()*512;bc.beginPath();bc.moveTo(x,y);bc.lineTo(x+rand()*6-3,y+rand()*95);bc.stroke();}const barkMap=new T.CanvasTexture(barkCanvas);barkMap.colorSpace=T.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=T.RepeatWrapping;const bark=new T.MeshStandardMaterial({map:barkMap,bumpMap:barkMap,bumpScale:.025,roughness:1,color:0xb8b39e});
 const mapped=STREET.objects['city-trees'].filter(t=>t.id!==856062&&t.id!==856040&&![855950,855951,855952,855953,855954].includes(t.id)).map(t=>t.id===856061?{...t,p:[238.64,-6.40] as Point,h:10.2}:t);
 //New video places a low red Japanese maple in the18front garden.
 mapped.push({id:9000018,p:[14.65,-76.6],h:4.4,kind:'Video reference Japanese maple'});
 // Film 194–200s: the west row includes evergreen screens, not uniformly
 // deciduous street trees. Positions are estimates within the mapped yards.
 mapped.push({id:9000022,p:[14.5,-83.9],h:7.7,kind:'Video reference columnar evergreen'},
  {id:9000020,p:[15.1,-81.1],h:3.7,kind:'Video reference dense shrub'});
 mapped.push({id:9000001,p:[254.10,-6.27],h:9.8,kind:'video-reference tree'},{id:9000002,p:[222.45,-6.43],h:10.8,kind:'video-reference tree'});const trees=[...mapped.map(t=>({p:t.p,h:t.h,id:t.id})),...GEO.trees.filter(p=>!mapped.some(t=>Math.hypot(t.p[0]-p[0],t.p[1]-p[1])<3.0)).map((p,i)=>({p,h:0,id:i}))];
 // City aerial tree point 854338 falls in the carriageway. The September
 // 2021 panorama at 97 De Grassi shows the trunk on the west verge; retain
 // the measured height but use an approximate, photograph-corrected trunk.
 for(const t of trees){
  // Remove historic inventory trees displaced by the completed station/plaza.
  const dx=t.p[0]-LESLIEVILLE.x,dz=t.p[1],localX=dx*Math.cos(LESLIEVILLE.yaw)-dz*Math.sin(LESLIEVILLE.yaw),localZ=dx*Math.sin(LESLIEVILLE.yaw)+dz*Math.cos(LESLIEVILLE.yaw);
  if((Math.abs(localX)<14.7&&Math.abs(localZ)<76)||(t.p[0]>-25&&t.p[0]<1&&t.p[1]>10&&t.p[1]<60))continue;
  const p:Point=LANE.treeCorrections[t.id]?LANE.treeCorrections[t.id] as Point:t.id===854338?[17.9,-281.627]:t.p;if(GEO.buildings.some(b=>inside(p,b.p)))continue;const columnar=t.id===9000022,green=[9000022,9000020].includes(t.id),observedPark=p[0]>140&&p[0]<265&&p[1]>-85&&p[1]<0,height=Math.max(green?2:4,Math.min(t.h||8+(t.id%9)*.6,20)),crown=columnar?.74:Math.max(green?1.0:2,height*(observedPark?.39:.30)),g=new T.Group(),trunkH=height*.46,r=Math.max(.10,height*.018);
  const valley=p[0]>-804&&p[0]<-594&&Math.abs(p[1]-queenZ(p[0]))>14;g.position.y=valley?-5.9:0;detail(...p).add(g);
  const leader=v(p[0]+Math.sin(t.id)*r*3,height*.78,p[1]+Math.cos(t.id)*r*2);
  const trunk=new T.Mesh(new T.CylinderGeometry(r*.19,r,height*.78,10),bark);trunk.position.set((p[0]+leader.x)/2,height*.39,(p[1]+leader.z)/2);trunk.quaternion.setFromUnitVectors(v(0,1,0),leader.clone().sub(v(p[0],0,p[1])).normalize());trunk.castShadow=trunk.receiveShadow=true;g.add(trunk);
  if(observedPark){for(let k=0;k<5;k++){const a=k*1.256+t.id,tip=v(p[0]+Math.sin(a)*r*2.8,.10,p[1]+Math.cos(a)*r*2.8);const root=rod(g,v(p[0],.40,p[1]),tip,r*.46,0x6e6552);root.material=bark;}}
  // Branch junctions start at different heights and taper towards their tips.
  for(let k=0;k<9;k++){
   const a=k*2.399+(t.id%13),level=.33+(k%4)*.075;
   const start=v(p[0],height*level,p[1]),tip=v(p[0]+Math.sin(a)*crown*.69,height*(.58+(k%3)*.10),p[1]+Math.cos(a)*crown*.69);
   const branch=rod(g,start,tip,r*(.31-(k%3)*.04),0x625e4b);branch.material=bark;
   for(const side of [-1,1]){const twig=rod(g,tip,v(tip.x+Math.sin(a+side*.8)*crown*.31,tip.y+height*.12,tip.z+Math.cos(a+side*.8)*crown*.31),r*.10,0x645e4c);twig.material=bark;}
  }
  for(let k=0;k<(columnar?140:observedPark?78:82);k++){
   const az=rand()*Math.PI*2,vertical=rand()*2-1,section=Math.sqrt(1-vertical*vertical),rr=Math.sqrt(rand())*crown*section;
   const leaf=new T.Mesh(card,green?evergreen:t.id===9000018?mapleLeaves:autumnLeaves[(t.id+(k%7===0?1:0))%autumnLeaves.length]);leaf.position.set(p[0]+Math.cos(az)*rr,height*(columnar?.53:observedPark?.69:.70)+vertical*height*(columnar?.45:observedPark?.23:.27),p[1]+Math.sin(az)*rr);
   const size=crown*((observedPark?.43:.57)+rand()*.25);leaf.scale.set(size,size,1);leaf.rotation.set(rand()*Math.PI,rand()*6.28,rand()*6.28);// Bent crown normals soften the flat cross-card appearance. Leaf outlines
   // remain alpha-cut; normals describe the canopy volume for broad lighting.
   const roundedNormal=new T.Vector3(leaf.position.x-p[0],(leaf.position.y-height*.60)*1.3,leaf.position.z-p[1]).normalize();
   roundedNormal.applyQuaternion(leaf.quaternion.clone().invert()).multiply(new T.Vector3(size,size,1)).normalize();
   leaf.geometry=card.clone();const normals=leaf.geometry.getAttribute('normal');for(let n=0;n<normals.count;n++)normals.setXYZ(n,roundedNormal.x+cp.getX(n)*.3,roundedNormal.y+cp.getY(n)*.18,roundedNormal.z);
   leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);
  }
  if(!valley)obstacles.push({x:p[0],z:p[1],w:r*2,d:r*2,h:height,tag:'mapped tree'});
 }
 // Front-garden geometry is clipped to City parcels and subtracts all mapped
 // pavement. Dense planting is limited to photograph-observed garden profiles.
 for(const u of STREET.units.filter(u=>elevation(u).garden)){
  const profile=elevation(u),beds=frontages.yards.filter(y=>y.id===u.id&&y.kind==='bed');
  const g=detail(...u.front);
  for(const bed of beds){
   const xs=bed.p.map(p=>p[0]),zs=bed.p.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),back=Math.min(...zs),front=Math.max(...zs);
   const count=Math.min(280,Math.ceil((right-left)*(front-back)*30));
   for(let k=0;k<count;k++){
    const x=left+rand()*(right-left),z=back+rand()*(front-back);if(!inside([x,z],bed.p as Point[])||bed.holes.some(h=>inside([x,z],h as Point[])))continue;
    const h=.28+rand()*.70,leaf=new T.Mesh(card,leaves[k%3]);leaf.position.set(x,.10+h*.42,z);leaf.scale.set(.35+rand()*.38,h,1);leaf.rotation.set((rand()-.5)*.9,rand()*6.28,(rand()-.5)*.6);leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);
   }
   // Low timber garden edging follows the surveyed parcel, not a uniform box.
   for(let k=0;k<bed.p.length;k++){const a=bed.p[k],b=bed.p[(k+1)%bed.p.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.40)continue;const edge=box(g,(a[0]+b[0])/2,.14,(a[1]+b[1])/2,.11,.27,length,0x9b8a67);edge.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);}
  }
  if(u.number==='52'||u.number==='54'){
   const ivy=new T.Group();ivy.position.set(u.front[0],0,u.front[1]);ivy.rotation.y=u.yaw;g.add(ivy);
   for(let k=0;k<130;k++){const x=-u.width*.26+(rand()-.5)*1.8,y=.35+rand()*(profile.eave+profile.roof*.65),leaf=new T.Mesh(card,leaves[1]);leaf.position.set(x,y,.31+rand()*.12);leaf.scale.setScalar(.38+rand()*.35);leaf.rotation.set(0,rand()*.4,(rand()-.5)*2);ivy.add(leaf);}
  }
 }
 // Actual point locations for residential utility poles and drains. Queen's
 // overhead trolley wiring remains a separate continuous system.
 for(const p of STREET.objects['city-poles']){if(Math.abs(p.p[1]-queenZ(p.p[0]))<18)continue;const g=detail(...p.p),h=Math.max(5.5,Math.min(p.h||8.1,12));obstacles.push({x:p.p[0],z:p.p[1],w:.24,d:.24,h,tag:'mapped utility pole'});const pole=rod(g,v(p.p[0],0,p.p[1]),v(p.p[0],h,p.p[1]),.12,0x78674d);pole.material=bark;box(g,p.p[0],h-.45,p.p[1],1.65,.10,.10,0x827862);for(const x of [-.6,.6])box(g,p.p[0]+x,h-.28,p.p[1],.13,.24,.13,0x959d92);}
 for(const p of STREET.objects.catchbasins){const g=detail(...p.p),[x,z]=p.p;box(g,x,.061,z,.55,.016,.37,0x4b514b);for(let n=0;n<7;n++)box(g,x-.23+n*.078,.073,z,.034,.013,.32,0x262e2c);}
 // Raised rail corridor: mapped rails set the centre, not an invented straight
 // strip. The slope is an approximation; no elevation survey is claimed.
 const tracks=GEO.rails.filter(r=>r.kind!=='tram'&&r.p.some(p=>p[0]>20&&p[0]<250&&p[1]<-15));
 const ballast=new T.MeshStandardMaterial({map:barkMap,color:0x999487,roughness:1});
 for(const rail of tracks)for(let k=1;k<rail.p.length;k++){let a:Point=[rail.p[k-1][0]+10,rail.p[k-1][1]],b:Point=[rail.p[k][0]+10,rail.p[k][1]];if(Math.max(a[1],b[1])>-12||Math.min(a[1],b[1])<-410)continue;const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,g=tile((a[0]+b[0])/2,(a[1]+b[1])/2);
  const retained=Math.max(a[1],b[1])>-95&&Math.min(a[0],b[0])<65;const profile=retained?[[-8.5,0],[-8.5,5.78],[8.5,5.78],[8.5,0]]:[[-11,0],[-3.0,5.78],[3.0,5.78],[11,0]];
  const positions:number[]=[],indices:number[]=[];for(const [off,y] of profile)for(const p of [a,b])positions.push(p[0]+nx*off,y,Math.min(-13.05,p[1]+nz*off));for(let j=0;j<3;j++)indices.push(j*2,j*2+1,j*2+2,j*2+1,j*2+3,j*2+2);const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));geom.setAttribute('uv',new T.Float32BufferAttribute([0,0,0,len,1,0,1,len,2,0,2,len,3,0,3,len],2));geom.setIndex(indices);geom.computeVertexNormals();const mesh=new T.Mesh(geom,retained?material(0xb6b7ad):grass);mesh.receiveShadow=true;g.add(mesh);
  const wall:Point[]=[[a[0]-nx*10,a[1]-nz*10],[b[0]-nx*10,b[1]-nz*10],[b[0]+nx*10,b[1]+nz*10],[a[0]+nx*10,a[1]+nz*10]];for(const p of wall)p[1]=Math.min(-13.05,p[1]);const xs=wall.map(p=>p[0]),zs=wall.map(p=>p[1]);obstacles.push({x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),h:6,p:wall,tag:'rail embankment'});
  const bed=box(g,(a[0]+b[0])/2,5.92,(a[1]+b[1])/2,3.4,.16,len,0x858276);bed.rotation.y=Math.atan2(dx,dz);bed.material=ballast;
  for(let d=0;d<len;d+=.68){const t=d/len,x=a[0]+dx*t,z=a[1]+dz*t,sleeper=box(g,x,6.03,z,2.4,.13,.22,0x55584e);sleeper.rotation.y=Math.atan2(dx,dz);}
  for(const side of [-1,1]){rod(g,v(a[0]+nx*side*.73,6.12,a[1]+nz*side*.73),v(b[0]+nx*side*.73,6.12,b[1]+nz*side*.73),.045,0x7d8179);}
 }
 buildQueenUnderpass(tile(37,0),obstacles,paving);
 return trees.length;
}
