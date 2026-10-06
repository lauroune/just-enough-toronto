import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';

const url=process.env.SITE_URL||'http://127.0.0.1:4174/';
const out=process.env.PAINT_EVIDENCE||'evidence/paint-loading';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:2});
const page=await context.newPage(),cdp=await context.newCDPSession(page);
const frames=[],requests=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
page.on('request',r=>requests.push(r.url()));
try{
 await cdp.send('Network.enable');
 await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:500000,uploadThroughput:125000});
 await cdp.send('Page.enable');
 cdp.on('Page.screencastFrame',event=>{
  frames.push({data:event.data,timestamp:event.metadata.timestamp});
  cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
 });
 await cdp.send('Page.startScreencast',{format:'png',maxWidth:1440,maxHeight:960,everyNthFrame:1});
 await page.goto(url,{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${out}/home-retina.png`,fullPage:true});
 const result=await page.evaluate(()=>({
  fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
  title:document.querySelector('h1').getBoundingClientRect().toJSON(),
  paintBounds:document.querySelector('.paint-landscape').getBoundingClientRect().toJSON(),
  resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.transferSize,end:r.responseEnd})),
  loadedFonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family),
  overflow:document.documentElement.scrollWidth>innerWidth,
  paint:[...document.querySelectorAll('.paint-landscape')].map(e=>getComputedStyle(e).backgroundImage.startsWith('url("data:image/')),
 }));
 // Compare the first visible pixels, not just request completion times.
 const samples=frames.map(({data,timestamp})=>{
  const im=PNG.sync.read(Buffer.from(data,'base64'));let text=0,paint=0;
  const sx=im.width/1440,sy=im.height/960;
  function count(box,predicate){let n=0;for(let y=Math.max(0,Math.floor(box.y*sy));y<Math.min(im.height,Math.ceil((box.y+box.height)*sy));y++)for(let x=Math.max(0,Math.floor(box.x*sx));x<Math.min(im.width,Math.ceil((box.x+box.width)*sx));x++){const i=(y*im.width+x)*4;if(predicate(im.data[i],im.data[i+1],im.data[i+2]))n++;}return n;}
  text=count(result.title,(r,g,b)=>Math.max(r,g,b)<180);
  paint=count(result.paintBounds,(r,g,b)=>Math.max(r,g,b)-Math.min(r,g,b)>65);
  return {timestamp,text,paint};
 });
 const firstText=samples.findIndex(f=>f.text>200),firstPaint=samples.findIndex(f=>f.paint>200);
 const first=Math.min(...[firstText,firstPaint].filter(i=>i>=0));
 if(first>=0)await writeFile(`${out}/first-content-frame.png`,Buffer.from(frames[first].data,'base64'));
 const last=samples.findLast(f=>f.text>200&&f.paint>200);
 const sameFirstFrame=firstText>=0&&firstText===firstPaint;
 const lateRequests=requests.filter(u=>/acrylic-brushstrokes|\/paint\/.*\.(webp|avif)|\/fonts\//.test(u));
 await cdp.send('Page.stopScreencast');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 const before=await page.locator('.paint-landscape').evaluate(e=>getComputedStyle(e).transform);
 await page.mouse.move(160,200);const after=await page.locator('.paint-landscape').evaluate(e=>getComputedStyle(e).transform);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${out}/home-mobile.png`,fullPage:true});
 const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 const checks={sameFirstFrame,paintFullyPresent:result.paint.every(Boolean),noLateAssetRequests:lateRequests.length===0,noOverflow:!result.overflow&&!mobileOverflow,paintFixed:before===after,noErrors:errors.length===0};
 await writeFile(`${out}/report.json`,JSON.stringify({checks,...result,firstText,firstPaint,samples,lateRequests,errors,network:{downloadBytesPerSecond:500000,latency:80},last},null,2));
 console.log(JSON.stringify({checks,fcp:result.fcp,bytes:result.resources.reduce((sum,r)=>sum+r.bytes,0),firstText,firstPaint,errors}));
 if(Object.values(checks).some(v=>!v))process.exitCode=1;
}finally{await browser.close();}
