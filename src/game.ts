import {planRoute} from './context-planner';
// The planner receives only Brief. The evaluator alone can read World.
export type FactId = 'works' | 'entrance' | 'gate' | 'park' | 'mural' | 'bakery';
export type NodeId = 'bakery' | 'west' | 'northwest' | 'northeast' | 'southwest' | 'southeast' | 'east' | 'front' | 'approach' | 'side';
export type Point = [number, number];
export type Fact = { id: FactId; title: string; text: string; short: string; tag: string; position: Point; version: number; value: string; };
export type Brief = Partial<Record<FactId, Fact>>;
export type Mission = { index: number; name: string; eyebrow: string; title: string; text: string; load: string; width: number; deadline: number; weather: string; lesson: string; takeaway: string; };
export const BUDGET = 4;
export const MISSIONS: Mission[] = [
  { index: 0, name: 'What you carry', eyebrow: '01 / CONTEXT', title: 'A little less is enough.', text: 'Get a box of pastries from the bakery to the neighbourhood gathering. Try removing a detail from Pip’s starter brief.', load: 'One pastry box', width: 45, deadline: 12, weather: 'Friday · 4:15 pm · 9°C', lesson: 'You chose the context.', takeaway: 'Pip did not need every detail. A useful brief keeps the information that changes the outcome.' },
  { index: 1, name: 'What the task changes', eyebrow: '02 / RELEVANCE', title: 'Same streets. Bigger delivery.', text: 'This time Pip is pulling a 90 cm wide cart. Keep the delivery on time. The brief from your last trip is still here.', load: '90 cm delivery cart', width: 90, deadline: 12, weather: 'Friday · 4:30 pm · 9°C', lesson: 'The goal changed what mattered.', takeaway: 'The passage width was optional for a small robot. A wider cart makes it essential. Relevance depends on the task.' },
  { index: 2, name: 'What time changes', eyebrow: '03 / MEMORY', title: 'Yesterday’s map. Today’s snow.', text: 'Make one more cart delivery after the first snowfall. Your brief remembers yesterday. Check current conditions where they matter.', load: '90 cm delivery cart', width: 90, deadline: 12, weather: 'Saturday · 8:30 am · −2°C', lesson: 'Memory needs maintenance.', takeaway: 'Some facts stay useful. Others expire. An agent can retrieve a specific update instead of rebuilding its entire context.' },
];
// Coordinates are metres in the geographic contract. Barriers and door setup are game fiction.
export const NODES: Record<NodeId, Point> = {
  bakery: [-14,-6.25], west:[79.824,-7.0], northwest:[91.533,-19.88], northeast:[91.325,-42.785],
  southwest:[205.373,-9.779], southeast:[113.358,-101.42], east:[100.248,-50.23], front:[80.622,-18.131], approach:[96.5,-48], side:[94.969,-47.856],
};
export type Edge = { a: NodeId; b: NodeId; minutes: number; kind?: 'queen' | 'gate' | 'park'; via?:Point[] };
export const EDGES: Edge[] = [
  {a:'bakery',b:'west',minutes:1,via:[[0,-6.25],[12,-7],[56,-7]]},
  {a:'west',b:'east',minutes:2.6,kind:'queen',via:[[104.291,-8.261],[105.465,-29.096],[106.017,-54.294]]},
  {a:'west',b:'northwest',minutes:.7},
  {a:'northwest',b:'northeast',minutes:2,kind:'gate',via:[[95.51,-23.846],[95.66,-29.859],[94.519,-34.151],[92.394,-37.769]]},
  {a:'northeast',b:'east',minutes:.7,via:[[93.447,-47.652],[94.969,-47.856]]},
  {a:'west',b:'southwest',minutes:1.6,via:[[104.291,-8.261],[142.771,-8.186],[198.5,-8.4]]},
  {a:'southwest',b:'southeast',minutes:4,kind:'park',via:[[209,-20],[209,-84],[201,-84],[195,-85.6],[154.05,-87.224],[137.274,-93.082],[118.139,-99.625]]},
  {a:'southeast',b:'east',minutes:1.6,via:[[109.206,-91.495],[99.866,-67.13],[102.534,-62.213],[102.007,-60.186],[101.462,-51.999]]},
  {a:'east',b:'front',minutes:1,via:[[109.7,-50.23],[109.7,-25],[95.51,-23.846],[91.533,-19.88]]},
  {a:'east',b:'approach',minutes:1.3},
  {a:'approach',b:'side',minutes:.7},
];
export function edgePoints(edge:Edge,from:NodeId):Point[]{const points=[NODES[edge.a],...(edge.via||[]),NODES[edge.b]];return edge.a===from?points:[...points].reverse();}
export function factsForDay(day: number): Fact[] {
  return [
    { id:'works', title: day === 2 ? 'Queen-side path is clear' : 'Gathering setup on Queen', text: day === 2 ? 'Checked 8:20 am. The gathering setup is finished. The Queen-side gate is open and the path is cleared.' : 'The gathering setup closes the Queen-side service gate today. Use the garden passage or the park loop.', short: day === 2 ? 'Queen-side path: open today' : 'Queen-side path: closed', tag:'STREET CONDITIONS', position:[105.55,-35], version:day === 2 ? 2 : 1, value:day === 2 ? 'open' : 'closed' },
    { id:'entrance', title:'The door around the side', text:'The gathering uses the step-free side entrance. The front door is locked during setup.', short:'Use the side entrance', tag:'ARRIVAL', position:NODES.side, version:1, value:'side' },
    { id:'gate', title:'A narrow little passage', text:'The garden path passes through a 70 cm wide gate. Pip is 45 cm wide. The cart is 90 cm wide.', short:'Garden passage: 70 cm wide', tag:'ACCESS', position:[94.519,-34.151], version:1, value:'70' },
    { id:'park', title:day === 2 ? 'Snow on the park path' : 'The long way through', text:day === 2 ? 'Checked 8:25 am. A snowbank blocks the park path. The path has not been cleared.' : 'The park path is open, wide and step-free. It takes a little longer than the garden passage.', short:day === 2 ? 'Park path: blocked by snow' : 'Park path: open Friday', tag:'PATH CONDITIONS', position:[176,-86.3], version:day === 2 ? 2 : 1, value:day === 2 ? 'closed' : 'open' },
    { id:'mural', title:'Amber on Boulton', text:'Amber Kitchen and Coffee is at 4 Boulton Avenue, with arched windows and an orange sign. It is not on this delivery route.', short:'Amber: orange sign', tag:'LOCAL COLOUR', position:[-57,-31], version:1, value:'amber' },
    { id:'bakery', title:'Bonjour’s blue awning', text:'Bonjour Brioche is at 812 Queen East, beside De Grassi. Its blue awning is a landmark; Pip already knows the pickup.', short:'Bonjour: blue awning', tag:'LOCAL COLOUR', position:NODES.bakery, version:1, value:'blue' },
  ];
}
export function starterBrief(): Brief {
  return Object.fromEntries(factsForDay(0).filter(f => ['works','entrance','mural','bakery'].includes(f.id)).map(f => [f.id,f]));
}
export function toggleFact(brief: Brief, fact: Fact): Brief {
  const next = {...brief};
  if (next[fact.id]) delete next[fact.id];
  else if (Object.keys(next).length < BUDGET) next[fact.id] = {...fact};
  return next;
}
export type Plan = { nodes: NodeId[]; edges: Edge[]; minutes: number; };
export function planDelivery(brief: Brief, width: number): Plan | null {
  const target: NodeId = brief.entrance?.value === 'side' ? 'side' : 'front';
  return planRoute(NODES,EDGES,'bakery',target,edge => {
    if(edge.kind==='queen'&&brief.works?.value==='closed')return false;
    if(edge.kind==='park'&&brief.park?.value==='closed')return false;
    if(edge.kind==='gate'&&brief.gate&&width>Number(brief.gate.value))return false;
    return true;
  });
}
export type Journey = { points:Point[]; success:boolean; title:string; message:string; lesson:string; minutes:number; fact?:FactId; used:FactId[]; route:string; };
export function runDelivery(brief: Brief, mission: Mission): Journey {
  const plan = planDelivery(brief,mission.width);
  if (!plan) return {points:[NODES.bakery],success:false,title:'No open route in this brief.',message:'Every route Pip knows is blocked. Check the current street conditions, or revise the brief.',lesson:'An old fact can rule out a good option.',minutes:0,fact:'works',used:[],route:'No route'};
  const points:Point[]=[NODES.bakery]; let minutes=0;
  const used = Object.keys(brief).filter(id=> !['mural','bakery'].includes(id)) as FactId[];
  for(let i=0;i<plan.edges.length;i++) {
    const edge=plan.edges[i]; const polyline=edgePoints(edge,plan.nodes[i]);
    let fact:FactId|undefined;
    if(edge.kind === 'queen' && mission.index < 2) fact='works';
    if(edge.kind === 'gate' && mission.width > 70) fact='gate';
    if(edge.kind === 'park' && mission.index === 2) fact='park';
    if(fact) {
      const obstacle=factsForDay(mission.index).find(f=>f.id===fact)!.position;
      let total=0,travelled=0;for(let k=1;k<polyline.length;k++)total+=Math.hypot(polyline[k][0]-polyline[k-1][0],polyline[k][1]-polyline[k-1][1]);
      let best=Infinity,stop=0,along=0;
      for(let k=1;k<polyline.length;k++){const a=polyline[k-1],b=polyline[k],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((obstacle[0]-a[0])*dx+(obstacle[1]-a[1])*dz)/(len*len)));const d=Math.hypot(a[0]+dx*t-obstacle[0],a[1]+dz*t-obstacle[1]);if(d<best){best=d;stop=along+len*t-2.2;}along+=len;}
      stop=Math.max(0,stop);
      for(let k=1;k<polyline.length;k++){const a=polyline[k-1],b=polyline[k],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(travelled+len>=stop){const t=(stop-travelled)/len;points.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);break;}points.push(b);travelled+=len;}
      minutes+=edge.minutes*(stop/total);
      const messages:Record<string,[string,string,string]> = {
        works:['A barrier Pip did not expect.','The Queen-side path is closed. Pip saw the barrier on arrival, but the brief did not include it.','Pip needs the street condition to plan around the closure.'],
        gate:['Pip fits. The cart does not.','This gate is 70 cm wide. The cart is 90 cm wide. Pip stopped before trying to pass.','A new task made an old detail important.'],
        park:['Yesterday was a different day.','A snowbank blocks the park path. Yesterday’s conditions no longer describe the route.','Check today’s street conditions to find an open route.'],
      };
      const [title,message,lesson]=messages[fact];
      return {points,success:false,title,message,lesson,minutes,fact,used,route:edge.kind!};
    }
    points.push(...polyline.slice(1)); minutes+=edge.minutes;
  }
  if(plan.nodes.at(-1) === 'front') return {points,success:false,title:'Right building. Wrong entrance.',message:'The front door is locked. The gathering uses the step-free side entrance. Pip did not have that detail.',lesson:'Knowing the destination is not the same as knowing how to arrive.',minutes,fact:'entrance',used,route:'Front door'};
  return {points,success:minutes <= mission.deadline,title:minutes <= mission.deadline ? 'A small brief. A good delivery.' : 'Delivered, a little late.',message:minutes <= mission.deadline ? 'The pastries arrived, and Pip had enough information to get them there.' : 'The route took longer than the delivery window. Look for a shorter open route.',lesson:mission.takeaway,minutes,used,route:plan.edges.some(e=>e.kind==='park') ? 'Park path' : plan.edges.some(e=>e.kind==='gate') ? 'Garden passage' : 'Queen Street'};
}
