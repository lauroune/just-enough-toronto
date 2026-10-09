# c0_0 · Leslieville (Queen East & Eastern Ave)

**Cell:** x 0..400, z 0..400. **Ring:** 1. **Data:** fetched 2026-10-08. 136 buildings (about 100 City-measured), 146 road segments (89 footways), 8 mapped trees, 9 parks/grass patches, 3 named places, 7 rail/tram lines. Queen East's authored map lies directly north (z < 0).

## Character
Leslieville. Queen St E runs along the north edge under the streetcar track. Eastern Ave crosses the south end. In between are rows of semi-detached houses on Empire, Booth and Logan Ave, with garages on the lanes.

## Heroes
- **433 Eastern Ave, "Building A" and "Building B"** (OSM `name`, `material=brick`, City heights 21.8 m and 22.7 m): warm industrial-loft brick in two tints, with a stylised stone coping on the roof edge (interpretation, not surveyed).
- **XYZ Storage** (OSM name, `shop=storage_rental`, 4 levels, `colour=grey`): grey industrial block with a named signband.
- **Experience Garage** (OSM name, `shop=car_repair`): named signband.
- **31 m apartment block** at about (217, 226), `building=apartments`, City height: modern curtain-wall style. It is the chunk's tallest building and has no OSM name.

## Choices
- Semis (6-point footprints) get a stylised gable over their oriented bounding box, with a chimney, because the kit only gables four-sided footprints. Six brick stocks are picked per building by hash.
- House backs and sides (walls that face no street) get window relief; otherwise they read as blank brick.
- Garages, commercial and other buildings over 13 m use the industrial style without shopfronts.
- Playground benches only at McCleary Playground (the one named park).

## Budget (evidence/chunks/c0_0, Low graphics)
Near layers: 368 k triangles, 123 meshes, build 1.0-3 s (one 7 s run came while other designers were rendering). Whole scene: about 0.9-1.7 M triangles depending on view.

## Data caveats
- Only three OSM places lie in the chunk, so the Queen St E shopfronts carry colour signbands without names.
- Several long 8-10 m brick walls seen from Empire Ave near z 120-200 still read blank. I couldn't trace them to a footprint; they may be row end-walls.
- Most house heights are 8 m default or City-measured; not tuned.

## Kit requests
- Gable roofs for non-4-point house footprints (hips, stepped footprints); a ridge along the longest wall.
- Window relief on walls that don't face a street, at least one row of windows on the far plane.
- Tree trunks are strongly orange; tone down.
- `facingStreet` could take a reach option per building.
