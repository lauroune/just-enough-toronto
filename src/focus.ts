import * as T from 'three';

// Depth of field uses distance along the optical axis, not radial distance.
// Keep the whole small robot and its immediate stopping space inside the
// sharp region. A farther camera must not bring metres of background into focus.
export function focusSettings(camera:T.PerspectiveCamera,subject:T.Vector3,overview=false){
 camera.updateMatrixWorld();
 const distance=Math.max(camera.near+.1,-subject.clone().applyMatrix4(camera.matrixWorldInverse).z);
 return {distance,sharpRange:1.15,strength:overview?0:1};
}

// Gentle separation: keep the street readable, with the same lens size
// across graphics tiers and portrait windows.
export function lensRadius(cssHeight:number,pixelRatio:number){
 const cssPixels=T.MathUtils.clamp(cssHeight*.005,4,6);
 return {cssPixels,renderPixels:cssPixels*pixelRatio};
}
