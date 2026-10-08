// Which renderer will shoot-chunk.mjs use? `node scripts/chunks/gpu-check.mjs`
import {existsSync} from 'node:fs';import {homedir,cpus} from 'node:os';import {chromium} from 'playwright';
const libs=`${homedir()}/.local/pwlibs/root/usr/lib/x86_64-linux-gnu`,wsl=existsSync('/dev/dxg')&&existsSync('/tmp/.X11-unix/X0');
const env={...process.env,LD_LIBRARY_PATH:[existsSync(libs)&&libs,'/usr/lib/wsl/lib'].filter(Boolean).join(':'),GALLIUM_DRIVER:'d3d12',DISPLAY:':0',MESA_D3D12_DEFAULT_ADAPTER_NAME:process.env.CHUNK_GPU_NAME??'NVIDIA'};
const b=await chromium.launch(wsl?{channel:'chromium',headless:false,args:['--use-angle=gl','--ignore-gpu-blocklist','--ozone-platform=x11','--window-position=-2400,0','--window-size=200,200'],env}:{});
const p=await b.newPage();const r=await p.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2'),e=gl?.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):'no WebGL2';});
await b.close();const software=/swiftshader|llvmpipe|software/i.test(r);
console.log(JSON.stringify({renderer:r,gpu:!software,cpus:cpus().length,advice:cpus().length<6?'WSL has few CPUs; raise processors= in %UserProfile%\\.wslconfig, then wsl --shutdown':'ok'}));
