// game.js - Core 3D Game Engine and State Machine for Flappy Bird 3D

class FlappyGame {
    constructor() {
        this.container = document.getElementById('game-canvas-container');
        this.scoreElement = document.getElementById('hud-score');

        // Game States: 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.state = 'START';
        this.score = 0;
        this.highScore = 0;

        // Settings (loaded from localStorage)
        this.difficulty = localStorage.getItem('fb_difficulty') || 'normal';
        this.birdSkin = localStorage.getItem('fb_bird_skin') || 'classic';
        this.pipeStyle = localStorage.getItem('fb_pipe_style') || 'classic';
        this.theme = localStorage.getItem('fb_theme') || 'dynamic';
        this.graphicsQuality = localStorage.getItem('fb_graphics') || 'medium';
        this.sensitivity = parseFloat(localStorage.getItem('fb_sensitivity') || '1.0');

        // Pre-allocated THREE objects to eliminate GC stutter during per-frame loops
        this._skyColor = new THREE.Color();
        this._fogColor = new THREE.Color();
        this._lightColor = new THREE.Color();
        this._stormSkyColor = new THREE.Color(0x212b36);
        this._stormFogColor = new THREE.Color(0x37474f);

        // Dynamic Time of Day & Weather System
        // timeOfDay: 0.0 (Dawn) -> 0.35 (Noon/Day) -> 0.65 (Sunset) -> 0.85 (Night) -> 1.0 (Dawn)
        this.timeOfDay = 0.25;
        this.timeSpeed = 0.018; // Speed of day-night progression
        this.weatherState = 'CLEAR'; // 'CLEAR', 'CLOUDY', 'RAIN'
        this.rainIntensity = 0; // 0 to 1
        this.targetRainIntensity = 0;
        this.weatherTimer = 0;

        // Physics variables
        this.birdVelocityY = 0;
        this.birdY = 0;
        this.birdX = -2.8;
        this.groundY = -4.5;
        this.ceilingY = 6.8;

        // TV Camera Layout (Cinematic 16:9 widescreen)
        this.baseCamZ = 10.5;
        this.baseCamX = 0.0;

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Scene Entities
        this.bird = null;
        this.ground = null;
        this.pipes = [];
        this.clouds = [];
        this.particles = null;

        // Celestial & Weather Entities
        this.sun = null;
        this.moon = null;
        this.rainSystem = null;

        // Lighting & Environment
        this.dirLight = null;
        this.hemiLight = null;
        this.ambientLight = null;

        // Camera Shake
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        // FPS tracking
        this.lastFpsUpdate = 0;
        this.frameCount = 0;

        this.diffParams = this.getDifficultyParams(this.difficulty);
        this.loadHighScore();

        this.initThree();
        this.initWorld();
        this.initEvents();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    getDifficultyParams(diff) {
        switch (diff) {
            case 'easy':
                return { speed: 3.6, gap: 3.8, gravity: 22, jumpForce: 8.8, pipeSpacing: 7.5, bobAmplitude: 0 };
            case 'hard':
                return { speed: 5.6, gap: 2.6, gravity: 32, jumpForce: 10.5, pipeSpacing: 6.2, bobAmplitude: 0 };
            case 'insane':
                return { speed: 6.8, gap: 2.3, gravity: 36, jumpForce: 11.2, pipeSpacing: 5.6, bobAmplitude: 1.2 };
            case 'normal':
            default:
                return { speed: 4.6, gap: 3.1, gravity: 27, jumpForce: 9.6, pipeSpacing: 6.8, bobAmplitude: 0 };
        }
    }

    loadHighScore() {
        this.highScore = parseInt(localStorage.getItem(`fb_highscore_${this.difficulty}`) || '0', 10);
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(`fb_highscore_${this.difficulty}`, this.highScore);
            return true;
        }
        return false;
    }

    resetHighScores() {
        ['easy', 'normal', 'hard', 'insane'].forEach(d => {
            localStorage.removeItem(`fb_highscore_${d}`);
        });
        this.highScore = 0;
    }

    updateCameraLayout() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const aspect = w / h;
        this.camera.aspect = aspect;

        // Cinematic 16:9 widescreen TV framing
        this.baseCamZ = 10.5;
        this.baseCamX = 0.0;
        this.camera.fov = 54;

        this.camera.position.z = this.baseCamZ;
        this.camera.position.x = this.baseCamX;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    initThree() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x64b5f6);
        this.scene.fog = new THREE.Fog(0xbbdefb, 14, 42);

        this.camera = new THREE.PerspectiveCamera(68, width / height, 0.1, 100);
        this.camera.position.set(this.baseCamX, 0.5, this.baseCamZ);
        this.camera.lookAt(this.baseCamX, 0.0, 0);

        this.renderer = new THREE.WebGLRenderer({
            antialias: false, // Essential for Android TV 60 FPS
            powerPreference: 'high-performance',
            precision: 'mediump',
            stencil: false,
            depth: true
        });
        this.renderer.setSize(width, height);

        // Clamp pixel ratio for TV: prevents fill-rate saturation on 1080p/4K TVs
        let maxDPR = 0.85;
        if (this.graphicsQuality === 'high') maxDPR = 1.0;
        else if (this.graphicsQuality === 'low') maxDPR = 0.7;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));

        // Always disable shadow map on TV for butter-smooth 60 FPS
        this.renderer.shadowMap.enabled = false;

        this.container.appendChild(this.renderer.domElement);
        this.updateCameraLayout();

        window.addEventListener('resize', () => {
            this.updateCameraLayout();
        });
    }

    initWorld() {
        // 1. Lighting Setup (Bright & Crisp Anime Toon Lighting)
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0x90caf9, 0x3e2723, 0.7);
        this.scene.add(this.hemiLight);

        this.dirLight = new THREE.DirectionalLight(0xfff9c4, 1.2);
        this.dirLight.position.set(6, 12, 8);
        this.dirLight.castShadow = false; // TV optimization: zero dynamic shadow overhead
        this.scene.add(this.dirLight);

        // 2. Celestial 3D Sun & Moon
        this.sun = ModelFactory.createSun();
        this.scene.add(this.sun);

        this.moon = ModelFactory.createMoon();
        this.scene.add(this.moon);

        // 3. 3D Rain Weather System (Lightweight TV Edition)
        const rainCount = this.graphicsQuality === 'high' ? 35 : (this.graphicsQuality === 'medium' ? 20 : 0);
        this.rainSystem = ModelFactory.createRainSystem(rainCount);
        this.scene.add(this.rainSystem);

        // 4. Ground
        this.ground = ModelFactory.createGround(70, 25);
        this.ground.position.set(0, this.groundY, 0);
        this.scene.add(this.ground);

        // 5. Clouds (TV Optimized: 3 clouds, no heavy duplicated mesh shells)
        for (let i = 0; i < 3; i++) {
            const cloud = ModelFactory.createCloud();
            cloud.position.set(
                (Math.random() - 0.5) * 35,
                2.5 + Math.random() * 4.5,
                -4 - Math.random() * 8
            );
            this.clouds.push(cloud);
            this.scene.add(cloud);
        }

        // 6. Bird
        this.bird = ModelFactory.createBird(this.birdSkin);
        this.bird.position.set(this.birdX, this.birdY, 0);
        this.scene.add(this.bird);

        // 7. Particle System (TV Optimized pool)
        this.particles = ModelFactory.createParticleEmitter(this.graphicsQuality === 'low' ? 0 : 30);
        if (this.particles && this.particles.isPoints) {
            this.scene.add(this.particles);
        }

        this.resetPipes();
        this.updateSkyAndWeather(0);
    }

    resetPipes() {
        for (const p of this.pipes) {
            this.scene.remove(p);
        }
        this.pipes = [];

        const startX = 6.5;
        for (let i = 0; i < 4; i++) {
            const pipe = ModelFactory.createPipePair(this.pipeStyle, this.diffParams.gap);
            const x = startX + i * this.diffParams.pipeSpacing;
            const gapY = this.randomGapY();
            pipe.position.x = x;
            pipe.setGap(gapY, this.diffParams.gap);
            pipe.userData.bobAmplitude = this.diffParams.bobAmplitude;
            pipe.userData.bobSpeed = 2.0;

            this.pipes.push(pipe);
            this.scene.add(pipe);
        }
    }

    randomGapY() {
        const minY = this.groundY + this.diffParams.gap / 2 + 1.2;
        const maxY = this.ceilingY - this.diffParams.gap / 2 - 1.0;
        return minY + Math.random() * (maxY - minY);
    }

    initEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleAction();
            } else if (e.code === 'KeyP') {
                this.togglePause();
            }
        });

        let lastTouchTime = 0;
        const triggerAction = (e) => {
            const now = Date.now();
            if (now - lastTouchTime < 40) return;
            lastTouchTime = now;

            if (e.target) {
                if (e.target.closest('#settings-modal') ||
                    e.target.closest('#hud-btn-settings') || 
                    e.target.closest('#hud-btn-pause') || 
                    e.target.closest('#btn-resume') ||
                    e.target.closest('#btn-restart') ||
                    e.target.closest('#btn-gameover-settings') ||
                    e.target.closest('.ui-interactive') ||
                    e.target.closest('button') ||
                    e.target.closest('select') ||
                    e.target.closest('input')) {
                    return;
                }
            }

            if (window.soundManager) {
                window.soundManager.init();
                window.soundManager.resume();
            }

            this.handleAction();
        };

        window.addEventListener('pointerdown', triggerAction, { passive: true });
        window.addEventListener('touchstart', triggerAction, { passive: true });
        window.addEventListener('mousedown', triggerAction, { passive: true });
    }

    handleAction() {
        if (this.state === 'START') {
            this.startGame();
            this.jump();
        } else if (this.state === 'PLAYING') {
            this.jump();
        } else if (this.state === 'GAMEOVER') {
            if (Date.now() - this.gameOverTime > 500) {
                this.restartGame();
            }
        }
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.updateScoreUI();
        window.soundManager.startMusic();
        const wl = document.getElementById('weather-label');
        if (wl) wl.classList.remove('hidden');
        if (window.uiManager) window.uiManager.onGameStart();
        if (window.tvRemote) window.tvRemote.updateFocusList();
    }

    jump() {
        if (this.state !== 'PLAYING') return;

        this.birdVelocityY = this.diffParams.jumpForce * this.sensitivity;
        window.soundManager.playFlap();

        if (this.particles && this.graphicsQuality !== 'low' && this.particles.userData && this.particles.userData.emit) {
            this.particles.userData.emit(
                this.bird.position.x - 0.5,
                this.bird.position.y - 0.15,
                0,
                -1.5,
                (Math.random() - 0.5) * 0.8,
                0,
                1.0, 0.9, 0.3,
                0.3, 0.25
            );
        }
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            if (window.uiManager) window.uiManager.onGamePause(true);
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.clock.getDelta();
            if (window.uiManager) window.uiManager.onGamePause(false);
        }
    }

    showScorePopup() {
        const el = document.getElementById('score-popup');
        if (!el) return;
        const words = ['NICE!', 'GREAT!', 'SWEET!', 'PERFECT!', 'YEAH!', 'BOOM!', 'WOW!'];
        const special = this.score > 0 && this.score % 10 === 0;
        const bigWords = ['AMAZING!!', 'INSANE!!', 'LEGENDARY!!', 'ON FIRE!!'];
        el.textContent = special
            ? bigWords[Math.floor(this.score / 10 - 1) % bigWords.length]
            : words[Math.floor(Math.random() * words.length)];
        el.classList.remove('hidden', 'show');
        void el.offsetWidth;
        el.classList.add('show');
        setTimeout(() => { el.classList.remove('show'); el.classList.add('hidden'); }, 760);
    }

    triggerFlash(type) {
        const el = document.getElementById('screen-flash');
        if (!el) return;
        el.classList.remove('flash-score', 'flash-hit');
        void el.offsetWidth;
        el.classList.add(type === 'score' ? 'flash-score' : 'flash-hit');
        setTimeout(() => el.classList.remove('flash-score', 'flash-hit'), 300);
    }

    onScore() {
        this.score++;
        this.updateScoreUI();
        window.soundManager.playScore();
        this.showScorePopup();
        this.triggerFlash('score');

        // Weather Transition Trigger: Every 10 points cycle weather
        if (this.theme === 'dynamic') {
            const cycle = Math.floor(this.score / 10) % 3;
            if (cycle === 2 && this.targetRainIntensity === 0) {
                // Trigger Rain Storm!
                this.targetRainIntensity = 1.0;
                window.soundManager.startRainSound();
                window.soundManager.playThunder();
            } else if (cycle !== 2 && this.targetRainIntensity > 0) {
                // Clear up!
                this.targetRainIntensity = 0.0;
                window.soundManager.stopRainSound();
            }
        }

        if (this.particles && this.graphicsQuality !== 'low' && this.particles.userData && this.particles.userData.emit) {
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                this.particles.userData.emit(
                    this.bird.position.x + 0.2,
                    this.bird.position.y,
                    0,
                    Math.cos(angle) * 2.5,
                    Math.sin(angle) * 2.5,
                    0,
                    0.2, 0.9, 1.0,
                    0.4, 0.35
                );
            }
        }
    }

    updateScoreUI() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
            this.scoreElement.classList.remove('score-pop');
            void this.scoreElement.offsetWidth;
            this.scoreElement.classList.add('score-pop');
        }
    }

    triggerGameOver() {
        if (this.state === 'GAMEOVER') return;

        this.state = 'GAMEOVER';
        this.gameOverTime = Date.now();
        window.soundManager.playHit();
        setTimeout(() => window.soundManager.playDie(), 120);

        this.shakeTime = 0.45;
        this.shakeIntensity = 0.28;
        this.triggerFlash('hit');

        if (this.particles && this.particles.userData && this.particles.userData.emit) {
            for (let i = 0; i < 10; i++) {
                const spd = 2 + Math.random() * 3.5;
                const angle = Math.random() * Math.PI * 2;
                this.particles.userData.emit(
                    this.bird.position.x,
                    this.bird.position.y,
                    (Math.random() - 0.5) * 0.2,
                    Math.cos(angle) * spd,
                    Math.sin(angle) * spd,
                    (Math.random() - 0.5) * 1.5,
                    1.0, 0.7 + Math.random() * 0.3, 0.1,
                    0.6, 0.4
                );
            }
        }

        const isNewBest = this.saveHighScore();
        if (isNewBest && this.score > 0) {
            window.soundManager.playHighscore();
        }

        if (window.uiManager) {
            window.uiManager.onGameOver(this.score, this.highScore, isNewBest);
        }
        if (window.tvRemote) {
            setTimeout(() => window.tvRemote.updateFocusList(), 100);
        }
    }

    restartGame() {
        this.state = 'START';
        this.score = 0;
        this.birdY = 0;
        this.birdVelocityY = 0;
        this.bird.position.set(this.birdX, this.birdY, 0);
        this.bird.rotation.set(0, 0, 0);
        this.bird.userData.currentPitch = 0;

        this.resetPipes();
        this.updateScoreUI();

        const wl = document.getElementById('weather-label');
        if (wl) wl.classList.add('hidden');

        if (window.uiManager) window.uiManager.onGameReset();
        if (window.tvRemote) window.tvRemote.updateFocusList();
    }

    // --- Dynamic Weather & Time-of-Day Progression Engine ---
    updateSkyAndWeather(delta) {
        // 1. Advance time of day
        if (this.theme === 'dynamic') {
            if (this.state === 'PLAYING') {
                this.timeOfDay = (this.timeOfDay + this.timeSpeed * delta) % 1.0;
            }
        } else if (this.theme === 'day') {
            this.timeOfDay = 0.35;
            this.targetRainIntensity = 0;
        } else if (this.theme === 'sunset') {
            this.timeOfDay = 0.65;
            this.targetRainIntensity = 0;
        } else if (this.theme === 'night') {
            this.timeOfDay = 0.88;
            this.targetRainIntensity = 0;
        } else if (this.theme === 'rain') {
            this.timeOfDay = 0.40;
            this.targetRainIntensity = 1.0;
        }

        // Smoothly transition rain intensity
        this.rainIntensity += (this.targetRainIntensity - this.rainIntensity) * (delta * 2.0);
        if (this.rainSystem) {
            this.rainSystem.userData.intensity = this.rainIntensity;
            this.rainSystem.userData.update(delta, this.groundY);
        }

        // 2. Compute Colors across the 4 Day Phases (Zero allocation via cached THREE.Colors)
        const skyColor = this._skyColor;
        const fogColor = this._fogColor;
        const lightColor = this._lightColor;
        let lightIntensity = 1.0;

        const t = this.timeOfDay;

        if (t < 0.20) {
            // Dawn: Soft pink-orange sunrise
            const p = t / 0.20;
            skyColor.setRGB(0.95 - p * 0.4, 0.45 + p * 0.3, 0.55 + p * 0.4);
            fogColor.setRGB(1.0, 0.65, 0.6);
            lightColor.setRGB(1.0, 0.8, 0.5);
            lightIntensity = 0.7 + p * 0.4;
        } else if (t < 0.55) {
            // Afternoon: Brilliant azure blue
            skyColor.setRGB(0.35, 0.68, 0.98);
            fogColor.setRGB(0.72, 0.88, 0.98);
            lightColor.setRGB(1.0, 0.98, 0.88);
            lightIntensity = 1.15;
        } else if (t < 0.75) {
            // Evening / Sunset: Fiery orange, gold and purple
            const p = (t - 0.55) / 0.20;
            skyColor.setRGB(0.95 - p * 0.7, 0.35 - p * 0.2, 0.25 + p * 0.4);
            fogColor.setRGB(1.0 - p * 0.6, 0.55 - p * 0.4, 0.4);
            lightColor.setRGB(1.0, 0.55, 0.2);
            lightIntensity = 1.0 - p * 0.5;
        } else {
            // Night: Deep midnight navy blue with moonlight
            skyColor.setRGB(0.04, 0.08, 0.18);
            fogColor.setRGB(0.08, 0.12, 0.25);
            lightColor.setRGB(0.65, 0.8, 1.0);
            lightIntensity = 0.45;
        }

        // Apply storm cloud darkening if raining
        if (this.rainIntensity > 0.05) {
            skyColor.lerp(this._stormSkyColor, this.rainIntensity * 0.65);
            fogColor.lerp(this._stormFogColor, this.rainIntensity * 0.6);
            lightIntensity *= (1.0 - this.rainIntensity * 0.55);
        }

        // Apply to scene
        this.scene.background.copy(skyColor);
        this.scene.fog.color.copy(fogColor);
        this.dirLight.color.copy(lightColor);
        this.dirLight.intensity = lightIntensity;

        // 3. Update Sun & Moon positions
        if (this.sun) {
            this.sun.userData.update(this.timeOfDay);
            // Hide sun when under horizon at night
            this.sun.visible = (this.timeOfDay < 0.72);

            // Directional light tracks sun position
            this.dirLight.position.set(this.sun.position.x * 0.7, Math.max(3, this.sun.position.y), 8);
        }

        if (this.moon) {
            this.moon.userData.update(this.timeOfDay);
            // Visible during twilight & night
            this.moon.visible = (this.timeOfDay > 0.60 || this.timeOfDay < 0.10);
        }

        // 4. Update cloud storm tint
        for (const c of this.clouds) {
            if (c.userData.setStorminess) {
                c.userData.setStorminess(this.rainIntensity);
            }
        }

        // 5. Update weather label HUD
        const wl = document.getElementById('weather-label');
        if (wl) {
            const t2 = this.timeOfDay;
            let label = '';
            if (this.rainIntensity > 0.5) label = '⛈ STORM';
            else if (t2 < 0.20) label = '🌅 DAWN';
            else if (t2 < 0.55) label = '☀ DAY';
            else if (t2 < 0.75) label = '🌇 SUNSET';
            else label = '🌙 NIGHT';
            if (wl.textContent !== label) wl.textContent = label;
        }
    }

    // Settings Updates
    setDifficulty(diff) {
        this.difficulty = diff;
        localStorage.setItem('fb_difficulty', diff);
        this.diffParams = this.getDifficultyParams(diff);
        this.loadHighScore();
        this.resetPipes();
    }

    setBirdSkin(skin) {
        this.birdSkin = skin;
        localStorage.setItem('fb_bird_skin', skin);
        if (this.bird) this.bird.setSkin(skin);
    }

    setPipeStyle(style) {
        this.pipeStyle = style;
        localStorage.setItem('fb_pipe_style', style);
        this.resetPipes();
    }

    setTheme(theme) {
        this.theme = theme;
        localStorage.setItem('fb_theme', theme);
        if (theme === 'rain') {
            this.targetRainIntensity = 1.0;
            if (window.soundManager) window.soundManager.startRainSound();
        } else {
            this.targetRainIntensity = 0.0;
            if (window.soundManager) window.soundManager.stopRainSound();
        }
        this.updateSkyAndWeather(0.01);
    }

    setGraphicsQuality(quality) {
        this.graphicsQuality = quality;
        localStorage.setItem('fb_graphics', quality);
        if (this.renderer) {
            let dpr = 0.85;
            if (quality === 'high') dpr = 1.0;
            else if (quality === 'low') dpr = 0.7;
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, dpr));
            this.renderer.shadowMap.enabled = false;
            this.updateCameraLayout();
        }
    }

    setSensitivity(val) {
        this.sensitivity = parseFloat(val);
        localStorage.setItem('fb_sensitivity', this.sensitivity);
    }

    // --- Main Game Loop ---
    animate() {
        requestAnimationFrame(this.animate);

        const delta = Math.min(this.clock.getDelta(), 0.1);

        this.frameCount++;
        if (performance.now() - this.lastFpsUpdate > 500) {
            const fps = Math.round((this.frameCount * 1000) / (performance.now() - this.lastFpsUpdate));
            const fpsEl = document.getElementById('fps-counter');
            if (fpsEl) fpsEl.textContent = `${fps} FPS`;
            this.frameCount = 0;
            this.lastFpsUpdate = performance.now();
        }

        // Camera Shake effect
        if (this.shakeTime > 0) {
            this.shakeTime -= delta;
            const si = this.shakeIntensity * (this.shakeTime / 0.45);
            this.camera.position.x = this.baseCamX + (Math.random() - 0.5) * si;
            this.camera.position.y = 0.5 + (Math.random() - 0.5) * si;
        } else {
            this.camera.position.x = this.baseCamX;
            this.camera.position.y += ((this.birdY * 0.3 + 0.5) - this.camera.position.y) * 0.05;
        }

        // 1. Dynamic Atmosphere, Sun, Moon & Rain Weather
        this.updateSkyAndWeather(delta);

        // 2. Clouds parallax
        for (const cloud of this.clouds) {
            cloud.position.x -= cloud.userData.speed * delta;
            if (cloud.position.x < -22) {
                cloud.position.x = 22;
                cloud.position.y = 2.5 + Math.random() * 4.5;
            }
        }

        // 3. State-specific logic
        if (this.state === 'START') {
            const time = performance.now() * 0.0035;
            this.birdY = Math.sin(time) * 0.35;
            this.bird.position.y = this.birdY;
            this.bird.updateAnimation(delta, Math.cos(time) * 2, false);

            this.ground.scroll(1.5, delta);

        } else if (this.state === 'PLAYING') {
            this.birdVelocityY -= this.diffParams.gravity * delta;
            this.birdY += this.birdVelocityY * delta;
            this.bird.position.y = this.birdY;

            this.bird.updateAnimation(delta, this.birdVelocityY, false);

            this.ground.scroll(this.diffParams.speed, delta);

            if (this.birdY > this.ceilingY) {
                this.birdY = this.ceilingY;
                this.birdVelocityY = 0;
            }

            if (this.birdY - this.bird.userData.radius <= this.groundY + 0.1) {
                this.birdY = this.groundY + this.bird.userData.radius + 0.1;
                this.triggerGameOver();
            }

            let furthestPipeX = 0;
            for (const pipe of this.pipes) {
                pipe.position.x -= this.diffParams.speed * delta;

                if (pipe.userData.bobAmplitude > 0) {
                    pipe.userData.bobTimer += delta * pipe.userData.bobSpeed;
                    const newGapY = pipe.userData.initialY + Math.sin(pipe.userData.bobTimer) * pipe.userData.bobAmplitude;
                    pipe.setGap(newGapY, this.diffParams.gap);
                }

                if (!pipe.userData.scored && pipe.position.x < this.birdX) {
                    pipe.userData.scored = true;
                    this.onScore();
                }

                const birdRadius = this.bird.userData.radius * 0.85;
                const pipeRadius = pipe.userData.pipeRadius;
                const dx = Math.abs(this.birdX - pipe.position.x);

                if (dx < birdRadius + pipeRadius) {
                    const gapTop = pipe.userData.gapY + pipe.userData.gapSize / 2;
                    const gapBottom = pipe.userData.gapY - pipe.userData.gapSize / 2;

                    if (this.birdY + birdRadius > gapTop || this.birdY - birdRadius < gapBottom) {
                        this.triggerGameOver();
                    }
                }

                if (pipe.position.x > furthestPipeX) {
                    furthestPipeX = pipe.position.x;
                }
            }

            for (const pipe of this.pipes) {
                if (pipe.position.x < -14) {
                    pipe.position.x = furthestPipeX + this.diffParams.pipeSpacing;
                    furthestPipeX = pipe.position.x;
                    const gapY = this.randomGapY();
                    pipe.setGap(gapY, this.diffParams.gap);
                    pipe.userData.scored = false;
                }
            }

        } else if (this.state === 'GAMEOVER') {
            if (this.birdY > this.groundY + this.bird.userData.radius + 0.1) {
                this.birdVelocityY -= this.diffParams.gravity * delta * 1.5;
                this.birdY += this.birdVelocityY * delta;
                this.bird.position.y = this.birdY;
                this.bird.rotation.z -= delta * 8;
            } else {
                this.birdY = this.groundY + this.bird.userData.radius + 0.1;
                this.bird.position.y = this.birdY;
            }
        }

        // 4. Update particles
        if (this.particles) {
            this.particles.userData.update(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }
}
