# Acrylic paint assets

Four independent 960 × 960 transparent AVIF textures, encoded at quality 55 from 1254 × 1254 generated PNG masters. Each is drawn no larger than 275 CSS pixels on the desktop site, with more than 3 pixels of source detail per CSS pixel. The encoded textures total about 481 KB, compared with about 2.2 MB for the preceding four-quadrant PNG atlas.

Created with the built-in image generation tool, editing the preceding acrylic paint design. Each quadrant was recreated at full resolution before web encoding. Existing colours, silhouettes, placement and fixed positioning were retained.

Generation prompt (one call per colour cluster):

> From the reference, extract and recreate the selected paint cluster as one single large isolated paint cluster on a square transparent image. Remove the other three clusters completely. Enlarge that single selected cluster to occupy 86% of the whole canvas, preserving its colours, silhouette, curves, layered strokes and direction. Macro photograph of highly tactile acrylic impasto with sharp bristle grooves, pigment grains, subtle highlights and raised palette knife ridges. True transparent alpha outside the paint. Keep transparent margins on every side; no edge cropping. No text, extra strokes, background or shadow outside the paint. Show crisp microtexture rather than noise or plastic smoothness.

Clusters: ochre/gold/sienna/coral; pine/sage/petrol; cobalt/lavender; vermilion/pink/pale ochre.

`build-paint.mjs` embeds the textures and reading fonts in one render-blocking stylesheet. The build gives this stylesheet a content hash to avoid stale artwork. No image reveal animation or JavaScript loading gate is used.
