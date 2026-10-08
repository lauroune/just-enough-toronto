// Collect every fetched chunk's streets and simplified footprints into src/chunks/map-index.json,
// so the mini-map can draw areas that have not been loaded. Run by fetch-chunk.ts; also runnable alone.
import {readdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {DOWNTOWN} from '../../src/rush/downtown-bounds';
import type {ChunkData} from '../../src/chunks/types';
import type {Point} from '../../src/game';
export function buildMapIndex(){
 const dir='src/chunks/areas',roads:{p:Point[];w:number}[]=[],buildings:{p:Point[]}[]=[];
 const insideDowntown=(b:ChunkData['bounds'])=>b.left>=DOWNTOWN.left&&b.right<=DOWNTOWN.right&&b.top>=DOWNTOWN.top&&b.bottom<=DOWNTOWN.bottom;
 const ids=existsSync(dir)?readdirSync(dir).filter(id=>existsSync(`${dir}/${id}/data.json`)):[];
 for(const id of ids){
  const d=JSON.parse(readFileSync(`${dir}/${id}/data.json`,'utf8')) as ChunkData;
  if(insideDowntown(d.bounds))continue; // downtown streets and roofs are already on the map
  const r=(v:number)=>Math.round(v);
  for(const road of d.roads)if(road.w>=5)roads.push({w:road.w,p:road.p.map(([x,z])=>[r(x),r(z)] as Point)});
  for(const b of d.buildings)buildings.push({p:b.p.map(([x,z])=>[r(x),r(z)] as Point).filter((q,i,a)=>!i||q[0]!==a[i-1][0]||q[1]!==a[i-1][1])});
 }
 writeFileSync('src/chunks/map-index.json',JSON.stringify({chunks:ids,roads,buildings}));
 console.log(`map index: ${ids.length} chunks, ${roads.length} streets, ${buildings.length} footprints`);
}
if(import.meta.url===`file://${process.argv[1]}`)buildMapIndex();
