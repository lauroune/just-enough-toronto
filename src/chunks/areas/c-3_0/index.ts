import * as T from 'three';
import type {ChunkModule} from '../../types';

// Pilot chunk: Corktown and the West Don Lands, west of River Street.
// Victorian terraces and semis on the side streets, King Street East's shops and
// streetcar, and the River City towers by the Don with their dark angular cladding.

const chunk:ChunkModule={
 meta:{
  title:'Corktown & West Don Lands',
  character:'Victorian worker terraces and semis on narrow side streets; King St E main-street shops under the streetcar wires; the River City mid-rise cluster with dark panel cladding; small parks (Percy Park, Orphan’s Green).',
  heroes:['River City Phase 4','Riverside Evangelical Missionary Church'],
 },
 build(ctx){
  const {kit,data}=ctx;
  kit.streets(ctx);
  kit.parks(ctx);
  for(const b of data.buildings){
   if(b.kind==='construction'){kit.building(ctx,{...b,h:Math.min(b.h,4)},{style:'industrial',shopfronts:false});continue;}
   // River City: dark modern panels; their balconies and glazing come from the curtain-wall kit.
   if(b.name?.startsWith('River City')){kit.building(ctx,b,{style:'modern'});continue;}
   if(b.kind==='church'){kit.building(ctx,b,{style:'victorian',tint:0xc8b69c,shopfronts:false});steeple(ctx,b.p,b.h);continue;}
   kit.building(ctx,b);
  }
  kit.dressStreets(ctx);
  // A pair of benches facing the green in each named park.
  for(const park of data.parks.filter(p=>p.k==='park'&&p.n)){
   const c=park.p.reduce((s,q)=>[s[0]+q[0]/park.p.length,s[1]+q[1]/park.p.length],[0,0]);
   kit.bench(ctx,c[0]-2,c[1],0);kit.bench(ctx,c[0]+2,c[1],Math.PI);
  }
 },
};

/** A small brick tower and slate spire at the footprint's corner nearest the street grid's origin. */
function steeple(ctx:Parameters<ChunkModule['build']>[0],p:[number,number][],h:number){
 const {kit}=ctx,corner=[...p].sort((a,b)=>a[0]+a[1]-(b[0]+b[1]))[0],g=new T.Group();
 g.position.set(corner[0]+2.2,kit.baseHeight(p),corner[1]+2.2);
 kit.box(g,0,(h+6)/2,0,3.6,h+6,3.6,0xb08e78);kit.box(g,0,h+6.2,0,4,.4,4,0x9a8c7a);
 const spire=new T.Mesh(new T.ConeGeometry(2.4,9,4),kit.material(0x4d5559,.8));spire.position.y=h+10.7;spire.rotation.y=Math.PI/4;spire.castShadow=true;g.add(spire);
 ctx.layers.tile(corner[0],corner[1]).add(g);ctx.solid([[corner[0]+.4,corner[1]+.4],[corner[0]+4,corner[1]+.4],[corner[0]+4,corner[1]+4],[corner[0]+.4,corner[1]+4]],h+6);
}
export default chunk;
