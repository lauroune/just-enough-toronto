import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {mergeStatic,prepareMerge} from '../world';
import {TERRAIN} from '../terrain';
import {DOWNTOWN} from '../rush/downtown-bounds';
import type {LevelOfDetail} from '../render-quality';
import type {Point} from '../game';
import * as kit from './kit';
import {parseCell,type Bounds} from './grid';
import type {ChunkData,ChunkModule,ChunkContext} from './types';

// Designed chunks are discovered from their folders (src/chunks/areas/<id>/index.ts) and
// load lazily: Vite splits each chunk's module and data into its own download, fetched
// when the player comes within LOAD metres and dropped beyond UNLOAD metres.
const modules=import.meta.glob<{default:ChunkModule}>('./areas/*/index.ts');
const datas=import.meta.glob<{default:ChunkData}>('./areas/*/data.json');
const idOf=(path:string)=>path.split('/')[2];
export const DESIGNED:string[]=Object.keys(modules).map(idOf).filter(id=>Object.keys(datas).some(p=>idOf(p)===id));
const LOAD=650,UNLOAD=1100,BUCKET=200,GROUND=100;
const WALLS=0xFFFE<<16|0xFFFF;
const TERRAIN_RECT:Bounds={left:TERRAIN.left,top:TERRAIN.top,right:TERRAIN.left+(TERRAIN.cols-1)*TERRAIN.step,bottom:TERRAIN.top+(TERRAIN.rows-1)*TERRAIN.step};
const overlaps=(a:Bounds,b:Bounds)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const distanceTo=(b:Bounds,x:number,z:number)=>Math.hypot(Math.max(b.left-x,0,x-b.right),Math.max(b.top-z,0,z-b.bottom));
function seeded(id:string){let s=kit.hash(id)||1;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

type Layer='tile'|'detail'|'far';
type Loaded={root:T.Group;groups:{g:T.Group;layer:Layer;box:T.Box3}[];colliders:RAPIER.Collider[];meta:ChunkModule['meta'];stats:ChunkStats};
/** A chunk's own cost: draw calls (meshes) and triangles per layer, and build time. */
export type ChunkStats={buildMs:number;meshes:Record<Layer,number>;triangles:Record<Layer,number>};
/** Per-chunk budget (see docs/chunks/PLAYBOOK.md). Near view = tile + detail layers. */
export const CHUNK_BUDGET={nearTriangles:550000,nearMeshes:160,buildMs:4000};

export class ChunkManager{
 private loaded=new Map<string,Loaded>();private loading=new Set<string>();private probe=new T.Vector3();
 constructor(private scene:T.Scene,private world:RAPIER.World,private hooks:{prepare(root:T.Object3D):void;suppress(bounds:Bounds,on:boolean):void}){}
 /** Load chunks near the focus, drop far ones, and show each layer at its level-of-detail range. */
 update(focus:{x:number;z:number},lod:LevelOfDetail){
  for(const id of DESIGNED){
   const d=distanceTo(parseCell(id).bounds,focus.x,focus.z);
   if(d<LOAD&&!this.loaded.has(id)&&!this.loading.has(id))void this.load(id);
   else if(d>UNLOAD&&this.loaded.has(id))this.unload(id);
  }
  for(const c of this.loaded.values())for(const {g,layer,box} of c.groups){
   this.probe.set(focus.x,box.min.y,focus.z);const d=box.distanceToPoint(this.probe);
   g.visible=layer==='tile'?d<lod.fog:layer==='detail'?d<lod.detail:d>=lod.detail*.85&&d<lod.far;
  }
 }
 get status(){return {designed:DESIGNED,loaded:[...this.loaded.keys()],loading:[...this.loading],stats:Object.fromEntries([...this.loaded].map(([id,c])=>[id,c.stats]))};}
 async load(id:string){
  this.loading.add(id);
  try{
   const [mod,data]=await Promise.all([modules[`./areas/${id}/index.ts`](),datas[`./areas/${id}/data.json`]()]);
   if(!this.loading.has(id))return;
   const built=buildChunk(id,mod.default,data.default,this.world);
   this.scene.add(built.root);this.hooks.prepare(built.root);this.hooks.suppress(parseCell(id).bounds,true);this.loaded.set(id,built);
  }catch(error){console.error(`Chunk ${id} failed to load`,error);}
  finally{this.loading.delete(id);}
 }
 unload(id:string){
  const c=this.loaded.get(id);if(!c)return;this.loaded.delete(id);
  c.root.removeFromParent();c.root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});
  for(const col of c.colliders)this.world.removeCollider(col,false);
  this.hooks.suppress(parseCell(id).bounds,false);
 }
 dispose(){for(const id of [...this.loaded.keys()])this.unload(id);this.loading.clear();}
}

/** Build one chunk module into layered, batched groups and its colliders. Exported for tests and tools. */
export function buildChunk(id:string,mod:ChunkModule,data:ChunkData,world?:RAPIER.World):Loaded{
 const started=performance.now(),root=new T.Group();root.name=`chunk ${id} · ${mod.meta.title}`;
 const buckets=new Map<string,{g:T.Group;layer:Layer}>(),solids:{p:Point[];h:number}[]=[];
 const layer=(kind:Layer)=>(x:number,z:number)=>{const key=`${kind}:${Math.floor(x/BUCKET)}:${Math.floor(z/BUCKET)}`;let b=buckets.get(key);if(!b){b={g:new T.Group(),layer:kind};b.g.name=key;root.add(b.g);buckets.set(key,b);}return b.g;};
 const ctx:ChunkContext={data,layers:{tile:layer('tile'),detail:layer('detail'),far:layer('far')},kit,rand:seeded(id),solid:(p,h)=>solids.push({p,h})};
 mod.build(ctx);
 groundFor(parseCell(id).bounds,root);
 const groups=[...buckets.values()].map(({g,layer})=>{prepareMerge(g);mergeStatic(g);if(layer==='far')g.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=false;});return {g,layer,box:new T.Box3().setFromObject(g)};});
 const colliders:RAPIER.Collider[]=[];
 if(world){
  const v:number[]=[],idx:number[]=[];
  for(const s of solids)for(let i=0;i<s.p.length;i++){const a=s.p[i],c=s.p[(i+1)%s.p.length],n=v.length/3;v.push(a[0],-.5,a[1],a[0],s.h,a[1],c[0],s.h,c[1],c[0],-.5,c[1]);idx.push(n,n+1,n+2,n,n+2,n+3);}
  if(idx.length)colliders.push(world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(v),new Uint32Array(idx)).setFriction(.6).setCollisionGroups(WALLS)));
  for(const sq of groundSquares(parseCell(id).bounds))colliders.push(world.createCollider(RAPIER.ColliderDesc.cuboid(GROUND/2,.5,GROUND/2).setTranslation(sq.left+GROUND/2,-.53,sq.top+GROUND/2).setFriction(.85)));
 }
 const stats:ChunkStats={buildMs:Math.round(performance.now()-started),meshes:{tile:0,detail:0,far:0},triangles:{tile:0,detail:0,far:0}};
 for(const {g,layer} of groups)g.traverse(o=>{if(o instanceof T.Mesh){stats.meshes[layer]++;const geo=o.geometry;stats.triangles[layer]+=Math.round((geo.index?geo.index.count:geo.getAttribute('position').count)/3);}});
 return {root,groups,colliders,meta:mod.meta,stats};
}
/** 100 m squares of a cell that neither the authored terrain nor downtown already floor. */
function groundSquares(b:Bounds){
 const out:Bounds[]=[];
 for(let x=b.left;x<b.right;x+=GROUND)for(let z=b.top;z<b.bottom;z+=GROUND){const sq={left:x,right:x+GROUND,top:z,bottom:z+GROUND};if(!overlaps(sq,TERRAIN_RECT)&&!overlaps(sq,DOWNTOWN))out.push(sq);}
 return out;
}
const groundMat=new T.MeshStandardMaterial({color:0x9d988e,roughness:1});
function groundFor(b:Bounds,root:T.Group){
 for(const sq of groundSquares(b)){const m=new T.Mesh(new T.PlaneGeometry(GROUND,GROUND),groundMat);m.rotation.x=-Math.PI/2;m.position.set(sq.left+GROUND/2,-.02,sq.top+GROUND/2);m.receiveShadow=true;root.add(m);}
}
