import * as T from 'three';

export const SUN_DIRECTION=new T.Vector3(-64,19,4).normalize();
const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),SUN_DIRECTION).normalize();
const up=new T.Vector3().crossVectors(SUN_DIRECTION,right).normalize();
export function makeGoldenSun(color:number){
 const sun=new T.DirectionalLight(color,4.5);sun.castShadow=true;
 sun.shadow.mapSize.set(4096,4096);
 Object.assign(sun.shadow.camera,{left:-90,right:90,top:55,bottom:-55,near:1,far:440});
 // Commit the authored extent immediately. Three also updates this on first
 // shadow-target allocation; keeping it explicit supports live quality changes.
 sun.shadow.camera.updateProjectionMatrix();
 sun.shadow.bias=-.00006;sun.shadow.normalBias=.026;
 return sun;
}
export function followGoldenSun(sun:T.DirectionalLight,position:T.Vector3){
 const anchor=new T.Vector3(position.x,position.y,position.z);
 const x=anchor.dot(right),y=anchor.dot(up),sx=180/sun.shadow.mapSize.x,sy=110/sun.shadow.mapSize.y;
 anchor.addScaledVector(right,Math.round(x/sx)*sx-x).addScaledVector(up,Math.round(y/sy)*sy-y);
 // Snap both target and source in light space. The sun direction stays fixed
 // while the player moves, avoiding the old two-metre jumps in illumination.
 sun.target.position.copy(anchor);sun.position.copy(anchor).addScaledVector(SUN_DIRECTION,200);
}
