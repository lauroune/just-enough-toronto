import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=(process.env.SITE_URL||'http://127.0.0.1:4174').replace(/\/$/,'');
const out=process.env.SITE_EVIDENCE||'evidence/personal-site';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:process.env.VERIFY_HOST_IP?[`--host-resolver-rules=MAP murch.org ${process.env.VERIFY_HOST_IP}, MAP www.murch.org ${process.env.VERIFY_HOST_IP}`]:[]});
const errors=[],results=[];
try {
 const context=await browser.newContext({viewport:{width:1440,height:1100}});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('missing-check'))errors.push(`${r.status()} ${r.url()}`);});
 for(const size of [{width:1440,height:1100},{width:390,height:844}]){
  await page.setViewportSize(size);
  for(const [name,path] of [['home','/'],['post','/enough/'],['build','/enough/build/']]){
   await page.goto(`${base}${path}`);await page.evaluate(()=>document.fonts.ready);
   const check=await page.evaluate(()=>({title:document.title,h1:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length,links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}));
   const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
   results.push({name,width:size.width,...check,accessibility:axe.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>n.target)}))});
   await page.screenshot({path:`${out}/${name}-${size.width}.png`,fullPage:true});
  }
 }
 await page.setViewportSize({width:1440,height:960});await page.goto(`${base}/justenough/?debug`);await page.waitForFunction(()=>window.__ENOUGH__?.scene().drawCalls>0,{}, {timeout:60000});await page.locator('[data-action=start]').click();await page.locator('[data-action=map]').click();await page.locator('[data-place=poulton]').click();await page.waitForTimeout(600);await page.screenshot({path:`${out}/embedded-game.png`});
 const game=await page.evaluate(()=>window.__ENOUGH__.scene());
 const missingStatus=await page.evaluate(async()=> (await fetch('/missing-check.webp')).status);
 const checks={noErrors:errors.length===0,layout:results.every(r=>!r.overflow&&!r.brokenImages),accessibility:results.every(r=>r.accessibility.length===0),game:game.drawCalls>0&&game.mode==='explore',missingAssetReturns404:missingStatus===404};
 await writeFile(`${out}/report.json`,JSON.stringify({checks,results,game,errors},null,2));console.log(JSON.stringify({checks,results:results.map(({links,...r})=>r),errors},null,2));if(Object.values(checks).some(x=>!x))process.exitCode=1;
} finally {await browser.close();}
