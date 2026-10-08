// Fallback data source: the official OpenStreetMap API map download (/api/0.6/map), the same
// source the game's original map used. Converts its XML into Overpass-style `out geom` elements,
// keeping only what the chunk pipeline reads. Bounding boxes must stay under 0.25 square degrees.
type Tags=Record<string,string>;
const attr=(s:string,name:string)=>s.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const unescape=(s:string)=>s.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const tagsOf=(body:string):Tags=>{const t:Tags={};for(const m of body.matchAll(/<tag k="([^"]*)" v="([^"]*)"\/>/g))t[unescape(m[1])]=unescape(m[2]);return t;};
export async function osmApiElements(s:number,w:number,n:number,e:number){
 const url=`https://api.openstreetmap.org/api/0.6/map?bbox=${w},${s},${e},${n}`;let xml='';
 for(let attempt=0;attempt<5;attempt++){
  const r=await fetch(url,{headers:{'User-Agent':'just-enough-toronto-chunks/1.0 (https://github.com/mimurchison/just-enough-toronto)'}});
  if(r.ok){xml=await r.text();break;}console.warn(`OSM API: HTTP ${r.status}`);await new Promise(res=>setTimeout(res,5000*(attempt+1)));
 }
 if(!xml)throw new Error('OSM API unavailable');
 const nodes=new Map<string,{lat:number;lon:number;tags:Tags}>(),ways=new Map<string,{refs:string[];tags:Tags}>(),elements:any[]=[];
 for(const m of xml.matchAll(/<node ([^>]*?)(\/>|>([\s\S]*?)<\/node>)/g)){const id=attr(m[1],'id')!;nodes.set(id,{lat:+attr(m[1],'lat')!,lon:+attr(m[1],'lon')!,tags:tagsOf(m[3]??'')});}
 for(const m of xml.matchAll(/<way ([^>]*)>([\s\S]*?)<\/way>/g)){ways.set(attr(m[1],'id')!,{refs:[...m[2].matchAll(/<nd ref="(\d+)"\/>/g)].map(x=>x[1]),tags:tagsOf(m[2])});}
 const geom=(refs:string[])=>refs.map(r=>nodes.get(r)).filter(Boolean).map(p=>({lat:p!.lat,lon:p!.lon}));
 for(const [id,nd] of nodes)if(Object.keys(nd.tags).length)elements.push({type:'node',id:+id,lat:nd.lat,lon:nd.lon,tags:nd.tags});
 for(const [id,wy] of ways)if(Object.keys(wy.tags).length)elements.push({type:'way',id:+id,tags:wy.tags,geometry:geom(wy.refs)});
 for(const m of xml.matchAll(/<relation ([^>]*)>([\s\S]*?)<\/relation>/g)){
  const tags=tagsOf(m[2]);if(!tags.building||tags.type!=='multipolygon')continue;
  const members=[...m[2].matchAll(/<member type="way" ref="(\d+)" role="([^"]*)"\/>/g)].map(x=>({role:x[2],geometry:geom(ways.get(x[1])?.refs??[])})).filter(x=>x.geometry.length);
  elements.push({type:'relation',id:+attr(m[1],'id')!,tags,members});
 }
 return {elements};
}
