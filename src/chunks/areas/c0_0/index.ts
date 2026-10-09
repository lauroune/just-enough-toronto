import * as T from 'three';
import type {ChunkModule,ChunkBuilding} from '../../types';

// c0_0: Leslieville, east of Queen East's authored map. Queen St E runs along the north edge
// under the streetcar wires; Eastern Ave crosses the south end with brick lofts and storage;
// between them, rows of semi-detached houses on Empire, Booth and Logan Ave, with garages on the lanes.

const SEMI_BRICKS=[0xb4573f,0xc4a07c,0xa3604a,0xd0bfa0,0x9b5846,0xb98d6b];
const chunk:ChunkModule={
 meta:{
  title:'Leslieville (Queen East & Eastern Ave)',
  character:'Semi-detached brick houses with gables on Empire, Booth and Logan Ave; Queen St E shops under streetcar wires along the north edge; brick lofts, storage and low garages along Eastern Ave.',
  heroes:['433 Eastern Ave brick buildings (Building A and B)','Logan Ave apartment block','XYZ Storage'],
 },
 build(ctx){
  const {kit,data}=ctx;
  kit.streets(ctx);
  kit.parks(ctx);
  for(const b of data.buildings){
   const kind=b.kind??'';
   // 433 Eastern Ave: the two tall brick buildings (City heights 21.8 m and 22.7 m), as warm industrial lofts.
   if(b.name==='Building A'||b.name==='Building B'){kit.building(ctx,b,{style:'industrial',tint:b.name==='Building A'?0xa65d45:0xb36a4d,shopfronts:false});parapet(ctx,b);continue;}
   if(b.name==='XYZ Storage'){kit.building(ctx,b,{style:'industrial',tint:0xb9b7b0,shopfronts:true,signs:['XYZ Storage']});continue;}
   if(b.name==='Experience Garage'){kit.building(ctx,b,{style:'industrial',shopfronts:true,signs:['Experience Garage']});continue;}
   if(kind==='apartments'){kit.building(ctx,b,{style:'modern'});continue;}
   if(kind==='garage'||kind==='industrial'){kit.building(ctx,b,{style:'industrial',shopfronts:false});continue;}
   if(kind==='commercial'||b.h>13){kit.building(ctx,b,{style:'industrial',shopfronts:false});continue;}
   if(isHouse(b)){kit.building(ctx,b,{style:'house',tint:SEMI_BRICKS[kit.hash(b.id)%SEMI_BRICKS.length]});rearWindows(ctx,b);if(b.p.length!==4)gableRoof(ctx,b);continue;}
   kit.building(ctx,b);
  }
  kit.dressStreets(ctx);
  // McCleary Playground (named in OSM): a pair of benches at its centre.
  for(const park of data.parks.filter(p=>p.k==='park'&&p.n)){
   const c=park.p.reduce((s,q)=>[s[0]+q[0]/park.p.length,s[1]+q[1]/park.p.length],[0,0]);
   kit.bench(ctx,c[0]-2,c[1],0);kit.bench(ctx,c[0]+2,c[1],Math.PI);
  }
 },
};

/** Houses, semis and plain mapped buildings of house size on residential streets. */
function isHouse(b:ChunkBuilding){return ['house','detached','semidetached_house','terrace','residential'].includes(b.kind??'')||(!b.kind&&b.h<=11);}

/** The kit only gables four-sided houses; semis mapped with a step get a stylised gable over their oriented bounding box (ridge along the long axis, a chimney at one end). */
function gableRoof(ctx:Parameters<ChunkModule['build']>[0],b:ChunkBuilding){
 const {kit}=ctx,y=kit.baseHeight(b.p)+b.h;
 // Axis: direction of the longest wall.
 let ax=1,az=0,best=0;
 for(let i=0;i<b.p.length;i++){const a=b.p[i],e=b.p[(i+1)%b.p.length],l=Math.hypot(e[0]-a[0],e[1]-a[1]);if(l>best){best=l;ax=(e[0]-a[0])/l;az=(e[1]-a[1])/l;}}
 let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
 for(const [x,z] of b.p){const u=x*ax+z*az,v=-x*az+z*ax;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);}
 const w=v1-v0,rise=Math.min(3.2,w*.42),at=(u:number,v:number,h:number):number[]=>[u*ax-v*az,h,u*az+v*ax];
 const pts=[at(u0,v0,y),at(u1,v0,y),at(u1,v1,y),at(u0,v1,y),at(u0,(v0+v1)/2,y+rise),at(u1,(v0+v1)/2,y+rise)];
 const tri=[0,1,5,0,5,4,3,4,5,3,5,2,0,4,3,1,2,5];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(tri.flatMap(i=>pts[i]),3));g.computeVertexNormals();
 const mat=kit.material([0x5b5048,0x6a625a,0x4f5759,0x7a5f50][kit.hash(b.id)%4],.9);mat.side=T.DoubleSide;
 const roof=new T.Mesh(g,mat);roof.castShadow=roof.receiveShadow=true;
 const c=b.p[0];ctx.layers.tile(c[0],c[1]).add(roof);
 const ch=new T.Mesh(new T.BoxGeometry(.6,1.6,.6),kit.material(0x8c5a48));const [cx,,cz]=at(u0+(u1-u0)*.2,(v0+v1)/2,0);
 ch.position.set(cx,y+rise*.8,cz);ch.castShadow=true;ctx.layers.tile(c[0],c[1]).add(ch);
}

/** Windows on the walls that face no street (house backs): the kit leaves these as plain planes, which reads blank at street scale. */
function rearWindows(ctx:Parameters<ChunkModule['build']>[0],b:ChunkBuilding){
 const {kit}=ctx,y=kit.baseHeight(b.p);
 for(let i=0;i<b.p.length;i++){
  const a=b.p[i],e=b.p[(i+1)%b.p.length],len=Math.hypot(e[0]-a[0],e[1]-a[1]);
  if(len<6||kit.facingStreet(a,e,ctx.data.roads))continue;
  const mid:[number,number]=[(a[0]+e[0])/2,(a[1]+e[1])/2];
  kit.windows(kit.facadeFrame(ctx.layers.detail(...mid),a,e,b.p,y).g,len,b.h,1.2,'house');
 }
}

/** A dark stone coping around a loft roof, stylised: it gives the tall brick boxes a finished skyline. */
function parapet(ctx:Parameters<ChunkModule['build']>[0],b:ChunkBuilding){
 const {kit}=ctx,y=kit.baseHeight(b.p),g=new T.Group();
 for(let i=0;i<b.p.length;i++){
  const a=b.p[i],e=b.p[(i+1)%b.p.length],len=Math.hypot(e[0]-a[0],e[1]-a[1]);if(len<2)continue;
  const m=new T.Mesh(new T.BoxGeometry(len,.7,.5),kit.material(0x8a8378,.9));
  m.position.set((a[0]+e[0])/2,y+b.h+.35,(a[1]+e[1])/2);m.rotation.y=-Math.atan2(e[1]-a[1],e[0]-a[0]);m.castShadow=true;g.add(m);
 }
 ctx.layers.tile(b.p[0][0],b.p[0][1]).add(g);
}
export default chunk;
