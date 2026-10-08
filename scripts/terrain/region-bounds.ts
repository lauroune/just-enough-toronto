// Bounds of the regional terrain: every planned chunk, downtown and the key locations, plus a margin.
import {chunkPlan} from '../../src/chunks/grid';
import {DOWNTOWN} from '../../src/rush/downtown-bounds';
const cells=chunkPlan().map(c=>c.bounds),all=[...cells,DOWNTOWN],m=200;
console.log(JSON.stringify({left:Math.min(...all.map(b=>b.left))-m,right:Math.max(...all.map(b=>b.right))+m,top:Math.min(...all.map(b=>b.top))-m,bottom:Math.max(...all.map(b=>b.bottom))+m}));
