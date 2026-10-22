/* CS-0.6: one semantic model, four icon and glass material treatments. */
const variants = {
  bloom: {
    number: '01', name: 'Bloom Glass', tagline: 'A softer way to care.',
    premise: 'Soft skeuomorphic icons · Warm frosted glass',
    material: 'Gently raised object icons and diffused glass give everyday care a warm, tactile feel.',
    insight: 'Do the soft details help people recognize tasks without making the screen feel heavy?',
    iconStyle: 'soft-relief', glassStyle: 'warm-frost',
    iconDescription: 'Bottle and diaper icons use soft fill, highlights, and shadow to suggest familiar objects. Labels support quick recognition.',
    glassDescription: 'Warm, highly blurred glass softens navigation and small controls. Records and AI text stay on solid surfaces.'
  },
  orbit: {
    number: '02', name: 'Daily Orbit', tagline: 'Care at a glance.',
    premise: 'Flat geometric icons · Satin frosted glass',
    material: 'Solid symbols and a quiet matte finish make the order of events easy to scan.',
    insight: 'Can people identify the flat symbols quickly and follow the timeline without effort?',
    iconStyle: 'solid-flat', glassStyle: 'satin-frost',
    iconDescription: 'Simple, filled shapes use negative space for key details, so each task stays legible at small sizes.',
    glassDescription: 'A softly frosted surface has clear edges and very little shine, keeping dates and navigation easy to scan.'
  },
  garden: {
    number: '03', name: 'After Rain', tagline: 'A little more light.',
    premise: 'Translucent 3D icons · Luminous liquid glass',
    material: 'Waterlike icons, bright edges, and reflected color bring more movement and energy to care tasks.',
    insight: 'Does the liquid treatment feel lively while keeping labels and controls clear?',
    iconStyle: 'liquid-volume', glassStyle: 'luminous-liquid',
    iconDescription: 'Translucent fill and inner highlights give objects a waterlike depth while preserving the bottle, diaper, and crying cues.',
    glassDescription: 'Sharper transparency, bright edges, and reflected color make floating controls feel liquid. Highlights stay clear of body text.'
  },
  berry: {
    number: '04', name: 'Berry Poise', tagline: 'Color, with restraint.',
    premise: 'Minimal outline icons · Subtle clear glass',
    material: 'A deeper berry tone sets the focus while fine outlines and restrained reflections keep the interface calm.',
    insight: 'Can the quieter details retain warmth and make each task easy to recognize?',
    iconStyle: 'hairline-flat', glassStyle: 'quiet-liquid',
    iconDescription: 'Clean outlines and a few precise details keep each object recognizable without adding visual weight.',
    glassDescription: 'Thin, clear surfaces and a narrow highlight keep the berry theme in focus without overpowering the content.'
  }
};
const variant = document.body.dataset.variant || 'bloom';
const meta = variants[variant];
const paths = { bloom: 'bloom.html', orbit: 'orbit.html', garden: 'garden.html', berry: 'berry.html' };
const axisLabels = {
  bloom: { icon: 'Soft skeuomorphic', glass: 'Warm frosted glass' },
  orbit: { icon: 'Flat geometric', glass: 'Satin frosted glass' },
  garden: { icon: 'Translucent 3D', glass: 'Luminous liquid glass' },
  berry: { icon: 'Minimal outline', glass: 'Subtle clear glass' }
};
const symbols = {
  home: '<path d="M3.5 10.3 12 3.7l8.5 6.6v9.5H3.5z"/><path d="M9.4 19.8v-6.7h5.2v6.7"/>',
  record: '<rect x="5.3" y="3" width="13.4" height="18" rx="2.6"/><path d="M9 7.8h6m-6 4.5h6m-6 4.4h4"/>',
  ai: '<path d="M4 6.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5.7L7 21v-3.5a3 3 0 0 1-3-3z"/><path d="M9 10h6m-6 4h3"/>',
  bottle: '<path d="M10 3h4l1.4 3.4v1.5H8.6V6.4zM8.3 8h7.4l1.2 3v8.1a2 2 0 0 1-2 2H9.1a2 2 0 0 1-2-2V11z"/><path d="M9 13h3m-3 3.2h3"/>',
  diaper: '<path d="M4 5h16l1 4c-2 1.4-2.8 3.4-3.2 5.2-.7 3.1-2.7 5.5-5.8 6.7-3.1-1.2-5.1-3.6-5.8-6.7C5.8 12.4 5 10.4 3 9z"/><path d="M4.2 9h15.6M7 13.3l5 3.1 5-3.1"/>',
  sound: '<path d="M3 9.5v5m4-9v13m5-16v19m5-16v13m4-9v5"/>',
  sleep: '<path d="M20.3 14.7A8.8 8.8 0 0 1 9.3 3.7a8.8 8.8 0 1 0 11 11z"/><path d="M3.5 19.5h5"/>',
  pump: '<path d="M4 6h6v5H4zM5.2 11v9h7v-6l-2.2-3M10 8h5l3 3v7m-2 0h5v3h-5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.3"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h2m3 0h2"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="14" r="3.8"/>',
  check: '<path d="m4.5 12.3 4.7 4.6L19.5 6.7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/>',
  cloud: '<path d="M6.2 18.5a5 5 0 0 1-.4-10A7 7 0 0 1 19 8a5.3 5.3 0 0 1-1 10.5z"/><path d="M12 10.5v9m-3-3 3 3 3-3"/>',
  alert: '<path d="m12 3 9.8 18H2.2z"/><path d="M12 9v5m0 3h.01"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 5.1 2.2c-1.4 1-2.2 1.4-2.2 3.2m0 3h.01"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  settings: '<path d="M4 7h16m-16 10h16"/><circle cx="9" cy="7" r="2.4" fill="var(--icon-fill,currentColor)" stroke="none"/><circle cx="16" cy="17" r="2.4" fill="var(--icon-fill,currentColor)" stroke="none"/>',
  shield: '<path d="m12 2 8 4v6.5c0 4.4-2.8 7.2-8 9.5-5.2-2.3-8-5.1-8-9.5V6z"/><path d="m8.6 12.2 2.2 2.2 4.7-4.7"/>'
};
const iconFamilies = {
  bloom: {
    pump: '<path d="M3.6 5.3h6.6v5.8H3.6zM4.7 11.1V20h8v-6.1l-2.5-2.8" fill="currentColor" fill-opacity="0.48"/><path d="M3.6 5.3h6.6v5.8H3.6zM4.7 11.1V20h8v-6.1l-2.5-2.8M10.2 8.1h5.2l2.5 3.5v6.7m-2.1 0h5V21h-5z"/><path d="M5 6.6h3.6" stroke="white" stroke-opacity=".85"/>',
    camera: '<path d="M3.5 8.2h3.6l2-3h5.8l2 3h3.6v11.5H3.5z" fill="currentColor" fill-opacity="0.47"/><path d="M3.5 8.2h3.6l2-3h5.8l2 3h3.6v11.5H3.5z"/><circle cx="12" cy="13.7" r="3.5" fill="currentColor" fill-opacity="0.43"/><circle cx="12" cy="13.7" r="3.5"/><path d="M5.5 9.6h3" stroke="white" stroke-opacity=".9"/>',
    calendar: '<rect x="3" y="5.1" width="18" height="15.7" rx="3" fill="currentColor" fill-opacity="0.47"/><rect x="3" y="5.1" width="18" height="15.7" rx="3"/><path d="M7.5 3v4m9-4v4M3 10h18m-13.5 4h2m3 0h2"/><path d="M5.1 7.1h13.8" stroke="white" stroke-opacity=".85"/>',
    home: '<path d="M3.5 10 12 3.5 20.5 10v8.4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" fill="currentColor" fill-opacity="0.49"/><path d="m4.6 9.8 7.4-5.5 7.4 5.5M9.4 20.4v-6.3h5.2v6.3"/><path d="m6 10.7 5.9-4.4" stroke="white" stroke-opacity=".8"/>',
    record: '<rect x="4.7" y="2.9" width="14.6" height="18.2" rx="3.3" fill="currentColor" fill-opacity="0.47"/><path d="M8.4 8h7.2M8.4 12h7.2M8.4 16h5"/><path d="M6.5 5.5c1.1-1 2.2-1.2 3.5-1.2" stroke="white" stroke-opacity=".85"/>',
    ai: '<path d="M5 4.4h14a2.4 2.4 0 0 1 2.4 2.4v8.1a2.4 2.4 0 0 1-2.4 2.4h-7.2L6.7 21v-3.7H5a2.4 2.4 0 0 1-2.4-2.4V6.8A2.4 2.4 0 0 1 5 4.4z" fill="currentColor" fill-opacity="0.47"/><path d="M8.2 10.4h7.6m-7.6 3.3h5.2"/><path d="M5.5 6.3c1-.5 2-.6 3-.6" stroke="white" stroke-opacity=".8"/>',
    bottle: '<path d="M8.3 9.4c-.8 1.2-1.2 2.5-1.2 4v5.6a2.4 2.4 0 0 0 2.4 2.4h5a2.4 2.4 0 0 0 2.4-2.4v-5.6c0-1.5-.4-2.8-1.2-4z" fill="currentColor" fill-opacity="0.53"/><path d="M9.3 3.1h5.4l.6 4.2H8.7z" fill="currentColor" fill-opacity="0.43"/><path d="M8.7 9.4h6.6M9.5 13.4h2.4m-2.4 3.3h2.4"/><path d="M8.7 11.5c-.5 2.3-.5 4.5-.3 6.7" stroke="white" stroke-opacity=".9"/>',
    diaper: '<path d="M4 5.4h16l1 4.2-3.2 4.1c-.3 3-2.3 5.5-5.8 7.2-3.5-1.7-5.5-4.2-5.8-7.2L3 9.6z" fill="currentColor" fill-opacity="0.51"/><path d="M4.5 9.4h15M7 13.4l5 3.1 5-3.1"/><path d="M5.4 6.9h12" stroke="white" stroke-opacity=".9"/>',
    sound: '<rect x="2.8" y="9" width="2.7" height="6" rx="1.35" fill="currentColor" fill-opacity="0.60"/><rect x="7" y="5.8" width="2.7" height="12.4" rx="1.35" fill="currentColor" fill-opacity="0.70"/><rect x="11.2" y="3" width="2.7" height="18" rx="1.35" fill="currentColor" fill-opacity="0.75"/><rect x="15.4" y="6.1" width="2.7" height="11.8" rx="1.35" fill="currentColor" fill-opacity="0.70"/><rect x="19.6" y="9.1" width="2.1" height="5.8" rx="1" fill="currentColor" fill-opacity="0.60"/><path d="M4.2 10.1v2.7M8.4 7v6M12.5 4.4v8" stroke="white" stroke-opacity=".72"/>',
    sleep: '<path d="M20.3 15.5a8.9 8.9 0 0 1-11.8-11A8.9 8.9 0 1 0 20.3 15.5z" fill="currentColor" fill-opacity="0.59"/><path d="M20.3 15.5a8.9 8.9 0 0 1-11.8-11A8.9 8.9 0 1 0 20.3 15.5z"/><path d="m17.4 4.3.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" fill="currentColor" fill-opacity="0.75" stroke="none"/><path d="M5.4 16.5c1.7 1.7 3.3 2.2 5 2.5" stroke="white" stroke-opacity=".82"/>'
  },
  orbit: {
    pump: '<path d="M3 5h8v6H3zM4 11h7l2 3v7H4zM11 7h5l2 3v8h-2v3h6v-4h-2V9l-3-4h-6z" fill="currentColor" stroke="none"/>',
    camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z" fill="currentColor" stroke="none"/><circle cx="12" cy="13.8" r="3.2" fill="var(--phone)" stroke="none"/>',
    calendar: '<path d="M4 5h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="currentColor" stroke="none"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h3m2 0h3" stroke="var(--phone)" stroke-width="1.7"/>',
    home: '<path d="M2.9 10.6 12 3l9.1 7.6v9.2a1.4 1.4 0 0 1-1.4 1.4H4.3a1.4 1.4 0 0 1-1.4-1.4z" fill="currentColor" stroke="none"/><path d="M9.7 21.2v-7.1h4.6v7.1" fill="var(--phone)" stroke="none"/>',
    record: '<rect x="4.2" y="2.5" width="15.6" height="19" rx="2.2" fill="currentColor" stroke="none"/><path d="M8 8h8M8 12h8M8 16h5" stroke="var(--phone)" stroke-width="1.7"/>',
    ai: '<path d="M4.1 4h15.8A2.1 2.1 0 0 1 22 6.1v9.3a2.1 2.1 0 0 1-2.1 2.1h-7.3L6 21v-3.5H4.1A2.1 2.1 0 0 1 2 15.4V6.1A2.1 2.1 0 0 1 4.1 4z" fill="currentColor" stroke="none"/><circle cx="8.1" cy="10.7" r="1.2" fill="var(--phone)" stroke="none"/><circle cx="12" cy="10.7" r="1.2" fill="var(--phone)" stroke="none"/><circle cx="15.9" cy="10.7" r="1.2" fill="var(--phone)" stroke="none"/>',
    bottle: '<path d="M9 2.5h6v4H9zM8.6 7.4h6.8l1.7 3.6v8.4a2.1 2.1 0 0 1-2.1 2.1H9a2.1 2.1 0 0 1-2.1-2.1V11z" fill="currentColor" stroke="none"/><path d="M9.5 12.8h3.2m-3.2 3h3.2" stroke="var(--phone)" stroke-width="1.5"/>',
    diaper: '<path d="M3 5h18l1 4.6-3.5 4.4c-.7 3.3-3.1 5.8-6.5 7.5-3.4-1.7-5.8-4.2-6.5-7.5L2 9.6z" fill="currentColor" stroke="none"/><path d="M5 9.4h14M7.2 13.5l4.8 2.8 4.8-2.8" stroke="var(--phone)" stroke-width="1.6"/>',
    sound: '<rect x="2.1" y="9.1" width="2.7" height="5.8" rx="1" fill="currentColor" stroke="none"/><rect x="6.5" y="5.3" width="2.7" height="13.4" rx="1" fill="currentColor" stroke="none"/><rect x="10.9" y="2.4" width="2.7" height="19.2" rx="1" fill="currentColor" stroke="none"/><rect x="15.3" y="5.3" width="2.7" height="13.4" rx="1" fill="currentColor" stroke="none"/><rect x="19.7" y="9.1" width="2.2" height="5.8" rx="1" fill="currentColor" stroke="none"/>',
    sleep: '<path d="M20.8 15.6A9.1 9.1 0 0 1 8.4 3.2a9.1 9.1 0 1 0 12.4 12.4z" fill="currentColor" stroke="none"/><circle cx="17.5" cy="5.6" r="1.2" fill="currentColor" stroke="none"/>'
  },
  garden: {
    pump: '<path d="M3.5 5.1h7v6h-7zM4.8 11.1V20h7.8v-5.9l-2.1-3M10.5 8h5l2.3 3.5v6.8m-2 0h5.1V21h-5.1z" fill="currentColor" fill-opacity=".26"/><path d="M3.5 5.1h7v6h-7zM4.8 11.1V20h7.8v-5.9l-2.1-3M10.5 8h5l2.3 3.5v6.8m-2 0h5.1V21h-5.1z"/><path d="M5.2 6.6h3.1" stroke="white" stroke-width="1.8" stroke-opacity=".9"/>',
    camera: '<path d="M3.2 7.6h4l2-2.9h5.6l2 2.9h4v12.2H3.2z" fill="currentColor" fill-opacity=".27"/><path d="M3.2 7.6h4l2-2.9h5.6l2 2.9h4v12.2H3.2z"/><circle cx="12" cy="13.6" r="3.7" fill="currentColor" fill-opacity=".28"/><circle cx="12" cy="13.6" r="3.7"/><path d="M5 9.4h3" stroke="white" stroke-width="1.8" stroke-opacity=".9"/>',
    calendar: '<rect x="2.9" y="5" width="18.2" height="15.9" rx="3.5" fill="currentColor" fill-opacity=".28"/><rect x="2.9" y="5" width="18.2" height="15.9" rx="3.5"/><path d="M7.2 3v4m9.6-4v4M3 10.2h18m-13.4 4h2.3m3 0h2.3"/><path d="M5.2 7.6h13.5" stroke="white" stroke-width="1.8" stroke-opacity=".9"/>',
    home: '<path d="M3.2 10.1C5.5 7.6 9 6 12 3.7c3 2.3 6.5 4.6 8.8 6.4v8.1c0 1.6-1.2 2.8-2.8 2.8H6c-1.6 0-2.8-1.2-2.8-2.8z" fill="currentColor" fill-opacity=".31"/><path d="M3.2 10.1C5.5 7.6 9 6 12 3.7c3 2.3 6.5 4.6 8.8 6.4v8.1c0 1.6-1.2 2.8-2.8 2.8H6c-1.6 0-2.8-1.2-2.8-2.8zM9.3 21v-6.6h5.4V21"/><path d="M5.4 10.3 11.8 5" stroke="white" stroke-opacity=".95"/>',
    record: '<rect x="4.3" y="2.6" width="15.4" height="18.8" rx="4.5" fill="currentColor" fill-opacity=".28"/><rect x="4.3" y="2.6" width="15.4" height="18.8" rx="4.5"/><path d="M8.3 8h7.4M8.3 12h7.4M8.3 16h4.4"/><path d="M6.5 6.6c.4-1.2 1.2-1.8 2.4-2" stroke="white" stroke-opacity=".95"/>',
    ai: '<path d="M6.6 3.8h10.8c2.8 0 4.5 1.7 4.5 4.5v5.5c0 2.7-1.7 4.4-4.5 4.4h-5.1L6.5 21v-2.8c-2.7-.1-4.4-1.8-4.4-4.4V8.3c0-2.8 1.7-4.5 4.5-4.5z" fill="currentColor" fill-opacity=".29"/><path d="M6.6 3.8h10.8c2.8 0 4.5 1.7 4.5 4.5v5.5c0 2.7-1.7 4.4-4.5 4.4h-5.1L6.5 21v-2.8c-2.7-.1-4.4-1.8-4.4-4.4V8.3c0-2.8 1.7-4.5 4.5-4.5z"/><path d="M8.3 10.5h7.4m-7.4 3.3h4.5"/><path d="M4.8 8.4c.2-1.7 1.2-2.6 2.8-2.9" stroke="white" stroke-opacity=".9"/>',
    bottle: '<path d="M9.5 3h5l.8 4.4H8.7zM8.4 9.1c-.8 1.2-1.3 2.5-1.3 4.2v5.5c0 1.5 1.2 2.7 2.7 2.7h4.4c1.5 0 2.7-1.2 2.7-2.7v-5.5c0-1.7-.5-3-1.3-4.2z" fill="currentColor" fill-opacity=".34"/><path d="M9.5 3h5l.8 4.4H8.7zM8.4 9.1c-.8 1.2-1.3 2.5-1.3 4.2v5.5c0 1.5 1.2 2.7 2.7 2.7h4.4c1.5 0 2.7-1.2 2.7-2.7v-5.5c0-1.7-.5-3-1.3-4.2zM8.4 9.1h7.2M9.7 14h2.1m-2.1 3.1h2.1"/><path d="M9.2 11.5c-.6 1.7-.8 3.3-.8 5" stroke="white" stroke-width="2" stroke-opacity=".9"/><circle cx="14.2" cy="16.6" r=".8" fill="white" fill-opacity=".75" stroke="none"/>',
    diaper: '<path d="M4.2 5.2h15.6l1.2 4.1-3.1 4.1c-.6 3.1-2.5 5.7-5.9 7.4-3.4-1.7-5.3-4.3-5.9-7.4L3 9.3z" fill="currentColor" fill-opacity=".32"/><path d="M4.2 5.2h15.6l1.2 4.1-3.1 4.1c-.6 3.1-2.5 5.7-5.9 7.4-3.4-1.7-5.3-4.3-5.9-7.4L3 9.3zM4.6 9.1h14.8M7.1 13.4l4.9 3 4.9-3"/><path d="M5.5 6.9h12.6" stroke="white" stroke-width="2" stroke-opacity=".9"/>',
    sound: '<path d="M12 3.2C9.1 7.4 7.8 9.5 7.8 12.7a4.2 4.2 0 0 0 8.4 0C16.2 9.5 14.9 7.4 12 3.2z" fill="currentColor" fill-opacity=".38"/><path d="M12 3.2C9.1 7.4 7.8 9.5 7.8 12.7a4.2 4.2 0 0 0 8.4 0C16.2 9.5 14.9 7.4 12 3.2zM5.1 7.9c-2 2.4-2 6 0 8.3m13.8-8.3c2 2.4 2 6 0 8.3"/><path d="M9.3 11.8c-.2 1.6.2 2.6 1.3 3.3" stroke="white" stroke-width="1.8" stroke-opacity=".92"/>',
    sleep: '<path d="M20.6 15.6a9.2 9.2 0 0 1-12.2-12A9.2 9.2 0 1 0 20.6 15.6z" fill="currentColor" fill-opacity=".38"/><path d="M20.6 15.6a9.2 9.2 0 0 1-12.2-12A9.2 9.2 0 1 0 20.6 15.6z"/><path d="M5.5 16.7c1.2 1.4 2.9 2.2 4.6 2.5" stroke="white" stroke-width="2" stroke-opacity=".9"/><circle cx="17.2" cy="5.5" r="1" fill="currentColor" fill-opacity=".7" stroke="none"/>'
  },
  berry: {
    pump: '<path d="M3.5 5h7v6h-7zM4.5 11v9h8v-6l-2-3M10.5 8h5l2.5 3v7m-2.2 0h5V21h-5z"/>',
    camera: '<path d="M3 7.7h4.2l1.8-2.9h6l1.8 2.9H21v12.1H3z"/><circle cx="12" cy="13.8" r="3.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h2m3 0h2"/>',
    home: '<path d="M3.7 10.1 12 3.8l8.3 6.3v10.1H3.7zM9.8 20.2v-6.4h4.4v6.4"/>',
    record: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8.5 8h7m-7 4h7m-7 4h4"/>',
    ai: '<path d="M4 4h16v13h-8.2L7 20.7V17H4z"/><path d="M8 10.2h8m-8 3.5h5"/>',
    bottle: '<path d="M9.5 3h5l.6 4.2h-6.2zM8.2 9.2h7.6l1 2.2v8.2H7.2v-8.2zM9.2 13.1h2.8m-2.8 3.1H12"/>',
    diaper: '<path d="M3.8 5.1h16.4l.9 4.1-3.6 4.3c-.5 3-2.2 5.5-5.5 7.3-3.3-1.8-5-4.3-5.5-7.3L2.9 9.2zM4.2 9.1h15.6M7.2 13.5l4.8 2.8 4.8-2.8"/>',
    sound: '<path d="M3.2 10v4m4-7.5v11m4.4-14.5v18m4.3-14v10m4-7v4"/>',
    sleep: '<path d="M20.1 15A9 9 0 0 1 9 3.9 9 9 0 1 0 20.1 15zM4 19.5h4"/>'
  }
};
const gardenHaloKeys = new Set(['bottle', 'diaper', 'sound', 'sleep', 'pump', 'camera', 'calendar']);
const icon = (key, extra = '') => `<svg class="icon-svg icon-${variant}" data-icon="${key}" ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${variant === 'garden' && gardenHaloKeys.has(key) ? '<circle class="icon-halo" cx="12" cy="12" r="10.8" fill="currentColor" fill-opacity=".15" stroke="white" stroke-opacity=".65" stroke-width=".7"/>' : ''}${iconFamilies[variant][key] || symbols[key]}</svg>`;
const state = { screen: 'home', result: 'normal', opaque: false, quiet: false };
const states = {
  normal: { label: 'Default view', icon: 'clock', headline: 'Review before saving', detail: 'This entry has not been saved yet.', action: 'Save the entry', kind: 'neutral' },
  saving: { label: 'Saving', icon: 'clock', headline: 'Saving your entry…', detail: 'There is no time estimate yet.', action: 'Wait for confirmation', kind: 'neutral' },
  saved: { label: 'Saved', icon: 'check', headline: 'Entry saved', detail: 'Iris’s bottle feed is in the Journal.', action: 'Review the entry', kind: 'success' },
  local: { label: 'On this device', icon: 'cloud', headline: 'Saved on this device', detail: 'Sync to other devices has not been confirmed.', action: 'Check sync status', kind: 'local' },
  failed: { label: 'Save failed', icon: 'alert', headline: 'Couldn’t save the entry', detail: 'Your draft is still here.', action: 'Try saving again', kind: 'error' },
  unknown: { label: 'Status unclear', icon: 'help', headline: 'Save status is unclear', detail: 'Check the Journal before saving again to avoid a duplicate.', action: 'Check the Journal', kind: 'unknown' },
  analyzing: { label: 'Reviewing', icon: 'clock', headline: 'Reviewing what you shared…', detail: 'No result or time estimate is available yet.', action: 'Wait for an update', kind: 'neutral' },
  indeterminate: { label: 'Not enough information', icon: 'help', headline: 'Not enough information', detail: 'What you shared isn’t enough to identify why Iris is crying.', action: 'Add more context', kind: 'unknown' }
};
const stateChoices = { home: ['normal','saving','saved','local','failed','unknown'], records: ['normal','saving','saved','local','failed','unknown'], assistant: ['normal','analyzing','indeterminate'] };
const compareLinks = Object.entries(variants).map(([key,v]) => `<a href="${paths[key]}" ${key===variant?'aria-current="page"':''}><span>${v.number}</span> ${v.name}</a>`).join('');

function statusBlock() {
  if (state.result === 'normal') return '';
  const s = states[state.result];
  return `<div class="status-block ${s.kind}" role="status">${icon(s.icon)}<div><strong>${s.headline}</strong><span>${s.detail}</span><b>Suggested next step: ${s.action}</b></div></div>`;
}
function tabBar() {
  return `<nav class="glass-tabbar" aria-label="Preview navigation">${[['home','Today','home'],['records','Journal','record'],['assistant','Momcozy AI','ai']].map(([id,text,g])=>`<button type="button" data-screen="${id}" aria-current="${state.screen===id?'page':'false'}">${icon(g)}<span>${text}</span></button>`).join('')}</nav>`;
}
const taskCatalog = {
  feed: { icon: 'bottle', label: 'Feed' },
  crying: { icon: 'sound', label: 'Crying' },
  diaper: { icon: 'diaper', label: 'Diaper' },
  sleep: { icon: 'sleep', label: 'Sleep' }
};
function taskMark(task) {
  return `<span class="task-mark" data-task="${task}">${icon(taskCatalog[task].icon)} ${taskCatalog[task].label}</span>`;
}
function quickCards() {
  const cards = [
    ['feed', 'Log a feed', 'Time & amount'],
    ['crying', 'Understand crying', 'Add context'],
    ['diaper', 'Check a diaper', 'Photo or note']
  ];
  return `<div class="quick-row">${cards.map(([task, title, detail]) =>
    `<div class="quick" data-task="${task}"><span class="quick-icon">${icon(taskCatalog[task].icon)}</span><b>${title}</b><small>${detail}</small></div>`
  ).join('')}</div>`;
}
function recentEvent(task, title, detail, time) {
  return `<div class="event" data-task="${task}"><span class="event-icon">${icon(taskCatalog[task].icon)}</span><div><b>${title}</b><small>${detail}</small></div><time>${time}</time></div>`;
}
function timelineEvent(task, title, detail, time) {
  return `<div class="timeline-item" data-task="${task}"><time>${time}</time><span class="event-icon">${icon(taskCatalog[task].icon)}</span><div><b>${title}</b><small>${detail}</small></div></div>`;
}
function homeScreen() {
  return `<div class="app-scroll"><div class="app-top"><span>OCT 21 · WEDNESDAY</span><span class="glass-icon" aria-hidden="true">${icon('settings')}</span></div><header class="app-heading"><span class="kicker">IRIS · DAY 12</span><h2>Today, one step at a time.</h2><p>A clear view of what you’ve recorded.</p></header><div class="today-hero" data-task="feed"><div class="hero-orb" aria-hidden="true"><span></span><span></span></div><div class="hero-label"><span class="eyebrow">LATEST FEED</span>${taskMark('feed')}</div><div class="metric"><strong>4</strong><span>fl oz</span></div><p>2:40 PM · Bottle feed</p><div class="hero-foot"><span>3 feeds recorded today</span><span>${icon('arrow')}</span></div></div>${statusBlock()}<section class="app-section"><div class="app-section-heading"><h3>Care tasks</h3><span>Quick access</span></div>${quickCards()}</section><section class="app-section recent"><div class="app-section-heading"><h3>Recent care</h3><span>Today</span></div>${recentEvent('feed', 'Bottle feed', 'Iris · 4 fl oz', '2:40 PM')}${recentEvent('diaper', 'Diaper change', 'Iris · Recorded', '1:50 PM')}</section></div>${tabBar()}`;
}
function recordScreen() {
  return `<div class="app-scroll"><div class="app-top"><span>CARE JOURNAL</span><span class="glass-icon" aria-hidden="true">${icon('calendar')}</span></div><header class="app-heading"><span class="kicker">OCT 21 · IRIS</span><h2>Today’s care, in one place.</h2><p>Only events you chose to record.</p></header><div class="owner-switch"><span class="selected">Iris · Baby</span><span>Mom</span></div><div class="journal-summary" data-task="feed"><div class="summary-top"><span class="eyebrow">TODAY’S FEEDS</span>${taskMark('feed')}</div><strong>3 <small>feeds</small></strong><span>Latest 2:40 PM · 4 fl oz</span></div>${statusBlock()}<section class="app-section"><div class="app-section-heading"><h3>Recent entries</h3><span>Latest 4</span></div><div class="timeline">${timelineEvent('feed', 'Bottle feed', 'Iris · 4 fl oz', '2:40 PM')}${timelineEvent('diaper', 'Diaper change', 'Iris · Recorded', '1:50 PM')}${timelineEvent('feed', 'Formula feed', 'Iris · 3 fl oz', '11:40 AM')}${timelineEvent('sleep', 'Nap', 'Iris · 15 min', '9:30 AM')}</div></section></div>${tabBar()}`;
}
function assistantScreen() {
  const uncertain = state.result === 'indeterminate';
  const busy = state.result === 'analyzing';
  return `<div class="app-scroll"><div class="app-top"><span>HERE WITH YOU</span><span class="glass-icon" aria-hidden="true">${icon('record')}</span></div><header class="app-heading"><span class="kicker">MOMCOZY AI</span><h2>Let’s make sense of it.</h2><p>Context first. You choose the next step.</p></header><div class="user-note"><span>YOU SHARED</span><p>“Iris cried after her bottle feed.”</p></div><div class="ai-answer"><div class="ai-identity"><span class="ai-gem" aria-hidden="true"></span> ${busy?'REVIEW IN PROGRESS':uncertain?'WHAT WE KNOW':'ONE POSSIBILITY'}</div><h3>${busy?'Reviewing what you shared…':uncertain?'I can’t tell why Iris is crying from this alone.':'It may help to check whether Iris needs a diaper change.'}</h3><p>${busy?'I’ll share a response if there is enough information.':uncertain?'Details about timing and recent care may help you decide what to do next.':'This is one possibility based on what you shared, not a diagnosis.'}</p><div class="source">${busy?'Reviewing what you shared':uncertain?'Based on what you shared so far':'Based on what you shared about the feeding'}</div></div>${statusBlock()}<div class="next-step"><span class="step-icon">${icon('shield')}</span><div><b>What you can do next</b><p>${busy?'Wait for the review to finish.':uncertain?'Add details about when the crying began and what happened beforehand.':'Check Iris’s diaper and surroundings. Add context if you want to explore other possibilities.'}</p></div></div><section class="app-section"><div class="app-section-heading"><h3>Common tools</h3></div>${quickCards()}</section></div>${tabBar()}`;
}
function iconStudies() {
  const samples = [
    ...Object.entries(taskCatalog).map(([task, item]) => [item.icon, item.label, task]),
    ['pump', 'Pump'], ['camera', 'Photo'], ['calendar', 'Calendar'], ['ai', 'AI assistant']
  ];
  return samples.map(([symbol, label, task]) =>
    `<div class="icon-sample" ${task ? `data-task="${task}"` : ''}><span>${icon(symbol)}</span><b>${label}</b></div>`
  ).join('');
}
function feedbackStudies() {
  return ['saved','local','failed','unknown','indeterminate'].map(k=>{const s=states[k];return `<article class="feedback ${s.kind}">${icon(s.icon)}<div><b>${s.headline}</b><span>${s.detail}</span></div></article>`}).join('');
}
function render(focusSelector) {
  const app = document.getElementById('board');
  app.innerHTML = `<div class="page-shell"><aside class="editorial"><div class="brand"><span class="brand-dot">m</span><span>momcozy <small>AGENT / STYLE STUDY</small></span></div><nav class="variant-links" aria-label="Four style directions">${compareLinks}</nav><div class="intro"><span class="serial">STYLE BOARD ${meta.number} / 04 · CS-0.6</span><h1>${meta.name}<br><em>${meta.tagline}</em></h1><p class="premise">${meta.premise}</p><p class="description">${meta.material}</p><div class=axis-pair><span>Icons · ${axisLabels[variant].icon}</span><span>Glass · ${axisLabels[variant].glass}</span></div><div class="palette"><i></i><i></i><i></i><i></i><i></i></div><div class="test-note"><b>What to watch for</b><p>${meta.insight}</p></div></div><div class="editorial-foot">Same sample content · Same state meanings<br>Design candidate · Not approved / Oct 21, 2026</div></aside><main class="board-main"><div class="board-top"><span>Icons · ${axisLabels[variant].icon}　Glass · ${axisLabels[variant].glass}</span><span>Interactive tabs · Sample content</span></div><div class="headline"><div><span class="serial">THE EXPERIENCE IN CONTEXT</span><h2>Make care feel<br><em>clear and calm.</em></h2></div><p>Color gives each task a clear cue. Glass stays on navigation and lightweight controls, while facts and feedback sit on solid surfaces.</p></div><section class="workbench" aria-label="Interactive page preview"><div class="preview-controls"><div role="group" aria-label="Choose a preview page" class="screen-switch"><button type="button" data-page="home" aria-pressed="${state.screen==='home'}">Today</button><button type="button" data-page="records" aria-pressed="${state.screen==='records'}">Journal</button><button type="button" data-page="assistant" aria-pressed="${state.screen==='assistant'}">Momcozy AI</button></div><label class="state-picker">Feedback scenario <select id="result" aria-label="Choose a feedback scenario">${stateChoices[state.screen].map(k=>`<option value="${k}" ${k===state.result?'selected':''}>${states[k].label}</option>`).join('')}</select></label></div><div class="preview-area"><div class="ambient a1"></div><div class="ambient a2"></div><div class="preview-caption"><span>01 / PAGE STUDY</span><b>${meta.name}</b><small>390 × 844 · Scaled preview</small></div><div class="phone" lang="en"><div class="phone-status"><span>9:41</span><span aria-hidden="true">●●● ▰</span></div><div class="phone-body">${state.screen==='home'?homeScreen():state.screen==='records'?recordScreen():assistantScreen()}</div></div><div class="floating-label">${icon('shield')}<span>Clear states<br><b>Calm next steps</b></span></div></div></section><section class="specimens"><div class="specimen-title"><span class="serial">THE DESIGN LANGUAGE</span><h2>Material, meaning, feedback</h2></div><div class="specimen-grid"><article class="specimen glass-study"><div class="specimen-kicker">01 · FUNCTIONAL GLASS</div><h3>Controls above the content</h3><div class="glass-demo"><div class="glass-orb"></div><div class="glass-pill">${icon('calendar')} Today, Oct 21 ${icon('chevron')}</div><div class="glass-mini">${icon('plus')}</div></div><p>${meta.glassDescription}</p></article><article class="specimen icons-study"><div class="specimen-kicker">02 · SEMANTIC ICONS</div><h3>Recognizable icons with labels</h3><div class="icons-grid">${iconStudies()}</div><p>${meta.iconDescription}</p></article><article class="specimen status-study"><div class="specimen-kicker">03 · HONEST FEEDBACK</div><h3>Clear next steps</h3><div class="feedback-grid">${feedbackStudies()}</div><p>A saved entry, a device-only copy, and an inconclusive AI result mean different things. The text makes each state clear without relying on color.</p></article></div></section><section class="test-strip"><div><span class="serial">TEST CONDITIONS</span><h3>Same care scenarios. Four visual directions.</h3><p>Notice where your eye goes first. Can you identify each task and distinguish saved, device-only, and uncertain AI states? Is the glass comfortable to read on your device? Only the tabs and test controls are interactive.</p></div><div class="test-toggles"><label><input type="checkbox" id="opaque" ${state.opaque?'checked':''}> Reduce transparency</label><label><input type="checkbox" id="quiet" ${state.quiet?'checked':''}> Reduce motion</label></div></section><footer>CS-0.6 · ${meta.name} · Design candidate · <a href="index.html">Back to all directions</a></footer></main></div>`;
  document.body.classList.toggle('opaque', state.opaque);
  document.body.classList.toggle('quiet', state.quiet);
  bind();
  if (focusSelector) document.querySelector(focusSelector)?.focus({ preventScroll: true });
}
function bind() {
  document.querySelectorAll('[data-page],[data-screen]').forEach(el => el.addEventListener('click', () => { state.screen = el.dataset.page || el.dataset.screen; state.result = 'normal'; render(el.dataset.page ? `[data-page="${state.screen}"]` : `[data-screen="${state.screen}"]`); }));
  document.getElementById('result').addEventListener('change', e => { state.result=e.target.value; render('#result'); });
  document.getElementById('opaque').addEventListener('change', e => { state.opaque=e.target.checked; render('#opaque'); });
  document.getElementById('quiet').addEventListener('change', e => { state.quiet=e.target.checked; render('#quiet'); });
}
render();
