import type { Point } from './game';
import { inside, segmentDistance } from './geography';
export type Obstacle={x:number;z:number;w:number;d:number;h:number;tag?:string;p?:Point[];holes?:Point[][]};
export const worldPoint=([x,z]:Point):Point=>[x,z];
export const BOUNDS={left:-915,right:535,top:-790,bottom:150};
export function blocked(x:number,z:number,radius:number,obstacles:Obstacle[]){
 return obstacles.some(o=>{
  if(x<o.x-o.w/2-radius||x>o.x+o.w/2+radius||z<o.z-o.d/2-radius||z>o.z+o.d/2+radius)return false;
  if(o.p){if(inside([x,z],o.p)&&!o.holes?.some(h=>inside([x,z],h)))return true;return [o.p,...o.holes||[]].some(ring=>ring.some((a,i)=>segmentDistance([x,z],a,ring[(i+1)%ring.length])<radius));}
  const dx=x-Math.max(o.x-o.w/2,Math.min(x,o.x+o.w/2)),dz=z-Math.max(o.z-o.d/2,Math.min(z,o.z+o.d/2));return dx*dx+dz*dz<radius*radius;
 });
}
export function moveWithCollision(position:Point,delta:Point,radius:number,obstacles:Obstacle[]):Point{
  let [x,z]=position;const steps=Math.max(1,Math.ceil(Math.hypot(...delta)/.2));
  for(let i=0;i<steps;i++){
    const nx=Math.max(BOUNDS.left+radius,Math.min(BOUNDS.right-radius,x+delta[0]/steps));if(!blocked(nx,z,radius,obstacles))x=nx;
    const nz=Math.max(BOUNDS.top+radius,Math.min(BOUNDS.bottom-radius,z+delta[1]/steps));if(!blocked(x,nz,radius,obstacles))z=nz;
  }
  return [x,z];
}
export function angleDelta(a:number,b:number){return Math.atan2(Math.sin(b-a),Math.cos(b-a));}
export function approachAngle(a:number,b:number,rate:number,dt:number){return a+angleDelta(a,b)*(1-Math.exp(-rate*dt));}
export function pathAt(points:Point[],distance:number){
  for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i],length=Math.hypot(to[0]-from[0],to[1]-from[1]);if(distance<=length||i===points.length-1){const t=Math.min(1,distance/(length||1));return {x:from[0]+(to[0]-from[0])*t,z:from[1]+(to[1]-from[1])*t,heading:Math.atan2(to[0]-from[0],to[1]-from[1])};}distance-=length;}
  return {x:points[0][0],z:points[0][1],heading:Math.PI/2};
}

// Remove a retraced segment when an authored graph enters and leaves the same lane.
// The planner/evaluator still decide the route; this only removes visual doubling back.
export function smoothRoute(points:Point[]):Point[]{
  const out:Point[]=[];
  for(const point of points){
    while(out.length>1){const a=out[out.length-2],b=out[out.length-1],ab=[b[0]-a[0],b[1]-a[1]],bc=[point[0]-b[0],point[1]-b[1]];
      if(Math.abs(ab[0]*bc[1]-ab[1]*bc[0])>.0001)break;
      out.pop();
    }
    if(!out.length||Math.hypot(out.at(-1)![0]-point[0],out.at(-1)![1]-point[1])>.0001)out.push(point);
  }
  return out;
}
export function followCart(position:Point,previous:Point,distance=.94):Point{
  const dx=position[0]-previous[0],dz=position[1]-previous[1],length=Math.hypot(dx,dz);
  return length<.001?[...previous]:[position[0]-dx/length*distance,position[1]-dz/length*distance];
}

// A trailer needs room to straighten before a narrow corridor and before the door.
// These staging turns stay on the selected route; they never choose another route.
export function rigRoute(points:Point[],wide:boolean,sideDoor:Point):Point[]{
  // Mapped polylines already include the turn clearances. Do not invent a diagonal staging detour.
  void wide;void sideDoor;return points.map(p=>[...p] as Point);
}
