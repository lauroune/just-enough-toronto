import {rigidBuilding} from './building-ground';
import * as T from 'three';
import {box,rod,material} from './world';
import {facadeBox} from './architecture';
import {GEO} from './geography';
import {STREET} from './street-data';
import type {Point} from './game';
import type {Obstacle} from './motion';
import {VIDEO_HEIGHTS,VIDEO_GROUND} from './video-data';
type Factory=(x:number,z:number)=>T.Group;
type Masonry={red:T.MeshStandardMaterial;aged:T.MeshStandardMaterial;cream:T.MeshStandardMaterial;black:T.MeshStandardMaterial};

// Authored from the user's two walk videos, indexed by timestamp in video-data.
// Observed shop names are attached to these specific fronts only. No video
// identifiable passers-by are bundled into the game. Two small material crops
// are recorded explicitly in private reference archive (not distributed)
export function buildVideoArchitecture(tile:Factory,detail:Factory,m:Masonry,obstacles:Obstacle[]){
 const root=(x:number,z:number,yaw=0,permanent=false)=>{const g=new T.Group();g.position.set(x,0,z);g.rotation.y=yaw;rigidBuilding(g,x,z);(permanent?tile:detail)(x,z).add(g);return g;};
 const line=(g:T.Group,a:number[],b:number[],r=.025,c=0x4a504d)=>rod(g,new T.Vector3(a[0],a[1],a[2]),new T.Vector3(b[0],b[1],b[2]),r,c);
 const red=m.red.clone();red.color.setHex(0xbb9988);const rose=m.red.clone();rose.color.setHex(0xc6a6a0);const old=m.red.clone();old.color.setHex(0xd4b39c);
 const buffMap=new T.TextureLoader().load('/materials/video/td-buff-brick.jpg');buffMap.colorSpace=T.SRGBColorSpace;buffMap.wrapS=buffMap.wrapT=T.RepeatWrapping;buffMap.repeat.set(.72,.82);buffMap.anisotropy=8;
 const buff=new T.MeshStandardMaterial({map:buffMap,bumpMap:buffMap,bumpScale:.008,color:0xf0ece3,roughness:.94});const stone=material(0xb2ab98,.94),dark=0x343b3e;
 const cv=document.createElement('canvas');cv.width=4096;cv.height=1024;const cx=cv.getContext('2d')!;cx.scale(2,2);
 // Four glazing variants share one atlas. Broken reflection shapes and half
 // blinds avoid giving every opening the same white diagonal stripe.
 for(let k=0;k<4;k++){
  const x=k*256,gr=cx.createLinearGradient(0,0,0,512);gr.addColorStop(0,['#a0afb3','#687c82','#84938f','#e0b58a'][k]);gr.addColorStop(.5,['#667c7d','#46585e','#62736b','#b17d54'][k]);gr.addColorStop(1,['#425654','#344345','#3b4c45','#634a38'][k]);cx.fillStyle=gr;cx.fillRect(x,0,256,512);
  if(k===1){cx.fillStyle='#8d9690';cx.fillRect(x+7,4,242,338);for(let y=8;y<336;y+=6){cx.fillStyle=y%12?'#77888744':'#c5c9bd44';cx.fillRect(x+7,y,242,1.5);}cx.fillStyle='#778782';cx.fillRect(x+7,336,242,4);}
  if(k===2){for(const side of [0,1])for(let j=0;j<9;j++){cx.fillStyle=['#c6c8b6dd','#a5aea099','#d0d0c3dd'][j%3];const xx=x+(side?174:0)+j*9;cx.fillRect(xx,2,9,416-j*3);}}
  if(k===0){cx.fillStyle='#bfd0ce33';cx.beginPath();cx.moveTo(x,110);cx.lineTo(x+256,154);cx.lineTo(x+256,218);cx.lineTo(x,179);cx.closePath();cx.fill();}
  if(k===3){
   // Restrained interior depth: shelves, counter, ceiling pendants and diffuse
   // tree reflection. It is supporting detail, not a surveyed shop interior.
   cx.fillStyle='#c89e7290';cx.fillRect(x,330,256,11);cx.fillStyle='#47363388';cx.fillRect(x,341,256,72);
   for(let j=0;j<10;j++){cx.fillStyle=['#a18b6955','#89968155','#76604b66'][j%3];cx.fillRect(x+12+j*23,285+(j%3)*8,12,37-(j%3)*8);}
   for(const xx of [55,197]){cx.strokeStyle='#b4a38977';cx.lineWidth=1.3;cx.beginPath();cx.moveTo(x+xx,0);cx.lineTo(x+xx,108);cx.stroke();cx.fillStyle='#ffe4a9';cx.beginPath();cx.ellipse(x+xx,112,19,6,0,0,Math.PI*2);cx.fill();}
   cx.fillStyle='#92a99a12';for(let j=0;j<65;j++){const xx=x+(j*71%256),yy=30+j*19%190;cx.beginPath();cx.ellipse(xx,yy,7+(j%3)*6,7+(j%4)*4,j*.4,0,Math.PI*2);cx.fill();}
   cx.fillStyle='#92a89b24';cx.fillRect(x+27,168,2,224);cx.fillRect(x+181,165,3,225);
   // Layered shelves and plants give the parallax room recognisable forms.
   for(const yy of [206,266]){cx.fillStyle='#61412f';cx.fillRect(x+104,yy,142,7);for(let j=0;j<8;j++){cx.fillStyle=['#b28556','#65795b','#a6503d','#d8ba7c'][j%4];cx.fillRect(x+111+j*16,yy-27-j%3*8,10,27+j%3*8);}}
   cx.fillStyle='#7e4c35';cx.beginPath();cx.moveTo(x+22,355);cx.lineTo(x+64,355);cx.lineTo(x+58,405);cx.lineTo(x+29,405);cx.fill();
   cx.strokeStyle='#486344';cx.lineWidth=4;cx.beginPath();cx.moveTo(x+43,357);cx.lineTo(x+42,219);cx.stroke();
   for(let j=0;j<12;j++){cx.fillStyle=['#456148','#6c8053','#8b9254'][j%3];cx.beginPath();cx.ellipse(x+42+(j%2?1:-1)*(12+j%3*4),238+j*9,18,7,j%2?-.55:.55,0,Math.PI*2);cx.fill();}
  }
 }

 // Additional restrained upper-storey variants share the same atlas. These
 // suggest occupancy; they do not claim to document private interiors.
 for(let k=4;k<8;k++){
  const x=k*256,gradient=cx.createLinearGradient(0,0,0,512);
  gradient.addColorStop(0,['#a89c87','#605e59','#7e9296','#6d746b'][k-4]);gradient.addColorStop(1,['#493e34','#303d42','#374a51','#343e38'][k-4]);cx.fillStyle=gradient;cx.fillRect(x,0,256,512);
  if(k===4||k===7){
   for(const side of [0,1])for(let j=0;j<14;j++){const xx=x+(side?194:0)+j*4.5;const g=cx.createLinearGradient(xx,0,xx+5,0);g.addColorStop(0,k===4?'#8e8b78':'#647767');g.addColorStop(.5,k===4?'#c0b8a1':'#929c85');g.addColorStop(1,k===4?'#817e6f':'#536657');cx.fillStyle=g;cx.fillRect(xx,0,5,453-j%3*8);}
   cx.fillStyle='#6d6150';cx.fillRect(x+68,404,119,65);cx.fillStyle='#bca486';cx.fillRect(x+78,399,42,24);cx.fillRect(x+128,399,45,24);
  }
  if(k===5){cx.fillStyle='#ada69a';cx.fillRect(x+5,2,246,266);for(let y=5;y<266;y+=7){cx.fillStyle=y%14?'#d2c8b1':'#736f66';cx.fillRect(x+5,y,246,1.5);}cx.fillStyle='#77776d';cx.fillRect(x+5,266,246,5);}
  if(k===6){cx.fillStyle='#c4cac0';cx.fillRect(x+5,2,246,47);cx.fillStyle='#8a9998';cx.fillRect(x+5,49,246,4);}
  // Subtle ceiling bounce and reflected vertical divisions break large flats.
  cx.fillStyle='#edc99718';cx.fillRect(x,0,256,24);cx.fillStyle='#bdc7c314';for(const xx of [26,108,217])cx.fillRect(x+xx,140,2,330);
 }
 const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
 const glass=new T.MeshStandardMaterial({map:tex,roughness:.14,metalness:.34,envMapIntensity:1.8});
 glass.userData.roomColumns=8;
 function glazing(g:T.Group,x:number,y:number,w:number,h:number,z:number,v=0){const geo=new T.PlaneGeometry(w,h),uv=geo.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setXY(k,((v%8)+uv.getX(k))/8,uv.getY(k));const mesh=new T.Mesh(geo,glass);mesh.position.set(x,y,z);g.add(mesh);return mesh;}
 function pane(g:T.Group,x:number,y:number,w:number,h:number,z=.13,trim=dark,v=0,split=true){
  box(g,x,y,z-.045,w+.20,h+.19,.10,0x29302e);glazing(g,x,y,w,h,z+.012,v);
  for(const xx of [-w/2,w/2])box(g,x+xx,y,z+.07,.065,h+.12,.13,trim);
  for(const yy of [-h/2,h/2])box(g,x,y+yy,z+.07,w+.12,.075,.13,trim);
  if(split)box(g,x,y-.27,z+.075,w,.056,.11,trim);
  box(g,x,y-h/2-.12,z+.04,w+.24,.13,.24,0xb0aa99);
 }
 function arch(g:T.Group,x:number,y:number,w:number,h:number,segmental=false){
  const r=w/2,rise=segmental?.34:r,bottom=y-h/2,top=y+h/2,shoulder=top-rise;
  const shape=new T.Shape();shape.moveTo(-r,bottom);shape.lineTo(r,bottom);shape.lineTo(r,shoulder);shape.quadraticCurveTo(r*.9,top,r*.1,top);shape.quadraticCurveTo(-r*.9,top,-r,shoulder);shape.closePath();
  const geo=new T.ShapeGeometry(shape,20),p=geo.getAttribute('position'),uv=geo.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setXY(k,((4+Math.abs(Math.round(g.position.x*.3+x*2.7+y*1.3))%4)+(p.getX(k)+r)/w)/8,(p.getY(k)-bottom)/h);
  const opening=new T.Mesh(geo,glass);opening.position.set(x,0,.135);g.add(opening);
  for(const side of [-1,1])box(g,x+side*r,(bottom+shoulder)/2,.19,.075,shoulder-bottom,.13,dark);
  box(g,x,y-.35,.20,w,.075,.14,dark);box(g,x,bottom-.10,.10,w+.22,.14,.27,0x9d9581);
  let prev=[x-r,shoulder,.18];for(let k=1;k<=20;k++){const a=Math.PI-k*Math.PI/20,now=[x+Math.cos(a)*r,shoulder+Math.sin(a)*rise,.18];line(g,prev,now,.045,dark);prev=now;}
  for(let k=0;k<15;k++){const a=k*Math.PI/14,rr=r+.15;const brick=box(g,x+Math.cos(a)*rr,shoulder+Math.sin(a)*(rise+.15),.095,.12,.22,.17,0x926b55);brick.rotation.z=a-Math.PI/2;}
 }
 function cornice(g:T.Group,w:number,y:number,c=dark,brackets=false){for(const [dy,h,d] of [[0,.12,.35],[.16,.17,.27],[.31,.10,.52]])box(g,0,y+dy,.09,w+.10,h,d,c);if(brackets)for(let x=-w/2+.3;x<w/2;x+=.50){box(g,x,y-.13,.12,.13,.29,.25,c);box(g,x,y-.05,.22,.18,.10,.26,c);}}
 // All shop lettering shares one atlas/material, so names do not each add a
 // standalone 1K texture. This also keeps labels lit by the same daylight.
 const names=[['STARBUCKS','#303637','#f0eee4'],['A&W','#e66d25','#ffffff'],['HOME OF THE BURGER FAMILY','#df6422','#ffffff'],['freshii','#177d46','#ffffff'],['Pet Valu','#223744','#f4f2e5'],['PURPLE PENGUIN COFFEE','#72548a','#f1e8eb'],['LESLIEVILLE CHEESE MARKET','#444949','#e3d0a3'],['TD','#349e37','#ffffff'],['ALL-WAY','#314d40','#e5cf9b'],['JIMMIE SIMPSON PARK','#674c4a','#e1d9c9'],['889','#735889','#ffffff'],['BAKERY · COFFEE','#b5a28b','#332f2a'],['LOGAN AV','#276a98','#ffffff'],['QUEEN ST E','#276a98','#ffffff'],['BOOTH AVE','#e3e0d7','#3e4440'],['501 · 503','#b72532','#ffffff'],['rowe farms','#53585a','#d6df94'],['leslieville market','#53585a','#efeee4'],['Grilled Cheese Sandwiches','#d6bfc0','#453f39'],['899','#a99577','#222c32'],['La Bamboche','#bcc6c1','#414c47'],['matcha haus','#6c9b71','#e8e2c3'],['THE ROY','#393e3c','#d7ba57'],['PUBLIC HOUSE','#393e3c','#d7ba57'],['HOOKED','#9b3640','#f2eee1'],['THE CASTLE','#343e3e','#d9d3c0']];
 const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=2048;const ac=atlas.getContext('2d')!;
 names.forEach(([text,bg,fg],i)=>{const x=i%2*1024,y=Math.floor(i/2)*128;ac.fillStyle=bg;ac.fillRect(x,y,1024,128);ac.fillStyle=fg;ac.textAlign='center';ac.textBaseline='middle';ac.font=`${[5,20].includes(i)?'italic ':i===0?'bold ':''}${i===0?118:i===9?70:92}px ${[6,9,11,20,22,23].includes(i)?'Georgia':'Arial'}`;const aspect=[13.8,5.4,25,4.8,7.1,12,13.9,1.4,1.21,8.3,1.56,17.5,5,5,5,3,5.9,8.7,13,3,7,8,4.7,11,8,9][i],sx=8/aspect;ac.save();ac.translate(x+512,y+64);ac.scale(sx,1);ac.fillText(text,0,0,960/sx);ac.restore();});
 const at=new T.CanvasTexture(atlas);at.colorSpace=T.SRGBColorSpace;at.anisotropy=8;const labelMat=new T.MeshStandardMaterial({map:at,roughness:.8});
 function label(g:T.Group,id:number,x:number,y:number,z:number,w:number,h:number){const geo=new T.PlaneGeometry(w,h),uv=geo.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setXY(k,(id%2+uv.getX(k))/2,1-(Math.floor(id/2)+1-uv.getY(k))/16);const mesh=new T.Mesh(geo,labelMat);mesh.position.set(x,y,z);g.add(mesh);return mesh;}
 function mass(id:number,height:number,mat:T.Material){const b=GEO.buildings.find(b=>b.id===id)!;const shape=new T.Shape(b.p.map(p=>new T.Vector2(p[0],-p[1])));for(const hole of b.holes)shape.holes.push(new T.Path(hole.map(p=>new T.Vector2(p[0],-p[1]))));const geo=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:1});geo.rotateX(-Math.PI/2);const pos=geo.getAttribute('position'),normal=geo.getAttribute('normal'),uv=geo.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setXY(k,(Math.abs(normal.getX(k))>.5?pos.getZ(k):pos.getX(k))/1.4,pos.getY(k)/1.4);const mesh=new T.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;tile(b.bounds[0],b.bounds[1]).add(mesh);}

 // 875 Queen E. The City product traces setback roofs; OSM retains the broad
 // ground-floor footprint. Build the podium out to that mapped street edge.
 const mass875=root(256.05,11.65,Math.PI,true);
 facadeBox(mass875,0,2.25,-18.60,73.68,4.5,37.2,red);
 facadeBox(mass875,6.1,10.90,-14.35,61.5,12.8,28.7,red);
 facadeBox(mass875,.30,20.55,-20.50,66.6,7.30,25.0,rose);
 obstacles.push({x:256.05,z:30.25,w:73.68,d:37.2,h:4.5,tag:'875 Queen mapped podium'});
 const condo=root(250.2,11.64,Math.PI);
 // Street bays vary in width and projection. The rose panels frame paired
 // two-storey glazing beside narrow recessed balconies, as seen at 10/26 s.
 const bays=[{x:-23.5,w:7.4,mat:red},{x:-14.6,w:8.8,mat:rose},{x:-4.7,w:8.3,mat:red},{x:5.0,w:8.0,mat:rose},{x:14.8,w:8.1,mat:red},{x:24.1,w:8.0,mat:rose}];
 for(const [i,b] of bays.entries()){
  facadeBox(condo,b.x,10.8,.045,b.w,12.65,.20,b.mat);
  for(const y of [7.5,11.05,14.55]){pane(condo,b.x,y,b.w*.68,2.87,.21,dark,i%4,false);box(condo,b.x,y,.30,.065,2.9,.11,dark);box(condo,b.x,y+.55,.30,b.w*.68,.055,.11,dark);
   if(y<14){box(condo,b.x,y-1.24,.54,b.w*.74,.14,.9,0x7a7871);for(const yy of [y-.20,y-1.12])box(condo,b.x,yy,.99,b.w*.72,.044,.05,dark);for(let x=b.x-b.w*.35;x<=b.x+b.w*.35;x+=.85)box(condo,x,y-.65,.99,.036,.96,.045,dark);}}
  facadeBox(condo,b.x,17.27,.18,b.w+.12,.24,.47,b.mat);
  const upper=root(250.2-b.x,16.85,Math.PI);facadeBox(upper,0,20.2,.01,b.w,6.70,.13,b.mat);for(const y of [18.9,22.0]){pane(upper,0,y,b.w*.73,2.52,.16,dark,(i+1)%4,false);box(upper,0,y,.25,.06,2.56,.09,dark);}cornice(upper,b.w,23.42,0x737570);
  const storefrontW=b.w-.45;pane(condo,b.x,2.13,storefrontW,3.72,.23,dark,3,false);for(const dx of [-storefrontW*.22,storefrontW*.22])box(condo,b.x+dx,2.14,.32,.07,3.74,.11,dark);
 }
 // Storefront sequence reads from Logan westward (left to right in this face).
 label(condo,1,-23.5,3.96,.40,2.9,.54);label(condo,2,-23.5,3.48,.41,7.0,.28);
 for(const x of [-27.0,-20.0])box(condo,x,1.77,.38,.18,3.55,.27,0xe16a22);
 label(condo,3,-14.6,3.84,.38,3.00,.62);label(condo,4,24.1,3.77,.38,4.6,.65);
 // Retained three-storey heritage corner under the new apartment addition.
 const star=root(286.65,11.55,Math.PI),sw=11.8;facadeBox(star,0,6.1,-.08,sw,12.2,.26,red);
 for(const y of [6.3,9.55])for(const x of [-4.4,-2.2,0,2.2,4.4])arch(star,x,y,1.07,2.17,true);
 for(const y of [4.56,7.60])box(star,0,y,.14,sw,.12,.27,0xc7bcaa);cornice(star,sw,11.78,0x696c68,true);for(let x=-5.3;x<5.8;x+=.50){const ornament=new T.Mesh(new T.TorusGeometry(.095,.024,6,16),material(0x81837b));ornament.position.set(x,11.63,.23);star.add(ornament);}
 for(let x=-5.2;x<5.6;x+=2.5)pane(star,x,2.00,2.17,3.31,.17,0x494c47,3,false);
 box(star,0,3.97,.22,sw,.67,.33,0x3c4140);label(star,0,0,3.97,.405,6.5,.50);for(const x of [-3.1,3.1]){box(star,x,4.08,.41,.34,.08,.14,0x646961);box(star,x,4.02,.45,.25,.025,.13,0xf0ddae);}
 for(const x of [-5.7,5.7])box(star,x,2.18,.18,.24,4.37,.31,0x373e3e);
 const starSide=root(292.99,22.10,Math.PI/2);facadeBox(starSide,0,6.1,0,19.5,12.2,.16,red);for(const y of [6.3,9.55])for(const x of [-7,-3.5,0,3.5,7])pane(starSide,x,y,1.13,2.17,.13,0x424a46,1);for(const y of [4.56,7.60])box(starSide,0,y,.10,19.5,.12,.24,0xc7bcaa);cornice(starSide,19.5,11.78,0x696c68,true);for(let x=-7.8;x<8;x+=3.1)pane(starSide,x,2.0,2.79,3.35,.13,dark,3,false);box(starSide,0,3.97,.16,19.5,.65,.27,0x3c4140);label(starSide,0,5.1,3.98,.32,6,.46);
 // East upper addition is set behind the heritage Queen wall, not extruded
 // straight through it. Tall glazing, pale brick piers and shallow glass rails.
 const upperEast=root(286.6,21.9,Math.PI);facadeBox(upperEast,0,18.1,-5.0,12.0,12.1,10.0,buff);for(const y of [13.8,17.0,20.2,23.0])for(const x of [-4.1,0,4.1]){pane(upperEast,x,y,3.2,2.6,.18,dark,0,false);box(upperEast,x,y,.27,.055,2.6,.09,dark);}

 // 889 corner and its eastern neighbours: three storeys, not the City union's
 // erroneous 25.89 m envelope. Side openings are observed in frame 20.
 const planMass=(points:Point[],h:number,mat:T.Material)=>{const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1]))),geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:1});geo.rotateX(-Math.PI/2);const p=geo.getAttribute('position'),n=geo.getAttribute('normal'),uv=geo.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))/1.4,p.getY(i)/1.4);const mesh=new T.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;tile(points[0][0],points[0][1]).add(mesh);};
 planMass(VIDEO_GROUND.corner.p,13.8,old);
 const cornerBrick=m.red.clone();cornerBrick.color.setHex(0xcbad9b);
 const shared=root(318.20,9.94,Math.PI);facadeBox(shared,0,6.80,.045,8.44,13.6,.17,cornerBrick);cornice(shared,8.46,13.3,0x725d4f);
 for(const x of [-2.15,2.15])arch(shared,x,6.40,2.12,2.90,true);
 for(const x of [-3.15,-1.10,1.10,3.15])arch(shared,x,10.21,1.12,2.58);
 for(const y of [4.30,8.39,11.91])box(shared,0,y,.13,8.50,.13,.25,0x8b6c54);
 // Address points locate 889 at x313.83, 891 at318.34 and893 at323.45.
 // The first two share one mapped parcel; video separates their shop fronts.
 const penguin=root(316.28,9.91,Math.PI),purple=material(0x9984b0);
 facadeBox(penguin,0,2.11,.10,4.95,4.22,.13,purple);box(penguin,0,.29,.19,4.95,.57,.15,0x705583);
 pane(penguin,.89,1.85,2.64,2.54,.23,0x6b756f,3,false);box(penguin,.89,1.70,.32,2.64,.062,.10,0xaeb2a6);box(penguin,.89,1.86,.31,.067,2.5,.10,0x91998c);
 pane(penguin,-1.08,1.40,.88,2.69,.26,0xb4b8b1,3,false);line(penguin,[-.80,1.0,.39],[-.80,1.52,.39],.021,0xc4c5be);label(penguin,5,.90,2.82,.48,2.63,.22);label(penguin,10,-1.94,2.06,.34,.40,.26);cornice(penguin,4.95,4.23,0x3d3e48);
 // Round hanging badge and bright planters are visible beside the doorway.
 const badge=new T.Mesh(new T.CircleGeometry(.37,40),material(0xdbdee1));badge.position.set(-1.17,3.38,.31);penguin.add(badge);const badgeRing=new T.Mesh(new T.TorusGeometry(.34,.023,6,40),material(0x625b7a));badgeRing.position.copy(badge.position);badgeRing.position.z+=.015;penguin.add(badgeRing);
 const bird=new T.Mesh(new T.SphereGeometry(.1,10,7),material(0x5b5969));bird.scale.set(.75,1.6,.2);bird.position.set(-1.17,3.35,.35);penguin.add(bird);
 for(const x of [-1.90,-.28]){const pot=new T.Mesh(new T.CylinderGeometry(.22,.17,.49,12),material(0xafbc3b));pot.position.set(x,.28,.46);penguin.add(pot);for(let k=0;k<5;k++)line(penguin,[x,.52,.46],[x+Math.sin(k*2)*.12,.80,.46+Math.cos(k*2)*.12],.028,0x5f7751);}
 // The mapped corner is chamfered. Keep glazing and purple plaster on this
 // diagonal face rather than covering it with a square box.
 const chamfer=root(312.905,11.31,Math.atan2(-2.74,-2.15));facadeBox(chamfer,0,6.79,.035,3.48,13.58,.13,cornerBrick);facadeBox(chamfer,0,2.11,.10,3.48,4.22,.13,purple);pane(chamfer,0,1.85,1.15,2.55,.22,0x6b756f,3,false);arch(chamfer,0,6.40,1.11,2.88,true);arch(chamfer,0,10.21,1.11,2.58);for(const y of [4.3,8.39,11.91])box(chamfer,0,y,.14,3.50,.13,.25,0x8b6c54);cornice(chamfer,3.50,4.23,0x3d3e48);
 const pengSide=root(311.78,20.66,-Math.PI/2);facadeBox(pengSide,0,6.65,.02,16.0,13.3,.12,cornerBrick);
 for(let x=-6;x<8;x+=3.8){arch(pengSide,x,10.05,1.05,2.60);pane(pengSide,x,6.40,1.05,2.63,.15,dark,1);if(Math.abs(x)<12){box(pengSide,x,3.65,.44,.88,.54,.65,0xb0b3a7);for(let k=0;k<6;k++)box(pengSide,x-.34+k*.13,3.65,.78,.06,.36,.02,0x777f78);}}
 for(const y of [4.35,8.37,11.85])box(pengSide,0,y,.10,16.0,.13,.23,0x8b6c54);cornice(pengSide,16.0,13.1,0x796552);
 // Purple paint wraps the first short wall only; the rest is exposed brick.
 box(pengSide,-6.8,1.95,.10,2.4,3.9,.17,0x867099);box(pengSide,-2.1,.70,.13,6.0,1.40,.19,0x6b5880);
 for(const x of [2.0,6.0]){pane(pengSide,x,1.65,1.04,2.75,.21,0x777e76,3,false);line(pengSide,[x+.73,.40,.25],[x+.73,3.8,.25],.024,0x777769);}
 // Short cafe patio with decorative metal rings, not a wall along Logan.
 for(const x of [-5.0,1.0])box(pengSide,x,.48,1.27,.04,.90,.045,0xb0ab98);for(const y of [.16,.86])box(pengSide,-2.0,y,1.27,6.0,.035,.035,0xb0ab98);
 for(let x=-4.6;x<.9;x+=.5){const ring=new T.Mesh(new T.TorusGeometry(.22,.013,5,24),material(0xb9b8a7));ring.position.set(x,.51,1.27);ring.scale.y=1.45;pengSide.add(ring);}
 const cheese=root(320.50,10.01,Math.PI);box(cheese,0,2.15,.11,3.94,4.25,.15,0x6b7978);cornice(cheese,3.96,4.27,0x424746);
 pane(cheese,.88,1.48,1.67,2.80,.24,0x8a9692,3,false);pane(cheese,-.68,1.39,.98,2.74,.24,0x82918c,3,false);box(cheese,0,3.59,.19,3.94,.80,.20,0x526a6a);label(cheese,6,0,3.64,.31,3.76,.28);label(cheese,18,.02,2.97,.40,3.12,.36);
 for(const x of [-1.65,1.63]){line(cheese,[x,4.06,.18],[x,3.88,.58],.018,0x313c38);const lamp=new T.Mesh(new T.ConeGeometry(.13,.14,12),material(0x303b38));lamp.position.set(x,3.83,.6);cheese.add(lamp);}
 // Rowe's two broad segmental windows and dark aged brick differ from the
 // orange corner. The broad fascia, sage shop frame and bench are observed.
 const rowe=root(326.88,10.03,Math.PI),roweBrick=m.red.clone();roweBrick.color.setHex(0x9a8b80);facadeBox(rowe,0,6.80,.03,8.94,13.6,.17,roweBrick);
 for(const x of [-2.23,2.23]){arch(rowe,x,6.65,2.55,3.20,true);pane(rowe,x,10.5,2.10,2.58,.15,0x49524d,2);box(rowe,x,6.75,.23,.06,2.9,.11,0x5e6760);}
 for(const x of [-4.4,0,4.4])facadeBox(rowe,x,8.87,.14,.28,8.8,.24,roweBrick);cornice(rowe,8.98,13.30,0x554f46);cornice(rowe,8.98,4.36,0x484943);
 box(rowe,0,2.17,.11,8.86,4.30,.15,0xb0b4a0);for(const x of [-2.40,.20]){pane(rowe,x,1.89,2.34,2.34,.24,0xa8b29e,3,false);box(rowe,x,.45,.31,2.36,.8,.08,0xa2ac95);}
 pane(rowe,3.38,1.60,.91,3.08,.26,0xa8b29e,3,false);pane(rowe,-3.82,1.60,.85,3.08,.26,0xa8b29e,3,false);box(rowe,0,3.97,.32,8.85,1.43,.27,0x53585a);label(rowe,16,-.4,4.11,.48,6.00,1.0);label(rowe,17,-1.55,3.54,.49,3.4,.39);
 const shopBench=root(324.23,8.48,Math.PI);for(let k=0;k<5;k++){box(shopBench,0,.50,-.18+k*.08,1.62,.047,.07,[0xd76d40,0xcdb43c,0x51815d,0x4a8e9a,0xd8873e][k]);box(shopBench,0,.65+k*.095,-.25,1.62,.077,.052,[0xd86c41,0x51815d,0xe1b947,0xd46f43,0xd7a84d][k]);}for(const x of [-.59,.59]){box(shopBench,x,.26,0,.065,.49,.48,0x3e493d);line(shopBench,[x,.49,.18],[x,.89,-.24],.025,0x3e493d);}obstacles.push({x:324.23,z:8.48,w:1.75,d:.56,h:1.14,tag:'Rowe Farms rainbow bench'});
 // Teal planter beside the bench, with a narrow footprint behind the clear walk.
 const rowePot=root(326.54,8.54),pot=new T.Mesh(new T.CylinderGeometry(.29,.20,1.01,5),material(0x279b9b));pot.position.y=.51;rowePot.add(pot);for(let k=0;k<9;k++)line(rowePot,[0,.98,0],[Math.cos(k*2.3)*.19,1.32+Math.sin(k)*.1,Math.sin(k*2.3)*.19],.029,0x8e5d51);obstacles.push({x:326.54,z:8.54,w:.6,d:.6,h:1.4,tag:'Rowe Farms teal planter'});

 //899 Queen, The Logan: a separate six-storey building with a37m street
 // front. The City's2016 north elevation supplies8 bays, a14m street wall,
 // two setback floors and rooftop mechanical enclosures. The user's0s frame
 // corroborates the western ground bay, bronze899 canopy and dark mullions.
 const loganBrick=m.red.clone();loganBrick.color.setHex(0xd6b9a5);planMass(VIDEO_GROUND.logan.p,14.05,loganBrick);
 const logan=root(349.18,10.62,Math.PI),lw=36.0;
 facadeBox(logan,0,9.11,.035,lw,9.92,.16,loganBrick);
 for(let k=0;k<8;k++){const x=-15.75+k*4.50;for(const y of [5.92,8.97,12.02]){pane(logan,x,y,3.59,2.63,.16,0x30373a,k%4,false);box(logan,x,y,.25,.075,2.67,.13,0x313b40);box(logan,x,y-.69,.25,3.59,.065,.13,0x313b40);}box(logan,x,4.13,.18,3.91,.31,.27,0x363b3c);pane(logan,x,1.94,3.83,3.68,.18,0x343f43,3,false);box(logan,x,1.94,.27,.085,3.7,.15,0x374146);}
 box(logan,0,14.03,.18,36.0,.23,.41,0x947e68);box(logan,0,3.80,.29,36.0,.69,.42,0x8c7961);label(logan,19,15.77,3.85,.53,2.8,.6);
 const retreat=root(349.18,15.42,Math.PI,true);facadeBox(retreat,0,17.0,-16.0,35.2,6.0,32,material(0x454b4d));
 const upperLogan=root(349.18,15.40,Math.PI);for(let k=0;k<9;k++){const x=-15.6+k*3.9;for(const y of [15.44,18.35]){pane(upperLogan,x,y,3.59,2.6,.17,0x3d4447,k%3,false);box(upperLogan,x,y,.25,.065,2.6,.10,0x475051);}}
 box(upperLogan,0,20.02,.15,35.4,.24,.38,0x586060);
 const railing=new T.MeshStandardMaterial({color:0x9eaaa3,transparent:true,opacity:.24,roughness:.3,side:T.DoubleSide,depthWrite:false});
 for(const y of [14.63,20.69]){const rail=new T.Mesh(new T.PlaneGeometry(35.4,1.1),railing);rail.position.set(0,y,y<15?4.53:.08);upperLogan.add(rail);box(upperLogan,0,y+.54,y<15?4.55:.10,35.5,.045,.06,0x50595a);for(let x=-17.5;x<18;x+=1.95)box(upperLogan,x,y,y<15?4.55:.10,.045,1.12,.06,0x50595a);}
 for(const x of [-14.8,13.8])facadeBox(retreat,x,21.60,-11.0,3.4,3.20,6.5,material(0x454e50));
 const loganEast=root(367.13,29.1,Math.PI/2);facadeBox(loganEast,0,9.15,.03,35.0,10.0,.13,loganBrick);for(let x=-15;x<17;x+=4.4)for(const y of [6.1,9.2,12.2])pane(loganEast,x,y,2.3,2.4,.14,0x424b4d,1,false);

 // TD bank at 904: foundation courses, small green awnings, a real raised
 // entrance and side ramp. The upper north wall is unobserved in the videos.
 const td=root(288.26,-8.74);facadeBox(td,0,4.94,-.07,9.62,9.88,.23,buff);facadeBox(td,0,1.05,.09,9.72,2.10,.20,stone);
 for(const y of [.45,1.05,1.74,2.13,7.93,9.55])box(td,0,y,.20,9.82,.09,.20,0xb6ad94);cornice(td,9.9,9.58,0xb1a98e,true);
 const greenCanvas=new T.MeshStandardMaterial({color:0x43b537,roughness:.9,side:T.DoubleSide});
 function greenAwning(g:T.Group,x:number,y:number,w:number){const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute([x-w/2,y,.17,x+w/2,y,.17,x+w/2,y-.67,1.0,x-w/2,y-.67,1.0],3));geom.setIndex([0,2,1,0,3,2]);geom.computeVertexNormals();const mesh=new T.Mesh(geom,greenCanvas);g.add(mesh);box(g,x,y-.72,1.0,w,.12,.05,0x2b9532);}
 for(const x of [-3.08,0,3.08]){pane(td,x,4.56,1.86,4.05,.26,0x6e796e,1,false);greenAwning(td,x,6.76,2.08);box(td,x,7.2,.16,2.35,.16,.26,0xb7a68b);}
 label(td,7,0,8.07,.27,2.00,1.20);
 const tdSide=root(293.35,-17.55,Math.PI/2);facadeBox(tdSide,0,4.90,.03,17.8,9.8,.14,buff);facadeBox(tdSide,0,1.06,.15,17.9,2.12,.22,stone);for(const y of [.45,1.05,1.74,2.13,7.93,9.55])box(tdSide,0,y,.20,17.98,.085,.23,0xb6ad94);
 for(const x of [-5.2,-.9,3.4]){pane(tdSide,x,4.18,1.79,3.52,.29,0x969e98,0,false);greenAwning(tdSide,x,6.24,2.10);box(tdSide,x,6.72,.23,2.25,.18,.34,0xa69c82);for(const dx of [-.92,.92]){box(tdSide,x+dx,6.53,.24,.17,.35,.27,0xb1a58a);box(tdSide,x+dx,6.74,.30,.24,.11,.39,0xb5aa90);}}
 pane(tdSide,-5.2,1.99,1.23,2.83,.35,0xbec5bf,0,false);for(let k=0;k<3;k++)box(tdSide,-5.2,.10+k*.16,1.25-k*.27,1.82,.20,.36,0xa9a79a);
 box(tdSide,-7.45,1.5,.34,.93,1.06,.12,0x656b67);box(tdSide,-7.45,1.56,.43,.56,.49,.09,0x202d2c);box(tdSide,-7.45,1.26,.48,.68,.10,.19,0xb0b5ac);
 box(tdSide,-7.45,1.77,.49,.55,.09,.09,0x858982);box(tdSide,-7.45,1.33,.50,.54,.08,.08,0x555f5c);for(const x of [-7.91,-6.99])box(tdSide,x,1.51,.45,.055,1.10,.08,0x92968b);
 for(let x=-8.8;x<9;x+=2.0)box(tdSide,x,1.03,.272,.010,2.0,.008,0x948d7d);
 const bankInfo=box(tdSide,-3.98,2.54,.39,.29,.87,.025,0x25362b);void bankInfo;label(tdSide,7,-3.98,2.85,.408,.22,.13);for(let k=0;k<6;k++)box(tdSide,-3.98,2.62-k*.066,.410,.20,.010,.006,0xbec6b8);
 // The ramp rises beside the side wall; handrails remain clear of the main walk.
 const ramp=box(tdSide,2.1,.28,1.13,8.9,.14,1.75,0xa3a397);ramp.rotation.z=-.044;
 for(const z of [.37,1.93]){line(tdSide,[-2.2,1.30,z],[6.5,.91,z],.024,0xb7beb7);for(const x of [-2.2,0,2.2,4.4,6.5])box(tdSide,x,.71-(x+2.2)*.022,z,.038,1.06,.038,0xb7beb7);}
 label(tdSide,7,7.2,6.75,1.01,1.20,1.2);
 obstacles.push({x:294.49,z:-19.65,w:1.88,d:8.9,h:.62,tag:'TD raised ramp'},{x:294.28,z:-12.35,w:1.02,d:1.82,h:.55,tag:'TD entrance steps'});

 // WoodGreen's cream panel block sits opposite the park. Its varied small
 // windows and columned base are a very different silhouette from shop rows.
 mass(4434450,VIDEO_HEIGHTS[4434450],material(0xb9b5a5));
 const wood=root(173.42,11.59,Math.PI),ww=54.05;facadeBox(wood,0,9.99,.045,ww,11.56,.18,material(0xc3bcaa));box(wood,0,15.79,.12,ww,.21,.41,0x718b78);box(wood,0,4.20,.20,ww,.63,.63,0xb2b3a8);
 for(let x=-ww/2;x<ww/2;x+=3.45){box(wood,x,9.98,.15,.016,11.50,.018,0x9c9989);for(const y of [6.20,9.20,12.20,15.2])box(wood,0,y,.15,ww,.018,.022,0xaaa493);}
 for(let k=0;k<15;k++){const x=-24.2+k*3.4;for(let floor=0;floor<3;floor++){const y=6.31+floor*3.0,w=(k+floor)%4===0?.94:1.23,h=(k+floor)%4===0?.70:1.62;pane(wood,x,y,w,h,.19,0xcbd0c9,(k+floor)%4);if(k%5===1){box(wood,x,y-h/2+.25,.53,.66,.38,.57,0xa0aaa5);for(let j=0;j<5;j++)box(wood,x-.24+j*.12,y-h/2+.24,.83,.055,.22,.02,0x697771);}}}
 facadeBox(wood,0,1.76,.03,ww,3.5,.11,material(0xe4e3d9));for(let x=-24.3;x<25;x+=4.05){pane(wood,x,2.2,3.02,1.63,.14,0x8b9790,0,false);box(wood,x,2.20,.24,.055,1.6,.085,0x9ea69d);const col=new T.Mesh(new T.CylinderGeometry(.20,.24,3.72,12),stone);col.position.set(x+1.76,1.90,.58);col.castShadow=true;wood.add(col);}
 const woodBooth=root(200.43,19.3,Math.PI/2);facadeBox(woodBooth,0,9.98,.01,15.4,11.55,.15,material(0xc3bcaa));box(woodBooth,0,15.78,.11,15.4,.21,.35,0x718b78);facadeBox(woodBooth,0,1.77,.02,15.4,3.53,.12,material(0xe1e2d9));for(const y of [6.3,9.3,12.3])for(const x of [-5,-1.6,1.8,5.2])pane(woodBooth,x,y,1.16,1.59,.14,0xcbd0c9,1);for(const x of [-5.2,0,5.2])pane(woodBooth,x,2.22,3.35,1.7,.14,0x909a93,0,false);

 // Ground-level shop sequence on the north side. Upper elevations remain
 // conservative support geometry because the walking video frames them out.
 const shopColours:Record<string,number>={'884 Queen St E':0x423e3c,'888 Queen St E':0x555d61,'890 Queen St E':0x84b786,'892 Queen St E':0xb8a48b,'894 Queen St E':0x383f44,'896 Queen St E':0x4a4946,'898 Queen St E':0x404839,'900 Queen St E':0xe2e1d2};
 for(const [address,color] of Object.entries(shopColours)){
  const u=STREET.units.find(u=>u.address===address)!;const g=root(...u.front,u.yaw),w=u.width;
  facadeBox(g,0,5.45,.01,w,3.25,.10,old);for(const x of [-w*.24,w*.24])pane(g,x,5.62,1.12,1.92,.11,0xb2b4a8,1);cornice(g,w,7.10,0x6b6259,true);
  if(address==='894 Queen St E'){
   // Official Roy exterior photograph supplies the left-hand door, three
   // display panes, slatted fascia and narrow striped canopy. The 2026 video
   // corroborates the charcoal paint and framed orange-backed menu at left.
   box(g,0,1.87,.08,w-.10,3.74,.15,color);pane(g,-w*.36,1.45,.96,2.80,.23,0xa6aaa1,3,false);
   for(const x of [-.92,.71,2.34]){pane(g,x,1.90,1.47,2.37,.22,0x3c433f,3,false);box(g,x,.49,.30,1.45,.79,.12,0x383f3b);for(let j=0;j<8;j++)box(g,x-.64+j*.18,.48,.367,.018,.67,.015,0x62685d);box(g,x,.99,.47,1.44,.32,.34,0x3e4540);}
   box(g,0,3.72,.22,w,1.22,.24,0x393e3c);for(let x=-w/2+.12;x<w/2;x+=.13)box(g,x,3.74,.35,.012,1.10,.018,0x596058);
   label(g,22,0,3.90,.382,4.3,.76);label(g,23,0,3.39,.383,2.78,.23);
   const canopy=box(g,0,3.02,.56,w,.045,.76,0x353c38);canopy.rotation.x=.12;box(g,0,2.95,.94,w,.18,.045,0x343b37);
   for(let x=-w/2+.12;x<w/2;x+=.17){const stripe=box(g,x,3.02,.56,.020,.048,.75,0xa79e85);stripe.rotation.x=.12;box(g,x,2.95,.966,.020,.18,.013,0xa79e85);}
   for(const x of [-2.6,-1.3,0,1.3,2.6]){line(g,[x,4.41,.25],[x,4.29,.58],.018,0xb0b3a7);const lamp=new T.Mesh(new T.ConeGeometry(.15,.16,12),material(0xc2c5b8));lamp.position.set(x,4.21,.6);g.add(lamp);}
   box(g,-w/2+.24,1.97,.37,.43,.74,.055,0x282e30);box(g,-w/2+.24,1.97,.403,.36,.66,.01,0xa45d3b);for(const [x,y] of [[-.08,.12],[.08,.12],[0,-.14]]){box(g,-w/2+.24+x,1.97+y,.412,.13,.22,.01,0xd4c7a0);for(let j=0;j<5;j++)box(g,-w/2+.24+x,1.97+y+.07-j*.03,.420,.09,.004,.004,0x655e4e);}
   for(const x of [-1.4,-.5,.3,1.0,1.6,2.3,2.8])for(let j=0;j<3;j++){const leaf=new T.Mesh(new T.SphereGeometry(.12,5,4),material([0x5e7451,0x72835b,0x566747][j]));leaf.scale.set(1.7,.55,1);leaf.position.set(x+.07*j,1.11+.06*j,.60);g.add(leaf);if(j===1){const flower=new T.Mesh(new T.SphereGeometry(.055,5,4),material(0xb96163));flower.position.set(x,1.28,.63);g.add(flower);}}
   continue;
  }
  box(g,0,1.85,.08,w-.10,3.70,.15,color);const shopW=w-1.75;pane(g,-.56,1.95,shopW,2.42,.20,color,3,false);pane(g,w*.35,1.48,.92,2.92,.25,color,0,false);
  box(g,-.56,.46,.25,shopW,.78,.12,color);for(let x=-w/2+.65;x<w/2-1.3;x+=1.28){box(g,x,.47,.32,1.02,.56,.05,0x3c4540);box(g,x,.47,.35,.89,.44,.03,color);}box(g,0,3.68,.20,w-.04,.26,.32,color);
  for(const x of [-w/2+.17,w/2-.17])box(g,x,1.92,.23,.17,3.85,.25,color);
  if(address==='892 Queen St E'){
   label(g,11,0,3.82,.41,w-.2,.32);
   box(g,-.56,1.15,.225,shopW,.76,.018,0xabb8b2);
   for(const x of [-1.72,-.56,.60])label(g,20,x,1.56,.235,1.07,.17);
   for(const x of [-1.64,-.34,.96])box(g,x,2.03,.292,.055,2.44,.09,color);
   box(g,-.56,2.91,.30,shopW,.065,.13,color);box(g,-.56,3.20,.25,shopW,.045,.09,color);
  }
  if(address==='890 Queen St E'){
   label(g,21,-.6,3.49,.39,2.8,.35);
   // The video shows a small illuminated yellow-orange down/right arrow.
   const arrow=material(0xe8ad3e,.6);arrow.emissive.setHex(0xe39a24);arrow.emissiveIntensity=.28;
   const stem=box(g,w*.30,2.99,.49,.48,.11,.08,0xe8ad3e);stem.material=arrow;stem.rotation.z=-.70;
   box(g,w*.34,2.81,.49,.27,.09,.08,0xe8ad3e).material=arrow;box(g,w*.36,2.91,.49,.09,.27,.08,0xe8ad3e).material=arrow;
   for(const x of [-1.97,-.53,.91])box(g,x,2.02,.31,.075,2.6,.14,0x65996b);
  }
  if(address==='888 Queen St E'){
   const canopy=box(g,0,3.65,.59,w-.12,.07,.90,0x9b3640);canopy.rotation.x=.24;box(g,0,3.49,1.01,w-.12,.31,.06,0x8e303a);label(g,24,0,3.50,1.047,2.2,.23);
   for(const x of [-w*.35,w*.35]){line(g,[x,3.30,.18],[x,3.46,.78],.025,0x555f5b);const lamp=new T.Mesh(new T.SphereGeometry(.12,8,6),material(0xd1d7c9));lamp.scale.set(1.4,.65,1.4);lamp.position.set(x,3.28,.55);g.add(lamp);}
  }
  if(address==='884 Queen St E')label(g,25,0,3.61,.39,w-.6,.45);
  if(address==='900 Queen St E'){const hang=label(g,8,w*.38,4.36,.60,1.24,1.02);hang.rotation.y=Math.PI/2;}
  if(['890 Queen St E','892 Queen St E'].includes(address)){
   box(g,w*.41,.82,.38,.23,.32,.15,0x9caaa2);line(g,[w*.41,.10,.40],[w*.41,1.19,.40],.028,0x717e77);line(g,[w*.41,1.19,.40],[w*.24,1.19,.40],.028,0x717e77);
  }
 }
 // Ornamental iron fence visible beside the grey shop (12–18 s). It stays
 // against the frontage, clear of the through sidewalk.
 const fence=root(229.25,-9.08);for(let x=-2.30;x<2.35;x+=.15){box(fence,x,1.1,.12,.022,2.15,.027,0x343d3a);const tip=new T.Mesh(new T.ConeGeometry(.043,.13,4),material(0x343d3a));tip.position.set(x,2.25,.12);fence.add(tip);}for(const y of [.2,.92,2.04])box(fence,0,y,.12,4.8,.035,.045,0x343d3a);for(const x of [-1.2,1.2]){const ring=new T.Mesh(new T.TorusGeometry(.90,.021,5,40),material(0x39403b));ring.position.set(x,1.2,.13);ring.scale.y=.7;fence.add(ring);}
 return {label,root,pane,arch,cornice};
}
