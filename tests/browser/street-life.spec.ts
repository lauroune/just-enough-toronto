import {test,expect} from '@playwright/test';
import {start,scene} from './helpers';
test('moving traffic yields to Pip and resumes after Pip clears its lane',async({page})=>{
 test.setTimeout(60000);await page.emulateMedia({reducedMotion:'no-preference'});await start(page);
 await page.locator('[data-action=map]').click();await page.locator('[data-place=rail-underpass]').click();
 expect((await scene(page)).streetLife.cars).toBe(10);
 await expect.poll(async()=>{const s=await scene(page);return s.streetLife.carPositions[6].speed;},{timeout:18000}).toBeLessThan(.15);
 const stopped=await scene(page);expect(stopped.ambientContacts.pip).toEqual([]);expect(stopped.streetLife.carPositions[6].x).toBeGreaterThan(stopped.position.x+2.7);
 await page.keyboard.down('d');await page.waitForTimeout(1900);await page.keyboard.up('d');
 await expect.poll(async()=>(await scene(page)).streetLife.carPositions[6].speed,{timeout:5000}).toBeGreaterThan(1);
 expect((await scene(page)).ambientContacts.pip).toEqual([]);
});
test('neighbours walk, turn at the end of the pavement, and stop for reduced motion',async({page})=>{
 test.setTimeout(65000);await page.emulateMedia({reducedMotion:'no-preference'});await start(page);
 await page.locator('[data-action=map]').click();await page.locator('[data-place=mercury]').click();
 const first=await scene(page);expect(first.streetLife.walkers).toBeGreaterThanOrEqual(12);
 const idx=first.streetLife.walkingPositions.findIndex((p:any)=>p.start===432);expect(idx).toBeGreaterThanOrEqual(0);
 await expect.poll(async()=>(await scene(page)).streetLife.walkingPositions[idx].x,{timeout:8000}).toBeGreaterThan(435);
 await expect.poll(async()=>(await scene(page)).streetLife.walkingPositions[idx].direction,{timeout:30000}).toBe(-1);
 await page.locator('[data-action=menu]').click();await page.locator('[data-action=motion]').click();await page.getByRole('button',{name:'Close dialog',exact:true}).click();await page.waitForTimeout(150);const p=(await scene(page)).streetLife.walkingPositions[idx];await page.waitForTimeout(600);expect((await scene(page)).streetLife.walkingPositions[idx].x).toBeCloseTo(p.x,3);
});
test('Riverside mural loads and its viewpoint leaves the player clear of the south wall',async({page})=>{
 const failures:string[]=[];page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
 await start(page);await page.locator('[data-action=map]').click();await page.locator('[data-place=riverside-mural]').click();
 const s=await scene(page);expect(s.staticContacts.pip).toEqual([]);expect(s.camera.y).toBeGreaterThan(1.4);
 expect(await page.evaluate(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('river-of-life.webp')))).toBe(true);
 await page.screenshot({path:`${process.env.EVIDENCE_DIR||'evidence/v13'}/riverside-mural.png`});expect(failures).toEqual([]);
});
