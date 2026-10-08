// Routes between the key locations over the drivable network: `npx tsx scripts/roads/routes.ts`
// Writes src/chunks/routes.json (drawn on the maps) and prints length, steepest grade, the
// chunks each route crosses and which of them still lack data.
import {writeFileSync,existsSync} from 'node:fs';
import {buildGraph,loadStreets,nearestNode,shortestPath} from './network';
import {PLAN_ANCHORS,cellAt} from '../../src/chunks/grid';
import {groundHeight} from '../../src/terrain';
import type {Point} from '../../src/game';

const streets=loadStreets(),g=buildGraph(streets);
const stops=[{id:'queen',name:'Queen East (Bonjour Brioche)',at:[-14,-6.25] as Point},...PLAN_ANCHORS.filter(a=>a.id!=='queen')];
const order=['queen','ada','venn','next','queen'].map(id=>stops.find(s=>s.id===id)!);
const routes:{from:string;to:string;length:number;maxGrade:number;cells:string[];missing:string[];p:Point[]}[]=[];
console.log(`network: ${streets.length} streets, ${g.pos.size} nodes`);
for(let i=1;i<order.length;i++){
 const a=order[i-1],b=order[i],na=nearestNode(g,a.at),nb=nearestNode(g,b.at);
 const p=shortestPath(g,na.node,nb.node);
 if(!p){console.log(`✗ ${a.name} → ${b.name}: NO ROUTE (start ${na.distance.toFixed(0)} m from a street, end ${nb.distance.toFixed(0)} m)`);continue;}
 let length=0,maxGrade=0;for(let k=1;k<p.length;k++){const d=Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1]);length+=d;if(d>15)maxGrade=Math.max(maxGrade,Math.abs(groundHeight(...p[k])-groundHeight(...p[k-1]))/d);}
 const cells=[...new Set(p.map(q=>cellAt(...q).id))],missing=cells.filter(id=>!existsSync(`src/chunks/areas/${id}/data.json`)&&!(p.find(q=>cellAt(...q).id===id)![0]>-930));
 routes.push({from:a.id,to:b.id,length:Math.round(length),maxGrade:+(maxGrade*100).toFixed(1),cells,missing,p:p.map(q=>[Math.round(q[0]*10)/10,Math.round(q[1]*10)/10] as Point)});
 console.log(`✓ ${a.name} → ${b.name}: ${(length/1000).toFixed(2)} km, steepest ${(maxGrade*100).toFixed(1)} %, ${cells.length} cells${missing.length?`, ${missing.length} without data: ${missing.join(' ')}`:''}`);
}
writeFileSync('src/chunks/routes.json',JSON.stringify(routes.map(({from,to,length,p})=>({from,to,length,p}))));
const onRoute=[...new Set(routes.flatMap(r=>r.cells))];
console.log(`\nchunks on the key routes (${onRoute.length}): ${onRoute.join(' ')}`);
