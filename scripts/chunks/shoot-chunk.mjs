// Screenshot a designed chunk from street level: `node scripts/chunks/shoot-chunk.mjs <id> [x z heading]`
// Needs the dev server (`npx vite --port 3013`). Writes evidence/chunks/<id>/view-{0..3}.png and prints
// the chunk's own cost (meshes and triangles per layer, build time) against the per-chunk budget.
import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {chromium} from 'playwright';
const [id,...rest]=process.argv.slice(2);if(!id){console.error('usage: shoot-chunk.mjs <id> [x z heading]');process.exit(1);}
const base=process.env.CHUNK_URL??'http://127.0.0.1:3013';
const data=JSON.parse(readFileSync(`src/chunks/areas/${id}/data.json`,'utf8'));
let [x,z,heading]=rest.map(Number);
if(!Number.isFinite(x)){
 // Default viewpoint: the middle of the chunk's longest named street, looking along it.
 const named=data.roads.filter(r=>r.n&&r.w>=6).map(r=>({r,len:r.p.slice(1).reduce((s,q,i)=>s+Math.hypot(q[0]-r.p[i][0],q[1]-r.p[i][1]),0)})).sort((a,b)=>b.len-a.len)[0]?.r;
 const p=named?named.p:[[(data.bounds.left+data.bounds.right)/2,(data.bounds.top+data.bounds.bottom)/2],[(data.bounds.left+data.bounds.right)/2,(data.bounds.top+data.bounds.bottom)/2+1]];
 const i=Math.max(1,Math.floor(p.length/2));x=p[i-1][0];z=p[i-1][1];heading=Math.atan2(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
}
const out=`evidence/chunks/${id}`;mkdirSync(out,{recursive:true});
// Some Linux setups lack libasound for headless Chrome; a user-space copy can live in ~/.local/pwlibs.
const libs=`${homedir()}/.local/pwlibs/root/usr/lib/x86_64-linux-gnu`;
// On WSL with GPU passthrough (/dev/dxg) and WSLg, render on the NVIDIA GPU through Mesa's D3D12
// driver. This needs a real (off-screen) window; headless Chrome falls back to software there.
// CHUNK_GPU=0 forces software rendering.
const wslGpu=process.env.CHUNK_GPU!=='0'&&existsSync('/dev/dxg')&&existsSync('/tmp/.X11-unix/X0');
const env={...process.env,LD_LIBRARY_PATH:[existsSync(libs)&&libs,'/usr/lib/wsl/lib'].filter(Boolean).join(':')};
const browser=await chromium.launch(wslGpu?{channel:'chromium',headless:false,
  args:['--use-angle=gl','--ignore-gpu-blocklist','--ozone-platform=x11','--window-position=-2400,0','--window-size=960,600','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling'],
  env:{...env,GALLIUM_DRIVER:'d3d12',DISPLAY:':0',MESA_D3D12_DEFAULT_ADAPTER_NAME:process.env.CHUNK_GPU_NAME??'NVIDIA'}}
 :{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'],env});
const page=await browser.newPage({viewport:{width:960,height:600}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,300));});
await page.addInitScript(()=>localStorage.setItem('enough-rush-v1',JSON.stringify({rush:true,minimap:true})));
await page.goto(`${base}/?debug&quality=low`,{waitUntil:'commit',timeout:120000});
await page.locator('[data-action="start"]').click({timeout:300000});
await page.waitForFunction(()=>window.__ENOUGH__.rush()?.diagnostics().car,null,{timeout:300000});
await page.keyboard.press('KeyC');await page.waitForTimeout(800);
const place=h=>page.evaluate(([x,z,h])=>window.__ENOUGH__.rush().car.reset(x,1.2,z,h),[x,z,h]);
await place(heading);
await page.waitForFunction(id=>window.__ENOUGH__.rush().diagnostics().chunks?.loaded.includes(id),id,{timeout:300000}).catch(()=>errors.push(`chunk ${id} did not load`));
let worst={calls:0,triangles:0};
for(let k=0;k<4;k++){
 await place(heading+k*Math.PI/2);await page.waitForTimeout(4000);
 await page.screenshot({path:`${out}/view-${k}.png`,timeout:300000});
 const s=await page.evaluate(()=>window.__ENOUGH__.scene());worst={calls:Math.max(worst.calls,s.drawCalls),triangles:Math.max(worst.triangles,s.triangles)};
}
const stats=(await page.evaluate(id=>window.__ENOUGH__.rush().diagnostics().chunks?.stats?.[id],id))??null;
const near=stats?{triangles:stats.triangles.tile+stats.triangles.detail,meshes:stats.meshes.tile+stats.meshes.detail}:null;
const budget={nearTriangles:550000,nearMeshes:160,buildMs:4000},over=near?[near.triangles>budget.nearTriangles&&'triangles',near.meshes>budget.nearMeshes&&'meshes',stats.buildMs>budget.buildMs&&'build time'].filter(Boolean):['not loaded'];
const renderer=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2'),e=gl?.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'unknown';});
console.log(JSON.stringify({id,renderer,chunk:stats,near,budget,overBudget:over,viewpoint:{x:+x.toFixed(1),z:+z.toFixed(1),heading:+heading.toFixed(2)},screenshots:out,wholeScene:{drawCalls:worst.calls,triangles:worst.triangles},errors}));
await browser.close();
