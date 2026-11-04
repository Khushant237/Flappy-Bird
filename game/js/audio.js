// audio.js - High quality Web Audio API sound synthesis and background music (Crackle-Free & Optimized)

class SoundManager {
    constructor() {
        this.ctx = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.rainGain = null;
        this.masterGain = null;
        this.compressor = null;
        this.sharedNoiseBuffer = null;

        // Settings (loaded from localStorage)
        this.musicEnabled = localStorage.getItem('fb_music_enabled') !== 'false';
        this.sfxEnabled = localStorage.getItem('fb_sfx_enabled') !== 'false';
        this.musicVolume = parseFloat(localStorage.getItem('fb_music_vol') || '0.6');
        this.sfxVolume = parseFloat(localStorage.getItem('fb_sfx_vol') || '0.8');

        this.isPlayingMusic = false;
        this.musicInterval = null;
        this.step = 0;

        // Rain ambient node
        this.rainSource = null;
        this.isRaining = false;
    }

    createNoiseBuffer(durationSeconds) {
        if (!this.ctx) return null;
        const bufferSize = Math.floor(this.ctx.sampleRate * durationSeconds);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();

        // 1. Dynamics Compressor to prevent digital clipping/crackling on mobile DACs
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);
        this.compressor.connect(this.ctx.destination);

        // 2. Master Gain (with headroom)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.masterGain.connect(this.compressor);

        // 3. Sub-mix gains
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.rainGain.connect(this.masterGain);

        // 4. Pre-allocate static noise buffer (reused for SFX & rain, eliminating GC stalls)
        this.sharedNoiseBuffer = this.createNoiseBuffer(2.0);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        localStorage.setItem('fb_music_enabled', enabled);
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setTargetAtTime(enabled ? this.musicVolume : 0, this.ctx.currentTime, 0.05);
        }
        if (enabled && !this.isPlayingMusic) {
            this.startMusic();
        } else if (!enabled && this.isPlayingMusic) {
            this.stopMusic();
        }
    }

    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
        localStorage.setItem('fb_sfx_enabled', enabled);
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(enabled ? this.sfxVolume : 0, this.ctx.currentTime, 0.05);
        }
    }

    setMusicVolume(vol) {
        this.musicVolume = vol;
        localStorage.setItem('fb_music_vol', vol);
        if (this.musicGain && this.ctx && this.musicEnabled) {
            this.musicGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
        }
    }

    setSfxVolume(vol) {
        this.sfxVolume = vol;
        localStorage.setItem('fb_sfx_vol', vol);
        if (this.sfxGain && this.ctx && this.sfxEnabled) {
            this.sfxGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
        }
    }

    // --- Weather Rain Audio ---
    startRainSound() {
        if (this.isRaining) return;
        this.init();
        this.resume();
        if (!this.ctx || !this.sharedNoiseBuffer) return;

        this.isRaining = true;
        this.rainSource = this.ctx.createBufferSource();
        this.rainSource.buffer = this.sharedNoiseBuffer;
        this.rainSource.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(1100, this.ctx.currentTime);

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(350, this.ctx.currentTime);

        this.rainSource.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(this.rainGain);

        this.rainGain.gain.setTargetAtTime(this.sfxEnabled ? this.sfxVolume * 0.28 : 0, this.ctx.currentTime, 1.0);
        this.rainSource.start(0);
    }

    stopRainSound() {
        if (!this.isRaining) return;
        this.isRaining = false;
        if (this.rainGain && this.ctx) {
            this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
            setTimeout(() => {
                if (!this.isRaining && this.rainSource) {
                    try { this.rainSource.stop(); } catch(e){}
                    this.rainSource = null;
                }
            }, 700);
        }
    }

    playThunder() {
        if (!this.sfxEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx || !this.sharedNoiseBuffer) return;

        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.sharedNoiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(160, now);
        filter.frequency.exponentialRampToValueAtTime(45, now + 1.2);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 1.35);
    }

    // --- Sound Effects ---

    playFlap() {
        if (!this.sfxEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

        // Soft click-free envelope (gentle attack, smooth decay)
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);

        // Subtle soft swoosh from shared buffer
        if (this.sharedNoiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.sharedNoiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(550, now);
            filter.Q.setValueAtTime(1.8, now);

            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.001, now);
            nGain.gain.linearRampToValueAtTime(0.18, now + 0.015);
            nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.sfxGain);

            noise.start(now);
            noise.stop(now + 0.09);
        }
    }

    playScore() {
        if (!this.sfxEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [
            { freq: 987.77, start: 0, dur: 0.10 },
            { freq: 1318.51, start: 0.07, dur: 0.22 }
        ].forEach(tone => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(tone.freq, now + tone.start);

            gain.gain.setValueAtTime(0.001, now + tone.start);
            gain.gain.linearRampToValueAtTime(0.30, now + tone.start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.dur);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + tone.start);
            osc.stop(now + tone.start + tone.dur + 0.02);
        });
    }

    playHit() {
        if (!this.sfxEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.55, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.23);

        if (this.sharedNoiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.sharedNoiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);

            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.001, now);
            nGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
            nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.sfxGain);

            noise.start(now);
            noise.stop(now + 0.19);
        }
    }

    playDie() {
        if (!this.sfxEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.40);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.32, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.44);
    }

    playHighscore() {
        if (!this.sfxEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const t = now + idx * 0.09;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.27);
        });
    }

    playClick() {
        if (!this.sfxEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // --- Dynamic Background Synth Music Engine (Crackle-Free) ---

    startMusic() {
        if (this.isPlayingMusic || !this.musicEnabled) return;
        this.init();
        this.resume();
        if (!this.ctx) return;

        this.isPlayingMusic = true;
        this.step = 0;

        const tempo = 126;
        const stepTime = (60 / tempo) / 4;

        const bassNotes = [
            220.00, 0, 220.00, 0,  174.61, 0, 174.61, 0,
            261.63, 0, 261.63, 0,  196.00, 0, 196.00, 0
        ];

        const leadNotes = [
            440.00, 523.25, 659.25, 523.25, 349.23, 440.00, 523.25, 440.00,
            523.25, 659.25, 783.99, 659.25, 392.00, 493.88, 587.33, 493.88
        ];

        const playTick = () => {
            if (!this.isPlayingMusic || !this.ctx) return;

            const t = this.ctx.currentTime + 0.02; // Small 20ms lookahead to eliminate JS timing crackle
            const bFreq = bassNotes[this.step % bassNotes.length];
            const lFreq = leadNotes[this.step % leadNotes.length];

            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sawtooth';
                bOsc.frequency.setValueAtTime(bFreq / 2, t);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(320, t);
                filter.frequency.exponentialRampToValueAtTime(90, t + stepTime * 1.4);

                bGain.gain.setValueAtTime(0.001, t);
                bGain.gain.linearRampToValueAtTime(0.14, t + 0.01);
                bGain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 1.4);

                bOsc.connect(filter);
                filter.connect(bGain);
                bGain.connect(this.musicGain);

                bOsc.start(t);
                bOsc.stop(t + stepTime * 1.5);
            }

            if (lFreq > 0 && (this.step % 2 === 0)) {
                const lOsc = this.ctx.createOscillator();
                const lGain = this.ctx.createGain();
                lOsc.type = 'triangle';
                lOsc.frequency.setValueAtTime(lFreq, t);

                lGain.gain.setValueAtTime(0.001, t);
                lGain.gain.linearRampToValueAtTime(0.10, t + 0.01);
                lGain.gain.exponentialRampToValueAtTime(0.0001, t + stepTime * 1.6);

                lOsc.connect(lGain);
                lGain.connect(this.musicGain);

                lOsc.start(t);
                lOsc.stop(t + stepTime * 1.7);
            }

            if (this.step % 4 === 2) {
                const hatOsc = this.ctx.createOscillator();
                const hatGain = this.ctx.createGain();
                hatOsc.type = 'square';
                hatOsc.frequency.setValueAtTime(7000, t);
                hatGain.gain.setValueAtTime(0.001, t);
                hatGain.gain.linearRampToValueAtTime(0.025, t + 0.004);
                hatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
                hatOsc.connect(hatGain);
                hatGain.connect(this.musicGain);
                hatOsc.start(t);
                hatOsc.stop(t + 0.04);
            }

            this.step++;
        };

        this.musicInterval = setInterval(playTick, stepTime * 1000);
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

window.soundManager = new SoundManager();
