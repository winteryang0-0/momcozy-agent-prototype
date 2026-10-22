(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const hero = $("hero"), shadow = $("stage-shadow"), playButton = $("play"), pauseButton = $("pause"), seek = $("seek"), timeLabel = $("time"), loop = $("loop"), reduced = $("reduced"), status = $("status"), meta = $("motion-meta");
  const buttons = [...document.querySelectorAll("[data-motion]")];
  const duration = { jump: 1300, sway: 1800, still: 0 };
  const labels = { jump: "轻跳", sway: "轻摇", still: "原图静止" };
  const systemReduced = matchMedia("(prefers-reduced-motion: reduce)");
  let motion = "jump", elapsed = 0, playing = false, resumable = false, last = null, frameId = 0;
  const ease = t => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };
  function valueAt(keys, t) {
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        return a[1] + (b[1] - a[1]) * ease((t - a[0]) / (b[0] - a[0]));
      }
    }
    return keys[keys.length - 1][1];
  }
  function isReduced() { return systemReduced.matches || reduced.checked; }
  function render() {
    const fraction = duration[motion] ? elapsed / duration[motion] : 0;
    let y = 0, angle = 0;
    if (motion === "jump") y = valueAt([[0,0],[.18,2],[.45,-14],[.62,-11],[.83,0],[1,0]], fraction);
    if (motion === "sway") angle = valueAt([[0,0],[.25,-2.4],[.57,2.2],[.82,-.6],[1,0]], fraction);
    hero.style.transform = `translateY(${y.toFixed(2)}px) rotate(${angle.toFixed(2)}deg)`;
    shadow.style.transform = `scaleX(${(1 + y / 85).toFixed(3)})`;
    shadow.style.opacity = (1 + y / 45).toFixed(3);
    seek.value = Math.round(fraction * 1000);
    timeLabel.textContent = `${(elapsed / 1000).toFixed(2)} / ${(duration[motion] / 1000).toFixed(2)} 秒`;
  }
  function updateControls() {
    const disabled = isReduced() || motion === "still";
    playButton.disabled = disabled;
    pauseButton.disabled = disabled || !playing;
    seek.disabled = disabled;
    loop.disabled = disabled;
    playButton.textContent = playing ? "从头重播" : resumable ? "继续播放" : "从头播放";
    meta.textContent = `${labels[motion]} / ${(duration[motion] / 1000).toFixed(1)} 秒`;
  }
  function stop(message) {
    if (playing && elapsed > 0 && elapsed < duration[motion]) resumable = true;
    playing = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    last = null;
    updateControls();
    if (message) status.textContent = message;
  }
  function step(stamp) {
    if (!playing) return;
    if (last !== null) elapsed += Math.min(80, stamp - last);
    last = stamp;
    if (elapsed >= duration[motion]) {
      if (loop.checked && !isReduced()) elapsed %= duration[motion];
      else { elapsed = duration[motion]; resumable = false; render(); stop(`${labels[motion]}已结束，角色回到原图中性姿态。`); return; }
    }
    render();
    frameId = requestAnimationFrame(step);
  }
  function play() {
    if (isReduced() || motion === "still") return;
    if (playing) { cancelAnimationFrame(frameId); elapsed = 0; frameId = 0; }
    else if (!resumable) elapsed = 0;
    resumable = false;
    playing = true;
    last = null;
    updateControls();
    status.textContent = `正在播放${labels[motion]}：角色图像取自原始 PNG。`;
    frameId = requestAnimationFrame(step);
  }
  function choose(next) {
    if (!(next in duration)) return;
    stop();
    motion = next;
    elapsed = 0;
    resumable = false;
    buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.motion === next)));
    render();
    updateControls();
    status.textContent = next === "still" ? "正在显示原图中性姿态。" : `${labels[next]}：整体变换原图角色，不重绘模型与材质。`;
  }
  function applyReduced() {
    stop(); elapsed = 0; resumable = false; render(); updateControls();
    status.textContent = isReduced() ? "减少动态已开启：显示原图静态姿态。" : "减少动态已关闭：可手动播放。";
  }
  buttons.forEach(button => button.addEventListener("click", () => choose(button.dataset.motion)));
  playButton.addEventListener("click", play);
  pauseButton.addEventListener("click", () => stop("动画已暂停。"));
  seek.addEventListener("input", () => { stop(); elapsed = duration[motion] * Number(seek.value) / 1000; resumable = elapsed > 0 && elapsed < duration[motion]; render(); updateControls(); status.textContent = `${labels[motion]}：${timeLabel.textContent}。`; });
  reduced.addEventListener("change", applyReduced);
  systemReduced.addEventListener("change", () => { reduced.checked = systemReduced.matches; reduced.disabled = systemReduced.matches; applyReduced(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) stop("页面隐藏，动画已暂停。需手动继续。"); });
  window.addEventListener("blur", () => { if (playing) stop("窗口失焦，动画已暂停。需手动继续。"); });
  reduced.checked = systemReduced.matches;
  reduced.disabled = systemReduced.matches;
  render(); updateControls();
})();
