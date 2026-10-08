// Fetch the map data for one chunk: `npx tsx scripts/chunks/fetch-chunk.ts c-4_0 [--force]`
// Writes src/chunks/areas/<id>/data.json, then refreshes src/chunks/map-index.json.
//
// Buildings: City of Toronto roof outlines (measured heights, already shipped in
// src/data) are authoritative where they exist; OpenStreetMap adds tags (levels,
// colour, material, shop, name, address) by footprint overlap, and fills in any
// building the City data lacks. Streets, trees, parks and named places are OSM.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {parseCell,QUEEN,type Bounds} from '../../src/chunks/grid';
import {GEO,project,inside} from '../../src/geography';
import type {ChunkData,ChunkBuilding,ChunkRoad} from '../../src/chunks/types';
import type {Point} from '../../src/game';
import {buildMapIndex} from './build-map';

const id=process.argv[2],force=process.argv.includes('--force');
if(!id){console.error('usage: fetch-chunk.ts <chunk-id> [--force]');process.exit(1);}
const c=parseCell(id),out=`src/chunks/areas/${id}/data.json`;
if(existsSync(out)&&!force){console.log(`${out} exists (use --force to refetch)`);process.exit(0);}

// Inverse of geography.project (the game's metres → lon/lat), for the Overpass bbox.
const {origin,angle:a}=GEO.meta,k=111320*Math.cos(origin[1]*Math.PI/180);
const unproject=(x:number,z:number):[number,number]=>{const e=x*Math.cos(a)+z*Math.sin(a),n=x*Math.sin(a)-z*Math.cos(a);return [origin[0]+e/k,origin[1]+n/111320];};
const pad=40,corners=[[c.bounds.left-pad,c.bounds.top-pad],[c.bounds.right+pad,c.bounds.top-pad],[c.bounds.left-pad,c.bounds.bottom+pad],[c.bounds.right+pad,c.bounds.bottom+pad]].map(([x,z])=>unproject(x,z));
const s=Math.min(...corners.map(p=>p[1])),w=Math.min(...corners.map(p=>p[0])),n=Math.max(...corners.map(p=>p[1])),e=Math.max(...corners.map(p=>p[0]));
const bbox=`${s},${w},${n},${e}`;
const query=`[out:json][timeout:120];(
 way["building"](${bbox});relation["building"]["type"="multipolygon"](${bbox});
 way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service|pedestrian|primary_link|secondary_link|tertiary_link|footway|cycleway)$"](${bbox});
 node["natural"="tree"](${bbox});
 way["leisure"~"^(park|playground|pitch|garden)$"](${bbox});way["landuse"~"^(grass|recreation_ground)$"](${bbox});way["natural"="water"](${bbox});
 node["name"]["amenity"](${bbox});node["name"]["shop"](${bbox});node["name"]["tourism"](${bbox});node["name"]["office"](${bbox});
 way["railway"~"^(rail|tram|light_rail)$"](${bbox});
);out geom;`;

async function overpass(q:string){
 const mirrors=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter'];
 for(let attempt=0;attempt<6;attempt++){
  const url=mirrors[attempt%mirrors.length];
  try{const r=await fetch(url,{method:'POST',body:new URLSearchParams({data:q}),headers:{'User-Agent':'just-enough-toronto-chunks/1.0'}});if(r.ok)return await r.json() as {elements:any[]};console.warn(`${url}: HTTP ${r.status}`);}
  catch(err){console.warn(`${url}: ${(err as Error).message}`);}
  await new Promise(r=>setTimeout(r,4000*(attempt+1)));
 }
 throw new Error('Overpass unavailable after retries');
}

const r1=(v:number)=>Math.round(v*10)/10;
const pt=(g:{lat:number;lon:number}):Point=>{const [x,z]=project(g.lon,g.lat);return [r1(x),r1(z)];};
const inBounds=([x,z]:Point,b:Bounds,m=0)=>x>=b.left-m&&x<=b.right+m&&z>=b.top-m&&z<=b.bottom+m;
const inQueen=(p:Point)=>inBounds(p,QUEEN);
const centroid=(p:Point[]):Point=>[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];
const area=(p:Point[])=>Math.abs(p.reduce((s,q,i)=>{const r=p[(i+1)%p.length];return s+q[0]*r[1]-r[0]*q[1];},0))/2;
const levelsHeight=(t:Record<string,string>)=>{const h=parseFloat(t.height??'');if(h>0)return {h,src:'osm-height'};const l=parseFloat(t['building:levels']??'');if(l>0)return {h:l*3.3+1.1,src:'osm-levels'};return undefined;};
const WIDTH:Record<string,number>={motorway:22,trunk:18,primary:15,secondary:13,tertiary:11,residential:8,unclassified:8,living_street:6,service:5,pedestrian:6,primary_link:7,secondary_link:7,tertiary_link:7,footway:2.5,cycleway:2.5};

const osm=await overpass(query);
console.log(`${id}: ${osm.elements.length} OSM elements`);

// City footprints (measured roofs) inside the chunk.
type City={p:Point[];holes:Point[][];h:number};
const cityRaw=[...JSON.parse(readFileSync('src/data/distant-city.json','utf8')),...JSON.parse(readFileSync('src/data/neighbourhood-backdrop.json','utf8'))] as City[];
const city=cityRaw.filter(b=>inBounds(centroid(b.p),c.bounds)&&!inQueen(centroid(b.p)));

const osmBuildings:{p:Point[];t:Record<string,string>;id:string}[]=[];
for(const el of osm.elements){
 if(!el.tags?.building)continue;
 if(el.type==='way'&&el.geometry?.length>3)osmBuildings.push({p:el.geometry.slice(0,-1).map(pt),t:el.tags,id:`w${el.id}`});
 if(el.type==='relation')for(const m of el.members??[])if(m.role==='outer'&&m.geometry?.length>3)osmBuildings.push({p:m.geometry.slice(0,-1).map(pt),t:el.tags,id:`r${el.id}`});
}
const tagsFor=(t:Record<string,string>)=>({
 kind:t.building!=='yes'?t.building:undefined,levels:parseFloat(t['building:levels']??'')||undefined,colour:t['building:colour']||undefined,material:t['building:material']||undefined,
 roofShape:t['roof:shape']||undefined,name:t.name||undefined,shop:t.shop||t.amenity||undefined,street:t['addr:street']||undefined,number:t['addr:housenumber']||undefined,heritage:t.heritage?true:undefined,
});
const buildings:ChunkBuilding[]=[];const usedOsm=new Set<string>();
for(const b of city){
 const cc=centroid(b.p),match=osmBuildings.find(o=>inside(cc,o.p))??osmBuildings.find(o=>inside(centroid(o.p),b.p));if(match)usedOsm.add(match.id);
 buildings.push({id:match?.id??`city${buildings.length}`,p:b.p,holes:b.holes??[],h:r1(b.h),heightSource:'city',...(match?tagsFor(match.t):{})});
}
for(const o of osmBuildings){
 const cc=centroid(o.p);if(usedOsm.has(o.id)||!inBounds(cc,c.bounds)||inQueen(cc)||area(o.p)<12)continue;
 if(city.some(b=>inside(cc,b.p)))continue;
 const hh=levelsHeight(o.t)??{h:o.t.building==='house'||o.t.building==='detached'||o.t.building==='semidetached_house'?8:o.t.building==='garage'||o.t.building==='shed'?3:10,src:'default'};
 buildings.push({id:o.id,p:o.p,holes:[],h:r1(hh.h),heightSource:hh.src,...tagsFor(o.t)});
}

const roads:ChunkRoad[]=[];const rails:{k:string;p:Point[]}[]=[];
for(const el of osm.elements){
 if(el.type!=='way'||!el.geometry)continue;const t=el.tags??{};
 if(t.highway&&WIDTH[t.highway]){
  if(t.tunnel==='yes'||String(t.layer??'0').startsWith('-')||t.area==='yes')continue;
  const p=el.geometry.map(pt).filter((q:Point)=>inBounds(q,c.bounds,30));if(p.length<2)continue;
  const lanes=parseInt(t.lanes??'');roads.push({n:t.name??'',k:t.highway,w:lanes>0&&WIDTH[t.highway]>5?Math.max(6,Math.min(24,lanes*3.4+2)):WIDTH[t.highway],p,...(t.bridge==='yes'?{bridge:true}:{}),...(t.oneway==='yes'?{oneway:true}:{})});
 }
 if(t.railway){const p=el.geometry.map(pt).filter((q:Point)=>inBounds(q,c.bounds,30));if(p.length>1)rails.push({k:t.railway,p});}
}
const trees=osm.elements.filter(el=>el.type==='node'&&el.tags?.natural==='tree').map(pt).filter(q=>inBounds(q,c.bounds)&&!inQueen(q));
const parks=osm.elements.filter(el=>el.type==='way'&&(el.tags?.leisure||el.tags?.landuse||el.tags?.natural==='water')&&el.geometry?.length>3)
 .map(el=>({k:el.tags.leisure??el.tags.landuse??'water',n:el.tags.name??'',p:el.geometry.slice(0,-1).map(pt) as Point[]})).filter(a=>a.p.some(q=>inBounds(q,c.bounds)));
const places=osm.elements.filter(el=>el.type==='node'&&el.tags?.name&&(el.tags.amenity||el.tags.shop||el.tags.tourism||el.tags.office))
 .map(el=>({name:el.tags.name as string,kind:(el.tags.shop?`shop:${el.tags.shop}`:el.tags.amenity?`amenity:${el.tags.amenity}`:el.tags.tourism?`tourism:${el.tags.tourism}`:`office:${el.tags.office}`) as string,at:pt(el)})).filter(p=>inBounds(p.at,c.bounds)&&!inQueen(p.at));

const data:ChunkData={id,bounds:c.bounds,fetched:new Date().toISOString().slice(0,10),
 sources:['City of Toronto 3D massing roof outlines (Open Government Licence – Toronto), as shipped in src/data','© OpenStreetMap contributors, ODbL (Overpass API)'],
 buildings,roads,rails,trees,parks,places};
mkdirSync(`src/chunks/areas/${id}`,{recursive:true});writeFileSync(out,JSON.stringify(data));
console.log(`${out}: ${buildings.length} buildings (${buildings.filter(b=>b.heightSource==='city').length} City-measured), ${roads.length} streets, ${trees.length} trees, ${parks.length} parks, ${places.length} named places, ${rails.length} rail lines`);
buildMapIndex();
