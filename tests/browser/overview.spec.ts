import {test,expect} from '@playwright/test';
import {factsForDay} from '../../src/game';
import {state,scene} from './helpers';

test('overview opens on arrival; Start enters play and the question mark preserves a running delivery',async({page})=>{
 await page.goto('/?debug');
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.locator('.overview-copy')).toContainText('Too little leaves gaps. Too much can bury what matters.');
 expect((await state(page)).mode).toBe('title');
 await page.getByRole('button',{name:'Start',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeHidden();
 expect((await state(page)).mode).toBe('explore');
 expect((await scene(page)).paused).toBe(false);
 await page.locator('[data-action="send"]').click();
 await expect.poll(async()=>(await scene(page)).speed).toBeGreaterThan(.1);
 await page.getByRole('button',{name:'About Just Enough',exact:true}).click();
 const before=await state(page),position=(await scene(page)).position;
 await page.waitForTimeout(300);
 expect((await scene(page)).position).toEqual(position);
 await page.getByRole('button',{name:'Back to game',exact:true}).click();
 expect((await state(page)).brief).toEqual(before.brief);
 expect((await scene(page)).paused).toBe(false);
 await expect.poll(async()=>(await scene(page)).position.x).not.toBe(position.x);
 await page.locator('[data-action="cancel"]').click();
});

test('dismissing the opening overview resumes saved progress without resetting it',async({page})=>{
 const brief=Object.fromEntries(factsForDay(0).filter(f=>['works','entrance','gate'].includes(f.id)).map(f=>[f.id,f]));
 await page.addInitScript(value=>localStorage.setItem('enough-queen-east-v1',JSON.stringify(value)),{chapter:1,unlocked:1,brief,checks:[],attempts:[]});
 await page.goto('/?debug');
 await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toBeHidden();
 await expect.poll(async()=>(await state(page)).mode).toBe('explore');
 const current=await state(page);
 expect(current.chapter).toBe(1);expect(current.unlocked).toBe(1);expect(current.brief).toEqual(brief);
 expect((await scene(page)).paused).toBe(false);
});
