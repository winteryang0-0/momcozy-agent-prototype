(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const motionButtons = [...document.querySelectorAll("[data-motion]")];
  const elements = {
    svg: $("character-svg"), actor: $("actor"), actorMotion: $("actor-motion"), leftArm: $("left-arm"), rightArm: $("right-arm"), foldInterior: $("fold-interior"),
    morph: $("morph-layer"), morphOuter: $("morph-outer"), morphInner: $("morph-inner"), shadow: $("ground-shadow"),
    play: $("play-button"), pause: $("pause-button"), scrubber: $("scrubber"), time: $("time-label"),
    loop: $("loop-toggle"), reduce: $("reduce-toggle"), sceneNote: $("scene-note"), status: $("live-status")
  };

  const motions = {
    form: { label: "丝带成形", duration: 3600, defaultTime: 2088 },
    jump: { label: "轻跳", duration: 1300, defaultTime: 0 },
    clap: { label: "轻拍手", duration: 1600, defaultTime: 0 },
    sway: { label: "轻摇", duration: 1800, defaultTime: 0 }
  };

  const outlines = {
    outer: {
      flat: "M 55 261 C 90 244 120 246 164 259 C 200 271 225 270 258 254 C 295 236 330 239 370 260 C 405 278 440 278 468 264 C 457 276 450 289 422 288 C 386 289 356 270 318 273 C 275 279 245 300 203 285 C 160 273 130 263 96 278 C 76 286 58 277 55 261 Z",
      curl: "M 112 313 C 135 262 163 201 209 159 C 250 122 285 135 310 167 C 337 203 304 233 303 259 C 305 284 354 300 424 288 C 467 280 472 309 433 329 C 392 344 355 306 319 283 C 277 254 229 267 195 318 C 164 356 121 349 112 313 Z",
      formed: "M 102 342 C 98 310 109 282 141 253 C 161 235 191 226 193 195 C 164 160 178 117 215 91 C 252 65 318 70 355 110 C 388 145 391 216 354 246 C 399 295 455 300 469 311 C 478 337 438 369 393 357 C 367 351 378 408 331 415 C 265 421 198 416 164 386 C 137 367 107 389 102 342 Z"
    },
    inner: {
      flat: "M 57 274 C 101 256 135 255 172 268 C 201 279 227 279 259 263 C 299 242 335 248 369 268 C 405 289 440 286 469 269 C 453 291 419 306 383 296 C 348 286 332 276 298 284 C 269 292 235 306 201 297 C 157 285 128 275 95 291 C 76 299 62 293 57 274 Z",
      curl: "M 121 310 C 139 277 181 209 218 175 C 243 152 267 151 282 181 C 295 211 276 232 295 263 C 320 304 366 322 418 312 C 453 303 457 311 443 331 C 426 348 395 342 364 328 C 330 313 302 274 276 267 C 236 256 216 284 191 322 C 161 357 128 347 121 310 Z",
      formed: "M 182 137 C 190 106 213 92 231 95 C 259 101 269 151 287 179 C 312 220 332 240 365 278 C 394 310 430 327 455 310 C 470 299 475 323 459 343 C 442 366 412 371 382 356 C 341 336 319 307 285 276 C 250 243 212 222 188 199 C 176 187 173 159 182 137 Z"
    }
  };

  function samplePath(pathData, count) {
    const temp = document.createElementNS("http://www.w3.org/2000/svg", "path");
    temp.setAttribute("d", pathData);
    elements.svg.appendChild(temp);
    const length = temp.getTotalLength();
    const result = Array.from({ length: count }, (_, i) => {
      const point = temp.getPointAtLength(length * i / count);
      return [point.x, point.y];
    });
    temp.remove();
    return result;
  }

  const samples = Object.fromEntries(Object.entries(outlines).map(([layer, stages]) => [
    layer,
    Object.fromEntries(Object.entries(stages).map(([stage, path]) => [stage, samplePath(path, 112)]))
  ]));
  const originalFold = elements.foldInterior.getAttribute("d");
  const clapFold = "M 182 137 C 190 106 213 92 231 95 C 259 101 269 151 287 179 C 312 220 332 240 353 275 C 367 298 381 319 367 335 C 349 354 325 335 304 306 C 274 267 240 231 188 199 C 176 187 173 159 182 137 Z";
  const foldSamples = { neutral: samplePath(originalFold, 112), clap: samplePath(clapFold, 112) };

  let currentMotion = "form";
  let currentTime = motions.form.defaultTime;
  let playing = false;
  let resumable = false;
  let requestId = 0;
  let lastTimestamp = null;
  const systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function smooth(value) { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function interpolateKeys(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const previous = keys[i - 1];
        const next = keys[i];
        const portion = smooth((t - previous[0]) / (next[0] - previous[0]));
        return previous.slice(1).map((value, index) => mix(value, next[index + 1], portion));
      }
    }
    return keys[keys.length - 1].slice(1);
  }

  function pointPath(from, to, t) {
    const count = from.length;
    let d = "M";
    for (let i = 0; i < count; i++) {
      const x = mix(from[i][0], to[i][0], t).toFixed(1);
      const y = mix(from[i][1], to[i][1], t).toFixed(1);
      d += (i ? " L" : "") + x + " " + y;
    }
    return d + " Z";
  }

  function setMorph(progress) {
    const phase = progress < .34 ? ["flat", "curl", smooth(progress / .34)] : ["curl", "formed", smooth((progress - .34) / .66)];
    for (const [layer, target] of [["outer", elements.morphOuter], ["inner", elements.morphInner]]) {
      target.setAttribute("d", pointPath(samples[layer][phase[0]], samples[layer][phase[1]], phase[2]));
    }
  }

  function showActor() {
    elements.actorMotion.setAttribute("transform", "");
    elements.leftArm.setAttribute("transform", "");
    elements.rightArm.setAttribute("transform", "");
    elements.foldInterior.setAttribute("d", originalFold);
    elements.actor.style.opacity = "1";
    elements.morph.style.opacity = "0";
    elements.morph.setAttribute("transform", "");
    elements.shadow.setAttribute("rx", "96");
    elements.shadow.setAttribute("opacity", ".18");
  }

  function renderForm(t) {
    let progress;
    if (t < .56) progress = smooth(t / .56);
    else if (t <= .72) progress = 1;
    else progress = smooth((1 - t) / .28);
    setMorph(progress);
    elements.morph.setAttribute("transform", `translate(${mix(-16, 0, progress).toFixed(2)} 0)`);
    const actorVisibility = smooth((progress - .74) / .26);
    elements.actor.style.opacity = actorVisibility.toFixed(3);
    elements.morph.style.opacity = (1 - actorVisibility).toFixed(3);
    elements.actorMotion.setAttribute("transform", "");
    elements.leftArm.setAttribute("transform", "");
    elements.rightArm.setAttribute("transform", "");
    elements.foldInterior.setAttribute("d", originalFold);
    elements.shadow.setAttribute("rx", mix(76, 96, progress).toFixed(1));
    elements.shadow.setAttribute("opacity", mix(.09, .18, progress).toFixed(2));
    elements.sceneNote.textContent = t === 0 || t >= .99 ? "平面丝带 / 首尾一致" : t < .39 ? "丝带滑入与卷折" : t < .56 ? "形成角色轮廓" : t <= .72 ? "角色完整成形" : "沿原路径回收";
  }

  function renderAction(type, t) {
    showActor();
    let positionY = 0;
    let scaleY = 1;
    let angle = 0;
    let leftAngle = 0;
    let rightAngle = 0;
    if (type === "jump") {
      [positionY, scaleY] = interpolateKeys([[0, 0, 1], [.18, 3, .975], [.44, -14, 1.012], [.61, -11, 1], [.8, 0, .983], [1, 0, 1]], t);
      elements.shadow.setAttribute("rx", mix(96, 84, Math.max(0, -positionY / 14)).toFixed(1));
      elements.shadow.setAttribute("opacity", mix(.18, .12, Math.max(0, -positionY / 14)).toFixed(2));
      elements.actorMotion.setAttribute("transform", `translate(0 ${positionY.toFixed(2)}) translate(265 405) scale(1 ${scaleY.toFixed(3)}) translate(-265 -405)`);
      elements.sceneNote.textContent = "预压 · 离地约 14 px · 落稳";
    } else if (type === "clap") {
      [leftAngle, rightAngle] = interpolateKeys([[0, 0, 0], [.23, -65, 60], [.34, -65, 60], [.49, -8, 9], [.67, -65, 60], [.77, -65, 60], [1, 0, 0]], t);
      const amount = clamp(Math.abs(leftAngle) / 65, 0, 1);
      elements.leftArm.setAttribute("transform", `translate(211 239) rotate(${leftAngle.toFixed(2)}) scale(${mix(1, .8, amount).toFixed(3)}) translate(-211 -239)`);
      elements.rightArm.setAttribute("transform", `translate(289 239) rotate(${rightAngle.toFixed(2)}) scale(${mix(1, .55, amount).toFixed(3)}) translate(-289 -239)`);
      elements.foldInterior.setAttribute("d", amount === 0 ? originalFold : pointPath(foldSamples.neutral, foldSamples.clap, smooth(amount)));
      elements.actorMotion.setAttribute("transform", "");
      elements.sceneNote.textContent = "两侧短折翼轻合两次";
    } else if (type === "sway") {
      [angle, positionY] = interpolateKeys([[0, 0, 0], [.26, -4, 0], [.57, 3.5, 0], [.82, -1.4, 0], [1, 0, 0]], t);
      elements.actorMotion.setAttribute("transform", `rotate(${angle.toFixed(2)} 265 405)`);
      elements.sceneNote.textContent = "重心左右轻移 · 最大约 4°";
    }
  }

  function render() {
    const motion = motions[currentMotion];
    const fraction = clamp(currentTime / motion.duration, 0, 1);
    if (currentMotion === "form") renderForm(fraction);
    else renderAction(currentMotion, fraction);
    elements.scrubber.value = Math.round(fraction * 1000);
    elements.time.textContent = `${(currentTime / 1000).toFixed(2)} / ${(motion.duration / 1000).toFixed(2)} 秒`;
  }

  function reduced() { return systemReduce.matches || elements.reduce.checked; }
  function updateControls() {
    elements.play.disabled = reduced();
    elements.pause.disabled = !playing || reduced();
    elements.scrubber.disabled = reduced();
    elements.loop.disabled = reduced();
    elements.play.textContent = playing ? "从头重播" : resumable ? "继续播放" : "从头播放";
  }
  function announce(message) { elements.status.textContent = message; }
  function pause(message) {
    if (playing && currentTime > 0 && currentTime < motions[currentMotion].duration) resumable = true;
    playing = false;
    if (requestId) cancelAnimationFrame(requestId);
    requestId = 0;
    lastTimestamp = null;
    updateControls();
    if (message) announce(message);
  }
  function frame(timestamp) {
    if (!playing) return;
    if (lastTimestamp !== null) currentTime += Math.min(80, timestamp - lastTimestamp);
    lastTimestamp = timestamp;
    const duration = motions[currentMotion].duration;
    if (currentTime >= duration) {
      if (elements.loop.checked && !reduced()) {
        currentTime %= duration;
        announce(`正在循环播放：${motions[currentMotion].label}。`);
      } else {
        currentTime = duration;
        resumable = false;
        render();
        pause(`${motions[currentMotion].label}播放完成，已停在首尾衔接帧。`);
        return;
      }
    }
    render();
    requestId = requestAnimationFrame(frame);
  }
  function play() {
    if (reduced()) return;
    if (playing) {
      cancelAnimationFrame(requestId);
      requestId = 0;
      currentTime = 0;
    } else if (!resumable) currentTime = 0;
    resumable = false;
    playing = true;
    lastTimestamp = null;
    updateControls();
    announce(`正在播放：${motions[currentMotion].label}。`);
    requestId = requestAnimationFrame(frame);
  }
  function selectMotion(type) {
    if (!(type in motions)) return;
    pause();
    currentMotion = type;
    resumable = false;
    currentTime = reduced() ? (type === "form" ? 2220 : 0) : motions[type].defaultTime;
    motionButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.motion === type)));
    render();
    updateControls();
    announce(`当前：${motions[type].label}；${type === "form" ? "停在完整角色帧" : "停在中性姿态"}。`);
  }
  function updateReduced() {
    pause();
    if (reduced()) {
      currentTime = currentMotion === "form" ? 2220 : 0;
      resumable = false;
      render();
      announce(`减少动态已开启：${motions[currentMotion].label}以静态关键帧展示。`);
    } else {
      announce(`减少动态已关闭：可播放 ${motions[currentMotion].label}。`);
    }
    updateControls();
  }

  motionButtons.forEach((button) => button.addEventListener("click", () => selectMotion(button.dataset.motion)));
  elements.play.addEventListener("click", play);
  elements.pause.addEventListener("click", () => pause(`已暂停：${motions[currentMotion].label}。`));
  elements.scrubber.addEventListener("input", () => {
    pause();
    currentTime = motions[currentMotion].duration * Number(elements.scrubber.value) / 1000;
    resumable = currentTime > 0 && currentTime < motions[currentMotion].duration;
    render();
    updateControls();
    announce(`逐帧查看：${motions[currentMotion].label}，${elements.time.textContent}。`);
  });
  elements.reduce.addEventListener("change", updateReduced);
  systemReduce.addEventListener("change", () => {
    elements.reduce.checked = systemReduce.matches;
    elements.reduce.disabled = systemReduce.matches;
    updateReduced();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) pause("页面已隐藏，动画已暂停。需要手动继续播放。"); });
  window.addEventListener("blur", () => { if (playing) pause("窗口失焦，动画已暂停。需要手动继续播放。"); });

  elements.reduce.checked = systemReduce.matches;
  elements.reduce.disabled = systemReduce.matches;
  render();
  updateControls();
  window.__motionQA = Object.freeze({
    getState: () => ({ motion: currentMotion, time: currentTime, duration: motions[currentMotion].duration, playing, reduced: reduced() }),
    select: selectMotion,
    seek: (fraction) => { pause(); currentTime = motions[currentMotion].duration * clamp(fraction, 0, 1); resumable = currentTime > 0 && currentTime < motions[currentMotion].duration; render(); updateControls(); }
  });
})();
