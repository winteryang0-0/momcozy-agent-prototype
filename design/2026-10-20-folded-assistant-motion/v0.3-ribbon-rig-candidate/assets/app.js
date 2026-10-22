(() => {
  const source = new Image();
  const frontSource = new Image();
  const headShellSource = new Image();

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
    form: {
      label: '丝带成形', duration: 2400, kind: '推断动作',
      description: '丝带成形：原图折面收为窄带，再逐步展开到完整姿态。',
      steps: [['0.00', '象牙白与莓红折面压合成窄带，从侧方缓缓滑入。'], ['0.55', '身体和短翼逐渐打开。'], ['1.10', '头部作为一整片折面翻起，随后显出五官。'], ['1.75', '角色轻落，终帧回到完整原图像素。']],
      boundary: '终帧直接绘制原 PNG；中间的压合、翻折和表面延展是二维半推断，尚未由原始 3D 网格验证。'
    },
    jump: {
      label: '轻跳', duration: 1300, kind: '原图像素',
      description: '轻跳：压低、短暂腾空、落地回稳。',
      steps: [['0.00', '轻微压低重心。'], ['0.25', '向上短跳，折面与五官保持原图。'], ['0.80', '落地后轻压，恢复静止。']],
      boundary: '整张原图角色像素同步移动；跳跃的高度与压缩量用于评审动作幅度。'
    },
    clap: {
      label: '折翼内收', duration: 1700, kind: '正面视角 · 推断',
      description: '折翼内收：正面原图的两片短翼向胸前靠拢两次。',
      steps: [['0.00', '切换到概念板中的原始正面姿态。'], ['0.65', '两片短翼第一次向胸前靠拢。'], ['1.10', '第二次小幅内收。'], ['1.25', '折翼缓慢复位，回到原图正面像素。']],
      boundary: '这是拍手方向的动作预研。翼根背后和身体补面属于二维半推断；当前不能称为已验证的真实拍手。'
    },
    sway: {
      label: '轻摇', duration: 1800, kind: '原图像素',
      description: '轻摇：以底部为轴，轻向两侧摇晃后回正。',
      steps: [['0.00', '从完整静止姿态起步。'], ['0.40', '向一侧微倾，再经过中心向另一侧微倾。'], ['1.45', '缓慢回到原位。']],
      boundary: '整张原图角色像素转动；不推断新的表面、折线或五官。'
    }
  };

  const IW = 710, IH = 830, FW = 330, FH = 385;
  const ease = (x) => x * x * (3 - 2 * x);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => ease(clamp((x - a) / (b - a)));
  const lerp = (a, b, x) => a + (b - a) * x;

  let active = 'form';
  let elapsed = 0;
  let playing = false;
  let previousFrame = 0;
  let raf = 0;
  let frontLayers = null;
  let playbackDirection = 1;
  let imageFailed = false;
  let frontFailed = false;
  let headShellReady = false;
  let width = 0;
  let height = 0;

  function frontWingPath(side) {
    const p = new Path2D();
    if (side === 'left') {
      p.moveTo(87, 172);
      p.bezierCurveTo(60, 183, 34, 221, 22, 250);
      p.bezierCurveTo(11, 279, 17, 304, 30, 312);
      p.bezierCurveTo(51, 324, 73, 271, 82, 231);
      p.bezierCurveTo(88, 205, 88, 184, 87, 172);
    } else {
      p.moveTo(260, 169);
      p.bezierCurveTo(281, 182, 308, 222, 317, 260);
      p.bezierCurveTo(325, 293, 318, 308, 303, 313);
      p.bezierCurveTo(281, 320, 264, 274, 259, 231);
      p.bezierCurveTo(256, 204, 257, 181, 260, 169);
    }
    p.closePath();
    return p;
  }

  function offscreen(w = FW, h = FH) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function makeFrontLayers() {
    const leftPath = frontWingPath('left');
    const rightPath = frontWingPath('right');
    const leftClear = new Path2D();
    leftClear.moveTo(99, 163);
    leftClear.bezierCurveTo(89, 207, 78, 255, 72, 290);
    leftClear.bezierCurveTo(65, 328, 61, 358, 57, FH + 5);
    leftClear.lineTo(-10, FH + 5);
    leftClear.lineTo(-10, 158);
    leftClear.closePath();
    const rightClear = new Path2D();
    rightClear.moveTo(249, 160);
    rightClear.bezierCurveTo(257, 209, 268, 256, 276, 294);
    rightClear.bezierCurveTo(281, 329, 285, 358, 289, FH + 5);
    rightClear.lineTo(FW + 10, FH + 5);
    rightClear.lineTo(FW + 10, 158);
    rightClear.closePath();
    const base = offscreen();
    const b = base.getContext('2d');
    b.drawImage(frontSource, 0, 0);
    b.globalCompositeOperation = 'destination-out';
    b.fill(leftClear);
    b.fill(rightClear);
    b.globalCompositeOperation = 'source-over';

    const cut = (path) => {
      const c = offscreen();
      const x = c.getContext('2d');
      x.drawImage(frontSource, 0, 0);
      x.globalCompositeOperation = 'destination-in';
      x.fillStyle = '#fff';
      x.fill(path);
      return c;
    };
    const joint = (px, py) => {
      const c = offscreen();
      const x = c.getContext('2d');
      x.drawImage(frontSource, 0, 0);
      x.globalCompositeOperation = 'destination-in';
      const fade = x.createRadialGradient(px, py, 9, px, py, 33);
      fade.addColorStop(0, 'rgba(255,255,255,1)');
      fade.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = fade;
      x.fillRect(0, 0, FW, FH);
      return c;
    };
    frontLayers = { base, left: cut(leftPath), right: cut(rightPath),
      leftJoint: joint(87, 176), rightJoint: joint(260, 173) };

  }

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

  function frontLayout() {
    const scale = Math.min((width - 56) / FW, (height - 39 - 58) / (FH * 1.105), 1.22);
    return { scale, ground: height - 39, x: width / 2, actorW: FW * scale, actorH: FH * scale };
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

  function drawOriginal(l, { x = 0, y = 0, angle = 0, sx = 1, sy = 1, alpha = 1 } = {}) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(l.x + x, l.ground + y);
    ctx.rotate(angle);
    ctx.scale(sx, sy);
    ctx.drawImage(source, -l.actorW / 2, -l.actorH, l.actorW, l.actorH);
    ctx.restore();
  }

  function drawForm(l, p) {
    // Lower folds open first. The head is a single hinged panel that turns
    // toward the viewer once the torso has almost reached its final shape.
    const open = smooth(0.08, 0.61, p);
    const band = 0.065 + 0.935 * open;
    const head = smooth(0.42, 0.75, p);
    const slide = -58 * (1 - smooth(0, 0.25, p));
    const settle = p > 0.78 ? -6 * Math.sin((p - 0.78) / 0.22 * Math.PI) : 0;
    if (p >= 0.77) {
      drawOriginal(l, { y: settle });
      return;
    }
    ctx.save();
    ctx.translate(l.x - l.actorW / 2 + slide * l.scale, l.ground - l.actorH + settle);
    ctx.scale(l.scale, l.scale);
    const center = 455;
    const bodyTop = center + (300 - center) * band;
    ctx.drawImage(source, 0, 300, IW, IH - 300,
      0, bodyTop, IW, (IH - 300) * band);
    if (head > 0) {
      const foldedSurface = headShellReady ? headShellSource : source;
      ctx.drawImage(foldedSurface, 0, 0, IW, 300,
        0, bodyTop - 300 * head, IW, 300 * head);
      if (headShellReady) {
        const face = smooth(0.60, 0.95, head);
        if (face > 0) {
          ctx.globalAlpha = face;
          ctx.drawImage(source, 0, 0, IW, 300,
            0, bodyTop - 300 * head, IW, 300 * head);
        }
      }
    }
    ctx.restore();
  }

  function drawFrontOriginal(l, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(frontSource, l.x - l.actorW / 2, l.ground - l.actorH, l.actorW, l.actorH);
    ctx.restore();
  }

  function drawFrontUnderBody() {
    const fill = ctx.createRadialGradient(155, 255, 24, 165, 276, 185);
    fill.addColorStop(0, '#fffaf3');
    fill.addColorStop(0.52, '#f3ebdf');
    fill.addColorStop(1, '#ddcebf');
    ctx.beginPath();
    ctx.moveTo(86, 166);
    ctx.bezierCurveTo(127, 148, 226, 148, 263, 172);
    ctx.bezierCurveTo(287, 209, 291, 307, 272, 350);
    ctx.bezierCurveTo(249, 383, 94, 388, 62, 348);
    ctx.bezierCurveTo(42, 307, 56, 203, 86, 166);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawWing(layer, pivotX, pivotY, angle, foreshorten = 1) {
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);
    ctx.scale(foreshorten, foreshorten);
    ctx.drawImage(layer, -pivotX, -pivotY);
    ctx.restore();
  }

  function drawClap(l, p) {
    const peak = (at, width) => Math.exp(-Math.pow((p - at) / width, 2));
    const fold = clamp(peak(0.38, 0.11) + 0.88 * peak(0.65, 0.11));
    const motion = smooth(0.06, 0.75, fold);
    if (!frontLayers) {
      ctx.fillStyle = '#692a3a';
      ctx.font = '14px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(frontFailed ? '正面原图素材载入失败' : '正在载入正面原图…', width / 2, height / 2);
      return;
    }
    if (motion < 0.01) {
      drawFrontOriginal(l);
      return;
    }
    const fullAlpha = 1 - motion;
    if (fullAlpha > 0.01) drawFrontOriginal(l, fullAlpha);
    ctx.save();
    ctx.globalAlpha = motion;
    ctx.translate(l.x - l.actorW / 2, l.ground - l.actorH - fold * 2 * l.scale);
    ctx.scale(l.scale, l.scale);
    drawFrontUnderBody();
    ctx.drawImage(frontLayers.base, 0, 0);
    const perspective = 1 - 0.2 * fold;
    drawWing(frontLayers.left, 87, 172, -1.45 * fold, perspective);
    drawWing(frontLayers.right, 260, 169, 1.30 * fold, perspective);
    ctx.drawImage(frontLayers.leftJoint, 0, 0);
    ctx.drawImage(frontLayers.rightJoint, 0, 0);
    ctx.restore();
  }

  function drawMotion(l, clip, p) {
    if (clip === 'form') {
      drawShadow(l, 0, lerp(0.72, 1.03, smooth(0.05, 0.75, p)));
      drawForm(l, p);
      return;
    }
    if (clip === 'jump') {
      const anticipation = Math.sin(smooth(0, 0.2, p) * Math.PI) * (1 - smooth(0.12, 0.22, p));
      const lift = p < 0.22 ? 0 : p < 0.72 ? Math.sin((p - 0.22) / 0.5 * Math.PI) : 0;
      const landing = Math.sin(smooth(0.72, 0.96, p) * Math.PI) * (1 - smooth(0.86, 1, p));
      const heightPx = lift * l.actorH * 0.105;
      drawShadow(l, heightPx, 1 + lift * 0.17);
      drawOriginal(l, { y: -heightPx, sx: 1 + anticipation * 0.018 + landing * 0.026 - lift * 0.01, sy: 1 - anticipation * 0.025 - landing * 0.035 + lift * 0.01 });
      return;
    }
    if (clip === 'sway') {
      const envelope = Math.sin(Math.PI * p);
      const angle = Math.sin(2 * Math.PI * p) * envelope * (3.4 * Math.PI / 180);
      drawShadow(l, 0, 1 + Math.abs(angle) * 0.3);
      drawOriginal(l, { angle, x: Math.sin(2 * Math.PI * p) * envelope * l.actorW * 0.008 });
      return;
    }
    const f = frontLayout();
    drawShadow(f);
    drawClap(f, p);
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
    const p = clamp(elapsed / clip.duration);
    drawMotion(layout(), active, p);
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
    if (previousFrame) elapsed += (now - previousFrame) * (slow.checked ? 0.5 : 1) * playbackDirection;
    previousFrame = now;
    const duration = clips[active].duration;
    if (loop.checked && active === 'form') {
      if (elapsed >= duration) { elapsed = duration - (elapsed - duration); playbackDirection = -1; }
      if (elapsed <= 0) { elapsed = -elapsed; playbackDirection = 1; }
    } else if (elapsed >= duration) {
      if (loop.checked) elapsed %= duration;
      else { elapsed = duration; stop(); render(); return; }
    }
    syncUI();
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduce.checked) { elapsed = clips[active].duration; render(); syncUI(); return; }
    if (elapsed >= clips[active].duration) {
      if (active === 'form' && loop.checked) playbackDirection = -1;
      else { elapsed = 0; playbackDirection = 1; }
    }
    if (playing) return;
    playing = true;
    previousFrame = 0;
    syncUI();
    raf = requestAnimationFrame(frame);
  }

  function selectClip(key, autoplay = false) {
    stop();
    active = key;
    playbackDirection = 1;
    elapsed = reduce.checked ? clips[key].duration : 0;
    const clip = clips[key];
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.clip === key)));
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

  buttons.forEach((button) => button.addEventListener('click', () => selectClip(button.dataset.clip, true)));
  play.addEventListener('click', start);
  pause.addEventListener('click', stop);
  loop.addEventListener('change', () => { if (!loop.checked) playbackDirection = 1; });
  seek.addEventListener('input', () => {
    const target = Number(seek.value);
    stop();
    playbackDirection = 1;
    elapsed = clips[active].duration * target / 1000;
    syncUI();
    render();
  });
  reduce.addEventListener('change', () => {
    stop();
    playbackDirection = 1;
    elapsed = reduce.checked ? clips[active].duration : 0;
    syncUI();
    render();
  });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
    if (event.matches) { reduce.checked = true; stop(); elapsed = clips[active].duration; syncUI(); render(); }
  });
  window.addEventListener('resize', resize);
  source.onload = () => {
    resize();
    selectClip('form', !reduce.checked);
  };
  frontSource.onload = () => {
    makeFrontLayers();
    if (active === 'clap') render();
  };
  headShellSource.onload = () => {
    headShellReady = true;
    if (active === 'form') render();
  };
  headShellSource.onerror = () => {
    if (active === 'form') status.textContent = '头部折面素材载入失败，改用原图完成成形预览。';
  };
  frontSource.onerror = () => {
    frontFailed = true;
    if (active === 'clap') {
      status.textContent = '正面原图素材载入失败，请确认 assets/folded-front-original-pixels.png 存在。';
      render();
    }
  };
  source.onerror = () => {
    imageFailed = true;
    status.textContent = '原图角色素材载入失败，请确认 assets/folded-hero-original-pixels.png 存在。';
    resize();
  };
  reduce.checked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  selectClip('form');
  resize();
  source.src = 'assets/folded-hero-original-pixels.png';
  frontSource.src = 'assets/folded-front-original-pixels.png';
  headShellSource.src = 'assets/folded-head-shell.png';
})();
