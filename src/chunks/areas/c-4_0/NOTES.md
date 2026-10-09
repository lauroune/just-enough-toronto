# c-4_0 · Corktown West: Parliament, Power Street & Sackville

**Cell:** x −1600..−1200, z 0..400. **Ring:** 2 (west neighbour of the pilot c-3_0). **Data:** fetched 2026-10-08. 113 buildings, 251 street segments (139 footways, 50 service), 37 mapped trees, 49 parks, 19 rails (18 tram on Parliament St), 40 places.

## Character
City-measured apartment towers (50–84 m) along Parliament / Adelaide, Victorian brick low-rise and bay-and-gable side streets around Sackville Playground and Orphan's Green, King East shops, and the two churches by Power and Trinity Streets. Style continues c-3_0 (same kit defaults, pale-brick tints, church steeple helper).

## Heroes
- **St. Paul's Basilica** (OSM `name`, `building=church`, City height 31.7 m): warm stone tint, plus a stylised copper-green drum and dome over the footprint centre. The dome is an interpretation; its real form was not surveyed here. Not directly framed in a screenshot (dome sits above the frame at street level).
- **Little Trinity Anglican Church** (OSM `name`, `building=church`): brick tint and a stylised brick tower with slate spire (interpretation, as in c-3_0).
- **Enoch Turner Schoolhouse Museum** (OSM `name`): Victorian brick, tinted warmer; no extra geometry.

## Choices
- Buildings of 40 m or more are forced to `modern`; all other buildings use the kit's tag-based style.
- Sub-5 m untagged sheds are `industrial` without shopfronts; construction sites capped at 4 m.
- Benches face each other in each named park (Sackville Playground, Orphan's Green, Little Trinity Church Park, 40 Power Street Park).
- Signbands come from kit defaults (named places inside footprints, e.g. Gilead Café, Roselle on King East).

## Budget (shoot-chunk, default viewpoint)
Near layers 431,075 triangles, 147 meshes, build 1.9–2.4 s. Whole scene 349 draw calls, 795,627 triangles. Within budget.

## Data caveats
- 83 of 113 buildings have no `kind`; styles come from height and size only.
- The 84 m tower at (−1577, 199) and the 51 m group near (−1590, 325) are unnamed in OSM, so they are not labelled.
- Footways dominate the street list and render as paving strips.
- The default screenshots land on a grass park and a plaza; viewing hero buildings needs explicit coordinates.

## Kit requests
- A kit helper for a church tower/dome so chunks stop duplicating the steeple function.
- Park-bordering street trees and a lighter tree (instancing) as in c-3_0 notes.
- Signbands from `shop` names on nearby addresses, not just places inside the footprint.
