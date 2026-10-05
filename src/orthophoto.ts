import * as T from 'three';
import raw from './data/orthophoto.json';
import {queenZ} from './geography';
// Unmodified City aerial imagery supplies mapped private ground and roofscape
// context. It does not substitute for street-level facade photographs.
export function buildOrthophoto(parent:T.Group){
 const loader=new T.TextureLoader();
 for(const tile of raw.tiles.filter(t=>t.runtime)){
  const [a,b,c,d]=tile.corners,steps=72,p:number[]=[],uv:number[]=[],index:number[]=[];
  for(let j=0;j<=steps;j++)for(let i=0;i<=steps;i++){
   const u=i/steps,v=j/steps,x=a[0]+(b[0]-a[0])*u+(d[0]-a[0])*v,z=a[1]+(b[1]-a[1])*u+(d[1]-a[1])*v;
   const valley=x>-804&&x<-594&&Math.abs(z-queenZ(x))>14;
   p.push(x,valley?-6.24:-.24,z);uv.push(u,v);
  }
  for(let j=0;j<steps;j++)for(let i=0;i<steps;i++){const k=j*(steps+1)+i;index.push(k,k+1,k+steps+2,k,k+steps+2,k+steps+1);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(index);geometry.computeVertexNormals();
  const map=loader.load(tile.file);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({map,roughness:1,side:T.DoubleSide,color:0xd4d4d4}));mesh.receiveShadow=true;mesh.name='Toronto 2025 orthophoto ground';parent.add(mesh);
 }
}
