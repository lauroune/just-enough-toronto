import * as T from 'three';
import {box,rod,material,sign} from './world';
import {facadeBox} from './architecture';
import {STREET} from './street-data';
import {buildVideoArchitecture} from './video-architecture';
import type {Obstacle} from './motion';
import type {Point} from './game';
type Factory=(x:number,z:number)=>T.Group;
// The October4 walk supplies the visible elevations only. Footprints remain
// City parcels. Real wall crops preserve the artwork rather than invented tags.
export function buildQueenVideoDetail(detail:Factory,kit:ReturnType<typeof buildVideoArchitecture>,brick:T.MeshStandardMaterial,obstacles:Obstacle[]){
 const {root,pane,arch,cornice}=kit;
 const red=brick.clone();red.color.setHex(0xe0b5a0);
 const dark=0x353941,cream=0xd7c8ae,gold=0xc9a65d,navy=0x233954;
 const line=(g:T.Group,a:number[],b:number[],r=.025,c=dark)=>rod(g,new T.Vector3(...a as [number,number,number]),new T.Vector3(...b as [number,number,number]),r,c);
 const unit=(address:string)=>STREET.units.find(u=>u.address===address)!;
 const front=(address:string)=>{const u=unit(address);return {u,g:root(...u.front,u.yaw),w:u.width};};
 const imageMaterials=new Map<string,T.Material>();
 function patch(g:T.Group,file:string,x:number,y:number,z:number,w:number,h:number){
  if(!imageMaterials.has(file)){const tex=new T.TextureLoader().load(`/materials/video/${file}.webp`);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;imageMaterials.set(file,new T.MeshStandardMaterial({map:tex,roughness:.95}));}
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),imageMaterials.get(file)!);mesh.position.set(x,y,z);g.add(mesh);
 }
 function canopy(g:T.Group,w:number,y:number,color:number){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-w/2,y,.30,w/2,y,.30,w/2,y-.63,1.24,-w/2,y-.63,1.24],3));geo.setIndex([0,2,1,0,3,2]);geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide}),m=new T.Mesh(geo,mat);m.castShadow=true;g.add(m);box(g,0,y-.71,1.25,w,.16,.065,color);for(const x of [-w*.46,w*.46])line(g,[x,y-.90,.18],[x,y-.63,1.23],.021);}
 function ordinaryShop(g:T.Group,w:number,color:number){box(g,0,1.9,.075,w-.08,3.8,.13,color);pane(g,-.55,1.91,w-1.82,2.58,.21,color,3,false);pane(g,w/2-.70,1.55,.97,2.93,.24,color,3,false);box(g,-.55,.42,.27,w-1.82,.7,.09,color);for(const x of [-w/2+.14,w/2-.14])box(g,x,1.92,.21,.17,3.85,.29,color);}
 //730/732 storefronts. The red graffiti is a partial literal video crop;
 //unknown lettering and unseen pieces are not completed by guesswork.
 for(const address of ['730 Queen St E','732 Queen St E']){
  const {g,w}=front(address);facadeBox(g,0,5.9,.03,w,4.75,.08,red);for(const x of [-w*.24,w*.24])pane(g,x,5.9,1.10,2.20,.13,cream,1);cornice(g,w,8.05,dark,true);ordinaryShop(g,w,dark);
  if(address.startsWith('730')){sign(g,'LAMOON','THAI KITCHEN & COFFEE',0,3.67,.31,w-.17,.71,'#252b32','#d7bd7c');}
  else{patch(g,'queen732-graffiti',-.56,.46,.39,w-1.83,.78);box(g,-w/2+.42,.25,.30,.13,.5,.17,0x626b6a);line(g,[-w/2+.42,.12,.39],[-w/2+.42,.82,.39],.032,0x8b9691);}
 }
 //734–736 roof slopes and dormers: one roof, three small gabled openings.
 for(const address of ['734 Queen St E','736 Queen St E']){
  const {g,w}=front(address);facadeBox(g,0,5.90,.04,w,4.8,.08,red);ordinaryShop(g,w,0x6b5b50);cornice(g,w,8.14,cream,true);
  for(const x of [-w*.24,w*.24]){pane(g,x,5.95,1.18,2.32,.15,cream,1);box(g,x,7.22,.12,1.52,.17,.3,cream);}
  const slope=box(g,0,9.47,-1.35,w+.15,.13,3.88,0x57555a);slope.rotation.x=-.73;
  const count=address.startsWith('734')?2:1;for(let i=0;i<count;i++){const x=(i+.5)*w/count-w/2;box(g,x,9.13,-.34,1.52,1.55,1.85,0x766451);pane(g,x,9.23,1.03,1.34,.65,cream,1);const shape=new T.Shape();shape.moveTo(x-.85,9.94);shape.lineTo(x,10.79);shape.lineTo(x+.85,9.94);shape.closePath();const face=new T.Mesh(new T.ShapeGeometry(shape),material(0x716353));face.position.z=.62;g.add(face);for(const side of [-1,1])line(g,[x+side*.94,9.91,.72],[x,10.86,.72],.075,cream);}
 }
 //Ornate red-brick upper block. The oriels really project into the street:
 //a flat window texture cannot reproduce their deep returns and caps.
 for(const address of ['738 Queen St E','740 Queen St E','742 Queen St E']){
  const {g,w}=front(address);facadeBox(g,0,8.27,.035,w,9.94,.09,red);
  for(const y of [4.26,8.65,12.45])box(g,0,y,.15,w,.15,.30,0x9c7460);
  for(const x of [-w/2+.14,w/2-.14]){facadeBox(g,x,8.45,.13,.30,9.47,.22,red);box(g,x,12.93,.19,.53,.19,.47,0x94705e);}
  const bw=Math.min(3.6,w*.63);box(g,0,6.30,.46,bw,3.52,.80,0x64594e);
  pane(g,0,6.37,bw*.61,2.69,.91,0x66574c,2,false);
  for(const side of [-1,1]){const sideFace=new T.Group();sideFace.position.set(side*bw/2,0,.48);sideFace.rotation.y=side*Math.PI/2;g.add(sideFace);pane(sideFace,0,6.37,.57,2.67,.02,0x66574c,1,false);}
  for(const y of [4.54,7.99]){box(g,0,y,.50,bw+.24,.17,1.13,0x796653);box(g,0,y+.13,.51,bw+.40,.09,1.19,0xa9866b);}
  const upperCount=w>6?2:1;for(let i=0;i<upperCount;i++)arch(g,(i+.5)*w/upperCount-w/2,10.48,Math.min(1.53,w*.25),2.79);
  for(const x of [-w*.40,w*.40]){const disk=new T.Mesh(new T.CircleGeometry(.22,16),material(0x9c735d));disk.position.set(x,8.20,.21);g.add(disk);for(let j=0;j<8;j++){const a=j*Math.PI/4;const petal=new T.Mesh(new T.SphereGeometry(.061,5,4),material(0x745749));petal.scale.set(1.1,1.5,.5);petal.position.set(x+Math.cos(a)*.13,8.20+Math.sin(a)*.13,.245);petal.rotation.z=a-Math.PI/2;g.add(petal);}}
  cornice(g,w,12.92,0x725a4c,true);
  if(address.startsWith('738')){ordinaryShop(g,w,navy);box(g,0,3.78,.24,w-.1,.78,.26,navy);sign(g,'BUTCHERS OF DISTINCTION','',0,3.78,.382,w-.30,.61,'#233954','#c8ad73');canopy(g,w-.33,3.33,0x2e486d);for(const x of [-w/2+.20,w/2-.20])box(g,x,1.85,.375,.025,3.6,.018,gold);for(const y of [.17,.79])box(g,-.55,y,.325,w-1.83,.026,.026,gold);for(let x=-w/2+.35;x<w/2-1.6;x+=.5)box(g,x,.46,.331,.026,.57,.026,gold);}
  else if(address.startsWith('740')){ordinaryShop(g,w,0x9b4036);box(g,0,3.72,.21,w,.91,.25,0xa94735);sign(g,"St. John's eco Market",'',0,3.76,.35,w-.22,.70,'#eadbb2','#423e35');box(g,-w/2+.25,1.95,.30,.34,3.30,.22,0xf0cb74);const eye=new T.Mesh(new T.SphereGeometry(.17,12,8),material(0xc16638));eye.scale.set(1,.67,.15);eye.position.set(-w/2+.25,2.25,.425);g.add(eye);}
  else ordinaryShop(g,w,0x535454);
 }
 //800 Queen: photographed west wall and rear offset retained, not a mural
 //placed on Amber or on an unrelated corner. Mural©Que Rock,2024.
 const {g:tim,w:tw}=front('800 Queen St E');const wall=material(0xb8b1a5);
 facadeBox(tim,0,4,.06,tw,8,.13,wall);ordinaryShop(tim,tw,0xbcb9af);for(const x of [-tw*.27,tw*.27]){pane(tim,x,6.15,1.2,2.54,.15,0xbdb093,1);box(tim,x,7.52,.16,1.62,.13,.29,cream);}
 for(const y of [4.10,7.85])box(tim,0,y,.19,tw,.17,.27,dark);sign(tim,'Tim Hortons','',0,3.77,.31,3.5,.70,'#b83f41','#fff0df','cursive');
 const side=root(-48.01,-17.43,-Math.PI/2),sw=16.68;facadeBox(side,0,4,.025,sw,8,.08,wall);for(const y of [.37,4.10,7.85])box(side,0,y,.12,sw,.18,.27,dark);
 for(const x of [-6.4,-2.5,1.4,5.3]){pane(side,x,6.07,1.15,2.57,.15,0xbeae90,1);box(side,x,7.48,.16,1.58,.12,.29,cream);}
 //The clear official long-wall photograph corroborates the video, without
 //its foreground stop sign baked onto the wall. The higher-resolution user
 //bear crop follows the actual northward jog in the City ground polygon.
 patch(side,'biskaabiiyaang-long-wall',-1.60,2.11,.115,13.1,3.35);
 const rear=root(-47.49,-27.66,-Math.PI/2);facadeBox(rear,0,4,.03,3.9,8,.10,wall);patch(rear,'biskaabiiyaang-bear',0,2.11,.10,3.83,3.35);pane(rear,0,6.07,1.15,2.57,.15,0xbeae90,1);for(const y of [.37,4.10,7.85])box(rear,0,y,.12,3.96,.18,.27,dark);
 pane(side,6.98,1.94,1.73,2.84,.17,cream,3,false);
 for(const x of [-5.5,-1.8]){box(side,x,3.81,.18,.72,.47,.18,0x757a76);for(let i=0;i<6;i++)box(side,x,3.62+i*.07,.285,.60,.018,.02,0xb5b9ad);}
 line(side,[-7.7,.25,.23],[-7.7,7.8,.23],.052,0xc7c6b8);
 //Amber's observed timber seats and small round tables remain behind the
 //clear walking strip; the existing arch model supplies the black frontage.
 const amber=root(-63.10,-25.25,Math.PI/2);
 for(const x of [-9.7,-5.7,4.5]){const top=new T.Mesh(new T.CylinderGeometry(.33,.33,.045,16),material(0xb79764));top.position.set(x,.76,1.28);amber.add(top);box(amber,x,.40,1.28,.06,.72,.06,0x303736);box(amber,x,.08,1.28,.38,.045,.38,0x303736);obstacles.push({x:-61.82,z:-25.25-x,w:.70,d:.70,h:.82,tag:'Amber cafe table'});}
 for(const x of [-12.2,-8.3,-4.3]){box(amber,x,4.03,.39,.73,.51,.49,0xc5c7be);for(let i=0;i<7;i++)box(amber,x-.28+i*.09,4.03,.647,.027,.37,.018,0x737d78);line(amber,[x+.37,4.0,.29],[x+.37,4.80,.29],.023,0x949788);}
}

