import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeStatic} from './world';

export type PipModel={group:T.Group;body:T.Group;wheels:T.Group[];eyes:T.Mesh[];antenna:T.Group;parcel:T.Group;eyeMaterial:T.MeshStandardMaterial;flag:T.Mesh;stats:{meshes:number;triangles:number;geometries:number;materials:number;textures:number;labelResolution:number[]}};

// Author the hero separately from the streets. Scene motion still owns the
// four wheel pivots, body suspension, blinking, parcel and antenna animation.
export function makePip():PipModel{
 const group=new T.Group(),body=new T.Group(),wheels:T.Group[]=[],eyes:T.Mesh[]=[];
 group.name='Pip · Queen East courier';body.name='Suspended enamel body';group.add(body);
 const enamel=new T.MeshPhysicalMaterial({color:0xffeed1,roughness:.29,metalness:.08,clearcoat:.48,clearcoatRoughness:.27});
 const coral=new T.MeshPhysicalMaterial({color:0xcb5147,roughness:.33,metalness:.06,clearcoat:.35,clearcoatRoughness:.3});
 const rubber=new T.MeshStandardMaterial({color:0x26373a,roughness:.84});
 const gasket=new T.MeshStandardMaterial({color:0x637477,roughness:.72});
 const nickel=new T.MeshStandardMaterial({color:0xa4b5b2,roughness:.30,metalness:.72});
 const inset=new T.MeshStandardMaterial({color:0xd8c9b2,roughness:.48,metalness:.10});
 const screen=new T.MeshPhysicalMaterial({color:0x103e48,roughness:.18,metalness:.18,clearcoat:.8,clearcoatRoughness:.17});
 const paper=new T.MeshStandardMaterial({color:0xd9ad77,roughness:.92});
 const paperEdge=new T.MeshStandardMaterial({color:0xf3d2a0,roughness:.82});
 const ribbon=new T.MeshStandardMaterial({color:0xc65c50,roughness:.78});
 const redLight=new T.MeshStandardMaterial({color:0xe05a45,roughness:.25,emissive:0xb33322,emissiveIntensity:.3});
 const eyeMaterial=new T.MeshStandardMaterial({color:0xf6e3a3,emissive:0xe2d58e,emissiveIntensity:.35,roughness:.4});
 const boxGeo=new T.BoxGeometry(1,1,1),ballGeo=new T.SphereGeometry(1,24,16);
 const rounded=new Map<string,T.BufferGeometry>();
 function add(parent:T.Object3D,geo:T.BufferGeometry,mat:T.Material,name:string,x:number,y:number,z:number){
  const m=new T.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 }
 function block(parent:T.Object3D,name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,r=0,segments=2){
  const key=[w,h,d,r,segments].join('/');if(r&&!rounded.has(key))rounded.set(key,new RoundedBoxGeometry(w,h,d,segments,Math.min(r,w/2,h/2,d/2)));
  const m=add(parent,r?rounded.get(key)!:boxGeo,mat,name,x,y,z);if(!r)m.scale.set(w,h,d);return m;
 }
 function ball(parent:T.Object3D,name:string,x:number,y:number,z:number,rx:number,ry:number,rz:number,mat:T.Material){const m=add(parent,ballGeo,mat,name,x,y,z);m.scale.set(rx,ry,rz);return m;}
 function tube(parent:T.Object3D,name:string,points:number[][],radius:number,mat:T.Material){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number])));
  return add(parent,new T.TubeGeometry(curve,24,radius,8,false),mat,name,0,0,0);
 }
 function cylinder(parent:T.Object3D,name:string,x:number,y:number,z:number,r:number,length:number,mat:T.Material,axis:'x'|'y'|'z'='z',segments=32){
  const m=add(parent,new T.CylinderGeometry(r,r,length,segments),mat,name,x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return m;
 }
 function screw(parent:T.Object3D,x:number,y:number,z:number,axis:'x'|'z'='z'){
  cylinder(parent,'Recessed fastener',x,y,z,.019,.008,nickel,axis,12);
  const slot=block(parent,'Fastener slot',x,y,z,.021,.004,.009,rubber);if(axis==='x'){slot.rotation.y=Math.PI/2;slot.position.x+=Math.sign(x)*.005;}else slot.position.z+=Math.sign(z)*.005;
 }

 // A continuous, finely bevelled shell and a real recessed seam above the
 // coral skirt. The world-scale footprint remains the existing 45 cm rig.
 block(body,'Enamel shell',0,.88,0,1.16,.84,1.40,enamel,.24,7);
 block(body,'Lower shell gasket',0,.505,0,1.176,.067,1.413,rubber,.028,4);
 block(body,'Coral chassis',0,.43,0,1.20,.19,1.41,coral,.085,5);
 block(body,'Rubber undertray',0,.333,0,1.08,.05,1.29,rubber,.022,3);
 block(body,'Front impact bumper',0,.43,.701,.96,.12,.085,gasket,.04,4);
 block(body,'Rear impact bumper',0,.43,-.701,.96,.12,.085,gasket,.04,4);
 for(const side of [-1,1]){
  block(body,'Side impact rail',side*.593,.43,0,.035,.10,1.02,rubber,.014,3);
  for(const z of [-.44,.44])tube(body,'Suspension control arm',[[side*.39,.44,z-.075],[side*.53,.33,z],[side*.64,.28,z]],.032,nickel);
 }

 // Recessed curved glass face, separate animated eyes and small range sensors.
 block(body,'Visor rubber seal',0,.94,.682,.982,.452,.106,rubber,.17,6);
 block(body,'Optical visor',0,.94,.719,.925,.400,.070,screen,.15,6);
 // Blink animation owns scale.y (0..1), so the base dimensions belong in
 // geometry. Putting the height in mesh.scale makes the first blink stretch it.
 const eyeGeo=new T.SphereGeometry(1,24,20);eyeGeo.scale(.074,.103,.019);
 for(const x of [-.225,.225])eyes.push(add(body,eyeGeo,eyeMaterial,'Animated eye',x,.967,.760));
 tube(body,'Friendly mouth',[[-.105,.798,.753],[0,.776,.759],[.105,.798,.753]],.011,gasket);
 for(const x of [-.46,.46]){
  cylinder(body,'Ultrasonic sensor surround',x,.65,.669,.047,.025,nickel);
  cylinder(body,'Ultrasonic sensor core',x,.65,.686,.026,.012,screen);
 }
 block(body,'Front running light',0,.56,.713,.34,.026,.018,eyeMaterial,.009,3);

 // Side service hatches, recessed louvres and small working hardware.
 for(const side of [-1,1]){
  block(body,'Side hatch gasket',side*.574,.88,-.11,.026,.43,.62,gasket,.012,3);
  block(body,'Side enamel hatch',side*.588,.88,-.11,.016,.398,.58,enamel,.008,3);
  for(let i=0;i<5;i++)block(body,'Recessed ventilation slot',side*.600,.92,-.295+i*.080,.010,.095,.028,rubber,.004,2);
  for(const y of [.735,1.025])for(const z of [-.33,.11])screw(body,side*.600,y,z,'x');
  cylinder(body,'Side proximity lens',side*.591,.70,.36,.040,.022,screen,'x');
  tube(body,'Cargo grab handle',[[side*.40,1.20,-.41],[side*.45,1.30,-.39],[side*.45,1.30,.18],[side*.40,1.20,.21]],.020,nickel);
 }

 // Rear is the most frequently seen surface. Keep the service panel, label,
 // tail lights and the little Canadian sticker legible from this camera.
 block(body,'Rear hatch gasket',0,.88,-.683,.94,.51,.04,gasket,.085,5);
 block(body,'Rear enamel hatch',0,.88,-.706,.902,.475,.023,enamel,.075,5);
 for(const x of [-.378,.378])for(const y of [.721,1.038])screw(body,x,y,-.724);
 for(const x of [-.39,.39]){block(body,'Rear lamp gasket',x,.55,-.704,.15,.061,.020,rubber,.018,3);block(body,'Rear lamp lens',x,.551,-.720,.111,.035,.016,redLight,.013,4);}
 cylinder(body,'Charging socket rim',-.251,.777,-.730,.047,.014,nickel);
 cylinder(body,'Charging socket inset',-.251,.777,-.741,.032,.014,rubber);
 for(const x of [-.264,-.238])cylinder(body,'Charging contact',x,.778,-.751,.004,.004,nickel,'z',8);
 block(body,'Rear battery window',0,.649,-.706,.25,.034,.014,screen,.008,2);
 for(let i=0;i<4;i++)block(body,'Battery segment',-.078+i*.052,.649,-.717,.036,.016,.005,eyeMaterial,.002,1);

 const labelCanvas=document.createElement('canvas');labelCanvas.width=2048;labelCanvas.height=512;
 const c=labelCanvas.getContext('2d')!;c.clearRect(0,0,2048,512);c.fillStyle='#486267';c.textAlign='center';c.textBaseline='middle';
 c.font='600 420px Arial';c.fillText('PIP',1024,186);c.font='500 67px Arial';c.fillText('QUEEN EAST  /  01',1024,439);
 const labelMap=new T.CanvasTexture(labelCanvas);labelMap.colorSpace=T.SRGBColorSpace;labelMap.anisotropy=8;
 const labelMat=new T.MeshStandardMaterial({map:labelMap,transparent:true,alphaTest:.15,roughness:.48,polygonOffset:true,polygonOffsetFactor:-1});
 const label=add(body,new T.PlaneGeometry(.52,.13),labelMat,'High-resolution PIP marking',0,.997,-.724);label.rotation.y=Math.PI;label.castShadow=false;
 const flagMap=new T.TextureLoader().load('/materials/pip/canada-flag.svg');flagMap.colorSpace=T.SRGBColorSpace;flagMap.anisotropy=8;
 const flagMount=block(body,'Canadian flag sticker edge',.171,.811,-.727,.352,.180,.009,paperEdge,.004,2);flagMount.rotation.z=-.04;
 const flag=add(body,new T.PlaneGeometry(.338,.169),new T.MeshStandardMaterial({map:flagMap,roughness:.46,metalness:0,polygonOffset:true,polygonOffsetFactor:-1}),'Canadian flag sticker',.171,.811,-.733);
 flag.rotation.set(0,Math.PI,.04);flag.castShadow=false;

 // Cargo cradle has padded corners, a folded box and a proper curved bow.
 block(body,'Cargo deck seal',0,1.294,-.075,.86,.092,.98,rubber,.041,4);
 block(body,'Cargo tray',0,1.322,-.075,.825,.079,.945,inset,.034,4);
 const parcel=new T.Group();parcel.name='Removable pastry parcel';body.add(parcel);
 block(parcel,'Folded kraft box',0,1.478,-.08,.718,.227,.751,paper,.026,4);
 block(parcel,'Lid lip shadow',0,1.581,-.08,.738,.025,.77,inset,.01,3);
 block(parcel,'Paper lid',0,1.611,-.08,.769,.052,.8,paperEdge,.020,4);
 for(const side of [-1,1])block(parcel,'Folded paper corner',side*.353,1.465,-.05,.008,.17,.014,inset,.003);
 block(parcel,'Ribbon across parcel',0,1.639,-.08,.771,.010,.063,ribbon,.004,2);
 block(parcel,'Ribbon around parcel',0,1.500,-.08,.064,.292,.806,ribbon,.012,3);
 tube(parcel,'Left ribbon loop',[[0,1.654,-.08],[-.14,1.76,-.11],[-.218,1.692,-.055],[0,1.654,-.08]],.017,ribbon);
 tube(parcel,'Right ribbon loop',[[0,1.654,-.08],[.145,1.757,-.11],[.204,1.69,-.055],[0,1.654,-.08]],.017,ribbon);
 block(parcel,'Ribbon knot',0,1.661,-.08,.057,.046,.072,ribbon,.017,4);
 mergeStatic(parcel);

 const antenna=new T.Group();antenna.name='Flexible antenna';antenna.position.set(.435,1.249,-.455);body.add(antenna);
 cylinder(antenna,'Antenna socket',0,.028,0,.063,.066,gasket,'y');
 cylinder(antenna,'Antenna collar',0,.083,0,.033,.063,nickel,'y');
 tube(antenna,'Flexible antenna stem',[[0,.10,0],[.015,.31,-.012],[.04,.56,0]],.014,nickel);
 ball(antenna,'Coral antenna tip',.04,.601,0,.074,.078,.074,coral);
 cylinder(antenna,'Antenna tip band',.04,.573,0,.061,.018,paperEdge,'y');mergeStatic(antenna);

 // Rounded tyre profiles and genuinely separate, rotating tread and hubs.
 const tyreProfile=[[.166,-.095],[.221,-.104],[.254,-.084],[.270,-.043],[.270,.043],[.254,.084],[.221,.104],[.166,.095]].map(p=>new T.Vector2(...p as [number,number]));
 const tyreGeo=new T.LatheGeometry(tyreProfile,48);tyreGeo.rotateZ(Math.PI/2);
 const rimGeo=new T.TorusGeometry(.144,.014,8,40);rimGeo.rotateY(Math.PI/2);
 for(const x of [-.64,.64])for(const z of [-.44,.44]){
  const wheel=new T.Group();wheel.name=`${x<0?'Left':'Right'} ${z>0?'front':'rear'} wheel`;wheel.position.set(x,.28,z);
  add(wheel,tyreGeo,rubber,'Rounded rubber tyre',0,0,0);
  const outer=Math.sign(x);
  cylinder(wheel,'Recessed hub',outer*.109,0,0,.140,.016,nickel,'x',40);
  add(wheel,rimGeo,nickel,'Machined rim',outer*.114,0,0);
  cylinder(wheel,'Cream wheel cap',outer*.121,0,0,.094,.012,enamel,'x',32);
  cylinder(wheel,'Axle cap',outer*.130,0,0,.030,.009,gasket,'x',24);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;cylinder(wheel,'Hub bolt',outer*.125,Math.cos(a)*.116,Math.sin(a)*.116,.010,.009,nickel,'x',6);}
  for(let i=0;i<28;i++){
   const a=i*Math.PI*2/28,m=block(wheel,'Tyre tread',0,Math.cos(a)*.267,Math.sin(a)*.267,.174,.015,.039,gasket,.006,1);m.rotation.x=a;
  }
  mergeStatic(wheel);group.add(wheel);wheels.push(wheel);
 }

 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!;
 const gradient=sc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(22,42,48,.42)');gradient.addColorStop(.48,'rgba(22,42,48,.25)');gradient.addColorStop(1,'rgba(22,42,48,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);
 const contact=add(group,new T.PlaneGeometry(2.2,2.3),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.8}),'Ground contact',0,.015,0);contact.rotation.x=-Math.PI/2;contact.castShadow=false;
 // Keep the flag/markings and expressive pivots independent of rigid batching.
 for(const part of [parcel,antenna,flag,label,...eyes])part.removeFromParent();mergeStatic(body);body.add(parcel,antenna,flag,label,...eyes);
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();let meshes=0,triangles=0;
 group.traverse(o=>{if(!(o instanceof T.Mesh))return;meshes++;geometries.add(o.geometry);triangles+=(o.geometry.index?.count||o.geometry.getAttribute('position').count)/3;for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if('map' in m&&m.map instanceof T.Texture)textures.add(m.map);}});
 return {group,body,wheels,eyes,antenna,parcel,eyeMaterial,flag,stats:{meshes,triangles,geometries:geometries.size,materials:materials.size,textures:textures.size,labelResolution:[2048,512]}};
}
