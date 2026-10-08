# c-3_0 · Corktown & West Don Lands (pilot)

**Cell:** x −1200..−800, z 0..400. **Ring:** 1. **Data:** fetched 2026-10-08. 94 buildings (14 City-measured), 284 street segments, 62 mapped trees, 42 parks, 11 named places.

## Character
Victorian worker terraces and semis on narrow side streets. King St E main-street shops under the streetcar wires. The River City mid-rise cluster by the Don. Small parks: Percy Park, Orphan's Green, Lawren Harris Square.

## Heroes
- **River City Phase 4** (OSM `name`, City heights 42–51 m): modern style, curtain wall and balconies.
- **Riverside Evangelical Missionary Church** (OSM `name`, `building=church`): pale brick, plus a stylised brick tower and slate spire at its northwest corner. The tower's real form isn't surveyed here; it's an interpretation.

## Choices
- Construction sites (`building=construction`) are capped at 4 m as hoarding-height industrial blocks.
- Street trees fill every ~11 m on residential and secondary sidewalks: OSM maps 62 trees, real Corktown has many more.
- Two benches face each other at the centre of each named park.

## Budget (Low graphics, Sumach St near Percy Park)
165 draw calls and 830 k triangles for the whole scene, including the downtown backdrop. That's over the 600 k guide, mostly from leaf cards; see the kit requests.

## Data caveats
- Footway and cycleway segments make up 180 of the 284 street segments and are drawn as paving strips.
- `trees` covers park trees only, not street trees.

## Kit requests
- Leaf cards per tree scale with height (~40–55). Consider instancing trees, or halving cards at Low graphics.
- Shopfront signbands could use OSM `shop` names from addresses on the same street, not just places inside the footprint.
