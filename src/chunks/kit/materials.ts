import * as T from 'three';
import {architecturalMaterials,facadeBox} from '../../architecture';
import {material} from '../../world';
import {foliageTexture} from '../../foliage';

// One shared set of materials for every chunk, so the batching pass (mergeStatic)
// folds a whole tile into a few draw calls. Never create materials per building:
// use these, or `material(hex)`, which is cached by colour.

const canvas=(draw:(c:CanvasRenderingContext2D,w:number,h:number)=>void,w=512,h=512)=>{const el=document.createElement('canvas');el.width=w;el.height=h;draw(el.getContext('2d')!,w,h);const t=new T.CanvasTexture(el);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
let cached:ReturnType<typeof create>|undefined;
/** Brick tints, as on Queen East: OSM building:colour names, else one of five pale stocks. */
export const BRICK_TINTS:Record<string,number>={red:0xdba28e,'dark red':0xa5796b,brown:0xb5a28e,beige:0xf2e2bd,yellow:0xf7dea1,grey:0xb4b4ac,gray:0xb4b4ac,white:0xf0eee3,black:0x64656a};
export const PALE_BRICKS=[0xf3e3ce,0xe5cbae,0xdbb29c,0xebddd1,0xcfb5a0];
/** Signband colours used for ground-floor shops on Queen East. */
export const SIGNBANDS=[0x3d514d,0xddd6c3,0x393e40,0x9c9282,0x7a3b32,0x2f4d63];

function create(){
 const masonry=architecturalMaterials();
 const glass=new T.MeshStandardMaterial({color:0xe9efed,roughness:.3,metalness:.2,emissive:0x52676e,emissiveIntensity:.1,
  map:canvas((c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#83979c');g.addColorStop(.38,'#6e8288');g.addColorStop(.65,'#485b60');g.addColorStop(1,'#314044');c.fillStyle=g;c.fillRect(0,0,w,h);for(let k=0;k<7;k++){c.fillStyle=['#a4b0ad1a','#192d321a','#d3c8a014'][k%3];c.fillRect(k*84-20,230+(k%3)*40,60,282);}})});
 // Cheap far-LOD facade planes: windows drawn into one texture, metres-based UVs (3.1 m × 3.12 m bays).
 const distantBrick=new T.MeshStandardMaterial({roughness:.88,map:canvas(c=>{c.fillStyle='#aa8c7a';c.fillRect(0,0,512,512);for(let y=0;y<512;y+=12){c.fillStyle='#88796f';c.fillRect(0,y,512,1);}c.fillStyle='#555b5b';c.fillRect(152,90,202,330);c.fillStyle='#778c92';c.fillRect(164,99,178,310);c.fillStyle='#929e9d';c.fillRect(164,99,178,92);c.fillStyle='#c0b8a7';c.fillRect(160,250,188,7);c.fillRect(249,100,7,308);c.fillRect(144,414,217,16);c.fillRect(145,75,215,16);})});
 const distantModern=new T.MeshStandardMaterial({roughness:.5,metalness:.2,map:canvas(c=>{c.fillStyle='#75878d';c.fillRect(0,0,512,512);c.fillStyle='#8b999b';c.fillRect(8,12,242,175);c.fillStyle='#3d4b51';c.fillRect(0,424,512,88);for(const x of [0,252,508]){c.fillStyle='#323b3f';c.fillRect(x,0,5,512);}c.fillRect(0,6,512,5);})});
 const roof=new T.MeshStandardMaterial({color:0x5d605e,roughness:.95});
 const panel=new T.MeshStandardMaterial({color:0xaab3b6,roughness:.62,metalness:.24});
 const concrete=new T.MeshStandardMaterial({color:0xc9c4b8,roughness:.9,map:canvas(c=>{c.fillStyle='#c9c4b8';c.fillRect(0,0,512,512);for(let i=0;i<9000;i++){c.fillStyle=i%2?'#00000010':'#ffffff10';c.fillRect(Math.random()*512,Math.random()*512,2,2);}})});
 const loader=new T.TextureLoader(),road=(kind:string)=>{const t=loader.load(`/materials/road02-${kind}.jpg`);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(1/3,1/3);t.anisotropy=8;return t;};
 const aggregate=loader.load('/materials/video/logan-asphalt.jpg');aggregate.colorSpace=T.SRGBColorSpace;aggregate.wrapS=aggregate.wrapT=T.RepeatWrapping;aggregate.repeat.set(.95/4,1.15/4);aggregate.anisotropy=8;
 const asphalt=new T.MeshStandardMaterial({map:aggregate,normalMap:road('normal'),normalScale:new T.Vector2(.3,.3),roughnessMap:road('roughness'),roughness:.68,color:0xb2b6b3,side:T.DoubleSide});asphalt.userData.streetSurface='asphalt';
 const paving=new T.MeshStandardMaterial({color:0x9d9e94,roughness:.97,side:T.DoubleSide,map:canvas(c=>{c.fillStyle='#b6b6ae';c.fillRect(0,0,512,512);for(let y=0;y<512;y+=128)for(let x=0;x<512;x+=128){c.fillStyle=`hsl(48,4%,${68+((x*7+y*3)%5)*.5}%)`;c.fillRect(x+1,y+1,126,126);c.strokeStyle='#777a7544';c.strokeRect(x+1,y+1,126,126);}})});paving.userData.streetSurface='paving';
 paving.map!.repeat.set(1/2,1/2);
 const lawn=new T.MeshStandardMaterial({color:0xafb693,roughness:1,side:T.DoubleSide,map:canvas(c=>{c.fillStyle='#777d51';c.fillRect(0,0,512,512);for(let i=0;i<30000;i++){c.strokeStyle=`hsla(${65+Math.random()*25},${12+Math.random()*20}%,${25+Math.random()*30}%,.45)`;const x=Math.random()*512,y=Math.random()*512;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.random()*3-1,y-Math.random()*6);c.stroke();}})});lawn.map!.repeat.set(.15,.15);
 const leaves=[false,true].map(autumn=>new T.MeshStandardMaterial({map:foliageTexture(autumn),alphaTest:.45,side:T.DoubleSide,roughness:.85}));
 const bark=new T.MeshStandardMaterial({color:0x5b4a3c,roughness:1});
 return {masonry,glass,distantBrick,distantModern,roof,panel,concrete,asphalt,paving,lawn,leaves,bark,brickCache:new Map<number,T.MeshStandardMaterial>()};
}
export function kitMaterials(){return cached??=create();}
/** A brick material tinted for one building, cached by tint so buildings still batch together. */
export function brick(tint:number){
 const m=kitMaterials();let mat=m.brickCache.get(tint);
 if(!mat){mat=m.masonry.red.clone();mat.color.setHex(tint);m.brickCache.set(tint,mat);}
 return mat;
}
/** Parse OSM building:colour ("red", "#c0a080") into a brick tint, or pick a pale stock from the id. */
export function brickTint(colour:string|undefined,seed:number){
 if(colour){const v=colour.toLowerCase();if(BRICK_TINTS[v])return BRICK_TINTS[v];if(/^#[0-9a-f]{6}$/.test(v))return parseInt(v.slice(1),16);}
 return PALE_BRICKS[Math.abs(seed)%PALE_BRICKS.length];
}
export {material,facadeBox};
