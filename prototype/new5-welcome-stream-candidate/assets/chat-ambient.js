/* Decorative only: no theme, conversation, mascot or persistence writes. */
(() => {
  const app = document.querySelector('#app');
  const host = app?.querySelector('.conversation');
  if (!host) return;
  const layer = document.createElement('div');
  layer.className = 'chat-ambient-background';
  layer.setAttribute('aria-hidden', 'true');
  host.prepend(layer);
  host.classList.add('chat-ambient-host');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let pageHidden = false;
  function sync() {
    const active = app.dataset.route === 'home';
    const obscured = !!document.querySelector('dialog[open]') || app.classList.contains('is-voice-active');
    layer.hidden = !active;
    layer.dataset.paused = String(document.hidden || pageHidden || !active || obscured);
    layer.dataset.static = String(preference.matches || document.body.classList.contains('reduced') || document.body.classList.contains('reduced-motion'));
  }
  // Only lifecycle attributes: do not observe mascot animation style writes.
  const observer = new MutationObserver(sync);
  observer.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['class','open','data-route']});
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', sync);
  window.addEventListener('pagehide', () => { pageHidden = true; sync(); });
  window.addEventListener('pageshow', () => { pageHidden = false; sync(); });
  sync();
})();
