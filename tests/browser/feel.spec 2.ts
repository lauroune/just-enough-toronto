import {test,expect} from '@playwright/test';
import {start,scene,brief,load} from './helpers';

test('Pip leans into acceleration and braking, and steers its front wheels',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await start(page);
  await page.keyboard.down('w');
  await expect.poll(async()=>(await scene(page)).body.pitch).toBeLessThan(-.02);
  await page.waitForTimeout(550);await page.keyboard.up('w');
  await expect.poll(async()=>(await scene(page)).body.pitch).toBeGreaterThan(.02);
  await page.waitForTimeout(500);await page.keyboard.down('w');await page.waitForTimeout(350);await page.keyboard.down('d');
  await expect.poll(async()=>Math.abs((await scene(page)).body.steer)).toBeGreaterThan(.04);
  await page.keyboard.up('w');await page.keyboard.up('d');await page.waitForTimeout(800);
  const body=(await scene(page)).body;expect(Math.abs(body.pitch)).toBeLessThan(.02);expect(Math.abs(body.roll)).toBeLessThan(.02);
});

test('a nearby neighbour greets Pip during exploration',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await start(page);await page.keyboard.down('w');
  await expect.poll(async()=>(await scene(page)).greetingNeighbours,{timeout:6500}).toBeGreaterThan(0);
  await page.keyboard.up('w');await brief(page);const p=(await scene(page)).position;await page.waitForTimeout(400);expect((await scene(page)).position).toEqual(p);
});

test('reduced motion keeps the new body suspension still',async({page})=>{
  await start(page);await page.keyboard.down('w');await page.waitForTimeout(250);await page.keyboard.down('d');await page.waitForTimeout(200);
  const body=(await scene(page)).body;expect(body.pitch).toBe(0);expect(body.roll).toBe(0);await page.keyboard.up('w');await page.keyboard.up('d');
});

const skipCases=[
 {name:'light delivery',day:0,ids:['works','entrance'],checks:[]},
 {name:'wide cart at gate',day:1,ids:['works','entrance'],checks:[]},
 {name:'wide cart through park',day:1,ids:['works','entrance','gate'],checks:[]},
 {name:'stale snow memory',day:2,ids:['works','entrance','gate'],checks:[]},
 {name:'refreshed Queen route',day:2,ids:['works','entrance','gate'],checks:['works']},
 {name:'minimal snow brief',day:2,ids:['entrance'],checks:[]},
 {name:'no known route',day:2,ids:['works','entrance','gate','park'],checks:['park'],noRoute:true},
] as const;
// Each scenario gets its own normal timeout and browser context. Seven cold
// neighbourhood loads must not share one 45-second test deadline.
for(const c of skipCases)test(`skip clearance: ${c.name}`,async({page})=>{
 const {load,deliver}=await import('./helpers');
 await load(page,c.day,[...c.ids],[...c.checks]);await deliver(page,!('noRoute' in c));
 expect((await scene(page)).staticContacts).toEqual({pip:[],cart:[]});
});



test('a held crossing direction stays stable while the camera avoids shop walls',async({page})=>{
  await load(page,0);const initial=(await scene(page)).position;
  await page.keyboard.down('d');
  await expect.poll(async()=>(await scene(page)).position.z,{timeout:12000}).toBeGreaterThan(2.5);
  await page.keyboard.up('d');await page.waitForTimeout(300);
  const current=await scene(page);expect(Math.abs(current.position.x-initial.x)).toBeLessThan(.15);expect(current.staticContacts.pip).toEqual([]);
});
