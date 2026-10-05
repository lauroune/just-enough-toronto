import * as T from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {focusSettings,lensRadius} from './focus';

const vertexShader=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const depthFunctions=`
 #include <packing>
 uniform sampler2D depth;
 uniform float near,far,focus,sharpRange,strength;
 float distanceAt(vec2 p){return -perspectiveDepthToViewZ(texture2D(depth,p).x,near,far);}
 float coc(float d){return clamp(max(0.,abs(d-focus)-sharpRange)/max(d,1.)*.8,0.,1.)*strength;}
`;

// Reuse beauty depth, including cutout leaves. Smooth HDR colour before the
// disk gather to avoid sparse pinpricks/rings when using a wider aperture.
// Only the out-of-focus image is downsampled; Pip and the HUD stay full size.
export class DepthOfField {
 private filtered=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false,minFilter:T.LinearMipmapLinearFilter,generateMipmaps:true});
 private blurred=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false});
 private output=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false});
 private prefilter=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{color:{value:null},pixel:{value:new T.Vector2()}},vertexShader,
  fragmentShader:`varying vec2 vUv;uniform sampler2D color;uniform vec2 pixel;
  void main(){vec2 p=pixel*.5;gl_FragColor=.25*(texture2D(color,vUv+vec2(p.x,p.y))+texture2D(color,vUv+vec2(-p.x,p.y))+texture2D(color,vUv+vec2(p.x,-p.y))+texture2D(color,vUv-p));}`});
 private material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{
  color:{value:null},depth:{value:null},pixel:{value:new T.Vector2(1,1)},
  near:{value:.1},far:{value:2000},focus:{value:4},sharpRange:{value:1.15},radius:{value:30},strength:{value:1}
 },vertexShader,fragmentShader:`
  varying vec2 vUv;uniform sampler2D color;uniform vec2 pixel;uniform float radius;
  ${depthFunctions}
  void main(){
   float d=distanceAt(vUv),blur=coc(d);
   if(blur<.025){gl_FragColor=texture2D(color,vUv);return;}
   // Match the sample footprint to the spacing of the aperture samples.
   // Filter in linear HDR so bright windows become soft round highlights.
   float lod=max(0.,log2(max(1.,radius*blur*.07)));
   vec3 sum=vec3(0.);float weights=0.;
   for(int i=0;i<64;i++){
    float fi=float(i)+.5,a=fi*2.39996323;
    vec2 uv=clamp(vUv+vec2(cos(a),sin(a))*sqrt(fi/64.)*radius*blur*pixel,pixel*.5,1.-pixel*.5);
    float sd=distanceAt(uv),sampleBlur=coc(sd);
    // A sharp nearer robot/wall cannot bleed into the blurred background.
    float front=1.-smoothstep(.12,.7,d-sd);
    float weight=mix(front,1.,smoothstep(.12,.65,sampleBlur));
    sum+=texture2DLodEXT(color,uv,lod).rgb*weight;weights+=weight;
   }
   gl_FragColor=vec4(weights>.001?sum/weights:texture2D(color,vUv).rgb,1.);
  }`});
 private composite=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{color:{value:null},blurred:{value:null},depth:{value:null},near:{value:.1},far:{value:2000},focus:{value:4},sharpRange:{value:1.15},strength:{value:1}},vertexShader,
 fragmentShader:`
 varying vec2 vUv;uniform sampler2D color,blurred;
 ${depthFunctions}
 void main(){
  float blur=coc(distanceAt(vUv));
  gl_FragColor=vec4(mix(texture2D(color,vUv).rgb,texture2D(blurred,vUv).rgb,smoothstep(.05,.35,blur)),1.);
 }`});
 private prefilterQuad=new FullScreenQuad(this.prefilter);
 private quad=new FullScreenQuad(this.material);
 private compositeQuad=new FullScreenQuad(this.composite);
 private state={distance:4,sharpRange:1.15,strength:1};
 private radiusCssPixels=8;
 resize(w:number,h:number,pixelRatio=1){
  this.output.setSize(w,h);this.filtered.setSize(Math.ceil(w/2),Math.ceil(h/2));this.blurred.setSize(Math.ceil(w/4),Math.ceil(h/4));
  this.material.uniforms.pixel.value.set(1/w,1/h);this.prefilter.uniforms.pixel.value.set(1/w,1/h);
  const radius=lensRadius(h/pixelRatio,pixelRatio);this.radiusCssPixels=radius.cssPixels;this.material.uniforms.radius.value=radius.renderPixels;
 }
 render(renderer:T.WebGLRenderer,input:T.WebGLRenderTarget,camera:T.PerspectiveCamera,subject:T.Vector3,overview:boolean){
  this.state=focusSettings(camera,subject,overview);
  // The map remains legible, without paying for an unused blur pass.
  if(overview)return input;
  this.prefilter.uniforms.color.value=input.texture;renderer.setRenderTarget(this.filtered);this.prefilterQuad.render(renderer);
  const u=this.material.uniforms;
  u.color.value=this.filtered.texture;u.depth.value=input.depthTexture;u.near.value=camera.near;u.far.value=camera.far;
  u.focus.value=this.state.distance;u.sharpRange.value=this.state.sharpRange;u.strength.value=this.state.strength;
  renderer.setRenderTarget(this.blurred);this.quad.render(renderer);
  const c=this.composite.uniforms;for(const key of ['depth','near','far','focus','sharpRange','strength'])c[key].value=u[key].value;
  c.color.value=input.texture;c.blurred.value=this.blurred.texture;
  renderer.setRenderTarget(this.output);this.compositeQuad.render(renderer);return this.output;
 }
 diagnostics(){return {...this.state,maxRadiusPixels:this.material.uniforms.radius.value,maxRadiusCssPixels:this.radiusCssPixels,depthSource:'beauty depth texture',samples:64,gatherScale:.25};}
 dispose(){this.filtered.dispose();this.prefilter.dispose();this.prefilterQuad.dispose();this.blurred.dispose();this.composite.dispose();this.compositeQuad.dispose();this.output.dispose();this.material.dispose();this.quad.dispose();}
}
