import * as T from 'three';
import {box,rod,material} from './world';
import {facadeBox} from './architecture';
import {STREET,elevation} from './street-data';
import {VIDEO_UNIT_ADDRESSES} from './video-data';
import type {ElevationProfile,StreetUnit,Footprint} from './street-data';
import type {Point} from './game';
import {inside,segmentDistance} from './geography';
import frontages from './data/frontages.json';
type Factory=(x:number,z:number)=>T.Group;
type Masonry={red:T.MeshStandardMaterial;aged:T.MeshStandardMaterial;cream:T.MeshStandardMaterial;black:T.MeshStandardMaterial};
const vector=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
function canvas(draw:(c:CanvasRenderingContext2D,w:number,h:number)=>void,w=512,h=512){const e=document.createElement('canvas');e.width=w;e.height=h;draw(e.getContext('2d')!,w,h);const t=new T.CanvasTexture(e);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
function extrusion(s:Footprint,height:number,mat:T.Material){
 const shape=new T.Shape(s.p.map(p=>new T.Vector2(p[0],-p[1])));for(const h of s.holes)shape.holes.push(new T.Path(h.map(p=>new T.Vector2(p[0],-p[1]))));
 const g=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2);const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');
 for(let k=0;k<p.count;k++)uv.setXY(k,(Math.abs(n.getX(k))>.5?p.getZ(k):p.getX(k))/1.4,p.getY(k)/1.4);
 const mesh=new T.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
export function buildStreetArchitecture(tile:Factory,detail:Factory,far:Factory,m:Masonry,glass:T.MeshStandardMaterial){
 const materials=new Map<number,T.MeshStandardMaterial>();const brick=(color:number)=>{if(!materials.has(color)){const mat=m.red.clone();mat.color.setHex(color);materials.set(color,mat);}return materials.get(color)!;};
 const trim=material(0xd8d4c3),roofMat=new T.MeshStandardMaterial({color:0xa4a8aa,roughness:.95});
 const roofMap=canvas((c,w,h)=>{c.fillStyle='#696b68';c.fillRect(0,0,w,h);for(let row=0;row<32;row++)for(let k=-1;k<9;k++){c.fillStyle=`hsl(43,3%,${31+(row*17+k*23+400)%13}%)`;c.fillRect(k*64+(row%2)*32,row*16,62,14);}},512,512);roofMap.wrapS=roofMap.wrapT=T.RepeatWrapping;roofMat.map=roofMap;
 function roofSurface(mesh:T.Mesh){
  // Box helpers share geometry; clone before writing metric roof UVs.
  const geo=mesh.geometry.clone(),uv=geo.getAttribute('uv'),pos=geo.getAttribute('position'),normal=geo.getAttribute('normal');
  for(let k=0;k<uv.count;k++){
   const x=pos.getX(k)*mesh.scale.x,y=pos.getY(k)*mesh.scale.y,z=pos.getZ(k)*mesh.scale.z;
   uv.setXY(k,(Math.abs(normal.getX(k))>.5?z:x)/2.4,(Math.abs(normal.getY(k))>.5?z:y)/4.8);
  }
  mesh.geometry=geo;mesh.material=roofMat;
 }
 // Shared trim atlas: all addresses fit one texture, rather than hundreds of
 // separate labels and draw calls. Labels are City address data.
 const atlas=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#e7e1d2';c.textAlign='center';c.textBaseline='middle';c.font='27px serif';STREET.units.forEach((u,i)=>c.fillText(u.number,(i%16)*128+64,Math.floor(i/16)*48+24,110));},2048,Math.ceil(STREET.units.length/16)*48);
 const labelMat=new T.MeshStandardMaterial({map:atlas,transparent:true,alphaTest:.03,roughness:.9});
 const interiors=Array.from({length:4},(_,variant)=>new T.MeshStandardMaterial({map:canvas((c,w,h)=>{
  const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#7a929c');gr.addColorStop(.35,variant===2?'#9c7e67':'#627480');gr.addColorStop(1,variant===2?'#574237':'#35434c');c.fillStyle=gr;c.fillRect(0,0,w,h);
  c.fillStyle=['#d8d0b4aa','#c0bda799','#eee5cd88','#89948b88'][variant];
  if(variant===0)for(let x=12;x<w*.31;x+=12){c.fillRect(x,0,9,h*.92);c.fillRect(w-x-9,0,9,h*.92);}
  if(variant===1)for(let y=12;y<h*.72;y+=13)c.fillRect(0,y,w,4);
  if(variant===2){c.fillRect(0,h*.58,w,h*.015);for(let k=0;k<5;k++){c.fillStyle=['#baa97c','#7c8d80','#97796b'][k%3];c.fillRect(k*52+17,h*.45,23,h*.13);}}
  c.fillStyle='#d4e5e522';c.beginPath();c.moveTo(0,0);c.lineTo(w,0);c.lineTo(0,h*.55);c.fill();
 },256,512),roughness:.38,metalness:.12}));
 for(const mat of interiors)mat.userData.roomColumns=1;
 function line(g:T.Group,a:number[],b:number[],r=.02,c=0x464b47){rod(g,vector(a[0],a[1],a[2]),vector(b[0],b[1],b[2]),r,c);}
 // The filmed west terrace has dark glazing, rather than the generic
 // bright curtains. Reuse the street's glass map and environment lighting.
 const terraceGlass=glass.clone();terraceGlass.color.setHex(0x879994);terraceGlass.emissive.setHex(0);terraceGlass.roughness=.23;terraceGlass.metalness=.24;
 function window(g:T.Group,x:number,y:number,w:number,h:number,color:number,z=.075,v=0,sillColor=0xbab4a3,glazing?:T.MeshStandardMaterial){
  box(g,x,y,z-.025,w+.13,h+.16,.06,0x222a29);const pane=box(g,x,y,z,w,h,.03,0xffffff);pane.material=glazing||interiors[v%4];
  for(const xx of [-w/2,w/2])box(g,x+xx,y,z+.055,.055,h+.13,.11,color);
  for(const yy of [-h/2,h/2])box(g,x,y+yy,z+.055,w+.10,.055,.11,color);
  box(g,x,y-.10,z+.07,w,.07,.09,color);box(g,x,y-h/2-.11,z+.06,w+.24,.13,.30,sillColor);
 }
 function arch(g:T.Group,x:number,bottom:number,w:number,h:number,color:number,mat:T.Material=m.red){
  const r=w/2,y=bottom+h-r;window(g,x,(bottom+y)/2,w,y-bottom,color);
  const s=new T.Shape();s.moveTo(-r,0);s.absarc(0,0,r,Math.PI,0,true);s.lineTo(-r,0);const mesh=new T.Mesh(new T.ShapeGeometry(s,18),interiors[0]);mesh.position.set(x,y,.09);g.add(mesh);
  const ring=new T.Mesh(new T.TorusGeometry(r+.09,.08,5,22,Math.PI),mat);ring.position.set(x,y,.10);g.add(ring);
  for(let k=0;k<=10;k++){const a=k*Math.PI/10;line(g,[x+Math.cos(a)*(r+.02),y+Math.sin(a)*(r+.02),.19],[x+Math.cos(a)*(r+.18),y+Math.sin(a)*(r+.18),.19],.009,0x9b8066);}
 }
 function cornice(g:T.Group,w:number,y:number,c:number,dentils=false){
  box(g,0,y,.12,w,.13,.30,c);box(g,0,y+.17,.08,w,.18,.19,c);box(g,0,y+.30,.15,w+.12,.09,.46,c);
  if(dentils)for(let x=-w/2+.13;x<w/2;x+=.28)box(g,x,y-.10,.13,.11,.20,.22,c);
 }
 function gable(g:T.Group,cx:number,w:number,eave:number,rise:number,depth:number,face:T.Material){
  const s=new T.Shape();s.moveTo(cx-w/2,eave);s.lineTo(cx,eave+rise);s.lineTo(cx+w/2,eave);s.closePath();const roof=new T.Mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:1}),face);roof.position.z=-depth;roof.castShadow=true;g.add(roof);
  const len=Math.hypot(w/2,rise);for(const side of [-1,1]){const slope=box(g,cx+side*w/4,eave+rise/2,-depth/2,len,.09,depth+.35,0x4d504b);slope.rotation.z=-side*Math.atan2(rise,w/2);roofSurface(slope);}
 }
 function door(g:T.Group,x:number,color:number,base=.30,frame=0xd1cab7,glazing?:T.MeshStandardMaterial){
  box(g,x,base+1.05,.065,1.08,2.23,.11,0x202b2a);box(g,x,base+1.05,.13,.90,2.10,.09,color);
  for(const xx of [-.5,.5])box(g,x+xx,base+1.08,.19,.08,2.30,.12,frame);
  box(g,x,base+2.24,.17,1.08,.08,.13,frame);const gl=box(g,x,base+1.63,.19,.63,.61,.027,0xffffff);gl.material=glazing||interiors[2];
  for(const yy of [.39,.86]){box(g,x,base+yy,.19,.65,.35,.06,0x2c3835);box(g,x,base+yy,.215,.55,.27,.025,color);}box(g,x+.34,base+1.08,.235,.038,.19,.055,0xb1aa89);
 }
 function fence(g:T.Group,w:number,z:number,gapX:number){
  for(let x=-w/2+.1;x<w/2;x+=.115){if(Math.abs(x-gapX)<.64)continue;box(g,x,.55,z,.023,1.0,.028,0x313b37);}
  for(const [left,right] of [[-w/2,gapX-.64],[gapX+.64,w/2]])if(right>left)for(const y of [.23,.92])box(g,(left+right)/2,y,z,right-left,.035,.04,0x313b37);
 }
 function chimney(g:T.Group,u:StreetUnit,p:ElevationProfile){facadeBox(g,u.width*.29,p.eave+p.roof*.5+.48,-Math.min(3,u.depth*.35),.49,1.55,.68,m.red);box(g,u.width*.29,p.eave+p.roof*.5+1.28,-Math.min(3,u.depth*.35),.61,.10,.78,0x8a8880);}
 const clad=new Map<number,T.Material>();
 function cladding(color:number){if(!clad.has(color))clad.set(color,material(color,.95));return clad.get(color)!;}
 //Jittered, clipped rubble polygons match the irregular stone in the192s
 //frame. A regular rectangular grid made this pair look like toy blocks.
 const stoneMap=canvas((c,w,h)=>{c.fillStyle='#88867c';c.fillRect(0,0,w,h);let seed=1618;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const sites:{x:number;y:number;v:number}[]=[];for(let y=-1;y<10;y++)for(let x=-1;x<10;x++)sites.push({x:(x+.17+rand()*.68)*64,y:(y+.15+rand()*.7)*60,v:rand()});for(const a of sites){let poly=[[a.x-65,a.y-60],[a.x+65,a.y-60],[a.x+65,a.y+60],[a.x-65,a.y+60]];for(const b of sites){const dx=b.x-a.x,dy=b.y-a.y;if(a===b||Math.hypot(dx,dy)>150)continue;const limit=(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2,next:number[][]=[];for(let k=0;k<poly.length;k++){const p=poly[k],q=poly[(k+1)%poly.length],fp=p[0]*dx+p[1]*dy-limit,fq=q[0]*dx+q[1]*dy-limit;if(fp<=0)next.push(p);if((fp<=0)!==(fq<=0)){const t=fp/(fp-fq);next.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}poly=next;}if(poly.length<3)continue;c.beginPath();poly.forEach((p,i)=>{const x=a.x+(p[0]-a.x)*.91,y=a.y+(p[1]-a.y)*.91;if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.closePath();c.fillStyle=`hsl(${36+a.v*10},${10+a.v*9}%,${65+a.v*14}%)`;c.fill();c.strokeStyle='#eeead666';c.lineWidth=1.2;c.stroke();}});stoneMap.wrapS=stoneMap.wrapT=T.RepeatWrapping;
 const stoneFront=new T.MeshStandardMaterial({map:stoneMap,bumpMap:stoneMap,bumpScale:.035,color:0xcec7b2,roughness:.94});
 const observedStoneMap=new T.TextureLoader().load('/materials/video/degrassi-16-stone.webp');observedStoneMap.colorSpace=T.SRGBColorSpace;observedStoneMap.wrapS=observedStoneMap.wrapT=T.RepeatWrapping;observedStoneMap.anisotropy=16;
 const observedStone=new T.MeshStandardMaterial({map:observedStoneMap,bumpMap:observedStoneMap,bumpScale:.025,roughness:.96,color:0xe0daca});
 function sillRoof(g:T.Group,w:number,y:number,depth:number,color:number){const q=box(g,0,y,depth/2,w+.22,.13,depth+.25,color);q.rotation.x=.13;return q;}
 function porch(g:T.Group,w:number,entry:number,color:number){
  const d=1.55;box(g,0,.42,d/2,w-.10,.20,d,color);const roof=sillRoof(g,w,3.15,d,color);roofSurface(roof);
  box(g,0,3.07,d,w+.18,.25,.15,color);
  for(const x of [-w/2+.18,w/2-.18]){box(g,x,1.84,d-.08,.13,2.66,.13,color);for(let z=.18;z<d-.10;z+=.15)box(g,x,.97,z,.035,.85,.035,color);box(g,x,1.40,d/2,.075,.075,d,color);}
  for(let x=-w/2+.2;x<w/2-.2;x+=.15){if(Math.abs(x-entry)<.63)continue;box(g,x,.97,d,.032,.85,.032,color);}
  for(const [l,r] of [[-w/2+.15,entry-.65],[entry+.65,w/2-.15]])if(r>l)box(g,(l+r)/2,1.40,d,r-l,.075,.075,color);
  for(let k=0;k<4;k++)box(g,entry,.08+k*.105,d+(3-k)*.25,1.2,.16,.30,0x8d8d80);
 }
 for(const [index,u] of STREET.units.entries()){
  const p=elevation(u),parent=tile(...u.front),mat=p.cladding?cladding(p.brick):brick(p.brick),root=new T.Group();root.name=u.address;root.position.set(u.front[0],0,u.front[1]);root.rotation.y=u.yaw;detail(...u.front).add(root);
  // Roof silhouettes survive detail culling; the street must not become a row
  // of flat blocks when it is viewed from the next intersection.
  const silhouette=new T.Group();silhouette.position.copy(root.position);silhouette.rotation.copy(root.rotation);parent.add(silhouette);
  if(u.address==='893 Queen St E')continue; // Ground model follows the corrected889–899 split.
  parent.add(extrusion(u,p.eave,mat));const w=u.width,depth=Math.max(3,Math.min(u.depth,22));
  if(VIDEO_UNIT_ADDRESSES.has(u.address))continue;
  const g=root;box(g,0,.21,-.05,w,.42,.16,0x7c796e);
  if(p.family==='bend-terrace'){
   // April 2026 street view: flat white end front, then irregular stone and
   // a steep gable. The long lane wall remains the original red-brick mass.
   const end=u.number==='12',frontMat=end?cladding(p.frontColor!):['16','18'].includes(u.number)?observedStone:stoneFront,entry=(p.entrySide||-1)*(['16','18'].includes(u.number)?w/2-.74:w*.31);
   facadeBox(g,0,p.eave/2,.024,w,p.eave,.045,frontMat);
   cornice(g,w,p.eave-.20,p.trim,false);
   if(p.roof>1.5){const cx=p.sharedGable?w/2:0,gw=p.sharedGable?4.2:w*.94;gable(silhouette,cx,gw,p.eave,p.roof,Math.min(depth,8),frontMat);for(const side of [-1,1])line(g,[cx+side*gw/2,p.eave,.14],[cx,p.eave+p.roof,.14],.08,p.trim);if(!p.sharedGable)window(g,0,p.eave+.80,.70,1.17,p.trim,.12,1);}
   else{const q=box(silhouette,0,p.eave+.20,-depth/2,w,.12,depth,0x55574d);roofSurface(q);}
   const pair=end?[-w*.30,-w*.04]:u.number==='16'?[-w*.35,-w*.10]:[-(p.entrySide||-1)*w*.23];
   for(const x of pair)window(g,x,2.35,end?.80:1.02,2.12,p.trim,.10,0,p.trim);
   for(const x of [-w*.31,w*.30])window(g,x,5.73,.83,1.99,p.trim,.10,1,p.trim);
   if(u.number==='16')for(const x of pair){box(g,x,1.21,.42,.99,.18,.37,0xe0dfd3);for(let k=0;k<7;k++){const flower=new T.Mesh(new T.SphereGeometry(.047,5,4),material(k%2?0xa6505a:0xe6bb69));flower.position.set(x-.36+k*.12,1.37,.46);g.add(flower);}}
   door(g,entry,p.door,.90,p.trim);window(g,entry,2.04,.67,1.63,p.trim,.28,0,p.trim);
   // The photograph shows narrow entrance steps, not a full-width porch.
   box(g,entry,.85,.55,1.34,.16,1.05,p.trim);
   const d=Math.min(2.9,Math.max(1.75,u.setback-5.1));
   for(let k=0;k<6;k++){const z=1.0+k*(d-1)/6;box(g,entry,.76-k*.12,z,1.31,.17,(d-1)/6+.035,end?p.trim:0x77786c);}
   for(const side of [-1,1]){line(g,[entry+side*.72,1.76,.77],[entry+side*.72,.95,d],.027,p.trim);for(let k=0;k<9;k++){const t=k/8;box(g,entry+side*.72,1.25-t*.70,.78+t*(d-.78),.028,1.03,.028,p.trim);}}
   const canopy=box(g,0,3.91,.52,w+.10,.13,1.20,p.trim);canopy.rotation.x=.12;roofSurface(canopy);box(g,0,3.84,1.08,w+.10,.18,.11,p.trim);
   for(const x of u.number==='18'?[entry+.71]:[entry-.71,entry+.71]){box(g,x,2.42,.89,.085,2.87,.085,p.trim);line(g,[x,3.54,.83],[x,3.80,.18],.038,p.trim);}
   if(end){for(const x of [-w*.32,-w*.10,w*.10]){const pot=new T.Mesh(new T.CylinderGeometry(.23,.16,.38,12),material(x<0?0xb7ab95:0x6a695c));pot.position.set(x,.21,1.10);g.add(pot);for(let k=0;k<5;k++)line(g,[x,.40,1.10],[x+Math.sin(k)*.18,.67+(k%3)*.10,1.10+Math.cos(k)*.18],.014,0x69735b);}}
   box(g,w/2-.09,p.eave/2,.13,.07,p.eave,.07,p.trim);
  }else if(p.family==='degrassi-row'||p.family==='degrassi-victorian'){
   // Video reference: this is a connected transverse-roof terrace,
   // not a series of deep, identical attic gables. 24 and 28 are numbered
   // in the film; intervening profiles follow the City parcel sequence.
   const ornate=p.family==='degrassi-victorian',entry=(p.entrySide||1)*w*.28,wx=-(p.entrySide||1)*w*.21;
   const roofDepth=Math.min(depth,8.4),half=roofDepth/2,slopeLen=Math.hypot(half,p.roof);
   // Ridge runs parallel to the street. Short forward gables meet this roof.
   for(const side of [-1,1]){const roof=box(silhouette,0,p.eave+p.roof/2,-half+side*half/2,w+.08,.10,slopeLen,0x5c625e);roof.rotation.x=side*Math.atan2(p.roof,half);roofSurface(roof);}
   const gx=ornate?-w*.13:wx*.60,gw=w*(ornate?.78:.69);
   const face=p.gableStyle==='timber'?cladding(0x737c69):mat;
   gable(silhouette,gx,gw,p.eave,p.roof,roofDepth*.38,face);
   for(const side of [-1,1]){
    line(g,[gx+side*gw/2,p.eave,.15],[gx,p.eave+p.roof,.15],.067,p.trim);
    if(p.gableStyle==='timber')line(g,[gx+side*gw*.38,p.eave+.18,.17],[gx,p.eave+p.roof*.65,.17],.045,p.trim);
   }
   if(p.gableStyle==='timber')line(g,[gx,p.eave+.06,.17],[gx,p.eave+p.roof-.1,.17],.055,p.trim);
   // The brick gables in the filmed 20–28 row are blank. Do not invent
   // an extra attic sash. The taller northern group has a narrow opening.
   if(ornate)window(g,gx,p.eave+.85,.64,1.2,p.trim,.13,0,p.trim,terraceGlass);
   cornice(g,w,p.eave-.10,p.trim);
   window(g,wx,2.43,Math.min(1.32,w*.29),2.17,p.trim,.12,1,p.trim,u.number==='26'?undefined:terraceGlass);
   for(const x of [wx,entry]){
    window(g,x,5.52,Math.min(1.10,w*.23),2.04,p.trim,.12,1,p.trim,u.number==='26'||u.number==='28'?undefined:terraceGlass);
    box(g,x,6.64,.13,Math.min(1.31,w*.27),.20,.19,ornate?p.trim:0x39423c);
   }
   const base=.92;door(g,entry,p.door,base,p.trim,terraceGlass);
   // Slender transom and a recessed glazed entry with a real porch depth.
   window(g,entry,3.10,.70,.35,p.trim,.25,2,p.trim,terraceGlass);
   const timber=u.number==='28'?0x9b8b6e:ornate?0x39463f:p.trim,porchDepth=ornate?.92:1.42;
   if(ornate){box(g,entry,.84,porchDepth/2,1.38,.18,porchDepth,0x919285);}
   else{
    box(g,0,.84,porchDepth/2,w-.12,.18,porchDepth,timber);
    const canopy=box(g,0,3.86,.83,w+.08,.12,1.90,p.trim);canopy.rotation.x=.13;roofSurface(canopy);
    box(g,0,3.72,1.74,w+.07,.19,.13,p.trim);
    const pier=(p.entrySide||1)*w*.45;facadeBox(g,pier,2.25,1.39,.27,2.66,.29,mat);
    box(g,pier,3.63,1.39,.43,.16,.44,p.trim);
   }
   const reach=Math.min(3.72,u.setback-5.65),steps=6,run=(reach-porchDepth)/steps,stairW=u.number==='28'?1.68:1.38;
   for(let k=0;k<steps;k++)box(g,entry,.77-k*.125,porchDepth+run*(k+.5),stairW,.17,run+.04,ornate?0x919285:timber);
   for(const side of [-1,1]){
    const x=entry+side*(stairW/2+.03);
    line(g,[x,1.82,porchDepth],[x,1.0,reach],.040,timber);
    for(let k=0;k<10;k++){const t=k/9;box(g,x,1.31-.82*t,porchDepth+(reach-porchDepth)*t,.035,1.02,.035,timber);}
   }
   // Porch balustrade only across the bay beside the stairs.
   const left=(p.entrySide||1)>0?-w/2+.12:entry+stairW/2,right=(p.entrySide||1)>0?entry-stairW/2:w/2-.12;
   if(!ornate){for(let x=left;x<right;x+=.15)box(g,x,1.37,porchDepth,.035,.94,.035,timber);
    if(right>left)box(g,(left+right)/2,1.86,porchDepth,right-left,.08,.09,timber);}
   if(ornate){
    for(const y of [3.62,7.04])box(g,0,y,.13,w,.15,.23,p.trim);
    // Segmental stone arch over the door, as seen through the trees.
    const a=new T.Shape();a.moveTo(-.65,0);a.quadraticCurveTo(0,.49,.65,0);a.lineTo(.65,.18);a.quadraticCurveTo(0,.70,-.65,.18);a.closePath();
    const arch=new T.Mesh(new T.ExtrudeGeometry(a,{depth:.18,bevelEnabled:false}),material(p.trim));arch.position.set(entry,3.25,.13);g.add(arch);
    for(const dx of [-.66,.66])box(g,entry+dx,2.12,.18,.14,2.26,.16,p.trim);
   }
   if(u.number==='20'){
    for(const x of [wx,entry]){box(g,x,6.63,.14,1.36,.24,.13,0xc4b590);for(const dx of [-.61,.61])box(g,x+dx,6.08,.14,.10,.96,.12,0xc4b590);}
   }
   box(g,w/2-.11,p.eave/2,.15,.055,p.eave,.065,p.trim);
   line(g,[-w/2+.28,.12,.18],[-w/2+.28,1.27,.18],.018,0x7b8075);
   box(g,-w/2+.28,1.4,.18,.20,.27,.15,0x92968a);
   chimney(silhouette,u,p);
  }else if(p.family==='shop'){
   if(u.address!=='772 Queen St E')cornice(g,w,p.eave-.20,0x605c53,true);for(let floor=1;floor<p.floors;floor++){const y=3.6+(floor-.5)*3.2;for(let k=0;k<p.windows;k++){const x=(k+.5)*w/p.windows-w/2;window(g,x,y,Math.min(1.15,w/p.windows*.59),1.90,p.trim,.09,(index+k)%4);box(g,x,y+1.1,.10,Math.min(1.45,w/p.windows*.74),.16,.19,0xb8a689);}box(g,0,y-1.46,.08,w,.08,.15,0xa69680);}
   if(!['920 Queen St E','772 Queen St E'].includes(u.address)){
   const entry=w*.31,shopW=Math.max(.9,w-1.75);box(g,0,1.61,.03,w-.2,3.17,.08,0x34413e);window(g,-.57,1.73,shopW,2.43,0x74776b,.105,2);door(g,entry,0x3d4844,.06);
   box(g,0,3.23,.16,w-.05,.43,.23,[0x374c4b,0x51453e,0x30393f,0xb7b09a][index%4]);cornice(g,w,3.47,0x52534b);
   box(g,-.57,.37,.12,shopW,.44,.09,0x48554f);for(let x=-w/2+.4;x<w/2;x+=1.5)box(g,x,.36,.19,.85,.28,.025,0x35423d);
   }
  }else if(p.family==='modern-house'){
   const entry=-w*.28,wx=w*.19;door(g,entry,p.door,.18);window(g,wx,1.62,w*.48,1.92,0x666f72,.10,1);
   for(let level=1;level<p.floors;level++){window(g,0,level*3.1+1.55,w*.72,2.5,0x6c7375,.16,1);box(g,0,level*3.1+.07,.26,w-.08,.16,.64,0x5c6264);box(g,0,level*3.1-.03,.27,w-.12,.045,.56,0xb3794b);}
   cornice(g,w,p.eave-.10,0x62696a);for(let k=0;k<3;k++)box(g,entry,.07+k*.10,.27+(3-k)*.17,1.13,.14,.20,0x757773);
  }else if(p.family==='mansard'||p.family==='stucco-gable'||p.family==='porch-gable'){
   const entry=(p.entrySide||-1)*w*.29,wx=-(p.entrySide||-1)*w*.18;
   if(p.family==='mansard'){
    // A shallow roof skirt with a broad rectangular dormer, not a triangular
    // Victorian gable. The upper storey is recessed behind the skirt.
    box(silhouette,0,4.53,-depth/2-.60,w-.06,2.56,Math.max(2,depth-1.20),p.brick);
    const rise=1.05,run=1.30,len=Math.hypot(rise,run),skirt=box(silhouette,0,p.eave+rise/2,-run/2,w+.18,.12,len,0xffffff);skirt.rotation.x=-Math.atan2(rise,run);roofSurface(skirt);
    const dormerW=w*.74;box(g,0,4.92,-.24,dormerW,1.9,.65,p.brick);box(g,0,5.90,-.16,dormerW+.20,.12,.98,0x4c504b);
    window(g,0,4.96,dormerW*.78,1.40,p.trim,.115,0);for(const x of [-dormerW*.14,dormerW*.14])box(g,x,4.96,.21,.046,1.39,.075,p.trim);
    for(let y=.58;y<3.20;y+=.14)box(g,0,y,.027,w-.12,.021,.045,0xa99f87);
    for(let y=4.09;y<5.84;y+=.14)for(const x of [-dormerW*.46,dormerW*.46])box(g,x,y,.108,dormerW*.075,.016,.045,0xaaa08b);
    window(g,wx,1.91,w*.44,1.66,p.trim,.11,2);door(g,entry,p.door,.45);
    // The observed doors are full-height glazing, surrounded by a slim frame.
    window(g,entry,1.55,.64,1.95,p.door,.27,0);
    const d=Math.min(2.25,u.setback-5.5);for(let k=0;k<4;k++)box(g,entry,.07+k*.12,d-(k*.26),1.21,.14,.31,0xa3a094);
    for(const side of [-1,1]){line(g,[entry+side*.64,.65,d+.15],[entry+side*.64,1.31,.55],.025,u.number==='90'?0xd4d6cd:0x373e38);for(let k=0;k<5;k++){const z=.55+k*(d-.55)/4;box(g,entry+side*.64,.74,z,.023,.79,.023,u.number==='90'?0xd4d6cd:0x373e38);}}
   }else{
    gable(silhouette,0,w*.94,p.eave,p.roof,depth,mat);
    const base=.42;door(g,entry,p.door,base);
    if(p.family==='stucco-gable'){
     window(g,wx,1.97,w*.38,1.93,p.trim,.11,1);window(g,0,4.85,w*.43,1.68,p.trim,.12,0);box(g,0,4.85,.21,.05,1.68,.09,p.trim);
     const d=Math.min(2.2,u.setback-5.6);for(let y=.15;y<1.02;y+=.14)box(g,-w*.08,y,d,w*.73,.12,.045,0xa78d68);
    }else{
     window(g,wx,1.91,w*.39,1.89,p.trim,.12,2);porch(g,w,entry,p.trim);
     // Three-sided upper bay with recessed dark frames and panelled apron.
     const bw=w*.63,bx=w*.05;box(g,bx,4.57,.35,bw,2.75,.72,p.trim);
     window(g,bx,4.88,bw*.49,1.75,p.trim,.76,0);
     for(const side of [-1,1]){const face=new T.Group();face.position.set(bx+side*bw*.38,0,.47);face.rotation.y=side*.65;g.add(face);window(face,0,4.88,bw*.24,1.75,p.trim,.15,0);box(g,bx+side*bw*.28,3.75,.77,bw*.39,.44,.04,0x6c756c);}
     box(g,bx,6.04,.39,bw+.22,.14,1.03,p.trim);window(g,0,p.eave+.83,.81,1.17,p.trim,.12,1);
     for(const side of [-1,1]){line(g,[side*w*.47,p.eave,.13],[0,p.eave+p.roof,.13],.073,p.trim);line(g,[0,p.eave+.14,.15],[side*w*.23,p.eave+p.roof*.48,.15],.052,p.trim);}
     line(g,[0,p.eave+.10,.15],[0,p.eave+p.roof-.15,.15],.06,p.trim);
    }
   }
   box(g,w/2-.10,p.eave/2,.13,.055,p.eave,.065,p.trim);chimney(silhouette,u,p);
  }else{
   const special=u.address==='52 De Grassi St',entry=special?0:-w*.28,winX=special?[-w*.29,w*.29]:[w*.20];
   if(p.family==='gable'||p.family==='bay-gable')gable(silhouette,w*.19,w*.66,p.eave,p.roof,depth,mat);
   else if(p.family==='gambrel'){
    const sw=w+.18,sh=new T.Shape();sh.moveTo(-sw/2,p.eave);sh.lineTo(-sw*.38,p.eave+p.roof*.73);sh.lineTo(0,p.eave+p.roof);sh.lineTo(sw*.38,p.eave+p.roof*.73);sh.lineTo(sw/2,p.eave);sh.closePath();const body=new T.Mesh(new T.ExtrudeGeometry(sh,{depth,bevelEnabled:false}),mat);body.position.z=-depth;silhouette.add(body);
    const points=[[-sw/2,p.eave],[-sw*.38,p.eave+p.roof*.73],[0,p.eave+p.roof],[sw*.38,p.eave+p.roof*.73],[sw/2,p.eave]];
    for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],length=Math.hypot(b[0]-a[0],b[1]-a[1]),r=box(silhouette,(a[0]+b[0])/2,(a[1]+b[1])/2,-depth/2,length,.13,depth+.3,0x515752);r.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);roofSurface(r);line(g,[...a,.14],[...b,.14],.05,p.trim);}
   }else if(p.family==='cottage'){
    // Lateral roof with a small central front gable on the documented cottage.
    const span=depth*.48,len=Math.hypot(span,p.roof*.56);for(const side of [-1,1]){const q=box(silhouette,0,p.eave+p.roof*.28,-depth/2+side*span/2,w+.30,.12,len,0x50524b);q.rotation.x=side*Math.atan2(p.roof*.56,span);roofSurface(q);}
    if(special)gable(silhouette,0,w*.35,p.eave,p.roof,2.2,mat);
   }else{cornice(g,w,p.eave-.10,0x74776c,true);if(u.address==='14 Boulton Ave'||u.address==='16 Boulton Ave'){box(g,0,4.94,.015,w,3.02,.07,p.trim);for(let y=3.5;y<6.7;y+=.18)box(g,0,y,.06,w,.022,.035,0x3e4a54);}}
   for(const x of winX)window(g,x,1.80,special?1.12:Math.min(1.46,w*.34),1.90,p.trim,.12,index%4);
   door(g,entry,p.door,.35);if(p.floors>1)for(let k=0;k<p.windows;k++){const x=(k+.5)*w/p.windows-w/2;window(g,x,4.77,Math.min(1.16,w*.27),1.86,p.trim,.13,(index+k)%4);}
   if(p.family==='gable'||p.family==='bay-gable'){window(g,w*.19,p.eave+.60,.74,.99,p.trim,.12,index%4);for(const side of [-1,1])line(g,[w*.19+side*w*.33,p.eave,.15],[w*.19,p.eave+p.roof,.15],.047,p.trim);}
   if(p.family==='bay-gable'){
    const bx=w*.16,bw=w*.49;box(g,bx,3.25,.37,bw,5.65,.67,0x776952);for(const y of [1.80,4.77]){window(g,bx,y,bw*.56,1.96,p.trim,.75,index%4);for(const side of [-1,1]){const sideFace=new T.Group();sideFace.position.set(bx+side*bw*.40,0,.50);sideFace.rotation.y=side*.65;g.add(sideFace);window(sideFace,0,y,bw*.25,1.96,p.trim,.15,0);}box(g,bx,y-1.17,.42,bw+.12,.23,.90,p.trim);}box(g,bx,6.16,.38,bw+.24,.18,1.07,p.trim);
   }
   if(p.family==='gambrel'){const porch=box(g,w*.10,3.02,.55,w*.69,.12,1.55,0x586463);porch.rotation.x=.2;for(const x of [-w*.24,w*.44])box(g,x,1.75,1.03,.10,2.53,.10,p.trim);window(g,w*.12,1.74,w*.53,1.6,p.trim,.33,0);}
   if(special){
    const rise=p.roof,gw=w*.35;for(const side of [-1,1]){line(g,[side*gw/2,p.eave,.13],[0,p.eave+rise,.13],.068,p.trim);for(let k=1;k<7;k++){const t=k/7;const ring=new T.Mesh(new T.TorusGeometry(.10,.025,5,14),material(p.trim));ring.position.set(side*gw/2*(1-t),p.eave+rise*t-.12,.14);g.add(ring);}}line(g,[0,p.eave+.2,.14],[0,p.eave+rise+.10,.14],.026,p.trim);
    arch(g,0,3.69,.56,1.18,p.trim,trim);const oval=new T.Mesh(new T.CircleGeometry(.32,24),glass);oval.scale.y=1.48;oval.position.set(0,1.63,.21);g.add(oval);
    for(const side of [-1,1])line(g,[side*.70,2.89,.85],[0,3.64,.85],.065,p.trim);
    for(const x of [-.64,.64])box(g,x,2.89,.42,.09,.68,.8,p.trim);
   }
   const steps=Math.min(4,Math.max(2,Math.floor((u.setback-4.9)/.24)));for(let k=0;k<steps;k++)box(g,entry,.07+(steps-k-1)*.11,.26+k*.24,1.17,.14,.28,0x969185);
   if(u.setback>6.1&&!p.garden){const depth=Math.min(2.3,u.setback-5.4);for(const side of [-1,1])line(g,[entry+side*.64,.80,.20],[entry+side*.64,.63,depth],.026,0x454e45);fence(g,w-.18,depth,entry);}
   chimney(silhouette,u,p);
   // Individual downspouts and service meters, on the wall side of the walk.
   box(g,w/2-.13,p.eave/2,.12,.06,p.eave,.07,0x888d84);box(g,-w/2+.35,1.33,.13,.22,.31,.13,0x878c80);line(g,[-w/2+.35,.1,.16],[-w/2+.35,1.25,.16],.016,0x666e66);
  }
  // A lightweight window layer remains after the detailed facade is culled.
  const distant=new T.Group();distant.position.copy(root.position);distant.rotation.copy(root.rotation);far(...u.front).add(distant);
  for(let floor=0;floor<p.floors;floor++)for(let k=0;k<p.windows;k++){const pane=new T.Mesh(new T.PlaneGeometry(Math.min(1.25,w/p.windows*.54),1.8),interiors[(index+k)%4]);pane.position.set((k+.5)*w/p.windows-w/2,1.85+floor*3.05,.09);distant.add(pane);}
  const labelGeometry=new T.PlaneGeometry(.48,.18),uv=labelGeometry.getAttribute('uv'),rows=Math.ceil(STREET.units.length/16);for(let k=0;k<uv.count;k++)uv.setXY(k,(index%16+uv.getX(k))/16,1-(Math.floor(index/16)+1-uv.getY(k))/rows);const label=new T.Mesh(labelGeometry,labelMat);label.position.set(p.family==='shop'?w*.31:p.family==='cottage'&&u.number==='52'?0:(p.entrySide||-1)*w*.28,2.79,.32);root.add(label);
 }
 const byId=new Map(STREET.units.map(u=>[u.id,u]));
 for(const face of frontages.faces){
  if((face.id===5436445&&face.mid[1]<-50)||(face.id===5436204&&face.mid[1]>-57))continue; // Video-authored service wall / mostly blank north return.
  const u=byId.get(face.id)!;if(VIDEO_UNIT_ADDRESSES.has(u.address))continue;const p=elevation(u),g=new T.Group();g.position.set(face.mid[0],0,face.mid[1]);g.rotation.y=face.yaw;detail(...face.mid as Point).add(g);
  if(p.blankSide){box(g,0,.56,.06,face.length,1.12,.09,0x444a44);box(g,0,1.18,.09,face.length,.07,.16,0x777d6d);box(g,-face.length*.44,p.eave/2,.11,.072,p.eave,.082,0x4e554d);cornice(g,face.length,p.eave-.16,p.trim);continue;}
  const count=Math.min(4,Math.max(1,Math.floor(face.length/4.2))),floors=p.floors;
  for(let floor=0;floor<floors;floor++)for(let k=0;k<count;k++){const x=(k+.5)*face.length/count-face.length/2;window(g,x,1.85+floor*2.95,.83,1.48,p.trim,.09,(u.id+k)%4);}
  cornice(g,face.length,p.eave-.13,p.cladding?p.trim:0x958c7c);
 }
 // September 2018 street panorama at De Grassi / Gerrard: St Ann's is
 // pale stone with round-headed windows; the opposite institutional block
 // has deep concrete fins. Neither should be represented as blank brick.
 const stone=m.cream.clone();stone.color.setHex(0xd3d3c8);const concrete=material(0xa4aa9b,.97);
 const streetLines=STREET.roads.filter(r=>r.name!=='Queen Street East').flatMap(r=>r.p.slice(1).map((p,i)=>[r.p[i],p]));
 for(const b of STREET.north){
  const c:Point=[(b.bounds[0]+b.bounds[2])/2,(b.bounds[1]+b.bounds[3])/2],church=b.id===421419,school=b.id===398383,height=Math.max(3,Math.min(b.h,13)),wall=church?stone:school?concrete:m.aged;
  tile(...c).add(extrusion(b,height,wall));
  for(let i=0;i<b.p.length;i++){
   const a=b.p[i],d=b.p[(i+1)%b.p.length],dx=d[0]-a[0],dz=d[1]-a[1],length=Math.hypot(dx,dz);if(length<3.5)continue;
   const mid:Point=[(a[0]+d[0])/2,(a[1]+d[1])/2];if(Math.min(...streetLines.map(([a,b])=>segmentDistance(mid,a,b)))>24)continue;
   let nx=-dz/length,nz=dx/length;if(inside([mid[0]+nx*.10,mid[1]+nz*.10],b.p)){nx=-nx;nz=-nz;}
   const g=new T.Group();g.position.set(mid[0],0,mid[1]);g.rotation.y=Math.atan2(nx,nz);detail(...mid).add(g);
   if(church){
    cornice(g,length,12.65,0xc5c6b7,true);box(g,0,2.15,.10,length,.18,.32,0xa6a99c);
    const count=Math.max(1,Math.round(length/4.9));for(let k=0;k<count;k++){const x=(k+.5)*length/count-length/2;arch(g,x,7.15,1.33,3.25,0xb9bdac,stone);window(g,x,1.15,.91,1.25,0x848d83,.10,1);if(k%2===0){box(g,x,6.60,.33,2.15,.23,.83,0xb9bdaf);for(const q of [-.8,.8])box(g,x+q,6.32,.21,.18,.37,.4,0xa8ad9f);}}
    if(length>25){const entry=-length*.34;arch(g,entry,1.1,2.35,4.8,0xbcc1b4,stone);box(g,entry,2.50,.13,1.98,2.8,.10,0x473831);for(let k=0;k<6;k++)box(g,entry,.09+k*.15,.23+(5-k)*.30,3.8,.18,.36,0xaaa99d);for(const q of [-2,2]){line(g,[entry+q,.85,1.86],[entry+q,1.78,.18],.025,0xb5bcb8);}}
   }else if(school){
    box(g,0,3.50,.12,length,.55,.55,0xaeb2a1);box(g,0,12.75,.12,length,.35,.5,0x979f90);
    const count=Math.max(1,Math.round(length/2.5));for(let k=0;k<count;k++){const x=(k+.5)*length/count-length/2;for(const y of [1.7,5.0,8.0,11.0])window(g,x,y,1.45,y<3?1.1:2.3,0x606d68,.08,1);box(g,x-length/count/2,8.02,.48,.32,8.80,1.04,0xabb19f);}
   }else{
    // These support elevations remain inferred and are labelled as such in
    // the audit. Keep readable openings on the extended street's end blocks.
    const count=Math.max(1,Math.round(length/3.5)),floors=Math.max(1,Math.round(height/3.25));for(let k=0;k<count;k++)for(let floor=0;floor<floors;floor++)window(g,(k+.5)*length/count-length/2,1.8+floor*3.25,1.1,1.7,0xb3b2a1,.10,k%4);cornice(g,length,height-.20,0x727769);
   }
  }
 }
 return {window,arch,cornice,brick,interiors};
}
