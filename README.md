# Retro Space Wars: Star Center Defense

A small browser-based 2D arcade shooter built with plain HTML, CSS, and JavaScript. No backend, database, build step, or required outside assets.

## How to Run Locally

Option 1: Open directly

1. Open `index.html` in your web browser.
2. Click **Start Mission**.

Option 2: Run with a simple local server

If you have Python installed, open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Controls

- Move left: Left Arrow or A
- Move right: Right Arrow or D
- Shoot: Spacebar
- Pause or resume: P
- Mobile: use the on-screen touch buttons. Tap fire once to enable auto-fire for the rest of that mission.

## Mobile Performance

The game automatically uses a lighter visual mode on touch devices. Mobile performance mode keeps gameplay, scoring, waves, and power-ups the same, but reduces canvas render scale, glow intensity, and particle counts so phones have less work to draw every frame.

## Gameplay

- Defend Star Center from waves of Void Empire ships.
- Destroy enemies to earn points.
- Track your high score in the HUD.
- Avoid enemy ships and enemy fire.
- Collect Chrono Crystals to briefly unlock spread fire.
- Only smaller heavy mini-boss ships can drop Chrono Crystals.
- Chrono Crystal drops have a 55% chance from eligible heavy mini-boss ships, up to three per wave through Wave 20 and four per wave after Wave 20.
- Defeated boss cruisers drop special boss rewards: Boss 1 drops dual missiles, Boss 2 drops dual missiles with every-fourth-shot missile fire, Boss 3 drops an over-shield, and Boss 4 drops stronger red dual lasers.
- Chrono Crystals temporarily override the dual missile gun with spread fire, then revert back to dual missiles when the Chrono effect ends.
- The over-shield makes the hero ship glow and absorbs 20 damage before normal shield takes damage again.
- The red dual-laser reward fires two red shots that hit slightly harder than the blue dual lasers.
- After Wave 20, the Quantum Disruptor can appear once on a random normal wave and equips a piercing ultra laser until the hero receives 10 damage.
- Fight a Void Empire cruiser boss every 5 waves.
- Defeat Boss 5 to complete the game.
- Each wave gets harder and adds more enemies.
- The game ends when Alliance shield reaches zero.
- Use the restart button after game over to play again.

## Replacing Ship Images

The game can use optional PNG images for the player and enemies. Place your files in:

```text
assets/images/
```

Use these exact file names:

- `playerShip.png` - Alliance player ship
- `enemyShip1.png` - basic Void Empire enemy
- `enemyShip2.png` - shooter Void Empire enemy
- `bossShip.png` - heavy enemy ship
- `powerUp.png` - Chrono Crystal spread-fire power-up

Transparent-background PNGs work best. Square images around 128x128 pixels are a good starting size for ships. The Chrono Crystal can be smaller, around 64x64 pixels. The game will scale images automatically. If any image is missing or fails to load, the game falls back to the original simple canvas shape for that ship or power-up.

## Boss Cruiser Images and Settings

Place boss PNG files in:

```text
assets/images/
```

Use these exact file names:

- `boss1.png` - Wave 5 boss
- `boss2.png` - Wave 10 boss
- `boss3.png` - Wave 15 boss
- `boss4.png` - Wave 20 boss
- `boss5.png` - Wave 25 boss

Transparent-background PNGs are recommended. Source images can be 128x128, 192x192, or 256x256 pixels. The game scales bosses without distorting their aspect ratio. If a boss image is missing or cannot load, the game draws a fallback cruiser shape.

Boss values are stored in the `bossConfigs` array near the top of `game.js`.

- Change boss health with `maxHealth`
- Change boss names with `name`
- Change boss image paths by editing each config's `imageKey` and the matching `shipImages` entry
- Change boss size with `size`
- Change boss waves with `wave`
- Change boss attacks with `patterns`
- Change boss score bonuses with `scoreValue`

Boss reward drops are assigned in the `defeatBoss()` function in `game.js`. The Wave 15 boss uses the `overShield` reward, and the Wave 20 boss uses the `redDualLaser` reward. To change the over-shield strength, edit the player's `overShieldMax` value in `resetGame()`. To adjust the red laser strength, edit the `damage` values in the red dual-laser shot entries inside `shootPlayer()`.

## Current Power-Up Settings

Chrono Crystal drops are controlled by the `maybeDropPowerUp()` function in `game.js`.

- Eligible drop source: smaller heavy mini-boss ships only
- Drop chance: `0.55`, or 55%, when an eligible ship is destroyed
- Drop cap through Wave 20: `3` Chrono Crystals per wave
- Drop cap after Wave 20: `4` Chrono Crystals per wave
- Drop cap reset: every new wave
- Pickup duration: `7` seconds of spread fire
- Pickup image: `assets/images/powerUp.png`
- Fallback: if `powerUp.png` is missing, the game draws the Chrono Crystal with canvas shapes

Boss cruiser rewards are separate from Chrono Crystal drops:

- Wave 5 Boss 1: `dualMissile`
- Wave 10 Boss 2: `dualMissilePlus`
- Wave 15 Boss 3: `overShield`
- Wave 20 Boss 4: `redDualLaser`
- Wave 25 Boss 5: final victory, no power-up drop

Quantum Disruptor settings:

- First possible wave: Wave 21
- Last possible wave: Wave 24
- Appearance limit: once per game
- Spawn timing: one random normal wave after Wave 20
- Weapon effect: one ultra laser shot that pierces through enemies and keeps traveling
- Weapon priority: overrides Chrono Crystal, blue dual lasers, and red dual lasers while active
- Damage limit: deactivates after the hero receives `10` incoming damage
- Boss behavior: can be carried into the final boss fight if the hero has not taken enough damage to deactivate it

Available boss attack pattern names are:

- `aimed`
- `spread3`
- `spread5`
- `cannons`
- `burst`
- `heavy`
- `sweep`

## Adding Music

Place the music MP3 files in:

```text
assets/audio/
```

Use these exact file names:

- `title-theme.mp3` - title-screen music
- `gameplay-theme.mp3` - first gameplay music track
- `gameplay-theme-2.mp3` - second gameplay music track, played after the first one ends
- `gameplay-theme-3.mp3` - third gameplay music track, played after the second one ends
- `game-over-theme.mp3` - short cue for the "Star Center Has Fallen" screen
- `victory-theme.mp3` - looping victory music for the final cinematic and victory screen

During gameplay, the first track plays, then the second track plays, then the third track plays, then the playlist repeats. The game-over cue plays once after gameplay music stops. The victory theme starts when the final cinematic begins and keeps looping on the victory screen until the player chooses **Play Again** or **Return to Title**. To replace the songs, overwrite those files with new MP3s using the same names. To change the filenames later, edit the `MUSIC_FILES` values near the top of `game.js`.

To change music volume, edit the `MUSIC_VOLUME` values near the top of `game.js`:

- Title music volume defaults to `0.45`
- Gameplay music volume defaults to `0.35`
- Game-over music volume defaults to `0.4`
- Victory music volume defaults to `0.42`

Browsers usually block music until the player interacts with the page. The game starts music only after an input such as clicking **Start Mission**, pressing a key, or using the music button.

## Adding Sound Effects

The game currently uses custom WAV files for the hero laser, normal enemy destruction, and boss destruction. This avoids repeated short MP3 playback, which can cause lag on some mobile browsers.

To enable or disable custom sound-effect files later, edit the `USE_CUSTOM_SOUND_EFFECTS` values near the top of `game.js`, then place the custom files in:

```text
assets/audio/
```

Current custom sound-effect file names:

- `hero-laser.wav` - played when the Alliance starfighter fires
- `enemy-destroyed.wav` - played when a normal enemy ship is destroyed
- `boss-destroyed.wav` - played when a large boss cruiser is destroyed

For short effects, WAV files are recommended over MP3 files for smoother mobile playback. If a custom sound effect is enabled and the file is missing or cannot play, the game uses the original simple sound effect. To change filenames or volumes later, edit the `SOUND_EFFECT_FILES` and `SOUND_EFFECT_VOLUMES` values near the top of `game.js`.

Current sound-effect volume settings:

- Boss destroyed MP3 volume defaults to `0.26`
- Enemy destroyed MP3 volume defaults to `0.18`
- Hero laser MP3 volume defaults to `0.13`
- Generated fallback sound-effect multiplier defaults to `0.42`
- Generated boss destroyed tone gain defaults to `0.18`
- Generated enemy destroyed tone gain defaults to `0.12`
- Generated hero laser tone gain defaults to `0.09`

## Adding The Victory Cinematic

Place the final victory MP4 file in:

```text
assets/video/
```

Use this exact file name:

- `victory-cinematic.mp4` - cinematic played after the final boss is defeated

The cinematic plays once, then the victory screen appears with a flashing **Victory!** message. The `victory-theme.mp3` music continues across both screens. If the MP4 is missing or cannot play, the game skips directly to the victory screen. To change the filename later, edit the `VICTORY_CINEMATIC_SRC` value near the top of `game.js`.

## Project Files

- `index.html` - page structure and game screens
- `style.css` - retro arcade layout and responsive styling
- `game.js` - canvas drawing, controls, game loop, enemies, scoring, waves, sound
- `assets/images/` - optional ship image files
- `assets/audio/` - optional music files
- `assets/video/` - optional victory cinematic file
- `README.md` - local run instructions
