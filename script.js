(function () {
    const themes = ['tokyonight', 'sakura', 'kyoto', 'cyberpunk', 'latte'];
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeNameSpan = document.getElementById('theme-name');
    const sakuraToggleBtn = document.getElementById('sakura-toggle');
    const sakuraStatusSpan = document.getElementById('sakura-status');

    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const playerIcon = document.getElementById('player-icon');
    const playerLabel = document.getElementById('player-label');
    const visualizer = document.getElementById('visualizer');
    const reelLeft = document.getElementById('reel-left');
    const reelRight = document.getElementById('reel-right');

    function applyTheme(theme) {
        if (!themes.includes(theme)) {
            theme = 'tokyonight';
        }
        document.body.setAttribute('data-theme', theme);
        if (themeNameSpan) {
            themeNameSpan.textContent = theme;
        }
        localStorage.setItem('frostsue_theme', theme);
    }

    function cycleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'tokyonight';
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        applyTheme(themes[nextIndex]);
    }

    const canvas = document.getElementById('sakura-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    let petals = [];
    let animationFrameId = null;
    let sakuraEnabled = true;

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createPetal() {
        return {
            x: Math.random() * (canvas ? canvas.width : 800),
            y: Math.random() * -50,
            size: Math.random() * 7 + 6,
            speedY: Math.random() * 1.2 + 0.8,
            speedX: Math.random() * 1.2 - 0.6,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 1.5 - 0.75,
            opacity: Math.random() * 0.4 + 0.4
        };
    }

    function initPetals() {
        petals = [];
        const count = Math.min(35, Math.floor(window.innerWidth / 30));
        for (let i = 0; i < count; i++) {
            const petal = createPetal();
            petal.y = Math.random() * window.innerHeight;
            petals.push(petal);
        }
    }

    function renderSakura() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!sakuraEnabled) {
            animationFrameId = null;
            return;
        }

        const isSakuraTheme = document.body.getAttribute('data-theme') === 'sakura';
        const petalColor = isSakuraTheme ? 'rgba(255, 183, 197, ' : 'rgba(187, 154, 247, ';

        for (let i = 0; i < petals.length; i++) {
            const p = petals[i];
            p.y += p.speedY;
            p.x += Math.sin(p.y / 30) * 0.8 + p.speedX;
            p.rotation += p.rotationSpeed;

            if (p.y > canvas.height + 20) {
                petals[i] = createPetal();
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = petalColor + p.opacity + ')';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, p.size / 3, 0, p.size);
            ctx.bezierCurveTo(p.size, p.size / 3, p.size / 2, -p.size / 2, 0, 0);
            ctx.fill();
            ctx.restore();
        }

        animationFrameId = requestAnimationFrame(renderSakura);
    }

    function setSakuraState(enabled) {
        sakuraEnabled = enabled;
        if (sakuraStatusSpan) {
            sakuraStatusSpan.textContent = enabled ? 'on' : 'off';
        }
        localStorage.setItem('frostsue_sakura', enabled ? 'true' : 'false');
        if (enabled && !animationFrameId) {
            renderSakura();
        } else if (!enabled && ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    let audioCtx = null;
    let rainNode = null;
    let gainNode = null;
    let isPlayingAudio = false;

    function buildLoFiRainNode() {
        if (!audioCtx) return null;
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const lowpassFilter = audioCtx.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.setValueAtTime(800, audioCtx.currentTime);

        const highpassFilter = audioCtx.createBiquadFilter();
        highpassFilter.type = 'highpass';
        highpassFilter.frequency.setValueAtTime(150, audioCtx.currentTime);

        whiteNoise.connect(lowpassFilter);
        lowpassFilter.connect(highpassFilter);

        return { source: whiteNoise, output: highpassFilter };
    }

    function toggleLoFiAudio() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (isPlayingAudio) {
            if (gainNode) {
                gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                setTimeout(() => {
                    if (rainNode) {
                        try {
                            rainNode.source.stop();
                        } catch (e) {}
                        rainNode = null;
                    }
                }, 300);
            }
            isPlayingAudio = false;
            updatePlayerUI(false);
        } else {
            gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 0.5);

            rainNode = buildLoFiRainNode();
            if (rainNode) {
                rainNode.output.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                rainNode.source.start(0);
            }

            isPlayingAudio = true;
            updatePlayerUI(true);
        }
    }

    function updatePlayerUI(playing) {
        if (playing) {
            if (playerIcon) playerIcon.textContent = '\u275A\u275A';
            if (playerLabel) playerLabel.textContent = 'Pause Ambient Rain';
            if (visualizer) visualizer.classList.add('active');
            if (reelLeft) reelLeft.classList.add('spinning');
            if (reelRight) reelRight.classList.add('spinning');
        } else {
            if (playerIcon) playerIcon.textContent = '\u25B6';
            if (playerLabel) playerLabel.textContent = 'Play Ambient Rain';
            if (visualizer) visualizer.classList.remove('active');
            if (reelLeft) reelLeft.classList.remove('spinning');
            if (reelRight) reelRight.classList.remove('spinning');
        }
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        initPetals();
    });

    const savedTheme = localStorage.getItem('frostsue_theme') || 'tokyonight';
    const savedSakura = localStorage.getItem('frostsue_sakura') !== 'false';

    applyTheme(savedTheme);
    resizeCanvas();
    initPetals();
    setSakuraState(savedSakura);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', cycleTheme);
    }

    if (sakuraToggleBtn) {
        sakuraToggleBtn.addEventListener('click', () => {
            setSakuraState(!sakuraEnabled);
        });
    }

    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', toggleLoFiAudio);
    }
})();
