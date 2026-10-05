import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import roofs from './data/distant-city.json';
// Actual City roof outlines form distant context west of River. No invented
// street-level windows are added to these unresolved background buildings.
export function buildDistantCity(){
 const parts:T.BufferGeometry[]=[];
 for(const r of roofs){
  const shape=new T.Shape(r.p.map(p=>new T.Vector2(p[0],-p[1])));for(const hole of r.holes)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p[0],-p[1]))));
  const indexed=new T.ExtrudeGeometry(shape,{depth:r.h,bevelEnabled:false,curveSegments:1});indexed.rotateX(-Math.PI/2);const g=indexed.index?indexed.toNonIndexed():indexed;if(g!==indexed)indexed.dispose();
  const position=g.getAttribute('position'),normal=g.getAttribute('normal'),colors=new Float32Array(position.count*3),base=new T.Color(0x78858c),haze=new T.Color(0xc0b8b3);
  for(let k=0;k<position.count;k++){const d=Math.hypot(position.getX(k)+800,position.getZ(k)),colour=base.clone().lerp(haze,Math.min(.83,Math.max(.12,d/4800)));const facing=normal.getX(k)*-.68+normal.getY(k)*.2+normal.getZ(k)*.66;colour.multiplyScalar(.86+Math.max(0,facing)*.18);colors.set([colour.r,colour.g,colour.b],k*3);}
  g.setAttribute('color',new T.BufferAttribute(colors,3));parts.push(g);
 }
 const geometry=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,fog:false}));mesh.name='City roof outlines · distant western background';return mesh;
}
