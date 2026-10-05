import * as T from 'three';
import {box,rod,material} from './world';
import {foliageTexture,addFallenLeaves} from './foliage';
import type {Obstacle} from './motion';
type Factory=(x:number,z:number)=>T.Group;

// Video reference, eastbound: City lane polygon 32666 fixes the plan.
// Observed materials/openings are hand fitted to that plan, not a survey.
export const LANE={surface:32666,west:[-54.648,-53.583],east:[19.189,-53.887],
 treeCorrections:{855899:[-24.2,-58.1],855900:[-14.634,-57.4]} as Record<number,number[]>};
function canvas(draw:(c:CanvasRenderingContext2D)=>void,w=1024,h=1024){const e=document.createElement('canvas');e.width=w;e.height=h;draw(e.getContext('2d')!);const t=new T.CanvasTexture(e);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
export function lanewayConcrete(){
 let seed=31666;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const map=canvas(c=>{c.fillStyle='#a5a296';c.fillRect(0,0,1024,1024);for(let i=0;i<95000;i++){c.fillStyle=i%3?'#514e4330':'#e1d8c327';c.fillRect(rand()*1024,rand()*1024,.4+rand()*2,.4+rand()*2);}for(let i=0;i<28;i++){c.strokeStyle='#615e5125';c.lineWidth=.7;c.beginPath();let x=rand()*1024,y=rand()*1024;c.moveTo(x,y);for(let k=0;k<5;k++){x+=rand()*16-6;y+=rand()*15;c.lineTo(x,y);}c.stroke();}});map.repeat.set(.32,.32);
 const mat=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.012,roughness:.84,color:0xbcb9ae,side:T.DoubleSide});mat.userData.streetSurface='laneway concrete';return mat;
}
export function buildLaneway(detail:Factory,obstacles:Obstacle[]){
 const g=detail(-20,-54),v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 let seed=1867156;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const face=(x:number,z:number,yaw=0)=>{const f=new T.Group();f.position.set(x,0,z);f.rotation.y=yaw;g.add(f);return f;};
 const line=(a:number[],b:number[],r=.02,c=0x66695e)=>rod(g,v(a[0],a[1],a[2]),v(b[0],b[1],b[2]),r,c);
 // Continuous central joint and irregular transverse concrete pours. These
 // do not introduce a raised obstacle at either sidewalk crossing.
 for(let x=-49;x<10;x+=3.45){const end=Math.min(x+3.45,10);box(g,(x+end)/2,.039,-53.93,end-x,.008,.025,0x68695f);box(g,x,.040,-53.97,.019,.007,3.76,0x77766b);}
 for(const [x,z,w,d] of [[-37.9,-54.4,2.1,.67],[-27.4,-52.6,1.7,.58],[-8.2,-55.0,2.7,.49]]){const q=box(g,x,.041,z,w,.008,d,0x87887c);q.rotation.y=.05;}
 // The long south wall is painted masonry, with uneven service openings.
 // It must not inherit the repeated brick sash windows of a house frontage.
 const paintedMap=canvas(c=>{c.fillStyle='#b8a38e';c.fillRect(0,0,1024,1024);for(let y=0;y<1024;y+=128){c.strokeStyle='#8d7d6960';c.lineWidth=2;c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();for(let x=(y/128%2)*256;x<1024;x+=512){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+128);c.stroke();}}for(let k=0;k<40000;k++){c.fillStyle=k%2?'#50443914':'#ded0b51a';c.fillRect(rand()*1024,rand()*1024,1+rand()*6,1+rand()*4);}});paintedMap.repeat.set(28.9/3.2,7.2/3.2);
 const wall=face(-32.92,-51.61,Math.PI),surface=box(wall,0,3.6,0,28.9,7.2,.06,0xffffff);surface.material=new T.MeshStandardMaterial({map:paintedMap,bumpMap:paintedMap,bumpScale:.013,color:0xc7b7aa,roughness:.95});
 // Local face coordinates increase westward.
 const paneMat=new T.MeshStandardMaterial({color:0x555e59,roughness:.46,metalness:.17});
 function window(x:number,w:number,h:number,y:number,ac=false){const f=face(x,-51.67,Math.PI);box(f,0,y,0,w+.18,h+.17,.07,0x827b70);const pane=box(f,0,y,.045,w,h,.045,0xffffff);pane.material=paneMat;for(const xx of [-w/2,w/2])box(f,xx,y,.10,.062,h+.13,.12,0x7e7467);box(f,0,y-.07,.10,w,.055,.10,0x9c9486);box(f,0,y-h/2-.1,.15,w+.3,.19,.22,0x9c9283);
  if(ac){box(f,w*.20,y-h/2+.23,.39,.69,.43,.56,0xc2beb2);for(let k=0;k<9;k++)box(f,w*.20-.28+k*.07,y-h/2+.23,.679,.027,.32,.011,0x777a74);}}
 window(-44.8,1.65,1.57,2.12);window(-39.2,1.34,1.61,2.12,true);window(-32.0,1.36,1.68,2.03,true);
 for(const x of [-41.8,-35.2]){const f=face(x,-51.71,Math.PI);box(f,0,1.24,0,.89,2.4,.08,0xd1cfc1);box(f,0,1.61,.052,.63,1.12,.018,0x59665f);box(f,.34,1.08,.12,.05,.20,.07,0x444c45);for(const xx of [-.50,.5])box(f,xx,1.26,.05,.08,2.55,.13,0xa89b87);box(f,0,.03,.18,1.15,.06,.45,0x8b8a7d);}
 // Grey service bay with its shutter, low barred opening, and white door.
 const extension=face(-22.4,-51.66,Math.PI);box(extension,0,2.52,0,7.6,5.04,.11,0xaba797);box(extension,-1.0,2.0,.07,1.74,1.83,.09,0x545d53);for(let k=0;k<12;k++)box(extension,-1,1.17+k*.145,.14,1.63,.10,.08,0xa9a78f);box(extension,-1,.42,.11,1.58,.69,.08,0x413d39);for(let k=0;k<12;k++)box(extension,-1.73+k*.13,.42,.17,.019,.64,.022,0x656258);
 const annex=face(-15.4,-51.94,Math.PI);box(annex,0,1.65,0,5.7,3.3,.08,0x999b87);box(annex,0,3.34,.10,5.85,.12,.27,0x666b61);box(annex,-.8,1.14,.09,.85,2.2,.08,0xc5c6b7);box(annex,-.48,1.07,.16,.04,.17,.05,0x626759);box(annex,.76,1.83,.09,1.19,1.54,.055,0x63716a);box(annex,-.8,2.78,.32,1.61,.43,.68,0x345b62);
 for(const x of [-46.9,-36.9,-26.9,-18.5]){line([x,.05,-51.79],[x,6.85,-51.79],.033,0x9a9d90);line([x,3.68,-51.8],[Math.min(x+9,-18.5),3.68,-51.8],.020,0x8f9385);}
 // Raised wall base and low leaf gutters seen on both sides.
 box(g,-33.0,.075,-51.90,28.9,.15,.36,0x999689);
 // North: private back gardens, horizontal cedar screens, and a garage.
 const timber=[0x9b8869,0x948367,0xa28e6b,0x8a7b61];
 for(let x=-31.0;x< -4.1;x+=2.4){const width=Math.min(2.4,-4.1-x),mid=x+width/2;if(mid> -26.5&&mid< -23.0)continue;box(g,x,1.21,-56.43,.11,2.42,.12,0x716653);for(let k=0;k<12;k++)box(g,mid,.18+k*.167,-56.38,width-.035,.151,.09,timber[k%4]);for(let k=0;k<5;k++)box(g,mid,2.15+k*.055,-56.36,width-.04,.027,.058,0x95896f);}
 const garage=face(-24.2,-56.34);box(garage,0,1.17,0,2.84,2.30,.1,0x7a877c);for(let k=0;k<12;k++)box(garage,0,.16+k*.174,.08,2.64,.144,.06,0x929d89);for(const x of [-1.48,1.48])box(garage,x,1.3,.06,.15,2.6,.20,0x797a63);box(garage,0,2.60,.08,3.17,.17,.36,0x707360);
 obstacles.push({x:-17.55,z:-56.4,w:27.0,d:.19,h:2.43,tag:'laneway fence'});
 // South-east: chain-link boundary and tangled planting, not an open lawn.
 const meshMap=canvas(c=>{c.clearRect(0,0,1024,1024);c.strokeStyle='#9ca89cb8';c.lineWidth=4;for(let i=-1024;i<2048;i+=64){c.beginPath();c.moveTo(i,0);c.lineTo(i+1024,1024);c.moveTo(i,0);c.lineTo(i-1024,1024);c.stroke();}});meshMap.repeat.set(20.0/2,1);
 const mesh=new T.Mesh(new T.PlaneGeometry(20,1.84),new T.MeshStandardMaterial({map:meshMap,alphaTest:.2,side:T.DoubleSide,roughness:.8}));mesh.position.set(-1.65,1.03,-51.50);g.add(mesh);
 for(let x=-11.65;x<9;x+=2.85)line([x,0,-51.5],[x,2.08,-51.5],.044,0x8b978a);line([-11.65,1.95,-51.5],[8.35,1.95,-51.5],.038,0x8b978a);
 obstacles.push({x:-1.65,z:-51.50,w:20,d:.13,h:2.1,tag:'laneway fence'});
 const foliage=new T.MeshStandardMaterial({map:foliageTexture(),alphaTest:.38,side:T.DoubleSide,color:0xaba77c,roughness:1}),card=new T.PlaneGeometry(1,1);
 for(let k=0;k<145;k++){const p=new T.Mesh(card,foliage);p.position.set(-11.6+rand()*19.8,.23+rand()*1.7,-50.98+rand()*.6);p.rotation.set(rand()*.9,rand()*6.28,rand()-.5);p.scale.set(.5+rand()*.4,.5+rand()*.5,1);p.castShadow=p.receiveShadow=true;g.add(p);}
 const sites:[number,number][]=[];for(let x=-47;x<10;x+=2.5)sites.push([x,-52.6],[x,-55.35]);addFallenLeaves(g,sites);
 // Utility services cross the same real lane, with visible sag.
 for(const offset of [0,.24]){const curve=new T.QuadraticBezierCurve3(v(-26,7.1,-57),v(-6,6.22,-54),v(14.35,7.25+offset,-56.68));const cable=new T.Mesh(new T.TubeGeometry(curve,24,.012,4,false),material(0x414a43));g.add(cable);}
}
