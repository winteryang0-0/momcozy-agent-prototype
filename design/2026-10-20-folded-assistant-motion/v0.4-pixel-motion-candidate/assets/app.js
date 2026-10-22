(() => {
  const source = new Image();
  const canvas = document.getElementById('motion-canvas');
  const stage = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const seek = document.getElementById('seek');
  const play = document.getElementById('play');
  const pause = document.getElementById('pause');
  const loop = document.getElementById('loop');
  const slow = document.getElementById('slow');
  const reduce = document.getElementById('reduce');
  const timecode = document.getElementById('timecode');
  const status = document.getElementById('status');
  const clipMeta = document.getElementById('clip-meta');
  const stageState = document.getElementById('stage-state');
  const steps = document.getElementById('clip-steps');
  const boundary = document.getElementById('clip-boundary');
  const buttons = [...document.querySelectorAll('.clip-button')];

  const clips = {
    jump: {
      label: '轻跳', duration: 1300, kind: '原图像素',
      description: '轻跳：压低、短暂腾空、落地回稳。',
      steps: [['0.00', '轻微压低重心。'], ['0.25', '向上短跳，折面与五官保持原图。'], ['0.80', '落地后轻压，恢复静止。']],
      boundary: '整张原图角色像素同步移动；跳跃的高度与压缩量用于评审动作幅度。'
    },
    sway: {
      label: '轻摇', duration: 1800, kind: '原图像素',
      description: '轻摇：以底部为轴，轻向两侧摇晃后回正。',
      steps: [['0.00', '从完整静止姿态起步。'], ['0.40', '向一侧微倾，再经过中心向另一侧微倾。'], ['1.45', '缓慢回到原位。']],
      boundary: '整张原图角色像素转动；不推断新的表面、折线或五官。'
    }
  };

  const IW = 710;
  const IH = 830;
  const ease = x => x * x * (3 - 2 * x);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => ease(clamp((x - a) / (b - a)));

  let active = 'jump';
  let elapsed = 0;
  let playing = false;
  let previousFrame = 0;
  let raf = 0;
  let imageFailed = false;
  let userInteracted = false;
  let width = 0;
  let height = 0;

  function resize() {
    const bounds = stage.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    render();
  }

  function layout() {
    // Leave enough room above the character for the highest jump frame.
    const scale = Math.min((width - 56) / IW, (height - 39 - 58) / (IH * 1.105), 0.72);
    return { scale, ground: height - 39, x: width / 2, actorW: IW * scale, actorH: IH * scale };
  }

  function drawShadow(l, jump = 0, spread = 1) {
    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.globalAlpha = clamp(0.16 - jump * 0.0013, 0.055, 0.17);
    ctx.fillStyle = '#543a34';
    ctx.beginPath();
    ctx.ellipse(l.x, l.ground + 4, l.actorW * 0.35 * spread, 13 * spread, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawOriginal(l, { x = 0, y = 0, angle = 0, sx = 1, sy = 1 } = {}) {
    ctx.save();
    ctx.translate(l.x + x, l.ground + y);
    ctx.rotate(angle);
    ctx.scale(sx, sy);
    ctx.drawImage(source, -l.actorW / 2, -l.actorH, l.actorW, l.actorH);
    ctx.restore();
  }

  function drawMotion(l, clip, p) {
    if (clip === 'jump') {
      const anticipation = Math.sin(smooth(0, 0.2, p) * Math.PI) * (1 - smooth(0.12, 0.22, p));
      const lift = p < 0.22 ? 0 : p < 0.72 ? Math.sin((p - 0.22) / 0.5 * Math.PI) : 0;
      const landing = Math.sin(smooth(0.72, 0.96, p) * Math.PI) * (1 - smooth(0.86, 1, p));
      const heightPx = lift * l.actorH * 0.105;
      drawShadow(l, heightPx, 1 + lift * 0.17);
      drawOriginal(l, {
        y: -heightPx,
        sx: 1 + anticipation * 0.018 + landing * 0.026 - lift * 0.01,
        sy: 1 - anticipation * 0.025 - landing * 0.035 + lift * 0.01
      });
      return;
    }
    const envelope = Math.sin(Math.PI * p);
    const angle = Math.sin(2 * Math.PI * p) * envelope * (3.4 * Math.PI / 180);
    drawShadow(l, 0, 1 + Math.abs(angle) * 0.3);
    drawOriginal(l, { angle, x: Math.sin(2 * Math.PI * p) * envelope * l.actorW * 0.008 });
  }

  function render() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    if (!source.complete || !source.naturalWidth) {
      ctx.fillStyle = '#692a3a';
      ctx.font = '14px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(imageFailed ? '原图素材载入失败' : '正在载入原图角色…', width / 2, height / 2);
      return;
    }
    const clip = clips[active];
    drawMotion(layout(), active, clamp(elapsed / clip.duration));
  }

  function syncUI() {
    const clip = clips[active];
    seek.value = String(Math.round(clamp(elapsed / clip.duration) * 1000));
    timecode.textContent = `${(elapsed / 1000).toFixed(2)} / ${(clip.duration / 1000).toFixed(2)} 秒`;
    play.disabled = playing;
    pause.disabled = !playing;
  }

  function stop() {
    playing = false;
    previousFrame = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    syncUI();
  }

  function frame(now) {
    if (!playing) return;
    const delta = previousFrame ? Math.max(0, now - previousFrame) * (slow.checked ? 0.5 : 1) : 0;
    previousFrame = now;
    const duration = clips[active].duration;
    elapsed += delta;
    if (loop.checked) elapsed %= duration;
    else if (elapsed >= duration) {
      elapsed = duration;
      stop();
      render();
      return;
    }
    syncUI();
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduce.checked) {
      elapsed = clips[active].duration;
      render();
      syncUI();
      return;
    }
    if (elapsed >= clips[active].duration) elapsed = 0;
    if (playing) return;
    playing = true;
    previousFrame = 0;
    syncUI();
    raf = requestAnimationFrame(frame);
  }

  function selectClip(key, autoplay = false) {
    stop();
    active = key;
    elapsed = reduce.checked ? clips[key].duration : 0;
    const clip = clips[key];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.clip === key)));
    clipMeta.textContent = `${clip.label} · ${(clip.duration / 1000).toFixed(1)} 秒`;
    stageState.textContent = clip.kind;
    status.textContent = clip.description;
    steps.replaceChildren(...clip.steps.map(([time, label]) => {
      const li = document.createElement('li');
      const mark = document.createElement('span');
      mark.className = 'step-time';
      mark.textContent = time;
      const copy = document.createElement('span');
      copy.textContent = label;
      li.append(mark, copy);
      return li;
    }));
    boundary.textContent = clip.boundary;
    syncUI();
    render();
    if (autoplay) start();
  }

  function maybeStartInitialPreview() {
    if (!userInteracted && !reduce.checked && !playing && elapsed === 0 && source.naturalWidth) start();
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    userInteracted = true;
    selectClip(button.dataset.clip, true);
  }));
  play.addEventListener('click', () => { userInteracted = true; start(); });
  pause.addEventListener('click', () => { userInteracted = true; stop(); });
  seek.addEventListener('input', () => {
    userInteracted = true;
    const target = Number(seek.value);
    stop();
    elapsed = clips[active].duration * target / 1000;
    syncUI();
    render();
  });
  reduce.addEventListener('change', () => {
    userInteracted = true;
    stop();
    elapsed = reduce.checked ? clips[active].duration : 0;
    syncUI();
    render();
  });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
    if (event.matches) {
      reduce.checked = true;
      stop();
      elapsed = clips[active].duration;
      syncUI();
      render();
    }
  });
  window.addEventListener('resize', resize);
  source.onload = () => {
    resize();
    maybeStartInitialPreview();
    render();
  };
  source.onerror = () => {
    imageFailed = true;
    status.textContent = '原图角色素材载入失败，请确认 assets/folded-hero-original-pixels.png 存在。';
    resize();
  };
  reduce.checked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  selectClip('jump');
  resize();
  source.src = 'assets/folded-hero-original-pixels.png';
})();
