import {drapeGeometry} from './terrain-geometry';
import * as T from 'three';

// City roof outlines beyond the playable corridor close the empty horizon.
// They load after the street and have no invented signs, doors or colliders.
export function buildNeighbourhoodBackdrop(){
 const group=new T.Group();group.name='City roof outlines · surrounding neighbourhood';
 fetch('/materials/neighbourhood-backdrop.bin').then(response=>{if(!response.ok)throw new Error('Backdrop unavailable');return response.arrayBuffer();}).then(buffer=>{
  const header=new Uint32Array(buffer,0,4);if(header[0]!==0x51454247||header[1]!==1)throw new Error('Unsupported backdrop');
  const count=header[2],indices=header[3],offset=(16+count*18+3)&~3,g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,16,count*3),3));
  g.setAttribute('normal',new T.BufferAttribute(new Int8Array(buffer,16+count*12,count*3),3,true));
  g.setAttribute('color',new T.BufferAttribute(new Uint8Array(buffer,16+count*15,count*3),3,true));
  g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,offset,indices),1));drapeGeometry(g);
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.95});
  // A cheap far-distance facade level avoids blank towers beyond the modeled
  // street. Window spacing is explicitly inferred, never a surveyed elevation.
  material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 vBackdropPosition;varying vec3 vBackdropNormal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvBackdropPosition=position;vBackdropNormal=normal;');
   shader.fragmentShader='varying vec3 vBackdropPosition;varying vec3 vBackdropNormal;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    if(abs(vBackdropNormal.y)<.5){
     float horizontal=abs(vBackdropNormal.x)>.6?vBackdropPosition.z:vBackdropPosition.x;
     vec2 bay=vec2(horizontal/2.8,vBackdropPosition.y/3.05),p=fract(bay),aa=fwidth(bay)*.8;
     vec2 edge=smoothstep(vec2(.27,.25)-aa,vec2(.27,.25)+aa,p)*(1.-smoothstep(vec2(.73,.86)-aa,vec2(.73,.86)+aa,p));
     float windowMask=edge.x*edge.y;
     vec3 glazing=mix(vec3(.10,.15,.17),vec3(.24,.31,.32),smoothstep(.3,.9,p.y));
     diffuseColor.rgb=mix(diffuseColor.rgb,glazing,windowMask*.82);
     float sill=smoothstep(.21-aa.y,.21+aa.y,p.y)*(1.-smoothstep(.245-aa.y,.245+aa.y,p.y))*edge.x;
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.43,.41,.36),sill*.55);
    }
   `);
  };
  const mesh=new T.Mesh(g,material);group.add(mesh);
 }).catch(()=>{/* Optional background cannot prevent the delivery game loading. */});
 return group;
}
