// ui.js - User Interface Controller, Settings Modal, and HUD for Flappy Bird 3D

class UIManager {
    constructor(game) {
        this.game = game;

        // DOM elements
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.settingsModal = document.getElementById('settings-modal');

        this.hudScore = document.getElementById('hud-score');
        this.btnSettings = document.getElementById('hud-btn-settings');
        this.btnPause = document.getElementById('hud-btn-pause');
        this.btnResume = document.getElementById('btn-resume');
        this.btnRestart = document.getElementById('btn-restart');
        this.btnCloseSettings = document.getElementById('btn-close-settings');

        // Start screen elements
        this.startHighScore = document.getElementById('start-highscore');
        this.startDifficulty = document.getElementById('start-difficulty');

        // Game over elements
        this.goScore = document.getElementById('gameover-score');
        this.goHighScore = document.getElementById('gameover-highscore');
        this.goBadge = document.getElementById('gameover-badge');
        this.goMedal = document.getElementById('gameover-medal');

        // Settings Controls
        this.optDifficulty = document.getElementById('setting-difficulty');
        this.toggleMusic = document.getElementById('setting-music');
        this.sliderMusic = document.getElementById('setting-music-vol');
        this.toggleSfx = document.getElementById('setting-sfx');
        this.sliderSfx = document.getElementById('setting-sfx-vol');
        this.optSkin = document.getElementById('setting-skin');
        this.optPipe = document.getElementById('setting-pipe');
        this.optTheme = document.getElementById('setting-theme');
        this.optGraphics = document.getElementById('setting-graphics');
        this.sliderSens = document.getElementById('setting-sensitivity');
        this.toggleFps = document.getElementById('setting-fps');
        this.btnResetScores = document.getElementById('btn-reset-scores');

        this.initControls();
        this.updateHUDDifficulty();
        this.updateStartHighScore();
    }

    initControls() {
        // Button Clicks
        this.btnSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            window.soundManager.playClick();
            this.openSettings();
        });

        this.btnCloseSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            window.soundManager.playClick();
            this.closeSettings();
        });

        this.btnPause.addEventListener('click', (e) => {
            e.stopPropagation();
            window.soundManager.playClick();
            this.game.togglePause();
        });

        this.btnResume.addEventListener('click', (e) => {
            e.stopPropagation();
            window.soundManager.playClick();
            this.game.togglePause();
        });

        this.btnRestart.addEventListener('click', (e) => {
            e.stopPropagation();
            window.soundManager.playClick();
            this.game.restartGame();
        });

        const btnGameOverSettings = document.getElementById('btn-gameover-settings');
        if (btnGameOverSettings) {
            btnGameOverSettings.addEventListener('click', (e) => {
                e.stopPropagation();
                window.soundManager.playClick();
                this.openSettings();
            });
        }

        // Settings bindings:
        // Difficulty
        this.optDifficulty.value = this.game.difficulty;
        this.optDifficulty.addEventListener('change', (e) => {
            this.game.setDifficulty(e.target.value);
            this.updateHUDDifficulty();
            this.updateStartHighScore();
            window.soundManager.playClick();
        });

        // Music toggle & slider
        this.toggleMusic.checked = window.soundManager.musicEnabled;
        this.sliderMusic.value = window.soundManager.musicVolume * 100;
        this.toggleMusic.addEventListener('change', (e) => {
            window.soundManager.setMusicEnabled(e.target.checked);
        });
        this.sliderMusic.addEventListener('input', (e) => {
            window.soundManager.setMusicVolume(e.target.value / 100);
        });

        // SFX toggle & slider
        this.toggleSfx.checked = window.soundManager.sfxEnabled;
        this.sliderSfx.value = window.soundManager.sfxVolume * 100;
        this.toggleSfx.addEventListener('change', (e) => {
            window.soundManager.setSfxEnabled(e.target.checked);
        });
        this.sliderSfx.addEventListener('input', (e) => {
            window.soundManager.setSfxVolume(e.target.value / 100);
        });

        // Skins, Pipes, Themes
        this.optSkin.value = this.game.birdSkin;
        this.optSkin.addEventListener('change', (e) => {
            this.game.setBirdSkin(e.target.value);
            window.soundManager.playClick();
        });

        this.optPipe.value = this.game.pipeStyle;
        this.optPipe.addEventListener('change', (e) => {
            this.game.setPipeStyle(e.target.value);
            window.soundManager.playClick();
        });

        this.optTheme.value = this.game.theme;
        this.optTheme.addEventListener('change', (e) => {
            this.game.setTheme(e.target.value);
            window.soundManager.playClick();
        });

        // Graphics Quality
        this.optGraphics.value = this.game.graphicsQuality;
        this.optGraphics.addEventListener('change', (e) => {
            this.game.setGraphicsQuality(e.target.value);
            window.soundManager.playClick();
        });

        // Sensitivity
        this.sliderSens.value = this.game.sensitivity * 100;
        this.sliderSens.addEventListener('input', (e) => {
            this.game.setSensitivity(e.target.value / 100);
        });

        // FPS display toggle
        const fpsEl = document.getElementById('fps-counter');
        const showFps = localStorage.getItem('fb_show_fps') === 'true';
        this.toggleFps.checked = showFps;
        if (fpsEl) fpsEl.style.display = showFps ? 'block' : 'none';
        this.toggleFps.addEventListener('change', (e) => {
            localStorage.setItem('fb_show_fps', e.target.checked);
            if (fpsEl) fpsEl.style.display = e.target.checked ? 'block' : 'none';
        });

        // Reset High Scores
        this.btnResetScores.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Reset high scores for all difficulties?')) {
                this.game.resetHighScores();
                this.updateStartHighScore();
                window.soundManager.playClick();
                this.showToast('High scores reset!');
            }
        });
    }

    updateHUDDifficulty() {
        const badge = document.getElementById('hud-difficulty-badge');
        if (badge) {
            badge.textContent = this.game.difficulty.toUpperCase();
            badge.className = `difficulty-badge diff-${this.game.difficulty}`;
        }
    }

    updateStartHighScore() {
        if (this.startHighScore) {
            this.startHighScore.textContent = this.game.highScore;
        }
        if (this.startDifficulty) {
            this.startDifficulty.textContent = this.game.difficulty.toUpperCase();
        }
    }

    openSettings() {
        this.settingsModal.classList.add('active');
        if (this.game.state === 'PLAYING') {
            this.game.togglePause();
        }
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    onGameStart() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.btnPause.style.display = 'flex';
    }

    onGamePause(isPaused) {
        if (isPaused) {
            this.pauseScreen.classList.remove('hidden');
        } else {
            this.pauseScreen.classList.add('hidden');
        }
    }

    onGameOver(score, highScore, isNewBest) {
        this.btnPause.style.display = 'none';
        this.goScore.textContent = score;
        this.goHighScore.textContent = highScore;

        if (isNewBest && score > 0) {
            this.goBadge.classList.remove('hidden');
        } else {
            this.goBadge.classList.add('hidden');
        }

        // Award Medals:
        // Bronze (10+), Silver (25+), Gold (50+), Platinum (100+)
        let medal = 'NONE';
        let medalClass = 'medal-none';
        if (score >= 100) { medal = '🏆 PLATINUM'; medalClass = 'medal-plat'; }
        else if (score >= 50) { medal = '🥇 GOLD'; medalClass = 'medal-gold'; }
        else if (score >= 25) { medal = '🥈 SILVER'; medalClass = 'medal-silver'; }
        else if (score >= 10) { medal = '🥉 BRONZE'; medalClass = 'medal-bronze'; }

        this.goMedal.textContent = medal;
        this.goMedal.className = `medal-chip ${medalClass}`;

        // Delay slight appearance for punchy feel
        setTimeout(() => {
            this.gameOverScreen.classList.remove('hidden');
        }, 400);
    }

    onGameReset() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.btnPause.style.display = 'none';
        this.updateStartHighScore();
    }

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}
