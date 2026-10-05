import {expect,type Page} from '@playwright/test';
import {factsForDay,type FactId} from '../../src/game';
export const state=(page:Page)=>page.evaluate(()=>(window as any).__ENOUGH__.getState());
export const scene=(page:Page)=>page.evaluate(()=>(window as any).__ENOUGH__.scene());
export async function start(page:Page){await page.goto('/?debug');await page.locator('[data-action="start"]').click();}
export async function load(page:Page,chapter:number,ids:FactId[]=['works','entrance','gate'],checks:FactId[]=[]){
 const brief=Object.fromEntries(factsForDay(0).filter(f=>ids.includes(f.id)).map(f=>[f.id,checks.includes(f.id)?factsForDay(2).find(v=>v.id===f.id):f]));
 await page.addInitScript(value=>localStorage.setItem('enough-queen-east-v1',JSON.stringify(value)),{chapter,unlocked:chapter,brief,checks,attempts:[]});await page.goto('/?debug');await page.locator('[data-action="resume"]').click();
}
export async function memory(page:Page,id:FactId){await page.locator(`[data-action="select"][data-fact="${id}"]`).click();}
export async function toggle(page:Page,id:FactId){await memory(page,id);await page.locator('[data-action="toggle"]').click();}
export async function brief(page:Page){await page.locator('[data-action="brief"]').click();}
export async function deliver(page:Page,skip=true){await page.locator('[data-action="send"]:visible').click();if(skip){const skipButton=page.locator('[data-action="skip"]');if(await skipButton.isVisible())await skipButton.click();}await expect(page.locator('.result-card')).toBeVisible({timeout:160000});}
