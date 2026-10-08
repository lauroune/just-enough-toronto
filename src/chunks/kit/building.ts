import * as T from 'three';
import {box} from '../../world';
import {inside,segmentDistance} from '../../geography';
import {groundHeight} from '../../terrain';
import type {Point} from '../../game';
import type {ChunkBuilding,ChunkContext,ChunkRoad} from '../types';
import {kitMaterials,brick,brickTint,material,SIGNBANDS} from './materials';

// Buildings the way Queen East does them (src/geo-world.ts): an extruded mass with a
// dark roof, then every wall edge gets a "facade frame" — a group standing on the edge,
// facing out — carrying real relief: plinth, cornice, recessed windows with sills and
// lintels, ground-floor shopfronts with coloured signbands. Near the player that relief
// is geometry; far away one textured plane stands in for it.

export type FacadeStyle='victorian'|'modern'|'house'|'industrial';
export type BuildingOptions={
 /** Override the style chosen from the OSM tags. */
 style?:FacadeStyle;
 /** Override the wall tint (hex). Brick styles only. */
 tint?:number;
 /** Streets used to decide which walls face the street (and get shopfronts / porches). Default: all chunk roads. */
 streets?:ChunkRoad[];
 /** Force (true) or suppress (false) ground-floor shopfronts on street walls. Default: from tags and street type. */
 shopfronts?:boolean;
 /** Names for the signbands, left to right along the street wall. Default: named places inside the footprint. */
 signs?:string[];
 /** Leave this many metres of plain wall above the ground-floor relief (e.g. a hero facade added separately). */
 skipDetail?:boolean;
};
const ARTERIAL=new Set(['primary','secondary','tertiary','trunk','primary_link','secondary_link','tertiary_link']);
const centroid=(p:Point[]):Point=>[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];
/** Detail windows stop here; above it the facade plane carries the windows (towers stay cheap). */
const DETAIL_CEILING=22;

/** Choose a facade style from OSM tags and height, as Queen East's `modern` test does. */
export function styleOf(b:ChunkBuilding):FacadeStyle{
 const kind=b.kind??'',mat=b.material??'';
 if(mat==='glass'||mat==='metal'||(b.levels??0)>=8||b.h>28||kind==='office'&&b.h>16)return 'modern';
 if(['house','detached','semidetached_house','terrace','residential'].includes(kind)&&b.h<13)return 'house';
 if(['industrial','warehouse','garage','garages','shed','service'].includes(kind))return 'industrial';
 return 'victorian';
}

/** Ground level for a footprint: the lowest corner, so nothing floats on a slope. */
export const baseHeight=(p:Point[])=>Math.min(...p.map(([x,z])=>groundHeight(x,z)));

/** A box with world-metric UVs (1.4 m per texture repeat), like architecture.ts facadeBox, for textured walls. */
function massing(b:ChunkBuilding,height:number){
 const shape=new T.Shape(b.p.map(v=>new T.Vector2(v[0],-v[1])));for(const h of b.holes)shape.holes.push(new T.Path(h.map(v=>new T.Vector2(v[0],-v[1]))));
 const g=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);
 const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/1.4,uv.getY(i)/1.4);
 return g;
}

/** An extrusion's caps (roof and floor, group 0) and sides (group 1) as two geometries. */
function splitCaps(geo:T.BufferGeometry):[T.BufferGeometry,T.BufferGeometry]{
 const take=(index:number)=>{const out=new T.BufferGeometry(),ranges=geo.groups.filter(g=>g.materialIndex===index);
  for(const [name,a] of Object.entries(geo.attributes)){const attr=a as T.BufferAttribute,parts=ranges.map(r=>(attr.array as Float32Array).slice(r.start*attr.itemSize,(r.start+r.count)*attr.itemSize)),len=parts.reduce((n,p)=>n+p.length,0),arr=new Float32Array(len);let o=0;for(const p of parts){arr.set(p,o);o+=p.length;}out.setAttribute(name,new T.BufferAttribute(arr,attr.itemSize));}
  return out;};
 const pair:[T.BufferGeometry,T.BufferGeometry]=[take(0),take(1)];geo.dispose();return pair;
}
/** A group standing on wall edge a→b of footprint p, +Z facing out of the building. */
export function facadeFrame(parent:T.Object3D,a:Point,b:Point,p:Point[],y=0){
 const g=new T.Group(),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);let nx=-dz/len,nz=dx/len;
 if(inside([(a[0]+b[0])/2+nx*.1,(a[1]+b[1])/2+nz*.1],p)){nx=-nx;nz=-nz;}
 g.position.set((a[0]+b[0])/2,y,(a[1]+b[1])/2);g.rotation.y=Math.atan2(nx,nz);parent.add(g);
 return {g,len,mid:[(a[0]+b[0])/2,(a[1]+b[1])/2] as Point};
}

/** The street a wall faces, if its midpoint is within `reach` metres of one (and roughly parallel). */
export function facingStreet(a:Point,b:Point,streets:ChunkRoad[],reach=14){
 const mid:Point=[(a[0]+b[0])/2,(a[1]+b[1])/2],dir=Math.atan2(b[1]-a[1],b[0]-a[0]);let best:{road:ChunkRoad;d:number}|undefined;
 for(const road of streets){if(road.w<5)continue;for(let i=1;i<road.p.length;i++){const d=segmentDistance(mid,road.p[i-1],road.p[i]);if(d>reach+road.w/2||(best&&d>=best.d))continue;
  const rdir=Math.atan2(road.p[i][1]-road.p[i-1][1],road.p[i][0]-road.p[i-1][0]),skew=Math.abs(Math.sin(dir-rdir));if(skew<.5)best={road,d};}}
 return best?.road;
}

/**
 * Build one building into the chunk: massing on the tile layer, facade relief on the
 * detail layer, window planes on the far layer, and its walls as a solid footprint.
 */
export function building(ctx:ChunkContext,b:ChunkBuilding,o:BuildingOptions={}){
 const m=kitMaterials(),style=o.style??styleOf(b),h=Math.max(3,b.h),c=centroid(b.p),y0=baseHeight(b.p),seed=hash(b.id);
 const streets=o.streets??ctx.data.roads,modern=style==='modern';
 const wall=modern?m.panel:style==='industrial'?brick(0xc9b7a2):brick(o.tint??brickTint(b.colour,seed));
 // Roof caps and walls as two single-material meshes, so the batching pass merges every building in a tile.
 const [capsGeo,wallsGeo]=splitCaps(massing(b,h));
 for(const [geo,mat] of [[capsGeo,m.roof],[wallsGeo,wall]] as const){const mesh=new T.Mesh(geo,mat);mesh.position.y=y0;mesh.castShadow=mesh.receiveShadow=true;ctx.layers.tile(...c).add(mesh);}
 if(style==='house'&&b.p.length===4)gable(ctx,b,h,y0,seed);
 ctx.solid(b.p,h);
 const names=o.signs??ctx.data.places.filter(pl=>inside(pl.at,b.p)).map(pl=>pl.name);let sign=0;
 for(let i=0;i<b.p.length;i++){
  const a=b.p[i],e=b.p[(i+1)%b.p.length],len=Math.hypot(e[0]-a[0],e[1]-a[1]);if(len<3.5||h<4)continue;
  const street=facingStreet(a,e,streets),mid:Point=[(a[0]+e[0])/2,(a[1]+e[1])/2];
  // Walls that face no street get only the painted window plane, at every distance (2 triangles).
  // Street walls get it on the far layer, with real relief nearby.
  const relief=!!street&&!o.skipDetail;
  const far=facadeFrame(relief?ctx.layers.far(...mid):ctx.layers.tile(...mid),a,e,b.p,y0).g,plane=new T.PlaneGeometry(len,h),uv=plane.getAttribute('uv');
  for(let n=0;n<uv.count;n++)uv.setXY(n,uv.getX(n)*len/3.1,uv.getY(n)*h/3.12);
  const pm=new T.Mesh(plane,modern?m.distantModern:m.distantBrick);pm.position.set(0,h/2,.06);far.add(pm);
  if(!relief)continue;
  const f=facadeFrame(ctx.layers.detail(...mid),a,e,b.p,y0).g;
  const shops=street&&(o.shopfronts??(!!b.shop||['retail','commercial','shop'].includes(b.kind??'')||(style==='victorian'&&ARTERIAL.has(street.k))));
  if(style!=='house'){box(f,0,.25,.04,len,.5,.09,0x625e56);box(f,0,h-.15,.08,len,.22,.24,0xa69c8c);box(f,0,h+.08,0,len+.06,.18,.30,0x85847b);}
  if(modern)curtainWall(f,len,h,shops?4.2:1.8);
  else windows(f,len,Math.min(h,DETAIL_CEILING),shops?5.3:style==='house'?1.2:2.3,style);
  if(modern&&h>DETAIL_CEILING)towerTop(f,len,h);
  if(shops)sign+=shopfronts(f,len,seed+i,names.slice(sign));
  if(shops&&!modern&&h<17){for(let x=-len/2+.22;x<len/2;x+=.48)box(f,x,h-.35,.12,.13,.18,.24,0xaaa18f);for(let y=3.8;y<Math.min(h,DETAIL_CEILING)-1;y+=3.15)box(f,0,y,.03,len,.07,.085,0xa59d8b);}
  if(style==='house'&&street&&len<14&&len>4)porch(f,len);
 }
}

/** Victorian sash windows: recess, glass, sill and lintel, in bays ~2.9 m wide, floors 3.15 m apart. (Queen East's hero streets add mullion and transom bars; at chunk scale they cost a third more for little.) */
export function windows(f:T.Group,len:number,top:number,from:number,style:FacadeStyle){
 const glass=kitMaterials().glass,count=Math.max(1,Math.floor(len/(style==='industrial'?3.6:2.9)));
 for(let k=0;k<count;k++){const x=(k+.5)*len/count-len/2;for(let y=from;y<top-1.1;y+=3.15){
  const w=Math.min(style==='industrial'?2.2:1.28,len/count*.57),h=style==='industrial'?2.2:1.8;
  box(f,x,y,.04,w+.22,h+.18,.13,0x494a45);const win=box(f,x,y,.13,w,h,.045,0xffffff);win.material=glass;
  box(f,x,y-h/2-.08,.19,w+.35,.15,.30,0xc6bca7);box(f,x,y+h/2+.09,.13,w+.3,.16,.22,0xbbae97);
 }}
}
/** Modern curtain wall: 3.1 m glazed bays, dark spandrels, mullions, glass balconies on long faces. */
export function curtainWall(f:T.Group,len:number,h:number,from:number){
 const glass=kitMaterials().glass,count=Math.max(1,Math.round(len/3.1)),bay=len/count;
 for(let y=from;y<Math.min(h,DETAIL_CEILING)-1;y+=3.12){box(f,0,y+1.43,.09,len,.15,.2,0x30383b);
  for(let k=0;k<count;k++){const x=(k+.5)*bay-len/2,pane=box(f,x,y,.06,bay-.22,2.54,.07,0xffffff);pane.material=glass;box(f,x,y,.15,.055,2.6,.06,0x535b5d);box(f,x-bay/2+.08,y,.12,.11,2.95,.12,0x3a4245);
   if(len>18&&y>5&&k%3!==2){box(f,x,y-1.26,.72,bay-.12,.13,1.5,0x4a5152);const bal=box(f,x,y-.77,1.42,bay-.16,.87,.055,0xffffff);bal.material=glass;box(f,x,y-.29,1.45,bay-.06,.035,.055,0x8d9695);}}}
}
/** Above the detail ceiling, towers keep a crisp silhouette: vertical fins and a crown. */
function towerTop(f:T.Group,len:number,h:number){
 for(let x=-len/2+1.55;x<len/2;x+=3.1)box(f,x,(DETAIL_CEILING+h)/2,.1,.14,h-DETAIL_CEILING,.16,0x56606a);
 box(f,0,h-1.1,.12,len,1.8,.2,0x3e474e);
}
/** Ground-floor shops in ~6.2 m bays: dark surround, glass, door, push plate, coloured signband (named when known). Returns names used. */
export function shopfronts(f:T.Group,len:number,seed:number,names:string[]=[]){
 const glass=kitMaterials().glass,bays=Math.max(1,Math.round(len/6.2));let used=0;
 for(let k=0;k<bays;k++){const w=len/bays,x=-len/2+w*(k+.5);
  box(f,x,1.8,.045,w-.38,3.05,.15,0x383d3c);const pane=box(f,x-.38,1.85,.145,Math.max(.5,w-1.8),2.7,.04,0xffffff);pane.material=glass;
  box(f,x+w/2-.85,1.6,.18,.82,2.65,.045,0x455455);box(f,x+w/2-.85,1.58,.21,.06,2.65,.055,0x939789);box(f,x+w/2-1.1,1.25,.25,.025,.28,.04,0xd7d2ba);
  const colour=SIGNBANDS[(seed+k)%SIGNBANDS.length];box(f,x,3.5,.2,w-.22,.45,.28,colour);
  if(names[used]){signText(f,names[used],x,3.5,.35,w-.6,colour);used++;}
 }
 return used;
}
const signCache=new Map<string,T.Material>();
/** Lettering for a signband: a canvas texture, cached by text and colour. */
export function signText(parent:T.Object3D,text:string,x:number,y:number,z:number,w:number,band:number){
 const key=`${text}|${band}`;let mat=signCache.get(key);
 if(!mat){const c=document.createElement('canvas');c.width=512;c.height=64;const g=c.getContext('2d')!;g.fillStyle='#'+band.toString(16).padStart(6,'0');g.fillRect(0,0,512,64);
  const light=(((band>>16)&255)*.3+((band>>8)&255)*.59+(band&255)*.11)>140;g.fillStyle=light?'#2a2f30':'#f3ead6';g.font='600 40px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text.toUpperCase().slice(0,24),256,34,480);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;mat=new T.MeshStandardMaterial({map:t,roughness:.8});signCache.set(key,mat);}
 const m=new T.Mesh(new T.PlaneGeometry(w,.4),mat);m.position.set(x,y,z);parent.add(m);return m;
}
/** A simple gable over a four-sided house footprint, ridge along the longer side. */
function gable(ctx:ChunkContext,b:ChunkBuilding,h:number,y0:number,seed:number){
 const [p0,p1,p2,p3]=b.p,l1=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),l2=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),long=l1>=l2;
 const [a,bb,cc,d]=long?[p0,p1,p2,p3]:[p1,p2,p3,p0],w=long?l2:l1,rise=Math.min(3.2,w*.42);
 const mid=(u:Point,v:Point):Point=>[(u[0]+v[0])/2,(u[1]+v[1])/2],r1=mid(a,d),r2=mid(bb,cc);
 const v=[a,bb,cc,d].map(q=>[q[0],y0+h,q[1]]),ridge=[[r1[0],y0+h+rise,r1[1]],[r2[0],y0+h+rise,r2[1]]];
 const pos=[...v[0],...v[1],...ridge[1],...v[0],...ridge[1],...ridge[0],...v[3],...ridge[0],...ridge[1],...v[3],...ridge[1],...v[2],...v[0],...ridge[0],...v[3],...v[1],...v[2],...ridge[1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();
 const roof=new T.Mesh(g,material([0x5b5048,0x6a625a,0x4f5759,0x7a5f50][seed%4],.9));roof.material.side=T.DoubleSide;roof.castShadow=roof.receiveShadow=true;ctx.layers.tile(...centroid(b.p)).add(roof);
 // A chimney at one gable end.
 const ch=new T.Mesh(new T.BoxGeometry(.6,1.6,.6),material(0x8c5a48));ch.position.set(r1[0]*.8+r2[0]*.2,y0+h+rise*.7,r1[1]*.8+r2[1]*.2);ch.castShadow=true;ctx.layers.tile(...centroid(b.p)).add(ch);
}
/** A front porch: deck, sloped roof, posts and railings. */
function porch(f:T.Group,len:number){
 box(f,0,.35,1.0,len*.7,.12,1.65,0xa8a293);const roof=box(f,0,2.8,.85,len*.75,.13,2.1,0x6d7270);roof.rotation.x=.12;
 for(const x of [-len*.31,len*.31]){box(f,x,1.53,1.6,.10,2.45,.10,0xc5c3ae);for(let z=.35;z<1.65;z+=.17)box(f,x,.77,z,.05,.80,.05,0xc5c3ae);}
 box(f,0,.11,1.8,1.3,.22,.45,0xbbb7a7);
}
/** Stable small integer from a string id. */
export function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
