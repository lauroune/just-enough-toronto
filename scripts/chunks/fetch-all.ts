// Fetch data for every planned chunk that does not have it yet: `npx tsx scripts/chunks/fetch-all.ts [--force]`
// Polite to the public servers: one request at a time, a pause between. Re-run to retry failures.
import {existsSync} from 'node:fs';
import {chunkPlan} from '../../src/chunks/grid';
import {fetchOsm,writeChunk} from './fetch-chunk';
import {buildMapIndex} from './build-map';
const force=process.argv.includes('--force'),plan=chunkPlan(),failed:string[]=[];let done=0;
for(const c of plan){
 if(!force&&existsSync(`src/chunks/areas/${c.id}/data.json`)){done++;continue;}
 try{const osm=await fetchOsm(c.bounds);writeChunk(c.id,osm);done++;}
 catch(err){failed.push(c.id);console.warn(`${c.id}: ${(err as Error).message}`);}
 console.log(`[${done}/${plan.length}] ${c.id}`);await new Promise(r=>setTimeout(r,1500));
}
buildMapIndex();
console.log(failed.length?`\n${failed.length} failed (re-run to retry): ${failed.join(' ')}`:`\nall ${plan.length} chunks have data`);
