// models.js — Anime Cel-Shaded 3D Models for Flappy Bird 3D

// ─── TOON HELPERS ────────────────────────────────────────────────────────────────

function makeToonGradient(steps = 3) {
    const cv = document.createElement('canvas');
    cv.width = steps; cv.height = 1;
    const ctx = cv.getContext('2d');
    const cols = steps === 3
        ? ['#333', '#888', '#fff']
        : ['#222', '#555', '#999', '#fff'];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i, 0, 1, 1); });
    const tex = new THREE.CanvasTexture(cv);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

const TOON_GRADIENT = makeToonGradient(3);

function toonMat(color, options = {}) {
    return new THREE.MeshToonMaterial({
        color,
        gradientMap: TOON_GRADIENT,
        ...options,
    });
}

// Back-face outline shell — the anime outline technique
function addOutline(mesh, scale = 1.08, color = 0x1a1a2e) {
    const geo = mesh.geometry.clone();
    const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    const outline = new THREE.Mesh(geo, mat);
    outline.scale.setScalar(scale);
    mesh.add(outline);
    return outline;
}

function addGroupOutline(group, scale = 1.07, color = 0x1a1a2e) {
    group.traverse(child => {
        if (child.isMesh && child.material && !child.userData.isOutline) {
            addOutline(child, scale, color);
        }
    });
}

const ModelFactory = {

    // ─── ANIME 3D BIRD ──────────────────────────────────────────────────────────
    createBird(skin = 'classic') {
        const birdGroup = new THREE.Group();

        const bodyTex  = TextureGenerator.getBirdBodyTexture(skin);
        const eyeTex   = TextureGenerator.getAnimeEyeTexture(skin);

        const skinColors = {
            classic: { body: 0xFFD93D, wing: 0xFFAA00, beak: 0xFF6D00, crest: 0xFF1744, blush: 0xFFB6C1, belly: 0xFFFDE7 },
            cyber:   { body: 0x00E5FF, wing: 0x00AADD, beak: 0x00E5FF, crest: 0x00E5FF, blush: 0xB2EBF2, belly: 0xE0FEFF },
            phoenix: { body: 0xFF5722, wing: 0xDD2C00, beak: 0xFFAB40, crest: 0xFFD600, blush: 0xFFCCBC, belly: 0xFFF3E0 },
            shadow:  { body: 0x607D8B, wing: 0x37474F, beak: 0x546E7A, crest: 0xEA80FC, blush: 0xE8EAF6, belly: 0xECEFF1 },
        };
        const sc = skinColors[skin] || skinColors.classic;

        // 1. BODY — toon material with painted texture, smooth sphere
        const bodyGeo = new THREE.SphereGeometry(0.8, 18, 14);
        const bodyMat = new THREE.MeshToonMaterial({
            map: bodyTex,
            gradientMap: TOON_GRADIENT,
            color: sc.body,
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        addOutline(bodyMesh, 1.09, 0x1a1a2e);
        birdGroup.add(bodyMesh);

        // 2. BELLY — lighter oval, clean toon color
        const bellyGeo = new THREE.SphereGeometry(0.52, 14, 10);
        const bellyMat = toonMat(sc.belly);
        const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
        bellyMesh.scale.set(1.0, 0.82, 0.88);
        bellyMesh.position.set(0.14, -0.22, 0);
        birdGroup.add(bellyMesh);

        // 3. EYES — large, expressive anime eyes
        const eyeGeo  = new THREE.SphereGeometry(0.33, 14, 12);
        const eyeMat  = new THREE.MeshToonMaterial({ map: eyeTex, gradientMap: TOON_GRADIENT });

        const leftEye  = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(0.52, 0.42, 0.52);
        leftEye.rotation.y = Math.PI / 6;
        birdGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.52, 0.42, -0.52);
        rightEye.rotation.y = -Math.PI / 6;
        birdGroup.add(rightEye);

        // Eye outline rings
        const eyeRingGeo = new THREE.TorusGeometry(0.34, 0.07, 6, 14);
        const eyeRingMat = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
        [leftEye, rightEye].forEach(eye => {
            const ring = new THREE.Mesh(eyeRingGeo, eyeRingMat);
            ring.rotation.copy(eye.rotation);
            ring.position.copy(eye.position);
            birdGroup.add(ring);
        });

        // 4. BLUSH CHEEKS — pink flat discs
        const blushGeo = new THREE.CircleGeometry(0.19, 16);
        const blushMat = new THREE.MeshBasicMaterial({ color: sc.blush, transparent: true, opacity: 0.72, depthWrite: false });
        const leftBlush  = new THREE.Mesh(blushGeo, blushMat);
        leftBlush.position.set(0.65, 0.12, 0.60);
        leftBlush.rotation.y = -Math.PI / 5;
        birdGroup.add(leftBlush);

        const rightBlush = new THREE.Mesh(blushGeo, blushMat);
        rightBlush.position.set(0.65, 0.12, -0.60);
        rightBlush.rotation.y = Math.PI / 5;
        birdGroup.add(rightBlush);

        // 5. BEAK — simple clean triangle wedge
        const beakGeo = new THREE.ConeGeometry(0.28, 0.65, 4);
        beakGeo.rotateZ(-Math.PI / 2);
        const beakMat = toonMat(sc.beak);
        const upperBeak = new THREE.Mesh(beakGeo, beakMat);
        upperBeak.position.set(1.08, 0.08, 0);
        upperBeak.castShadow = true;
        addOutline(upperBeak, 1.1, 0x1a1a2e);
        birdGroup.add(upperBeak);

        const lowerBeakGeo = new THREE.ConeGeometry(0.22, 0.52, 4);
        lowerBeakGeo.rotateZ(-Math.PI / 2);
        const lowerBeak = new THREE.Mesh(lowerBeakGeo, toonMat(sc.beak));
        lowerBeak.position.set(1.0, -0.14, 0);
        addOutline(lowerBeak, 1.1, 0x1a1a2e);
        birdGroup.add(lowerBeak);

        // 6. HEAD CREST — 3 bold spikes
        const crestGroup = new THREE.Group();
        const crestGeo = new THREE.ConeGeometry(0.1, 0.52, 6);
        const crestMat = toonMat(sc.crest);
        for (let i = 0; i < 3; i++) {
            const f = new THREE.Mesh(crestGeo.clone(), crestMat);
            f.position.set(-0.15 - i * 0.12, 0.74 + i * 0.1, (i - 1) * 0.1);
            f.rotation.z = -0.3 - i * 0.18;
            addOutline(f, 1.12, 0x1a1a2e);
            crestGroup.add(f);
        }
        birdGroup.add(crestGroup);

        // 7. TAIL FEATHERS — bold fan
        const tailGroup = new THREE.Group();
        const tailMat  = toonMat(sc.crest);
        for (let i = -1; i <= 1; i++) {
            const tGeo = new THREE.BoxGeometry(0.52, 0.065, 0.22);
            const tMesh = new THREE.Mesh(tGeo, tailMat);
            tMesh.position.set(-0.98, 0.05 + Math.abs(i) * 0.05, i * 0.18);
            tMesh.rotation.y = i * 0.22;
            tMesh.rotation.z = 0.26;
            addOutline(tMesh, 1.1, 0x1a1a2e);
            tailGroup.add(tMesh);
        }
        birdGroup.add(tailGroup);

        // 8. WINGS — rounded petal shape
        const wingTex = TextureGenerator.getBirdBodyTexture(skin);
        const wingMat = new THREE.MeshToonMaterial({ color: sc.wing, gradientMap: TOON_GRADIENT });

        const leftWingPivot  = new THREE.Group();
        leftWingPivot.position.set(-0.05, 0.05, 0.72);
        const wGeo = new THREE.SphereGeometry(0.42, 12, 8);
        wGeo.scale(1.4, 0.3, 1.1);
        wGeo.translate(-0.1, 0, 0.3);
        const lWingMesh = new THREE.Mesh(wGeo, wingMat);
        addOutline(lWingMesh, 1.1, 0x1a1a2e);
        leftWingPivot.add(lWingMesh);
        birdGroup.add(leftWingPivot);

        const rightWingPivot = new THREE.Group();
        rightWingPivot.position.set(-0.05, 0.05, -0.72);
        const rWingMesh = lWingMesh.clone();
        rWingMesh.scale.z = -1;
        rightWingPivot.add(rWingMesh);
        birdGroup.add(rightWingPivot);

        // Scale down bird to feel nimble
        birdGroup.scale.setScalar(0.72);

        birdGroup.userData = {
            leftWingPivot, rightWingPivot, crestGroup, tailGroup,
            bodyMesh, bellyMesh, upperBeak, lowerBeak,
            wingMat, bodyMat, blushMat, eyeMat,
            skin,
            wingAngle: 0,
            targetPitch: 0, currentPitch: 0,
            radius: 0.52,
        };

        birdGroup.setSkin = function(newSkin) {
            const s2 = skinColors[newSkin] || skinColors.classic;
            this.userData.skin = newSkin;
            this.userData.bodyMat.map = TextureGenerator.getBirdBodyTexture(newSkin);
            this.userData.bodyMat.color.setHex(s2.body);
            this.userData.bodyMat.needsUpdate = true;
            this.userData.wingMat.color.setHex(s2.wing);
            this.userData.bellyMesh.material.color.setHex(s2.belly);
            this.userData.upperBeak.material.color.setHex(s2.beak);
            this.userData.eyeMat.map = TextureGenerator.getAnimeEyeTexture(newSkin);
            this.userData.eyeMat.needsUpdate = true;
        };

        birdGroup.updateAnimation = function(delta, velocityY, isFlapping) {
            const u = this.userData;
            const freq = isFlapping ? 28 : Math.max(5, 14 - velocityY * 1.5);
            u.wingAngle += delta * freq;

            const flap = Math.sin(u.wingAngle) * (isFlapping ? 0.9 : 0.5);
            u.leftWingPivot.rotation.x  = -flap;
            u.rightWingPivot.rotation.x =  flap;

            u.crestGroup.rotation.z = Math.sin(u.wingAngle * 0.9) * 0.09;
            u.tailGroup.rotation.z  = 0.22 + Math.sin(u.wingAngle) * 0.11;

            u.targetPitch  = Math.max(-1.3, Math.min(0.55, velocityY * 0.062));
            u.currentPitch += (u.targetPitch - u.currentPitch) * (delta * 11);
            this.rotation.z = u.currentPitch;
            this.rotation.x = -u.currentPitch * 0.14;

            // Squash/stretch on flap peaks
            const squash = 1 + Math.abs(flap) * 0.07;
            this.scale.set(0.72 * squash, 0.72 / squash, 0.72);
        };

        return birdGroup;
    },

    // ─── PIPE PAIR ──────────────────────────────────────────────────────────────
    createPipePair(style = 'classic', gapSize = 3.2) {
        const pipeGroup = new THREE.Group();

        const pipeR = 0.95, capR = 1.18, capH = 0.75, pipeL = 14;

        const pipeTex = TextureGenerator.getToonPipeTexture(style);
        const capTex  = TextureGenerator.getToonCapTexture(style);

        const styleColors = { classic: 0x388E3C, brass: 0xB7950B, cyber: 0x1565C0 };
        const capColors   = { classic: 0x43A047, brass: 0xD4AC0D, cyber: 0x1976D2 };

        const pipeMat = new THREE.MeshToonMaterial({ map: pipeTex, color: styleColors[style] || 0x388E3C, gradientMap: TOON_GRADIENT });
        const capMat  = new THREE.MeshToonMaterial({ map: capTex,  color: capColors[style]  || 0x43A047, gradientMap: TOON_GRADIENT });

        const makeHalf = (flip) => {
            const half = new THREE.Group();

            const bodyGeo = new THREE.CylinderGeometry(pipeR, pipeR, pipeL, 12);
            const body = new THREE.Mesh(bodyGeo, pipeMat);
            body.position.y = (pipeL / 2 + capH) * flip;
            addOutline(body, 1.05, 0x1a1a2e);
            half.add(body);

            const capGeo = new THREE.CylinderGeometry(capR, capR, capH, 12);
            const cap  = new THREE.Mesh(capGeo, capMat);
            cap.position.y = (capH / 2) * flip;
            addOutline(cap, 1.06, 0x1a1a2e);
            half.add(cap);

            return half;
        };

        const topPipe    = makeHalf(1);
        const bottomPipe = makeHalf(-1);
        pipeGroup.add(topPipe);
        pipeGroup.add(bottomPipe);

        // Cyber neon ring
        let energyRing = null;
        if (style === 'cyber') {
            const ringGeo = new THREE.TorusGeometry(gapSize * 0.42, 0.055, 8, 32);
            ringGeo.rotateY(Math.PI / 2);
            energyRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.7 }));
            pipeGroup.add(energyRing);
        }

        pipeGroup.userData = {
            topPipe, bottomPipe, energyRing,
            pipeRadius: capR, gapSize, gapY: 0,
            scored: false, initialY: 0,
            bobAmplitude: 0, bobSpeed: 2.0, bobTimer: Math.random() * Math.PI * 2,
        };

        pipeGroup.setGap = function(gapY, newGapSize = gapSize) {
            this.userData.gapY = gapY;
            this.userData.gapSize = newGapSize;
            this.userData.initialY = gapY;
            topPipe.position.y    = gapY + newGapSize / 2;
            bottomPipe.position.y = gapY - newGapSize / 2;
            if (energyRing) energyRing.position.y = gapY;
        };

        return pipeGroup;
    },

    // ─── GROUND ─────────────────────────────────────────────────────────────────
    createGround(width = 70, depth = 25) {
        const g = new THREE.Group();

        const geo = new THREE.PlaneGeometry(width, depth);
        geo.rotateX(-Math.PI / 2);
        const tex = TextureGenerator.getGroundTexture();
        const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: TOON_GRADIENT });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        g.add(mesh);

        // Cliff face
        const cliffH = 8;
        const cliffMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width, cliffH),
            mat
        );
        cliffMesh.position.set(0, -cliffH / 2, depth / 2);
        g.add(cliffMesh);

        g.userData = { groundTex: tex };
        g.scroll = function(speed, delta) {
            tex.offset.x = (tex.offset.x + (speed * delta) / 16) % 1;
        };

        return g;
    },

    // ─── ANIME TOON CLOUDS (Optimized for Android TV) ──────────────────────────
    createCloud() {
        const g = new THREE.Group();
        const mat = new THREE.MeshToonMaterial({ color: 0xFFFFFF, gradientMap: TOON_GRADIENT });

        const count = 3;
        for (let i = 0; i < count; i++) {
            const r = 0.9 + Math.random() * 0.9;
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), mat);
            mesh.position.set(
                (i - 1) * 1.3 + (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.6,
            );
            g.add(mesh);
        }
        const sc = 0.85 + Math.random() * 0.8;
        g.scale.set(sc, sc * 0.7, sc);

        g.userData = {
            speed: 0.9 + Math.random() * 1.1,
            mat,
            setStorminess(r) {
                mat.color.set(new THREE.Color(0xffffff).lerp(new THREE.Color(0x37474f), r));
            },
        };

        return g;
    },

    // ─── MOVING 3D SUN ──────────────────────────────────────────────────────────
    createSun() {
        const g = new THREE.Group();

        const sunMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.75, 14, 12),
            new THREE.MeshBasicMaterial({ color: 0xFFF176 })
        );
        g.add(sunMesh);

        const corona = new THREE.Mesh(
            new THREE.PlaneGeometry(9.5, 9.5),
            new THREE.MeshBasicMaterial({
                map: TextureGenerator.getSunCoronaTexture(),
                transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
            })
        );
        g.add(corona);

        g.userData = {
            sunMesh, corona,
            update(timeOfDay) {
                const angle = Math.PI * (1 - timeOfDay * 1.65);
                g.position.set(Math.cos(angle) * 18, Math.sin(angle) * 13, -14);
                sunMesh.material.color.setHex(
                    (timeOfDay < 0.15 || timeOfDay > 0.5) ? 0xFF8A65 : 0xFFF9C4
                );
                corona.rotation.z += 0.0025;
            },
        };

        return g;
    },

    // ─── MOVING 3D MOON ─────────────────────────────────────────────────────────
    createMoon() {
        const g = new THREE.Group();

        const moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.45, 14, 12),
            new THREE.MeshBasicMaterial({ map: TextureGenerator.getMoonTexture() })
        );
        g.add(moonMesh);

        const halo = new THREE.Mesh(
            new THREE.PlaneGeometry(7, 7),
            new THREE.MeshBasicMaterial({
                map: TextureGenerator.getSunCoronaTexture(),
                color: 0x90CAF9, transparent: true, opacity: 0.42,
                blending: THREE.AdditiveBlending, depthWrite: false,
            })
        );
        g.add(halo);

        g.userData = {
            update(timeOfDay) {
                const angle = Math.PI * (1 - (timeOfDay - 0.5) * 1.85);
                g.position.set(Math.cos(angle) * 18, Math.sin(angle) * 12, -14);
            },
        };

        return g;
    },

    // ─── RAIN SYSTEM (Ultra Lightweight TV Edition) ────────────────────────────
    createRainSystem(dropCount = 35) {
        const g = new THREE.Group();

        if (dropCount <= 0) {
            g.userData = { intensity: 0, update() {} };
            g.visible = false;
            return g;
        }

        const dropGeo = new THREE.BufferGeometry();
        const pos  = new Float32Array(dropCount * 3);
        const vels = new Float32Array(dropCount * 3);

        for (let i = 0; i < dropCount; i++) {
            pos[i*3]   = -18 + Math.random() * 36;
            pos[i*3+1] = -4  + Math.random() * 18;
            pos[i*3+2] = -8  + Math.random() * 14;
            vels[i*3]  = -2.5 - Math.random() * 1.5;
            vels[i*3+1]= -26  - Math.random() * 8;
        }
        dropGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const dropMat = new THREE.PointsMaterial({
            size: 0.5, map: TextureGenerator.getRaindropTexture(),
            transparent: true, opacity: 0.75,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const drops = new THREE.Points(dropGeo, dropMat);
        g.add(drops);

        const rCount = 8;
        const rGeo = new THREE.BufferGeometry();
        const rPos = new Float32Array(rCount * 3);
        const rSz  = new Float32Array(rCount);
        const rLife = new Float32Array(rCount);
        rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
        rGeo.setAttribute('size', new THREE.BufferAttribute(rSz, 1));
        const ripples = new THREE.Points(rGeo, new THREE.PointsMaterial({
            size: 0.8, map: TextureGenerator.getRippleTexture(),
            transparent: true, opacity: 0.55,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        g.add(ripples);

        let ri = 0;

        g.userData = {
            intensity: 0,
            update(delta, groundY) {
                g.visible = this.intensity > 0.02;
                if (!g.visible) return;
                dropMat.opacity = this.intensity * 0.78;

                const pa = drops.geometry.attributes.position.array;
                for (let i = 0; i < dropCount; i++) {
                    pa[i*3]   += vels[i*3]   * delta;
                    pa[i*3+1] += vels[i*3+1] * delta;
                    if (pa[i*3+1] <= groundY) {
                        if (Math.random() < 0.25) {
                            rPos[ri*3] = pa[i*3]; rPos[ri*3+1] = groundY + 0.05; rPos[ri*3+2] = pa[i*3+2];
                            rLife[ri] = 0.3; rSz[ri] = 0.15;
                            ri = (ri + 1) % rCount;
                        }
                        pa[i*3]   = -18 + Math.random() * 36;
                        pa[i*3+1] = groundY + 18 + Math.random() * 4;
                        pa[i*3+2] = -8 + Math.random() * 14;
                    }
                }
                drops.geometry.attributes.position.needsUpdate = true;

                for (let i = 0; i < rCount; i++) {
                    if (rLife[i] > 0) { rLife[i] -= delta; rSz[i] += delta * 2.2; }
                    else rSz[i] = 0;
                }
                ripples.geometry.attributes.position.needsUpdate = true;
                ripples.geometry.attributes.size.needsUpdate = true;
            },
        };

        return g;
    },

    // ─── SPEED LINES (3D manga radial) ──────────────────────────────────────────
    createSpeedLines() {
        const g = new THREE.Group();
        const lines = [];
        const lineCount = 14;

        for (let i = 0; i < lineCount; i++) {
            const angle  = (i / lineCount) * Math.PI * 2;
            const jitter = (Math.random() - 0.5) * 0.08;
            const pts    = [
                new THREE.Vector3(Math.cos(angle + jitter) * 1.5, Math.sin(angle + jitter) * 2.0, 0),
                new THREE.Vector3(Math.cos(angle) * 18, Math.sin(angle) * 22, 0),
            ];
            const geo  = new THREE.BufferGeometry().setFromPoints(pts);
            const mat  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
            const line = new THREE.Line(geo, mat);
            g.add(line);
            lines.push({ line, mat });
        }

        g.userData = {
            lines,
            setIntensity(intensity) {
                lines.forEach(l => { l.mat.opacity = intensity * (0.1 + Math.random() * 0.08); });
            },
        };

        return g;
    },

    // ─── STAR PARTICLE EMITTER (Ultra Lightweight TV Edition) ───────────────────
    createParticleEmitter(maxP = 30) {
        if (maxP <= 0) {
            return {
                userData: {
                    emit() {},
                    update() {}
                }
            };
        }
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(maxP * 3);
        const colors    = new Float32Array(maxP * 3);
        const sizes     = new Float32Array(maxP);
        sizes.fill(0);

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.5, vertexColors: true,
            map: TextureGenerator.getStarParticleTexture(),
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        });

        const pts = new THREE.Points(geo, mat);
        const pool = [];
        for (let i = 0; i < maxP; i++) {
            pool.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 1, g: 1, b: 1, life: 0, maxLife: 1, size: 0 });
        }
        let emitIdx = 0;

        pts.userData = {
            pool,
            emit(x, y, z, vx, vy, vz, r, g, b, life, size) {
                const p = pool[emitIdx];
                emitIdx = (emitIdx + 1) % maxP;
                p.x = x; p.y = y; p.z = z;
                p.vx = vx; p.vy = vy; p.vz = vz;
                p.r = r; p.g = g; p.b = b;
                p.life = life; p.maxLife = life;
                p.size = size;
            },
            update(delta) {
                const pa = pts.geometry.attributes.position.array;
                const ca = pts.geometry.attributes.color.array;
                const sa = pts.geometry.attributes.size.array;
                let hasActive = false;

                for (let i = 0; i < maxP; i++) {
                    const p = pool[i];
                    if (p.life > 0) {
                        hasActive = true;
                        p.life -= delta;
                        p.x += p.vx * delta; p.y += p.vy * delta; p.z += p.vz * delta;
                        p.vy -= 6.5 * delta;
                        const t = Math.max(0, p.life / p.maxLife);
                        pa[i*3]=p.x; pa[i*3+1]=p.y; pa[i*3+2]=p.z;
                        ca[i*3]=p.r*t; ca[i*3+1]=p.g*t; ca[i*3+2]=p.b*t;
                        sa[i]=p.size*t;
                    } else { sa[i]=0; }
                }
                if (hasActive) {
                    pts.geometry.attributes.position.needsUpdate = true;
                    pts.geometry.attributes.color.needsUpdate    = true;
                    pts.geometry.attributes.size.needsUpdate     = true;
                }
            },
        };

        return pts;
    },
};
