import * as T from 'three';
import {box,sign,groundBox} from './world';
import type {Obstacle} from './motion';

// Completed Queen crossing: Ontario Line on the west, rebuilt GO/VIA bridge
// on the east. Metrolinx April2026 rendering replaces the former masonry arcade.
export const QUEEN_UNDERPASS={west:8,east:66,skew:-.375,centerZ:1.06,arcade:6.7,outer:10,rail:6.38};
export function buildQueenUnderpass(parent:T.Group,obstacles:Obstacle[],paving:T.Material){
 const g=new T.Group();g.userData.terrainRigid=true;g.userData.terrainAnchor=[48,1.06];parent.add(g);const q=QUEEN_UNDERPASS;
 const shift=(x:number,z:number)=>x+z*q.skew;
 // Open sidewalks continue below the bridge without the historical arcade.
 for(const side of [-1,1]){const z=q.centerZ+side*8.05;const m=groundBox(g,shift(37,z),.035,z,61,.04,3.2,0xffffff);m.material=paving as T.MeshStandardMaterial;}
 for(const x of [40,46,52,58,64]){
  const root=new T.Group();root.position.set(x,0,q.centerZ);root.rotation.y=Math.atan(q.skew);g.add(root);
  box(root,0,5.24,0,.55,1.15,21.5,0xbebdb2);box(root,0,5.81,0,6.6,.20,21.5,0xd0cec0);
  for(const z of [-11.3,11.3]){box(root,0,2.48,z,1.4,4.96,1.4,0xbabbb0,.10);const px=x+Math.sin(root.rotation.y)*z,pz=q.centerZ+Math.cos(root.rotation.y)*z;obstacles.push({x:px,z:pz,w:1.6,d:1.6,h:5.2,tag:'station pier'});}
 }
 // River of Life is documented on the south underpass wall. The retained
 // panel uses actual artist footage and BIA photography, not invented motifs.
 // Its precise fit within the future crossing remains an interpretation.
 const wallX=48.8,wallZ=10.92,wallWidth=26.5;
 box(g,wallX,2.52,wallZ,wallWidth,5.04,.46,0x9caaa3,.03);
 obstacles.push({x:wallX,z:wallZ,w:wallWidth,d:.46,h:5.04,tag:'Riverside mural wall'});
 const texture=new T.TextureLoader().load('/materials/video/river-of-life.webp');texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=16;
 const art=new T.Mesh(new T.PlaneGeometry(wallWidth-.06,4.94),new T.MeshStandardMaterial({map:texture,roughness:.94}));
 art.position.set(wallX,2.53,wallZ-.245);art.rotation.y=Math.PI;art.receiveShadow=true;art.name='River of Life · full mural wall';g.add(art);
 // Wall lights and conduit echo the documented underpass scale.
 for(const x of [39.2,49.5,59.8]){box(g,x,4.86,wallZ-.38,.41,.31,.15,0x626b66,.025);const lens=box(g,x,4.86,wallZ-.47,.33,.20,.03,0xffffff);lens.material=new T.MeshStandardMaterial({color:0xffe9ba,emissive:0xffd299,emissiveIntensity:.45});}
 box(g,wallX,4.99,wallZ-.30,25.9,.035,.035,0x727b76);
 const deckShape=new T.Shape();for(const [i,[x,z]] of [[34,-12.5],[67,-12.5],[67,12.5],[34,12.5]].entries()){const px=shift(x,z),pz=q.centerZ+z;if(i===0)deckShape.moveTo(px,-pz);else deckShape.lineTo(px,-pz);}deckShape.closePath();
 const deck=new T.Mesh(new T.ExtrudeGeometry(deckShape,{depth:.22,bevelEnabled:false}),new T.MeshStandardMaterial({color:0xb5b4aa,roughness:.97}));deck.rotation.x=-Math.PI/2;deck.position.y=5.78;deck.castShadow=deck.receiveShadow=true;g.add(deck);
 const lightMat=new T.MeshStandardMaterial({color:0xffebc3,emissive:0xffd49b,emissiveIntensity:.7});
 for(const side of [-1,1])for(let x=11;x<64;x+=7){const lamp=box(g,x,4.68,q.centerZ+side*8.1,2.1,.035,.13,0xffffff);lamp.material=lightMat;}
 const warning=new T.Group();warning.position.set(8,4.76,2);warning.rotation.y=-Math.PI/2;g.add(warning);sign(warning,'4.1 m','↓',0,0,.02,.68,.57,'#d2ac50','#30362d','Arial');
}
