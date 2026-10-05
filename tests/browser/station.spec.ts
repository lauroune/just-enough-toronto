import {test,expect} from '@playwright/test';
import {start,load,scene} from './helpers';
import type {Obstacle} from '../../src/motion';

test('completed station keeps Queen and the northbound bend clear for a wide cart',async({page})=>{
 await load(page,1);const all=await page.evaluate(()=>(window as any).__ENOUGH__.bounds().static) as Obstacle[];
 expect(all.some(o=>/construction|hoarding|delivery works/i.test(o.tag||''))).toBe(false);
 const station=all.filter(o=>o.tag?.startsWith('station'));expect(station.length).toBeGreaterThan(5);
 for(const id of ['leslieville-station','station-plaza']){await page.locator('[data-action=map]').click();await page.locator(`[data-place=${id}]`).click();expect((await scene(page)).staticContacts).toEqual({pip:[],cart:[]});}
});
test('station survives camera orbit and the sunny scene retains readable Pip',async({page})=>{
 await start(page);await page.locator('[data-action=map]').click();await page.locator('[data-place=leslieville-station]').click();
 for(let i=0;i<6;i++){await page.mouse.move(700,450);await page.mouse.down();await page.mouse.move(850,450,{steps:8});await page.mouse.up();await page.waitForTimeout(120);const s=await scene(page);expect(s.camera.y).toBeGreaterThan(1.4);expect(s.staticContacts.pip).toEqual([]);expect(s.drawCalls).toBeGreaterThan(0);}
});
