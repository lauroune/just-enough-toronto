import {segmentDistance} from './geography';
import type {Point} from './game';
import type {Obstacle} from './motion';

// Conservative lane clearance, shared by ambient drivers and their tests.
// Speeds are metres per second. Cars yield before a person enters their body.
export function drivingSpeed(x:number,z:number,direction:number,cruise:number,obstacles:Obstacle[]){
 let gap=Infinity;
 for(const o of obstacles){
  if(Math.abs(z-o.z)>1.06+o.d/2+.24)continue;
  const ahead=(o.x-x)*direction;
  if(ahead<0)continue;
  gap=Math.min(gap,ahead-2.24-o.w/2);
 }
 return Math.min(cruise,Math.max(0,(gap-2.6)*.8));
}
export function personNear(p:Point,people:Point[],distance:number){return people.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<distance);}

export function safePedestrianStep(from:Point,to:Point,occupiers:Point[]){
 return occupiers.every(q=>segmentDistance(q,from,to)>=Math.min(.82,Math.hypot(q[0]-from[0],q[1]-from[1])-.00001));
}
