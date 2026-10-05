import {test} from 'node:test';import assert from 'node:assert/strict';import {initPhysics,StreetPhysics} from '../src/physics';
await initPhysics();
test('Rapier swept controller stops at a thin wall even for a large requested displacement',()=>{const p=new StreetPhysics([{x:2,z:0,w:.1,d:8,h:5}],[],[]);p.setDay(0);p.reset([0,0],[-1,0]);const next=p.move([0,0],[12,0]);assert(next[0]<1.73&&next[0]>1.5,`${next}`);p.dispose();});
test('fixed-step courier reaches the same distance at 30 Hz and 120 Hz presentation rates',()=>{const run=(fps:number)=>{const p=new StreetPhysics([],[],[]);p.setDay(0);let pos:[number,number]=[0,0],acc=0;p.reset(pos,[-1,0]);for(let frame=0;frame<fps*2;frame++){acc+=1/fps;while(acc+1e-9>=1/90){pos=p.move(pos,[1.7/90,0]);p.sync(pos,[pos[0]-.94,0],Math.PI/2,[-600,1.55]);acc-=1/90;}}p.dispose();return pos[0];};assert(Math.abs(run(30)-run(120))<1e-5);assert(Math.abs(run(30)-3.4)<.01);});
test('Rapier concave building walls preserve a courtyard and stop at its actual edge',()=>{const o={x:2.5,z:2.5,w:5,d:5,h:5,p:[[0,0],[5,0],[5,1],[1,1],[1,5],[0,5]] as [number,number][]};const p=new StreetPhysics([o],[],[]);p.setDay(0);p.reset([3,3],[4,3]);const free=p.move([3,3],[0,1]);assert(free[1]>3.9);p.reset([3,3],[4,3]);const wall=p.move([3,3],[-4,0]);assert(wall[0]>1.22&&wall[0]<1.4);p.dispose();});

test('an enclosed courtyard is clear while its interior wall stops the courier',()=>{const o={x:0,z:0,w:12,d:12,h:5,p:[[-6,-6],[6,-6],[6,6],[-6,6]] as [number,number][],holes:[[[-3,-3],[-3,3],[3,3],[3,-3]]] as [number,number][][]};const p=new StreetPhysics([o],[],[]);p.setDay(0);p.reset([0,0],[-1,0]);const next=p.move([0,0],[5,0]);assert(next[0]>2.6&&next[0]<2.8);p.dispose();});
test('moving ambient colliders stop Pip and release the path when they move away',()=>{
 const traffic=[{x:4,z:0,w:4.48,d:2.08,h:1.65}];const p=new StreetPhysics([],[],[],traffic);p.setDay(0);p.reset([0,0],[-1,0]);
 assert(p.move([0,0],[10,0])[0]<1.55);
 traffic[0].z=5;p.sync([0,0],[-1,0],Math.PI/2,[-600,1.55],traffic);
 assert(p.move([0,0],[10,0])[0]>9.9);p.dispose();
});
