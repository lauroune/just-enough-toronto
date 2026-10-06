import {prepare,layout,clearCache} from '@chenglou/pretext';
import landscape from './paint-contour.json';
import portrait from './paint-contour-portrait.json';
import square from './paint-contour-square.json';

// The alpha contour defines the available space. The painting is never masked,
// sliced, stretched, or covered by a text card. All copy remains semantic HTML.
const main=document.querySelector('main');
const isPost=document.body.classList.contains('personal-post');
const prepared=new Map();
const serif='"Source Serif 4"';
const sans='"Bricolage Grotesque"';
let lastSize='';

function measure(text,size,width,leading=1.55,family=serif,weight=400,tracking=-.008){
 const font=`${weight} ${size}px ${family}`;
 const key=`${font}|${tracking}|${text}`;
 if(!prepared.has(key))prepared.set(key,prepare(text,font,{letterSpacing:size*tracking}));
 return layout(prepared.get(key),Math.max(1,width-2),size*leading).height;
}

function corridor(contour,y,height,scale,inset){
 let left=0,right=contour.width;
 const start=Math.max(0,Math.floor(y/scale/contour.step));
 const end=Math.min(contour.bands.length-1,Math.ceil((y+height)/scale/contour.step));
 for(let row=start;row<=end;row++){
  left=Math.max(left,contour.bands[row][0]);right=Math.min(right,contour.bands[row][1]);
 }
 return {left:(left+inset)*scale,right:(right-inset)*scale};
}

const selectors=['.hello h1','.hello p','.personal-copy p:nth-child(1)','.personal-copy p:nth-child(2)','.personal-copy p:nth-child(3)','.personal-copy p:nth-child(4)','.work h2','.project','footer'];
const nodes=isPost?[]:selectors.map(selector=>main.querySelector(selector));
const contents=nodes.map(node=>node.textContent.trim());

function compose(font,contour,scale,mobile){
 const medium=contour===square;
 let y=(mobile||medium?100:76)*scale;
 const items=[];
 const startLeft=(mobile?142:medium?280:350)*scale;
 const preferredRight=(mobile?620:medium?1000:1192)*scale;
 const inset=mobile?18:medium?22:28;
 const ratios=[mobile?1.46:medium?1.58:1.7,.96,1,1,1,1,.66,1,.72];
 const gaps=[.32,1.15,.85,.85,.85,1.45,.65,1.1,0];
 for(let index=0;index<nodes.length;index++){
  const size=font*ratios[index];
  const heading=index===0;
  const family=index<2||index>=6?sans:serif;
  const weight=heading?550:index===7?500:400;
  const leading=heading?1.2:index===1?1.5:1.55;
  const tracking=heading?-.04:index===1?-.015:index>=6?0:-.008;
  let height=size*leading,left=startLeft,right=preferredRight;
  // A paragraph's safe rectangle must include every painted row it spans.
  // Recheck after wrapping: narrowing the rectangle can add a line.
  for(let pass=0;pass<8;pass++){
   const free=corridor(contour,y,height,scale,inset);
   left=Math.max(startLeft,free.left);right=Math.min(preferredRight,free.right);
   const width=right-left;
   if(width<font*5)return {fits:false,items};
   let next;
   if(index===7){
    const name=nodes[index].querySelector('.project-name').textContent;
    const description=nodes[index].querySelector('.project-description').textContent;
    next=measure(name,font*1.03,width-font*1.6,1.3,sans,500,-.018)+font*.2+measure(description,font*.88,width-font*1.6,1.5,serif,400,0);
   }else if(index===8){
    next=font*(mobile?3.2:2);
   }else{
    next=measure(contents[index],size,width,leading,family,weight,tracking)+(index===6?font*.85:0);
   }
   if(next<=height+.05){height=Math.max(height,next);break;}
   height=next;
  }
  items.push({node:nodes[index],index,left,width:right-left,top:y,height,size,leading,tracking,weight});
  y+=height+font*gaps[index];
 }
 return {fits:y<=(mobile?1810:medium?1000:806)*scale,items,end:y,font};
}

function fitHome(contour,scale,mobile){
 let low=(mobile?18:12)*scale,high=(mobile?42:contour===square?46:34)*scale;
 let result=compose(low,contour,scale,mobile);
 for(let pass=0;pass<13;pass++){
  const size=(low+high)/2;
  const candidate=compose(size,contour,scale,mobile);
  if(candidate.fits){low=size;result=candidate;}else high=size;
 }
 document.body.classList.add('art-fitted');
 main.style.setProperty('--fitted-font',`${result.font}px`);
 main.style.setProperty('--art-scale',scale);
 for(const item of result.items){
  Object.assign(item.node.style,{position:'absolute',left:`${item.left}px`,top:`${item.top}px`,width:`${item.width}px`,fontSize:`${item.size}px`,lineHeight:String(item.leading),letterSpacing:`${item.size*item.tracking}px`,fontWeight:String(item.weight)});
 }
 main.dataset.layout='contour-fit';
 main.dataset.fontSize=result.font.toFixed(2);
 main.dataset.fit=String(result.fits);
}

function fitPost(contour,scale,mobile){
 // An essay scrolls through the painting's open centre; never shrink a whole
 // long article to poster-sized type or place a white panel over the paint.
 const medium=contour===square;
 const top=(mobile||medium?100:76)*scale;
 const bottom=(mobile?1630:medium?990:798)*scale;
 const free=corridor(contour,top,bottom-top,scale,mobile?20:30);
 const left=Math.max((mobile?145:medium?280:360)*scale,free.left);
 const right=Math.min((mobile?610:medium?1000:1180)*scale,free.right);
 const offset=Math.max(0,innerHeight-contour.height*scale);
 Object.assign(main.style,{left:`${left}px`,top:`${top+offset}px`,width:`${right-left}px`,height:`${bottom-top}px`});
 main.style.setProperty('--post-font',`${Math.max(16,Math.min(21,(right-left)/28))}px`);
 main.tabIndex=0;
 main.setAttribute('aria-label','Just Enough article');
 document.body.classList.add('art-fitted');
}

function fit(){
 const width=document.documentElement.clientWidth;
 const size=`${width}x${innerHeight}`;
 if(size===lastSize)return;
 lastSize=size;
 const mobile=width<=760;
 const contour=mobile?portrait:width<=1100?square:landscape;
 const scale=width/contour.width;
 if(prepared.size>512)prepared.clear();
 if(isPost)fitPost(contour,scale,mobile);else fitHome(contour,scale,mobile);
 main.dataset.layoutWidth=String(width);
}

await Promise.all([document.fonts.load('400 20px "Source Serif 4"'),document.fonts.load('400 20px "Bricolage Grotesque"'),document.fonts.load('550 36px "Bricolage Grotesque"')]);
fit();
let queued=false;
new ResizeObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fit();});}).observe(document.documentElement);
document.fonts.addEventListener('loadingdone',()=>{prepared.clear();clearCache();lastSize='';fit();});
