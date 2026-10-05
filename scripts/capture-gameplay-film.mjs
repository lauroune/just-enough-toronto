import {chromium} from '@playwright/test';import {spawn} from 'node:child_process';import {once} from 'node:events';import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.FILM_DIR||'evidence/trailer';await mkdir(out,{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{await p.goto('http://127.0.0.1:5178/?debug&capture&quality=high&dof=off');await p.waitForFunction(()=>window.__ENOUGH_CAPTURE_STEP__);await p.locator('[data-action=start]').click();await p.locator('[data-action=map]').click();await p.locator('[data-place=poulton]').click();await p.waitForTimeout(2500);await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>window.__ENOUGH_CAPTURE_STEP__(0));await p.locator('[data-action=brief]').click();
await p.addStyleTag({content:'.brief-drawer{width:740px;bottom:35px}.memory-card{min-height:86px}.memory-card strong{font-size:17px}.memory-detail strong{font-size:18px}.memory-detail p{font-size:16px}.memory-detail{min-height:88px}.drawer-heading h2{font-size:38px}.detail-toggle,.check-today,.drawer-footer .primary{font-size:16px}.hud-top .top-actions,.objective,.chapter-dots{display:none!important}.logo{font-size:46px}.drawer-heading>.eyebrow,.drawer-tip{display:none!important}'});
const e=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',`${out}/06-gameplay.mp4`],{stdio:['pipe','inherit','inherit']});
for(let i=0;i<270;i++){
 if(i===18)await p.locator('[data-action=select][data-fact=mural]').click();
 if(i===48)await p.locator('[data-action=toggle]').click();
 if(i===78)await p.locator('[data-action=select][data-fact=bakery]').click();
 if(i===108)await p.locator('[data-action=toggle]').click();
 if(i===138)await p.locator('[data-action=send]:visible').click();
 await p.evaluate(()=>window.__ENOUGH_CAPTURE_STEP__(1/30));
 if([0,100,230].includes(i))await p.screenshot({path:`${out}/gameplay-${i}.png`});
 const bytes=await p.screenshot({type:'jpeg',quality:95});if(!e.stdin.write(bytes))await once(e.stdin,'drain');if(i%60===0)console.log(`gameplay ${i}/270`);
}e.stdin.end();const [code]=await once(e,'close');if(code)throw Error(`ffmpeg ${code}`);await writeFile(`${out}/gameplay-report.json`,JSON.stringify({errors,state:await p.evaluate(()=>window.__ENOUGH__.getState())},null,2));if(errors.length)throw Error(errors.join('\n'));}finally{await b.close();}
