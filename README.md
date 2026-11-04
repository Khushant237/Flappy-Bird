# 🐦 Flappy Bird 3D - High-Res 3D Arcade for Android & Web

A next-generation **3D Flappy Bird** game with hardware-accelerated 3D graphics, procedural high-resolution textures, synthesized WebAudio sound effects & retro synthwave music, and a customizable Settings menu.

The game is packaged as a ready-to-install Android APK (`FlappyBird3D.apk`) and can also be played in any modern web browser.

---

## 🎮 Features

### 🌟 3D Graphics & Visuals
- **Articulated 3D Bird Model**: Features procedural feather textures, articulated flapping 3D wings, 3D expressive eyes with pupil highlights, cute head crest feathers, fluttering tail, and dynamic banking/pitching physics.
- **High-Res Procedural Textures (1024x1024 / 2048x2048)**: Brushed metallic pipes with specular highlights and rivet seams, lush layered grass blades and dirt strata, soft volumetric low-poly clouds, and dynamic day/sunset/night sky atmosphere.
- **Particle System**: Wing flap feather puffs, speed streaks, point scoring ring bursts, and crash debris explosions with screen shake.
- **Performance Optimized**: Runs at a smooth 60–120 FPS on Android devices with customizable graphics quality presets (*High*, *Medium*, *Low*).

### ⚙️ Settings Menu (Gear Button)
Tap the **⚙ Gear Button** anytime to open the settings:
1. **Difficulty Selector**:
   - **Easy**: Relaxed speed, wider gap (3.8 units), forgiving collision box, gentle gravity.
   - **Normal**: Classic authentic Flappy Bird challenge.
   - **Hard**: Fast scrolling, tight gaps, snappy gravity.
   - **Insane**: Extreme speed, narrow gaps, and **dynamically bobbing/oscillating pipes**!
2. **Audio & Sound Controls**:
   - **Music Toggle**: Turn background music ON/OFF.
   - **Music Volume Slider**: Fine-tune volume (0% to 100%).
   - **Sound Effects Toggle**: Turn sound effects ON/OFF.
   - **SFX Volume Slider**: Fine-tune SFX volume (0% to 100%).
3. **Customization & Skins**:
   - **Bird Skins**: *Classic Goldie*, *Cyber Neon*, *Crimson Phoenix*, *Shadow Ninja*.
   - **Pipe Styles**: *Classic Emerald*, *Steampunk Brass*, *Cyberpunk Glow*.
   - **Atmosphere & Sky**: *Dynamic Cycle* (shifts with score), *Sunny Day*, *Golden Sunset*, *Midnight Stars*.
4. **Gameplay & Accessibility**:
   - **Tap Force / Sensitivity**: Adjustable bounce force multiplier (70% to 130%).
   - **Show FPS Counter**: Real-time frame rate display toggle.
   - **Reset High Scores**: Reset records per difficulty with confirmation.

### 🎵 Procedural WebAudio Synthesis
- Built using the native Web Audio API — **zero external audio files**, 100% offline, zero latency:
  - Upbeat retro polyphonic synthwave background track (arpeggios + bassline + lead).
  - Punchy FM-synthesized flap whoosh.
  - Dual-bell score chimes.
  - Triumphant high score fanfare.
  - Deep impact hit sound and descending slide whistle on game over.

---

## 📱 How to Install on Android

The signed, release-ready APK is generated at:
```
/home/khushant/Flappy Bird/FlappyBird3D.apk
```

### Method 1: Install via USB / ADB
If your phone is connected to your computer with USB Debugging enabled:
```bash
adb install "/home/khushant/Flappy Bird/FlappyBird3D.apk"
```

### Method 2: Transfer to Phone
1. Copy `FlappyBird3D.apk` to your phone via USB cable, Google Drive, Bluetooth, or local network.
2. Open your phone's **Files** or **Downloads** app.
3. Tap `FlappyBird3D.apk` and select **Install**.
4. *(If prompted, allow "Install unknown apps" for your file manager in Android Settings).*

---

## 💻 How to Play in Your PC Browser

You can preview and play the game immediately on your computer:
```bash
cd "/home/khushant/Flappy Bird"
./play_in_browser.sh
```
Then open [http://localhost:8080](http://localhost:8080) in your browser (Chrome, Firefox, Edge).

- **Controls**: Tap screen, click mouse, or press **Spacebar** / **Up Arrow** to flap. Press **P** to pause.

---

## 🛠️ How to Rebuild the APK

If you make any changes to the game files in `game/`, you can rebuild the APK in seconds:
```bash
cd "/home/khushant/Flappy Bird"
./build_apk.sh
```
This runs the standalone Android SDK build chain (`aapt2` -> `javac` -> `d8` -> `zipalign` -> `apksigner`) and updates `FlappyBird3D.apk`.

---

## 📁 Project Structure

```
Flappy Bird/
├── FlappyBird3D.apk            # Compiled, signed Android APK (ready to install!)
├── build_apk.sh                # Instant standalone APK build script
├── play_in_browser.sh          # Local preview web server launcher
├── generate_icons.py           # Script to generate HD app icons
│
├── game/                       # Core 3D Game files
│   ├── index.html              # Main HTML entry point & UI overlays
│   ├── css/
│   │   └── style.css           # Modern glassmorphism arcade UI styling
│   └── js/
│       ├── three.min.js        # Three.js 3D WebGL engine
│       ├── textures.js         # Procedural high-res texture generator
│       ├── audio.js            # Polyphonic WebAudio synth & SFX engine
│       ├── models.js           # 3D models (Bird, Pipes, Ground, Clouds, Particles)
│       ├── game.js             # Physics, state machine, difficulty curves
│       └── ui.js               # HUD, menus, and settings modal controller
│
├── android/                    # Android Studio wrapper project
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/flappybird3d/game/MainActivity.java
│   │       ├── assets/         # Bundled game files inside APK
│   │       └── res/            # Strings, styles, colors & mipmap app icons
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
│
└── android-sdk/                # Local Android SDK (platforms;android-34, build-tools;34.0.0)
```
