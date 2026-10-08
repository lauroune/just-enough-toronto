// Drive each key route in the physics engine, with every building as a collider:
// `npx tsx scripts/roads/drive-route.ts [from-to]`. Reports where the car gets stuck.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import RAPIER from '@dimforge/rapier3d-compat';
import * as T from 'three';
import {StreetPhysics} from '../../src/physics';
import {GEO} from '../../src/geography';
import {groundHeight} from '../../src/terrain';
import {RaceCar,NORMAL_TUNING,NO_INPUT,reserveGroundGroup,type CarSpec} from '../../src/rush/race-car';
import {addDowntownColliders} from '../../src/rush/downtown';
import {RegionGround} from '../../src/rush/region-ground';
import {cellAt} from '../../src/chunks/grid';
import type {ChunkData} from '../../src/chunks/types';
import type {Point} from '../../src/game';
await RAPIER.init();
const only=process.argv[2];
const spec:CarSpec={width:1.9,height:1.3,length:4.4,wheelRadius:.34,wheels:[{x:.8,y:-.05,z:1.35,front:true},{x:-.8,y:-.05,z:1.35,front:true},{x:.8,y:-.05,z:-1.35,front:false},{x:-.8,y:-.05,z:-1.35,front:false}]};
const routes=JSON.parse(readFileSync('src/chunks/routes.json','utf8')) as {from:string;to:string;length:number;p:Point[]}[];
const physics=new StreetPhysics(GEO.buildings.map(b=>({x:0,z:0,w:0,d:0,h:b.h,p:b.p,holes:b.holes})),[],[]);reserveGroundGroup(physics.world,physics.ground);
addDowntownColliders(physics.world);new RegionGround(new T.Scene(),physics.world);
// Chunk buildings outside downtown (downtown's are already solid).
const v:number[]=[],idx:number[]=[],dir='src/chunks/areas';
for(const id of existsSync(dir)?readdirSync(dir):[]){if(!existsSync(`${dir}/${id}/data.json`))continue;const d=JSON.parse(readFileSync(`${dir}/${id}/data.json`,'utf8')) as ChunkData;
 for(const b of d.buildings){if(b.heightSource==='city')continue;const y=Math.min(...b.p.map(q=>groundHeight(...q)));for(let i=0;i<b.p.length;i++){const a=b.p[i],c=b.p[(i+1)%b.p.length],n=v.length/3;v.push(a[0],y-.5,a[1],a[0],y+b.h,a[1],c[0],y+b.h,c[1],c[0],y-.5,c[1]);idx.push(n,n+1,n+2,n,n+2,n+3);}}}
if(idx.length)physics.world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(v),new Uint32Array(idx)).setCollisionGroups(0xFFFE<<16|0xFFFF));
const along=(p:Point[])=>{const d=[0];for(let i=1;i<p.length;i++)d.push(d[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return d;};
const at=(p:Point[],cum:number[],s:number):Point=>{let i=cum.findIndex(c=>c>=s);if(i<=0)i=1;if(i<0||s>=cum.at(-1)!)return p.at(-1)!;const t=(s-cum[i-1])/(cum[i]-cum[i-1]||1);return [p[i-1][0]+(p[i][0]-p[i-1][0])*t,p[i-1][1]+(p[i][1]-p[i-1][1])*t];};
for(const r of routes){
 if(only&&`${r.from}-${r.to}`!==only)continue;
 const cum=along(r.p),total=cum.at(-1)!,stuck:{at:Point;cell:string}[]=[];
 const start=r.p[0],next=at(r.p,cum,8);let car=new RaceCar(physics.world,spec,{x:start[0],y:groundHeight(...start)+1,z:start[1],heading:Math.atan2(next[0]-start[0],next[1]-start[1])});
 let progress=0,still=0,steps=0;const t0=Date.now();
 while(progress<total-15&&steps<90*60*12){
  const p=car.position;
  // Progress = furthest route distance within 12 m of the car.
  for(let s=progress;s<Math.min(total,progress+60);s+=2){const q=at(r.p,cum,s);if(Math.hypot(q[0]-p.x,q[1]-p.z)<12)progress=s;}
  const target=at(r.p,cum,progress+14),want=Math.atan2(target[0]-p.x,target[1]-p.z);let err=want-car.heading;err=Math.atan2(Math.sin(err),Math.cos(err));
  car.step(1/90,{...NO_INPUT,throttle:car.speed>(Math.abs(err)>.5?7:17)?0:1,steer:Math.max(-1,Math.min(1,-err*2.2))},NORMAL_TUNING);physics.world.step();steps++;
  still=car.speed<.8?still+1:0;
  if(still>90*3){const here:Point=[p.x,p.z];stuck.push({at:[Math.round(here[0]),Math.round(here[1])],cell:cellAt(...here).id});const jump=at(r.p,cum,progress+25),ahead=at(r.p,cum,progress+33);car.dispose();
   car=new RaceCar(physics.world,spec,{x:jump[0],y:groundHeight(...jump)+1.2,z:jump[1],heading:Math.atan2(ahead[0]-jump[0],ahead[1]-jump[1])});progress+=25;still=0;}
 }
 console.log(`${r.from} → ${r.to}: ${(total/1000).toFixed(2)} km, drove in ${(steps/90).toFixed(0)} s sim (${((Date.now()-t0)/1000).toFixed(0)} s real), ${stuck.length?`STUCK ${stuck.length}× at `+stuck.map(s=>`${s.at.join(',')} (${s.cell})`).join('; '):'clean run'}`);
 car.dispose();
}
