import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.SITE_EVIDENCE||'evidence/deployment/final';
await mkdir(out,{recursive:true});
const base=process.env.SITE_URL||'https://murch.org';
const browser=await chromium.launch({channel:'chrome',headless:true,args:process.env.VERIFY_HOST_IP?[`--host-resolver-rules=MAP murch.org ${process.env.VERIFY_HOST_IP}`]:[]});
const page=await browser.newPage({viewport:{width:1440,height:960}});
page.setDefaultNavigationTimeout(60000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.locator('a[href="/enough/"]').first().click();
 await page.waitForURL('**/enough/',{waitUntil:'domcontentloaded'});
 await page.locator('video').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
 // Observe a complete natural loop. A fixed 700ms wait after seeking can
 // falsely fail on a cold CDN response while the end of the MP4 is buffering.
 const video=await page.locator('video').evaluate(async v=>{
  v.muted=true;v.currentTime=0;await v.play();
  const start=performance.now(),quality=v.getVideoPlaybackQuality();
  let last=v.currentTime,advanced=0,wraps=false;
  await new Promise(resolve=>{
   const timer=setInterval(()=>{
    const now=v.currentTime;
    if(now+10<last)wraps=true;
    if(now>last)advanced+=now-last;
    last=now;
    if(wraps||performance.now()-start>45000){clearInterval(timer);resolve();}
   },100);
  });
  const finalQuality=v.getVideoPlaybackQuality();
  return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,loop:v.loop,muted:v.muted,advances:advanced>25,wraps,decodedFrames:finalQuality.totalVideoFrames-quality.totalVideoFrames,droppedFrames:finalQuality.droppedVideoFrames-quality.droppedVideoFrames};
 });
 await page.screenshot({path:`${out}/published-trailer.png`,fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
 const motionPaused=await page.locator('video').evaluate(v=>v.paused);
 await page.locator('a[href="/justenough/"]').first().click();
 await page.waitForURL('**/justenough/',{waitUntil:'domcontentloaded'});
 await page.locator('#dialog-title').waitFor({timeout:60000});
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${out}/published-game-intro.png`});
 const font=await page.locator('#dialog-title').evaluate(e=>getComputedStyle(e).fontFamily);
 await page.locator('[data-action=start]').click();
 await page.locator('[data-action=map]').click();
 await page.locator('[data-place=eds]').click();
 await page.waitForTimeout(800);
 await page.screenshot({path:`${out}/published-eds.png`});
 await page.locator('[data-action=help]').click();
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.locator('[data-action=brief]').click();
 await page.screenshot({path:`${out}/published-brief.png`});
 const checks={videoAdvances:video.advances,videoLoops:video.wraps&&video.loop,videoFullHD:video.width===1920&&video.height===1080,trailerDuration:video.duration>28&&video.duration<32,reducedMotionPauses:motionPaused,modernFont:font.includes('Bricolage'),noErrors:errors.length===0};
 await writeFile(`${out}/journey-report.json`,JSON.stringify({checks,video,font,errors,dnsOverride:process.env.VERIFY_HOST_IP||null,tlsValidation:true},null,2));
 console.log(JSON.stringify({checks,video,font,errors}));
 if(Object.values(checks).some(v=>!v))process.exitCode=1;
}finally{await browser.close();}
