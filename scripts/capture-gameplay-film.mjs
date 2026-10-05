import {chromium} from '@playwright/test';import {spawn} from 'node:child_process';import {once} from 'node:events';import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.FILM_DIR||'evidence/trailer';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});const errors=[],samples=[];let lens={camera:[-3.2,1.4,3],target:[-1,.7,-1],fov:48};p.on('pageerror',e=>errors.push(e.message));
async function step(n=1){for(let j=0;j<n;j++)await p.evaluate(lens=>window.__ENOUGH_CAPTURE_STEP__(1/30,lens),lens);}
async function record(name,frames,action=async()=>{}){
 const e=process.env.POSTERS||(process.env.SHOTS&&!process.env.SHOTS.split(',').includes(name))?null:spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',`${out}/${name}.mp4`],{stdio:['pipe','inherit','inherit']});
 for(let i=0;i<frames;i++){
  await action(i);await step();
  if([0,Math.floor(frames/2),frames-1].includes(i)){await p.screenshot({path:`${out}/${name}-${i}.png`});samples.push({name,frame:i,state:await p.evaluate(()=>window.__ENOUGH__.getState()),scene:await p.evaluate(()=>window.__ENOUGH__.scene())});}
  if(e){const bytes=await p.screenshot({type:'jpeg',quality:97});if(!e.stdin.write(bytes))await once(e.stdin,'drain');}
  if(i%60===0)console.log(`${name} ${i}/${frames}`);
 }
 if(e){e.stdin.end();const [code]=await once(e,'close');if(code)throw Error(`ffmpeg ${code}`);}
}
try{
 await p.goto('http://127.0.0.1:5178/?debug&capture&quality=cinematic&dof=off');await p.waitForFunction(()=>window.__ENOUGH_CAPTURE_STEP__);
 await p.locator('[data-action=start]').click();await p.locator('[data-action=map]').click();await p.locator('[data-place=poulton]').click();await p.waitForTimeout(2500);await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>window.__ENOUGH_CAPTURE_STEP__(0));
 // Offline presentation scaling only. The cards, choices and result are the
 // running game's real DOM and rules; the delivery outcome is never injected.
 await p.addStyleTag({content:'.brief-drawer{width:910px;left:72px;bottom:56px;transform:none;right:auto}*{animation:none!important;transition:none!important}.memory-card{min-height:108px;padding:18px}.memory-card strong{font-size:24px}.memory-card small{font-size:19px}.memory-icon{width:36px;height:36px}.memory-detail strong{font-size:27px}.memory-detail p{font-size:22px}.memory-detail{min-height:114px}.drawer-heading h2{font-size:48px}.detail-toggle,.check-today,.drawer-footer .primary{font-size:23px}.drawer-footer{font-size:26px}.drawer-footer>span{font:650 56px/1 Bricolage Grotesque,sans-serif}.detail-toggle{font-size:28px;padding:16px 22px}.film-focus{outline:5px solid #e6a94f!important;outline-offset:5px!important}.hud-top .top-actions,.objective,.chapter-dots,.toast,.world-prompt{display:none!important}.logo{font-size:46px}.drawer-heading>.eyebrow,.drawer-tip{display:none!important}.travel-status{display:none!important}.result-card{width:560px}.result-card h2{font-size:70px}.result-actions button{font-size:24px}.bottom-hud{display:none!important}'});
 await p.locator('[data-action=brief]').evaluate(e=>e.click());await p.locator('[data-action=select][data-fact=mural]').click();
 await record('06-gameplay',210,async i=>{
  if([20,74].includes(i))await p.locator('[data-action=toggle]').evaluate(e=>e.classList.add('film-focus'));
  if(i===30)await p.locator('[data-action=toggle]').click();
  if(i===54)await p.locator('[data-action=select][data-fact=bakery]').click();
  if(i===84)await p.locator('[data-action=toggle]').click();
  if(i===108)await p.locator('[data-action=select][data-fact=works]').click();
  if(i===145)await p.locator('[data-action=select][data-fact=entrance]').click();
  if(i===185)await p.locator('[data-action=send]:visible').evaluate(e=>e.classList.add('film-focus'));
  if(i===200){lens={camera:[-3.6,1.4,2.1],target:[1.4,.9,0],fov:48};await p.locator('[data-action=send]:visible').click();}
 });
 await step(60);await record('09-delivery',105);
 // Use the existing Skip travel control between edits. Keep the genuine
 // delivery result, and let its camera settle before the arrival shot.
 await p.locator('[data-action=skip]').evaluate(e=>e.click());lens={camera:[2,1.1,-2.8],target:[.2,.5,0],fov:48};await step(35);
 const result=await p.evaluate(()=>window.__ENOUGH__.getState());if(result.mode!=='result'||!result.result?.success)throw Error('Expected a genuinely successful delivery');
 await record('10-delivered',90);
 await writeFile(`${out}/gameplay-report.json`,JSON.stringify({errors,samples,temporalEdit:'The existing Skip travel control advances between travel and arrival shots; no result is fabricated.'},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await b.close();}
