import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const out=process.env.FILM_DIR||'evidence/film';await mkdir(out,{recursive:true});
const fps=30,duration=6;
const shots=[
 {name:'00-meet-pip',pip:[-74,6.6],move:[-2,0],cam:[-76.7,1.0,5.5],look:[-74,.47,6.6],heading:-Math.PI/2,fov:45},
 {name:'01-river-sunset',pip:[-677,-7.4],move:[-7,0],cam:[-669,2.4,-7.6],look:[-707,5,-7],heading:-Math.PI/2,fov:52},
 {name:'02-poulton-golden',pip:[-63,6.6],move:[-6,0],cam:[-54,2.2,4.8],look:[-76,3.1,-3],heading:-Math.PI/2,fov:53},
 {name:'03-broadview',pip:[-307,6.6],move:[-5,0],cam:[-295,2.5,5.6],look:[-331,10,-13],heading:-Math.PI/2,fov:58},
 {name:'04-future-station',pip:[-25,17],move:[4,0],cam:[-34,3.2,20],look:[13,9,-2],heading:Math.PI/2,fov:56},
 {name:'05-autumn-queen',pip:[213,-6.8],move:[-6,0],cam:[223,2.3,-5.0],look:[182,5,-5],heading:-Math.PI/2,fov:54},
];
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5178/?debug&capture&quality=high&dof=off');
 await page.waitForFunction(()=>window.__ENOUGH_CAPTURE__,{timeout:60000});
 await page.locator('[data-action=start]').click();
 await page.addStyleTag({content:'.hud,.screen-shade,.world-prompt,dialog,.world-loading{display:none!important}'});
 await page.waitForTimeout(3500);
 for(const [si,s] of shots.entries()){
  if(process.env.SHOTS&&!process.env.SHOTS.split(',').includes(s.name))continue;
  const count=process.env.POSTERS?1:fps*duration;
  let encoder;
  if(!process.env.POSTERS){
   encoder=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/${s.name}.mp4`],{stdio:['pipe','inherit','inherit']});
  }
  for(let i=0;i<count;i++){
   const t=i/(fps*duration-1),dx=s.move[0]*t,dz=s.move[1]*t;
   const shot={pip:[s.pip[0]+dx,s.pip[1]+dz],camera:[s.cam[0]+dx,s.cam[1],s.cam[2]+dz],target:[s.look[0]+dx,s.look[1],s.look[2]+dz],heading:s.heading,time:8+si*duration+i/fps,dt:1/fps,fov:s.fov};
   await page.evaluate(shot=>window.__ENOUGH_CAPTURE__(shot),shot);
   if(i===0)await page.screenshot({path:`${out}/${s.name}.png`});
   if(encoder){const bytes=await page.screenshot({type:'jpeg',quality:95});if(!encoder.stdin.write(bytes))await once(encoder.stdin,'drain');}
   if(i%60===0)console.log(`${s.name}: ${i}/${count}`);
  }
  if(encoder){encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error(`Encoder exited ${code}`);}
 }
 await writeFile(`${out}/capture.json`,JSON.stringify({fps,duration,shots,errors},null,2));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
