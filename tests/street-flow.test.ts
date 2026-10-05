import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drivingSpeed,personNear,safePedestrianStep} from '../src/street-flow';
const car=(x:number,z=0)=>({x,z,w:4.48,d:2.08,h:1.65});
test('traffic brakes for a leader in either direction and keeps a physical gap',()=>{
 assert.equal(drivingSpeed(0,0,1,5.5,[car(6)]),0);
 assert.equal(drivingSpeed(0,0,-1,5.5,[car(-6)]),0);
 assert(drivingSpeed(0,0,1,5.5,[car(10)])<5.5);
 assert.equal(drivingSpeed(0,0,1,5.5,[car(-10)]),5.5);
 assert.equal(drivingSpeed(0,0,1,5.5,[car(10,3.3)]),5.5);
});
test('traffic yields before reaching the courier and a long streetcar',()=>{
 assert.equal(drivingSpeed(0,0,1,5.5,[{x:5,z:0,w:1,d:1,h:1}]),0);
 assert.equal(drivingSpeed(0,0,1,5.5,[{x:19,z:0,w:30.2,d:2.54,h:3.3}]),0);
 let x=0;
 for(let frame=0;frame<1800;frame++)x+=drivingSpeed(x,0,1,5.5,[car(30)])/90;
 assert(30-x-4.48>=2.59,'stopped vehicles retain a safe gap');
});
test('pedestrian proximity includes the trailing cart, not only Pip',()=>{
 assert(personNear([3,2],[[7,2],[3,3]],1.5));
 assert(!personNear([3,2],[[7,2],[8,3]],1.5));
});

test('a pedestrian may step away from a close cart but never through it',()=>{
 assert(safePedestrianStep([0,.74],[0,.76],[[0,0]]));
 assert(!safePedestrianStep([0,.74],[0,.72],[[0,0]]));
 assert(!safePedestrianStep([0,1],[0,-1],[[0,0]]));
 assert(safePedestrianStep([0,1],[1,1],[[0,0]]));
});
