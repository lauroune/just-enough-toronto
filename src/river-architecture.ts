import * as T from 'three';
import {box,rod,material,sign} from './world';
import {facadeBox} from './architecture';
import {GEO,inside} from './geography';
import type {Point} from './game';
import type {buildVideoArchitecture} from './video-architecture';
import type {Obstacle} from './motion';
type Factory=(x:number,z:number)=>T.Group;
export const RIVER_AUTHORED=new Set([4455340,3205250,5177380]);
export function buildRiverArchitecture(tile:Factory,detail:Factory,kit:ReturnType<typeof buildVideoArchitecture>,brick:T.MeshStandardMaterial,obstacles:Obstacle[]){
 const {root,pane}=kit;const red=brick.clone();red.color.setHex(0xd3b39e);const grey=0x464b47,stone=0xd2cbbb;
 const line=(g:T.Group,a:number[],b:number[],r=.025,c=grey)=>rod(g,new T.Vector3(...a as [number,number,number]),new T.Vector3(...b as [number,number,number]),r,c);
 const cornice=(g:T.Group,w:number,y:number)=>{for(const [dy,h,d,c] of [[0,.70,.14,0xd8d3c4],[.40,.16,.35,grey],[.61,.14,.51,grey],[-.47,.12,.37,grey]])box(g,0,y+dy,.18,w,h,d,c);};
 // Studio535 / Carhart lofts: the City footprint is set back and oblique to
 // Queen, not a shop pasted onto the pavement. April 2026 panorama records
 // three upper bays, two lower windows, raised entry and a black dome canopy.
 const studio=GEO.buildings.find(b=>b.id===5177380)!,a535=studio.p[0],b535=studio.p[1],sw=Math.hypot(b535[0]-a535[0],b535[1]-a535[1]),syaw=Math.atan2(a535[1]-b535[1],b535[0]-a535[0]);
 const sf=root((a535[0]+b535[0])/2,(a535[1]+b535[1])/2,syaw);
 sf.name='Studio535 · 535 Queen St E';
 const ss=new T.Shape(studio.p.map(p=>new T.Vector2(p[0],-p[1]))),sg=new T.ExtrudeGeometry(ss,{depth:9.25,bevelEnabled:false});sg.rotateX(-Math.PI/2);
 const sp=sg.getAttribute('position'),sn=sg.getAttribute('normal'),su=sg.getAttribute('uv');for(let k=0;k<sp.count;k++)su.setXY(k,(Math.abs(sn.getX(k))>.5?sp.getZ(k):sp.getX(k))/1.4,sp.getY(k)/1.4);
 const sm=new T.Mesh(sg,red);sm.castShadow=sm.receiveShadow=true;tile(-916,25).add(sm);
 for(const x of [-sw*.33,0,sw*.33]){
  for(const dx of [-.72,.72]){pane(sf,x+dx,7.11,1.19,2.15,.15,0x303a38,1,false);box(sf,x+dx,7.36,.255,1.19,.06,.08,grey);}
  box(sf,x,8.34,.14,2.98,.28,.25,stone);
  if(x!==0){pane(sf,x,3.20,2.9,2.73,.15,0x343c38,3,false);box(sf,x,3.64,.25,2.9,.085,.10,grey);for(const dx of [-.48,.48])box(sf,x+dx,3.20,.25,.06,2.7,.11,grey);box(sf,x,4.73,.13,3.16,.27,.25,stone);pane(sf,x,.54,2.3,.65,.12,grey,0,false);}
 }
 for(const x of [-sw/2+.12,-sw*.165,sw*.165,sw/2-.12])facadeBox(sf,x,5.15,.07,.22,7.95,.18,red);
 for(const y of [1.11,8.83,9.17])box(sf,0,y,.13,sw,.13,.22,y<2?stone:0x686455);
 pane(sf,0,2.87,2.13,2.74,.17,0x272e2d,3,false);box(sf,0,2.87,.285,.11,2.74,.12,grey);
 const canopy=new T.Mesh(new T.SphereGeometry(1,28,12,0,Math.PI*2,0,Math.PI/2),material(0x2c3539,.90));canopy.scale.set(1.54,1.15,1.35);canopy.position.set(0,4.38,.12);canopy.castShadow=true;sf.add(canopy);box(sf,0,4.38,.63,3.02,.14,1.21,0x2b3337);
 sign(sf,'535','',0,4.38,1.255,.43,.17,'#2b3337','#b7b9a4','Arial');
 // Green numerals are the user's recalled studio identity. Placement on a
 // small entrance plaque is provisional; the street photo does not resolve it.
 sign(sf,'535','',1.49,2.26,.19,.55,.35,'#23312b','#87db55','Arial');
 for(let k=0;k<7;k++)box(sf,0,.11+k*.19,2.68-k*.29,2.52,.22,.36,0x929183);
 for(const side of [-1,1]){line(sf,[side*1.34,1.05,2.75],[side*1.34,2.15,.86],.029,grey);for(let k=0;k<7;k++)box(sf,side*1.34,.59+k*.19,2.65-k*.29,.035,.98,.035,grey);}
 const stair=new T.Vector3(0,0,1.6).applyAxisAngle(new T.Vector3(0,1,0),syaw).add(sf.position);
 obstacles.push({x:stair.x,z:stair.z,w:3.75,d:3.65,h:1.45,tag:'Studio535 entrance steps'});
 // 550 Queen /2River: ten Queen bays, three River bays, raised basement,
 // stone entry arch and the1923 top floor above a broad pale sign band.
 const q=root(-914.4,-8.27);facadeBox(q,0,7.35,-13.85,43.46,14.70,27.7,red);
 for(let k=0;k<10;k++){const x=-19.45+k*4.32;for(const [y,h] of [[.64,1.0],[3.48,3.45],[7.73,3.52],[12.70,2.66]]){pane(q,x,y,3.15,h,.14,grey,k%4===0?1:0,false);for(const dx of [-.52,.52])box(q,x+dx,y,.235,.055,h,.09,grey);if(y>2)box(q,x,y+h*.21,.24,3.14,.065,.10,grey);if(y<10)box(q,x,y+h/2+.17,.14,3.42,.19,.23,stone);}if(k<9)facadeBox(q,x+2.14,5.19,.10,.42,9.72,.23,red);}
 cornice(q,43.60,10.55);box(q,0,14.7,.04,43.6,.17,.31,0x66685e);
 const r=root(-892.70,-22.0,Math.PI/2);facadeBox(r,0,7.35,.01,27.3,14.70,.10,red);
 for(const x of [-9.15,0,9.15])for(const [y,h] of [[.64,1.0],[3.48,3.45],[7.73,3.52],[12.70,2.66]]){if(x===0&&y<6)continue;pane(r,x,y,5.34,h,.14,grey,y>10?1:0,false);for(const dx of [-.88,.88])box(r,x+dx,y,.235,.055,h,.09,grey);if(y>2)box(r,x,y+h*.21,.24,5.33,.065,.10,grey);if(y<10)box(r,x,y+h/2+.17,.14,5.60,.19,.23,stone);}
 cornice(r,27.4,10.55);box(r,0,14.7,.04,27.4,.17,.30,0x66685e);
 // Recessed black door and fanlight, framed by individually modelled voussoirs.
 pane(r,0,2.34,3.64,3.43,.16,grey,3,false);for(const x of [-.91,.91])box(r,x,2.30,.27,.078,3.43,.12,grey);box(r,0,4.00,.23,3.92,.18,.20,grey);
 const fan=new T.Mesh(new T.CircleGeometry(1.86,36,0,Math.PI),material(0x45504c));fan.position.set(0,4.00,.19);r.add(fan);
 for(let k=0;k<=10;k++){const a=k*Math.PI/10;line(r,[0,4,.26],[Math.cos(a)*1.83,4+Math.sin(a)*1.83,.26],.025,grey);}
 for(let k=0;k<15;k++){const a=(k+.5)*Math.PI/15,block=box(r,Math.cos(a)*2.08,4+Math.sin(a)*2.08,.22,.44,.47,.37,stone);block.rotation.z=a-Math.PI/2;}
 for(const x of [-2.1,2.1]){box(r,x,2.40,.20,.46,3.20,.33,stone);box(r,x,1.44,.28,.66,.25,.43,stone);box(r,x,4.02,.28,.67,.28,.45,stone);}box(r,0,6.23,.30,.35,.72,.48,stone);
 for(let k=0;k<4;k++)box(r,0,.11+k*.16,1.25-k*.26,4.55,.22,.43,0xa39c89);
 obstacles.push({x:-891.58,z:-22,w:1.55,d:4.6,h:.70,tag:'2 River stone entrance steps'});
 //544: three bays, four floors and a central arched entrance. At Queen the
 //glass-roof atrium separates it from the much longer laundry building.
 const west=root(-948.1,-8.62);facadeBox(west,0,8.40,-16.9,12.1,16.8,33.8,red);
 for(const x of [-4.0,0,4.0])for(const y of [1.9,5.88,10.12,14.25]){if(x===0&&y<4)continue;pane(west,x,y,3.14,x===0&&y===5.88?1.0:2.95,.14,grey,1,false);for(const dx of [-.52,.52])box(west,x+dx,y,.23,.05,x===0&&y===5.88?1.0:2.95,.08,grey);box(west,x,y+.62,.235,3.14,.06,.09,grey);}
 cornice(west,12.25,12.33);for(const x of [-5.7,-2,2,5.7]){facadeBox(west,x,8.40,.08,.38,16.8,.19,red);box(west,x,16.87,.10,.70,.15,.40,0x68685e);}
 pane(west,0,2.00,2.40,3.20,.19,grey,3,false);for(const x of [-1.54,1.54]){const col=new T.Mesh(new T.CylinderGeometry(.17,.19,3.31,12),material(stone));col.position.set(x,2.03,.37);west.add(col);box(west,x,.46,.36,.49,.23,.49,stone);}box(west,0,3.83,.37,3.59,.26,.40,stone);
 const smallFan=new T.Mesh(new T.CircleGeometry(1.22,30,0,Math.PI),material(0x37473f));smallFan.position.set(0,3.98,.16);west.add(smallFan);for(let k=0;k<7;k++){const a=(k+.5)*Math.PI/7,b=box(west,Math.cos(a)*1.41,3.98+Math.sin(a)*1.41,.16,.28,.30,.23,k%2?0x9a6d52:stone);b.rotation.z=a-Math.PI/2;}
 const atrium=root(-939.3,-8.55);const face=new T.Shape();face.moveTo(-3.2,0);face.lineTo(3.2,0);face.lineTo(3.2,16.2);face.lineTo(0,19.8);face.lineTo(-3.2,16.2);face.closePath();const glass=new T.MeshStandardMaterial({color:0x7c9697,roughness:.28,metalness:.25});const ag=new T.Mesh(new T.ShapeGeometry(face),glass);ag.position.z=.12;atrium.add(ag);
 for(let y=.4;y<=16.3;y+=1.05)box(atrium,0,y,.20,6.4,.055,.13,grey);for(const x of [-3.2,-2.13,-1.06,0,1.06,2.13,3.2]){const h=19.8-Math.abs(x)*3.6/3.2;box(atrium,x,h/2,.22,.07,h,.13,grey);}line(atrium,[-3.2,16.2,.22],[0,19.8,.22],.06,grey);line(atrium,[0,19.8,.22],[3.2,16.2,.22],.06,grey);pane(atrium,0,1.55,2.28,2.95,.26,grey,3,false);
 //The glazed pitched roof is real depth, not a facade painted on a tall box.
 for(const side of [-1,1]){const roof=new T.Mesh(new T.PlaneGeometry(4.82,27.2),glass);roof.rotation.x=-Math.PI/2;roof.rotation.y=side*.844;roof.position.set(side*1.6,18,-13.6);atrium.add(roof);for(let z=0;z>-27;z-=2.1)line(atrium,[0,19.8,z],[side*3.2,16.2,z],.043,grey);}
 // River City1's King frontage: a low eight-storey shoulder and a slender
 // sixteen-storey eastern blade, observed in the engineer's project photo.
 // The previous maximum roof height had been applied to the entire block.
 const b=GEO.buildings.find(b=>b.id===3205250)!;const low=material(0x30393d,.64);
 const clip=(poly:Point[],cut:number,keepLeft:boolean)=>{const out:Point[]=[];for(let i=0;i<poly.length;i++){const a=poly[i],c=poly[(i+1)%poly.length],ai=keepLeft?a[0]<=cut:a[0]>=cut,ci=keepLeft?c[0]<=cut:c[0]>=cut;if(ai)out.push(a);if(ai!==ci){const t=(cut-a[0])/(c[0]-a[0]);out.push([cut,a[1]+(c[1]-a[1])*t]);}}return out;};
 for(const [poly,h] of [[clip(b.p,-797.8,true),28.8],[clip(b.p,-797.8,false),55.44]] as [Point[],number][]){
  const s=new T.Shape(poly.map(p=>new T.Vector2(p[0],-p[1]))),geo=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);const mesh=new T.Mesh(geo,low);mesh.castShadow=mesh.receiveShadow=true;tile(-810,75).add(mesh);
  for(let i=0;i<poly.length;i++){const a=poly[i],b1=poly[(i+1)%poly.length],dx=b1[0]-a[0],dz=b1[1]-a[1],len=Math.hypot(dx,dz);if(len<3)continue;const x=(a[0]+b1[0])/2,z=(a[1]+b1[1])/2;let yaw=Math.atan2(-dz,dx);if(inside([x+Math.sin(yaw)*.2,z+Math.cos(yaw)*.2],poly))yaw+=Math.PI;const f=root(x,z,yaw),count=Math.max(1,Math.round(len/3.6)),bw=len/count;
   for(let k=0;k<count;k++){const xx=(k+.5)*bw-len/2;for(let floor=0;floor<(h>40?16:8);floor++){const yy=2.0+floor*3.30;pane(f,xx,yy,bw-.36,floor===0?3.7:2.46,.10,0x333d40,(k+floor)%5===0?1:0,false);box(f,xx,yy,.22,.056,2.47,.11,0x4c5556);if(floor>1&&(k+floor)%3!==0){box(f,xx,yy-1.18,.76,bw-.30,.15,1.65,0x41494b);box(f,xx,yy-.62,1.58,bw-.32,.92,.06,0x697d7d);box(f,xx,yy-.16,1.60,bw-.22,.045,.07,0x373e3f);}}}
   for(let y=4.02;y<h;y+=3.3){box(f,0,y,.17,len,.55,.18,0x353e41);for(let x=-len/2+.6;x<len/2;x+=1.20)box(f,x,y,.268,.009,.48,.014,0x5c6260);}box(f,0,h-.32,.15,len,.55,.18,0x3b4245);
  }
 }
}
