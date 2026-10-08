import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {groundHeight,REGION,TERRAIN} from '../terrain';
import type {LevelOfDetail} from '../render-quality';

// The ground of the wider city for Rush: the regional terrain (src/data/terrain-region.json)
// as visible tiles and one collision surface. Quads inside the authored Queen East grid are
// left out, because that area already has its own surveyed ground, so the two meet exactly.

const STEP=REGION.step,CELL=400;
const AUTHORED={left:TERRAIN.left,top:TERRAIN.top,right:TERRAIN.left+(TERRAIN.cols-1)*TERRAIN.step,bottom:TERRAIN.top+(TERRAIN.rows-1)*TERRAIN.step};
const authored=(x:number,z:number)=>x>=AUTHORED.left&&x+STEP<=AUTHORED.right&&z>=AUTHORED.top&&z+STEP<=AUTHORED.bottom;
const right=REGION.left+(REGION.cols-1)*STEP,bottom=REGION.top+(REGION.rows-1)*STEP;

/** Ground surface heights sit 2 cm under streets and parks, like downtown's old flat ground. */
const surface=(x:number,z:number)=>groundHeight(x,z)-.02;

export class RegionGround{
 readonly group=new T.Group();
 private tiles:{mesh:T.Mesh;box:T.Box3}[]=[];private collider:RAPIER.Collider;private probe=new T.Vector3();
 constructor(scene:T.Scene,private world:RAPIER.World){
  this.group.name='Rush regional ground';scene.add(this.group);
  const material=new T.MeshStandardMaterial({color:0x9d988e,roughness:1});
  for(let cx=Math.floor(REGION.left/CELL)*CELL;cx<right;cx+=CELL)for(let cz=Math.floor(REGION.top/CELL)*CELL;cz<bottom;cz+=CELL){
   const g=quads(Math.max(cx,REGION.left),Math.max(cz,REGION.top),Math.min(cx+CELL,right),Math.min(cz+CELL,bottom),surface);if(!g)continue;
   const mesh=new T.Mesh(g,material);mesh.receiveShadow=true;this.group.add(mesh);this.tiles.push({mesh,box:new T.Box3().setFromObject(mesh)});
  }
  // One trimesh for the whole region, matching the authored terrain collider's 3 cm inset.
  const all=quads(REGION.left,REGION.top,right,bottom,(x,z)=>groundHeight(x,z)-.03)!;
  this.collider=world.createCollider(RAPIER.ColliderDesc.trimesh(all.getAttribute('position').array as Float32Array,all.getIndex()!.array as Uint32Array).setFriction(.85));
  all.dispose();
 }
 update(focus:{x:number;z:number},lod:LevelOfDetail){for(const t of this.tiles){this.probe.set(focus.x,t.box.min.y,focus.z);t.mesh.visible=t.box.distanceToPoint(this.probe)<lod.fog;}}
 dispose(){this.world.removeCollider(this.collider,false);this.group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});this.group.removeFromParent();}
}
/** A STEP-metre grid surface over a rectangle, without the quads the authored grid covers. */
function quads(x0:number,z0:number,x1:number,z1:number,height:(x:number,z:number)=>number){
 const pos:number[]=[],idx:number[]=[],uv:number[]=[],ids=new Map<string,number>();
 const vertex=(x:number,z:number)=>{const k=`${x}:${z}`;let i=ids.get(k);if(i===undefined){i=pos.length/3;pos.push(x,height(x,z),z);uv.push(x/8,z/8);ids.set(k,i);}return i;};
 for(let x=x0;x<x1;x+=STEP)for(let z=z0;z<z1;z+=STEP){
  if(authored(x,z))continue;
  const a=vertex(x,z),b=vertex(x+STEP,z),c=vertex(x,z+STEP),d=vertex(x+STEP,z+STEP);idx.push(a,c,b,b,c,d);
 }
 if(!idx.length)return undefined;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(new T.Uint32BufferAttribute(idx,1));g.computeVertexNormals();return g;
}
