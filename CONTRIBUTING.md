# Bring your corner of Toronto

A good first contribution is one corrected facade or one connected block. Open an issue with the place, what you observed, and the change you want to make, or send a pull request.

## Start small

1. Run the game and visit the place you want to improve.
2. Use public map data or a reference you have permission to share. Record what is observed versus estimated. Do not upload private photographs, home interiors, personal routes, faces or licence plates.
3. Keep the existing metre-scale projection in `src/geography.ts`. Use `groundHeight` for terrain, actors and geometry. Connect new roads to existing endpoints.
4. Architectural modules add observed windows, brick, doors and rooflines. Use collision bounds that match the navigable space.
5. Add a map visit and exercise the approach on foot, the cart path, camera clearance and complete delivery.
6. Run `npm test`, `npm run eval:matrix` and `npm run build:site`. Check the result in a desktop browser and include a screenshot and known limitations.

## Add a delivery or an idea

Run `npm run example`. The example supplies its own graph and contrasts a narrow shortcut with a wider cart route. `src/context-planner.ts` can plan with new node IDs; the planner must only see what the brief allows, while a separate world evaluator determines what actually happens.

Current Queen East missions live in `src/game.ts`. If you extend their UI, update the chapter labels, saved-game validation and tests too. There is no drag-and-drop neighbourhood editor or pack loader yet.

Design a choice with consequences: information that matters, information that distracts, and a reason to revisit what was previously true. Avoid making failure depend on facts the player cannot discover.

## Media and privacy

Use your own shareable assets, cleared assets or compatible open licences. Add creator, source URL, licence and modifications to the credit files. Keep third-party artwork separate from MIT code. Do not remove credit or treat public visibility as permission to redistribute.

## Keep it playable

Preserve keyboard access, readable controls, reduced-motion settings, retry and saved progress. Test path connections and the 90 cm cart. Report performance changes with the same camera and quality settings. Keep original source media and local research out of commits.
