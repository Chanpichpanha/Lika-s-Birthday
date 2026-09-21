# Finn's Sweet Surprise

A first-person 3D birthday adventure for Tra Rothlika, set inside a handcrafted candy-storybook world.

## Run it

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, then click **Enter the story**.

## Controls

- `W A S D` — move
- Hold and drag the mouse — look
- `Shift` — sprint
- `Space` — jump
- `E` — interact
- `Esc` — pause

On phones, use the left joystick to move, swipe on the right side to look, and use the on-screen sprint, jump, and interact buttons. Portrait mode remains playable, though landscape gives the widest view.

## Deploy to Vercel

Import this folder as a Vercel project. The included `vercel.json` runs `npm run build` and publishes `dist/`. No server or environment variables are required.

## Replacing the book placeholders

The keepsake pages are intentionally staged but unfilled. Edit the `spreads` array in `src/game.js` when the final wishes, birthday picture, personal picture, and meme are ready. Image assets can be placed in `public/assets/book/` and referenced from the page markup.
