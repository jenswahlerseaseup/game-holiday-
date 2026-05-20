# The Forest Eats Memories

A 2D story-driven indie game inspired by Studio Ghibli / My Neighbor Totoro.

Near a small countryside village there is an ancient forest.
People enter when they are grieving. They always come back happy.
They always come back a little emptier.

---

## Running the game

Open `index.html` in any modern browser.
An internet connection is required on first load (Phaser 3 loads from CDN).

No build step. No dependencies to install.

---

## What's playable

**Chapter 1 — Arrived** is fully implemented:

1. **Opening** — black screen, rain on glass, `Summer, 1994`
2. **Car scene** — driving through countryside at night, dialogue with mom
3. **Village** — walking through the rain-lit village at night
4. **Forest edge** — the summer house, the first glimpse of a creature
5. **The shop** — meeting Kenta, and the word that changes everything

Click / press any key to advance dialogue.

---

## Project structure

```
index.html          — entry point
src/
  palette.js        — colour constants
  AudioSystem.js    — procedural Web Audio (rain, wind, cicadas, chimes)
  DrawUtils.js      — canvas-2D helpers (trees, characters, buildings, etc.)
  DialogueSystem.js — typewriter dialogue box with choices
  scenes/
    OpeningScene.js
    CarScene.js
    VillageScene.js
    ForestScene.js
    ShopScene.js
    EndScene.js
  main.js           — Phaser 3 config
GAME_DESIGN.md      — full design bible (characters, creatures, story structure)
```

---

## Design

See [`GAME_DESIGN.md`](GAME_DESIGN.md) for the full design document covering:
characters, creatures, all six chapters, art direction, sound design, and mechanics.
