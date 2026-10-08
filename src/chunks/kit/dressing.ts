import * as T from 'three';
import {inside} from '../../geography';
import {groundHeight} from '../../terrain';
import {box} from '../../world';
import type {Point} from '../../game';
import type {ChunkContext,ChunkRoad} from '../types';
import {kitMaterials,material} from './materials';

// Street dressing: what makes a block feel lived in. Trees use the same leaf-card
// atlas as Queen East (foliage.ts); lights and benches use the cached box/rod kit.

// Fewer, larger cards than Queen East's hand-placed trees: chunks have hundreds of trees.
const leafCard=new T.PlaneGeometry(1.7,1.7);
/** A street tree: tapered trunk, a few limbs and a crown of alpha leaf cards. ~5 m to 14 m tall. */
export function tree(ctx:ChunkContext,x:number,z:number,height=7+ctx.rand()*5,autumn=ctx.rand()<.35){
 const m=kitMaterials(),g=new T.Group(),y=groundHeight(x,z),r=height*.032;g.position.set(x,y,z);
 // Open five-sided tubes: the crown hides the ends, and hundreds of trees add up.
 const trunk=new T.Mesh(new T.CylinderGeometry(r*.6,r,height*.55,5,1,true),m.bark);trunk.position.y=height*.275;trunk.castShadow=true;g.add(trunk);
 for(let k=0;k<3;k++){const a=k*2.1+ctx.rand(),from=new T.Vector3(0,height*.45,0),to=new T.Vector3(Math.cos(a)*height*.18,height*.62,Math.sin(a)*height*.18),dir=to.clone().sub(from);
  const limb=new T.Mesh(new T.CylinderGeometry(r*.3,r*.45,dir.length(),5,1,true),m.bark);limb.position.copy(from).add(to).multiplyScalar(.5);limb.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());limb.castShadow=true;g.add(limb);}
 const crown=Math.round(14+height*1.2),rx=height*.32,ry=height*.27,leaves=m.leaves[autumn?1:0];
 for(let k=0;k<crown;k++){
  const u=ctx.rand()*Math.PI*2,v=Math.acos(2*ctx.rand()-1),s=.55+ctx.rand()*.45;
  const card=new T.Mesh(leafCard,leaves);card.position.set(Math.sin(v)*Math.cos(u)*rx*s,height*.68+Math.cos(v)*ry*s,Math.sin(v)*Math.sin(u)*rx*s);
  card.rotation.set(ctx.rand()*Math.PI,ctx.rand()*Math.PI,ctx.rand()*Math.PI);card.scale.setScalar(1.05+ctx.rand()*.7);card.castShadow=true;g.add(card);
 }
 ctx.layers.detail(x,z).add(g);ctx.solid(circle([x,z],r*1.2),3);
 return g;
}
const circle=(c:Point,r:number):Point[]=>Array.from({length:6},(_,i)=>[c[0]+Math.cos(i/6*Math.PI*2)*r,c[1]+Math.sin(i/6*Math.PI*2)*r]);
/** A Toronto cobra-head streetlight on a grey pole, arm reaching over the road (yaw = direction the arm points). */
export function streetLight(ctx:ChunkContext,x:number,z:number,yaw:number){
 const g=new T.Group();g.position.set(x,groundHeight(x,z),z);g.rotation.y=yaw;
 box(g,0,4.2,0,.16,8.4,.16,0x7d8483);box(g,0,8.2,.9,.1,.1,1.8,0x7d8483);box(g,0,8.05,1.85,.34,.16,.62,0x6d7473);box(g,0,7.96,1.85,.26,.04,.5,0xf3ead0);
 ctx.layers.detail(x,z).add(g);ctx.solid(circle([x,z],.15),8);return g;
}
/** A slatted bench facing yaw. */
export function bench(ctx:ChunkContext,x:number,z:number,yaw:number){
 const g=new T.Group();g.position.set(x,groundHeight(x,z),z);g.rotation.y=yaw;
 for(const sx of [-.75,.75])box(g,sx,.23,0,.06,.46,.5,0x3c4244);for(let k=0;k<3;k++)box(g,0,.46,-.16+k*.16,1.7,.04,.12,0x8b6a4c);
 for(let k=0;k<2;k++)box(g,0,.66+k*.16,-.27,1.7,.11,.04,0x8b6a4c);ctx.layers.detail(x,z).add(g);return g;
}
/** Lawn and park polygons from the chunk data (water as dark glassy surface). */
export function parks(ctx:ChunkContext){
 const m=kitMaterials();
 for(const a of ctx.data.parks){
  if(a.p.length<3)continue;const shape=new T.Shape(a.p.map(q=>new T.Vector2(q[0],-q[1])));const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);
  const pos=g.getAttribute('position');for(let i=0;i<pos.count;i++)pos.setY(i,(a.k==='water'?-.4:.04)+groundHeight(pos.getX(i),pos.getZ(i)));g.computeVertexNormals();
  const uv=g.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i),pos.getZ(i));
  const mesh=new T.Mesh(g,a.k==='water'?material(0x526f70,.27):m.lawn);mesh.receiveShadow=true;const c=a.p[0];ctx.layers.tile(c[0],c[1]).add(mesh);
 }
}
const inAnyBuilding=(ctx:ChunkContext,p:Point)=>ctx.data.buildings.some(b=>inside(p,b.p));
/**
 * Default dressing: every mapped tree; street trees every ~11 m along residential,
 * tertiary and secondary sidewalks (OSM maps few street trees; Toronto streets have many); streetlights every ~32 m on wider streets,
 * alternating sides. Skips spots inside buildings or the authored map.
 */
export function dressStreets(ctx:ChunkContext,o:{roads?:ChunkRoad[];treeSpacing?:number;lightSpacing?:number;fillTrees?:boolean}={}){
 const roads=o.roads??ctx.data.roads,mapped=ctx.data.trees;let placed=0;
 for(const t of mapped)if(!inAnyBuilding(ctx,t)){tree(ctx,t[0],t[1]);placed++;}
 const fill=o.fillTrees??true,treeStep=o.treeSpacing??11,lightStep=o.lightSpacing??32;
 for(const r of roads){
  if(r.w<6||r.k==='service')continue;let carry=0,lightCarry=lightStep/2,side=1;
  for(let i=1;i<r.p.length;i++){
   const a=r.p[i-1],b=r.p[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!len)continue;const ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len,nx=-uz,nz=ux;
   for(let d=carry;fill&&['residential','tertiary','secondary'].includes(r.k)&&d<len;d+=treeStep){
    for(const s of [-1,1]){const off=r.w/2+1.9,p:Point=[a[0]+ux*d+nx*s*off,a[1]+uz*d+nz*s*off];
     if(!inAnyBuilding(ctx,p)&&!mapped.some(t=>Math.hypot(t[0]-p[0],t[1]-p[1])<5)&&ctx.rand()<.8)tree(ctx,p[0],p[1]);}
   }
   carry=Math.max(0,(carry-len)%treeStep);
   for(let d=lightCarry;r.w>=8&&d<len;d+=lightStep){const off=r.w/2+.6,p:Point=[a[0]+ux*d+nx*side*off,a[1]+uz*d+nz*side*off];if(!inAnyBuilding(ctx,p))streetLight(ctx,p[0],p[1],Math.atan2(-nx*side,-nz*side));side=-side;}
   lightCarry=Math.max(0,(lightCarry-len)%lightStep);
  }
 }
 return placed;
}
