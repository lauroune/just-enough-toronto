# Chunk design playbook

How to make a 400 m chunk of Toronto look as good as Queen East, with the shared kit in `src/chunks/kit`. Read this before designing a chunk. The pilot chunk `src/chunks/areas/c-3_0` (Corktown) is the worked example.

## What makes Queen East look good

Ranked by payoff per effort. The kit already does 1–6 and 8. Your job is to choose well and add the rest.

1. **Facade relief as real geometry.** Each wall edge gets a frame facing the street, carrying the plinth, cornice and recessed windows with sills, lintels and mullions. Shadows in those recesses are what make a building read as real (`kit.building`).
2. **The lighting stack.** Golden sun with shadows, HDR sky, fog, ACES tone mapping, contact shadows and pastel material styling. This is global, so you never touch it. The chunk manager applies the styling to your chunk.
3. **Ground-floor shopfronts.** Use ~6.2 m bays with a dark surround, glass, a door and a coloured signband. Signbands carry **real shop names** from OSM when a named place sits inside the footprint.
4. **Real brick with colour variation.** PBR brick tinted by OSM `building:colour`, else one of five pale stocks.
5. **Street layers.** Asphalt, a raised curb, sidewalk paving, lane paint, zebra crossings at junctions, and streetcar track on TTC routes.
6. **Trees everywhere.** Use every mapped tree, plus street trees along residential and secondary sidewalks. A third get autumn tints.
7. **Roof silhouettes.** Gables and chimneys on houses, crowns and fins on towers, a steeple on a church. A street must never collapse into flat boxes against the sky.
8. **Distance LOD.** Near walls get relief, far walls get one textured plane, and everything batches into a few draw calls per 200 m.
9. **Hero buildings.** Pick one to three recognisable buildings per chunk and give them something specific: a steeple, a cupola, a corner turret, a marquee, distinctive cladding, a mural, a named sign. This is what people remember.
10. **Street furniture with intent.** Benches facing a park, lights along arterials. Don't scatter things randomly.

## The layers

| Layer | `ctx.layers.*` | Drawn | Put here |
|---|---|---|---|
| tile | `tile(x,z)` | to the fog line | massing, roofs, ground, streets, parks, big hero shapes (spires) |
| detail | `detail(x,z)` | within ~170–360 m (by graphics tier) | sills, mullions, shopfronts, signs, trees, lights, benches |
| far | `far(x,z)` | beyond detail range | the cheap facade planes that stand in for detail |

Groups are 200 m buckets in world metres. Always pass the object's own position.

## Rules (each one is checked or will bite)

- **Only touch your chunk's folder:** `src/chunks/areas/<id>/` (`data.json`, `index.ts`, `NOTES.md`). Never edit the kit, other chunks or core files. If the kit needs something, write it under "Kit requests" in your NOTES.md.
- **Deterministic:** use `ctx.rand()`, never `Math.random()`. The same chunk must always build the same way.
- **Materials:** use `kit.material(hex)`, `kit.brick(tint)` and `kit.kitMaterials()`. Never `new MeshStandardMaterial` per building, because shared materials are what let a tile batch into a few draw calls. One new material per chunk for a hero is fine if it's cached in a module-level variable.
- **Solid things:** `kit.building` registers the walls for you. Anything else the car could hit (towers, walls, sculptures) needs `ctx.solid(footprint, height)`.
- **Heights:** City-measured (`heightSource:'city'`) heights are authoritative; don't change them. OSM-derived and default heights may be tuned if you're confident.
- **Ground:** call `kit.baseHeight(points)` for y. Flat-ground chunks still get 0, and it keeps chunks next to the authored map seated on its terrain.
- **Stay out of the authored map:** the fetch script already drops anything east of x = −930 inside Queen East's bounds. Don't add any back.
- **Budget, per chunk** (`shoot-chunk.mjs` reports it): near layers (tile + detail) at most **550 k triangles** and **160 meshes**, built in under **4 s** on the dev sandbox's slow, noisy CPU (a typical PC is roughly 3× faster). The pilot measures about 445 k triangles, 153 meshes and 2–3 s. Detail windows stop at 22 m on towers, where fins and the far plane take over. Dentils go only on shopping streets. Reuse kit materials so batching works.
- **Honesty:** don't invent signs, businesses or landmarks that aren't in the data or a source you cite. Stylisation is fine; fabricated facts are not.

## Character by area

| Area | Look | Kit choices |
|---|---|---|
| Victorian main street (Queen, King E, parts of Dundas) | 2–4 storey brick, shopfront at street level, cornice | `victorian` + shopfronts, dentils come free under 17 m |
| Side streets (Corktown, Cabbagetown, Trinity-Bellwoods) | bay-and-gable houses, porches, mature trees | `house` gables and porches, tree spacing 9–11 m |
| Warehouse districts (King W / Spadina, Liberty Village) | 5–8 storey brick and timber lofts, big windows | `industrial` style, taller windows, few shops |
| Financial district / CityPlace | glass towers, podiums | `modern`, curtain wall below 22 m, crowns on top |
| Church and Wellesley / Bloor | mixed towers and Victorian rows | per-building style from tags |

## Workflow

1. `npx tsx scripts/chunks/plan.ts` shows the plan, your chunk's ring, and which neighbours are done.
2. `npx tsx scripts/chunks/fetch-chunk.ts <id>` writes `data.json` (OSM plus City heights).
3. Survey the data: street names, building kinds, heights, named buildings, places, parks. Write the character in one sentence and pick 1–3 heroes.
4. Write `index.ts`, starting from the pilot's structure: streets → parks → buildings (with per-building choices) → heroes → dressing.
5. Check:
   - `npx tsc --noEmit` and `npx tsx --test tests/chunks.test.ts`
   - `node scripts/chunks/shoot-chunk.mjs <id> <x> <z> <heading>` against the dev server on :3013, then **look at the screenshots** and iterate.
6. Write `NOTES.md`: character, heroes (with sources), data caveats, budget numbers, kit requests.
