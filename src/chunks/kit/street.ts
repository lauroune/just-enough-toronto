import * as T from 'three';
import {groundHeight} from '../../terrain';
import type {Point} from '../../game';
import type {ChunkContext,ChunkRoad} from '../types';
import {kitMaterials,material} from './materials';

// Streets from OSM centrelines, layered like the surveyed Queen East surfaces:
// asphalt (.025), sidewalk paving (.055) behind a raised curb, painted lines, zebra
// crossings where streets meet, and streetcar track on TTC routes. Everything follows
// the terrain with groundHeight() per vertex, so chunks meet the authored map cleanly.

/** TTC streetcar streets (name prefixes): these get the Queen East track slab and rails. */
export const STREETCAR=['Queen Street','King Street','Spadina Avenue','Dundas Street','College Street','Carlton Street','Bathurst Street','Broadview Avenue','Gerrard Street','Church Street'];
const isStreetcar=(r:ChunkRoad)=>STREETCAR.some(n=>r.n.startsWith(n))&&r.w>=9&&r.n!=='Church Street';
const ARTERIAL=new Set(['primary','secondary','tertiary','trunk']);

/** A flat ribbon along `path`, `width` wide, `y` above the ground, offset sideways by `offset` metres. Metric UVs. */
export function ribbon(path:Point[],width:number,y:number,offset=0){
 const pos:number[]=[],uv:number[]=[],idx:number[]=[];let along=0;
 const dense:Point[]=[path[0]];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/6));for(let k=1;k<=steps;k++)dense.push([a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps]);}
 for(let i=0;i<dense.length;i++){
  const p=dense[i],q=dense[Math.min(i+1,dense.length-1)],o=dense[Math.max(i-1,0)],dx=q[0]-o[0],dz=q[1]-o[1],len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len;
  if(i)along+=Math.hypot(p[0]-dense[i-1][0],p[1]-dense[i-1][1]);
  for(const s of [-1,1]){const x=p[0]+nx*(offset+s*width/2),z=p[1]+nz*(offset+s*width/2);pos.push(x,y+groundHeight(x,z),z);uv.push(along,(s+1)/2*width);}
  if(i){const n=pos.length/3-4;idx.push(n,n+2,n+1,n+1,n+2,n+3);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
/** A flat disc at a street joint so ribbons meet without notches. */
function joint(p:Point,r:number,y:number){const g=new T.CircleGeometry(r,16);g.rotateX(-Math.PI/2);const pos=g.getAttribute('position');for(let i=0;i<pos.count;i++){const x=pos.getX(i)+p[0],z=pos.getZ(i)+p[1];pos.setXYZ(i,x,y+groundHeight(x,z),z);}g.computeVertexNormals();return g;}
const mesh=(g:T.BufferGeometry,m:T.Material,shadow=false)=>{const x=new T.Mesh(g,m);x.receiveShadow=true;x.castShadow=shadow;return x;};
const keyOf=(p:Point)=>`${Math.round(p[0]*2)}:${Math.round(p[1]*2)}`;

/** Build every street in `roads` (default: the chunk's). */
export function streets(ctx:ChunkContext,roads:ChunkRoad[]=ctx.data.roads){
 const m=kitMaterials(),ends=new Map<string,number>();
 for(const r of roads)for(const p of r.p)ends.set(keyOf(p),(ends.get(keyOf(p))??0)+1);
 for(const r of roads){
  const mid=r.p[Math.floor(r.p.length/2)],tile=ctx.layers.tile(...mid),detail=ctx.layers.detail(...mid);
  if(r.w<5){tile.add(mesh(ribbon(r.p,r.w,.06),m.paving));continue;} // footways and cycle paths
  tile.add(mesh(ribbon(r.p,r.w,.025),m.asphalt));
  for(const p of r.p)tile.add(mesh(joint(p,r.w/2,.024),m.asphalt));
  if(r.k==='service'||r.k==='pedestrian')continue;
  for(const s of [-1,1]){
   tile.add(mesh(ribbon(r.p,2.6,.055,s*(r.w/2+1.45)),m.paving));
   detail.add(mesh(ribbon(r.p,.16,.11,s*(r.w/2+.08)),material(0xaaa79f),true));
  }
  if(isStreetcar(r))tracks(detail,tile,r);
  else if(ARTERIAL.has(r.k)&&!r.oneway){for(const off of [-.08,.08])detail.add(mesh(dashes(r.p,.1,.03,off,3,3),material(0xe6c35a)));}
  else if(r.w>=8)detail.add(mesh(dashes(r.p,.12,.03,0,3,6),material(0xe9e6dc)));
  // Zebra crossings where this street ends at, or passes through, a junction.
  for(const [i,p] of r.p.entries())if((ends.get(keyOf(p))??0)>1)zebra(detail,r,i);
 }
}
/** Painted dashes along a path: `on` metres painted, `off` metres gap. */
export function dashes(path:Point[],width:number,y:number,offset:number,on:number,off:number){
 const parts:T.BufferGeometry[]=[];let carry=0;
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let d=carry;d<len;d+=on+off){const s=d/len,e=Math.min(1,(d+on)/len);parts.push(ribbon([[a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s],[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e]],width,y,offset));}
  carry=Math.max(0,(carry-len)%(on+off));
 }
 return mergeAll(parts);
}
function zebra(parent:T.Object3D,r:ChunkRoad,i:number){
 const p=r.p[i],q=r.p[i===0?1:i-1],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);if(len<8)return;
 const ux=dx/len,uz=dz/len,back=r.w/2+3,cx=p[0]+ux*back,cz=p[1]+uz*back,bars:T.BufferGeometry[]=[];
 for(let s=-r.w/2+.4;s<r.w/2;s+=.9){const x=cx-uz*s,z=cz+ux*s;bars.push(ribbon([[x-ux*1.5,z-uz*1.5],[x+ux*1.5,z+uz*1.5]],.45,.032));}
 parent.add(mesh(mergeAll(bars),material(0xe9e6dc)));
}
/** Queen East's streetcar kit: 6.24 m concrete slab with cross joints and four rails with grooves. */
function tracks(detail:T.Object3D,tile:T.Object3D,r:ChunkRoad){
 tile.add(mesh(ribbon(r.p,6.24,.03),material(0x9a978e,.9)));
 for(const off of [-2.3,-.805,.805,2.3]){detail.add(mesh(ribbon(r.p,.07,.045,off),material(0xb9bcb8,.35)));detail.add(mesh(ribbon(r.p,.05,.04,off+.06),material(0x2f3332)));}
 detail.add(mesh(dashes(r.p,6.2,.036,0,.05,5.45),material(0x7d7a73)));
}
function mergeAll(parts:T.BufferGeometry[]){
 if(!parts.length)return new T.BufferGeometry();
 const pos:number[]=[],uv:number[]=[],idx:number[]=[];let base=0;
 for(const g of parts){const p=g.getAttribute('position'),u=g.getAttribute('uv'),ix=g.getIndex()!;for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));uv.push(u.getX(i),u.getY(i));}for(let i=0;i<ix.count;i++)idx.push(ix.getX(i)+base);base+=p.count;g.dispose();}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
