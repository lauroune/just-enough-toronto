import {planRoute} from '../src/context-planner';

// Begin with an abstract delivery before adding geometry for a new block.
const nodes={library:[],market:[],lane:[],destination:[]};
const edges=[
 {a:'library',b:'lane',minutes:1,width:70},
 {a:'lane',b:'destination',minutes:1,width:70},
 {a:'library',b:'market',minutes:3,width:120},
 {a:'market',b:'destination',minutes:2,width:120},
] as const;
for(const width of [45,90]){
 const route=planRoute(nodes,edges,'library','destination',edge=>edge.width>=width);
 console.log(`${width} cm delivery: ${route?.nodes.join(' → ')} (${route?.minutes} minutes)`);
}
