# c-2_0 · Lower Don & Bayview

**Cell:** x −800..−400, z 0..400. **Ring:** 1. **Data:** fetched 2026-10-08. 26 buildings (25 City-measured), 178 street segments, 60 mapped trees, 29 parks and water polygons, 9 rail/tram lines, 1 named place.

## Character
The Don Valley crossing east of Corktown: Queen, King and Eastern Avenue bridges over the river and the Don Valley Parkway, the River City 3 towers on Bayview Avenue, grassed slopes with Corktown Common, and low car showrooms on the east bank. Mostly open ground, so the towers, bridges and tree rows carry the look.

## Heroes
- **River City 3 (OSM `name=RC3`, 170 Bayview Ave, 31 levels, City heights up to ~101 m):** modern style, continuing the c-3_0 River City cladding across the seam. A parapet and mechanical penthouse cap each tall piece (stylised, not surveyed).
- **Eastern Avenue / Adelaide bridges (OSM `bridge=yes`):** concrete parapets with a steel rail along the bridge edges, only where no other carriageway occupies the spot. Style is generic, not surveyed.
- **BMW Toronto showroom (OSM `name`, `shop=car`):** modern glass style with ground-floor shopfronts; the largest piece carries the signband "BMW Toronto". "Mini Downtown" likewise carries its OSM name.

## Choices
- Lawren Harris Square apartments (OSM `material=glass`, 12 levels) in modern style, no shopfronts.
- Unnamed City massings (default, warehouse-like) as industrial brick, no shopfronts.
- Rail lines (`k=rail`) get a gravel bed, two rails and sleepers, draped on terrain.
- DVP carriageways get a low concrete edge barrier (generic).
- Slope trees: up to 5 per grassed polygon (~1 per 700 m²), kept 4 m off roads, 9 m apart, 6 m from mapped trees.
- Benches every ~50 m along the Corktown Common Trail, plus a pair in Lawren Harris Square.

## Budget (shoot-chunk, view at -600, 175)
Near layers: 184 k triangles, 117 meshes, build 0.6 s. Whole scene worst view: 642 draw calls, 1.54 M triangles.

## Data caveats
- Bridge roads are draped on the terrain by the kit; there is no deck or abutments, so the roads follow the valley contour, not a raised deck.
- The two Eastern Avenue bridge carriageways overlap in width, so parapets are skipped where they would sit across the other carriageway.
- Queen Street East and King Street East bridge segments are in the data but have no parapets here: the authored map owns the Queen viaduct truss.
- The mapped trees are all west of x −545 (Corktown Common); the east bank has no mapped trees, so street trees come from the kit fill.
- Known stuck point at (−583…−617, 1) is the authored parked-tram collider in `src/physics.ts`, not this chunk.
- The pitch polygons (two) are drawn as lawn only; their sport and markings are unknown.

## Kit requests
- A `kit.bridge` helper (deck slab, abutments, parapets, piers) driven by `road.bridge`, with the road raised on the deck rather than draped.
- Rail drawing (`ChunkData.rails` with `k:'rail'`): gravel bed, rails and sleepers, as in `railCorridor` here.
- Road-edge furniture helper that skips other roads, as `edgePieces` here.
- Tall slabs seen from the side are blank on walls that face no street (far plane only); a cheap detail pass for towers would help.
