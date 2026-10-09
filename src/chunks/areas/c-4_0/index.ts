import * as T from 'three';
import type {ChunkModule,ChunkBuilding} from '../../types';

// Cell c-4_0: Corktown and the Moss Park edge, x -1600..-1200. The Parliament Street
// corridor (streetcar on the west edge) with a cluster of City-measured towers (50-84 m)
// along Adelaide / Richmond, then King East shops, Victorian side streets around Sackville,
// and the Power Street churches by Queen East. Continues c-3_0's Corktown style across x = -1200.

type Ctx=Parameters<ChunkModule['build']>[0];
const centre=(p:[number,number][]):[number,number]=>[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];

const chunk:ChunkModule={
 meta:{
  title:'Corktown West: Parliament, Power Street & Sackville',
  character:'Parliament Street towers (50-84 m, City-measured) rising behind Victorian brick: King East shops, bay-and-gable side streets around Sackville Playground, and the two churches of Power and Trinity Streets.',
  heroes:["St. Paul's Basilica",'Little Trinity Anglican Church','Enoch Turner Schoolhouse'],
 },
 build(ctx){
  const {kit,data}=ctx;
  kit.streets(ctx);
  kit.parks(ctx);
  for(const b of data.buildings){
   if(b.name==="St. Paul's Basilica"){kit.building(ctx,b,{style:'victorian',tint:0xc9b38f,shopfronts:false});dome(ctx,b);continue;}
   if(b.name==='Little Trinity Anglican Church'){kit.building(ctx,b,{style:'victorian',tint:0xb98f72,shopfronts:false});steeple(ctx,b.p,b.h);continue;}
   if(b.name==='Enoch Turner Schoolhouse Museum'){kit.building(ctx,b,{style:'victorian',tint:0xc7a285,shopfronts:false});continue;}
   if(b.name==='Little Trinity Annex'){kit.building(ctx,b,{style:'victorian',tint:0xbf9a80,shopfronts:false});continue;}
   if(b.kind==='construction'){kit.building(ctx,{...b,h:Math.min(b.h,4)},{style:'industrial',shopfronts:false});continue;}
   // Fuel station canopy-height and low service sheds: plain industrial, no shops.
   if(b.h<5&&!b.shop&&b.kind!=='retail'){kit.building(ctx,b,{style:'industrial',shopfronts:false});continue;}
   if(b.h>=40){kit.building(ctx,b,{style:'modern'});continue;}
   kit.building(ctx,b);
  }
  kit.dressStreets(ctx);
  // Benches facing the green in Sackville Playground and Orphan's Green (named in OSM).
  for(const park of data.parks.filter(p=>p.k==='park'&&p.n)){
   const c=centre(park.p);
   kit.bench(ctx,c[0]-2,c[1],0);kit.bench(ctx,c[0]+2,c[1],Math.PI);
  }
 },
};

/** Stylised brick tower and slate spire at the footprint corner nearest the origin (interpretation, not surveyed). */
function steeple(ctx:Ctx,p:[number,number][],h:number){
 const {kit}=ctx,corner=[...p].sort((a,b)=>a[0]+a[1]-(b[0]+b[1]))[0],g=new T.Group();
 g.position.set(corner[0]+2.2,kit.baseHeight(p),corner[1]+2.2);
 kit.box(g,0,(h+6)/2,0,3.4,h+6,3.4,0xa88672);kit.box(g,0,h+6.2,0,3.8,.4,3.8,0x9a8c7a);
 for(const [x,z] of [[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]])kit.box(g,x,h+7.2,z,.4,1.6,.4,0x9a8c7a);
 const spire=new T.Mesh(new T.ConeGeometry(2.2,8,4),kit.material(0x4d5559,.8));spire.position.y=h+10.6;spire.rotation.y=Math.PI/4;spire.castShadow=true;g.add(spire);
 ctx.layers.tile(corner[0],corner[1]).add(g);
 ctx.solid([[corner[0]+.4,corner[1]+.4],[corner[0]+4,corner[1]+.4],[corner[0]+4,corner[1]+4],[corner[0]+.4,corner[1]+4]],h+6);
}

/** A copper-green drum and dome over the basilica's centre: a stylised nod to its crossing (interpretation). */
function dome(ctx:Ctx,b:ChunkBuilding){
 const {kit}=ctx,[cx,cz]=centre(b.p),g=new T.Group();g.position.set(cx,kit.baseHeight(b.p)+b.h,cz);
 const stone=kit.material(0xc9b38f,.85),copper=kit.material(0x6f9a86,.55);
 const drum=new T.Mesh(new T.CylinderGeometry(3.6,4,3.2,12),stone);drum.position.y=1.6;drum.castShadow=true;g.add(drum);
 const cap=new T.Mesh(new T.SphereGeometry(3.7,12,6,0,Math.PI*2,0,Math.PI/2),copper);cap.position.y=3.2;cap.castShadow=true;g.add(cap);
 kit.box(g,0,8.2,0,.18,2.6,.18,0xd8c9a0);kit.box(g,0,8.7,0,1,.18,.18,0xd8c9a0);
 ctx.layers.tile(cx,cz).add(g);
}
export default chunk;
