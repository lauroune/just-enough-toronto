import {chromium} from '@playwright/test';import {spawn} from 'node:child_process';import {once} from 'node:events';import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const out=process.env.FILM_DIR||'evidence/trailer';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1920,height:1080}});
const captions=[
 ['00-meet-pip',6,'<div class="wordmark">Just Enough</div><div class="sub">A Game About Context Engineering.</div>','opening'],
 ['02-poulton-golden',6,'<div class="line">A little robot. A changing city.</div>','bottom'],
 ['06-gameplay',9,'<div class="line">Keep what matters.</div>','top'],
 ['03-broadview',6,'',''],
 ['04-future-station',6,'<div class="line">A glimpse of Toronto’s future.</div>','bottom'],
 ['05-autumn-queen',6,'',''],
 ['01-river-sunset',6,'<div class="wordmark">Just Enough</div><div class="sub">Play free · murch.org/justenough</div>','ending'],
];
try{await p.goto('http://127.0.0.1:5178/');for(const [name,,html,cls] of captions){if(!html)continue;await p.setContent(`<style>@font-face{font-family:Brush;src:url('http://127.0.0.1:5178/fonts/LobsterTwo-BoldItalic.ttf');font-weight:700;font-style:italic}@font-face{font-family:Serif;src:url('http://127.0.0.1:5178/fonts/Newsreader.ttf');font-weight:200 800}*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;background:transparent;overflow:hidden}.caption{position:absolute;left:110px;color:#fff0d6;text-shadow:0 3px 18px #102e36,0 1px 4px #102e36}.wordmark{font:italic 700 156px/1.18 Brush;letter-spacing:-3px}.sub{font:500 40px/1.4 Serif;margin-top:15px}.line{font:500 62px/1.25 Serif}.opening{top:82px}.top{top:96px;left:auto;right:110px}.bottom{bottom:88px}.ending{bottom:75px}.ending .wordmark{font-size:100px}.ending .sub{font-size:39px;margin-top:9px}</style><div class="caption ${cls}">${html}</div>`);await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${out}/${name}-overlay.png`,omitBackground:true});}}finally{await b.close();}
async function run(args){const e=spawn(process.env.FFMPEG||'ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});const [code]=await once(e,'close');if(code)throw Error(`ffmpeg ${code}`);}
for(const [name,duration,html] of captions){const src=`${out}/${name}.mp4`,dst=`${out}/${name}-titled.mp4`;if(!html){await copyFile(src,dst);continue;}await run(['-i',src,'-loop','1','-i',`${out}/${name}-overlay.png`,'-filter_complex',`[0:v]format=yuv420p,setsar=1[v];[1:v]format=rgba,fade=t=in:st=0.2:d=0.6:alpha=1,fade=t=out:st=${duration-1}:d=0.6:alpha=1[o];[v][o]overlay=0:0:shortest=1[out]`,'-map','[out]','-t',String(duration),'-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',dst]);console.log(`Titled ${name}`);}
const args=captions.flatMap(([name])=>['-i',`${out}/${name}-titled.mp4`]);let chain=captions.map((_,i)=>`[${i}:v]settb=AVTB,fps=30,setsar=1[v${i}]`).join(';'),last='v0',duration=captions[0][1];
for(let i=1;i<captions.length;i++){chain+=`;[${last}][v${i}]xfade=transition=fade:duration=0.75:offset=${duration-.75}[x${i}]`;last=`x${i}`;duration+=captions[i][1]-.75;}
chain+=`;[${last}]split[a][b];[b]trim=duration=0.75,setpts=PTS-STARTPTS[head];[a][head]xfade=transition=fade:duration=0.75:offset=${duration-.75},trim=start=0.75,setpts=PTS-STARTPTS[loop]`;
await run([...args,'-filter_complex',chain,'-map','[loop]','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/just-enough-trailer-master.mp4`]);
for(const [target,crf] of [[`${out}/just-enough-trailer.mp4`,'18'],['site/assets/just-enough-film.mp4','24']])await run(['-i',`${out}/just-enough-trailer-master.mp4`,'-vf','scale=in_range=pc:out_range=tv,format=yuv420p','-color_range','tv','-an','-c:v','libx264','-preset','medium','-crf',crf,'-movflags','+faststart',target]);
await run(['-ss','1','-i','site/assets/just-enough-film.mp4','-frames:v','1','-q:v','2','site/assets/just-enough-film-poster.jpg']);
if(process.env.DESKTOP_COPY)await copyFile(`${out}/just-enough-trailer.mp4`,process.env.DESKTOP_COPY);
await writeFile(`${out}/edit.json`,JSON.stringify({duration:duration-.75,fps:30,resolution:[1920,1080],captions,loopCrossfade:.75,silent:true},null,2));console.log(`Finished ${duration-.75}s seamless trailer.`);
