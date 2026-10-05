import * as T from 'three';

// A shared, alpha-cut branch atlas. The initial authored leaves remain a
// graceful fallback. Once the CC0 scanned leaves load, the same texture is
// updated in place, so every tree does not allocate a separate image/material.
const sharedTextures=new Map<boolean,T.CanvasTexture>();
export function foliageTexture(autumn=false){
 const shared=sharedTextures.get(autumn);if(shared)return shared;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const c=canvas.getContext('2d')!,texture=new T.CanvasTexture(canvas);sharedTextures.set(autumn,texture);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
 let seed=7391;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 type Leaf={x:number;y:number;a:number;w:number;h:number};const leaves:Leaf[]=[];
 const branches:{x0:number;y0:number;x1:number;y1:number}[]=[];
 for(let shoot=0;shoot<6;shoot++){
  const x0=220+(rand()-.5)*50,y0=505,x1=38+shoot*81,y1=30+rand()*85;branches.push({x0,y0,x1,y1});
  for(let n=1;n<15;n++)for(const side of [-1,1]){const t=n/15;leaves.push({x:x0+(x1-x0)*t+side*7,y:y0+(y1-y0)*t,a:side*(.35+rand()*.6),w:15+rand()*13,h:25+rand()*19});}
 }
 function draw(scan?:HTMLCanvasElement){
  c.clearRect(0,0,512,512);c.strokeStyle='#746e52';c.lineWidth=1.25;
  for(const b of branches){c.beginPath();c.moveTo(b.x0,b.y0);c.quadraticCurveTo(b.x1,300,b.x1,b.y1);c.stroke();}
  for(const [i,l] of leaves.entries()){c.save();c.translate(l.x,l.y);c.rotate(l.a);if(scan){c.drawImage(scan,560,424,160,134,-l.w/2,-l.h,l.w,l.h);}else{c.fillStyle=(autumn?['#e5d3ae','#d1c29e','#f0dfba','#c1b293']:['#6a7e4c','#728755','#9caa62','#5b7048'])[i%4];c.beginPath();c.ellipse(0,-l.h/2,l.w/2,l.h/2,0,0,Math.PI*2);c.fill();}c.restore();}
  texture.needsUpdate=true;
 }
 if(autumn){
  // Fine lobed leaves and open twig gaps survive close street-level views.
  // A shared 1K canopy atlas keeps individual leaf edges crisp on Retina.
  canvas.width=canvas.height=1024;c.scale(2,2);c.clearRect(0,0,512,512);
  for(let i=0;i<136;i++){
   const a=i*2.399,r=Math.sqrt((i+.5)/136)*207,x=256+Math.cos(a)*r,y=258+Math.sin(a)*r*.90,size=16+rand()*14;
   c.strokeStyle='#856543aa';c.lineWidth=.9;c.beginPath();c.moveTo(256,340);c.quadraticCurveTo(256+(x-256)*.65,260,x,y);c.stroke();
   c.save();c.translate(x,y);c.rotate(a*.7);const shade=c.createLinearGradient(-size,-size,size,size);shade.addColorStop(0,['#fff4db','#fff1ca','#f8e4b9'][i%3]);shade.addColorStop(.48,'#e9d3a9');shade.addColorStop(1,'#b99b74');c.fillStyle=shade;
   c.beginPath();const ps=[[0,-1],[.23,-.47],[.48,-.72],[.51,-.21],[.89,-.23],[.60,.17],[.69,.49],[.20,.43],[.05,.73],[-.15,.41],[-.65,.46],[-.58,.14],[-.88,-.27],[-.47,-.22],[-.43,-.70],[-.2,-.46]];
   ps.forEach(([xx,yy],k)=>k?c.lineTo(xx*size,yy*size):c.moveTo(xx*size,yy*size));c.closePath();c.fill();
   c.strokeStyle='#9a7f5666';c.lineWidth=.55;c.beginPath();c.moveTo(0,size*.72);c.lineTo(0,-size*.82);for(const side of [-1,1])for(let j=0;j<3;j++){c.moveTo(0,size*(.25-j*.27));c.lineTo(side*size*(.61-j*.10),size*(.15-j*.30));}c.stroke();c.restore();
  }
  texture.needsUpdate=true;return texture;
 }
 draw();
 const color=new Image(),alpha=new Image();let loaded=0;
 const ready=()=>{if(++loaded!==2)return;const scan=document.createElement('canvas');scan.width=scan.height=1024;const ctx=scan.getContext('2d')!;ctx.drawImage(color,0,0,1024,1024);const rgba=ctx.getImageData(0,0,1024,1024);ctx.clearRect(0,0,1024,1024);ctx.drawImage(alpha,0,0,1024,1024);const mask=ctx.getImageData(0,0,1024,1024);for(let i=3;i<rgba.data.length;i+=4){rgba.data[i]=mask.data[i-2];if(autumn){const luminance=rgba.data[i-3]*.25+rgba.data[i-2]*.60+rgba.data[i-1]*.15;rgba.data[i-3]=Math.min(255,luminance*1.55);rgba.data[i-2]=Math.min(255,luminance*1.45);rgba.data[i-1]=Math.min(255,luminance*1.20);}}ctx.putImageData(rgba,0,0);draw(scan);};
 color.onload=alpha.onload=ready;color.src='/materials/foliage-leaf-color.jpg';alpha.src='/materials/foliage-leaf-alpha.png';
 return texture;
}

//One instanced mesh per neighbourhood tile keeps autumn ground detail cheap.
//Leaf scatter is seasonal art direction, not a claim about a particular day.
export function addFallenLeaves(parent:T.Group,sites:[number,number][]){
 const outline=[[0,-1],[.23,-.47],[.48,-.72],[.51,-.21],[.89,-.23],[.60,.17],[.69,.49],[.20,.43],[.05,.73],[-.15,.41],[-.65,.46],[-.58,.14],[-.88,-.27],[-.47,-.22],[-.43,-.70],[-.2,-.46]];
 const shape=new T.Shape(outline.map(p=>new T.Vector2(p[0],p[1]))),geo=new T.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
 const pos=geo.getAttribute('position');for(let i=0;i<pos.count;i++)pos.setY(i,.12*Math.abs(pos.getX(i))+.045*pos.getZ(i));geo.computeVertexNormals();
 const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.93,side:T.DoubleSide});
 let seed=1911;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const tiles=new Map<string,[number,number][]>();for(const site of sites){const key=`${Math.floor(site[0]/100)}:${Math.floor(site[1]/100)}`,list=tiles.get(key)||[];list.push(site);tiles.set(key,list);}
 for(const [key,points] of tiles){const count=points.length*31,mesh=new T.InstancedMesh(geo,mat,count),dummy=new T.Object3D();mesh.name=`autumn leaves ${key}`;const [tx,tz]=key.split(':').map(Number);mesh.userData.center=[tx*100+50,tz*100+50];parent.add(mesh);
  let i=0;for(const [x,z] of points)for(let k=0;k<31;k++){const a=rand()*Math.PI*2,r=.4+rand()*2.3,s=.08+rand()*.060;dummy.position.set(x+Math.cos(a)*r,.078+rand()*.003,z+Math.sin(a)*r);dummy.rotation.set((rand()-.5)*.12,rand()*6.28,(rand()-.5)*.13);dummy.scale.set(s*(.7+rand()*.4),s,s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color([0xd79a4e,0xc66c42,0xb75849,0xe5b765,0xb18a58][Math.floor(rand()*5)]));i++;}
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.receiveShadow=true;mesh.castShadow=true;
 }
}
