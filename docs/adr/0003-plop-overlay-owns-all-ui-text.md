# Plop UI overlay owns all text; the canvas renders only the world

The Three.js canvas draws only the Market diorama: paper-cutout sprites on low-poly ground. Every piece of text and control (timer, Shopping List, Score, Combo, how-to, results, Nickname entry, Leaderboard) is a Plop UI React component layered over the canvas. We chose this over drawing the HUD in WebGL so the game uses the same primitives, tokens, fonts, focus rings, sound and dark mode as the rest of the site, and stays accessible to screen readers.
