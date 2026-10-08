import {test} from 'node:test';import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import RAPIER from '@dimforge/rapier3d-compat';
import {chunkPlan,parseCell,QUEEN,PLAN_ANCHORS,cellAt} from '../src/chunks/grid';
import {StreetPhysics} from '../src/physics';
import {RaceCar,NORMAL_TUNING,NO_INPUT,reserveGroundGroup,type CarSpec} from '../src/rush/race-car';
import {clearSpot,setExtraArea} from '../src/rush/rush-logic';
import {RegionGround} from '../src/rush/region-ground';
import * as T from 'three';
import type {ChunkData,ChunkModule} from '../src/chunks/types';
await RAPIER.init();
const spec:CarSpec={width:1.9,height:1.3,length:4.4,wheelRadius:.34,wheels:[{x:.8,y:-.05,z:1.35,front:true},{x:-.8,y:-.05,z:1.35,front:true},{x:.8,y:-.05,z:-1.35,front:false},{x:-.8,y:-.05,z:-1.35,front:false}]};
// CHUNK=<id> checks one chunk only (useful while other chunks are still being designed).
const dir='src/chunks/areas',areas=(existsSync(dir)?readdirSync(dir):[]).filter(id=>!process.env.CHUNK||id===process.env.CHUNK);
const centroid=(p:[number,number][])=>[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];

test('the plan connects Queen East to every key location, outward from Queen',()=>{
 const plan=chunkPlan(),ids=new Set(plan.map(c=>c.id));
 for(const a of PLAN_ANCHORS.filter(a=>a.id!=='queen'))assert.ok(ids.has(cellAt(...a.at).id),`${a.name} is in the plan`);
 for(let i=1;i<plan.length;i++)assert.ok(plan[i].ring>=plan[i-1].ring,'ordered by ring');
 assert.equal(plan[0].ring,1);
});
for(const id of areas){
 test(`chunk ${id}: data is in its cell and out of the authored map`,()=>{
  const c=parseCell(id),d=JSON.parse(readFileSync(`${dir}/${id}/data.json`,'utf8')) as ChunkData;
  assert.equal(d.id,id);assert.deepEqual(d.bounds,c.bounds);assert.ok(d.sources.length>0);
  for(const b of d.buildings){
   const [x,z]=centroid(b.p);assert.ok(x>=c.bounds.left&&x<=c.bounds.right&&z>=c.bounds.top&&z<=c.bounds.bottom,`${b.id} in cell`);
   assert.ok(!(x>=QUEEN.left&&x<=QUEEN.right&&z>=QUEEN.top&&z<=QUEEN.bottom),`${b.id} outside Queen East`);
   assert.ok(b.h>0&&b.h<400&&b.p.length>=3,`${b.id} shape`);
  }
 });
 if(existsSync(`${dir}/${id}/index.ts`))test(`chunk ${id}: module and notes are complete`,async()=>{
  const mod=(await import(`../${dir}/${id}/index.ts`)).default as ChunkModule;
  assert.ok(mod.meta.title&&mod.meta.character.length>30,'meta.title and a real character sentence');assert.equal(typeof mod.build,'function');
  assert.ok(existsSync(`${dir}/${id}/NOTES.md`),'NOTES.md');
  const src=readFileSync(`${dir}/${id}/index.ts`,'utf8');
  assert.ok(!/Math\.random\(/.test(src),'uses ctx.rand(), not Math.random()');
  assert.ok(!/new T\.Mesh(Standard|Basic)Material\(/.test(src.replace(/const \w+=new T\.MeshStandardMaterial[^;]*;\s*\/\/ cached/g,'')),'materials come from the kit (or one cached hero material)');
 });
 test(`chunk ${id}: the car parks clear and drives away`,()=>{
  const d=JSON.parse(readFileSync(`${dir}/${id}/data.json`,'utf8')) as ChunkData,c=parseCell(id);
  const physics=new StreetPhysics(d.buildings.map(b=>({x:0,z:0,w:0,d:0,h:b.h,p:b.p,holes:b.holes})),[],[]);reserveGroundGroup(physics.world,physics.ground);
  new RegionGround(new T.Scene(),physics.world);
  setExtraArea({roads:d.roads.filter(r=>r.w>=6),buildings:d.buildings,bounds:c.bounds});
  try{
   const at=clearSpot(physics.world,physics.ground,c.center,0);assert.ok(at,'a clear street spot');
   const car=new RaceCar(physics.world,spec,at!);for(let i=0;i<90;i++){car.step(1/90,NO_INPUT,NORMAL_TUNING);physics.world.step();}
   const start=car.position;for(let i=0;i<270;i++){car.step(1/90,{...NO_INPUT,throttle:1},NORMAL_TUNING);physics.world.step();}
   assert.ok(Math.hypot(car.position.x-start.x,car.position.z-start.z)>9,'drove away');
  }finally{setExtraArea(undefined);physics.dispose();}
 });
}
