(function () {
    const themes = ['sakura', 'tokyonight', 'kyoto', 'cyberpunk', 'latte'];
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
    const audioElement = document.getElementById('lofi-audio-player');

    function applyTheme(theme) {
        if (!themes.includes(theme)) {
            theme = 'sakura';
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

    let isAudioPlaying = false;
    let fadeInterval = null;

    function fadeInAudio() {
        if (!audioElement) return;
        clearInterval(fadeInterval);
        audioElement.volume = 0.05;
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                fadeInterval = setInterval(() => {
                    if (audioElement.volume < 0.65) {
                        audioElement.volume = Math.min(0.7, audioElement.volume + 0.05);
                    } else {
                        clearInterval(fadeInterval);
                    }
                }, 80);
            }).catch(() => {
                isAudioPlaying = false;
                updateAudioUI(false);
            });
        }
    }

    function fadeOutAudio() {
        if (!audioElement) return;
        clearInterval(fadeInterval);
        fadeInterval = setInterval(() => {
            if (audioElement.volume > 0.08) {
                audioElement.volume = Math.max(0, audioElement.volume - 0.06);
            } else {
                audioElement.pause();
                audioElement.volume = 0.7;
                clearInterval(fadeInterval);
            }
        }, 50);
    }

    function toggleAudioPlayback() {
        if (!audioElement) return;

        if (isAudioPlaying) {
            fadeOutAudio();
            isAudioPlaying = false;
            updateAudioUI(false);
        } else {
            fadeInAudio();
            isAudioPlaying = true;
            updateAudioUI(true);
        }
    }

    function updateAudioUI(playing) {
        if (playing) {
            if (playerIcon) playerIcon.textContent = '\u275A\u275A';
            if (playerLabel) playerLabel.textContent = 'Pause Music';
            if (visualizer) visualizer.classList.add('active');
            if (reelLeft) reelLeft.classList.add('spinning');
            if (reelRight) reelRight.classList.add('spinning');
        } else {
            if (playerIcon) playerIcon.textContent = '\u25B6';
            if (playerLabel) playerLabel.textContent = 'Play Music';
            if (visualizer) visualizer.classList.remove('active');
            if (reelLeft) reelLeft.classList.remove('spinning');
            if (reelRight) reelRight.classList.remove('spinning');
        }
    }

    if (audioElement) {
        audioElement.addEventListener('ended', () => {
            if (isAudioPlaying) {
                audioElement.currentTime = 0;
                audioElement.play();
            }
        });
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        initPetals();
    });

    const savedTheme = localStorage.getItem('frostsue_theme') || 'sakura';
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
        audioToggleBtn.addEventListener('click', toggleAudioPlayback);
    }
})();
