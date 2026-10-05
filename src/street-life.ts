import {groundHeight,groundGradient} from './terrain';
import * as T from 'three';
import {box,orb,rod,mergeStatic} from './world';
import {buildParkedCar} from './street-vehicles';
import {queenZ,inside} from './geography';
import {SURFACES} from './surfaces';
import {STREET} from './street-data';
import {blocked,approachAngle} from './motion';
import type {Obstacle} from './motion';
import type {Point} from './game';
import {drivingSpeed,personNear,safePedestrianStep} from './street-flow';

type Walker={group:T.Group;limbs:T.Group[];x:number;z:number;start:number;end:number;direction:number;speed:number;offset:number;phase:number;wait:number;side:number;bound:Obstacle};
type Car={group:T.Group;direction:number;cruise:number;speed:number;bound:Obstacle};

// Supporting neighbours and traffic are invented characters, never identities
// copied from reference footage. Routes follow the mapped paved sidewalks.
export class StreetLife{
 readonly bounds:Obstacle[]=[];
 readonly cars:Car[]=[];
 readonly walkers:Walker[]=[];
 private sidewalk=[...SURFACES.surfaces,...STREET.surfaces].filter(s=>s.kind==='sidewalk');
 constructor(parent:T.Group,private staticBounds:Obstacle[]){
  const palette=[0xe1d6be,0x536d76,0x925c4d,0x727677,0xaaa998];
  for(let i=0;i<10;i++){
   const direction=i%2?1:-1,x=-780+Math.floor(i/2)*270+(i%2)*105,z=queenZ(x)+direction*1.65;
   const group=buildParkedCar(parent,x,z,palette[i%5],direction<0);mergeStatic(group);
   const bound:Obstacle={x,z,w:4.48,d:2.08,h:1.65,tag:'moving car'};
   this.cars.push({group,direction,cruise:5.2+(i%3)*.35,speed:0,bound});this.bounds.push(bound);
  }
  const skin=[0xbb9275,0x815847,0xd6ad8e,0x694b3c,0xc7a78c],coats=[0xb96544,0x416967,0x697893,0xbe9d66,0x6c536b,0x8c9a76];
  const sites:[number,number][]=[[-876,-1],[-575,1],[-550,-1],[-466,1],[-426,-1],[-355,1],[-285,-1],[-234,1],[-168,-1],[-116,1],[-68,-1],[-32,1],[44,1],[95,-1],[146,1],[217,-1],[265,1],[318,-1],[349,1],[389,-1],[441,1],[477,-1]];
  for(const [i,[target,side]] of sites.entries()){
   let route:Point[]|undefined;
   // Do not walk through a pole or use a nominal straight line across a yard.
   for(const offset of [7.35,8.1,6.8,8.65]){
    const path=Array.from({length:41},(_,k)=>{const x=target-9+k*.45;return[x,queenZ(x)+side*offset] as Point;});
    if(path.every(p=>this.walkable(p))){route=path;break;}
   }
   if(!route)continue;
   const x=route[0][0]+(i%5)*3.5,offset=(route[0][1]-queenZ(route[0][0])),z=queenZ(x)+offset;
   const g=new T.Group(),limbs:T.Group[]=[];parent.add(g);g.position.set(x,0,z);
   const scale=.92+(i%4)*.055,skinColor=skin[i%skin.length],coat=coats[i%coats.length],trousers=[0x373e49,0x525452,0x49423f][i%3];
   box(g,0,1.12,0,.43,.65,.28,coat,.10);box(g,0,.81,0,.31,.15,.23,trousers,.05);
   orb(g,0,1.48,0,.071,.09,.078,skinColor);orb(g,0,1.65,.015,.12,.155,.12,skinColor);
   orb(g,0,1.75,0,.124,.08,.125,[0x352e2c,0x645045,0xb49b74,0x424141][i%4]);
   orb(g,0,1.64,.132,.027,.027,.04,skinColor);
   for(const side of [-1,1])orb(g,side*.047,1.69,.116,.012,.011,.008,0x303536);
   box(g,0,1.40,.02,.35,.085,.28,[0xd7b965,0x655669,0xb15e4a][i%3],.035);
   if(i%3===0){box(g,0,1.70,-.095,.21,.22,.11,0x4c3c35,.055);box(g,0,1.78,0,.27,.04,.25,0x4c3c35,.03);}
   if(i%2===0){box(g,-.28,.78,0,.20,.37,.13,0x987553,.055);rod(g,new T.Vector3(-.21,1.45,0),new T.Vector3(-.29,.9,0),.018,0x584e3f);}
   mergeStatic(g);
   for(const [j,xx] of [-.095,.095,-.235,.235].entries()){
    const limb=new T.Group(),leg=j<2,len=leg?.74:.54;limb.position.set(xx,leg?.84:1.37,0);
    box(limb,0,-len/2,0,leg?.14:.12,len,leg?.17:.14,leg?trousers:coat,.04);
    if(leg)box(limb,0,-len,.065,.16,.11,.29,0x343737,.035);else orb(limb,0,-len-.035,0,.052,.075,.055,skinColor);
    mergeStatic(limb);g.add(limb);limbs.push(limb);
   }
   g.scale.setScalar(scale);
   const bound:Obstacle={x,z,w:.46,d:.46,h:1.85*scale,tag:'walking neighbour'};
   this.walkers.push({group:g,limbs,x,z,start:route[0][0],end:route.at(-1)![0],direction:i%2?1:-1,speed:.78+(i%4)*.1,offset,phase:i*.83,wait:0,side,bound});this.bounds.push(bound);
  }
 }
 private walkable(p:Point){return !blocked(p[0],p[1],.31,this.staticBounds)&&this.sidewalk.some(s=>inside(p,s.p)&&!s.holes?.some(h=>inside(p,h)));}
 update(dt:number,time:number,reduced:boolean,occupiers:Point[],tram:Obstacle){
  const robotBounds=occupiers.map(([x,z])=>({x,z,w:1.0,d:1.0,h:1,tag:'courier'}));
  for(const car of this.cars){
   const target=drivingSpeed(car.bound.x,car.bound.z,car.direction,car.cruise,[...robotBounds,tram,...this.cars.filter(c=>c!==car).map(c=>c.bound)]);
   // Braking responds immediately; acceleration eases back into the lane.
   car.speed=target<car.speed?target:Math.min(target,car.speed+1.5*dt);
   let x=car.bound.x+car.direction*car.speed*dt;
   if(x>840||x< -918){const entrance=car.direction>0?-916:838;const entranceZ=queenZ(entrance)+car.direction*1.65;const hidden=occupiers.every(p=>Math.abs(entrance-p[0])>250&&Math.abs(x-p[0])>250);const empty=this.cars.every(c=>c===car||Math.abs(c.bound.x-entrance)>12||Math.abs(c.bound.z-entranceZ)>2.8);if(hidden&&empty)x=entrance;}
   if(x>845||x< -923){x=car.bound.x;car.speed=0;}
   const z=queenZ(x)+car.direction*1.65;car.bound.x=x;car.bound.z=z;car.group.position.set(x,.025+groundHeight(x,z),z);
   car.group.rotation.y=(car.direction<0?Math.PI:0)-Math.atan2(queenZ(x+.5)-queenZ(x-.5),1);
   car.group.visible=Math.hypot(x-occupiers[0][0],z-occupiers[0][1])<230;
  }
  for(const p of this.walkers){
   p.group.visible=Math.hypot(p.x-occupiers[0][0],p.z-occupiers[0][1])<145;
   const near=personNear([p.x,p.z],occupiers,3.1),targetZ=queenZ(p.x)+p.offset;
   let nextX=p.x,nextZ=targetZ;
   if(near){
    // Step towards the building side only when the mapped pavement is clear.
    for(const offset of [1.5,1.25,1.05,.8,-1.1,-.85]){const aside:Point=[p.x,targetZ+p.side*offset];const clear=Array.from({length:6},(_,i)=>[p.x,p.z+(aside[1]-p.z)*i/5] as Point).every(q=>this.walkable(q));if(clear&&!personNear(aside,occupiers,.90)){nextZ=aside[1];break;}}
   }else if(!reduced){
    p.wait=Math.max(0,p.wait-dt);if(!p.wait)nextX+=p.direction*p.speed*dt;
    if((p.direction<0&&nextX<p.start)||(p.direction>0&&nextX>p.end)){nextX=Math.max(p.start,Math.min(p.end,nextX));p.direction*=-1;p.wait=1.1;}
   }
   if(this.walkers.some(q=>q!==p&&Math.hypot(nextX-q.x,nextZ-q.z)<.66)){nextX=p.x;nextZ=p.z;}
   const before=p.x,proposed:Point=[nextX,T.MathUtils.damp(p.z,nextZ,5,dt)];
   // Test the complete sidestep, not just its endpoint. A neighbour must not
   // cross through Pip or the trailing cart while finding a clear place.
   if(safePedestrianStep([p.x,p.z],proposed,occupiers)){p.x=proposed[0];p.z=proposed[1];}
   p.group.position.set(p.x,groundHeight(p.x,p.z),p.z);p.bound.x=p.x;p.bound.z=p.z;
   const walking=Math.abs(p.x-before)>0.0001,heading=near?Math.atan2(occupiers[0][0]-p.x,occupiers[0][1]-p.z):p.direction*Math.PI/2;
   p.group.rotation.y=approachAngle(p.group.rotation.y,heading,5,dt);
   for(const [j,limb] of p.limbs.entries())limb.rotation.x=T.MathUtils.damp(limb.rotation.x,walking?Math.sin(time*6.2*p.speed+p.phase+(j%2?Math.PI:0))*(j<2?.38:.25):0,12,dt);
  }
 }
 diagnostics(){return{cars:this.cars.length,walkers:this.walkers.length,visibleCars:this.cars.filter(c=>c.group.visible).length,visibleWalkers:this.walkers.filter(p=>p.group.visible).length,carPositions:this.cars.map(c=>({x:c.bound.x,z:c.bound.z,speed:c.speed})),walkingPositions:this.walkers.map(p=>({x:p.x,z:p.z,start:p.start,end:p.end,direction:p.direction}))};}
}
