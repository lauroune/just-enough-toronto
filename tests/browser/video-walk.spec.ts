import {test,expect} from '@playwright/test';
import {start,load,scene} from './helpers';
import type {Obstacle} from '../../src/motion';
const contains=(x:number,z:number,o:Obstacle)=>{const p=o.p||[[o.x-o.w/2,o.z-o.d/2],[o.x+o.w/2,o.z-o.d/2],[o.x+o.w/2,o.z+o.d/2],[o.x-o.w/2,o.z+o.d/2]];let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};

for(const chapter of [0,1])test(`filmed north sidewalk remains traversable with ${chapter?'the wide cart':'Pip'}`,async({page})=>{
 test.setTimeout(45000);await load(page,chapter);await page.locator('[data-action=map]').click();await page.locator('[data-place=booth-shops]').click();
 await page.evaluate(()=>{const contacts:string[]=[];(window as any).__videoContacts=contacts;(window as any).__videoMonitor=setInterval(()=>{const s=(window as any).__ENOUGH__.scene();for(const who of ['pip','cart'])contacts.push(...s.staticContacts[who].map((c:string)=>`${who}: ${c}`));},30);});
 const before=await scene(page);await page.keyboard.down('Shift');await page.keyboard.down('w');await expect.poll(async()=>(await scene(page)).position.x,{timeout:14000}).toBeLessThan(220);await page.keyboard.up('w');await page.keyboard.up('Shift');await page.waitForTimeout(500);
 const after=await scene(page);expect(before.position.x-after.position.x).toBeGreaterThan(27);expect(Math.abs(after.position.z+7.95)).toBeLessThan(.25);expect(after.staticContacts).toEqual({pip:[],cart:[]});
 expect(await page.evaluate(()=>{clearInterval((window as any).__videoMonitor);return (window as any).__videoContacts;})).toEqual([]);
});
test('camera orbit respects the corrected Logan ground footprints',async({page})=>{
 await start(page);await page.locator('[data-action=map]').click();await page.locator('[data-place=logan-corner]').click();
 const bounds=await page.evaluate(()=>(window as any).__ENOUGH__.bounds().static) as Obstacle[];
 const corrected=bounds.filter(b=>b.tag?.startsWith('video-corrected'));expect(corrected).toHaveLength(2);
 for(let i=0;i<7;i++){await page.mouse.move(700,450);await page.mouse.down();await page.mouse.move(845,450,{steps:8});await page.mouse.up();await page.waitForTimeout(250);const s=await scene(page);expect(corrected.some(o=>s.camera.y<o.h&&contains(s.camera.x,s.camera.z,o))).toBe(false);expect(s.staticContacts.pip).toEqual([]);}
});

test('De Grassi camera remains outside the completed station',async({page})=>{
 await start(page);await page.locator('[data-action=map]').click();await page.locator('[data-place=degrassi-bend]').click();
 const walls=(await page.evaluate(()=>(window as any).__ENOUGH__.bounds().static) as Obstacle[]).filter(o=>o.tag==='station headhouse');expect(walls).toHaveLength(2);
 for(let i=0;i<8;i++){const s=await scene(page);expect(walls.some(o=>s.camera.y<o.h&&contains(s.camera.x,s.camera.z,o))).toBe(false);expect(s.staticContacts.pip).toEqual([]);await page.mouse.move(700,450);await page.mouse.down();await page.mouse.move(822,450,{steps:8});await page.mouse.up();await page.waitForTimeout(180);}
});

test('Pip follows De Grassi north through the filmed bend without a collision',async({page})=>{
 test.setTimeout(60000);await start(page);await page.locator('[data-action=map]').click();await page.locator('[data-place=degrassi]').click();
 await page.keyboard.down('Shift');await page.keyboard.down('w');await page.keyboard.down('d');await expect.poll(async()=>(await scene(page)).position.x,{timeout:14000}).toBeGreaterThan(19.2);await page.keyboard.up('d');await expect.poll(async()=>(await scene(page)).position.z,{timeout:20000}).toBeLessThan(-67);await page.keyboard.up('w');await page.keyboard.up('Shift');expect((await scene(page)).staticContacts.pip).toEqual([]);
});

test('the corrected west row stays traversable northbound with the wide cart',async({page})=>{
 test.setTimeout(55000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await load(page,1);await page.locator('[data-action=map]').click();await page.locator('[data-place=degrassi-west-row]').click();
 expect((await scene(page)).position.x).toBeCloseTo(22.3);
 await page.evaluate(()=>{(window as any).__westContacts=[];(window as any).__westTimer=setInterval(()=>{const s=(window as any).__ENOUGH__.scene();for(const who of ['pip','cart'])(window as any).__westContacts.push(...s.staticContacts[who]);},35);});
 await page.keyboard.down('Shift');await page.keyboard.down('w');await expect.poll(async()=>(await scene(page)).position.z,{timeout:20000}).toBeLessThan(-129);
 await page.keyboard.up('w');await page.keyboard.up('Shift');await page.waitForTimeout(500);
 expect(await page.evaluate(()=>{clearInterval((window as any).__westTimer);return (window as any).__westContacts;})).toEqual([]);
 expect((await scene(page)).staticContacts).toEqual({pip:[],cart:[]});expect(errors).toEqual([]);
 await page.screenshot({path:`${process.env.EVIDENCE_DIR||'evidence/degrassi-correction'}/north-walk.png`});
});
