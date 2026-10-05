import * as T from 'three';

// Ray-box interiors keep a shallow room behind the existing window opening.
// These are supporting room suggestions, not claims about private interiors.
// The shader runs after static batching, so view-dependent depth survives
// merged and rotated facades without extra geometry, textures or draw calls.
export function installWindowDepth(material:T.MeshStandardMaterial,columns:number){
 const prior=material.onBeforeCompile;
 material.onBeforeCompile=(shader,renderer)=>{
  prior.call(material,shader,renderer);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   vec3 roomColour=vec3(0.);
   float roomFacing=1.;
   #ifdef USE_MAP
    vec2 roomUV=vec2(fract(vMapUv.x*${columns.toFixed(1)}),vMapUv.y);
    float roomIndex=floor(min(vMapUv.x,.99999)*${columns.toFixed(1)});
    vec3 q0=dFdx(-vViewPosition),q1=dFdy(-vViewPosition);
    vec2 st0=dFdx(vMapUv),st1=dFdy(vMapUv);
    float handed=sign(st0.x*st1.y-st0.y*st1.x);
    vec3 tangent=normalize((q0*st1.y-q1*st0.y)*handed);
    vec3 up=normalize((q1*st0.x-q0*st1.x)*handed);
    vec3 view=normalize(vViewPosition);
    roomFacing=clamp(abs(dot(view,normalize(vNormal))),.08,1.);
    vec3 ray=vec3(-dot(view,tangent),-dot(view,up),-roomFacing);
    vec3 front=vec3(roomUV*2.-1.,0.);
    float depth=${columns>1?'mix(.30,.82,1.-step(.25,abs(roomIndex-3.)))':'.38'};
    float tx=abs(ray.x)>.001?(sign(ray.x)-front.x)/ray.x:10000.;
    float ty=abs(ray.y)>.001?(sign(ray.y)-front.y)/ray.y:10000.;
    float tz=-depth/ray.z;
    float travel=min(tz,min(tx,ty));
    vec3 hit=front+ray*travel;
    vec2 back=clamp(hit.xy*.5+.5,vec2(.008),vec2(.992));
    vec4 sampledDiffuseColor=texture2D(map,vec2((roomIndex+back.x)/${columns.toFixed(1)},back.y));
    // Ceiling, floor and side reveals establish a room rather than sliding
    // the whole facade texture as the player passes the shop.
    if(travel<tz-.002){
     vec3 wall=mix(vec3(.075,.047,.032),vec3(.37,.25,.15),smoothstep(-1.,1.,hit.y));
     if(ty<tx)wall=hit.y>0.?vec3(.27,.21,.16):vec3(.10,.065,.041);
     sampledDiffuseColor.rgb=mix(wall,sampledDiffuseColor.rgb,.20);
    }
    roomColour=sampledDiffuseColor.rgb;
    diffuseColor*=sampledDiffuseColor;
   #endif
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   #ifdef USE_MAP
    // Keep directional environment reflections instead of replacing almost
    // all physical shading with a uniformly glowing room texture.
    float paneReflection=.24+.72*pow(1.-roomFacing,4.);
    vec3 reflectedGlass=reflectedLight.directSpecular+reflectedLight.indirectSpecular;
    outgoingLight=roomColour*.78*(1.-paneReflection)+reflectedGlass*1.3;
   #endif
   #include <opaque_fragment>
  `);
 };
 material.customProgramCacheKey=()=>`queen-window-depth-${columns}-v2`;
}
