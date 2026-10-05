import {test,expect} from '@playwright/test';
import {load,brief,memory,deliver,state,scene} from './helpers';

const evidence=process.env.EVIDENCE_DIR||'evidence/river-story';
for(const viewport of [{width:1440,height:960},{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
 test(`river typography and controls fit ${viewport.width}×${viewport.height}`,async({page})=>{
  test.setTimeout(90000);await page.setViewportSize(viewport);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.GAME_PATH||'/'}?debug`);await expect(page.locator('dialog[open] #dialog-title')).toHaveText('Just Enough');
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.game-subtitle')).toHaveText('A Game About Context Engineering.');
  await expect(page.locator('.overview-copy')).toContainText('Compression keeps what is useful for the task.');
  await expect(page.getByRole('button',{name:'Start',exact:true})).toBeVisible();
  await expect(page.locator('.bridge-epigraph')).toHaveCount(0);
  expect(await page.evaluate(()=>document.fonts.check('italic 700 24px "Lobster Two"'))).toBe(true);
  expect(await page.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await page.screenshot({path:`${evidence}/opening-${viewport.width}.png`});
  await page.locator('[data-action=start]').click();
  await expect(page.locator('.objective')).toContainText('Deliver the pastries');
  await page.screenshot({path:`${evidence}/hud-${viewport.width}.png`});
  await brief(page);await memory(page,'gate');
  await page.screenshot({path:`${evidence}/brief-${viewport.width}.png`});
  const fit=await page.locator('.brief-drawer').evaluate(el=>{
   const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,overflow:el.scrollWidth>el.clientWidth+1};
  });
  expect(fit.left).toBeGreaterThanOrEqual(0);expect(fit.top).toBeGreaterThanOrEqual(0);
  expect(fit.right).toBeLessThanOrEqual(viewport.width);expect(fit.bottom).toBeLessThanOrEqual(viewport.height);expect(fit.overflow).toBe(false);
  await page.getByRole('button',{name:'Close brief',exact:true}).click();
  await page.getByRole('button',{name:'About Just Enough',exact:true}).click();
  await expect(page.locator('#dialog-title')).toHaveText('Just Enough');
  await page.getByText('How to play',{exact:true}).click();
  await expect(page.locator('.overview-body details')).toContainText('Keep up to four facts');
  await page.screenshot({path:`${evidence}/idea-${viewport.width}.png`});
  await page.getByRole('button',{name:'Back to game'}).click();
  expect((await state(page)).mode).toBe('explore');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('ending returns to the Don bridge without losing the finished brief or progress',async({page})=>{
 await load(page,2);await brief(page);await memory(page,'works');
 await page.locator('[data-action=refresh]').click();await deliver(page);
 await expect(page.locator('.result-card')).toContainText('Delivered.');
 await page.screenshot({path:`${evidence}/success.png`});
 await page.locator('[data-action=next]').click();
 await expect(page.locator('.ending')).toContainText('Enough, for now.');
 const before=await state(page);await page.screenshot({path:`${evidence}/ending.png`});
 await page.getByRole('button',{name:'Return to the river'}).click();
 const after=await state(page);expect(after.mode).toBe('explore');
 expect(after.brief).toEqual(before.brief);expect(after.attempts).toEqual(before.attempts);expect(after.unlocked).toBe(3);
 expect((await scene(page)).position.x).toBe(-731);
 expect((await scene(page)).staticContacts).toEqual({pip:[],cart:[]});
 await page.screenshot({path:`${evidence}/return-to-river.png`});
});
test('long chapter names remain clear of progress and travel controls on a small phone',async({page})=>{
 await page.setViewportSize({width:320,height:568});await load(page,1);
 await expect(page.locator('.objective')).toContainText('Deliver the 90 cm cart');
 const objective=await page.locator('.objective').boundingBox(),dots=await page.locator('.chapter-dots').boundingBox();
 expect(objective!.y+objective!.height).toBeLessThan(dots!.y);
 await page.locator('[data-action=send]').click();
 const movingObjective=await page.locator('.objective').boundingBox(),travel=await page.locator('.travel-status').boundingBox();
 expect(movingObjective!.y+movingObjective!.height).toBeLessThan(travel!.y);
 await page.screenshot({path:`${evidence}/delivery-320.png`});
 await page.locator('[data-action=skip]').click();await expect(page.locator('.result-card.success')).toBeVisible();
 await page.locator('[data-action=next]').click();await expect(page.locator('.objective')).toContainText('Check today’s route');
 await page.screenshot({path:`${evidence}/third-chapter-320.png`});
});
