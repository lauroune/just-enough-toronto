import {chromium} from '@playwright/test';import {spawn} from 'node:child_process';import {once} from 'node:events';import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const out=process.env.FILM_DIR||'evidence/trailer';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1920,height:1080}});
// Each shot is actual engine footage. Only the camera, editing and presentation
// size of the genuine brief/result UI differ from ordinary interactive play.
const shots=[
 {id:'opening',src:'00-meet-pip',start:3.7,staticTitle:true,duration:3.5,html:'<div class="wordmark">Just Enough</div><div class="sub">A Game About Context Engineering.</div>',cls:'opening'},
 {id:'queen',src:'02-poulton-golden',duration:2.8,html:'<div class="line">One small robot.</div><div class="sub">A whole neighbourhood.</div>',cls:'opening'},
 {id:'brief',src:'06-gameplay',duration:3.4,html:'<div class="line">Keep what<br>matters.</div><div class="sub">Give Pip a useful brief.</div>',cls:'right'},
 {id:'clues',src:'06-gameplay',start:3.4,duration:3.3,html:'<div class="line">Two useful<br>facts.</div><div class="sub">Closed sidewalk.<br>Side entrance.</div>',cls:'right clues'},
 {id:'delivery',src:'09-delivery',duration:2.9,html:'<div class="line">Then let Pip find the way.</div>',cls:'opening'},
 {id:'arrival',src:'10-delivered',duration:2.3,html:'',cls:''},
 {id:'mural',src:'07-riverside-mural',duration:2.1,html:'',cls:''},
 {id:'broadview',src:'03-broadview',duration:2.1,html:'',cls:''},
 {id:'future',src:'04-future-station',duration:2.4,html:'<div class="line">A future Leslieville.</div>',cls:'opening compact'},
 {id:'autumn',src:'05-autumn-queen',duration:2.1,html:'',cls:''},
 {id:'invitation',src:'00-meet-pip',staticTitle:true,duration:3.7,html:'<div class="wordmark">Just Enough</div><div class="url">murch.org/justenough</div><div class="play">Free to play. Yours to explore.</div>',cls:'opening invitation'},
];
const fontProof=[];
try{await p.goto('http://127.0.0.1:5178/');for(const s of shots){if(!s.html)continue;await p.setContent(`<style>@font-face{font-family:Display;src:url('http://127.0.0.1:5178/fonts/bricolage-grotesque.woff2');font-weight:400 700;font-style:normal}@font-face{font-family:Serif;src:url('http://127.0.0.1:5178/fonts/source-serif-4.woff2');font-weight:400 600}*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;background:transparent;overflow:hidden}.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,39,39,.48),rgba(17,39,39,.22) 27%,transparent 52%)}.shade.right{background:linear-gradient(180deg,rgba(17,39,39,.36),transparent 59%);left:1020px;top:0}.caption{position:absolute;left:104px;top:84px;color:#fff2db;text-shadow:0 2px 4px #17333488,0 4px 22px #17333455}.wordmark{font:700 156px/1.06 Display;letter-spacing:-8px}.sub{font:500 52px/1.4 Serif;margin-top:13px}.line{font:650 76px/1.10 Display;letter-spacing:-2.3px}.caption.right{top:124px;left:1090px;width:720px}.right .line{font-size:104px;letter-spacing:-4px}.right .sub{font-size:46px;margin-top:22px}.compact .line{font-size:68px}.url{font:600 72px/1.2 Display;letter-spacing:-2px;margin-top:20px}.play{font:500 40px/1.3 Serif;margin-top:12px}.clues .sub{font-size:52px}</style><div class="shade ${s.cls.includes('right')?'right':''}"></div><div class="caption ${s.cls}">${s.html}</div>`);await p.evaluate(()=>document.fonts.ready);fontProof.push({shot:s.id,loaded:await p.evaluate(()=>document.fonts.check('700 156px Display')&&document.fonts.check('500 44px Serif'))});if(s.staticTitle){await p.locator('.sub,.url,.play').evaluateAll(els=>els.forEach(e=>e.style.visibility='hidden'));await p.screenshot({path:`${out}/${s.id}-title.png`,omitBackground:true});await p.locator('.sub,.url,.play').evaluateAll(els=>els.forEach(e=>e.style.visibility='visible'));await p.locator('.wordmark,.shade').evaluateAll(els=>els.forEach(e=>e.style.visibility='hidden'));}await p.screenshot({path:`${out}/${s.id}-overlay.png`,omitBackground:true});}}finally{await b.close();}
if(fontProof.some(x=>!x.loaded))throw Error('Title font failed to load');
async function run(args){const e=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});const [code]=await once(e,'close');if(code)throw Error(`ffmpeg ${code}`);}
for(const s of shots){const args=['-ss',String(s.start||0),'-i',`${out}/${s.src}.mp4`];let filter='[0:v]format=yuv420p,setsar=1[out]';if(s.html){args.push('-loop','1','-i',`${out}/${s.id}-overlay.png`);if(s.staticTitle)args.push('-loop','1','-i',`${out}/${s.id}-title.png`);filter=`[0:v]format=yuv420p,setsar=1[base];${s.staticTitle?'[base][2:v]overlay=0:0:shortest=1[v];':'[base]null[v];'}[1:v]format=rgba,fade=t=in:st=0.06:d=0.24:alpha=1,fade=t=out:st=${s.duration-.38}:d=0.3:alpha=1[o];[v][o]overlay=0:0:shortest=1[out]`;}
 await run([...args,'-filter_complex',filter,'-map','[out]','-t',String(s.duration),'-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p',`${out}/${s.id}-titled.mp4`]);console.log(`Edited ${s.id}`);
}
const args=shots.flatMap(s=>['-i',`${out}/${s.id}-titled.mp4`]);let chain=shots.map((_,i)=>`[${i}:v]fps=30,setsar=1,settb=AVTB[v${i}]`).join(';'),last='v0',duration=shots[0].duration;
const transitions=[];
for(let i=1;i<shots.length;i++){
 // Clean cuts for actions and the quicker scenic passage; soft transitions
 // frame the opening, future and closing invitation.
 const fade=[1,2,8,10].includes(i)?.30:0;transitions.push({from:shots[i-1].id,to:shots[i].id,seconds:fade});
 if(fade)chain+=`;[${last}][v${i}]xfade=transition=fade:duration=${fade}:offset=${duration-fade}[x${i}]`;
 else chain+=`;[${last}][v${i}]concat=n=2:v=1:a=0[x${i}]`;
 last=`x${i}`;duration+=shots[i].duration-fade;
}
// Closing frames 0..110 and opening frames 111..215 are one continuous
// camera move. A persistent wordmark crosses the boundary without a dissolve.
const loop=0;
chain+=`;[${last}]null[loop]`;
await run([...args,'-filter_complex',chain,'-map','[loop]','-an','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/just-enough-trailer-master.mp4`]);
for(const [target,crf] of [[`${out}/just-enough-trailer.mp4`,'18'],[`${out}/just-enough-trailer-web.mp4`,'23']])await run(['-i',`${out}/just-enough-trailer-master.mp4`,'-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-an','-c:v','libx264','-preset','medium','-crf',crf,'-movflags','+faststart',target]);
await run(['-ss','0.5','-i',`${out}/just-enough-trailer-web.mp4`,'-frames:v','1','-q:v','2',`${out}/poster.jpg`]);
// Publishing is explicit so a review cut never overwrites the website.
if(process.env.PUBLISH_TRAILER){await copyFile(`${out}/just-enough-trailer-web.mp4`,'site/assets/just-enough-film.mp4');await copyFile(`${out}/poster.jpg`,'site/assets/just-enough-film-poster.jpg');}
if(process.env.DESKTOP_COPY)await copyFile(`${out}/just-enough-trailer.mp4`,process.env.DESKTOP_COPY);
await writeFile(`${out}/edit.json`,JSON.stringify({duration:duration-loop,fps:30,resolution:[1920,1080],shots,transitions,loopCrossfade:loop,loopJoin:"Consecutive frames of the same 7.2-second hero take; constant wordmark",silent:true,fontProof,actualGameplay:true,capture:'Fixed 1/30-second engine steps, cinematic render scale (3840 × 2160), downsampled to 1920 × 1080.'},null,2));console.log(`Finished ${duration-loop}s trailer for review.`);
