import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {focusSettings,lensRadius} from '../src/focus';
test('focus tracks the subject along the camera axis through orbit, zoom and terrain height',()=>{
 const subject=new T.Vector3(5,3.2,-7),camera=new T.PerspectiveCamera(52,1.5,.1,2000);
 for(const offset of [new T.Vector3(0,1,4),new T.Vector3(-7,1,0),new T.Vector3(2,3,-9)]){
  camera.position.copy(subject).add(offset);camera.lookAt(subject);const f=focusSettings(camera,subject);
  assert.ok(Math.abs(f.distance-offset.length())<1e-9);assert.ok(f.sharpRange>=1.15);
  // An equally deep point off-centre must stay on the same focus plane.
  const right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  assert.ok(Math.abs(focusSettings(camera,subject.clone().addScaledVector(right,2)).distance-f.distance)<1e-9);
 }
 assert.equal(focusSettings(camera,subject,true).strength,0);
});
test('lens blur stays visible on portrait screens and consistent across render densities',()=>{
 for(const height of [390,844,960,1101,2160]){
  const base=lensRadius(height,1);
  assert.ok(base.cssPixels>=4&&base.cssPixels<=6);
  for(const dpr of [.75,1.25,1.5,2,2.5]){
   const high=lensRadius(height,dpr);
   assert.ok(Math.abs(high.renderPixels/dpr-base.renderPixels)<1e-9);
  }
 }
});
