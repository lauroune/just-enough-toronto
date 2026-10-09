import * as T from 'three';
import type {ChunkModule,ChunkContext} from '../../types';

// Leslieville / South Riverdale west of Broadview: semi-detached Victorian houses on short
// streets off Eastern Avenue, the Mini Downtown car showrooms along Eastern, a twin-track
// rail line cutting diagonally across the south-west, and Broadview Lofts at the north-west.

const chunk:ChunkModule={
 meta:{
  title:'Leslieville & Broadview',
  character:'Rows of bay-and-gable semis and detached houses on narrow streets (Saulter, Lewis, Strange) off Eastern Avenue; glassy Mini Downtown car showrooms at Eastern and Broadview; a twin-track rail line slicing the south-west; Queen Street East’s streetcar along the northern edge.',
  heroes:['Broadview Lofts','Mini Downtown showrooms'],
 },
 build(ctx){
  const {kit,data}=ctx;
  kit.streets(ctx);
  kit.parks(ctx);
  railLine(ctx);
  for(const b of data.buildings){
   if(b.name==='Mini Downtown'){kit.building(ctx,b,{style:'modern',signs:[b.name]});continue;}
   if(b.name==='Broadview Lofts'){kit.building(ctx,b,{style:'victorian',tint:0xb7745a,shopfronts:false});loftTop(ctx,b.p,b.h);continue;}
   if(b.kind==='construction'){kit.building(ctx,{...b,h:Math.min(b.h,4)},{style:'industrial',shopfronts:false});continue;}
   if(b.kind==='abandoned'){kit.building(ctx,b,{style:'house',tint:0x9a8878,shopfronts:false});continue;}
   if(['industrial','commercial'].includes(b.kind??'')){kit.building(ctx,b,{style:'industrial',shopfronts:false});continue;}
   kit.building(ctx,b);
  }
  kit.dressStreets(ctx,{treeSpacing:10});
  for(const park of data.parks.filter(p=>p.k==='park'&&p.n)){
   const c=park.p.reduce((s,q)=>[s[0]+q[0]/park.p.length,s[1]+q[1]/park.p.length],[0,0]);
   kit.bench(ctx,c[0]-2,c[1],0);kit.bench(ctx,c[0]+2,c[1],Math.PI);
  }
 },
};

/** Mapped heavy-rail lines (OSM `railway=rail`): a ballast bed with two steel rails. Trams are left to the street kit. */
function railLine(ctx:ChunkContext){
 const {kit}=ctx;
 for(const r of ctx.data.rails.filter(r=>r.k==='rail')){
  const mid=r.p[Math.floor(r.p.length/2)],tile=ctx.layers.tile(...mid),detail=ctx.layers.detail(...mid);
  const bed=new T.Mesh(kit.ribbon(r.p,3.6,.07),kit.material(0x7d7770,1));bed.receiveShadow=true;tile.add(bed);
  for(const o of [-.72,.72]){const steel=new T.Mesh(kit.ribbon(r.p,.12,.14,o),kit.material(0x55585c,.5));detail.add(steel);}
 }
}

/** A small brick-and-steel water-tank-less parapet: a stair/lift core on the lofts roof (stylised). */
function loftTop(ctx:ChunkContext,p:[number,number][],h:number){
 const {kit}=ctx,c=p.reduce((s,q)=>[s[0]+q[0]/p.length,s[1]+q[1]/p.length],[0,0]),g=new T.Group();
 g.position.set(c[0],kit.baseHeight(p)+h,c[1]);
 kit.box(g,0,1.5,0,4.5,3,4.5,0xa8694f);kit.box(g,0,3.15,0,5,.3,5,0x85847b);
 ctx.layers.tile(c[0],c[1]).add(g);
}
export default chunk;
