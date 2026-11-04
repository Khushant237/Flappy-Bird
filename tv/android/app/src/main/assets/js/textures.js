// textures.js — Anime/Toon Style Texture Generator for Flappy Bird 3D

const TextureGenerator = {
    cache: {},

    _canvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    },

    // ─── BIRD BODY TEXTURE ───────────────────────────────────────────────────────
    // Clean flat-shaded cel look — no noise, clean gradients + highlight
    getBirdBodyTexture(skin = 'classic') {
        const key = `body_${skin}`;
        if (this.cache[key]) return this.cache[key];

        const cv = this._canvas(512, 512);
        const ctx = cv.getContext('2d');

        const palettes = {
            classic: { base: '#FFD93D', mid: '#FFAA00', shadow: '#E07B00', highlight: '#FFF5B0' },
            cyber:   { base: '#00E5FF', mid: '#00AADD', shadow: '#005580', highlight: '#B0F8FF' },
            phoenix: { base: '#FF5722', mid: '#E64A19', shadow: '#7F0000', highlight: '#FFCCBC' },
            shadow:  { base: '#90A4AE', mid: '#546E7A', shadow: '#1C313A', highlight: '#E0F2F1' },
        };
        const p = palettes[skin] || palettes.classic;

        // 1. Base solid fill
        ctx.fillStyle = p.base;
        ctx.fillRect(0, 0, 512, 512);

        // 2. Upper hemisphere highlight (rim)
        const hi = ctx.createRadialGradient(190, 130, 20, 190, 130, 320);
        hi.addColorStop(0, p.highlight + 'FF');
        hi.addColorStop(0.4, p.base + '00');
        ctx.fillStyle = hi;
        ctx.fillRect(0, 0, 512, 512);

        // 3. Lower cel-shading shadow band
        const sh = ctx.createLinearGradient(0, 310, 0, 512);
        sh.addColorStop(0, p.mid + '00');
        sh.addColorStop(0.4, p.mid + 'BB');
        sh.addColorStop(1,   p.shadow + 'FF');
        ctx.fillStyle = sh;
        ctx.fillRect(0, 0, 512, 512);

        // 4. Single bold shadow crescent stripe — the anime cel look
        ctx.save();
        ctx.translate(256, 256);
        ctx.beginPath();
        ctx.arc(0, 0, 230, 0.6 * Math.PI, 1.4 * Math.PI);
        ctx.arc(-40, 20, 200, 1.5 * Math.PI, 0.5 * Math.PI, true);
        ctx.closePath();
        ctx.fillStyle = p.shadow + '55';
        ctx.fill();
        ctx.restore();

        // 5. Specular gloss spot (top-left)
        const gl = ctx.createRadialGradient(160, 110, 0, 170, 120, 90);
        gl.addColorStop(0, 'rgba(255,255,255,0.75)');
        gl.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        gl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gl;
        ctx.fillRect(0, 0, 512, 512);

        const tex = new THREE.CanvasTexture(cv);
        tex.needsUpdate = true;
        this.cache[key] = tex;
        return tex;
    },

    // ─── ANIME EYE TEXTURE ───────────────────────────────────────────────────────
    getAnimeEyeTexture(skin = 'classic') {
        const key = `eye_${skin}`;
        if (this.cache[key]) return this.cache[key];

        const cv = this._canvas(512, 512);
        const ctx = cv.getContext('2d');

        const irisColors = {
            classic: ['#1565C0', '#1E88E5', '#42A5F5'],
            cyber:   ['#007C91', '#00ACC1', '#00E5FF'],
            phoenix: ['#C62828', '#E53935', '#FF8A65'],
            shadow:  ['#4A148C', '#7B1FA2', '#CE93D8'],
        };
        const ic = irisColors[skin] || irisColors.classic;

        // White sclera
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 512, 512);

        // Subtle sclera shading
        const sc = ctx.createRadialGradient(256, 256, 160, 256, 256, 256);
        sc.addColorStop(0, 'rgba(220,235,255,0)');
        sc.addColorStop(1, 'rgba(180,205,235,0.6)');
        ctx.fillStyle = sc;
        ctx.fillRect(0, 0, 512, 512);

        // Iris — large anime-style
        const ig = ctx.createRadialGradient(256, 220, 20, 256, 256, 185);
        ig.addColorStop(0, ic[2]);
        ig.addColorStop(0.5, ic[1]);
        ig.addColorStop(1, ic[0]);
        ctx.beginPath();
        ctx.arc(256, 256, 185, 0, Math.PI * 2);
        ctx.fillStyle = ig;
        ctx.fill();

        // Iris rim darkening
        const ir = ctx.createRadialGradient(256, 256, 165, 256, 256, 185);
        ir.addColorStop(0, 'rgba(0,0,0,0)');
        ir.addColorStop(1, 'rgba(0,0,30,0.65)');
        ctx.beginPath();
        ctx.arc(256, 256, 185, 0, Math.PI * 2);
        ctx.fillStyle = ir;
        ctx.fill();

        // Iris subtle radial lines (anime detail)
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(256 + Math.cos(angle) * 40, 256 + Math.sin(angle) * 40);
            ctx.lineTo(256 + Math.cos(angle) * 180, 256 + Math.sin(angle) * 180);
            ctx.strokeStyle = `rgba(0,0,0,0.08)`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Deep pupil
        ctx.beginPath();
        ctx.arc(256, 265, 95, 0, Math.PI * 2);
        ctx.fillStyle = '#050510';
        ctx.fill();

        // Primary star catchlight (top-left)
        ctx.save();
        ctx.translate(185, 165);
        ctx.rotate(Math.PI / 8);
        this._drawStar(ctx, 0, 0, 5, 68, 32, '#ffffff');
        ctx.restore();

        // Secondary small glint (bottom-right)
        ctx.save();
        ctx.translate(315, 330);
        this._drawStar(ctx, 0, 0, 4, 28, 14, 'rgba(255,255,255,0.9)');
        ctx.restore();

        // Crescent bottom shine
        const cs = ctx.createLinearGradient(100, 400, 400, 500);
        cs.addColorStop(0, 'rgba(255,255,255,0)');
        cs.addColorStop(0.5, 'rgba(255,255,255,0.3)');
        cs.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(256, 256, 180, 0.65 * Math.PI, 0.35 * Math.PI);
        ctx.arc(256, 256, 165, 0.35 * Math.PI, 0.65 * Math.PI, true);
        ctx.closePath();
        ctx.fillStyle = cs;
        ctx.fill();

        const tex = new THREE.CanvasTexture(cv);
        this.cache[key] = tex;
        return tex;
    },

    _drawStar(ctx, cx, cy, spikes, outerR, innerR, color) {
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerR);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    },

    // ─── TOON PIPE TEXTURE ───────────────────────────────────────────────────────
    getToonPipeTexture(style = 'classic') {
        const key = `toonpipe_${style}`;
        if (this.cache[key]) return this.cache[key];

        const cv = this._canvas(512, 512);
        const ctx = cv.getContext('2d');

        const schemes = {
            classic: { base: '#43A047', mid: '#2E7D32', dark: '#1B5E20', shine: '#A5D6A7' },
            brass:   { base: '#D4AC0D', mid: '#9A7D0A', dark: '#5D4037', shine: '#F7DC6F' },
            cyber:   { base: '#1A237E', mid: '#283593', dark: '#0D0D2B', shine: '#00E5FF' },
        };
        const s = schemes[style] || schemes.classic;

        // Cylindrical gradient
        const cyl = ctx.createLinearGradient(0, 0, 512, 0);
        cyl.addColorStop(0.00, s.dark);
        cyl.addColorStop(0.18, s.mid);
        cyl.addColorStop(0.42, s.base);
        cyl.addColorStop(0.56, s.shine);
        cyl.addColorStop(0.72, s.base);
        cyl.addColorStop(0.90, s.mid);
        cyl.addColorStop(1.00, s.dark);
        ctx.fillStyle = cyl;
        ctx.fillRect(0, 0, 512, 512);

        // Single cel-shade band
        ctx.fillStyle = `${s.dark}88`;
        ctx.fillRect(0, 310, 512, 202);
        ctx.fillStyle = `${s.dark}00`;
        const band = ctx.createLinearGradient(0, 290, 0, 350);
        band.addColorStop(0, `${s.dark}00`);
        band.addColorStop(1, `${s.dark}66`);
        ctx.fillStyle = band;
        ctx.fillRect(0, 290, 512, 60);

        // Specular line
        ctx.fillStyle = `${s.shine}99`;
        ctx.fillRect(255, 0, 32, 512);
        const spk = ctx.createLinearGradient(252, 0, 295, 0);
        spk.addColorStop(0, `${s.shine}00`);
        spk.addColorStop(0.4, `${s.shine}CC`);
        spk.addColorStop(1, `${s.shine}00`);
        ctx.fillStyle = spk;
        ctx.fillRect(248, 0, 50, 512);

        // Neon glow strip for cyber
        if (style === 'cyber') {
            const ng = ctx.createLinearGradient(0, 230, 0, 280);
            ng.addColorStop(0, 'rgba(0,229,255,0)');
            ng.addColorStop(0.5, 'rgba(0,229,255,0.9)');
            ng.addColorStop(1, 'rgba(0,229,255,0)');
            ctx.fillStyle = ng;
            ctx.fillRect(0, 230, 512, 50);
        }

        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this.cache[key] = tex;
        return tex;
    },

    getToonCapTexture(style = 'classic') {
        const key = `cap_${style}`;
        if (this.cache[key]) return this.cache[key];

        const cv = this._canvas(512, 128);
        const ctx = cv.getContext('2d');
        const colors = { classic: '#4CAF50', brass: '#D4AC0D', cyber: '#00BCD4' };
        const c = colors[style] || colors.classic;
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 512, 128);

        const hg = ctx.createLinearGradient(0, 0, 0, 128);
        hg.addColorStop(0, 'rgba(255,255,255,0.45)');
        hg.addColorStop(0.3, 'rgba(255,255,255,0)');
        hg.addColorStop(0.8, 'rgba(0,0,0,0)');
        hg.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = hg;
        ctx.fillRect(0, 0, 512, 128);

        const tex = new THREE.CanvasTexture(cv);
        this.cache[key] = tex;
        return tex;
    },

    // ─── ANIME GROUND ────────────────────────────────────────────────────────────
    getGroundTexture() {
        if (this.cache.ground) return this.cache.ground;

        const cv = this._canvas(1024, 512);
        const ctx = cv.getContext('2d');

        // Top grass band — flat cel-shaded tiers
        const grassColors = ['#66BB6A', '#43A047', '#388E3C'];
        const heights = [0, 120, 180];
        grassColors.forEach((c, i) => {
            ctx.fillStyle = c;
            ctx.fillRect(0, heights[i], 1024, (i < 2 ? heights[i + 1] : 200) - heights[i] + 10);
        });

        // Stylized grass blade tufts
        ctx.strokeStyle = '#81C784';
        for (let x = 0; x < 1024; x += 18) {
            const h = 14 + Math.random() * 22;
            const slant = (Math.random() - 0.5) * 10;
            ctx.lineWidth = 3 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(x, 180);
            ctx.quadraticCurveTo(x + slant, 180 - h * 0.6, x + slant * 2, 180 - h);
            ctx.stroke();
        }

        // Dirt — warm brown with pebble speckles
        const dg = ctx.createLinearGradient(0, 190, 0, 512);
        dg.addColorStop(0, '#8D6E63');
        dg.addColorStop(0.5, '#6D4C41');
        dg.addColorStop(1, '#4E342E');
        ctx.fillStyle = dg;
        ctx.fillRect(0, 190, 1024, 322);

        // Pebbles
        for (let i = 0; i < 320; i++) {
            const x = Math.random() * 1024;
            const y = 200 + Math.random() * 300;
            const r = 2 + Math.random() * 7;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(78,52,46,0.7)' : 'rgba(161,136,127,0.5)';
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(4, 1);
        this.cache.ground = tex;
        return tex;
    },

    // ─── CELESTIAL ───────────────────────────────────────────────────────────────
    getSunCoronaTexture() {
        if (this.cache.sunCorona) return this.cache.sunCorona;

        const cv = this._canvas(512, 512);
        const ctx = cv.getContext('2d');

        const g = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
        g.addColorStop(0.0, 'rgba(255,255,220,1)');
        g.addColorStop(0.2, 'rgba(255,215,80,0.85)');
        g.addColorStop(0.5, 'rgba(255,160,30,0.4)');
        g.addColorStop(0.8, 'rgba(255,100,0,0.12)');
        g.addColorStop(1.0, 'rgba(255,50,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);

        // Bold toon-style rays
        ctx.save();
        ctx.translate(256, 256);
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            const rg = ctx.createLinearGradient(0, 0, 230, 0);
            rg.addColorStop(0, 'rgba(255,235,100,0.55)');
            rg.addColorStop(0.6, 'rgba(255,180,30,0.15)');
            rg.addColorStop(1, 'rgba(255,120,0,0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.moveTo(0, -9); ctx.lineTo(230, 0); ctx.lineTo(0, 9);
            ctx.fill();
        }
        ctx.restore();

        const tex = new THREE.CanvasTexture(cv);
        this.cache.sunCorona = tex;
        return tex;
    },

    getMoonTexture() {
        if (this.cache.moon) return this.cache.moon;

        const cv = this._canvas(512, 512);
        const ctx = cv.getContext('2d');

        const g = ctx.createRadialGradient(220, 215, 40, 256, 256, 256);
        g.addColorStop(0, '#F8FAFB');
        g.addColorStop(0.65, '#D6E4E8');
        g.addColorStop(1, '#8BAAB5');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);

        // Craters
        [[160,150,50,0.22],[310,200,65,0.26],[230,340,42,0.2],[345,340,30,0.24],[140,260,22,0.3]].forEach(([x,y,r,d]) => {
            const cg = ctx.createRadialGradient(x-r*0.2,y-r*0.2,r*0.15,x,y,r);
            cg.addColorStop(0, `rgba(60,80,95,${d})`);
            cg.addColorStop(0.8, `rgba(40,60,80,${d*1.3})`);
            cg.addColorStop(1, `rgba(255,255,255,0.35)`);
            ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
            ctx.fillStyle = cg; ctx.fill();
        });

        const tex = new THREE.CanvasTexture(cv);
        this.cache.moon = tex;
        return tex;
    },

    // ─── RAIN ────────────────────────────────────────────────────────────────────
    getRaindropTexture() {
        if (this.cache.raindrop) return this.cache.raindrop;

        const cv = this._canvas(16, 64);
        const ctx = cv.getContext('2d');
        const g = ctx.createLinearGradient(8, 0, 8, 64);
        g.addColorStop(0, 'rgba(180,220,255,0)');
        g.addColorStop(0.3, 'rgba(210,235,255,0.5)');
        g.addColorStop(0.9, 'rgba(240,250,255,0.9)');
        g.addColorStop(1,   'rgba(255,255,255,1)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(8, 32, 4, 30, 0, 0, Math.PI*2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(cv);
        this.cache.raindrop = tex;
        return tex;
    },

    getRippleTexture() {
        if (this.cache.ripple) return this.cache.ripple;

        const cv = this._canvas(64, 64);
        const ctx = cv.getContext('2d');
        ctx.strokeStyle = 'rgba(200,230,255,0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(32,32,26,0,Math.PI*2); ctx.stroke();
        ctx.strokeStyle = 'rgba(200,230,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(32,32,15,0,Math.PI*2); ctx.stroke();

        const tex = new THREE.CanvasTexture(cv);
        this.cache.ripple = tex;
        return tex;
    },

    // ─── PARTICLES ───────────────────────────────────────────────────────────────
    getStarParticleTexture() {
        if (this.cache.star) return this.cache.star;

        const cv = this._canvas(128, 128);
        const ctx = cv.getContext('2d');
        ctx.save();
        ctx.translate(64, 64);
        this._drawStar(ctx, 0, 0, 5, 56, 24, '#ffffff');
        ctx.restore();

        // Inner glow
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 56);
        g.addColorStop(0, 'rgba(255,255,220,0.95)');
        g.addColorStop(0.4, 'rgba(255,220,80,0.5)');
        g.addColorStop(1, 'rgba(255,180,0,0)');
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = g; ctx.fillRect(0,0,128,128);
        ctx.globalCompositeOperation = 'source-over';

        const tex = new THREE.CanvasTexture(cv);
        this.cache.star = tex;
        return tex;
    },

    getGlowParticleTexture() {
        if (this.cache.glow) return this.cache.glow;

        const cv = this._canvas(64, 64);
        const ctx = cv.getContext('2d');
        const g = ctx.createRadialGradient(32,32,0,32,32,32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.3, 'rgba(255,220,80,0.8)');
        g.addColorStop(0.7, 'rgba(255,140,0,0.3)');
        g.addColorStop(1, 'rgba(255,50,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0,0,64,64);

        const tex = new THREE.CanvasTexture(cv);
        this.cache.glow = tex;
        return tex;
    },

    // ─── SPEED-LINE OVERLAY (manga motion) ───────────────────────────────────────
    getSpeedLineTex() {
        if (this.cache.speedLine) return this.cache.speedLine;

        const cv = this._canvas(512, 512);
        const ctx = cv.getContext('2d');
        const cx = 256, cy = 256;

        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        for (let i = 0; i < 48; i++) {
            const angle = (i / 48) * Math.PI * 2;
            const jitter = 0.012 * Math.PI;
            ctx.lineWidth = 1 + Math.random() * 3;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle + jitter) * 60, cy + Math.sin(angle + jitter) * 60);
            ctx.lineTo(cx + Math.cos(angle) * 300, cy + Math.sin(angle) * 300);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(cv);
        this.cache.speedLine = tex;
        return tex;
    },

    // Bird texture kept for wing material
    getBirdTexture(skin) { return this.getBirdBodyTexture(skin); },
    getPipeTexture(style) { return this.getToonPipeTexture(style); },
    getPipeCapTexture(style) { return this.getToonCapTexture(style); },
    getEyeTexture() { return this.getAnimeEyeTexture('classic'); },
};
