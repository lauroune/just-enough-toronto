import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const out=process.env.FILM_DIR||'evidence/trailer';await mkdir(out,{recursive:true});
const fps=30,duration=4;
const shots=[
 {name:'00-meet-pip',duration:7.2,pip:[-74,6.6],move:[10.8,0],cam:[-71.85,.94,5.55],look:[-74,.67,6.6],heading:Math.PI/2,fov:44,level:true},
 {name:'01-river-sunset',duration:4,pip:[-686,-7.4],move:[-8,0],cam:[-682,1.2,-7.5],look:[-714,2.7,-7.0],heading:-Math.PI/2,fov:45,level:true},
 {name:'02-poulton-golden',duration:4,pip:[-65,6.6],move:[-8,0],cam:[-61.2,1.25,6.4],look:[-90,1.8,-2],heading:-Math.PI/2,fov:46,level:true},
 {name:'03-broadview',duration:3,pip:[-310,6.6],move:[-5,0],cam:[-289,4.4,8],look:[-330,12,-13],heading:-Math.PI/2,fov:48,level:true},
 {name:'04-future-station',duration:3,pip:[-4,17],move:[3,0],cam:[-9,2,21],look:[24,3.3,0],heading:Math.PI/2,fov:48,level:true},
 {name:'05-autumn-queen',duration:3,pip:[213,-6.8],move:[-6,0],cam:[216.5,1.3,-6.8],look:[181,1.9,-5],heading:-Math.PI/2,fov:46,level:true},
 {name:'07-riverside-mural',duration:3,pip:[47,7.8],move:[5,0],cam:[42,1.4,3],look:[51,2,10.9],heading:Math.PI/2,fov:48,level:true},
 {name:'08-eds',duration:3,pip:[349,-5.9],move:[2.1,0],cam:[350.5,2.0,-.8],look:[348.6,2.6,-9],heading:Math.PI/2,fov:48,level:true},
];
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const errors=[];const samples=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5178/?debug&capture&quality=cinematic&dof=off');
 await page.waitForFunction(()=>window.__ENOUGH_CAPTURE__,{timeout:60000});
 await page.locator('[data-action=start]').click();
 await page.addStyleTag({content:'.hud,.screen-shade,.world-prompt,dialog,.world-loading{display:none!important}'});
 await page.waitForTimeout(3500);
 for(const [si,s] of shots.entries()){
  if(!(process.env.SHOTS||'00-meet-pip,02-poulton-golden,03-broadview,04-future-station,05-autumn-queen,07-riverside-mural').split(',').includes(s.name))continue;
  const shotDuration=s.duration??duration;
  const count=fps*shotDuration;
  let encoder;
  if(!process.env.POSTERS){
   encoder=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/${s.name}.mp4`],{stdio:['pipe','inherit','inherit']});
  }
  for(const i of process.env.POSTERS?[0,Math.floor(count/2),count-1]:Array.from({length:count},(_,i)=>i)){
   const t=i/(fps*shotDuration-1),dx=s.move[0]*t,dz=s.move[1]*t;
   const shot={pip:[s.pip[0]+dx,s.pip[1]+dz],camera:[s.cam[0]+dx,s.cam[1],s.cam[2]+dz],target:[s.look[0]+dx,s.look[1],s.look[2]+dz],heading:s.heading,time:8+si*duration+i/fps,dt:1/fps,fov:s.fov,level:s.level};
   await page.evaluate(shot=>window.__ENOUGH_CAPTURE__(shot),shot);
   if(i===0||i===Math.floor(count/2)||i===count-1)await page.screenshot({path:`${out}/${s.name}-${i}.png`});
   if(encoder){const bytes=await page.screenshot({type:'jpeg',quality:95});if(!encoder.stdin.write(bytes))await once(encoder.stdin,'drain');}
   if(i%30===0)samples.push({shot:s.name,frame:i,scene:await page.evaluate(()=>window.__ENOUGH__.scene())});
   if(i%60===0)console.log(`${s.name}: ${i}/${count}`);
  }
  if(encoder){encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error(`Encoder exited ${code}`);}
 }
 const previous=await readFile(`${out}/capture.json`,'utf8').then(JSON.parse).catch(()=>null);const replaced=new Set(samples.map(s=>s.shot));const allSamples=[...(previous?.samples||[]).filter(s=>!replaced.has(s.shot)),...samples];await writeFile(`${out}/capture.json`,JSON.stringify({fps,duration,shots,errors,samples:allSamples},null,2));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
