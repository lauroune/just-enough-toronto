import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSavedGame} from '../src/persistence';
import {starterBrief} from '../src/game';
const valid=()=>({chapter:0,unlocked:0,brief:starterBrief(),checks:[],attempts:[]});
test('valid progress survives serialization',()=>assert.deepEqual(parseSavedGame(JSON.stringify(valid())),valid()));
test('invalid saved states are discarded without exceptions',()=>{
  const cases:any[]=[null,[],{...valid(),chapter:-1},{...valid(),chapter:4},{...valid(),unlocked:-1},{...valid(),chapter:2,unlocked:1},{...valid(),checks:{}},{...valid(),attempts:{}},{...valid(),brief:[]},{...valid(),checks:['missing']},{...valid(),attempts:[{}]}];
  for(const value of cases)assert.equal(parseSavedGame(JSON.stringify(value)),undefined);
  assert.equal(parseSavedGame('{bad'),undefined);
});
test('malformed facts cannot break resuming a game',()=>{
  for(const change of [{short:null},{position:null},{position:['x',0]},{version:-1},{id:'wrong'},{value:'secret-tunnel'}]){
    const value=valid();Object.assign(value.brief.works!,change);assert.equal(parseSavedGame(JSON.stringify(value)),undefined);
  }
});

test('pre-station saves keep their memory version while losing obsolete construction copy',()=>{
 const old=valid();old.brief.works!.title='Work on Queen Street';old.brief.works!.text='Temporary work blocks the path.';
 const parsed=parseSavedGame(JSON.stringify(old))!;assert.equal(parsed.brief.works?.version,1);assert.equal(parsed.brief.works?.value,'closed');assert.match(parsed.brief.works!.title,/Gathering/);assert.doesNotMatch(parsed.brief.works!.text,/construction|temporary work/i);
});
