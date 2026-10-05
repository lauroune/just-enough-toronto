import {test,expect} from '@playwright/test';
import {load,scene,start} from './helpers';
for(const [id,east] of [['laneway-east',true],['laneway-west',false]] as const){
 test(`filmed laneway stays clear for Pip and the wide cart ${east?'eastbound':'westbound'}`,async({page})=>{
  test.setTimeout(75000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await load(page,1);await page.locator('[data-action=map]').click();await page.locator(`[data-place=${id}]`).click();
  await page.keyboard.down('w');
  try{await expect.poll(async()=>{const s=await scene(page);expect(s.staticContacts.pip).toEqual([]);expect(s.staticContacts.cart).toEqual([]);return east?s.position.x:-s.position.x;},{timeout:50000,intervals:[200]}).toBeGreaterThan(east?14:52);}
  finally{await page.keyboard.up('w');}
  const s=await scene(page);expect(s.position.z).toBeGreaterThan(-54.5);expect(s.position.z).toBeLessThan(-53.0);expect(errors).toEqual([]);
 });
}
test('bokeh follows Pip through walking, zoom, orbit, resize and reduced motion',async({page})=>{
 test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await start(page);await page.locator('[data-action=map]').click();await page.locator('[data-place=laneway-east]').click();
 const first=await scene(page);expect(first.depthOfField.distance).toBeGreaterThan(3);expect(first.depthOfField.strength).toBe(1);expect(first.reducedMotion).toBe(true);
 await page.mouse.move(700,460);await page.mouse.wheel(0,-320);await page.waitForTimeout(600);
 const close=await scene(page);expect(close.depthOfField.distance).toBeLessThan(first.depthOfField.distance);
 await page.mouse.move(700,460);await page.mouse.down();await page.mouse.move(940,440,{steps:12});await page.mouse.up();
 await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');
 const moved=await scene(page);expect(Number.isFinite(moved.depthOfField.distance)).toBe(true);expect(moved.depthOfField.distance).toBeGreaterThan(.5);
 await page.setViewportSize({width:390,height:844});await expect.poll(async()=>(await scene(page)).canvas.width).toBe(585);
 const portrait=await scene(page);
 expect(portrait.depthOfField.maxRadiusCssPixels).toBeGreaterThanOrEqual(7);
 expect(portrait.depthOfField.maxRadiusCssPixels).toBeLessThanOrEqual(10);
 expect(portrait.depthOfField.maxRadiusPixels/portrait.pixelRatio).toBeCloseTo(portrait.depthOfField.maxRadiusCssPixels,4);
 await page.screenshot({path:`${process.env.EVIDENCE_DIR||'evidence/laneway'}/bokeh-mobile.png`});expect(errors).toEqual([]);
});
test('bokeh can be disabled independently of bloom and contact lighting',async({page})=>{
 await page.goto('/?debug&dof=off');await page.locator('[data-action=start]').click();const s=await scene(page);
 expect(s.depthOfField).toBeNull();expect(s.filmFinish).toBe(true);expect(s.contactOcclusion).toBe(true);
});
