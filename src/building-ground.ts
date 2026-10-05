import type {Object3D} from 'three';
import {GEO,inside,segmentDistance} from './geography';
import {STREET} from './street-data';
import type {Point} from './game';

// Structural parts share one foundation datum. Draping every cornice/window
// vertex over the contour field bends masonry and twists rectangular openings.
const buildings=[
 ...STREET.units.map(b=>({p:b.p,anchor:b.front})),
 ...GEO.buildings.map(b=>({p:b.p,anchor:[(b.bounds[0]+b.bounds[2])/2,Math.abs(b.bounds[1])<Math.abs(b.bounds[3])?b.bounds[1]:b.bounds[3]] as Point})),
];
export function buildingGroundAnchor(x:number,z:number):Point{
 const point:Point=[x,z];let best=Infinity,anchor=point;
 for(const b of buildings){
  const distance=inside(point,b.p)?0:Math.min(...b.p.map((a,i)=>segmentDistance(point,a,b.p[(i+1)%b.p.length])));
  if(distance<best){best=distance;anchor=b.anchor;if(distance<.001)break;}
 }
 return best<5?anchor:point;
}
export function rigidBuilding<T extends Object3D>(object:T,x:number,z:number,anchor=buildingGroundAnchor(x,z)):T{
 object.userData.terrainRigid=true;object.userData.terrainAnchor=anchor;return object;
}
