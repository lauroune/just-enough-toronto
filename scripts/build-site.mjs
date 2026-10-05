import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {buildPaintStylesheet} from './build-paint.mjs';
// A separate output keeps the existing game preview and saved game intact.
const out=resolve('dist-site');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp('site/index.html',`${out}/index.html`);await cp('site/404.html',`${out}/404.html`);await cp('site/enough',`${out}/enough`,{recursive:true});await cp('site/assets',`${out}/site-assets`,{recursive:true});
const paint=await buildPaintStylesheet();
await writeFile(`${out}/site-assets/${paint.filename}`,paint.css);
for(const path of ['index.html','enough/index.html']){
 const html=await readFile(`${out}/${path}`,'utf8');
 await writeFile(`${out}/${path}`,html.replace('/site-assets/paint-critical.css',`/site-assets/${paint.filename}`));
}
// Changed styles and film titles must also update immediately for returning
// visitors whose browser still has the preceding release cached.
const versions=new Map();
for(const name of ['site.css','fonts.css','just-enough-film.mp4','just-enough-film-poster.jpg']){
 const hash=createHash('sha256').update(await readFile(`site/assets/${name}`)).digest('hex').slice(0,12);
 versions.set(`/site-assets/${name}`,`/site-assets/${name}?v=${hash}`);
}
for(const path of ['index.html','404.html','enough/index.html','enough/build/index.html']){
 let html=await readFile(`${out}/${path}`,'utf8');
 for(const [source,versioned] of versions)html=html.replaceAll(source,versioned);
 await writeFile(`${out}/${path}`,html);
}
// The high-resolution AVIF originals are source assets; only their compact
// critical stylesheet is requested by the page.
await rm(`${out}/site-assets/acrylic-brushstrokes.png`,{force:true});
await mkdir(`${out}/justenough`,{recursive:true});
await cp('dist/index.html',`${out}/justenough/index.html`);
await cp('public/favicon.svg',`${out}/justenough/favicon.svg`);
// Vite rewrites the game's CSS and FontFace URLs relative to its base.
await cp('public/fonts',`${out}/justenough/fonts`,{recursive:true});
// Vite's hashed assets have no trailing space-number suffix. iCloud conflict
// copies in generated output are not build inputs or referenced assets.
await cp('dist/assets',`${out}/justenough/assets`,{recursive:true,filter:source=>!/ \d+\.[^/]+$/.test(source)});
// Existing game asset URLs are root-based. Copy their namespaced directories
// unchanged; the personal site uses site-assets and shares the licensed fonts.
for(const name of ['fonts','materials','geography'])await cp(`public/${name}`,`${out}/${name}`,{recursive:true});
const sources=(await readFile('public/sources.html','utf8')).replace('href="/"','href="/justenough/"');
await writeFile(`${out}/sources.html`,sources);
await writeFile(`${out}/justenough/sources.html`,sources);
await writeFile(`${out}/CNAME`,'murch.org\n');
await writeFile(`${out}/.nojekyll`,'');
await writeFile(`${out}/robots.txt`,'User-agent: *\nAllow: /\nSitemap: https://murch.org/sitemap.xml\n');
await writeFile(`${out}/sitemap.xml`,'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/','/enough/','/justenough/','/enough/build/'].map(path=>`<url><loc>https://murch.org${path}</loc></url>`).join('')+'</urlset>\n');
// This superseded screenshot is not linked from the current site.
await rm(`${out}/site-assets/queen-east.png`,{force:true});
await mkdir(`${out}/enough/play`,{recursive:true});
await writeFile(`${out}/enough/play/index.html`,'<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/justenough/"><link rel="canonical" href="https://murch.org/justenough/"><title>Just Enough</title><a href="/justenough/">Play Just Enough</a></html>');
await writeFile(`${out}/enough/play/sources.html`,sources);
console.log(`Personal site and playable game built in ${out}`);
