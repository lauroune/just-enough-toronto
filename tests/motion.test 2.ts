import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blocked,moveWithCollision,BOUNDS,pathAt,worldPoint,approachAngle,angleDelta,smoothRoute,followCart,rigRoute} from '../src/motion';
import type {Point} from '../src/game';
const wall={x:0,z:0,w:.2,d:10,h:6};
test('fast movement cannot tunnel through a thin wall',()=>{const p=moveWithCollision([-5,0],[12,0],.68,[wall]);assert(p[0]<-.77);assert(!blocked(...p,.68,[wall]));});
test('diagonal contact slides along a wall without penetrating it',()=>{const p=moveWithCollision([-2,-3],[3,4],.68,[wall]);assert(p[0]<-.77);assert(p[1]>.9);});
test('world bounds contain large movement at every corner',()=>{for(const [dx,dz] of [[100,100],[-100,100],[100,-100],[-100,-100]]){const [x,z]=moveWithCollision([0,0],[dx,dz],.68,[]);assert(x>=BOUNDS.left+.68&&x<=BOUNDS.right-.68);assert(z>=BOUNDS.top+.68&&z<=BOUNDS.bottom-.68);}});
test('Pip fits the scaled gate but the cart cannot pass',()=>{const posts=[{x:-.43,z:0,w:.16,d:.16,h:1.3},{x:.43,z:0,w:.16,d:.16,h:1.3}];assert(moveWithCollision([0,-2],[0,4],.225,posts)[1]>1.9);assert(moveWithCollision([0,-2],[0,4],.48,posts)[1]<0);});
test('path interpolation reaches exact endpoints without overshoot',()=>{const points:Point[]=[[0,0],[5,0],[5,5]];assert.deepEqual(pathAt(points,0),{x:0,z:0,heading:Math.PI/2});assert.deepEqual(pathAt(points,7),{x:5,z:2,heading:0});assert.deepEqual(pathAt(points,100),{x:5,z:5,heading:0});assert.deepEqual(pathAt([[2,3]],0),{x:2,z:3,heading:Math.PI/2});});
test('camera heading wraps through the short turn',()=>{assert(Math.abs(angleDelta(Math.PI-.1,-Math.PI+.1)-.2)<1e-8);assert(Math.abs(approachAngle(Math.PI-.1,-Math.PI+.1,10,.1)-Math.PI)<.1);});
test('route smoothing removes lane retracing without moving the destination',()=>{const p:Point[]=[[-19,-18],[20,-18],[20,3],[20,-12],[27,-12]];assert.deepEqual(smoothRoute(p),[[-19,-18],[20,-18],[20,-12],[27,-12]]);assert.deepEqual(smoothRoute([[2,3]]),[[2,3]]);});
test('trailer follows at its tow distance, including turns and zero movement',()=>{for(const p of [[0,0],[2,0],[2,2],[1,3]] as Point[]){const cart=followCart(p,[-2.4,0]);assert(Math.abs(Math.hypot(p[0]-cart[0],p[1]-cart[1])-.94)<1e-8);}assert.deepEqual(followCart([0,0],[0,0]),[0,0]);});
test('world mapping preserves metre distances without selective compression',()=>{assert.deepEqual(worldPoint([-870.5,62.3]),[-870.5,62.3]);assert.deepEqual(worldPoint([504.9,0]),[504.9,0]);});

test('mapped delivery polylines retain every turn and stop position for the trailer',()=>{
  const points:Point[]=[[-14,-6.25],[79.824,-7],[91.533,-19.88],[91.325,-42.785],[94.969,-47.856]];
  assert.deepEqual(rigRoute(points,true,[94.969,-47.856]),points);
});
test('rig staging preserves a blocked stop and a single-point no-route result',()=>{
  const stop:Point[]=[[-25.6,-1.16],[-19.2,3],[-19.2,-17.8],[-2.72,-17.8]];
  assert.deepEqual(rigRoute(stop,true,[26.88,-12.04]).at(-1),stop.at(-1));
  assert.deepEqual(rigRoute([[2,3]],true,[26.88,-12.04]),[[2,3]]);
  assert.deepEqual(rigRoute(stop,false,[26.88,-12.04]),stop);
});
