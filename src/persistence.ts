import { BUDGET, factsForDay } from './game';
import type { Brief, FactId } from './game';
export type Attempt={chapter:number;success:boolean;cards:number;minutes:number;route:string;checks:number};
export type SavedGame={chapter:number;unlocked:number;brief:Brief;checks:FactId[];attempts:Attempt[]};
const ids:FactId[]=['works','entrance','gate','park','mural','bakery'];
const integer=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
export function parseSavedGame(raw:string|null):SavedGame|undefined {
  if(!raw)return;
  try {
    const value=JSON.parse(raw);
    if(!value||!integer(value.chapter,0,2)||!integer(value.unlocked,value.chapter,3)||!value.brief||typeof value.brief!=='object'||Array.isArray(value.brief))return;
    const entries=Object.entries(value.brief);
    if(entries.length>BUDGET)return;
    for(const [id,unknownFact] of entries){
      const f=unknownFact as any;
      if(!ids.includes(id as FactId)||!f||f.id!==id||!['title','text','short','tag','value'].every(k=>typeof f[k]==='string'&&f[k].length<1000)||!integer(f.version,1,2)||!Array.isArray(f.position)||f.position.length!==2||!f.position.every(Number.isFinite))return;
      if(id==='gate'&&f.value!=='70')return;
      if((id==='works'||id==='park')&&!['open','closed'].includes(f.value))return;
      if(id==='entrance'&&f.value!=='side')return;
    }
    if(!Array.isArray(value.checks)||!value.checks.every((id:FactId)=>ids.includes(id)))return;
    if(!Array.isArray(value.attempts)||!value.attempts.every((a:any)=>a&&integer(a.chapter,0,2)&&typeof a.success==='boolean'&&integer(a.cards,0,BUDGET)&&typeof a.minutes==='number'&&Number.isFinite(a.minutes)&&a.minutes>=0&&typeof a.route==='string'&&integer(a.checks,0,6)))return;
    // Keep the remembered version, but migrate display copy when a world
    // treatment changes. Old saves must not resurrect a removed works site.
    if(value.brief.works){const f=value.brief.works,current=factsForDay(f.version===2?2:0).find(v=>v.id==='works')!;value.brief.works={...f,title:current.title,text:current.text,short:current.short};}
    return value;
  }catch{return;}
}
