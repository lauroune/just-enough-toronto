// Print the chunk design plan: `npx tsx scripts/chunks/plan.ts`
import {readdirSync,existsSync} from 'node:fs';
import {chunkPlan,PLAN_ANCHORS,cellAt} from '../../src/chunks/grid';
const plan=chunkPlan(),dir='src/chunks/areas',done=new Set(existsSync(dir)?readdirSync(dir).filter(id=>existsSync(`${dir}/${id}/index.ts`)):[]);
const anchors=new Map(PLAN_ANCHORS.map(a=>[cellAt(...a.at).id,a.name]));
console.log(`${plan.length} chunks, ${plan.filter(c=>done.has(c.id)).length} designed\n`);
console.log('ring  id          x range          z range          status    contains');
for(const c of plan)console.log(`${String(c.ring).padStart(4)}  ${c.id.padEnd(10)}  ${String(c.bounds.left).padStart(6)}..${String(c.bounds.right).padEnd(6)}  ${String(c.bounds.top).padStart(6)}..${String(c.bounds.bottom).padEnd(6)}  ${(done.has(c.id)?'designed':'open').padEnd(8)}  ${anchors.get(c.id)??''}`);
