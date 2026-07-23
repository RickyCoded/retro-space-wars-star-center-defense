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

## Gameplay

- Defend Star Center from waves of Void Empire ships.
- Destroy enemies to earn points.
- Track your high score in the HUD.
- Avoid enemy ships and enemy fire.
- Collect Chrono Crystals to briefly unlock spread fire.
- Before Boss 1 is defeated, only smaller heavy boss ships can drop Chrono Crystals, up to three per wave.
- After Boss 1 is defeated, regular normal ships can also drop Chrono Crystals, up to five per wave.
- Defeated boss cruisers drop a permanent dual missile gun power-up.
- Chrono Crystals temporarily override the dual missile gun with spread fire, then revert back to dual missiles when the Chrono effect ends.
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

During gameplay, the first track plays, then the second track plays, then the third track plays, then the playlist repeats. The game-over cue plays once after gameplay music stops. To replace the songs, overwrite those files with new MP3s using the same names. To change the filenames later, edit the `MUSIC_FILES` values near the top of `game.js`.

To change music volume, edit the `MUSIC_VOLUME` values near the top of `game.js`:

- Title music volume defaults to `0.45`
- Gameplay music volume defaults to `0.35`
- Game-over music volume defaults to `0.4`

Browsers usually block music until the player interacts with the page. The game starts music only after an input such as clicking **Start Mission**, pressing a key, or using the music button.

## Adding The Victory Cinematic

Place the final victory MP4 file in:

```text
assets/video/
```

Use this exact file name:

- `victory-cinematic.mp4` - cinematic played after the final boss is defeated

The cinematic plays once, then the victory screen appears with a flashing **Victory!** message. If the MP4 is missing or cannot play, the game skips directly to the victory screen. To change the filename later, edit the `VICTORY_CINEMATIC_SRC` value near the top of `game.js`.

## Project Files

- `index.html` - page structure and game screens
- `style.css` - retro arcade layout and responsive styling
- `game.js` - canvas drawing, controls, game loop, enemies, scoring, waves, sound
- `assets/images/` - optional ship image files
- `assets/audio/` - optional music files
- `assets/video/` - optional victory cinematic file
- `README.md` - local run instructions
