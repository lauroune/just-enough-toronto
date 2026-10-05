import {test} from 'node:test';import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Matrix4} from 'three';
import {syncContactProjection} from '../src/contact-occlusion';
test('contact shadows match an off-axis beauty lens without inheriting its distant depth range',()=>{
 const beauty=new PerspectiveCamera(46,16/9,.06,10000),contact=new PerspectiveCamera(60,1,.06,90);
 for(const shift of [0,.35,-.22]){
  beauty.zoom=1.1;beauty.updateProjectionMatrix();beauty.projectionMatrix.elements[8]=.08;beauty.projectionMatrix.elements[9]=shift;
  syncContactProjection(beauty,contact);
  for(const p of [new Vector3(3,4,-18),new Vector3(-5,-2,-25)]){
   const a=p.clone().applyMatrix4(beauty.projectionMatrix),b=p.clone().applyMatrix4(contact.projectionMatrix);
   assert(Math.abs(a.x-b.x)<1e-10);assert(Math.abs(a.y-b.y)<1e-10);
  }
  assert.equal(contact.far,90);
  const identity=contact.projectionMatrix.clone().multiply(contact.projectionMatrixInverse),expected=new Matrix4();
  identity.elements.forEach((v,i)=>assert(Math.abs(v-expected.elements[i])<1e-10));
 }
});
