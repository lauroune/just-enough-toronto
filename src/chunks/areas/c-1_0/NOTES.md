# c-1_0 · Leslieville & Broadview

**Cell:** x −400..0, z 0..400. **Ring:** 1. **Data:** fetched 2026-10-08. 56 buildings (about 24 City-measured, the rest default heights), 139 road segments (71 footways, 33 unnamed service), 15 mapped trees, 12 parks, 16 rail ways (6 heavy rail, 10 tram), 3 places.

## Character
Rows of semi-detached and detached houses on narrow streets (Saulter, Lewis, Strange, Dibble) running south off Queen Street East toward Eastern Avenue. Broadview Avenue is the wide north-south spine at the west edge; Eastern Avenue bends diagonally across the south-west. Glassy car showrooms stand at Eastern and Broadview; a twin-track rail line cuts through the south-west corner. The house streets are the strongest part (see the Saulter St shot).

## Heroes
- **Broadview Lofts** (OSM `name`, `building=apartments`, 7 levels, 24.2 m): big L-shaped footprint on Broadview Ave. Victorian style with a terracotta-brick tint (stylised colour; no OSM colour tag) and a small stair/lift core on the roof (an interpretation, not surveyed).
- **Mini Downtown** (OSM `name`, `building=retail`, `shop=car`, four buildings, City heights 6–15 m): drawn in the modern style (dark panel and curtain wall) as car showrooms, each signband reading "Mini Downtown" from the OSM name. Not a landmark in the strict sense, but it is the most distinctive built form here.

## Choices
- `construction` capped at 4 m as an industrial hoarding block, as in the pilot.
- `abandoned` houses use the house style with a dull grey-brown tint.
- `industrial` and `commercial` kinds without shops use the industrial style (big windows, no shopfronts).
- Heavy rail (`railway=rail`) is drawn as a ballast bed with two steel rails. Trams are left to the street kit (Queen's streetcar slab).
- Street trees every 10 m on residential and secondary roads; benches in the one named park (Saulter Street Parkette).
- Stacked footprints at (−126, 244) (three City buildings, 19–20 m, no tags) are left as default massing; their use is unknown.

## Budget (default view, Queen St E at Saulter)
159 k near triangles (tile 13.6 k, detail 145.8 k), 116 near meshes (tile 52, detail 64), chunk build 0.5 s. Whole scene 780 draw calls and 1.49 M triangles including the downtown backdrop. Well inside budget.

## Data caveats
- 21 of the 56 buildings have no `kind`; 16 have the default height (8 or 10 m) and are guesses.
- Only 15 mapped trees; the rest are generated street trees.
- Queen Street East here is only a 3-segment stub along the north edge; the authored map takes over at the boundary.
- Screenshot framings placed inside footprints (e.g. x −250, z 250) show the car within a building; use road points (Saulter x −114, Eastern near −336, 238) for review.

## Kit requests
- Expose `reach` (facingStreet) through `BuildingOptions`: big buildings set back from a street (Broadview Lofts' inner walls) get only the flat far plane and look blank at close range.
- The `industrial` style ignores `tint`; allow a tint so loft and warehouse brick can vary.
- Draw `rails` (heavy rail ballast, ties and rails) in the kit; chunks currently hand-roll it.
- Leaf cards per tree are costly; consider instancing.
