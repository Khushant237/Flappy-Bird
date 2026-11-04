// tv-remote.js - Dedicated Android TV Remote Control & D-Pad Navigation Engine

class TVRemoteManager {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;

        // Current navigation focus
        this.currentFocusIndex = 0;
        this.focusList = [];

        this.init();
    }

    init() {
        // Physical keyboard / D-pad event listeners (works in browser & Android WebView)
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Enter':
                case 'NumpadEnter':
                case 'Space':
                    e.preventDefault();
                    this.handleSelect();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.handleUp();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.handleDown();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.handleLeft();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.handleRight();
                    break;
                case 'KeyM':
                case 'F1':
                    e.preventDefault();
                    this.toggleSettings();
                    break;
                case 'Escape':
                case 'Backspace':
                    if (this.handleBack()) {
                        e.preventDefault();
                    }
                    break;
            }
        });

        // Set initial TV focus when screens show
        this.updateFocusList();
    }

    isSettingsOpen() {
        const modal = document.getElementById('settings-modal');
        return modal && modal.classList.contains('active');
    }

    // Called whenever game state or modal changes
    updateFocusList() {
        // Clear old focus styles
        if (this.focusList.length > 0 && this.focusList[this.currentFocusIndex]) {
            this.focusList[this.currentFocusIndex].classList.remove('tv-focused');
        }

        if (this.isSettingsOpen()) {
            // Collect all navigable controls in settings modal
            const container = document.getElementById('settings-modal');
            this.focusList = Array.from(container.querySelectorAll(
                'button, select, input[type="range"], .switch'
            )).filter(el => el.offsetParent !== null && !el.disabled);
            this.currentFocusIndex = 0;
        } else if (this.game.state === 'GAMEOVER') {
            const container = document.getElementById('game-over-screen');
            this.focusList = Array.from(container.querySelectorAll('button')).filter(el => el.offsetParent !== null);
            this.currentFocusIndex = 0; // Focus "PLAY AGAIN"
        } else if (this.game.state === 'PAUSED') {
            const container = document.getElementById('pause-screen');
            this.focusList = Array.from(container.querySelectorAll('button')).filter(el => el.offsetParent !== null);
            this.currentFocusIndex = 0;
        } else if (this.game.state === 'START') {
            this.focusList = [
                document.getElementById('start-screen'),
                document.getElementById('hud-btn-settings')
            ].filter(Boolean);
            this.currentFocusIndex = 0;
        } else {
            // PLAYING state — gameplay only
            this.focusList = [];
            this.currentFocusIndex = 0;
        }

        this.applyFocus();
    }

    applyFocus() {
        if (this.focusList.length === 0) return;
        if (this.currentFocusIndex >= this.focusList.length) {
            this.currentFocusIndex = 0;
        }

        this.focusList.forEach((el, idx) => {
            if (idx === this.currentFocusIndex) {
                el.classList.add('tv-focused');
                if (el.scrollIntoViewIfNeeded) {
                    el.scrollIntoViewIfNeeded(false);
                } else if (el.scrollIntoView) {
                    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } else {
                el.classList.remove('tv-focused');
            }
        });
    }

    // --- Action Handlers invoked by Android Remote / WebView ---

    handleSelect() {
        if (window.soundManager) {
            window.soundManager.init();
            window.soundManager.resume();
        }

        if (this.isSettingsOpen()) {
            const current = this.focusList[this.currentFocusIndex];
            if (!current) return;

            if (current.tagName === 'BUTTON') {
                current.click();
            } else if (current.classList.contains('switch')) {
                const input = current.querySelector('input[type="checkbox"]');
                if (input) {
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else if (current.tagName === 'SELECT') {
                // Cycle option forward on OK button
                this.cycleSelect(current, 1);
            }
            return;
        }

        // Gameplay actions
        if (this.game.state === 'START') {
            this.game.startGame();
            this.game.jump();
            this.updateFocusList();
        } else if (this.game.state === 'PLAYING') {
            this.game.jump();
        } else if (this.game.state === 'GAMEOVER') {
            const current = this.focusList[this.currentFocusIndex];
            if (current) {
                current.click();
            } else {
                this.game.restartGame();
            }
        } else if (this.game.state === 'PAUSED') {
            this.game.togglePause();
            this.updateFocusList();
        }
    }

    handleUp() {
        if (this.game.state === 'PLAYING') {
            this.game.jump();
            return;
        }

        if (this.focusList.length > 1) {
            this.currentFocusIndex = (this.currentFocusIndex - 1 + this.focusList.length) % this.focusList.length;
            this.applyFocus();
            if (window.soundManager) window.soundManager.playClick();
        }
    }

    handleDown() {
        if (this.game.state === 'PLAYING') return;

        if (this.focusList.length > 1) {
            this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusList.length;
            this.applyFocus();
            if (window.soundManager) window.soundManager.playClick();
        }
    }

    handleLeft() {
        if (this.isSettingsOpen()) {
            const current = this.focusList[this.currentFocusIndex];
            if (!current) return;

            if (current.tagName === 'SELECT') {
                this.cycleSelect(current, -1);
            } else if (current.tagName === 'INPUT' && current.type === 'range') {
                this.stepRange(current, -1);
            } else if (current.classList.contains('switch')) {
                const input = current.querySelector('input[type="checkbox"]');
                if (input && input.checked) {
                    input.checked = false;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        } else if (this.game.state === 'GAMEOVER' || this.game.state === 'START') {
            this.handleUp();
        }
    }

    handleRight() {
        if (this.isSettingsOpen()) {
            const current = this.focusList[this.currentFocusIndex];
            if (!current) return;

            if (current.tagName === 'SELECT') {
                this.cycleSelect(current, 1);
            } else if (current.tagName === 'INPUT' && current.type === 'range') {
                this.stepRange(current, 1);
            } else if (current.classList.contains('switch')) {
                const input = current.querySelector('input[type="checkbox"]');
                if (input && !input.checked) {
                    input.checked = true;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        } else if (this.game.state === 'GAMEOVER' || this.game.state === 'START') {
            this.handleDown();
        }
    }

    cycleSelect(selectEl, direction) {
        const count = selectEl.options.length;
        if (count <= 1) return;
        selectEl.selectedIndex = (selectEl.selectedIndex + direction + count) % count;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        if (window.soundManager) window.soundManager.playClick();
    }

    stepRange(rangeEl, direction) {
        const step = parseFloat(rangeEl.step) || 5;
        let val = parseFloat(rangeEl.value) + (direction * step);
        val = Math.max(parseFloat(rangeEl.min), Math.min(parseFloat(rangeEl.max), val));
        rangeEl.value = val;
        rangeEl.dispatchEvent(new Event('input', { bubbles: true }));
        rangeEl.dispatchEvent(new Event('change', { bubbles: true }));
        if (window.soundManager) window.soundManager.playClick();
    }

    toggleSettings() {
        if (this.game.state === 'PLAYING') {
            this.game.togglePause();
        }

        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.toggle('active');
            this.updateFocusList();
            if (window.soundManager) window.soundManager.playClick();
        }
    }

    handleBack() {
        if (this.isSettingsOpen()) {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.classList.remove('active');
            this.updateFocusList();
            if (window.soundManager) window.soundManager.playClick();
            return true;
        }

        if (this.game.state === 'PAUSED') {
            this.game.togglePause();
            this.updateFocusList();
            return true;
        }

        return false;
    }
}
