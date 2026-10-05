import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {start,load,brief,memory,deliver} from './helpers';
async function clean(page:any){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,reason:n.failureSummary}))}))).toEqual([]);}
test('title, gameplay, brief and settings pass automated accessibility checks',async({page})=>{await page.goto('/');await clean(page);await page.locator('[data-action="start"]').click();await clean(page);await brief(page);await memory(page,'gate');await clean(page);await page.keyboard.press('Escape');await page.locator('[data-action="menu"]').click();await clean(page);await page.locator('[data-action="about"]').click();await clean(page);});
test('snow detail, success, and final idea pass automated accessibility checks',async({page})=>{await load(page,2);await brief(page);await memory(page,'works');await clean(page);await page.locator('[data-action="refresh"]').click();await deliver(page);await clean(page);await page.locator('[data-action="next"]').click();await clean(page);});
