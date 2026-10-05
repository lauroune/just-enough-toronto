import {test} from 'node:test';import assert from 'node:assert/strict';
import {groundHeight,groundGradient,TERRAIN} from '../src/terrain';
import {initPhysics,StreetPhysics} from '../src/physics';
test('terrain is sourced, finite, continuous and rises north on De Grassi',()=>{
 assert.equal(TERRAIN.meta.contours,1591);assert.equal(TERRAIN.heights.length,TERRAIN.cols*TERRAIN.rows);
 assert(Math.abs(groundHeight(0,0))<.01);assert(groundHeight(20,-500)-groundHeight(20,-80)>3);
 for(let x=-900;x<530;x+=15)for(let z=-780;z<140;z+=30){assert(Number.isFinite(groundHeight(x,z)));assert(Math.abs(groundHeight(x+.001,z)-groundHeight(x-.001,z))<.02);}
});
test('the bridge deck does not follow ground contours into the Don',()=>{
 const a=groundHeight(-816,0),b=groundHeight(-583,0),middle=groundHeight(-700,0);assert(middle>=Math.min(a,b)-.02&&middle<=Math.max(a,b)+.02);
 for(const x of [-817,-582])assert(Math.abs(groundHeight(x+.001,0)-groundHeight(x-.001,0))<.01);
});
test('Queen stays below the rail embankment with a continuous road approach',()=>{
 for(let x=-30;x<115;x+=.1){assert(Math.abs(groundHeight(x+.01,1)-groundHeight(x,1))<.01);}
 for(let x=-10;x<=90;x+=5){assert(Math.abs(groundHeight(x,-7)-groundHeight(x,8))<.01);assert(groundHeight(x,1)<.10);}
});
test('terrain sampling stays safe beyond the modeled area',()=>{
 assert.equal(groundHeight(20000,0),0);assert.equal(groundHeight(NaN,0),0);assert(Number.isFinite(groundGradient(20,-80).z));
});
await initPhysics();
test('courier follows a raised northbound grade without a false floor collision',()=>{
 const physics=new StreetPhysics([],[],[]);physics.setDay(0);let p:[number,number]=[22,-80];physics.reset(p,[21,-80]);
 for(let i=0;i<1800;i++){p=physics.move(p,[0,-3.4/90]);physics.sync(p,[p[0]-.94,p[1]],Math.PI,[-600,1.55]);}
 assert(p[1]<-146,`stopped at ${p}`);physics.dispose();
});

test('station plaza triangles stay close to the actor ground instead of cutting across the contour field',async()=>{
 const T=await import('three'),{groundBox}=await import('../src/world'),{drapeStatic}=await import('../src/terrain-geometry');
 const group=new T.Group();group.position.set(-12,0,34);const slab=groundBox(group,0,.035,0,25,.05,45,0xbfb9aa);drapeStatic(group,new Set());group.updateMatrixWorld(true);
 const ray=new T.Raycaster();let worst=0;
 for(let x=-23;x<=-1;x+=2)for(let z=13;z<56;z+=2){ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));const hit=ray.intersectObject(slab)[0];assert(hit,`missing plaza at ${x},${z}`);worst=Math.max(worst,Math.abs(hit.point.y-(groundHeight(x,z)+.06)));}
 assert(worst<.08,`plaza differs from actor ground by ${worst}m`);
 slab.geometry.dispose();
});

test('scattered leaves follow their own ground height and slope inside a transformed parent',async()=>{
 const T=await import('three'),{drapeStatic}=await import('../src/terrain-geometry');
 const root=new T.Group();root.position.set(12,0,-60);root.rotation.y=.2;
 const geometry=new T.PlaneGeometry(.12,.12);geometry.rotateX(-Math.PI/2);
 const material=new T.MeshBasicMaterial(),leaves=new T.InstancedMesh(geometry,material,3),matrix=new T.Matrix4(),before:import('three').Vector3[]=[];
 root.add(leaves);root.updateMatrixWorld(true);
 for(const [i,z] of [-20,-220,-440].entries()){matrix.makeTranslation(8,.08,z);leaves.setMatrixAt(i,matrix);before.push(new T.Vector3(8,.08,z).applyMatrix4(root.matrixWorld));}
 const original=Array.from(geometry.getAttribute('position').array);
 drapeStatic(root,new Set());
 assert.equal(leaves.geometry,geometry);assert.deepEqual(Array.from(geometry.getAttribute('position').array),original);
 for(let i=0;i<leaves.count;i++){
  leaves.getMatrixAt(i,matrix);const world=root.matrixWorld.clone().multiply(matrix),center=new T.Vector3().setFromMatrixPosition(world),source=before[i];
  assert(Math.abs(center.y-(source.y+groundHeight(source.x,source.z)))<.001);
  const positions=geometry.getAttribute('position');for(let j=0;j<positions.count;j++){const p=new T.Vector3().fromBufferAttribute(positions,j).applyMatrix4(world);assert(Math.abs(p.y-(.08+groundHeight(p.x,p.z)))<.002);}
  assert(leaves.boundingBox!.containsPoint(new T.Vector3().setFromMatrixPosition(matrix)));
 }
 geometry.dispose();material.dispose();
});
