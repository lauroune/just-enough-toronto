import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GEO,RENDER_BUILDINGS,inside,queenZ} from '../src/geography';
import {SURFACES} from '../src/surfaces';
import {DON_BRIDGE} from '../src/don-bridge';
import type {Point} from '../src/game';
const covers=(p:Point,s:{p:Point[];holes:Point[][]})=>inside(p,s.p)&&!s.holes.some(h=>inside(p,h));
test('Queen corridor has mapped pavement continuously from River to Carlaw',()=>{
 const roads=SURFACES.surfaces.filter(s=>s.kind==='road');
 for(let x=-870;x<=505;x+=1)assert(roads.some(s=>covers([x,queenZ(x)],s)),`road absent at ${x}m`);
});
test('actual De Grassi road and sidewalk polygons replace the arbitrary street strip',()=>{
 for(const r of GEO.roads.filter(r=>r.name==='De Grassi Street'))for(const p of r.p.filter(p=>p[1]>-300))assert(SURFACES.surfaces.some(s=>s.kind==='road'&&covers(p,s)),`missing De Grassi pavement ${p}`);
 assert(SURFACES.surfaces.some(s=>s.kind==='sidewalk'&&covers([9,-28],s))||SURFACES.surfaces.some(s=>s.kind==='road'&&covers([9,-28],s)));
});
test('park lawn never paints over the Queen carriageway',()=>{
 for(let x=-870;x<=505;x+=2)for(const z of [-3,0,3])assert(!SURFACES.green.some(s=>covers([x,queenZ(x)+z],s)),`grass on Queen ${x},${z}`);
});
test('supplemental walking paths do not turn mapped road crossings into concrete strips',()=>{
 for(let x=-870;x<=505;x+=1)for(const z of [-3,0,3])assert(!SURFACES.supplementalPaths.some(s=>covers([x,queenZ(x)+z],s)),`concrete crossing overlay at ${x},${z}`);
});
test('Riverside Square keeps separate roof elevations instead of the unrelated 101m maximum',()=>{
 for(const id of [5597470,5597471]){
  const p=RENDER_BUILDINGS.filter(b=>b.id===id);assert(p.length>1);assert(Math.max(...p.map(b=>b.h))<75);assert(Math.max(...p.map(b=>b.h))-Math.min(...p.map(b=>b.h))>30);
 }
 assert.equal(GEO.buildings.filter(b=>b.id===5597470).length,1,'collision footprint remains one envelope');
});
test('Don main span retains its documented seven-panel 39.3m structure',()=>{
 assert.equal(DON_BRIDGE.panels,7);assert.equal(DON_BRIDGE.length,39.3);assert(DON_BRIDGE.halfRoad>6&&DON_BRIDGE.halfRoad<8);
});
