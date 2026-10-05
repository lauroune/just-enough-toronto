import * as T from 'three';

// Metric-scale aggregate and wear, shared by all street surfaces. These are
// material details; they do not change surveyed pavement or invent artwork.
export function installStreetSurface(mat:T.MeshStandardMaterial,kind:string){
 const prior=mat.onBeforeCompile;
 mat.onBeforeCompile=(shader,renderer)=>{
  prior.call(mat,shader,renderer);
  shader.vertexShader='varying vec3 vStreetPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvStreetPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
  shader.fragmentShader=`varying vec3 vStreetPosition;
   float streetHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float streetNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(streetHash(i),streetHash(i+vec2(1,0)),f.x),mix(streetHash(i+vec2(0,1)),streetHash(i+vec2(1,1)),f.x),f.y);}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float broad=streetNoise(vStreetPosition.xz*.36);
   float grain=streetNoise(vStreetPosition.xz*48.);
   float grainFade=1.-smoothstep(.45,1.5,max(length(dFdx(vStreetPosition.xz)),length(dFdy(vStreetPosition.xz)))*48.);
   grain=mix(.5,grain,grainFade);
   diffuseColor.rgb*=mix(${kind==='paint'?'.54,1.06':'.77,1.12'},broad)*mix(.88,1.12,grain);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor*mix(.81,1.14,broad)+${kind==='asphalt'?'.10':'.05'}*(grain-.5),${kind==='asphalt'?'.43':'.60'},.97);
  `);
 };
 mat.customProgramCacheKey=()=>`queen-street-${kind}-v1`;
}
