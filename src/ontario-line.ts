import * as T from 'three';
import {box,rod,sign,material,mergeStatic,groundBox} from './world';
import {foliageTexture} from './foliage';
import type {Point} from './game';
import type {Obstacle} from './motion';

// Metrolinx April 2026 entrance renderings and July 2025 aerial.
// This is a completed-future interpretation, not a surveyed as-built model.
// Platform dimensions and landscape details are estimated from those views.
export const LESLIEVILLE={x:21,z:0,yaw:-Math.atan(.375),length:144,width:23,deck:6.25,roof:13.9};
export const ONTARIO_PATH:Point[]=[[-78,260],[-31,173],[7,80],[21,0],[47,-70],[64,-114],[88,-169],[111,-224],[140,-279],[173,-337],[207,-388]];
export function stationPoint(x:number,z:number):Point{const s=LESLIEVILLE,c=Math.cos(s.yaw),n=Math.sin(s.yaw);return[s.x+x*c+z*n,s.z-x*n+z*c];}
const vec=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
type Factory=(x:number,z:number)=>T.Group;

export function buildOntarioLine(detail:Factory,obstacles:Obstacle[],parent:T.Group){
 const s=LESLIEVILLE,g=new T.Group();g.name='Completed Leslieville Station';g.position.set(s.x,0,s.z);g.rotation.y=s.yaw;detail(s.x,0).add(g);
 const copper=0x9b5039,edge=0x575850,cream=0xdfd8c7;
 const glass=new T.MeshStandardMaterial({color:0x8aa4b1,roughness:.18,metalness:.30,transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide});
 const warm=new T.MeshStandardMaterial({color:0xf6ddb4,emissive:0xffce86,emissiveIntensity:.45,roughness:.6});
 function solid(x:number,z:number,w:number,d:number,h:number,tag='station headhouse'){
  const p:Point[]=[stationPoint(x-w/2,z-d/2),stationPoint(x+w/2,z-d/2),stationPoint(x+w/2,z+d/2),stationPoint(x-w/2,z+d/2)];const xs=p.map(v=>v[0]),zs=p.map(v=>v[1]);obstacles.push({x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),h,p,tag});
 }
 // Continuous elevated platform and thin, generous roof overhang.
 box(g,0,5.7,0,23,1.1,144,0xaca89d);
 box(g,0,6.29,0,7.9,.18,135,0xc6bca8);
 for(const x of [-4.15,4.15])box(g,x,6.40,0,.24,.04,132,0xd5b049);
 box(g,0,13.75,0,27,.25,151,edge);
 box(g,0,13.59,0,26.5,.09,150,0xc4a77f);
 // Narrow timber-coloured soffit strips are visible from the street.
 for(let z=-74;z<75;z+=.56)box(g,0,13.52,z,26.3,.04,.025,0x8f7257);
 // Clerestory, glazing ribbon and closely spaced terracotta fins.
 for(const side of [-1,1]){
  const face=side*11.5;
  box(g,face,7.06,0,.22,1.15,141,cream);
  const pane=box(g,face,9.18,0,.06,3.10,141,0xffffff);pane.material=glass;pane.castShadow=false;
  const upper=box(g,face,12.0,0,.06,1.50,141,0xffffff);upper.material=glass;upper.castShadow=false;
  for(const y of [7.65,10.72,11.18,12.85])box(g,face,y,0,.18,.12,142,edge);
  for(let z=-70.5;z<=71;z+=1.16){box(g,face+side*.27,10.03,z,.72,5.34,.115,copper);box(g,face,9.30,z,.11,3.4,.085,edge);}
  for(let z=-66;z<70;z+=8.7){box(g,side*9.5,10,z,.22,7.2,.26,cream);}
  // Transparent platform-edge screens retain sightlines through the hall.
  for(let z=-64;z<=64;z+=4.25){const p=box(g,side*4.22,7.64,z,.035,2.55,4.05,0xffffff);p.material=glass;p.castShadow=false;box(g,side*4.22,8.99,z,.10,.12,4.2,0x4b5150);box(g,side*4.22,7.65,z-2,.10,2.72,.07,0x4b5150);}
 }
 // Roof cross beams and illuminated platform ceiling, without many lights.
 for(let z=-65;z<70;z+=8.8){box(g,0,13.05,z,21.5,.27,.20,0xe1d5b9);for(const x of [-2.2,2.2]){const m=box(g,x,12.88,z,5.5,.035,.11,0xffffff);m.material=warm;}}
 for(const z of [-62,-25,26,62]){const m=sign(g,'LESLIEVILLE','Ontario Line',0,9.1,z,4.7,.75,'#20282a','#f4efe0','Arial');m.rotation.y=Math.PI/2;}
 // North and south headhouses sit behind open Queen sidewalks.
 for(const [z,len] of [[-40,53],[41,53]]){
  box(g,0,2.8,z,22,5.6,len,0xd6d0c3);solid(0,z,22,len,5.7);
  const front=new T.Group();front.position.set(-11.06,0,z);front.rotation.y=-Math.PI/2;g.add(front);
  box(front,0,2.1,.04,len-.25,3.9,.10,0x7b817b);
  // Perforated metal screen: a warm, fine mesh in front of the glass.
  const p=box(front,0,2.4,.14,len-.35,3.15,.03,0xffffff);p.material=glass;p.castShadow=false;
  for(let x=-len/2+.4;x<len/2;x+=.42){box(front,x,2.12,.22,.04,4.12,.035,0xb9b6a8);}
  for(const y of [.34,1.6,3.85,4.25])box(front,0,y,.23,len,.05,.08,cream);
  box(front,0,4.7,.0,len,1.1,.18,copper);
  for(let x=-len/2+.15;x<len/2;x+=.21)box(front,x,4.7,.15,.045,1.15,.09,0xb56d4c);
  const light=box(front,0,4.10,.30,len,.035,.04,0xffffff);light.material=warm;
  const doorX=z<0?len/2-7.6:-len/2+7.6;
  box(front,doorX,1.7,.26,6.4,3.35,.06,0x313936);
  for(const dx of [-2.34,-.78,.78,2.34]){const panel=box(front,doorX+dx,1.53,.34,1.46,2.92,.045,0xffffff);panel.material=glass;box(front,doorX+dx,1.03,.385,1.45,.095,.04,0xd9bd61);box(front,doorX+dx+.68,1.5,.40,.035,2.94,.05,cream);}
  sign(front,'LESLIEVILLE STATION','',doorX,3.64,.41,7.8,.51,'#202626','#f6f1e5','Arial');
  sign(front,'T','ONTARIO LINE',doorX-5.3,2.23,.4,.65,2.25,'#282c2c','#f7f0df','Arial');
  sign(front,'TTC','',doorX-5.3,3.77,.4,.65,.4,'#c74b45','#fff6df','Arial');
  // Queen-facing wall has silver fluting and narrow warm entry glazing.
  const end=z<0?z+len/2:z-len/2;
  for(let x=-10.6;x<11;x+=.23)box(g,x,2.5,end,.055,4.95,.10,0xc4c2b4);
 }
 // Completed plaza. Its planting layout is provisional in Metrolinx's images.
 const plaza=new T.Group();plaza.position.set(-12,0,34);parent.add(plaza);
 groundBox(plaza,0,.035,0,25,.05,45,0xbfb9aa);
 for(let x=-12;x<=12;x+=2.5)groundBox(plaza,x,.065,0,.012,.007,45,0x9f9b91);
 for(let z=-21;z<=22;z+=2.5)groundBox(plaza,0,.066,z,25,.007,.012,0x9f9b91);
 for(const [x,z] of [[-8,-7],[-8,8],[6,17]]){
  box(plaza,x,.28,z,3.1,.50,6.4,cream,.10);box(plaza,x,.55,z,2.85,.07,6.15,0x7c8060);
  obstacles.push({x:x-12,z:z+34,w:3.1,d:6.4,h:.55,tag:'station planter'});
  const trunk=rod(plaza,vec(x,.6,z),vec(x,5.9,z),.11,0x76604e);void trunk;
  const lm=new T.MeshStandardMaterial({color:0xe99a4d,map:foliageTexture(true),alphaTest:.38,side:T.DoubleSide,roughness:.8});
  for(let k=0;k<30;k++){const a=k*2.399,leaf=new T.Mesh(new T.PlaneGeometry(2.3,2.3),lm);leaf.position.set(x+Math.sin(a)*1.4,4.6+Math.sin(k*1.73)*1.35,z+Math.cos(a)*1.4);leaf.rotation.set(k*.4,k*1.4,k*.7);leaf.castShadow=true;plaza.add(leaf);}
  for(let k=-2;k<=2;k++)box(plaza,x+2.1,.58,z+k*.12,.40,.07,4.4,0xad825b,.025);
  for(const dz of [-1.7,1.7])box(plaza,x+2.1,.30,z+dz,.35,.55,.10,0x5c625c);
 }
 for(const z of [-7,8,17]){rod(plaza,vec(10,0,z),vec(10,4.9,z),.065,0x5b6160);const lamp=box(plaza,10,4.85,z,.40,.12,.45,0xffffff,.04);lamp.material=warm;}
 mergeStatic(plaza);
 // Finished concrete guideway continues through the modelled corridor.
 for(let k=1;k<ONTARIO_PATH.length;k++){
  const a=ONTARIO_PATH[k-1],b=ONTARIO_PATH[k],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),mid:Point=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const part=new T.Group();part.position.set(...[mid[0],0,mid[1]] as [number,number,number]);part.rotation.y=Math.atan2(dx,dz);detail(...mid).add(part);
  box(part,0,5.68,0,19,1.05,len+.1,0xb9b8aa);
  for(const x of [-6.25,6.25]){box(part,x,6.23,0,3.5,.15,len,0x99988b);for(const off of [-.72,.72])box(part,x+off,6.38,0,.08,.08,len,0x879299);}
  // Railside noise wall with a transparent upper band.
  if(Math.abs(mid[1])>78){for(const side of [-1,1]){box(part,side*9.4,6.90,0,.18,1.4,len,cream);const screen=box(part,side*9.4,8.5,0,.03,1.8,len,0xffffff);screen.material=glass;screen.castShadow=false;for(let z=-len/2;z<len/2;z+=3.6)box(part,side*9.4,7.8,z,.11,3.2,.12,0x737e78);}}
 }
 const train=new T.Group();train.name='Ontario Line train';parent.add(train);
 for(let car=0;car<4;car++){
  const z=(car-1.5)*19.9;box(train,0,1.95,z,2.8,2.9,19.2,0xe8e6dc,.25);box(train,0,.67,z,2.6,.40,18.4,0x4a5358,.12);
  for(const side of [-1,1]){box(train,side*1.406,2.37,z,.016,1.35,17.5,0x344851);box(train,side*1.425,1.52,z,.03,.14,18.1,0x3e799e);for(let j=-3;j<=3;j++)box(train,side*1.44,2.34,z+j*2.47,.025,1.37,.075,0xbdc4c1);}
  if(car===0||car===3){const front=z+(car===0?-9.63:9.63),cab=box(train,0,2.43,front,2.45,1.22,.04,0x31454e,.10);void cab;for(const x of [-.93,.93]){const m=box(train,x,1.28,front,.24,.09,.05,0xffffff);m.material=warm;}}
 }
 mergeStatic(train);
 const lengths=ONTARIO_PATH.slice(1).map((b,i)=>Math.hypot(b[0]-ONTARIO_PATH[i][0],b[1]-ONTARIO_PATH[i][1])),total=lengths.reduce((a,b)=>a+b,0);
 return {update:(time:number,reduced:boolean)=>{
  // An 18-second station dwell, then a smooth departure. Route is a visual
  // service, not a timetable or a new passenger-play mechanic.
  const phase=time%100;let distance=phase<18?279:279+(phase-18)*7.5;distance%=total;
  let i=0;while(i<lengths.length-1&&distance>lengths[i])distance-=lengths[i++];const a=ONTARIO_PATH[i],b=ONTARIO_PATH[i+1],t=distance/lengths[i],dx=b[0]-a[0],dz=b[1]-a[1],len=lengths[i];
  if(!reduced||time<1){train.position.set(a[0]+dx*t+dz/len*6.25,6.40,a[1]+dz*t-dx/len*6.25);train.rotation.y=Math.atan2(dx,dz);}
 },train};
}
