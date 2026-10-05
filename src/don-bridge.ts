import * as T from 'three';
import {box,rod,material} from './world';

// Queen Street Viaduct: 39.3 m, seven-panel Pratt main span. Dimensions of
// member sections/portal ornament are reconstructed from the 2020 walk and
// Riverside BIA photography; these are not structural engineering drawings.
export const DON_BRIDGE={start:-718.5,length:39.3,panels:7,halfRoad:6.8,top:6.35};
export function buildDonBridge(g:T.Group,z:number){
 const {start,length,panels,halfRoad,top}=DON_BRIDGE,end=start+length;
 const steel=0x738c80,dark=0x536c63,rust=0x727a69;
 const v=(x:number,y:number,d:number)=>new T.Vector3(x,y,d);
 function beam(a:T.Vector3,b:T.Vector3,width:number,depth:number,color=steel){const d=b.clone().sub(a),m=box(g,0,0,0,width,d.length(),depth,color);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 // Built-up lattice posts: two flanges, open cross-lacing, riveted foot plates.
 function post(x:number,d:number,h=top){
  for(const side of [-1,1])box(g,x+side*.22,h/2,d,.09,h,.30,steel);
  for(let y=.65;y<h-.15;y+=.44){beam(v(x-.21,y,d-.155),v(x+.21,Math.min(y+.44,h),d-.155),.042,.04);beam(v(x+.21,y,d-.16),v(x-.21,Math.min(y+.44,h),d-.16),.042,.04);}
  box(g,x,.26,d,.63,.52,.49,steel);box(g,x,.025,d,.78,.05,.64,dark);
  for(const xx of [-.23,.23])for(const yy of [.12,.36]){const rivet=new T.Mesh(new T.SphereGeometry(.025,5,3),material(dark));rivet.position.set(x+xx,yy,d-.25);g.add(rivet);}
 }
 for(const side of [-1,1]){
  const d=z+side*halfRoad;
  beam(v(start,.32,d),v(end,.32,d),.28,.31,dark);
  beam(v(start,top,d),v(end,top,d),.37,.40);
  for(let k=0;k<=panels;k++)post(start+k*length/panels,d);
  for(let k=0;k<panels;k++){
   const x=start+k*length/panels,nx=start+(k+1)*length/panels;
   const a=k<panels/2?v(x,top-.10,d):v(x,.42,d),b=k<panels/2?v(nx,.42,d):v(nx,top-.1,d);
   // Wide plate webs with raised outer flanges read as steel, not thin pipes.
   beam(a,b,.31,.32);for(const offset of [-.15,.15])beam(a.clone().add(v(0,0,offset)),b.clone().add(v(0,0,offset)),.39,.055,dark);
  }
 }
 for(let k=0;k<=panels;k++){
  const x=start+k*length/panels;
  beam(v(x,top,z-halfRoad),v(x,top,z+halfRoad),.17,.30);
  if(k<panels){const nx=x+length/panels;beam(v(x,top+.11,z-halfRoad),v(nx,top+.11,z+halfRoad),.075,.07);beam(v(nx,top+.11,z-halfRoad),v(x,top+.11,z+halfRoad),.075,.07);}
 }
 // Laced portal lintels and curved knee braces at both ends.
 for(const x of [start,end]){
  for(const y of [5.72,6.43])beam(v(x,y,z-halfRoad),v(x,y,z+halfRoad),.085,.18);
  for(let d=-halfRoad;d<halfRoad;d+=.68){beam(v(x,5.76,z+d),v(x,6.39,z+Math.min(d+.68,halfRoad)),.055,.065);beam(v(x,6.39,z+d),v(x,5.76,z+Math.min(d+.68,halfRoad)),.055,.065);}
  for(const side of [-1,1]){const points=[];for(let i=0;i<=10;i++){const t=i/10;points.push(v(x,4.85+Math.sin(t*Math.PI/2)*.85,z+side*(halfRoad-1.6*(1-Math.cos(t*Math.PI/2)))));}for(let i=1;i<points.length;i++)beam(points[i-1],points[i],.13,.12);}
 }
 // Approach parapets: concrete plinth and characteristic diamond metal infill.
 for(const side of [-1,1]){
  // King joins Queen before the truss. A south parapet west of that junction
  // would incorrectly sever the mapped approach from King/River.
  const from=side<0?-817:-752.7,to=-621,d=z+side*10.15;
  box(g,(from+to)/2,.40,d,to-from,.80,.35,0xa5aaa0);
  for(const y of [.84,1.53])beam(v(from,y,d),v(to,y,d),.06,.09,dark);
  for(let x=from;x<to;x+=2.4){box(g,x,1.18,d,.075,.77,.09,steel);for(let a=0;a<2.4&&x+a+.6<=to;a+=.6){beam(v(x+a,.88,d),v(x+a+.60,1.47,d),.033,.028);beam(v(x+a,1.47,d),v(x+a+.60,.88,d),.033,.028);}}
 }
 // Eldon Garnet's Time and a Clock: open silhouette, clock below the crest.
 // Transparent lettering keeps sky visible; it is not a rectangular signboard.
 const portal=new T.Group();portal.position.set(start-.29,0,z);portal.rotation.y=-Math.PI/2;g.add(portal);
 const clock=new T.Mesh(new T.CylinderGeometry(.61,.61,.15,48),material(0xd4d6c8));clock.rotation.x=Math.PI/2;clock.position.set(0,6.95,.0);portal.add(clock);
 const ring=new T.Mesh(new T.TorusGeometry(.61,.065,8,48),material(steel));ring.position.set(0,6.95,.105);portal.add(ring);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,m=box(portal,Math.sin(a)*.49,6.95+Math.cos(a)*.49,.11,.027,.092,.018,dark);m.rotation.z=-a;}
 rod(portal,v(0,6.95,.14),v(-.22,7.22,.14),.025,dark);rod(portal,v(0,6.95,.15),v(.40,7.10,.15),.018,dark);
 const c=document.createElement('canvas');c.width=2048;c.height=400;const ctx=c.getContext('2d')!;
 const text='THIS RIVER I STEP IN IS NOT THE RIVER I STAND IN';ctx.font='500 51px Georgia';ctx.fillStyle='#bcc4b7';ctx.textAlign='center';ctx.textBaseline='middle';
 const arc=(x:number)=>290-186*Math.exp(-Math.pow((x-1024)/390,2));
 for(let i=0;i<text.length;i++){const x=48+i*1952/(text.length-1),slope=(arc(x+1)-arc(x-1))/2;ctx.save();ctx.translate(x,arc(x));ctx.rotate(Math.atan(slope));ctx.fillText(text[i],0,0);ctx.restore();}
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
 const letters=new T.Mesh(new T.PlaneGeometry(13.45,2.63),new T.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.3,side:T.DoubleSide,roughness:.75}));letters.position.set(0,7.23,.16);portal.add(letters);
 // Two flowing metal ribbons bracket the inscription.
 for(const off of [-.22,.22]){let prev:T.Vector3|undefined;for(let i=0;i<=100;i++){const x=-6.55+i*13.1/100,y=6.64+1.23*Math.exp(-Math.pow(x/2.60,2))+off,p=v(x,y,.12);if(prev)rod(portal,prev,p,.035,steel);prev=p;}}
 // Rivet plates and utility conduits along the underside of the upper chords.
 for(const d of [z-halfRoad,z+halfRoad])for(let k=0;k<=panels;k++){const x=start+k*length/panels;box(g,x,top-.13,d,.60,.58,.065,rust);}
}
