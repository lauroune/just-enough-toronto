import {test,expect} from '@playwright/test';
import {start,scene} from './helpers';
test('the railway crossing stays playable and keeps an orbiting camera below its deck',async({page})=>{
 test.setTimeout(60000);await start(page);await page.locator('[data-action=map]').click();await page.locator('[data-place=rail-underpass]').click();
 // Use the north sidewalk. The carriageway now contains real moving traffic.
 await page.keyboard.down('a');await expect.poll(async()=>(await scene(page)).position.z,{timeout:6000}).toBeLessThan(-6.8);await page.keyboard.up('a');await page.waitForTimeout(350);
 await page.keyboard.down('w');await expect.poll(async()=>(await scene(page)).position.x,{timeout:20000}).toBeGreaterThan(34);await page.keyboard.up('w');await page.waitForTimeout(600);
 const inside=await scene(page);expect(inside.position.x).toBeLessThan(45);expect(inside.staticContacts.pip).toEqual([]);
 await page.mouse.move(720,430);await page.mouse.wheel(0,1400);await page.mouse.down();await page.mouse.move(720,780,{steps:12});await page.mouse.up();await page.waitForTimeout(1100);
 const orbit=await scene(page);expect(orbit.camera.y).toBeLessThanOrEqual(3.73);expect(orbit.camera.y).toBeGreaterThan(1.4);expect(orbit.staticContacts.pip).toEqual([]);
 await page.screenshot({path:`${process.env.EVIDENCE_DIR||'evidence/v8/final-regressions'}/underpass-orbit.png`});
 await page.keyboard.press('r');await page.keyboard.down('w');await expect.poll(async()=>(await scene(page)).position.x,{timeout:20000}).toBeGreaterThan(65);await page.keyboard.up('w');
 expect((await scene(page)).staticContacts.pip).toEqual([]);
});
