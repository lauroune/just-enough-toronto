import {BOUNDS} from '../motion';
import {project} from '../geography';
import rawWaypoints from '../rush/data/waypoints.json';
import type {Point} from '../game';

// Toronto beyond Queen East is designed one square chunk at a time. Chunks are
// CHUNK metres on a side on a grid anchored at the game origin; the id encodes the
// cell, e.g. "c-11_1" spans x -4400..-4000, z 400..800. The authored Queen East map
// is the origin "queen" chunk and is never re-built here.
export const CHUNK=400;
export type Bounds={left:number;right:number;top:number;bottom:number};
export type ChunkCell={id:string;ix:number;iz:number;bounds:Bounds;center:Point};
export const cellId=(ix:number,iz:number)=>`c${ix}_${iz}`;
export function cell(ix:number,iz:number):ChunkCell{
 const left=ix*CHUNK,top=iz*CHUNK;return {id:cellId(ix,iz),ix,iz,bounds:{left,right:left+CHUNK,top,bottom:top+CHUNK},center:[left+CHUNK/2,top+CHUNK/2]};
}
export function parseCell(id:string){const m=id.match(/^c(-?\d+)_(-?\d+)$/);if(!m)throw new Error(`Not a chunk id: ${id}`);return cell(Number(m[1]),Number(m[2]));}
export const cellAt=(x:number,z:number)=>cell(Math.floor(x/CHUNK),Math.floor(z/CHUNK));
/** The authored Queen East map: chunks leave anything east of this line to it. */
export const QUEEN={...BOUNDS,left:-930} as Bounds;
export const QUEEN_CENTER:Point=[-190,-120];

/** Key locations the chunk plan connects (same list as the in-game waypoints). */
export const PLAN_ANCHORS:{id:string;name:string;at:Point}[]=[{id:'queen',name:'Queen East',at:QUEEN_CENTER},...rawWaypoints.map(w=>({id:w.id,name:w.name,at:project(w.lon,w.lat)}))];

function hull(points:Point[]):Point[]{
 const p=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o:Point,a:Point,b:Point)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lower:Point[]=[],upper:Point[]=[];
 for(const q of p){while(lower.length>1&&cross(lower.at(-2)!,lower.at(-1)!,q)<=0)lower.pop();lower.push(q);}
 for(const q of [...p].reverse()){while(upper.length>1&&cross(upper.at(-2)!,upper.at(-1)!,q)<=0)upper.pop();upper.push(q);}
 return [...lower.slice(0,-1),...upper.slice(0,-1)];
}
function distanceToPolygon(q:Point,poly:Point[]){
 let inside=false,best=Infinity;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dz)/(dx*dx+dz*dz||1)));best=Math.min(best,Math.hypot(a[0]+dx*t-q[0],a[1]+dz*t-q[1]));
 }
 return inside?0:best;
}
/** Share of a cell that the authored Queen map already covers. */
export const queenShare=(c:ChunkCell)=>Math.max(0,Math.min(c.bounds.right,QUEEN.right)-Math.max(c.bounds.left,QUEEN.left))*Math.max(0,Math.min(c.bounds.bottom,QUEEN.bottom)-Math.max(c.bounds.top,QUEEN.top))/(CHUNK*CHUNK);
const coveredByQueen=(c:ChunkCell)=>queenShare(c)>.75;

/**
 * Every chunk between the key locations, in the order to design them: outward from
 * Queen East, ring by ring, so each chunk is designed next to one that is already done.
 * A cell joins the plan when it lies within `margin` metres of the anchors' hull.
 */
export function chunkPlan(margin=CHUNK*.75):(ChunkCell&{ring:number})[]{
 const area=hull(PLAN_ANCHORS.map(a=>a.at)),xs=area.map(p=>p[0]),zs=area.map(p=>p[1]);
 const cells:ChunkCell[]=[];
 for(let ix=Math.floor((Math.min(...xs)-margin)/CHUNK);ix<=Math.floor((Math.max(...xs)+margin)/CHUNK);ix++)
  for(let iz=Math.floor((Math.min(...zs)-margin)/CHUNK);iz<=Math.floor((Math.max(...zs)+margin)/CHUNK);iz++){
   const c=cell(ix,iz);if(coveredByQueen(c))continue;
   const corners:Point[]=[[c.bounds.left,c.bounds.top],[c.bounds.right,c.bounds.top],[c.bounds.right,c.bounds.bottom],[c.bounds.left,c.bounds.bottom],c.center];
   if(Math.min(...corners.map(q=>distanceToPolygon(q,area)))<=margin)cells.push(c);
  }
 // Ring = grid steps (8-neighbour) from the nearest cell touching the Queen map.
 const key=(c:ChunkCell)=>c.id,byId=new Map(cells.map(c=>[key(c),c])),ring=new Map<string,number>();
 const touchesQueen=(c:ChunkCell)=>c.bounds.right>QUEEN.left&&c.bounds.left<QUEEN.right&&c.bounds.bottom>QUEEN.top&&c.bounds.top<QUEEN.bottom;
 let frontier=cells.filter(touchesQueen);if(!frontier.length)frontier=[[...cells].sort((a,b)=>Math.hypot(a.center[0]-QUEEN_CENTER[0],a.center[1]-QUEEN_CENTER[1])-Math.hypot(b.center[0]-QUEEN_CENTER[0],b.center[1]-QUEEN_CENTER[1]))[0]];
 frontier.forEach(c=>ring.set(c.id,1));
 while(frontier.length){
  const next:ChunkCell[]=[];
  for(const c of frontier)for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const n=byId.get(cellId(c.ix+dx,c.iz+dz));if(n&&!ring.has(n.id)){ring.set(n.id,ring.get(c.id)!+1);next.push(n);}}
  frontier=next;
 }
 return cells.filter(c=>ring.has(c.id)).map(c=>({...c,ring:ring.get(c.id)!})).sort((a,b)=>a.ring-b.ring||Math.hypot(a.center[0]-QUEEN_CENTER[0],a.center[1]-QUEEN_CENTER[1])-Math.hypot(b.center[0]-QUEEN_CENTER[0],b.center[1]-QUEEN_CENTER[1]));
}
