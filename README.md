# Flappy Dog

A fun Flappy Bird-style browser game featuring a cute dog character!

## How to Play

1. Open `index.html` in your browser
2. Click **Play** or press **Space** to start
3. Tap / click / press **Space** to make the dog flap and fly upward
4. Avoid the pipes!
5. Each pipe you pass earns 1 point

## Features

- Cute animated dog character with floppy ears, wagging tail, and tongue
- Smooth canvas-based rendering at 60fps
- Parallax scrolling background with animated clouds
- Green pipes with gradient shading and caps
- Particle effects on flap, score, and game over
- Sound effects via Web Audio API (no external files needed)
- Score tracking with high score
- Responsive design with mobile touch support
- Game states: Menu, Playing, Game Over

## Tech Stack

- Pure HTML5 Canvas
- Vanilla CSS3
- Vanilla JavaScript (ES6+)
- Web Audio API for sound
- No dependencies, no build step

## Project Structure

```
dog-game/
├── index.html    # Main HTML page
├── styles.css    # UI styling (overlays, buttons, responsive)
├── game.js       # Game engine (rendering, physics, input)
├── package.json  # Project metadata
└── README.md     # This file
```

## Jira

Implemented for [KAN-2](https://wuttinun-chanfarrungrueng.atlassian.net/browse/KAN-2)
