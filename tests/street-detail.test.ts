import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STREET,elevation} from '../src/street-data';
import {inside,VISITS,segmentDistance} from '../src/geography';
import {BOUNDS} from '../src/motion';
import ortho from '../src/data/orthophoto.json';
import {photoUV} from '../src/heritage';
import {existsSync,statSync} from 'node:fs';
import frontages from '../src/data/frontages.json';
import {SURFACES} from '../src/surfaces';
import type {Point} from '../src/game';
test('both requested residential streets reach the actual Gerrard junction',()=>{
 for(const name of ['De Grassi Street','Boulton Avenue']){const p=STREET.roads.filter(r=>r.name===name).flatMap(r=>r.p);assert(Math.min(...p.map(p=>p[1]))< -760,name);assert(Math.max(...p.map(p=>p[1]))> -2,name);}
 assert(BOUNDS.top<-770);
});
test('individual parcel frontages cover the north and south blocks without duplicate identities',()=>{
 assert(STREET.units.length>=430);assert.equal(new Set(STREET.units.map(u=>u.id)).size,STREET.units.length);
 for(const street of ['De Grassi St','Boulton Ave']){const units=STREET.units.filter(u=>u.street===street);assert(units.length>150);for(const [from,to] of [[-750,-600],[-600,-420],[-420,-200],[-200,-25]])assert(units.some(u=>u.front[1]>=from&&u.front[1]<to),`${street} missing block ${from}`);}
 for(const u of STREET.units){assert(u.width>2.5&&u.width<32);assert(u.p.length>=3);assert(Number.isFinite(u.yaw));}
});
test('observed cottage and adjacent roof forms do not inherit the union roof maximum',()=>{
 const cottage=elevation(STREET.units.find(u=>u.address==='52 De Grassi St')!);assert.equal(cottage.floors,1);assert(cottage.eave+cottage.roof<6.5);assert.equal(cottage.family,'cottage');assert(cottage.source);
 assert.equal(elevation(STREET.units.find(u=>u.address==='48 De Grassi St')!).family,'gambrel');
 assert.equal(elevation(STREET.units.find(u=>u.address==='68 Boulton Ave')!).family,'modern-house');
});
test('aerial tiles are bundled, georeferenced and retain metre scale',()=>{
 assert.equal(ortho.year,2025);assert(ortho.groundSampleMetres<.24);for(const t of ortho.tiles){assert(existsSync('public'+t.file));assert(statSync('public'+t.file).size>100000);const [a,b,c,d]=t.corners;const ab=Math.hypot(b[0]-a[0],b[1]-a[1]),ad=Math.hypot(d[0]-a[0],d[1]-a[1]);assert(ab>460&&ab<480);assert(Math.abs(ab-ad)<.15);assert(Math.hypot(c[0]-(b[0]+d[0]-a[0]),c[1]-(b[1]+d[1]-a[1]))<.08);}
 for(const v of VISITS)assert(ortho.tiles.filter(t=>t.runtime).some(t=>inside(v.position,t.corners as [number,number][])),`missing tile ${v.id}`);
});
test('photographic facade projection preserves all four reference anchors',()=>{const quad:[[number,number],[number,number],[number,number],[number,number]]=[[8,180],[260,30],[260,280],[8,380]];for(const [u,v,index] of [[0,0,0],[1,0,1],[1,1,2],[0,1,3]]){const p=photoUV(quad,u,v);assert(Math.hypot(p[0]-quad[index][0],p[1]-quad[index][1])<1e-8);}const p=photoUV(quad,.5,.5);assert(p.every(Number.isFinite));});
test('parcel registration does not leave full-height razor walls beside the former bank',()=>{
 const remaining=STREET.remainders['3074003'];assert(remaining.length>0,'retain the real rear block');
 for(const p of remaining){assert(p.bounds[2]-p.bounds[0]>.9);assert(p.bounds[3]-p.bounds[1]>.9);}
 // The recorded 34 cm-wide sliver at x=-180.15 must no longer render.
 assert(!remaining.some(p=>p.bounds[0]<-179&&p.bounds[2]<-179));
});
test('the numbered 90 De Grassi row retains its observed distinct roofs and door sides',()=>{
 const at=(n:string)=>elevation(STREET.units.find(u=>u.address===`${n} De Grassi St`)!);
 assert.equal(at('90').family,'mansard');assert.equal(at('90').entrySide,1);
 assert.equal(at('90A').cladding,'siding');assert.equal(at('90A').door,0x17375b);
 assert.equal(at('90 1/2').family,'stucco-gable');assert.equal(at('92').family,'porch-gable');
 for(const n of ['90','90A','90 1/2','92','94'])assert(at(n).source);
});
test('the first west-side De Grassi front follows its building edge through the road bend',()=>{
 const u=STREET.units.find(u=>u.address==='12 De Grassi St')!;
 const endpoints=[-1,1].map(s=>[u.front[0]+s*Math.cos(u.yaw)*u.width/2,u.front[1]-s*Math.sin(u.yaw)*u.width/2] as Point);
 // Previously the facade rotated 16 degrees toward the curve and floated
 // metres away from its footprint. Test both ends, not only the centre.
 for(const p of endpoints)assert(Math.min(...u.p.map((a,i)=>segmentDistance(p,a,u.p[(i+1)%u.p.length])))<.02);
 assert(Math.abs(u.yaw-Math.PI/2)<.03);assert(elevation(u).blankSide);
 assert.equal(elevation(u).frontColor,0xdeddd3);
});
test('front garden interiors never replace mapped road or sidewalk surfaces',()=>{
 const paved=[...SURFACES.surfaces,...SURFACES.supplementalPaths,...STREET.surfaces];let samples=0;
 for(const y of frontages.yards){
  const xs=y.p.map(p=>p[0]),zs=y.p.map(p=>p[1]);
  for(let x=Math.min(...xs)+.17;x<Math.max(...xs);x+=.55)for(let z=Math.min(...zs)+.19;z<Math.max(...zs);z+=.55){
   const p:Point=[x,z];if(!inside(p,y.p as Point[])||y.holes.some(h=>inside(p,h as Point[])))continue;samples++;
   assert(!paved.some(s=>inside(p,s.p)&&!s.holes.some(h=>inside(p,h))),`frontage covers pavement ${y.id}: ${p}`);
  }
 }
 assert(samples>2000);
});
