import raw from './data/geography.json';
import massing from './data/massing.json';
import type {Point} from './game';
export type GeoBuilding={id:number;buildingId:number;p:Point[];holes:Point[][];h:number;heightSource:string;elevation:number;bounds:number[];landmarks?:string[];osm?:Record<string,string|number>};
export type GeoRoad={id:number;name:string;p:Point[];kind:string;width:number;bridge:boolean;footway:string;surface:string;layer:number};
export const GEO=raw as unknown as {meta:{bounds:number[];angle:number;origin:number[];units:string};buildings:GeoBuilding[];roads:GeoRoad[];areas:{id:number;name:string;p:Point[];kind:string;sport:string}[];rails:{id:number;name:string;p:Point[];kind:string}[];trees:Point[];pois:{id:string;name:string;address:string;lat:number;lon:number;point:Point;building?:number}[]};
// Render distinct source roof sections, while collisions retain the original
// footprint union. Presentation no longer propagates a tower height to a podium.
export const RENDER_BUILDINGS:GeoBuilding[]=GEO.buildings.flatMap(b=>{
 const parts=(massing as unknown as Record<string,{p:Point[];holes:Point[][];h:number;bounds:number[]}[]>)[String(b.id)];
 return parts?parts.map(p=>({...b,...p})): [b];
});
export const project=(lon:number,lat:number):Point=>{const e=(lon-GEO.meta.origin[0])*111320*Math.cos(GEO.meta.origin[1]*Math.PI/180),n=(lat-GEO.meta.origin[1])*111320,a=GEO.meta.angle;return [e*Math.cos(a)+n*Math.sin(a),e*Math.sin(a)-n*Math.cos(a)];};
export function inside(p:Point,poly:Point[]){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function segmentDistance(p:Point,a:Point,b:Point){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
export const START:Point=[-871,55];
export const VISITS:{id:string;label:string;position:Point;yaw:number}[]=[
{id:'king-river',label:'King & River',position:START,yaw:1.95},
{id:'river-factories',label:'Queen / River · historic factories',position:[-878,4.8],yaw:-1.94},
{id:'studio535',label:'Studio535 · 535 Queen East',position:[-917,6.5],yaw:.05},
{id:'cn-skyline',label:'Don bridge · southwest skyline',position:[-615,-8],yaw:-1.3026},
{id:'bridge',label:'Don bridge',position:[-731,-8],yaw:Math.PI/2},
{id:'dark-horse',label:'Dark Horse',position:[-540,6.8],yaw:Math.PI},
{id:'broadview',label:'Broadview Hotel',position:[-307,6.6],yaw:-2.29},
{id:'butchers',label:'Butchers · ornate Queen block',position:[-225,6.8],yaw:Math.PI},
{id:'queen-graffiti',label:'Queen · painted storefront',position:[-247,-5.9],yaw:Math.PI},
{id:'boulton-mural',label:'Boulton · BISKAABIIYAANG mural',position:[-56.4,-16.6],yaw:Math.PI/2},
{id:'stone-pair',label:'16–18 De Grassi · stone pair',position:[21.2,-72.0],yaw:-Math.PI/2},
{id:'opera',label:'Opera House',position:[-232,-6.5],yaw:0},
{id:'amber',label:'Amber · Boulton',position:[-55,-29],yaw:-Math.PI/2},
{id:'bonjour',label:'Bonjour Brioche',position:[-14,6.8],yaw:Math.PI},
{id:'degrassi',label:'De Grassi Street',position:[9,-28],yaw:Math.PI},
{id:'laneway-west',label:'De Grassi → Boulton · laneway',position:[9,-53.8],yaw:-Math.PI/2},
{id:'laneway-east',label:'Boulton → De Grassi · laneway',position:[-44,-53.8],yaw:Math.PI/2},
{id:'degrassi-bend',label:'De Grassi · west-side houses',position:[21.4,-61.5],yaw:-1.34},
{id:'degrassi-west-row',label:'De Grassi · north along the west row',position:[22.3,-80.5],yaw:Math.PI},
{id:'leslieville-station',label:'Leslieville Station · completed design',position:[-8,3.2],yaw:2.03},
{id:'station-plaza',label:'Leslieville Station · south plaza',position:[-24,17],yaw:1.12},
{id:'riverside-mural',label:'Riverside · River of Life mural',position:[47,-7.3],yaw:0},
{id:'rail-underpass',label:'Queen · railway underpass',position:[9,-1],yaw:Math.PI/2},
{id:'jimmie',label:'Jimmie Simpson Park',position:[151,-67],yaw:-1.7},
{id:'logan-corner',label:'Queen / Logan · video view',position:[302.0,-5.2],yaw:.50},
{id:'logan-west',label:'875 Queen · Logan corner',position:[306,-6.0],yaw:-.67},
{id:'td-bank',label:'904 Queen · TD corner',position:[308,-5.5],yaw:-2.3},
{id:'booth-shops',label:'Booth · north storefronts',position:[248,-7.95],yaw:-Math.PI/2},
{id:'park-entrance',label:'Jimmie Simpson · Queen entrance',position:[210,-7.0],yaw:-2.15},
{id:'queen-books',label:'Queen Books',position:[329,6.8],yaw:Math.PI},
{id:'mercury',label:'Mercury Espresso',position:[393,-6.5],yaw:0},
{id:'poulton',label:'Poulton Block',position:[-61,6.6],yaw:-2.75},
{id:'bank',label:'744 Queen · former bank',position:[-188,6.5],yaw:Math.PI},
{id:'library',label:'Queen / Saulter Library',position:[-120,-6.5],yaw:-.38},
{id:'cottage',label:'52 De Grassi · cottage',position:[24.5,-164],yaw:-Math.PI/2},
{id:'degrassi-gardens',label:'De Grassi · porches & gardens',position:[24.5,-281],yaw:-Math.PI/2},
{id:'boulton-homes',label:'Boulton homes',position:[-54,-196],yaw:-Math.PI/2},
{id:'degrassi-north',label:'De Grassi / Gerrard',position:[29.9,-747],yaw:0},
{id:'boulton-north',label:'Boulton / Gerrard',position:[-46.3,-747],yaw:0},
{id:'carlaw',label:'Queen & Carlaw',position:[494,8],yaw:Math.PI/2}
];
// Queen's mapped centreline. Kept as a polyline, including the slight bend at River.
export const QUEEN=GEO.roads.filter(r=>r.name==='Queen Street East').flatMap(r=>r.p).filter(p=>p[0]>-925&&p[0]<955).sort((a,b)=>a[0]-b[0]).filter((p,i,a)=>!i||p[0]-a[i-1][0]>.05);
export function queenZ(x:number){for(let i=1;i<QUEEN.length;i++){const a=QUEEN[i-1],b=QUEEN[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return 0;}
