import * as T from 'three';
import {box,rod,orb,material} from './world';

// Individual elevations transcribed from exterior photographs. Coordinates are
// tied to the City footprint edges; no facade is moved to improve a camera shot.
// Photo observations, dimensions inferred from them, and sources are separated
// in public/sources.html
type Factory=(x:number,z:number)=>T.Group;
type Palette={red:T.MeshStandardMaterial;aged:T.MeshStandardMaterial;cream:T.MeshStandardMaterial;black:T.MeshStandardMaterial};
function canvas(draw:(c:CanvasRenderingContext2D,w:number,h:number)=>void,w=1024,h=512){
 const el=document.createElement('canvas');el.width=w;el.height=h;draw(el.getContext('2d')!,w,h);const t=new T.CanvasTexture(el);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
}
export function architecturalMaterials():Palette{
 const loader=new T.TextureLoader(),load=(name:string,srgb=false)=>{const t=loader.load(`/materials/${name}.webp`);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
 const red=load('red-colour',true),normal=load('red-normal'),rough=load('red-roughness');
 const aged=load('brick-colour',true),agedNormal=load('brick-normal'),agedRough=load('brick-roughness');
 // Pale new brick has a finer, regular mortar bed than the Victorian stock.
 const creamMap=canvas((c,w,h)=>{c.fillStyle='#a8a393';c.fillRect(0,0,w,h);for(let r=0;r<24;r++)for(let k=-1;k<7;k++){const n=(r*71+k*29+79)%11;c.fillStyle=`rgb(${196+n*2},${191+n*2},${167+n*2})`;c.fillRect(k*w/6+(r%2)*w/12+1,r*h/24+1,w/6-2,h/24-2);}},768,768);creamMap.wrapS=creamMap.wrapT=T.RepeatWrapping;
 return {red:new T.MeshStandardMaterial({map:red,normalMap:normal,normalScale:new T.Vector2(.55,.55),roughnessMap:rough,roughness:.96}),aged:new T.MeshStandardMaterial({map:aged,normalMap:agedNormal,normalScale:new T.Vector2(.42,.42),roughnessMap:agedRough,roughness:1,color:0xe4c1a9}),cream:new T.MeshStandardMaterial({map:creamMap,bumpMap:creamMap,bumpScale:.014,roughness:.9}),black:new T.MeshStandardMaterial({color:0x53585a,normalMap:normal,normalScale:new T.Vector2(.75,.75),roughnessMap:rough,roughness:.92})};
}
export function facadeBox(g:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,scale=1.4){
 const geom=new T.BoxGeometry(w,h,d),p=geom.getAttribute('position'),n=geom.getAttribute('normal'),uv=geom.getAttribute('uv');
 for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i)+z:p.getX(i)+x)/scale,(Math.abs(n.getY(i))>.5?p.getZ(i)+z:p.getY(i)+y)/scale);
 const m=new T.Mesh(geom,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function art(g:T.Group,map:T.Texture,x:number,y:number,z:number,w:number,h:number){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,transparent:true,alphaTest:.04,roughness:.85,side:T.DoubleSide}));m.position.set(x,y,z);g.add(m);return m;}
function line(g:T.Group,a:number[],b:number[],r=.025,color=0x4e5250){rod(g,new T.Vector3(...a as [number,number,number]),new T.Vector3(...b as [number,number,number]),r,color);}

export function buildLandmarkArchitecture(detail:Factory,m:Palette,glass:T.MeshStandardMaterial){
 const front=(x:number,z:number,yaw=0)=>{const g=new T.Group();g.position.set(x,0,z);g.rotation.y=yaw;detail(x,z).add(g);return g;};
 const pane=(g:T.Group,x:number,y:number,w:number,h:number,z=.1,frame=0xced0c5,mat=glass)=>{box(g,x,y,z-.035,w+.11,h+.11,.065,0x333b3b);const p=box(g,x,y,z,w,h,.025,0xffffff);p.material=mat;for(const dx of [-w/2,w/2])box(g,x+dx,y,z+.035,.052,h+.08,.07,frame);for(const dy of [-h/2,h/2])box(g,x,y+dy,z+.035,w+.09,.052,.07,frame);return p;};
 const curtain=canvas((c,w,h)=>{const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#a6b6b8');grad.addColorStop(.4,'#65777a');grad.addColorStop(1,'#46575a');c.fillStyle=grad;c.fillRect(0,0,w,h);for(let x=10;x<w;x+=18){c.fillStyle=x%36===10?'#d3d6cacc':'#eceadaba';c.fillRect(x,12,14,h*.78);}c.fillStyle='#24333577';c.fillRect(0,h*.81,w,h*.19);},256,512);
 const curtainMat=new T.MeshStandardMaterial({map:curtain,roughness:.65});
 const cafeMap=canvas((c,w,h)=>{const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#83989e');sky.addColorStop(.25,'#62767c');sky.addColorStop(.65,'#243236');sky.addColorStop(1,'#20272b');c.fillStyle=sky;c.fillRect(0,0,w,h);c.fillStyle='#aa8e6366';c.fillRect(0,h*.46,w,h*.025);c.fillStyle='#b1b2a933';for(let k=0;k<7;k++){c.fillRect(k*150+30,80,55,190);c.fillStyle='#56616b66';c.fillRect(k*150+35,105,40,80);c.fillStyle='#b1b2a933';}c.fillStyle='#cda77428';for(let k=0;k<4;k++){c.beginPath();c.ellipse(110+k*240,330,70,9,0,0,Math.PI*2);c.fill();c.fillRect(106+k*240,330,6,155);c.fillStyle='#adbbb14d';c.fillRect(86+k*240,309,18,16);c.fillStyle='#cda77428';}c.fillStyle='#ede2b585';for(let k=0;k<3;k++){c.fillRect(120+k*360,20,2,70);c.beginPath();c.ellipse(120+k*360,93,18,7,0,0,Math.PI*2);c.fill();}},1024,512);
 const cafeGlass=new T.MeshStandardMaterial({map:cafeMap,roughness:.36,metalness:.12});
 const sash=(g:T.Group,x:number,y:number,w=1.15,h=2.05,white=0xdde0d4)=>{pane(g,x,y,w,h,.16,white,curtainMat);box(g,x,y-.20,.21,w,.065,.09,white);box(g,x,y-h/2-.10,.15,w+.30,.15,.30,0xd0cbb9);box(g,x,y+h/2+.07,.12,w+.22,.11,.20,white);};
 const cornice=(g:T.Group,w:number,y:number,c=0x393c3b)=>{box(g,0,y,.17,w,.12,.42,c);box(g,0,y+.17,.11,w,.18,.30,c);box(g,0,y+.32,.20,w+.12,.10,.53,c);};
 const awning=(g:T.Group,w:number,z:number,depth:number)=>{const yFront=2.94,yBack=3.85,geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-w/2,yFront,z+depth,w/2,yFront,z+depth,w/2,yBack,z,-w/2,yBack,z],3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({color:0x628eac,roughness:1,side:T.DoubleSide});const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;g.add(mesh);box(g,0,yFront-.13,z+depth,w,.26,.04,0x628eac);for(let x=-w/2;x<=w/2+.1;x+=w/4)line(g,[x,yFront,z+depth],[x,yBack,z],.012,0x4b667b);return {slope:Math.atan2(depth,yBack-yFront),front:z+depth};};
 const pot=(g:T.Group,x:number,z:number,s=.45)=>{const p=new T.Mesh(new T.CylinderGeometry(s,s*.72,.62,12),material(0x444744));p.position.set(x,.31,z);g.add(p);for(let k=0;k<16;k++){const a=k*2.4,r=(k%4)*s/5;line(g,[x,.52,z],[x+Math.sin(a)*r,.75+(k%5)*.13,z+Math.cos(a)*r],.018,0x69704d);for(let j=0;j<3;j++){const leaf=orb(g,x+Math.sin(a)*r,.77+(k%5)*.13+j*.04,z+Math.cos(a)*r,.065,.027,.14,0x647146);leaf.rotation.y=a;}}};
 const bench=(g:T.Group,x:number,z:number,w:number)=>{for(const zz of [-.14,.01,.16])box(g,x,.5,z+zz,w,.07,.12,0xac9673);for(const xx of [-w*.39,w*.39])box(g,x+xx,.25,z,.12,.5,.4,0x9d927d);};

 // 812 Queen E: exactly two upper windows; olive timber, blue canvas, oval logo.
 const bon=front(-14.92,-7.47);facadeBox(bon,0,5.65,.015,6.76,4.5,.07,m.red);
 for(const x of [-1.45,1.4])sash(bon,x,6.25,1.17,2.15);
 box(bon,0,7.85,.08,6.9,.14,.24,0x78756d); // simple coping, not the generic dentil cornice
 for(const x of [-2.74,-1.84,.95,2.03]){pane(bon,x,1.76,.78,1.60,.18,0x585948,cafeGlass);box(bon,x,.49,.14,.89,.86,.14,0x555646);box(bon,x,.49,.23,.68,.61,.03,0x41493d);}
 box(bon,-.72,1.55,.15,.6,3.1,.18,0x535543);box(bon,.05,1.44,.16,.97,2.83,.19,0x242b29);pane(bon,.05,1.57,.86,2.58,.25,0x656959,cafeGlass);line(bon,[.34,1.15,.33],[.34,1.6,.33],.018,0xd0c8ae);
 facadeBox(bon,0,1.51,-.018,6.25,3.02,.10,material(0x4c503e));
 box(bon,-3.27,1.6,.1,.21,3.2,.23,0x8f5843);box(bon,3.25,1.6,.1,.21,3.2,.23,0x8f5843);
 const ba=awning(bon,6.95,.06,1.72);
 const oval=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#e8d878';c.beginPath();c.ellipse(w/2,h/2,w*.47,h*.43,0,0,Math.PI*2);c.fill();c.fillStyle='#6085a0';c.textAlign='center';c.font='italic 37px Georgia';c.fillText('bonjour',w/2,h*.32);c.font='bold 61px Georgia';c.fillText('BRIOCHE',w/2,h*.60);c.font='25px Georgia';c.fillText('BAKERY CAFÉ',w/2,h*.78);},640,260);
 const badge=art(bon,oval,0,3.42,.91,2.48,.91);badge.rotation.x=-ba.slope;
 const valance=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#e9d991';c.textAlign='center';c.font='38px Georgia';c.fillText('BONJOUR BRIOCHE BAKERY CAFÉ',w*.49,h*.66);c.font='31px Georgia';c.fillText('812',w*.042,h*.66);},1536,90);art(bon,valance,0,2.81,ba.front+.028,6.80,.27);
 const oldSign=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.beginPath();c.moveTo(20,58);c.quadraticCurveTo(w/2,-23,w-20,58);c.lineTo(w-52,h-8);c.quadraticCurveTo(w/2,h*.55,52,h-8);c.closePath();c.fillStyle='#d8d6bf';c.fill();c.strokeStyle='#999b81';c.lineWidth=4;c.stroke();c.fillStyle='#8f977c';c.textAlign='center';c.font='italic 33px Georgia';c.fillText('bonjour',w/2,57);c.font='bold 57px Georgia';c.fillText('B R I O C H E',w/2,115);c.font='26px Georgia';c.fillText('BAKERY CAFÉ',w/2,151);},768,192);art(bon,oldSign,0,4.33,.14,2.85,.84);
 const menu=canvas((c,w,h)=>{c.fillStyle='#354446';c.fillRect(0,0,w,h);c.fillStyle='#d5dfcf';c.textAlign='center';c.font='italic 32px Georgia';c.fillText('bonjour',w/2,46);c.font='19px Georgia';['croissants','pain au chocolat','brioche','café au lait'].forEach((s,i)=>c.fillText(s,w/2,92+i*35));},256,300);art(bon,menu,-.70,.67,.27,.47,.72);
 pot(bon,-2.8,1.1,.38);pot(bon,2.7,.32,.33);
 const patio=front(-10.49,-14.9,Math.PI/2);awning(patio,9.1,.1,1.6);for(let x=-4.45;x<=4.45;x+=.12){box(patio,x,.60,1.65,.1,1.14,.075,(Math.round(x*100)%3===0)?0xb1a084:0x91836b);}for(const x of [-4.5,4.5])box(patio,x,1.77,1.65,.1,3.5,.1,0x4d7593);
 // A narrow blue bollard and a bicycle belong to the sidewalk, not giant topiary.
 const bollard=new T.Mesh(new T.CylinderGeometry(.09,.13,.93,12),material(0x385e78));bollard.position.set(-18.06,.47,-6.15);detail(-18,-6).add(bollard);
 const bike=front(-16.6,-5.85,.2);for(const x of [-.61,.61]){const wheel=new T.Mesh(new T.TorusGeometry(.33,.025,6,24),material(0x303537));wheel.position.set(x,.36,0);bike.add(wheel);const rim=new T.Mesh(new T.TorusGeometry(.292,.01,4,24),material(0xabaeaa));rim.position.copy(wheel.position);bike.add(rim);for(let k=0;k<12;k++){const a=k*Math.PI/6;line(bike,[x,.36,0],[x+Math.sin(a)*.29,.36+Math.cos(a)*.29,0],.004,0x929b9a);}}
 for(const [a,b] of [[[-.61,.36,0],[-.23,.84,0]],[[-.23,.84,0],[.12,.37,0]],[[.12,.37,0],[-.61,.36,0]],[[.12,.37,0],[.46,.91,0]],[[.46,.91,0],[-.23,.84,0]],[[.46,.91,0],[.61,.36,0]]] as number[][][])line(bike,a,b,.022,0x396d94);box(bike,-.23,.9,0,.25,.07,.15,0x383b36);line(bike,[.46,.91,0],[.43,1.04,.0]);line(bike,[.43,1.04,-.18],[.43,1.04,.18]);

 // Dark Horse occupies the eastern retail bay of Sync Lofts. The cafe front
 // sits on z=-10.47; the apartment podium west of it sits on z=-8.7.
 const dh=front(-533.15,-10.42);facadeBox(dh,0,3.04,0,9.60,6.08,.10,m.cream,1.4);
 pane(dh,-1.50,3.08,4.60,5.75,.14,0x485050,cafeGlass);
 for(const x of [-2.24,-.77])box(dh,x,3.08,.23,.055,5.75,.06,0x424b4c);
 box(dh,-1.5,3.25,.23,4.6,.066,.08,0x424b4c);box(dh,-1.5,.22,.17,4.75,.28,.15,0xaeb0a7);
 pane(dh,3.31,3.06,1.37,5.76,.12,0x626c6c,cafeGlass);box(dh,3.31,2.43,.23,1.4,.065,.09,0x626c6c);box(dh,3.31,3.83,.23,1.4,.065,.09,0x626c6c);line(dh,[3.61,1.15,.25],[3.61,1.6,.25],.022,0xb4b9b5);
 const star=(c:CanvasRenderingContext2D,x:number,y:number,r:number)=>{c.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4-Math.PI/2,rr=k%2?r*.26:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.stroke();};
 const dhType=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#eeeede';c.strokeStyle='#eeeede';c.lineWidth=3;c.textAlign='left';c.font='700 112px Arial';['DA','RK','HOR','SE','ESP','RES','SO'].forEach((s,i)=>{const yy=111+i*135;c.fillText(s,24,yy);if([0,1,3,6].includes(i))star(c,s==='DA'?18:235,yy-45,36);});},330,1024);art(dh,dhType,-2.93,3.11,.26,1.48,5.0);
 const dhHours=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#e9e6dc';c.textAlign='center';c.font='36px Arial';c.fillText('EST. 2006',w/2,72);},320,120);art(dh,dhHours,-.15,.94,.25,.82,.24);
 box(dh,-1.5,6.13,.90,5.18,.22,2.05,0xb4b4a9);
 // Four-level brick podium, glass upper floors stepping away from Queen.
 const sync=front(-547.85,-8.66);const fullW=38.7;
 for(const y of [7.77,10.93,14.08]){box(sync,0,y-1.49,.02,fullW,.16,.23,0xacafa7);for(let x=-17.7;x<18;x+=3.55){pane(sync,x,y,2.48,2.75,.10,0x5c6567);box(sync,x,y,.17,.047,2.75,.08,0x687174);}}
 for(let level=0;level<4;level++){const y=15.75+level*3.12,z=-2.5-level*1.10,w=37.5-level*.8;box(sync,0,y,z-9,w,3.12,18,0x52646b);box(sync,0,y-1.56,z-.20,w+.55,.18,1.1,0xbcbeb4);for(let x=-w/2+1.05;x<w/2;x+=2.05){pane(sync,x,y,1.95,2.91,z+.05,0x929b99);box(sync,x,y-.5,z+.10,1.96,.055,.055,0x68767a);}box(sync,0,y-.99,z+.8,w,.92,.055,0x83999d);for(let x=-w/2;x<w/2;x+=1.5)box(sync,x,y-.96,z+.87,.035,1,.035,0x69787b);}
 // The east side repeats the actual tall cafe glazing before residential bays.
 const dhEast=front(-528.29,-20,Math.PI/2);for(let x=-7;x<7;x+=3.2)pane(dhEast,x,3.04,2.7,5.7,.12,0x4d5657,cafeGlass);

 // Mercury: white wraparound glazing, black cornice, chamfered corner door.
 const merc=front(389.78,11.43,Math.PI);facadeBox(merc,0,6.8,0,6.57,6.0,.08,m.red);for(const x of [-1.50,1.35])sash(merc,x,6.20,1.13,2.10,0xd8d9cb);cornice(merc,6.7,8.50,0x323a41);
 box(merc,0,1.85,.04,6.55,3.70,.10,0xe2e2d8);for(const [x,w] of [[-1.55,2.88],[1.55,2.88]]){pane(merc,x,1.74,w,2.65,.15,0xe8e8df,cafeGlass);box(merc,x,2.42,.21,w,.048,.065,0xdee2d9);}cornice(merc,6.68,3.79,0x27323a);
 const corner=front(393.93,12.06,2.287);box(corner,0,1.72,.04,2.19,3.44,.11,0xe2e2d9);pane(corner,0,1.47,1.66,2.84,.15,0xe5e7dd,cafeGlass);box(corner,0,1.36,.23,.060,2.64,.055,0xe4e7dd);box(corner,0,2.34,.23,1.68,.06,.07,0xe4e7dd);line(corner,[-.12,1.05,.28],[-.12,1.45,.28],.018,0xb4bcb8);
 const mercuryText=canvas((c,w,h)=>{c.fillStyle='#eeede5';c.fillRect(0,0,w,h);c.strokeStyle='#afada3';c.lineWidth=4;c.strokeRect(3,3,w-6,h-6);c.fillStyle='#273339';c.font='200 94px sans-serif';c.save();c.scale(.60,1);c.fillText('MERCURY',52,113);c.fillText('ESPRESSO BAR',52,225);c.restore();},768,268);art(corner,mercuryText,0,3.30,.32,2.38,.88);for(const x of [-.83,.83])line(corner,[x,3.77,.32],[x,4.13,.06],.008,0x70756e);
 const address=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#eeefdf';c.font='72px Arial';c.textAlign='center';c.fillText('915',w/2,91);},256,128);art(corner,address,0,2.60,.26,.70,.38);
 const mercSide=front(394.80,20.7,Math.PI/2);box(mercSide,0,1.85,.03,15.5,3.70,.1,0xd9dcd1);for(let x=-5.9;x<7;x+=2.95){pane(mercSide,x,1.74,2.75,2.65,.13,0xe2e7df,cafeGlass);box(mercSide,x,2.42,.21,2.8,.055,.07,0xdfe5db);}cornice(mercSide,15.8,3.79,0x27333c);bench(merc,0,.75,4.2);bench(mercSide,-4.5,.7,2.6);

 // Amber occupies the Boulton elevation: painted brick remains brick, with
 // tall voussoired arches and timber benches below the sills.
 const amber=front(-63.10,-25.25,Math.PI/2);facadeBox(amber,0,2.45,.025,28.65,4.9,.09,m.black);
 const arch=(g:T.Group,x:number,spring:number,r:number,z:number,mat:T.Material)=>{const s=new T.Shape();s.absarc(0,0,r,0,Math.PI,false);s.lineTo(-r,0);const q=new T.Mesh(new T.ShapeGeometry(s,20),mat);q.position.set(x,spring,z);g.add(q);};
 for(const x of [-11.65,-7.75,-3.85,.05,3.95,7.85,11.75]){const door=Math.abs(x-.05)<.2;pane(amber,x,door?1.55:2.05,2.58,door?3.04:2.05,.15,0x3c4745,cafeGlass);arch(amber,x,3.1,1.29,.15,cafeGlass);const surround=new T.Mesh(new T.TorusGeometry(1.41,.115,5,24,Math.PI),m.black);surround.position.set(x,3.1,.22);amber.add(surround);for(let k=0;k<=14;k++){const a=k*Math.PI/14;line(amber,[x+Math.cos(a)*1.32,3.1+Math.sin(a)*1.32,.235],[x+Math.cos(a)*1.52,3.1+Math.sin(a)*1.52,.235],.009,0x72746b);}box(amber,x,3.08,.25,2.68,.09,.12,0x555c51);box(amber,x,2.11,.24,.05,2.05,.08,0x6e756b);if(!door)box(amber,x,.95,.26,2.87,.18,.37,0xafa693);}
 cornice(amber,28.7,4.93,0x716655);
 const amberLogo=canvas((c,w,h)=>{c.fillStyle='#e3a044';c.fillRect(0,0,w,h);c.fillStyle='#2c392e';c.font='200 119px sans-serif';c.save();c.scale(.61,1);c.fillText('AMBER',24,131);c.restore();c.font='19px Arial';c.fillText('KITCHEN',w*.74,66);c.fillText('+ COFFEE',w*.74,95);},640,180);
 const blade=art(amber,amberLogo,-1.6,4.3,.92,1.65,.73);blade.rotation.y=Math.PI/2;box(amber,-1.6,4.71,.55,.045,.045,1.0,0x434b3d);bench(amber,-5.8,.89,4.2);bench(amber,4,.89,2.8);pot(amber,-1.6,.69,.44);pot(amber,1.6,.70,.36);
 // Compact wall-mounted condenser beside the entry, visible in Amber's photo.
 box(amber,-1.85,3.61,.40,.71,.49,.47,0xb8bcb2);for(let k=0;k<10;k++)box(amber,-2.15+k*.06,3.61,.65,.015,.4,.018,0x6f7c78);

 // Broadview Hotel: square Romanesque tower, paired arched windows, stone
 // corner base, banded brickwork, dormers and a four-sided steep roof.
 const hotel=front(-334.45,-8.88),east=front(-326.99,-27.2,Math.PI/2);
 const archWindow=(g:T.Group,x:number,bottom:number,w:number,h:number)=>{const r=w/2,spring=bottom+h-r;pane(g,x,(bottom+spring)/2,w,spring-bottom,.16,0x858d8c);arch(g,x,spring,r,.16,glass);const ring=new T.Mesh(new T.TorusGeometry(r+.14,.085,5,24,Math.PI),m.red);ring.position.set(x,spring,.19);g.add(ring);box(g,x,bottom-.11,.2,w+.48,.17,.40,0xa49a88);box(g,x,bottom+(h-r)/2,.25,.045,h-r,.06,0xadb5b0);for(const y of [bottom+.7,bottom+1.55])box(g,x,y,.24,w,.045,.06,0xa9b2ac);};
 const hotelFace=(g:T.Group,w:number,xs:number[])=>{facadeBox(g,0,9.2,.00,w,18.4,.07,m.red);for(const y of [4.12,7.55,12.95,17.65])box(g,0,y,.12,w,.17,.31,0xa28b70);cornice(g,w,18.10,0x363f42);for(let x=-w/2+.18;x<w/2;x+=.44)box(g,x,17.84,.12,.16,.28,.35,0x444a4a);for(const x of xs){pane(g,x,2,1.8,3.0,.16,0x5e6b68,cafeGlass);pane(g,x,5.68,1.45,2.66,.18,0x788380);for(const yy of [5.4,6.0])box(g,x,yy,.26,1.45,.06,.07,0x9aa39b);archWindow(g,x,8.25,1.43,3.72);pane(g,x,15.1,1.32,2.65,.18,0x8e9996);box(g,x,15.1,.25,1.32,.075,.075,0xb8beb0);}};
 hotelFace(hotel,14.76,[-6,-3.9,-1.8]);hotelFace(east,36.0,[-10.6,-8.4,-5.8,-3.6,-1.2,1,3.4,5.7,8.0,10.3,12.7,15.0]);
 const tower=front(-330.01,-11.94);facadeBox(tower,0,12.25,0,6.0,24.5,6.0,m.red);const tSouth=front(-330.01,-8.89),tEast=front(-326.96,-11.94,Math.PI/2);
 for(const face of [tSouth,tEast]){for(const y of [.35,.90,1.45,2.0])for(const x of [-2.63,2.63]){box(face,x,y,.13,.78,.48,.32,0x968e7f);for(const off of [-.22,.22])box(face,x+off,y,.30,.35,.4,.04,0xaaa291);}pane(face,0,1.28,3.80,1.36,.16,0x746e60,cafeGlass);for(const x of [-1.1,0,1.1]){const r=x===0?.42:.30;const round=new T.Mesh(new T.CircleGeometry(r,24),glass);round.position.set(x,2.93,.18);face.add(round);const trim=new T.Mesh(new T.TorusGeometry(r+.055,.065,6,24),material(0x8e8069));trim.position.set(x,2.93,.19);face.add(trim);}const groundArch=new T.Mesh(new T.TorusGeometry(2.17,.12,5,32,Math.PI),m.red);groundArch.position.set(0,1.61,.19);face.add(groundArch);for(const x of [-1.21,1.21]){pane(face,x,5.62,1.44,2.60,.14,0x84908d);pane(face,x,10.01,1.47,3.45,.15,0x8b9994);archWindow(face,x,14.0,1.44,4.4);}for(const y of [4.3,7.42,12.61,19.14,21.45,24.29])cornice(face,6.15,y,0x414849);for(let x=-2.75;x<3;x+=.43)box(face,x,20.95,.16,.2,.5,.30,0x754e3b);for(const x of [-2.66,2.66])facadeBox(face,x,15.55,.1,.40,7.1,.31,m.red);for(const x of [-1.4,1.4]){pane(face,x,22.9,1.18,1.67,.17,0x5a635f);box(face,x,23.82,.21,1.48,.14,.45,0x5b605b);}}
 const roof=new T.Mesh(new T.ConeGeometry(4.8,5.65,4),material(0x647071,.66));roof.rotation.y=Math.PI/4;roof.position.set(0,27.18,0);roof.castShadow=true;tower.add(roof);line(tower,[0,29.96,0],[0,30.50,0],.05,0x79837d);
 for(const face of [tSouth,tEast]){box(face,0,25.78,-.15,2.32,2.02,1.38,0x545e60);pane(face,0,25.78,1.18,1.49,.56,0x858f88);box(face,0,26.87,.2,2.70,.16,1.85,0x424d50);}
 // Rooftop addition is set back behind the heritage street walls.
 box(detail(-335,-33),-335,20.65,-34,11.7,4.1,19,0x727e84);const roofFront=front(-335,-24.46);for(let x=-5;x<5.5;x+=1.55)pane(roofFront,x,20.7,1.44,3.75,.10,0x727a78);
 const hotelType=canvas((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#d9d4c1';c.font='37px Georgia';c.textAlign='center';c.fillText('THE BROADVIEW HOTEL',w/2,65);},1024,100);art(hotel,hotelType,-3.60,3.89,.33,6.70,.33);
 return {cafeGlass,curtainMat};
}
