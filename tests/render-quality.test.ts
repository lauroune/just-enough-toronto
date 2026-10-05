import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {renderScale} from '../src/render-quality';
import {makeGoldenSun,followGoldenSun,SUN_DIRECTION} from '../src/golden-hour';
test('high quality preserves Retina detail; large screens obey a pixel budget',()=>{
 assert.equal(renderScale('high',2,1440,960),2);
 assert.equal(renderScale('cinematic',1,1440,960),2);
 for(const q of ['high','balanced','cinematic'] as const){const s=renderScale(q,3,5120,2880);assert.ok(s>0&&s*s*5120*2880<=(q==='balanced'?2800000:q==='high'?6500000:10000000)+.01);}
});
test('the golden-hour shadow camera covers the street and maintains one sun direction',()=>{
 const sun=makeGoldenSun(0xffffff);assert.equal(sun.shadow.camera.projectionMatrix.elements[0],1/90);
 for(const p of [[-918,0,55],[302,0,-5.2],[0,0,-180]]){followGoldenSun(sun,new T.Vector3(...p));assert.ok(sun.position.clone().sub(sun.target.position).normalize().distanceTo(SUN_DIRECTION)<1e-10);}
});
