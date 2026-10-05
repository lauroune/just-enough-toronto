import * as T from 'three';
import {project} from './geography';
import {mergeStatic} from './world';
// Geographic centre from OSM; published vertical levels from CN Tower's own
// Builder Design Brief. Radii and concrete profiles are authored estimates.
export const CN_TOWER={longitude:-79.387087,latitude:43.642589,height:553.33,mainObservation:346,skyPod:447,baseY:-12};
export function buildTorontoSkyline(){
 const g=new T.Group();g.name='CN Tower — geographic southwest landmark';const p=project(CN_TOWER.longitude,CN_TOWER.latitude);g.position.set(p[0],CN_TOWER.baseY,p[1]);
 // At three to four kilometres, atmospheric colour already fills much of
 // the silhouette. Local street fog must not erase the entire distant tower.
 const concrete=new T.MeshStandardMaterial({color:0xb4afa5,roughness:.93,fog:false});
 const glass=new T.MeshStandardMaterial({color:0x7f9196,roughness:.48,metalness:.25,fog:false});
 const white=new T.MeshStandardMaterial({color:0xc5beb0,roughness:.8,fog:false});
 const red=new T.MeshStandardMaterial({color:0x9b7c6d,roughness:.9,fog:false});
 const add=(geo:T.BufferGeometry,mat:T.Material,y=0)=>{const mesh=new T.Mesh(geo,mat);mesh.position.y=y;g.add(mesh);return mesh;};
 add(new T.CylinderGeometry(6.8,12.5,330,48),concrete,165);
 // Three tapering buttress blades form the characteristic concrete shaft.
 for(let k=0;k<3;k++){
  const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(32,0);shape.bezierCurveTo(18,65,10,230,7.0,330);shape.lineTo(0,330);shape.closePath();
  const rib=add(new T.ExtrudeGeometry(shape,{depth:3.2,bevelEnabled:false,curveSegments:16}),concrete);rib.rotation.y=k*Math.PI*2/3;rib.position.z=-1.6;
 }
 const body=[[7,327],[14,330],[20.5,337],[21.7,342],[21.7,351],[18.8,356],[10.5,362],[7,365]].map(([r,y])=>new T.Vector2(r,y));
 add(new T.LatheGeometry(body,64),concrete);
 for(const [y,r,h] of [[344,21.78,4.0],[350,21.78,3.4],[355.8,18.9,1.3]])add(new T.CylinderGeometry(r,r,h,64),glass,y);
 for(const y of [341.8,347,352.2])add(new T.CylinderGeometry(21.95,21.95,.58,64),white,y);
 add(new T.CylinderGeometry(5.2,7.0,81.5,48),concrete,405.75);
 const top=[[5.2,441],[8.2,442],[9.2,445],[9.2,449],[6,451],[4.8,453]].map(([r,y])=>new T.Vector2(r,y));add(new T.LatheGeometry(top,48),concrete);add(new T.CylinderGeometry(9.25,9.25,3.2,48),glass,447);
 // Antenna is striped, stepped and ends at the published553.33m height.
 for(const [bottom,topY,r] of [[453,480,4.5],[480,510,3.0],[510,534,1.9],[534,553.33,.95]]){const n=Math.ceil((topY-bottom)/7);for(let i=0;i<n;i++){const h=(topY-bottom)/n;add(new T.CylinderGeometry(r*.9,r,h,24),i%2?red:white,bottom+h*(i+.5));}}
 // Batch the four distant materials without reintroducing local street fog.
 mergeStatic(g);
 return g;
}
