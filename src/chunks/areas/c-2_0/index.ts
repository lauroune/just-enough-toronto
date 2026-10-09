import * as T from 'three';
import type {ChunkModule,ChunkContext,ChunkRoad} from '../../types';
import {inside,segmentDistance} from '../../../geography';

// Lower Don crossing: Queen/King/Eastern bridges over the Don Valley Parkway and river corridor,
// River City 3's tower cluster on Bayview, Corktown Common's slopes, and the BMW/Mini
// showrooms on the east bank. Continues the pilot's (c-3_0) River City cladding across the seam.

type Pt=[number,number];
const centroid=(p:Pt[]):Pt=>[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];
const area=(p:Pt[])=>Math.abs(p.reduce((s,q,i)=>{const r=p[(i+1)%p.length];return s+q[0]*r[1]-r[0]*q[1];},0))/2;
let ballast:T.MeshStandardMaterial|undefined;
const makeBallast=()=>{const m=new T.MeshStandardMaterial({color:0x8a8780,roughness:1,side:T.DoubleSide});// cached
 return m;};
const ballastMaterial=()=>ballast??=makeBallast();

const chunk:ChunkModule={
 meta:{
  title:'Lower Don & Bayview',
  character:'The Don Valley crossing: Queen, King and Eastern bridges over the parkway and river, the River City 3 towers on Bayview Avenue, grassed valley slopes with Corktown Common, and low car showrooms on the east bank.',
  heroes:['River City 3 (RC3)','Don Valley bridges (Eastern Avenue)','BMW Toronto showroom'],
 },
 build(ctx){
  const {kit,data}=ctx;
  kit.streets(ctx);
  kit.parks(ctx);
  railCorridor(ctx);
  // Largest BMW and the Mini building carry their real OSM names on the showroom signband.
  const bmw=data.buildings.filter(b=>b.name==='BMW Toronto').sort((a,b)=>area(b.p as Pt[])-area(a.p as Pt[]))[0];
  for(const b of data.buildings){
   if(b.name==='RC3'){kit.building(ctx,b,{style:'modern',shopfronts:false});if(b.h>60)crown(ctx,b.p as Pt[],b.h);continue;}
   if(b.material==='glass'||b.kind==='apartments'){kit.building(ctx,b,{style:'modern',shopfronts:false});continue;}
   if(b.name==='BMW Toronto'){kit.building(ctx,b,{style:'modern',shopfronts:true,signs:b===bmw?['BMW Toronto']:[]});continue;}
   if(b.name==='Mini Downtown'){kit.building(ctx,b,{style:'modern',shopfronts:true,signs:['Mini Downtown']});continue;}
   kit.building(ctx,b,{style:'industrial',shopfronts:false});
  }
  for(const r of data.roads){
   if(r.bridge&&r.w>=8&&r.n!=='Queen Street East'&&r.n!=='King Street East')parapets(ctx,r);
   if(r.k==='motorway')barrier(ctx,r);
  }
  kit.dressStreets(ctx);
  slopeTrees(ctx);
  trailBenches(ctx);
  // Lawren Harris Square: a pair of benches facing each other.
  const sq=data.parks.find(p=>p.n==='Lawren Harris Square');
  if(sq){const c=centroid(sq.p as Pt[]);kit.bench(ctx,c[0]-2,c[1],0);kit.bench(ctx,c[0]+2,c[1],Math.PI);}
 },
};

/** Roof parapet and a mechanical penthouse on the RC3 towers (stylised, not surveyed). */
function crown(ctx:ChunkContext,p:Pt[],h:number){
 const {kit}=ctx,c=centroid(p),g=new T.Group();
 g.position.set(c[0],kit.baseHeight(p)+h,c[1]);
 kit.box(g,0,1.6,0,6,3.2,5,0x444d51);kit.box(g,2.4,3.4,-1,1.2,6.8,1.2,0x30383b);
 ctx.layers.tile(c[0],c[1]).add(g);
}

/** True where another carriageway or street body covers (x,z), so side furniture is not built across traffic. */
function onOtherRoad(ctx:ChunkContext,self:ChunkRoad,x:number,z:number){
 return ctx.data.roads.some(o=>o!==self&&o.w>=5&&o.p.some((q,i)=>i&&segmentDistance([x,z],o.p[i-1],q)<o.w/2+.8));
}
/** Walk both edges of a road in ~6 m pieces, calling `piece` where nothing else occupies the spot. */
function edgePieces(ctx:ChunkContext,r:ChunkRoad,inset:number,piece:(g:T.Group,len:number,side:number)=>void,sides:number[]=[-1,1]){
 const {kit}=ctx,group=ctx.layers.detail(...r.p[Math.floor(r.p.length/2)]);
 for(let i=1;i<r.p.length;i++){
  const a=r.p[i-1],b=r.p[i],full=Math.hypot(b[0]-a[0],b[1]-a[1]);if(full<2)continue;
  const n=Math.max(1,Math.round(full/6)),len=full/n,ang=Math.atan2(b[0]-a[0],b[1]-a[1]),nx=(a[1]-b[1])/full,nz=(b[0]-a[0])/full;
  for(let k=0;k<n;k++)for(const s of sides){
   const t=(k+.5)/n,x=a[0]+(b[0]-a[0])*t+nx*s*(r.w/2+inset),z=a[1]+(b[1]-a[1])*t+nz*s*(r.w/2+inset);
   if(onOtherRoad(ctx,r,x,z))continue;
   const g=new T.Group();g.position.set(x,kit.baseHeight([[x,z]]),z);g.rotation.y=ang;piece(g,len,s);group.add(g);
  }
 }
}
/** Concrete parapet walls and a rail on each side of a bridge road. */
function parapets(ctx:ChunkContext,r:ChunkRoad){
 edgePieces(ctx,r,.25,(g,len)=>{
  ctx.kit.box(g,0,.45,0,.4,.9,len,0xb9b5aa);ctx.kit.box(g,0,1.05,0,.12,.1,len,0x4b5254);
  for(let t=-len/2+1;t<len/2;t+=3)ctx.kit.box(g,0,.7,t,.1,.5,.1,0x4b5254);
 });
}
/** Low concrete barrier on the outer edge of each Parkway carriageway, except where a bridge road crosses. */
function barrier(ctx:ChunkContext,r:ChunkRoad){
 edgePieces(ctx,r,.4,(g,len)=>{ctx.kit.box(g,0,.4,0,.45,.8,len,0xaeaaa0);});
}

/** The mapped rail lines: gravel bed, two steel rails and sleepers, draped on the terrain. Trams are drawn by the street kit. */
function railCorridor(ctx:ChunkContext){
 const {kit}=ctx,bed=ballastMaterial();
 for(const r of ctx.data.rails){
  if(r.k!=='rail')continue;
  const mid=r.p[Math.floor(r.p.length/2)],tile=ctx.layers.tile(...mid),detail=ctx.layers.detail(...mid);
  const strip=new T.Mesh(kit.ribbon(r.p,4.2,.05),bed);strip.receiveShadow=true;tile.add(strip);
  for(const off of [-.72,.72]){const rail=new T.Mesh(kit.ribbon(r.p,.08,.12,off),kit.material(0x7d8081,.4));detail.add(rail);}
  detail.add(new T.Mesh(kit.dashes(r.p,2.4,.08,0,.25,.55),kit.material(0x4a3f36)));
 }
}

/** Scatter trees over the valley's grassed slopes, away from roads, buildings and each other. */
function slopeTrees(ctx:ChunkContext){
 const {data,kit}=ctx,placed:Pt[]=[];
 for(const g of data.parks){
  if(g.k!=='grass'||g.p.length<8)continue;
  const xs=g.p.map(q=>q[0]),zs=g.p.map(q=>q[1]),n=Math.min(5,Math.floor(area(g.p as Pt[])/700));
  for(let tries=0,got=0;got<n&&tries<n*12;tries++){
   const p:Pt=[Math.min(...xs)+ctx.rand()*(Math.max(...xs)-Math.min(...xs)),Math.min(...zs)+ctx.rand()*(Math.max(...zs)-Math.min(...zs))];
   if(!inside(p,g.p as Pt[])||data.buildings.some(b=>inside(p,b.p as Pt[])))continue;
   if(data.roads.some(r=>r.p.some((q,i)=>i&&segmentDistance(p,r.p[i-1],q)<r.w/2+4)))continue;
   if(placed.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<9)||data.trees.some(t=>Math.hypot(t[0]-p[0],t[1]-p[1])<6))continue;
   placed.push(p);kit.tree(ctx,p[0],p[1],6+ctx.rand()*6);got++;
  }
 }
}

/** Benches beside the Corktown Common trail, facing the path every ~50 m. */
function trailBenches(ctx:ChunkContext){
 for(const r of ctx.data.roads.filter(r=>r.n==='Corktown Common Trail')){
  let carry=18;
  for(let i=1;i<r.p.length;i++){
   const a=r.p[i-1],b=r.p[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   for(let d=carry;d<len;d+=50){const nx=-(b[1]-a[1])/len,nz=(b[0]-a[0])/len,x=a[0]+(b[0]-a[0])*d/len+nx*2.2,z=a[1]+(b[1]-a[1])*d/len+nz*2.2;
    if(!ctx.data.buildings.some(q=>inside([x,z],q.p as Pt[])))ctx.kit.bench(ctx,x,z,Math.atan2(-nx,-nz));}
   carry=Math.max(0,(carry-len)%50);
  }
 }
}
export default chunk;
