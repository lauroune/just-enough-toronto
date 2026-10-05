import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {mergeStatic} from '../src/world';
test('batching keeps receiving-only pavement separate from shadow-casting architecture',()=>{
 const group=new T.Group(),mat=new T.MeshStandardMaterial();
 const road=new T.Mesh(new T.PlaneGeometry(10,10),mat);road.receiveShadow=true;
 const wall=new T.Mesh(new T.BoxGeometry(1,5,1),mat);wall.castShadow=true;wall.receiveShadow=true;
 group.add(road,wall);mergeStatic(group);
 const meshes=group.children as T.Mesh[];assert.equal(meshes.length,2);
 const receiving=meshes.find(m=>!m.castShadow);assert(receiving?.receiveShadow);assert.equal(receiving.geometry.getAttribute('position').count,6);
 assert(meshes.find(m=>m.castShadow)?.receiveShadow);
});
test('batching preserves unlit sign UVs and nested front/back transforms',()=>{
 const group=new T.Group(),mat=new T.MeshBasicMaterial({color:0x7498a3}),parent=new T.Group();parent.position.set(10,2,-3);group.add(parent);
 const front=new T.Mesh(new T.PlaneGeometry(2,1),mat),back=front.clone();back.rotation.y=Math.PI;back.position.z=-.008;front.add(back);parent.add(front);mergeStatic(group);
 const meshes=group.children.filter(c=>c instanceof T.Mesh) as T.Mesh[];assert.equal(meshes.length,1);const mesh=meshes[0];assert(mesh.material instanceof T.MeshBasicMaterial);assert.equal(mesh.geometry.getAttribute('position').count,12);mesh.geometry.computeBoundingBox();assert.equal(mesh.geometry.boundingBox!.min.x,9);assert.equal(mesh.geometry.boundingBox!.max.y,2.5);assert.equal(mesh.geometry.getAttribute('uv').count,12);
});
test('transparent surfaces with different opacity and depth writes never merge',()=>{
 const group=new T.Group();for(const [opacity,depthWrite] of [[.16,false],[.24,false],[.24,true]] as const){group.add(new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshStandardMaterial({transparent:true,opacity,depthWrite})));}mergeStatic(group);
 const meshes=group.children as T.Mesh[];assert.equal(meshes.length,3);assert.deepEqual(meshes.map(m=>[(m.material as T.Material).opacity,(m.material as T.Material).depthWrite]),[[.16,false],[.24,false],[.24,true]]);
});
test('a custom quad without UVs batches with boxes without dropping either surface',()=>{
 const group=new T.Group(),mat=new T.MeshStandardMaterial(),quad=new T.BufferGeometry();quad.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));quad.computeVertexNormals();
 group.add(new T.Mesh(quad,mat),new T.Mesh(new T.BoxGeometry(1,1,1),mat));mergeStatic(group);
 const meshes=group.children as T.Mesh[];assert.equal(meshes.length,1);assert.equal(meshes[0].geometry.getAttribute('position').count,39);assert.equal(meshes[0].geometry.getAttribute('uv').count,39);
});

test('static batching preserves instanced foliage transforms and colours',()=>{
 const group=new T.Group(),material=new T.MeshStandardMaterial(),leaves=new T.InstancedMesh(new T.PlaneGeometry(.2,.2),material,2);
 leaves.setMatrixAt(0,new T.Matrix4().makeTranslation(-30,1,-54));leaves.setMatrixAt(1,new T.Matrix4().makeTranslation(-20,2,-54));
 leaves.setColorAt(0,new T.Color('orange'));leaves.setColorAt(1,new T.Color('red'));group.add(leaves);
 group.add(new T.Mesh(new T.BoxGeometry(1,1,1),material));mergeStatic(group);
 assert.equal(leaves.parent,group);assert.equal(leaves.count,2);const matrix=new T.Matrix4();leaves.getMatrixAt(1,matrix);assert.equal(matrix.elements[12],-20);
 const color=new T.Color();leaves.getColorAt(1,color);assert.equal(color.getHex(),0xff0000);
});
