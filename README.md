# Just Enough

**A Game About Context Engineering.**

[Play at murch.org/justenough](https://murch.org/justenough/) · [The story](https://murch.org/enough/) · [Mike Murchison](https://murch.org/)

Help Pip, a friendly delivery robot, carry pastries through Toronto’s Riverside and Leslieville. Choose up to four facts, send Pip, and revise the brief when the task or street changes. Three deliveries take roughly 8–12 minutes; you can also explore the neighbourhood.

This began with a conversation between Mike Murchison and Rinoc Johnson at Ada about compression, context windows, and task-dependent information. Intelligence involves choosing useful context, not simply maximizing it. The game uses deterministic planning rules, not a live AI model; its four-memory limit is a teaching device.

Mike built the game with Astra over a weekend, using his own photo library, recorded street videos, public geography, architectural references and iterative playtesting. Original personal photographs, footage, transcripts and private research are not part of this repository.

## Run it

Requires Node.js 20.19+ or 22.12+ and a browser with WebGL2.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No API keys, accounts or runtime model service are needed.

```sh
npm test
npm run eval:matrix
npm run build:site
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist-site
```

The complete static website is in `dist-site/`; the game is at `/justenough/`. The older `/enough/play/` address redirects to it. `npm run build` also produces a standalone game in `dist/`.

## Controls

WASD/arrows move; Shift rolls faster. Drag to look around, scroll to zoom, R to recenter. E inspects nearby clues; B/Tab opens the brief. The question mark explains the premise and controls. The map offers quick visits. Progress is saved in the browser.

## Expand Toronto

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and the runnable [route example](examples/new-neighbourhood.ts).

- Add a block: geography, terrain, building outlines and individually observed facades.
- Add a story: a task, limited information, changing world conditions, and a useful lesson.
- Improve the craft: movement, accessibility, materials, sound or performance.

The route planner accepts new node names and access rules. A general neighbourhood-pack loader and visual editor are future work. Current chapters and UI still have Queen East-specific rules.

## How it fits together

- `src/game.ts`: world truth, facts, three missions and delivery evaluation.
- `src/context-planner.ts`: generic planner that sees only the supplied access rules.
- `src/geography.ts`, `src/data/`: projected maps, streets, buildings and terrain.
- `src/geo-world.ts`, architectural modules: authored neighbourhood geometry.
- `src/scene.ts`, `src/motion.ts`, `src/physics.ts`: camera, movement, cart and Rapier collision.
- `src/main.ts`, `src/style.css`: game UI and saved progress.
- `site/`: personal homepage, project post and contribution page.
- `scripts/capture-film.mjs`: fixed-timestep in-game film capture (requires FFmpeg).

## A familiar place, with a glimpse of the future

The world covers King & River through Queen & Carlaw, with parts of De Grassi and Boulton. Mapped outlines and terrain are grounded in public data; many facades, heights and unseen details remain interpretations. This is a stylized reconstruction, not a survey or photogrammetric scan.

The Ontario Line and Leslieville Station appear completed, based on Metrolinx’s published artistic renderings, which remain subject to change. The game’s closed passage and winter conditions are fictional puzzle states, not live navigation information.

## Credits and licences

Original code is MIT licensed. **That licence does not cover every media asset.** Read [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), `public/materials/CREDITS.txt`, `public/geography/CREDITS.txt`, and bundled font licences before reusing assets.

Mike Murchison’s own photo library and recorded videos are credited as inputs. Third-party mural art and documentary imagery retain their creators’ rights; they are not offered under MIT or CC0. Replace or obtain permission for those images when required for your reuse. Attribution is not a substitute for permission.

[Mike Murchison](https://murch.org/) · [@mimurchison](https://x.com/mimurchison)

### Trailer

The post features a 1080p loop captured from the running game, including a real brief-editing interaction. With the development server on port 5178 and FFmpeg on your PATH, run `FILM_DIR=evidence/trailer node scripts/capture-film.mjs`, then `node scripts/capture-gameplay-film.mjs`, and `node scripts/assemble-trailer.mjs`. The last step writes the web video and poster into `site/assets/`. The title uses the same self-hosted Lobster Two face as the game; Newsreader supplies the complementary serif.
