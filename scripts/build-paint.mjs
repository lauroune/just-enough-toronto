import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Paint and type share a render-blocking response: no late image requests,
// client-side reveal, or page-hidden-until-JavaScript loading screen.
export async function buildPaintStylesheet(){
 const rules=[];
 for(const [family,file,weight] of [
  ['Bricolage Grotesque','bricolage-grotesque','400 700'],
  ['Source Serif 4','source-serif-4','400 600'],
 ]){
  const data=(await readFile(`site/assets/fonts/${file}.woff2`)).toString('base64');
  rules.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2')}`);
 }
 // Media-qualified render-blocking stylesheets prioritize the current artwork.
 // Inactive compositions do not delay the first complete paint-and-type frame.
 const variants=[];
 for(const [file,media] of [
  ['toronto-acrylic-water-edge','(min-width: 1101px)'],
  ['toronto-acrylic-square','(min-width: 761px) and (max-width: 1100px)'],
  ['toronto-acrylic-portrait','(max-width: 760px)'],
 ]){
  const data=(await readFile(`site/assets/paint/${file}.avif`)).toString('base64');
  const css=`.paint-landscape{background-image:url(data:image/avif;base64,${data})}`;
  const hash=createHash('sha256').update(css).digest('hex').slice(0,12);
  variants.push({css,media,filename:`paint-art-${hash}.css`});
 }
 const css=rules.join('\n');
 const hash=createHash('sha256').update(css).digest('hex').slice(0,12);
 return {css,filename:`paint-type-${hash}.css`,variants};
}
