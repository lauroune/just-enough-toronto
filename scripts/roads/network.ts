// The drivable street network across the authored map, downtown and every fetched chunk.
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {GEO} from '../../src/geography';
import {DOWNTOWN_ROADS} from '../../src/rush/downtown-data';
import type {ChunkData} from '../../src/chunks/types';
import type {Point} from '../../src/game';

const CAR_KINDS=new Set(['motorway','trunk','primary','secondary','tertiary','residential','unclassified','living_street','primary_link','secondary_link','tertiary_link']);
export type Street={n:string;k:string;p:Point[];source:string};
export function loadStreets():Street[]{
 const out:Street[]=[];
 for(const r of GEO.roads)if(CAR_KINDS.has(r.kind))out.push({n:r.name,k:r.kind,p:r.p,source:'authored'});
 for(const r of DOWNTOWN_ROADS)if(CAR_KINDS.has(r.k))out.push({n:r.n,k:r.k,p:r.p,source:'downtown'});
 const dir='src/chunks/areas';
 for(const id of existsSync(dir)?readdirSync(dir):[]){if(!existsSync(`${dir}/${id}/data.json`))continue;const d=JSON.parse(readFileSync(`${dir}/${id}/data.json`,'utf8')) as ChunkData;for(const r of d.roads)if(CAR_KINDS.has(r.k))out.push({n:r.n,k:r.k,p:r.p,source:id});}
 return out;
}
/** Graph on vertices snapped to 1 m; endpoints within `weld` metres of another vertex are joined too. */
export function buildGraph(streets:Street[],weld=3){
 const key=(p:Point)=>`${Math.round(p[0])}:${Math.round(p[1])}`,pos=new Map<string,Point>(),adj=new Map<string,Map<string,number>>();
 const link=(a:string,b:string,w:number)=>{if(a===b)return;for(const [u,v] of [[a,b],[b,a]]){let m=adj.get(u);if(!m){m=new Map();adj.set(u,m);}if(!m.has(v)||m.get(v)!>w)m.set(v,w);}};
 for(const s of streets)for(let i=0;i<s.p.length;i++){const k=key(s.p[i]);pos.set(k,s.p[i]);if(i)link(key(s.p[i-1]),k,Math.hypot(s.p[i][0]-s.p[i-1][0],s.p[i][1]-s.p[i-1][1]));}
 // Weld dangling ends to nearby vertices (separately mapped segments that nearly touch).
 const grid=new Map<string,string[]>(),cell=(p:Point)=>`${Math.floor(p[0]/10)}:${Math.floor(p[1]/10)}`;
 for(const [k,p] of pos){const c=cell(p);(grid.get(c)??grid.set(c,[]).get(c)!).push(k);}
 for(const [k,p] of pos){if((adj.get(k)?.size??0)>1)continue;const [cx,cz]=cell(p).split(':').map(Number);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const o of grid.get(`${cx+dx}:${cz+dz}`)??[]){const q=pos.get(o)!,d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(o!==k&&d<=weld)link(k,o,d);}}
 return {pos,adj,key};
}
export function nearestNode(g:ReturnType<typeof buildGraph>,p:Point){let best='',d=Infinity;for(const [k,q] of g.pos){const e=Math.hypot(q[0]-p[0],q[1]-p[1]);if(e<d&&(g.adj.get(k)?.size??0)>0){d=e;best=k;}}return {node:best,distance:d};}
export function shortestPath(g:ReturnType<typeof buildGraph>,from:string,to:string):Point[]|undefined{
 const dist=new Map<string,number>([[from,0]]),prev=new Map<string,string>(),done=new Set<string>();
 // Binary heap keyed by distance.
 const heap:[number,string][]=[[0,from]];const push=(x:[number,string])=>{heap.push(x);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
 const pop=()=>{const top=heap[0],last=heap.pop()!;if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
 while(heap.length){const [d,u]=pop();if(done.has(u))continue;done.add(u);if(u===to)break;for(const [v,w] of g.adj.get(u)??[]){const nd=d+w;if(nd<(dist.get(v)??Infinity)){dist.set(v,nd);prev.set(v,u);push([nd,v]);}}}
 if(!dist.has(to))return undefined;const path:Point[]=[];for(let u:string|undefined=to;u;u=prev.get(u))path.push(g.pos.get(u)!);return path.reverse();
}
