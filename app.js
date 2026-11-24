"use strict";
/* Core pieces: categories, themes, thank-you messages, helpers, sounds and cartoon art.
   (Settings live in config.js, data and backend in data.js, pages in pages.js.) */

/* =====================================================================
   CATEGORIES (look + feel of each sub-page)
   ===================================================================== */
const CATEGORIES = [
  { id: "fruits",     label: "Fruits",     emoji: "🍎", blurb: "Sweet & juicy" },
  { id: "vegetables", label: "Vegetables", emoji: "🥕", blurb: "Straight from the garden" },
  { id: "eggs",       label: "Eggs",       emoji: "🥚", blurb: "Laid this week" },
  { id: "milk",       label: "Milk",       emoji: "🥛", blurb: "Fresh from the pasture" },
  { id: "beans",      label: "Beans",      emoji: "🫘", blurb: "Fresh & dried" },
  { id: "meat",       label: "Meat",       emoji: "🥩", blurb: "Raised right here" },
  { id: "specialty",  label: "Specialty",  emoji: "🍯", blurb: "Jams, honey & more" }
];

const THEMES = {
  home:       { sky1: "#7ec8f2", sky2: "#d7f0ff", hill: "#8fcf6b", ground: "#6fbf4a" },
  fruits:     { sky1: "#8fd3f4", sky2: "#e7f7ff", hill: "#9bd16c", ground: "#7cc24f" },
  vegetables: { sky1: "#a7dcf7", sky2: "#fff4d6", hill: "#a5d36b", ground: "#8a5a34" },
  eggs:       { sky1: "#ffe29a", sky2: "#fff3cf", hill: "#b8d96b", ground: "#8fc557" },
  milk:       { sky1: "#7ccaf5", sky2: "#e3f6ff", hill: "#7fc46c", ground: "#5fb34f" },
  beans:      { sky1: "#b2e1f0", sky2: "#f4ffe0", hill: "#94c973", ground: "#74b84e" },
  meat:       { sky1: "#f6a95c", sky2: "#ffe0b2", hill: "#7da05a", ground: "#6a8f45" },
  specialty:  { sky1: "#c89a62", sky2: "#a9743f", hill: "#8a5a2b", ground: "#6b4220" },
  pick:       { sky1: "#9fdcf7", sky2: "#ffeede", hill: "#9bd16c", ground: "#7cc24f" },
  fun:        { sky1: "#7ec8f2", sky2: "#fff1c9", hill: "#b4cf7a", ground: "#a37a4a" },
  custom:     { sky1: "#d7b8f2", sky2: "#f6eaff", hill: "#a5d36b", ground: "#7cc24f" },
  farm:       { sky1: "#8fd3f4", sky2: "#e7f7ff", hill: "#9bd16c", ground: "#7cc24f" },
  feedback:   { sky1: "#ffd6a0", sky2: "#fff4dc", hill: "#9bd16c", ground: "#7cc24f" }
};


/* 36 different thank-yous. {name} becomes the customer's first name. */
const THANKS = [
  "Well bless your heart, {name}! Thank you kindly for stopping by.",
  "{name}, you just made this farmer's whole day. Much obliged!",
  "Thank you, {name}! The chickens and I are doing a happy dance.",
  "You're sweeter than a fresh-picked peach, {name}. Thank you!",
  "Folks like you keep a little farm going, {name}. We're grateful!",
  "Mighty fine doing business with you, {name}. Thank you!",
  "{name}, the sun came out a little brighter when your order came in.",
  "We appreciate you more than a cool breeze in July, {name}!",
  "Thank you for supporting a small farm, {name}. It means the world.",
  "Yeehaw! Thank you, {name}. Your order's in good hands.",
  "{name}, you're a real gem. Thank you for choosing us!",
  "The cows said thank you too, {name}. They're a little shy about it.",
  "Thank you, {name}! Good food shared is the best kind of neighborly.",
  "You're an angel in work boots, {name}. Thank you!",
  "Gratitude from the garden to you, {name}. Enjoy every bite!",
  "{name}, your kindness grows bigger than my tallest cornstalk. Thank you!",
  "Much appreciated, {name}! Come back anytime. The porch light is always on.",
  "Thank you, {name}. I'll pick out the very best for you.",
  "Hot dog! Another happy neighbor. Thank you, {name}!",
  "You make farming worth every early morning, {name}. Thank you!",
  "Thankful for you, {name}, like rain after a dry spell.",
  "{name}, you're why we do this. Thank you from all of us on the farm!",
  "A big ol' country thank-you to you, {name}!",
  "Thank you, {name}! May your table be full and your friends be many.",
  "You've got good taste, {name}. Thank you for trusting our harvest!",
  "Bless you, {name}. Thank you for making our little farm feel big.",
  "Thank you, {name}! I'll save you a smile and a fresh bunch of something.",
  "It's folks like you that make a community, {name}. Thank you!",
  "Well, shut the barn door, {name}, that's mighty generous. Thank you!",
  "The hens did their best work just for you, {name}. Thank you!",
  "Thank you, {name}. Good neighbors are worth more than gold.",
  "From our dirt to your dinner plate, thank you, {name}!",
  "You just put a big ol' grin on this farmer's face, {name}. Thank you!",
  "Thank you from the bottom of my boots, {name}!",
  "Thanks a million, {name}. Enjoy it, and tell your friends!",
  "{name}, you're the cream of the crop. Thank you!"
];

/* =====================================================================
   Small helpers
   ===================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "$" + Number(n).toFixed(2);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const priceLabel = (it) => (it.price > 0 ? `${money(it.price)} / ${esc(it.unit)}` : "Trade or free");
const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
const safeGet = (k, fallback) => { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

/* =====================================================================
   State
   ===================================================================== */
const state = {
  items: [],
  loaded: false,
  loadError: "",
  basket: safeGet("basket", {}),   // { itemId: qty }
  pending: {},                     // quantity picked on each card before "Add"
  sound: safeGet("sound", true),
  sceneKind: "",
  extras: { settings: {}, upick: [], activities: [], shapes: [], badges: [], photos: [] },
  community: { reviews: [], avg: 0, ratedCount: 0 },
  communityError: "",
  rating: 0
};
const itemById = (id) => state.items.find((i) => i.id === id);
const basketCount = () => Object.values(state.basket).reduce((a, b) => a + b, 0);

/* =====================================================================
   Sound (all synthesized, no files needed)
   ===================================================================== */
let audioCtx = null;
function tone({ type = "sine", f0 = 440, f1 = f0, dur = 0.15, vol = 0.12, delay = 0 }) {
  const ctx = audioCtx;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}
const SOUNDS = {
  pop()   { tone({ type: "triangle", f0: 500, f1: 900, dur: 0.09 }); },
  cluck() { [0, 0.09, 0.2].forEach((d) => tone({ type: "square", f0: 330, f1: 180, dur: 0.06, vol: 0.05, delay: d })); },
  ding()  { tone({ f0: 880, dur: 0.25 }); tone({ f0: 1320, dur: 0.4, delay: 0.12 }); },
  moo()   { tone({ type: "sawtooth", f0: 140, f1: 95, dur: 0.9, vol: 0.06 }); },
  honk()  { tone({ type: "square", f0: 260, f1: 200, dur: 0.18, vol: 0.06 }); tone({ type: "square", f0: 330, f1: 260, dur: 0.22, vol: 0.06, delay: 0.2 }); },
  ching() { tone({ f0: 1568, dur: 0.18, vol: 0.1 }); tone({ f0: 2093, dur: 0.5, vol: 0.1, delay: 0.1 }); },
  crow()  {
    tone({ type: "sawtooth", f0: 420, f1: 640, dur: 0.16, vol: 0.07 });
    tone({ type: "sawtooth", f0: 760, f1: 520, dur: 0.12, vol: 0.07, delay: 0.2 });
    tone({ type: "sawtooth", f0: 700, f1: 700, dur: 0.1, vol: 0.07, delay: 0.36 });
    tone({ type: "sawtooth", f0: 680, f1: 360, dur: 0.6, vol: 0.07, delay: 0.5 });
  }
};
function play(name) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    SOUNDS[name]();
  } catch { /* sound is optional, never break the page */ }
}
function updateSoundBtn() { $("#soundBtn").textContent = state.sound ? "🔊" : "🔇"; }

/* =====================================================================
   Cartoon artwork: farmer + scenes
   ===================================================================== */
let farmerUid = 0;
function farmerSVG() {
  const id = "plaid" + (++farmerUid);
  return `<svg class="farmer" viewBox="0 0 280 360" role="img" aria-label="Cartoon farmer waving hello">
  <defs><pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse">
    <rect width="16" height="16" fill="#b8322a"/><rect y="5" width="16" height="5" fill="#7d1f1a" opacity=".7"/><rect x="5" width="5" height="16" fill="#7d1f1a" opacity=".7"/></pattern></defs>
  <g stroke="#3a2410" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="105" cy="340" rx="30" ry="14" fill="#5a3a1e"/><ellipse cx="175" cy="340" rx="30" ry="14" fill="#5a3a1e"/>
    <rect x="82" y="250" width="52" height="88" rx="10" fill="#3b6ea8"/><rect x="146" y="250" width="52" height="88" rx="10" fill="#3b6ea8"/>
    <rect x="72" y="160" width="136" height="112" rx="30" fill="url(#${id})"/>
    <rect x="48" y="170" width="34" height="84" rx="16" fill="url(#${id})"/><circle cx="65" cy="262" r="15" fill="#f4c79c"/>
    <rect x="78" y="190" width="124" height="86" rx="12" fill="#3b6ea8"/>
    <rect x="122" y="214" width="36" height="28" rx="4" fill="#2f5a8c"/>
    <line x1="113" y1="160" x2="113" y2="194" stroke-width="14" stroke="#3b6ea8"/><line x1="167" y1="160" x2="167" y2="194" stroke-width="14" stroke="#3b6ea8"/>
    <circle cx="113" cy="196" r="5" fill="#ffd54a"/><circle cx="167" cy="196" r="5" fill="#ffd54a"/>
    <g class="wave"><line x1="205" y1="178" x2="236" y2="108" stroke-width="36" stroke="#3a2410"/><line x1="205" y1="178" x2="236" y2="108" stroke-width="30" stroke="url(#${id})"/><circle cx="238" cy="96" r="17" fill="#f4c79c"/></g>
    <rect x="118" y="146" width="44" height="26" fill="#f4c79c"/>
    <circle cx="90" cy="112" r="10" fill="#f4c79c"/><circle cx="190" cy="112" r="10" fill="#f4c79c"/>
    <ellipse cx="140" cy="108" rx="50" ry="52" fill="#f4c79c"/>
    <path d="M92 118 Q96 180 140 186 Q184 180 188 118 Q170 142 140 142 Q110 142 92 118Z" fill="#7b4a22"/>
    <circle cx="106" cy="124" r="8" fill="#f08a7e" opacity=".55" stroke="none"/><circle cx="174" cy="124" r="8" fill="#f08a7e" opacity=".55" stroke="none"/>
    <ellipse cx="120" cy="100" rx="7" ry="6" fill="#fff"/><ellipse cx="160" cy="100" rx="7" ry="6" fill="#fff"/>
    <circle cx="121" cy="101" r="3" fill="#3a2410" stroke="none"/><circle cx="161" cy="101" r="3" fill="#3a2410" stroke="none"/>
    <path d="M108 88 L130 85 M150 85 L172 88" stroke-width="5" stroke="#5a3414"/>
    <circle cx="140" cy="118" r="11" fill="#eaa57c"/>
    <path d="M110 132 Q125 120 140 131 Q155 120 170 132 Q155 146 140 138 Q125 146 110 132Z" fill="#7b4a22"/>
    <path d="M124 150 Q140 166 156 150 Z" fill="#5a1f1f"/><rect x="133" y="150" width="8" height="7" fill="#fff" stroke="none"/>
    <path d="M156 148 L206 128 q8 -3 10 -12" stroke="#e8c44a" stroke-width="5" fill="none"/>
    <ellipse cx="140" cy="72" rx="94" ry="17" fill="#e9c46a"/>
    <path d="M92 72 Q92 12 140 12 Q188 12 188 72 Z" fill="#f0d078"/>
    <path d="M92 60 Q140 74 188 60 L188 72 Q140 86 92 72Z" fill="#8c3b2a"/>
    <path d="M110 24 L104 58 M130 16 L128 62 M152 16 L154 62 M172 26 L178 58" stroke="#c9a24a" stroke-width="2" opacity=".8"/>
  </g></svg>`;
}

const OUT = 'stroke="#4a2e12" stroke-width="3" stroke-linejoin="round"';
const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".95"><ellipse rx="60" ry="24"/><ellipse cx="-38" cy="9" rx="38" ry="18"/><ellipse cx="40" cy="9" rx="42" ry="19"/></g>`;
const tree = (x, y, s, fruit) => {
  let f = "";
  if (fruit) [[-38, -120], [10, -158], [44, -100], [-10, -96], [-58, -88], [28, -136]].forEach(([dx, dy]) => {
    f += `<circle cx="${dx}" cy="${dy}" r="9" fill="${fruit}" stroke="#4a2e12" stroke-width="2"/>`;
  });
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-14" y="-90" width="28" height="90" rx="6" fill="#8b5a2b" ${OUT}/><circle cx="0" cy="-130" r="62" fill="#4fa04a" ${OUT}/><circle cx="-48" cy="-100" r="42" fill="#58ad52" ${OUT}/><circle cx="50" cy="-100" r="44" fill="#58ad52" ${OUT}/>${f}</g>`;
};
const barn = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-90" y="-110" width="180" height="110" fill="#c0392b" ${OUT}/><polygon points="-100,-110 0,-185 100,-110" fill="#8e2a20" ${OUT}/><rect x="-32" y="-70" width="64" height="70" fill="#a93226" stroke="#fff" stroke-width="5"/><path d="M-32 -70 L32 0 M32 -70 L-32 0" stroke="#fff" stroke-width="5"/><circle cx="0" cy="-130" r="14" fill="#fff4cc" ${OUT}/></g>`;
const fence = (x0, x1, y) => {
  let p = "";
  for (let x = x0; x <= x1; x += 55) p += `<rect x="${x}" y="${y - 48}" width="12" height="58" rx="3" fill="#d9b382" ${OUT}/>`;
  return `${p}<rect x="${x0}" y="${y - 36}" width="${x1 - x0 + 12}" height="9" fill="#e6c598" ${OUT}/><rect x="${x0}" y="${y - 14}" width="${x1 - x0 + 12}" height="9" fill="#e6c598" ${OUT}/>`;
};

function sceneSVG(kind) {
  const t = THEMES[kind] || THEMES.home;
  const open = `<svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">`;

  if (kind === "specialty") { // a cozy country-store wall instead of a field
    let planks = "", jars = "";
    for (let x = 0; x < 1200; x += 100) planks += `<rect x="${x}" y="0" width="100" height="700" fill="${x % 200 ? "#b57d45" : "#a9743f"}" stroke="#7b4a22" stroke-width="3"/>`;
    const colors = ["#e53935", "#fbc02d", "#8e24aa", "#43a047", "#fb8c00", "#d81b60"];
    [210, 400].forEach((y, row) => {
      jars += `<rect x="60" y="${y}" width="1080" height="16" rx="4" fill="#5b3a1a"/>`;
      for (let x = 100 + row * 40; x < 1100; x += 90) {
        const c = colors[(x / 90 + row) % colors.length | 0];
        jars += `<rect x="${x}" y="${y - 58}" width="46" height="58" rx="8" fill="${c}" opacity=".85" ${OUT}/><rect x="${x - 2}" y="${y - 68}" width="50" height="12" rx="4" fill="#d7ccc8" ${OUT}/>`;
      }
    });
    let awning = "";
    for (let x = 0; x < 1200; x += 100) awning += `<path d="M${x} 0 H${x + 100} V70 Q${x + 50} 110 ${x} 70Z" fill="${x % 200 ? "#fff" : "#c0392b"}" stroke="#7b1d14" stroke-width="3"/>`;
    return `${open}${planks}${jars}${awning}<rect x="0" y="560" width="1200" height="140" fill="#6b4220"/><path d="M0 560 H1200" stroke="#3a2410" stroke-width="6"/></svg>`;
  }

  let props = "";
  if (kind === "home") {
    props = barn(200, 500, 1.5) +
      `<g transform="translate(350 500)"><rect x="-34" y="-190" width="68" height="190" fill="#cfd8dc" ${OUT}/><path d="M-34 -190 Q0 -245 34 -190Z" fill="#90a4ae" ${OUT}/></g>` +
      tree(1040, 510, 1.2, "") + fence(480, 900, 530);
  } else if (kind === "fruits") {
    props = tree(150, 530, 1.3, "#e53935") + tree(470, 550, 1.1, "#fb8c00") + tree(800, 530, 1.35, "#e53935") + tree(1080, 555, 1.1, "#8e24aa");
  } else if (kind === "vegetables") {
    for (let r = 0; r < 5; r++) {
      const y = 505 + r * 40, sc = 0.6 + r * 0.18;
      for (let x = (r % 2) * 34; x < 1240; x += 70 * sc + 22) {
        props += `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M0 0 q-14 -34 -8 -40 q10 12 8 40 q6 -38 18 -36 q-6 18 -10 36z" fill="#3f9b44" stroke="#2b6b2f" stroke-width="2"/><circle cx="0" cy="2" r="7" fill="#f57c00"/></g>`;
      }
    }
  } else if (kind === "eggs") {
    props = `<g transform="translate(850 510)"><rect x="-90" y="-100" width="180" height="100" fill="#a9743f" ${OUT}/><polygon points="-105,-100 0,-165 105,-100" fill="#7b4a22" ${OUT}/><circle cx="-10" cy="-45" r="28" fill="#4a2e12"/><path d="M-60 0 L-40 -22 H20 L40 0Z" fill="#d9b382" ${OUT}/></g>` +
      `<g transform="translate(260 540)"><rect x="-70" y="-60" width="140" height="60" rx="14" fill="#f1c84b" ${OUT}/><path d="M-40 -60 V0 M0 -60 V0 M40 -60 V0" stroke="#b8902a" stroke-width="3"/></g>` +
      `<g transform="translate(470 560)"><rect x="-60" y="-50" width="120" height="50" rx="12" fill="#f1c84b" ${OUT}/></g>` + fence(60, 200, 520);
  } else if (kind === "milk") {
    props = barn(280, 500, 1.6) + fence(560, 1000, 535);
    [1070, 1130].forEach((x) => { props += `<g transform="translate(${x} 540)"><rect x="-26" y="-80" width="52" height="80" rx="8" fill="#b0bec5" ${OUT}/><rect x="-18" y="-96" width="36" height="16" rx="6" fill="#90a4ae" ${OUT}/></g>`; });
  } else if (kind === "beans") {
    for (let x = 70; x < 1200; x += 105) {
      props += `<g><line x1="${x}" y1="250" x2="${x}" y2="560" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/><path d="M${x} 540 q-34 -40 0 -80 q34 -40 0 -80 q-34 -40 0 -80" fill="none" stroke="#3f9b44" stroke-width="9" stroke-linecap="round"/>` +
        `<ellipse cx="${x + 22}" cy="430" rx="5" ry="22" fill="#6bbf59" stroke="#2b6b2f" stroke-width="2" transform="rotate(-18 ${x + 22} 430)"/><ellipse cx="${x - 22}" cy="350" rx="5" ry="22" fill="#6bbf59" stroke="#2b6b2f" stroke-width="2" transform="rotate(18 ${x - 22} 350)"/></g>`;
    }
  } else if (kind === "pick") {
    for (let r = 0; r < 5; r++) {
      const y = 505 + r * 40, sc = 0.6 + r * 0.18;
      for (let x = (r % 2) * 34; x < 1240; x += 70 * sc + 22) {
        props += `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M-22 0 q22 -34 44 0z" fill="#3f9b44" stroke="#2b6b2f" stroke-width="2"/><circle cx="-8" cy="-8" r="6" fill="#e53935"/><circle cx="8" cy="-12" r="6" fill="#e53935"/><circle cx="0" cy="-3" r="5" fill="#e53935"/></g>`;
      }
    }
  } else if (kind === "fun") {
    props = barn(190, 500, 1.3) +
      `<g transform="translate(760 540)"><ellipse rx="130" ry="30" fill="#7a5230" ${OUT}/><ellipse cx="-40" cy="-14" rx="60" ry="22" fill="#8d6139"/></g>` + fence(920, 1140, 540);
  } else if (kind === "custom") {
    [[170, 1], [480, 0.9], [820, 1.1], [1090, 0.9]].forEach(([x, s], i) => {
      props += `<g transform="translate(${x} 550) scale(${s})"><ellipse cy="-26" rx="46" ry="34" fill="#3f9b44" opacity=".8"/><circle cy="-34" r="30" fill="${["#4caf50", "#66bb6a", "#4caf50", "#66bb6a"][i]}" stroke="#2b6b2f" stroke-width="3"/><g fill="none" stroke="#555" stroke-width="4" stroke-dasharray="7 5"><rect x="-44" y="-78" width="88" height="80" rx="8"/></g></g>`;
    });
  } else if (kind === "farm" || kind === "feedback") {
    props = tree(130, 540, 1.2, "") + barn(930, 500, 1.2) + fence(330, 700, 540);
  } else if (kind === "meat") {
    props = `<g transform="translate(900 520)"><rect x="-110" y="-130" width="220" height="130" fill="#8d6e63" ${OUT}/><path d="M-70 -130 V0 M-30 -130 V0 M10 -130 V0 M50 -130 V0 M90 -130 V0" stroke="#5d4037" stroke-width="2"/><polygon points="-125,-130 0,-200 125,-130" fill="#5d4037" ${OUT}/><rect x="60" y="-225" width="30" height="75" fill="#757575" ${OUT}/><rect x="-30" y="-80" width="60" height="80" fill="#3e2723"/>` +
      `<circle class="smoke" cx="75" cy="-245" r="16" fill="#fff" opacity=".8"/><circle class="smoke" style="animation-delay:1.3s" cx="82" cy="-250" r="20" fill="#fff" opacity=".8"/><circle class="smoke" style="animation-delay:2.6s" cx="70" cy="-250" r="14" fill="#fff" opacity=".8"/></g>` + fence(80, 520, 540);
  }
  return `${open}<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky1}"/><stop offset="1" stop-color="${t.sky2}"/></linearGradient></defs>
  <rect width="1200" height="700" fill="url(#skyg)"/>
  <circle cx="1040" cy="110" r="60" fill="#ffe27a" stroke="#f4b400" stroke-width="6"/>
  ${cloud(200, 100, 1)}${cloud(640, 70, 0.8)}${cloud(900, 210, 0.7)}
  <path d="M0 430 Q200 340 420 420 T820 410 T1200 390 V700 H0Z" fill="${t.hill}"/>
  <path d="M0 490 Q300 460 600 490 T1200 480 V700 H0Z" fill="${t.ground}"/>
  ${props}</svg>`;
}
function setScene(kind) {
  if (state.sceneKind === kind) return;
  state.sceneKind = kind;
  $("#scene").innerHTML = sceneSVG(kind);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = (THEMES[kind] || THEMES.home).sky1;
}

/* =====================================================================
   Produce pile: the number of pieces drawn follows the real stock
   ===================================================================== */
function iconCount(qty, maxQty) {
  if (qty <= 0) return 0;
  const cap = CONFIG.MAX_ICONS;
  const full = Math.max(maxQty, qty, 1);
  if (full <= cap) return qty;                       // small stock: one picture per unit
  return Math.max(1, Math.round((qty / full) * cap)); // big stock: scaled to the "full shelf" amount
}
function stageHTML(item) {
  const n = iconCount(item.quantity, item.maxQuantity);
  let pieces = "";
  for (let i = 0; i < n; i++) { // fixed pseudo-random tilt so the pile looks the same on every render
    const r = ((i * 47 + item.id.length * 13) % 40) - 20;
    const d = ((i * 37) % 30) / 10;
    pieces += `<span class="fruit" style="--r:${r}deg;--d:${d}s">${esc(item.icon)}</span>`;
  }
  const c = ["basket", "crate", "skid", "dish", "carton", "sack", "board", "shelf", "pail", "cooler"].includes(item.container) ? item.container : "basket";
  return `<div class="stage c-${c}"><div class="pile">${pieces}</div><div class="vessel"></div></div>`;
}

