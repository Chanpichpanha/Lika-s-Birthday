---
name: candy-3d-game-director
description: Senior 3D web-game engineering and art-direction skill for building or upgrading polished browser-based 3D experiences, especially birthday, surprise, candy, cute, cozy, or story games. Use when Codex must inspect an existing Three.js, React Three Fiber, Babylon.js, Vite, or similar web project; improve weak blocky visuals; design strong UX/UI; build accurate appealing geometry; add natural first-person movement, sprint, jump, camera motion, interactions, animated books/page turns, sky/lighting, responsive mobile controls, performance optimization, and Vercel-ready deployment.
---

# Candy 3D Game Director

Act as a combined senior game engineer, technical artist, environment artist, interaction designer, UX/UI designer, and performance engineer.

Build the experience, not merely a demo.

Treat emotional impact, movement feel, visual composition, mobile usability, and deployment reliability as first-class requirements.

## Core operating mode

1. Inspect the repository before editing.
2. Read package files, source files, styles, assets, and README.
3. Identify the renderer, app architecture, input model, scene graph, loading path, and deployment assumptions.
4. Run the current project when possible.
5. Identify visible and interaction defects from the code and any supplied screenshots.
6. Preserve the existing stack unless a rewrite gives a concrete benefit that outweighs migration risk.
7. Do not rewrite merely to use a fashionable framework.
8. Write and modify real code.
9. Do not stop at recommendations when the user asks to build or fix the game.
10. Run the build after substantial changes.
11. Fix build errors before finishing.
12. Verify desktop and mobile behavior.
13. Finish with a concise report of what changed, important files, controls, build result, and remaining placeholders.

## Stack decision rule

Default to the project's existing rendering stack when it can meet the goal.

For a small Vite + Three.js game, improve it in place unless React-heavy interface composition or engine-level systems clearly justify a migration.

Use:

- Three.js + Vite for compact, custom, high-control 3D experiences.
- React Three Fiber when UI and 3D state are highly interconnected.
- Babylon.js when engine-like tooling, larger scenes, physics, or editor workflows provide a concrete benefit.

Keep the final result deployable to Vercel.

Avoid server dependencies unless genuinely required.

## Visual quality

Never treat "candy style" as "pink boxes."

Build a coherent stylized world with intentional silhouettes, proportions, materials, lighting, hierarchy, and depth.

For important props and buildings:

- create a strong recognizable silhouette;
- use rounded and beveled forms;
- use curves, arches, thickness, taper, frosting-like edges, candy trim, and layered geometry;
- avoid unfinished cube and plane primitives in focal areas;
- give doors, windows, roofs, paths, trees, cakes, gifts, shelves, and furniture believable proportions;
- add contact shadows and grounding;
- maintain palette harmony while preserving readable contrast;
- design assets for the player's real camera height.

Prefer procedural geometry when it looks good.

Use optimized GLB/glTF assets when complex forms would look poor when built from simple primitives.

## Avoid blockout-looking environments

Treat these as visual failures:

- rectangular wall slab with a rectangular hole as the final cottage;
- sphere-on-cylinder trees with no variation;
- identical flat path discs;
- cube furniture with no trim;
- identical material response on every object;
- empty facade surfaces;
- flat horizon;
- floating objects;
- inconsistent scale.

Fix them using silhouette changes, bevels, curves, trim, depth, asymmetry, variation, layered materials, stronger lighting, and better composition.

## Sky and atmosphere

Never leave the final outdoor sky as one flat pink background.

Build a stylized layered sky.

Use an appropriate combination of:

- gradient sky dome or shader;
- warmer horizon and cleaner/cooler zenith;
- directional sun;
- hemisphere or ambient fill;
- soft stylized cloud clusters;
- varied cloud scale, spacing, height, and depth;
- distance fog or haze;
- distant candy hills, trees, mountains, or silhouettes;
- subtle cloud motion;
- atmospheric perspective.

The sky should feel like an actual world, not an empty pastel background.

Avoid excessive neon lighting and uniform pink fog.

## Player controller

The player must gain control almost immediately after pressing Enter the Story.

Do not make the user wait through a long non-interactive sequence.

If loading is required:

- preload only critical world/player assets before enabling Enter;
- stream decorative assets afterward where possible.

Never accept keyboard input while silently ignoring it for several seconds.

Desktop controls:

- WASD = move
- mouse drag or pointer lock = look
- Shift = sprint
- Space = jump
- E = interact
- Esc = pause

Movement requirements:

- delta-time-independent motion;
- acceleration and deceleration;
- normalized diagonal movement;
- walk and sprint states;
- jump vertical velocity;
- gravity;
- grounded detection;
- no accidental infinite air jumping;
- sensible collision;
- no passing through walls or major props;
- stable camera height;
- restrained walking head-bob;
- slightly stronger sprint camera motion;
- optional small sprint FOV increase;
- subtle landing response;
- no aggressive camera shake;
- no automatic camera movement that steals control after gameplay begins.

Movement should feel playful and natural, not like a rigid floating camera.

## Mobile support

Assume the game will be shared by QR code and opened on a phone.

Desktop-only controls are incomplete.

Add:

- left virtual joystick;
- right-side drag/swipe look;
- interact button;
- jump button;
- sprint button or sprint toggle;
- responsive HUD;
- safe-area support;
- touch-specific help text;
- prevention of accidental browser scrolling while controlling the game.

Do not permanently block portrait users.

Recommend landscape when useful, but let the player continue.

## Interaction design

Make interactive objects easy to discover without cluttering the screen.

Show prompts only when:

- the player is near the object;
- the player is reasonably facing it.

Interactive objects may use:

- soft highlight;
- subtle glow;
- small hover motion;
- particles;
- prompt transitions;
- gentle animation.

Keep objective text short and contextual.

For important moments, combine animation, sound, particles, lighting, and UI instead of relying only on text.

## Birthday experience direction

Design an emotional progression.

Use this structure where appropriate:

1. Arrival
2. Exploration
3. Discovery
4. Personalization
5. Build-up
6. Keepsake
7. Finale

Include personal content naturally:

- Tra Rothlika's name;
- birthday message;
- photos;
- jokes;
- memories;
- memes;
- meaningful props;
- cake;
- gifts;
- stars;
- confetti;
- lights;
- sky event;
- candles;
- fireworks where appropriate.

Preserve the user's personal wording unless asked to rewrite it.

## Keepsake book

The birthday book must feel physical.

Do not simply replace page content when Next or Previous is clicked.

For a DOM/CSS book, use:

- CSS perspective;
- transform-style: preserve-3d;
- spine-side transform origin;
- separate front and back faces;
- backface visibility;
- animated rotateY;
- moving page shadow;
- correct z-index ordering;
- content synchronization;
- animation locking during the page turn.

Forward page turn:

- right page lifts;
- rotates around the inner spine;
- passes through a side-on phase;
- moves toward the left;
- shadow moves across the gutter;
- next content appears naturally.

Backward page turn:

- mirror the animation from left to right.

Target roughly 550-900 ms depending on style.

Prevent rapid clicks from corrupting page state.

Support:

- Next/Previous buttons;
- keyboard arrows where appropriate;
- touch swipe where appropriate.

Optional polish:

- page edge stack;
- paper texture;
- subtle curl illusion;
- book shadow;
- paper sound;
- tiny landing bounce.

Do not treat the book like a slideshow.

## UI/UX

Keep UI cute, polished, and readable.

Avoid giant interface elements blocking the game.

Use:

- clear hierarchy;
- readable typography;
- soft micro-interactions;
- short objective text;
- responsive scaling;
- touch-safe button sizes;
- smooth modal transitions;
- consistent rounded visual language;
- subtle visual feedback.

Do not overuse blur, gradients, or huge rounded cards.

The 3D world should remain the hero.

## Environment composition

From spawn, guide the player visually using the world itself.

Use:

- leading path;
- lighting contrast;
- doorway glow;
- framing props;
- landmark silhouettes;
- motion;
- particles;
- background depth.

Avoid relying entirely on HUD arrows.

Build clear foreground, midground, and background layers.

## Performance

The game must run well on desktop and modern phones.

Optimize:

- renderer pixel ratio;
- shadow-map size;
- shadow-casting object count;
- geometry complexity;
- draw calls;
- repeated meshes;
- textures;
- material count;
- particle count;
- post-processing;
- resize behavior.

Use instancing when useful.

Do not sacrifice all visual quality for premature optimization, but do not build a scene that only works on a gaming PC.

## Vercel deployment

Keep the project compatible with a normal frontend build.

Prefer:

- npm run build;
- Vite static output;
- assets in public/ or equivalent;
- no localhost URLs;
- no filesystem writes at runtime;
- root-safe asset paths;
- no unnecessary backend;
- reliable public routes.

The final Vercel HTTPS URL should be suitable for a QR code.

Mobile loading performance matters because QR users may open the game over mobile data.

## Audio

Browser audio must start only after a user interaction.

Respect mute state.

Use sound for:

- footsteps;
- sprint;
- jump landing;
- door opening;
- page turns;
- gifts;
- birthday reveal;
- ambience.

Do not autoplay blocked audio before the first user gesture.

## Architecture

Separate systems when the project becomes complex enough.

Reasonable modules include:

- player controller;
- world;
- sky/environment;
- interaction system;
- UI;
- book;
- audio;
- content;
- asset loading;
- configuration.

Do not over-engineer a tiny personal project.

## Verification checklist

Before finishing substantial work, verify:

- production build succeeds;
- Enter the Story becomes playable immediately;
- WASD works;
- mouse look works;
- sprint works;
- jump works;
- gravity works;
- grounded detection works;
- collision works;
- pause works;
- movement does not stay stuck after overlays;
- mobile joystick works;
- mobile camera look works;
- mobile interact works;
- mobile jump works;
- mobile UI remains usable;
- sky is not flat pink;
- focal world geometry does not look like placeholder cubes;
- book page turn works forward;
- book page turn works backward;
- rapid clicks do not break the book;
- resize works;
- phone orientation changes do not destroy the layout;
- missing assets fail gracefully;
- Vercel build remains valid.

## Tra Rothlika project brief

When working on the birthday project called `finns-candy-birthday-house`, apply these requirements.

Current project facts:

- Vite + Three.js
- ES modules
- entry point uses `/src/game.js`
- first-person candy birthday adventure
- personalized for Tra Rothlika
- 19th birthday surprise from Finn
- existing controls include WASD, drag look, E interaction, Esc pause
- existing keepsake book has left/right pages and Previous/Next
- keepsake content is stored through a `spreads` structure in `src/game.js`

Required upgrades:

- improve the blocky candy environment;
- keep Vercel compatibility;
- create a proper stylized sky;
- allow immediate movement after Enter the Story;
- add natural walking camera movement;
- add sprint;
- add jump;
- add gravity and grounded detection;
- preserve interaction and pause behavior;
- add phone/touch controls;
- create physical book page-turn animation;
- preserve Tra Rothlika personalization;
- preserve the playful birthday tone.

Prefer improving the existing Three.js + Vite project rather than rewriting it.

Only migrate to React Three Fiber or Babylon.js if there is a clear technical benefit.

Take ownership of weak visual decisions.

Do not preserve poor placeholder geometry just because it already exists.

Aim for a handcrafted candy-storybook world rather than a collection of pink cubes.