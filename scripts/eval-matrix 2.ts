import { writeFileSync } from 'node:fs';
import { factsForDay, MISSIONS, runDelivery, BUDGET } from '../src/game';
import type { Brief, FactId } from '../src/game';
// Independent scenario oracle from the design contract. It does not call the graph planner.
// Three route costs (excluding pickup and entrance): Queen 2.6, north 3.4, park 7.2.
function expected(brief:Brief,chapter:number){
  const queen=brief.works?.value!=='closed';
  const north=chapter===0||!brief.gate;
  const park=brief.park?.value!=='closed';
  const route=queen?'queen':north?'gate':park?'park':'none';
  const cause=route==='none'?'works':route==='queen'&&chapter<2?'works':route==='gate'&&chapter>0?'gate':route==='park'&&chapter===2?'park':!brief.entrance?'entrance':null;
  return {success:!cause,cause};
}
const scenarios=[
  {name:'01-light-delivery',chapter:0,refresh:[]},
  {name:'02-wide-cart',chapter:1,refresh:[]},
  {name:'03-snow-stale-memory',chapter:2,refresh:[]},
  {name:'03-snow-queen-refreshed',chapter:2,refresh:['works']},
  {name:'03-snow-park-refreshed',chapter:2,refresh:['park']},
  {name:'03-snow-both-refreshed',chapter:2,refresh:['works','park']},
];
const cases=[];
for(const scenario of scenarios){
  const pool=factsForDay(0).map(f=>scenario.refresh.includes(f.id)?factsForDay(2).find(n=>n.id===f.id)!:f);
  for(let mask=0;mask<64;mask++){
    const facts=pool.filter((_,i)=>mask & 1<<i);if(facts.length>BUDGET)continue;
    const brief=Object.fromEntries(facts.map(f=>[f.id,f]));const wanted=expected(brief,scenario.chapter),actual=runDelivery(brief,MISSIONS[scenario.chapter]);
    const passed=actual.success===wanted.success&&(actual.fact??null)===wanted.cause&&Number.isFinite(actual.minutes)&&actual.points.length>0;
    cases.push({id:`${scenario.name}/${mask.toString(2).padStart(6,'0')}`,chapter:scenario.chapter,refreshed:scenario.refresh,brief:facts.map(f=>f.id),expected:wanted,actual:{success:actual.success,cause:actual.fact??null,route:actual.route,minutes:actual.minutes},passed});
  }
}
const summary={total:cases.length,passed:cases.filter(c=>c.passed).length,failed:cases.filter(c=>!c.passed).length,scenarios:scenarios.map(s=>{const list=cases.filter(c=>c.id.startsWith(s.name+'/'));return{name:s.name,cases:list.length,successfulDeliveries:list.filter(c=>c.actual.success).length,minimumSuccessfulBrief:Math.min(...list.filter(c=>c.actual.success).map(c=>c.brief.length))};})};
writeFileSync('evidence/brief-matrix.json',JSON.stringify({summary,cases},null,2));console.log(JSON.stringify(summary,null,2));if(summary.failed)process.exitCode=1;
