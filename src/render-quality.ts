export type RenderQuality='balanced'|'high'|'cinematic';
export const QUALITY_NAMES:Record<RenderQuality,string>={balanced:'Balanced',high:'High',cinematic:'Cinematic'};
export function renderScale(quality:RenderQuality,dpr:number,width:number,height:number){
 const desired=quality==='balanced'?Math.min(dpr,1.25):quality==='cinematic'?Math.min(Math.max(dpr,2),2.5):Math.min(Math.max(dpr,1.5),2);
 const budget=quality==='balanced'?2800000:quality==='cinematic'?10000000:6500000;
 return Math.min(desired,Math.sqrt(budget/Math.max(1,width*height)));
}
export function savedQuality():RenderQuality{
 try{const q=new URLSearchParams(location.search).get('quality')||localStorage.getItem('enough-graphics');if(q==='balanced'||q==='cinematic')return q;}catch{/* Rendering also works when browser storage is unavailable. */}
 return 'high';
}
