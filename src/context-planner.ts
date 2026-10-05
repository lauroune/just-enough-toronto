/** A context-limited graph planner. It never receives the world evaluator.
 * Neighbourhoods supply their own IDs, nodes, edges and brief-based edge rule.
 */
export type RouteEdge<N extends string>={a:N;b:N;minutes:number};
export type RoutePlan<N extends string,E extends RouteEdge<N>>={nodes:N[];edges:E[];minutes:number};
export function planRoute<N extends string,E extends RouteEdge<N>>(nodes:Record<N,unknown>,edges:readonly E[],start:NoInfer<N>,target:NoInfer<N>,canUse:(edge:E)=>boolean):RoutePlan<N,E>|null{
 for(const edge of edges){
  if(!Number.isFinite(edge.minutes)||edge.minutes<0)throw new Error('Route costs must be finite and non-negative');
  if(!Object.hasOwn(nodes,edge.a)||!Object.hasOwn(nodes,edge.b))throw new Error('Route edge refers to a missing node');
 }
 if(!Object.hasOwn(nodes,start)||!Object.hasOwn(nodes,target))return null;
 const distance=new Map<N,number>([[start,0]]),previous=new Map<N,{node:N;edge:E}>(),remaining=new Set(Object.keys(nodes) as N[]);
 while(remaining.size){
  const current=[...remaining].sort((a,b)=>(distance.get(a)??Infinity)-(distance.get(b)??Infinity))[0],cost=distance.get(current)??Infinity;
  if(!Number.isFinite(cost))break;remaining.delete(current);if(current===target)break;
  for(const edge of edges){
   if(!canUse(edge))continue;
   const next=edge.a===current?edge.b:edge.b===current?edge.a:null;
   if(next===null||!remaining.has(next))continue;
   const nextCost=cost+edge.minutes;
   if(nextCost<(distance.get(next)??Infinity)){distance.set(next,nextCost);previous.set(next,{node:current,edge});}
  }
 }
 if(!distance.has(target))return null;
 const route:N[]=[target],path:E[]=[];let cursor=target;
 while(cursor!==start){const step=previous.get(cursor);if(!step)return null;path.unshift(step.edge);route.unshift(step.node);cursor=step.node;}
 return {nodes:route,edges:path,minutes:distance.get(target)!};
}
