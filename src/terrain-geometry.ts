import * as T from 'three';
import {groundHeight,groundGradient} from './terrain';
// Apply the same metre field to static meshes and the actors. This preserves
// the mapped horizontal plan. Buildings remain vertical; their base follows
// local grade. Small roof/floor slopes are interpolation, not surveyed levels.
export function drapeGeometry(geometry:T.BufferGeometry,world=new T.Matrix4()){
 const inverse=world.clone().invert(),p=geometry.getAttribute('position'),v=new T.Vector3(),n=new T.Vector3(),normals=geometry.getAttribute('normal'),normalWorld=new T.Matrix3().getNormalMatrix(world),normalLocal=new T.Matrix3().getNormalMatrix(inverse);
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(world);if(normals){const slope=groundGradient(v.x,v.z);n.fromBufferAttribute(normals,i).applyMatrix3(normalWorld);n.x-=slope.x*n.y;n.z-=slope.z*n.y;n.applyMatrix3(normalLocal).normalize();normals.setXYZ(i,n.x,n.y,n.z);}v.y+=groundHeight(v.x,v.z);v.applyMatrix4(inverse);p.setXYZ(i,v.x,v.y,v.z);}
 p.needsUpdate=true;if(normals)normals.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();
}
export function drapeStatic(root:T.Object3D,skip:Set<T.Object3D>){
 root.updateMatrixWorld(true);
 const walk=(o:T.Object3D)=>{
  if(skip.has(o))return;
  if(o instanceof T.InstancedMesh){
   // Each leaf has a different world position. Draping its shared geometry
   // samples only the tile origin and leaves the whole scatter on one level.
   const instance=new T.Matrix4(),world=new T.Matrix4(),warp=new T.Matrix4(),inverse=o.matrixWorld.clone().invert(),origin=new T.Vector3();
   for(let i=0;i<o.count;i++){
    o.getMatrixAt(i,instance);world.multiplyMatrices(o.matrixWorld,instance);origin.setFromMatrixPosition(world);
    const h=groundHeight(origin.x,origin.z),slope=groundGradient(origin.x,origin.z);
    warp.set(1,0,0,0,slope.x,1,slope.z,h-slope.x*origin.x-slope.z*origin.z,0,0,1,0,0,0,0,1);
    instance.copy(inverse).multiply(warp).multiply(world);o.setMatrixAt(i,instance);
   }
   o.instanceMatrix.needsUpdate=true;o.computeBoundingBox();o.computeBoundingSphere();
  }else if(o instanceof T.Mesh){o.geometry=o.geometry.clone();drapeGeometry(o.geometry,o.matrixWorld);}
  for(const child of o.children)walk(child);
 };walk(root);
}
