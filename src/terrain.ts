import raw from './data/terrain.json';
import region from './data/terrain-region.json';
// Metres relative to the Queen / De Grassi datum. Contours resolve broad
// slopes, not individual kerbs, potholes or future station grading.
export const TERRAIN=raw;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function contourHeight(x:number,z:number){
 const u=clamp((x-raw.left)/raw.step,0,raw.cols-1),v=clamp((z-raw.top)/raw.step,0,raw.rows-1),i=Math.min(raw.cols-2,Math.floor(u)),j=Math.min(raw.rows-2,Math.floor(v)),fx=u-i,fz=v-j;
 const a=raw.heights[j*raw.cols+i],b=raw.heights[j*raw.cols+i+1],c=raw.heights[(j+1)*raw.cols+i],d=raw.heights[(j+1)*raw.cols+i+1];
 return (a+(b-a)*fx)*(1-fz)+(c+(d-c)*fx)*fz-raw.meta.datum;
}
const smooth=(t:number)=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const railWest=contourHeight(-20,1.06),railEast=contourHeight(100,1.06);
const railGrade=(x:number)=>railWest+(railEast-railWest)*(x+20)/120;
const roadDatum=railGrade(0);
export const WORLD_DATUM=raw.meta.datum+roadDatum;
/**
 * The wider city (scripts/terrain/import-region.py): the same City contours on a 20 m
 * grid, in decimetres above sea level, relative here to the game's street datum.
 * The authored grid above stays authoritative; this takes over where it fades out.
 */
export const REGION=region;
export function regionHeight(x:number,z:number){
 const u=clamp((x-region.left)/region.step,0,region.cols-1),v=clamp((z-region.top)/region.step,0,region.rows-1),i=Math.min(region.cols-2,Math.floor(u)),j=Math.min(region.rows-2,Math.floor(v)),fx=u-i,fz=v-j,H=region.heights,c=region.cols;
 const a=H[j*c+i],b=H[j*c+i+1],d=H[(j+1)*c+i],e=H[(j+1)*c+i+1];
 return ((a+(b-a)*fx)*(1-fz)+(d+(e-d)*fx)*fz)/10-WORLD_DATUM;
}
export function groundHeight(x:number,z:number){
 if(!Number.isFinite(x)||!Number.isFinite(z))return 0;
 // Ground contours beneath a viaduct cannot describe the deck. Preserve
 // the existing valley relief and bridge clearance; interpolate its abutments.
 const bridgeWest=-817,bridgeEast=-582;
 let h=contourHeight(x,z);
 if(x>bridgeWest&&x<bridgeEast){const t=(x-bridgeWest)/(bridgeEast-bridgeWest);h=contourHeight(bridgeWest,0)*(1-t)+contourHeight(bridgeEast,0)*t;}
 // Contours include the raised rail embankment. Queen runs below it, so
 // interpolate the road approaches and blend back outside its corridor.
 const underpass=smooth((x+40)/20)*smooth((120-x)/20)*smooth((28-Math.abs(z-1.06))/17);
 h+=(railGrade(x)-h)*underpass;
 h-=roadDatum;
 // The completed station removes the old embankment at its entrances. Keep
 // its structural footprint and south plaza on the same level foundation;
 // blend outside the finished works, while preserving Queen's through grade.
 // This is interpreted future grading, not an as-built elevation survey.
 const c=1/Math.sqrt(1+.375*.375),n=-.375*c;
 const sx=(x-21)*c-z*n,sz=(x-21)*n+z*c;
 const headhouses=smooth((19-Math.abs(sx))/4)*smooth((82-Math.abs(sz))/10);
 const plaza=smooth((x+34)/9)*smooth((10-x)/9)*smooth((z-8)/3)*smooth((68-z)/10);
 const finished=Math.max(headhouses,plaza)*smooth((Math.abs(z)-10)/4);
 h+=(railGrade(21)-roadDatum-h)*finished;
 const border=Math.min(x-raw.left,raw.left+(raw.cols-1)*raw.step-x,z-raw.top,raw.top+(raw.rows-1)*raw.step-z),t=clamp(border/100,0,1);
 // Past the authored grid's edge, blend into the regional terrain (it used to fall to a flat 0).
 const s=t*t*(3-2*t);
 return s===1?h:h*s+regionHeight(x,z)*(1-s);
}
export function groundGradient(x:number,z:number){return {x:(groundHeight(x+.5,z)-groundHeight(x-.5,z)),z:(groundHeight(x,z+.5)-groundHeight(x,z-.5))};}
