import * as T from 'three';
import {box,rod,material} from './world';

// Supporting traffic, not replicas of vehicles or number plates in the videos.
// Local bounds are shared with the parked-car collision envelope.
export const PARKED_CAR_SIZE={w:4.48,d:2.08,h:1.65};
export function buildParkedCar(parent:T.Group,x:number,z:number,color:number,reverse:boolean){
 const g=new T.Group();g.position.set(x,.025,z);g.rotation.y=reverse?Math.PI:0;parent.add(g);
 const paint=new T.MeshPhysicalMaterial({color,roughness:.28,metalness:.42,clearcoat:1,clearcoatRoughness:.12}),rubber=material(0x252a2c,.96);
 const glazing=new T.MeshStandardMaterial({color:0x71858c,roughness:.12,metalness:.62,envMapIntensity:1.4,side:T.DoubleSide});
 const chrome=new T.MeshStandardMaterial({color:0x9ea6a6,roughness:.3,metalness:.78});
 // Rounded shoulders and a narrowing roof replace the rectangular extrusion.
 // The visual body stays inside the existing traffic/collision envelope.
 function loft(sections:number[][],cabin=false){
  const positions:number[]=[],indices:number[]=[];
  for(const [x,y,w] of sections){
   const ring=cabin?[[-.82,.92],[-w,y-.06],[-w*.62,y+.018],[0,y+.045],[w*.62,y+.018],[w,y-.06],[.82,.92]]:[[-w*.89,.34],[-w,.47],[-w,.67],[-w*.92,y-.045],[-w*.65,y],[0,y+.025],[w*.65,y],[w*.92,y-.045],[w,.67],[w,.47],[w*.89,.34]];
   for(const [z,yy] of ring)positions.push(x,yy,z);
  }
  const n=cabin?7:11;
  for(let k=0;k<sections.length-1;k++)for(let j=0;j<n-1;j++){const a=k*n+j,b=a+n;indices.push(a,b,a+1,a+1,b,b+1);}
  for(const end of [0,sections.length-1])for(let j=1;j<n-1;j++){const a=end*n;indices.push(a,a+j+(end?1:0),a+j+(end?0:1));}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,paint);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);
 }
 loft([[-2.13,.71,.69],[-2.02,.79,.82],[-1.70,.88,.85],[-1.1,.94,.86],[0,.945,.87],[1.13,.925,.86],[1.75,.83,.84],[2.03,.76,.80],[2.16,.65,.66]]);
 loft([[-1.02,1.0,.78],[-.70,1.40,.67],[-.49,1.485,.64],[.25,1.50,.64],[.61,1.43,.67],[1.20,.98,.78]],true);
 function quad(points:number[][],mat:T.Material){const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geom.setIndex([0,1,2,0,2,3]);geom.computeVertexNormals();const mesh=new T.Mesh(geom,mat);g.add(mesh);return mesh;}
 // The windscreen and rear glass follow the sloping body, rather than leaving
 // an opaque painted wedge between two side-window stickers.
 quad([[1.235,.972,-.70],[1.235,.972,.70],[.53,1.485,.70],[.53,1.485,-.70]],glazing);
 quad([[-1.015,.987,.70],[-1.015,.987,-.70],[-.61,1.454,-.70],[-.61,1.454,.70]],glazing);
 for(const side of [-1,1]){
  const zz=side*.898;
  quad([[-.89,.97,side*.836],[-.57,1.40,side*.682],[.37,1.43,side*.682],[.37,.97,side*.836]],glazing);
  quad([[.435,.97,side*.836],[.435,1.43,side*.682],[.81,1.23,side*.754],[1.075,.97,side*.836]],glazing);
  const sill=box(g,.10,.936,zz,2.04,.025,.035,0x8f9898);sill.material=chrome;
  const pillar=box(g,.405,1.19,side*.761,.061,.48,.025,0x282f32);pillar.rotation.x=side*-.33;
  for(const xx of [-1.32,1.36]){
   const tyre=new T.Mesh(new T.CylinderGeometry(.31,.31,.19,24),rubber);tyre.rotation.x=Math.PI/2;tyre.position.set(xx,.32,side*.84);tyre.castShadow=true;g.add(tyre);
   const well=new T.Mesh(new T.CircleGeometry(.32,24),rubber);well.rotation.y=side>0?0:Math.PI;well.position.set(xx,.35,side*.895);g.add(well);
   const rim=new T.Mesh(new T.CylinderGeometry(.212,.212,.032,24),chrome);rim.rotation.x=Math.PI/2;rim.position.set(xx,.32,side*.95);g.add(rim);
   const recess=new T.Mesh(new T.CircleGeometry(.171,24),material(0x454e50,.6));recess.rotation.y=side>0?0:Math.PI;recess.position.set(xx,.32,side*.970);g.add(recess);
   for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const spoke=rod(g,new T.Vector3(xx,.32,side*.975),new T.Vector3(xx+Math.sin(a)*.19,.32+Math.cos(a)*.19,side*.975),.016,0xb8bebd);spoke.material=chrome;}
   const hub=new T.Mesh(new T.SphereGeometry(.048,8,6),chrome);hub.scale.z=.26;hub.position.set(xx,.32,side*.987);g.add(hub);
  }
  // Shallow door seams, handles, belt line and mirrors add visible scale.
  for(const xx of [-.98,.41,1.10])box(g,xx,.71,zz,.009,.36,.012,0x42494a);
  box(g,.08,.51,zz,2.09,.018,.016,0x3d4647);
  for(const xx of [-.25,.82]){const handle=box(g,xx,.87,side*.912,.18,.039,.040,0xa8afac,.015);handle.material=chrome;}
  const mirror=box(g,.98,1.04,side*.948,.21,.12,.16,color,.045);mirror.material=paint;
  box(g,1.11,1.04,side*.948,.017,.08,.11,0x879899);
  const frontLight=box(g,2.106,.704,side*.60,.035,.13,.36,0xd7dcd4,.014);frontLight.rotation.y=side*.14;
  box(g,-2.113,.678,side*.64,.043,.145,.29,0x973b34,.012);
 }
 box(g,2.17,.484,0,.05,.21,1.21,0x2c3438,.035);
 for(const z of [-.47,-.235,0,.235,.47]){const bar=box(g,2.202,.516,z,.015,.055,.15,0x727e82);bar.material=chrome;}
 box(g,-2.145,.46,0,.05,.15,1.35,0x404a4d,.025);
 // Unlettered plate blanks avoid reproducing personal identifiers.
 for(const xx of [-2.179,2.213])box(g,xx,.60,0,.013,.11,.29,0xbdc9ca);
 return g;
}
