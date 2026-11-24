"use strict";
/* =====================================================================
   Pages, forms and start-up.
   Reading guide: helpers > menu > cartoon art > pages > router > weather >
   forms (checkout, reserve, visit, custom, review, help, admin) > start-up.
   ===================================================================== */

const app = $("#app");
const cur = {};          // what the open dialog is about: { reserve: itemId, book: kind, custom: shapeId }
const wxBy = {};         // forecast shown in each dialog, by id prefix
const SUBMIT = {};       // form id -> handler(form)

/* ---------- farmer (admin) mode ---------- */
const admin = { key: (() => { try { return sessionStorage.getItem("adminKey") || ""; } catch { return ""; } })() };
const isAdmin = () => !!admin.key;
function setAdminKey(key) {
  admin.key = key;
  try { if (key) sessionStorage.setItem("adminKey", key); else sessionStorage.removeItem("adminKey"); } catch { /* ignore */ }
  $("#adminBar").hidden = !isAdmin();
}

/* ---------- small helpers ---------- */
const val = (sel) => { const el = $(sel); return el ? el.value.trim() : ""; };
const checked = (sel) => { const el = $(sel); return !!(el && el.checked); };
const cssEsc = (s) => String(s).replace(/[^\w-]/g, "\\$&");
const starText = (n) => "★".repeat(n) + "☆".repeat(5 - n);
function focusEl(sel) {
  const el = $(sel);
  if (!el) return;
  if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 2600);
}
function renderStatus(html) { app.innerHTML = `<div class="status">${html}</div>`; }
const pageHead = (title, sub) =>
  `<div class="cat-head"><a class="back" href="#/">← Back to the farmyard</a><div class="sign"><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div></div>`;
const noticeHTML = () => `<div class="notice">📈 ${esc(state.extras.settings.marketNotice || CONFIG.MARKET_NOTICE)}</div>`;
const farmPhotos = () => state.extras.photos.filter((p) => p.kind === "farm");
const hasPhotoFor = (id) => farmPhotos().some((p) => p.itemId === id);
const methodLabel = (id) => { const m = CONFIG.MEET_METHODS.find((x) => x.id === id); return m ? m.label.replace(/^\S+\s/, "") : ""; };

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}
function updateFab(bump = false) {
  $("#fabN").textContent = basketCount();
  if (bump) { const f = $("#fab"); f.classList.remove("bump"); void f.offsetWidth; f.classList.add("bump"); }
}

/* ---------- side menu ---------- */
const drawer = $("#drawer"), drawerBack = $("#drawerBack"), navTab = $("#navTab");
function buildDrawer() {
  const here = location.hash.replace(/^#\/?/, "").split("/")[0];
  const link = (href, icon, label, id) => `<a href="${href}" class="${here === id ? "here" : ""}">${icon} ${label}</a>`;
  drawer.innerHTML = `<button class="xbtn" data-act="close-drawer" aria-label="Close menu">✕</button><h2>${esc(CONFIG.FARM_NAME)}</h2>` +
    link("#/", "🏠", "Farmyard (home)", "") +
    `<div class="grp">Prices &amp; orders</div><div class="subnav">${CATEGORIES.map((c) => link(`#/${c.id}`, c.emoji, c.label, c.id)).join("")}</div>` +
    `<div class="grp">Visit &amp; explore</div>` +
    link("#/pick", "🍓", "Pick It Yourself", "pick") +
    link("#/fun", "🚜", "Farm Fun Days", "fun") +
    link("#/custom", "🎨", "Custom Creations", "custom") +
    link("#/farm", "📍", "Our Farm &amp; Photos", "farm") +
    link("#/feedback", "💬", "Reviews &amp; Help", "feedback");
}
function openDrawer(open) {
  if (open) buildDrawer();
  drawer.classList.toggle("open", open);
  drawerBack.classList.toggle("open", open);
  navTab.setAttribute("aria-expanded", String(open));
}

/* ---------- trust badges (only the ones you switch on in the Badges tab) ---------- */
function badgesHTML(title = "Our promises & standards") {
  const all = state.extras.badges;
  if (!all.length) return "";
  const chip = (x) => `<span class="badge ${x.kind}"><span class="bi">${esc(x.icon)}</span><span><b>${esc(x.name)}</b><small>${esc(x.detail)}</small></span></span>`;
  const cert = all.filter((x) => x.kind === "certified"), prac = all.filter((x) => x.kind !== "certified");
  return `<div class="panel"><h3>${esc(title)}</h3>
    ${cert.length ? `<div class="subh">Certified</div><div class="badges">${cert.map(chip).join("")}</div>` : ""}
    ${prac.length ? `<div class="subh">How we do things</div><div class="badges">${prac.map(chip).join("")}</div>` : ""}</div>`;
}

/* =====================================================================
   Cartoon art for the activity and custom-shape cards
   ===================================================================== */
const ART_SKY = `<circle cx="250" cy="30" r="18" fill="#ffe27a" stroke="#f4b400" stroke-width="3"/><g fill="#fff" opacity=".95"><ellipse cx="70" cy="30" rx="30" ry="11"/><ellipse cx="52" cy="35" rx="18" ry="8"/><ellipse cx="90" cy="35" rx="20" ry="9"/></g>`;
const ART_GROUND = `<path d="M0 108 Q80 96 160 108 T300 106 V150 H0Z" fill="#6fbf4a"/>`;
const ART_O = 'stroke="#4a2e12" stroke-width="3" stroke-linejoin="round"';
const artSvg = (label, inner) => `<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">${inner}</svg>`;

function activityArt(a) {
  if (a.art === "tractor") {
    return artSvg("Cartoon tractor driving by", `${ART_SKY}${ART_GROUND}<g class="drive"><g class="rig">
      <rect x="62" y="60" width="6" height="22" fill="#555"/>
      <rect x="62" y="74" width="66" height="28" rx="7" fill="#d83b2f" ${ART_O}/>
      <rect x="98" y="46" width="38" height="40" rx="6" fill="#d83b2f" ${ART_O}/>
      <rect x="104" y="52" width="24" height="20" rx="3" fill="#cfeaff" stroke="#4a2e12" stroke-width="2"/>
      <circle cx="116" cy="63" r="6" fill="#f4c79c"/><path d="M108 58h16" stroke="#8c3b2a" stroke-width="4"/>
      <g class="wheel"><circle cx="122" cy="104" r="22" fill="#333" ${ART_O}/><circle cx="122" cy="104" r="9" fill="#e8c44a"/><path d="M122 84v40M102 104h40" stroke="#222" stroke-width="3"/></g>
      <g class="wheel"><circle cx="76" cy="108" r="13" fill="#333" ${ART_O}/><circle cx="76" cy="108" r="5" fill="#e8c44a"/><path d="M76 95v26M63 108h26" stroke="#222" stroke-width="3"/></g>
    </g></g>`);
  }
  if (a.art === "excavator") {
    return artSvg("Cartoon excavator digging a hole", `${ART_SKY}${ART_GROUND}
      <ellipse class="mound" cx="252" cy="116" rx="38" ry="16" fill="#8a5a34" ${ART_O}/>
      <ellipse cx="198" cy="124" rx="24" ry="6" fill="#4a2e12"/>
      <rect x="34" y="104" width="100" height="24" rx="12" fill="#444" ${ART_O}/>
      <circle cx="52" cy="116" r="8" fill="#888"/><circle cx="116" cy="116" r="8" fill="#888"/>
      <rect x="48" y="68" width="62" height="40" rx="7" fill="#f6b81b" ${ART_O}/>
      <rect x="58" y="74" width="26" height="20" rx="3" fill="#cfeaff" stroke="#4a2e12" stroke-width="2"/>
      <g class="boom"><path d="M100 80 L170 40" stroke="#4a2e12" stroke-width="16" stroke-linecap="round"/><path d="M100 80 L170 40" stroke="#f6b81b" stroke-width="11" stroke-linecap="round"/>
        <g class="stick"><path d="M170 40 L198 100" stroke="#4a2e12" stroke-width="14" stroke-linecap="round"/><path d="M170 40 L198 100" stroke="#f6b81b" stroke-width="9" stroke-linecap="round"/>
        <path d="M190 98 l24 -6 l-8 22 l-22 0z" fill="#9aa5ad" ${ART_O}/></g></g>`);
  }
  if (a.art === "gold") {
    return artSvg("Cartoon gold pan with sparkling nuggets", `<rect width="300" height="150" fill="#9fd6f5"/>
      <path d="M0 96 L60 36 L110 84 L170 28 L240 96 Z" fill="#8c98a6" ${ART_O}/><path d="M0 108 Q150 92 300 108 V150 H0Z" fill="#5aa9d6"/>
      <ellipse cx="150" cy="106" rx="78" ry="25" fill="#6c7a89" ${ART_O}/><ellipse cx="150" cy="102" rx="64" ry="18" fill="#4aa3d8"/>
      <g class="swirl"><path d="M106 102 q22 -10 44 0 t44 0" stroke="#d7f0ff" stroke-width="3" fill="none" stroke-linecap="round"/></g>
      <circle cx="138" cy="104" r="5" fill="#ffd54a" stroke="#b8860b" stroke-width="1.5"/><circle cx="160" cy="100" r="4" fill="#ffd54a" stroke="#b8860b" stroke-width="1.5"/><circle cx="172" cy="106" r="3.5" fill="#ffd54a" stroke="#b8860b" stroke-width="1.5"/>
      <text class="twinkle" style="--d:0s" x="92" y="66" font-size="22">✨</text><text class="twinkle" style="--d:.5s" x="196" y="60" font-size="26">✨</text><text class="twinkle" style="--d:1s" x="138" y="56" font-size="18">✨</text>`);
  }
  return `<div class="bigemoji">${esc(a.icon)}</div>`;
}

function shapeArt(s) {
  const cages = {
    heart: `<path d="M150 118 C60 70 85 22 125 36 C140 41 148 54 150 60 C152 54 160 41 175 36 C215 22 240 70 150 118Z"/>`,
    cube: `<rect x="105" y="38" width="90" height="80" rx="6"/>`,
    star: `<polygon points="150,26 164,62 202,64 172,88 183,124 150,103 117,124 128,88 98,64 136,62"/>`,
    pyramid: `<polygon points="150,28 208,118 92,118"/>`
  };
  return artSvg(`Cartoon ${s.name} growing inside a cage`, `<path d="M0 120 Q80 108 160 120 T300 118 V150 H0Z" fill="#6fbf4a"/>
    <path d="M14 124 q40 -30 70 -6 M214 122 q40 -30 70 -4" stroke="#3f9b44" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g class="grow"><text x="150" y="100" text-anchor="middle" font-size="58">${esc(s.icon)}</text></g>
    <g fill="none" stroke="#555" stroke-width="4" stroke-dasharray="7 5" stroke-linejoin="round">${cages[s.art] || cages.heart}</g>`);
}

/* =====================================================================
   Home and the shop (price & order) pages
   ===================================================================== */
function renderHome(intro = true) {
  setScene("home");
  const tiles = CATEGORIES.map((c, i) => {
    const mine = state.items.filter((it) => it.category === c.id);
    const inStock = mine.filter((it) => it.quantity > 0).length;
    const badge = mine.length === 0 ? "Coming soon" : inStock === 0 ? "All sold out" : `${inStock} item${inStock > 1 ? "s" : ""} available`;
    return `<a class="tile ${intro ? "intro" : ""}" href="#/${c.id}" style="animation-delay:${i * 60}ms" data-snd="pop">
      <span class="em">${c.emoji}</span><span class="nm">${c.label}</span><span class="bl">${c.blurb}</span><span class="ct">${badge}</span></a>`;
  }).join("");
  const x = state.extras, promos = [];
  if (x.settings.upickEnabled !== false) promos.push(`<a class="promo pick" href="#/pick" data-snd="pop"><span class="big">🍓</span><div><b>Pick It Yourself!</b><span>Fill a bucket, work off lunch, take home the good stuff.</span></div></a>`);
  if (x.activities.length) promos.push(`<a class="promo fun" href="#/fun" data-snd="honk"><span class="big">🚜</span><div><b>Farm Fun Days</b><span>Drive a tractor, dig with an excavator, pan for real gold!</span></div></a>`);
  if (x.shapes.length) promos.push(`<a class="promo custom" href="#/custom" data-snd="pop"><span class="big">🎨</span><div><b>Custom Creations</b><span>Heart-shaped watermelons and other fruit made to order.</span></div></a>`);
  app.innerHTML = `<section class="page-wrap">
    <div class="center"><div class="sign"><h1>${esc(CONFIG.FARM_NAME)}</h1><p>${esc(CONFIG.TAGLINE)}</p></div></div>
    ${noticeHTML()}
    <div class="welcome">
      <button class="farmer-btn" id="farmerBtn" type="button" aria-label="Say howdy to the farmer">${farmerSVG()}</button>
      <div class="bubble">${esc(CONFIG.WELCOME)}</div>
    </div>
    <h2 class="pick">Pick a spot to browse</h2>
    <div class="tiles">${tiles}</div>
    ${promos.length ? `<div class="promos">${promos.join("")}</div>` : ""}
    <div class="quick"><a class="alt" href="#/farm">📍 Find the farm</a><a class="alt" href="#/feedback">💬 Reviews &amp; help</a></div>
    ${badgesHTML()}
  </section>`;
}

function dealsHTML(item) {
  let h = "";
  if (bulkActive(item)) {
    const pct = Math.round((1 - item.bulkPrice / item.price) * 100);
    h += `<span class="deal">🎉 Bulk deal: ${item.bulkMin}+ at ${money(item.bulkPrice)} each (save ${pct}%)</span>`;
  }
  if (reserveOpen(item)) {
    const range = item.harvestStart ? `${fmtDate(item.harvestStart)} to ${fmtDate(item.harvestEnd)}` : `by ${fmtDate(item.harvestEnd)}`;
    h += `<span class="deal resv">🌱 Reserve for harvest ${range}${item.reservePrice > 0 ? ` at ${money(item.reservePrice)}` : ""}</span>`;
  }
  return h ? `<div class="deals">${h}</div>` : "";
}

function cardHTML(item, intro) {
  const out = item.quantity <= 0;
  const low = !out && item.quantity <= Math.max(2, Math.ceil(item.maxQuantity * 0.2));
  const inBasket = state.basket[item.id] || 0;
  const room = Math.max(0, item.quantity - inBasket);
  const qty = clamp(state.pending[item.id] || 1, 1, Math.max(1, room));
  state.pending[item.id] = qty;
  const canBulk = bulkActive(item) && room >= item.bulkMin;
  const canReserve = reserveOpen(item);
  return `<article class="card ${intro ? "intro" : ""}" data-id="${esc(item.id)}">
    ${out ? '<div class="stamp">SOLD OUT</div>' : ""}
    <header><h3>${esc(item.name)}</h3><div class="price">${priceLabel(item)}</div></header>
    <div class="desc">${esc(item.description)}</div>
    ${dealsHTML(item)}
    <div class="shelf-row">
      ${stageHTML(item)}
      <div class="bignum ${out ? "out" : low ? "low" : ""}"><b>${item.quantity}</b><span>${out ? "left" : esc(item.unit) + " left"}</span></div>
    </div>
    ${low ? '<p class="lowtag">Hurry! Not much left.</p>' : ""}
    <div class="buy">
      <div class="stepper">
        <button type="button" data-act="dec" data-id="${esc(item.id)}" aria-label="Fewer" ${qty <= 1 || room === 0 ? "disabled" : ""}>−</button>
        <input class="qty" type="number" inputmode="numeric" min="1" max="${room}" value="${room === 0 ? 0 : qty}" data-id="${esc(item.id)}" aria-label="Quantity" ${room === 0 ? "disabled" : ""}>
        <button type="button" data-act="inc" data-id="${esc(item.id)}" aria-label="More" ${qty >= room ? "disabled" : ""}>+</button>
      </div>
      <button class="add" type="button" data-act="add" data-id="${esc(item.id)}" ${room === 0 ? "disabled" : ""}>
        ${out ? "Sold out" : room === 0 ? "All in your basket" : "Add to basket"}</button>
    </div>
    ${canBulk || canReserve ? `<div class="buy">
      ${canBulk ? `<button class="alt" type="button" data-act="bulk" data-id="${esc(item.id)}">🎉 Grab bulk (${item.bulkMin})</button>` : ""}
      ${canReserve ? `<button class="alt blue" type="button" data-act="reserve" data-id="${esc(item.id)}">🌱 Reserve ahead</button>` : ""}</div>` : ""}
    ${hasPhotoFor(item.id) ? `<a class="mini-link" href="#/farm/${esc(item.id)}">📷 See it growing on the farm</a>` : ""}
  </article>`;
}

function renderCategory(catId, { intro = true } = {}) {
  const cat = CATEGORIES.find((c) => c.id === catId);
  setScene(catId);
  const mine = state.items.filter((it) => it.category === catId);
  app.innerHTML = `<section data-cat="${catId}" class="page-wrap">
    ${pageHead(`${cat.emoji} ${cat.label}`, "")}
    ${noticeHTML()}
    ${mine.length ? `<div class="cards">${mine.map((it) => cardHTML(it, intro)).join("")}</div>` : `<div class="empty">Nothing on the shelf right now. Check back soon! 🌱</div>`}
  </section>`;
}

/* =====================================================================
   Pick It Yourself, Farm Fun Days, Custom Creations
   ===================================================================== */
function renderPick() {
  setScene("pick");
  const s = state.extras.settings, open = s.upickEnabled !== false, fee = Number(s.upickEntryFee) || 0;
  const picks = state.extras.upick;
  app.innerHTML = `<section class="page-wrap">
    ${pageHead("🍓 Pick It Yourself!", "Real farm fun. Real fresh food.")}
    ${noticeHTML()}
    <div class="chase" data-snd="cluck" aria-hidden="true"><span class="say">Catch that melon!</span><div class="m">🍉</div><div class="f"><span>🧑‍🌾</span></div></div>
    ${open ? `<div class="panel"><h3>Be a farmer for a day</h3>
      <div class="feeBox"><div class="fee">${fee > 0 ? money(fee) : "Free"}</div>
        <div><b>${fee > 0 ? "per person to come in" : "to come in"}</b>${s.upickIncludes ? `<br>Includes ${esc(s.upickIncludes)}.` : ""}<br>Pick whatever you like. We weigh it on the way out at a friendly farm price. 😉</div></div>
      <p class="soft">Curious about the per-pound rate? Ask in your booking note and I'll tell you before you come.</p></div>`
    : `<div class="panel"><h3>Picking days are on a break</h3><p>Check back soon, or browse the farm stand!</p></div>`}
    ${picks.length ? `<div class="panel"><h3>Ready to pick right now</h3><div class="chips">${picks.map((p) =>
      `<span class="chip">${esc(p.icon)} ${esc(p.name)}${p.picking ? ` <small>${esc(p.picking)}</small>` : ""}</span>`).join("")}</div></div>` : ""}
    <div class="panel"><h3>How a picking day goes</h3><div class="comic">
      <div class="cp p1"><div class="e a">🧑‍🌾</div><div class="e b">🪣</div><div class="cap">1. Grab a bucket!</div></div>
      <div class="cp p2"><div class="e berry" style="--d:0s">🍓</div><div class="e berry" style="--d:.8s">🍓</div><div class="e berry" style="--d:1.6s">🍓</div><div class="e b">🪣</div><div class="cap">2. Pick the juicy ones!</div></div>
      <div class="cp p3"><div class="e a">⚖️</div><div class="e q">❓</div><div class="cap">3. Weigh at the exit. Friendly farm price!</div></div>
      <div class="cp p4"><div class="e a">😴</div><div class="e z" style="--d:0s">Z</div><div class="e z" style="--d:1.2s">z</div><div class="cap">4. Nap under the tree (optional)</div></div>
    </div></div>
    <div class="panel"><h3>Why you'll love it</h3>
      <ul class="perks"><li>💪 A free workout. No gym membership needed.</li><li>🌤️ Fresh air, sunshine and zero screens.</li>
        <li>👧 Kids love it (and they sleep great afterwards).</li><li>🥕 The freshest food you've ever tasted, picked by you.</li>
        <li>🤠 Bring a hat, sunscreen and shoes you don't mind getting dirty.</li></ul>
      <div class="cta" style="margin-top:12px">${open ? `<button class="btn go" type="button" data-act="book" data-kind="upick" style="flex:0 1 auto">📅 Book my picking visit</button>` : ""}
        <a class="btn" href="#/fun" style="flex:0 1 auto">🚜 Farm Fun Days</a></div></div>
  </section>`;
}

function activityCard(a) {
  const unit = a.per === "group" ? "group" : "person";
  return `<article class="card intro">
    <div class="art">${activityArt(a)}</div>
    <header><h3>${esc(a.icon)} ${esc(a.name)}</h3><div class="price">${money(a.price)} / ${unit}</div></header>
    <div class="desc">${esc(a.description)}</div>
    <div class="deals">${a.duration ? `<span class="deal">⏱️ ${esc(a.duration)}</span>` : ""}${a.minAge ? `<span class="deal resv">Ages ${a.minAge}+</span>` : ""}${a.includes ? `<span class="deal">✔ ${esc(a.includes)}</span>` : ""}</div>
    <div class="buy"><button class="add" type="button" data-act="book" data-kind="${esc(a.id)}">Request this adventure</button></div>
  </article>`;
}

function renderFun() {
  setScene("fun");
  const list = state.extras.activities;
  app.innerHTML = `<section class="page-wrap">
    ${pageHead("🚜 Farm Fun Days", "Tractors, excavators and real gold mining")}
    <div class="welcome" style="margin:0"><div style="width:min(200px,48vw)">${farmerSVG()}</div>
      <div class="bubble" style="margin-bottom:60px">Ever dreamed of driving a tractor, digging a great big hole, or striking gold? Pick your adventure, y'all!</div></div>
    <div class="panel"><h3>Safety first</h3>
      <p>Every adventure starts with a short safety talk. Wear closed-toe shoes, kids stay with an adult, and our guide is right beside you on the machines. Minimum ages apply, and we may pause or reschedule for bad weather.</p></div>
    ${list.length ? `<div class="cards">${list.map(activityCard).join("")}</div>` : `<div class="empty">New adventures are coming soon! 🚧</div>`}
  </section>`;
}

function renderCustom() {
  setScene("custom");
  const shapes = state.extras.shapes;
  const card = (s) => `<article class="card intro">
    <div class="art">${shapeArt(s)}</div>
    <header><h3>${esc(s.icon)} ${esc(s.name)}</h3><div class="price">+${money(s.extraCharge)} each</div></header>
    <div class="desc">${esc(s.description)}</div>
    <div class="deals"><span class="deal">${esc(s.fruit)}</span><span class="deal resv">⏱️ about ${s.leadWeeks} weeks to grow</span></div>
    <div class="buy"><button class="add" type="button" data-act="custom" data-id="${esc(s.id)}">Request this shape</button></div></article>`;
  app.innerHTML = `<section class="page-wrap">
    ${pageHead("🎨 Custom Creations", "Fruit grown into a shape of your choice")}
    ${noticeHTML()}
    <div class="welcome" style="margin:0"><div style="width:min(200px,48vw)">${farmerSVG()}</div>
      <div class="bubble" style="margin-bottom:60px">Ever seen a heart-shaped watermelon? I grow 'em in cages so they ripen into the shape you pick. Perfect for gifts!</div></div>
    <div class="panel"><h3>How it works</h3><div class="steps">
      <div class="step"><b>1️⃣</b>Pick a shape</div><div class="step"><b>2️⃣</b>We plant it and fit the cage</div>
      <div class="step"><b>3️⃣</b>It grows into the shape</div><div class="step"><b>4️⃣</b>You pick it up when it's ripe</div></div>
      <p class="soft">You pay a small extra charge per item, plus the normal fruit price at harvest. Nothing is paid online. Growing is natural, so we'll confirm by phone or email once the fruit is on the vine.</p></div>
    ${shapes.length ? `<div class="cards">${shapes.map(card).join("")}</div>` : `<div class="empty">Custom shapes are coming soon! 🌱</div>`}
  </section>`;
}

/* =====================================================================
   Our Farm (map + real photos), Reviews & Help, Farmer login
   ===================================================================== */
function photoHTML(p) {
  const item = p.itemId ? itemById(p.itemId) : null;
  const alt = p.title || (item ? item.name : "Farm photo");
  const img = p.src
    ? `<img src="${esc(p.src)}" alt="${esc(alt)}" loading="lazy">`
    : `<div class="ph"><span>${esc(p.placeholderIcon || (item && item.icon) || "📷")}</span><small>Real photo goes here</small></div>`;
  const tilt = ((p.id.length * 7) % 5) - 2;
  return `<figure class="photo" data-item="${esc(p.itemId)}" style="--tilt:${tilt * 0.6}deg">${img}
    <figcaption>${p.title ? `<span>${esc(p.title)}</span>` : ""}
      ${item ? `<a class="alt blue" href="#/${esc(item.category)}/${esc(item.id)}">🛒 Order ${esc(item.name)} · ${priceLabel(item)}</a>` : ""}
      ${isAdmin() ? `<button class="alt" type="button" data-act="del-photo" data-id="${esc(p.id)}">🗑️ Remove photo</button>` : ""}</figcaption></figure>`;
}

function uploadHTML(kind) {
  if (!isAdmin()) return "";
  const items = kind === "farm"
    ? `<label class="f" for="upItem">Which food is this? (links the photo to its order page)</label>
       <select class="t" id="upItem"><option value="">(none)</option>${state.items.map((i) => `<option value="${esc(i.id)}">${esc(i.icon)} ${esc(i.name)}</option>`).join("")}</select>` : "";
  return `<form class="panel upl" id="uploadForm" data-kind="${kind}" novalidate>
    <h3>📤 Add a ${kind === "farm" ? "farm" : "happy-moments"} photo</h3>${items}
    <label class="f" for="upTitle">Caption</label><input class="t" id="upTitle" maxlength="120">
    <label class="f" for="upFile">Picture</label><input class="t" id="upFile" type="file" accept="image/*">
    <p class="err" id="upErr" role="alert"></p>
    <div class="row"><button class="btn go" id="upBtn" type="submit">Upload</button></div></form>`;
}

function mapHTML(address) {
  const q = encodeURIComponent(address);
  return `<div class="mapwrap"><iframe title="Map to the farm" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${q}&amp;output=embed"></iframe></div>
    <div class="cta"><a class="btn go" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&amp;destination=${q}" style="flex:0 1 auto">🧭 Get directions</a></div>`;
}

function renderFarm() {
  setScene("farm");
  const s = state.extras.settings, address = s.farmAddress || CONFIG.FARM_ADDRESS, photos = farmPhotos();
  const phone = s.farmPhone ? `<p><b>Phone:</b> <a href="tel:${esc(s.farmPhone.replace(/[^\d+]/g, ""))}">${esc(s.farmPhone)}</a></p>` : "";
  app.innerHTML = `<section class="page-wrap">
    ${pageHead("📍 Our Farm", "Come see where it grows")}
    <div class="panel"><h3>Welcome to ${esc(CONFIG.FARM_NAME)}</h3>
      ${s.farmStory ? `<p>${esc(s.farmStory)}</p>` : ""}${s.farmHours ? `<p><b>Visiting:</b> ${esc(s.farmHours)}</p>` : ""}${phone}
      ${address ? `<p><b>Where:</b> ${esc(address)}</p>` : ""}</div>
    ${address ? mapHTML(address) : `<div class="panel"><h3>Map</h3><p>The farm address is coming soon. Send us a message and we'll share it!</p></div>`}
    ${badgesHTML()}
    <div class="panel"><h3>Real photos from the farm</h3>
      <p class="soft">Tap "Order" under a photo to jump to that food's price and order page.</p>
      ${photos.length ? `<div class="photos">${photos.map(photoHTML).join("")}</div>` : "<p>Photos are on the way!</p>"}</div>
    ${uploadHTML("farm")}
  </section>`;
}

function reviewHTML(r) {
  return `<div class="rev"><div class="who">
      <span class="kindtag">${r.kind === "suggestion" ? "💡 Suggestion" : "⭐ Review"}</span><span>${esc(r.name)}</span>
      ${r.rating ? `<span class="starline" aria-label="${r.rating} out of 5 stars">${starText(r.rating)}</span>` : ""}<small>${esc(r.date)}</small>
      ${isAdmin() ? `<button class="alt" type="button" data-act="del-review" data-id="${esc(r.id)}" style="margin-left:auto;padding:2px 10px;font-size:13px">🗑️ Delete</button>` : ""}</div>
    <p>${esc(r.message)}</p></div>`;
}

function renderFeedback() {
  setScene("feedback");
  const c = state.community, moments = state.extras.photos.filter((p) => p.kind === "moment");
  state.rating = 0;
  app.innerHTML = `<section class="page-wrap">
    ${pageHead("💬 Reviews & Help", "Tell us how we're doing")}
    <form class="panel" id="reviewForm" novalidate>
      <h3>✍️ Leave a review or suggestion</h3>
      <div class="radio-row"><label><input type="radio" name="rvKind" value="review" checked> ⭐ Review</label><label><input type="radio" name="rvKind" value="suggestion"> 💡 Suggestion</label></div>
      <div id="rvStarsBox"><label class="f">How was it?</label><div class="stars" id="rvStars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-act="star" data-n="${n}" aria-label="${n} stars">★</button>`).join("")}</div></div>
      <label class="f" for="rvName">Your name (optional)</label><input class="t" id="rvName" maxlength="40">
      <label class="f" for="rvMsg">Your message *</label><textarea class="t" id="rvMsg" maxlength="600"></textarea>
      <label class="f" for="rvContact">Email or phone (optional, only the farmer sees it)</label><input class="t" id="rvContact" maxlength="120">
      <div class="hp" aria-hidden="true"><label>Website<input id="rvWebsite" type="text" tabindex="-1" autocomplete="off"></label></div>
      <p class="err" id="rvErr" role="alert"></p>
      <div class="row"><button class="btn go" id="rvBtn" type="submit">Post it 🌻</button></div>
    </form>
    <div class="panel"><h3>What folks are saying</h3>
      ${c.ratedCount ? `<div><span class="avg">${c.avg.toFixed(1)}</span> <span class="starline">${starText(Math.round(c.avg))}</span> <small>from ${c.ratedCount} rating${c.ratedCount > 1 ? "s" : ""}</small></div>` : ""}
      ${state.communityError ? `<p class="err">${esc(state.communityError)}</p>` : ""}
      ${c.reviews.length ? c.reviews.map(reviewHTML).join("") : "<p>Be the first to leave a review!</p>"}</div>
    <form class="panel" id="messageForm" novalidate>
      <h3>🛎️ Need help? Send me a private message</h3>
      <p class="soft">Only the farmer sees this. Great for order questions, problems, or special requests.</p>
      ${personHTML("ms", {})}
      <label class="f" for="msTopic">What's it about?</label>
      <select class="t" id="msTopic"><option>Question</option><option>Problem with an order</option><option>Special request</option><option>Other</option></select>
      <label class="f" for="msMsg">Message *</label><textarea class="t" id="msMsg" maxlength="800"></textarea>
      <div class="hp" aria-hidden="true"><label>Website<input id="msWebsite" type="text" tabindex="-1" autocomplete="off"></label></div>
      <p class="err" id="msErr" role="alert"></p>
      <div class="row"><button class="btn go" id="msBtn" type="submit">Send message</button></div>
    </form>
    <div class="panel"><h3>📸 Happy moments</h3>
      <p class="soft">Good times with our customers and neighbors.</p>
      ${moments.length ? `<div class="photos">${moments.map(photoHTML).join("")}</div>` : "<p>Photos coming soon!</p>"}</div>
    ${uploadHTML("moment")}
  </section>`;
}

function renderAdmin() {
  setScene("feedback");
  if (isAdmin()) {
    app.innerHTML = `<section class="page-wrap">${pageHead("👨‍🌾 Farmer mode", "You're logged in")}
      <div class="panel"><h3>What you can do now</h3><ul class="perks">
        <li>On <a href="#/feedback">Reviews &amp; Help</a>, delete buttons appear on every post, and you can upload happy-moments photos.</li>
        <li>On <a href="#/farm">Our Farm</a>, you can upload real photos and link each one to a food, so customers can jump to its order page.</li>
        <li>Stock, prices, deals, activities, shapes and badges are edited in your Google Sheet. Customers, Sales and Insights tabs hold your customer database.</li></ul>
        <div class="cta" style="margin-top:12px"><button class="btn" type="button" data-act="logout" style="flex:0 1 auto">Log out</button></div></div></section>`;
    return;
  }
  app.innerHTML = `<section class="page-wrap">${pageHead("👨‍🌾 Farmer login", "")}
    <form class="panel" id="adminForm" novalidate><h3>Enter your farmer key</h3>
      <p class="soft">This is the private key you set as ADMIN_KEY in your Google Apps Script.${CONFIG.APPS_SCRIPT_URL ? "" : ` In demo mode the key is <b>${DEMO_KEY}</b>.`}</p>
      <label class="f" for="adKey">Farmer key</label><input class="t" id="adKey" type="password" autocomplete="current-password">
      <p class="err" id="adErr" role="alert"></p>
      <div class="row"><button class="btn go" id="adBtn" type="submit">Log in</button></div></form></section>`;
}

/* =====================================================================
   Router
   ===================================================================== */
let routeToken = 0;
async function route() {
  const token = ++routeToken;
  const [seg = "", sub = ""] = location.hash.replace(/^#\/?/, "").split("/");
  window.scrollTo(0, 0);
  openDrawer(false);
  if (state.loadError && !state.loaded) {
    renderStatus(`${esc(state.loadError)}<br><br><button class="btn go" id="retry" type="button">Try again</button>`);
    $("#retry").addEventListener("click", init);
    return;
  }
  if (!state.loaded) { renderStatus("🐓 Fetching the eggs and tomatoes…"); return; }
  if (seg === "feedback") {
    renderStatus("💬 Loading what folks are saying…");
    await loadReviews();
    if (token !== routeToken) return; // the visitor moved on while we were loading
  }
  const pages = { pick: renderPick, fun: renderFun, custom: renderCustom, farm: renderFarm, feedback: renderFeedback, admin: renderAdmin };
  if (CATEGORIES.some((c) => c.id === seg)) renderCategory(seg);
  else if (pages[seg]) pages[seg]();
  else renderHome();
  if (sub) setTimeout(() => focusEl(seg === "farm" ? `.photo[data-item="${cssEsc(sub)}"]` : `.card[data-id="${cssEsc(sub)}"]`), 150);
}
function refreshView() { // re-draw stock pages without replaying the intro animation
  if (!state.loaded) return;
  const seg = location.hash.replace(/^#\/?/, "").split("/")[0];
  if (CATEGORIES.some((c) => c.id === seg)) renderCategory(seg, { intro: false });
  else if (!seg) renderHome(false);
}

/* =====================================================================
   Weather check (Open-Meteo: free, no key)
   ===================================================================== */
const wxCache = {};
const WX_LABELS = (code) => {
  if (code === 0) return ["☀️", "clear skies"];
  if (code <= 3) return ["⛅", "partly cloudy"];
  if (code <= 48) return ["🌫️", "foggy"];
  if (code <= 57) return ["🌦️", "drizzle"];
  if (code <= 67) return ["🌧️", "rain"];
  if (code <= 77) return ["🌨️", "snow"];
  if (code <= 82) return ["🌧️", "rain showers"];
  if (code <= 86) return ["🌨️", "snow showers"];
  return ["⛈️", "thunderstorms"];
};
async function getWeather(dateStr) {
  if (wxCache[dateStr] !== undefined) return wxCache[dateStr];
  try {
    const url = "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${CONFIG.FARM_LAT}&longitude=${CONFIG.FARM_LON}` +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max" +
      "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=16";
    const res = await fetch(url);
    const d = (await res.json()).daily;
    const i = d.time.indexOf(dateStr);
    if (i < 0) { wxCache[dateStr] = null; return null; }
    const w = {
      code: d.weather_code[i], hi: Math.round(d.temperature_2m_max[i]), lo: Math.round(d.temperature_2m_min[i]),
      rain: d.precipitation_sum[i] || 0, chance: d.precipitation_probability_max[i] || 0, gust: Math.round(d.wind_gusts_10m_max[i] || 0)
    };
    const snowOrIce = (w.code >= 66 && w.code <= 67) || (w.code >= 71 && w.code <= 77) || w.code === 85 || w.code === 86;
    w.risky = w.code >= 95 || snowOrIce || w.chance >= CONFIG.RAIN_CHANCE_WARN || w.rain >= CONFIG.HEAVY_RAIN_IN || w.gust >= CONFIG.GUST_WARN_MPH;
    [w.icon, w.label] = WX_LABELS(w.code);
    wxCache[dateStr] = w;
    return w;
  } catch { wxCache[dateStr] = null; return null; }
}
function weatherHTML(w) {
  if (w === undefined) return "";
  if (w === null) return `<div class="wx">🌤️ No forecast available for that day yet. You can still cancel any time with your cancel code.</div>`;
  const line = `${w.icon} ${w.label}, ${w.lo}–${w.hi}°F, ${w.chance}% chance of rain`;
  return w.risky
    ? `<div class="wx bad"><b>Heads up!</b> ${line}${w.gust >= CONFIG.GUST_WARN_MPH ? `, gusts to ${w.gust} mph` : ""}. Rough weather is possible that day. No worries: you can cancel for free any time with the cancel code you'll get.</div>`
    : `<div class="wx">${line}. Looks like a fine day!</div>`;
}
const weatherNote = (w) => (w ? `${w.label}, ${w.lo}-${w.hi}F, ${w.chance}% rain, gusts ${w.gust} mph${w.risky ? " (WEATHER WARNING SHOWN)" : ""}` : "forecast unavailable");
async function showWx(p, date) {
  const box = $(`#${p}Wx`);
  if (!box) return;
  if (!date) { box.innerHTML = ""; wxBy[p] = undefined; return; }
  box.innerHTML = `<div class="wx">Checking the forecast…</div>`;
  const w = await getWeather(date);
  wxBy[p] = w;
  const field = $(`#${p}Date`);
  if (field && field.value === date) box.innerHTML = weatherHTML(w);
}

/* =====================================================================
   Shared form pieces. Each dialog uses its own id prefix: c, r, v, k, ms
   ===================================================================== */
function personHTML(p, f) {
  return `<label class="f" for="${p}Name">Your name *</label>
    <input class="t" id="${p}Name" type="text" autocomplete="name" maxlength="80" value="${esc(f.name || "")}">
    <div class="two">
      <div><label class="f" for="${p}Phone">Phone</label><input class="t" id="${p}Phone" type="tel" autocomplete="tel" maxlength="30" value="${esc(f.phone || "")}"></div>
      <div><label class="f" for="${p}Email">Email</label><input class="t" id="${p}Email" type="email" autocomplete="email" maxlength="120" value="${esc(f.email || "")}"></div>
    </div>
    <small>Phone or email (at least one) so I can reach you.</small>`;
}
function methodHTML(p, f) {
  return `<label class="f">How should we meet? *</label>
    <div class="methods">${CONFIG.MEET_METHODS.map((m) => `<label><input type="radio" name="${p}method" value="${m.id}" ${f.method === m.id ? "checked" : ""}>${esc(m.label)}</label>`).join("")}</div>
    <div id="${p}MethodExtra"></div>`;
}
function optHTML(p, f) {
  return `<label class="chk"><input type="checkbox" id="${p}Opt" ${f.opt ? "checked" : ""}> 💌 OK to contact me about next season's harvest (optional)</label>`;
}
const honeypot = (p) => `<div class="hp" aria-hidden="true"><label>Website<input id="${p}Website" type="text" tabindex="-1" autocomplete="off"></label></div>`;
const readPerson = (p) => ({ name: val(`#${p}Name`), phone: val(`#${p}Phone`), email: val(`#${p}Email`) });
function readMethod(p) {
  const m = $(`input[name="${p}method"]:checked`);
  return { method: m ? m.value : "", extra: val(`#${p}Extra`) };
}
function updateMethodExtra(p, value) {
  const box = $(`#${p}MethodExtra`);
  if (!box) return;
  const old = $(`#${p}Extra`);
  const keep = value !== undefined ? value : old ? old.value : "";
  const m = $(`input[name="${p}method"]:checked`);
  const def = m && CONFIG.MEET_METHODS.find((x) => x.id === m.value);
  if (!def || !def.needs) { box.innerHTML = ""; return; }
  const gift = p === "c" && checked("#cGift");
  const label = def.needs === "address" ? (gift ? "Delivery address (where should the gift go?) *" : "Delivery address *") : "How should we do it? *";
  box.innerHTML = `<label class="f" for="${p}Extra">${label}</label><textarea class="t" id="${p}Extra" maxlength="250">${esc(keep)}</textarea>`;
}
function checkContact(v, p) {
  if (!v.name) return { msg: "Please tell me your name.", sel: `#${p}Name` };
  if (!v.phone && !v.email) return { msg: "Please add a phone number or an email so I can reach you.", sel: `#${p}Phone` };
  if (v.phone && v.phone.replace(/\D/g, "").length < 7) return { msg: "That phone number looks too short.", sel: `#${p}Phone` };
  if (v.email && !EMAIL_RE.test(v.email)) return { msg: "That email doesn't look right.", sel: `#${p}Email` };
  return null;
}
function checkMethod(v, p) {
  const def = CONFIG.MEET_METHODS.find((m) => m.id === v.method);
  if (!def) return { msg: "Please choose how we should meet." };
  if (def.needs && !v.extra) return { msg: def.needs === "address" ? "Please enter the delivery address." : "Please tell me how you'd like to do it.", sel: `#${p}Extra` };
  return null;
}
function showErr(p, problem) {
  const el = $(`#${p}Err`);
  if (el) el.textContent = problem.msg;
  if (problem.sel && $(problem.sel)) $(problem.sel).focus();
}
async function withSending(p, label, work) {
  const btn = $(`#${p}Btn`), err = $(`#${p}Err`);
  if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
  try { await work(err); }
  catch (ex) {
    console.error(ex);
    if ($(`#${p}Err`)) $(`#${p}Err`).textContent = "Couldn't reach the farm. Please check your connection and try again.";
  } finally {
    const b = $(`#${p}Btn`);
    if (b) { b.disabled = false; b.textContent = label; }
  }
}

/* =====================================================================
   Checkout (buy now)
   ===================================================================== */
const checkoutDlg = $("#checkout");
function basketLines() {
  return Object.entries(state.basket).map(([id, qty]) => ({ item: itemById(id), qty })).filter((l) => l.item)
    .map((l) => ({ ...l, unit: unitPrice(l.item, l.qty) }));
}
function openCheckout() {
  if (!basketCount()) { toast("Your basket is empty. Pick something tasty first! 🍅"); return; }
  wxBy.c = undefined;
  renderCheckout();
  if (!checkoutDlg.open) checkoutDlg.showModal();
}
function renderCheckout(keep) {
  const lines = basketLines();
  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const saved = lines.reduce((s, l) => s + l.qty * (l.item.price - l.unit), 0);
  const f = keep || {};
  const hint = (l) => {
    const it = l.item;
    if (!bulkActive(it) || l.qty >= it.bulkMin) return "";
    const need = it.bulkMin - l.qty;
    if (l.qty + need > it.quantity) return "";
    return `<li class="hintrow">💡 Add ${need} more ${esc(it.unit)} to get the bulk price of ${money(it.bulkPrice)} each
      <button type="button" data-b="more" data-n="${need}" data-id="${esc(it.id)}">Add ${need}</button></li>`;
  };
  $("#checkoutBody").innerHTML = `
  <form id="orderForm" novalidate>
    <h2>🧺 Your basket</h2>
    <ul class="lines">${lines.map((l) => `
      <li><span class="ic">${esc(l.item.icon)}</span><span class="nm">${esc(l.item.name)}${l.unit < l.item.price ? " 🎉" : ""}<br><small>${money(l.unit)} each${l.unit < l.item.price ? " (bulk price)" : ""}</small></span>
        <span class="mini"><button type="button" data-b="dec" data-id="${esc(l.item.id)}" aria-label="Fewer">−</button><b>${l.qty}</b>
        <button type="button" data-b="inc" data-id="${esc(l.item.id)}" aria-label="More" ${l.qty >= l.item.quantity ? "disabled" : ""}>+</button></span>
        <span>${l.unit > 0 ? money(l.unit * l.qty) : "Trade"}</span>
        <button type="button" class="rm" data-b="rm" data-id="${esc(l.item.id)}" aria-label="Remove ${esc(l.item.name)}">🗑️</button></li>${hint(l)}`).join("")}</ul>
    <div class="total">Estimated total: ${money(total)}${saved > 0.001 ? ` <small>You save ${money(saved)} with bulk pricing! 🎉</small>` : ""}
      <small>${esc(state.extras.settings.marketNotice || CONFIG.MARKET_NOTICE)}</small></div>

    ${personHTML("c", f)}
    ${methodHTML("c", f)}
    <div class="two">
      <div><label class="f" for="cDate">Day *</label><input class="t" id="cDate" type="date" min="${todayStr()}" value="${esc(f.date || "")}"></div>
      <div><label class="f" for="cSlot">Time *</label><select class="t" id="cSlot"><option value="">Choose…</option>
        ${CONFIG.TIME_SLOTS.map((s) => `<option ${f.slot === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></div>
    </div>
    <div id="cWx"></div>

    <label class="chk"><input type="checkbox" id="cGift" ${f.gift ? "checked" : ""}> 🎁 This is a gift / send it to someone else</label>
    <div class="sub" id="cGiftBox" ${f.gift ? "" : "hidden"}>
      <label class="f" for="cGiftName">Who is it for? *</label><input class="t" id="cGiftName" maxlength="80" value="${esc(f.giftName || "")}">
      <label class="f" for="cGiftPhone">Their phone (optional)</label><input class="t" id="cGiftPhone" type="tel" maxlength="30" value="${esc(f.giftPhone || "")}">
      <label class="f" for="cGiftMsg">Card message (optional)</label><textarea class="t" id="cGiftMsg" maxlength="300" placeholder="Happy birthday! Love, ...">${esc(f.giftMsg || "")}</textarea>
      <p class="soft">If you chose delivery, put the recipient's address in the delivery box above.</p>
    </div>
    <label class="chk"><input type="checkbox" id="cAsk" ${f.ask ? "checked" : ""}> 💬 Ask about a discount (like buying in bulk)</label>
    <div class="sub" id="cAskBox" ${f.ask ? "" : "hidden"}>
      <label class="f" for="cAskNote">What are you hoping for?</label>
      <textarea class="t" id="cAskNote" maxlength="400" placeholder="For example: I'd like 100 lb of potatoes for a church dinner. Any deal?">${esc(f.askNote || "")}</textarea>
    </div>

    <label class="f" for="cBarter">Want to trade? (optional)</label>
    <textarea class="t" id="cBarter" maxlength="300" placeholder="Got something to swap? Tell me what you've got!">${esc(f.barter || "")}</textarea>
    <label class="f" for="cNotes">Anything else? (optional)</label>
    <textarea class="t" id="cNotes" maxlength="300">${esc(f.notes || "")}</textarea>
    ${optHTML("c", f)}
    ${honeypot("c")}
    <p class="err" id="cErr" role="alert"></p>
    <div class="row">
      <button type="button" class="btn" data-act="close-dlg">Keep shopping</button>
      <button type="submit" class="btn go" id="cBtn">Place my order 🌽</button>
    </div>
  </form>`;
  updateMethodExtra("c", f.extra || "");
  if (f.date) $("#cWx").innerHTML = weatherHTML(wxBy.c);
}
function readOrderForm() {
  return { ...readPerson("c"), ...readMethod("c"), date: val("#cDate"), slot: val("#cSlot"), barter: val("#cBarter"), notes: val("#cNotes"),
    gift: checked("#cGift"), giftName: val("#cGiftName"), giftPhone: val("#cGiftPhone"), giftMsg: val("#cGiftMsg"),
    ask: checked("#cAsk"), askNote: val("#cAskNote"), opt: checked("#cOpt") };
}
function handleBasketButton(b) {
  const id = b.dataset.id, item = itemById(id), keep = readOrderForm();
  if (b.dataset.b === "inc" && item) state.basket[id] = Math.min(item.quantity, (state.basket[id] || 0) + 1);
  if (b.dataset.b === "more" && item) state.basket[id] = Math.min(item.quantity, (state.basket[id] || 0) + Number(b.dataset.n));
  if (b.dataset.b === "dec") { state.basket[id] = (state.basket[id] || 0) - 1; if (state.basket[id] <= 0) delete state.basket[id]; }
  if (b.dataset.b === "rm") delete state.basket[id];
  safeSet("basket", state.basket); updateFab(); refreshView();
  if (!basketCount()) { checkoutDlg.close(); return; }
  renderCheckout(keep);
}

SUBMIT.orderForm = async () => {
  if ($("#cWebsite").value) return; // honeypot: bots fill this in, people never see it
  const f = readOrderForm();
  const problem = checkContact(f, "c") || checkMethod(f, "c") ||
    (!f.date ? { msg: "Please pick a day.", sel: "#cDate" } : null) ||
    (f.date < todayStr() ? { msg: "That day has already passed. Pick today or later.", sel: "#cDate" } : null) ||
    (!f.slot ? { msg: "Please pick a time.", sel: "#cSlot" } : null) ||
    (f.gift && !f.giftName ? { msg: "Who is the gift for?", sel: "#cGiftName" } : null) ||
    (!basketCount() ? { msg: "Your basket is empty." } : null);
  if (problem) return showErr("c", problem);

  await withSending("c", "Place my order 🌽", async (err) => {
    const w = wxBy.c !== undefined ? wxBy.c : await getWeather(f.date);
    const res = await api.placeOrder({
      items: Object.entries(state.basket).map(([id, qty]) => ({ id, qty })),
      name: f.name, phone: f.phone, email: f.email, method: methodLabel(f.method), address: f.extra,
      date: f.date, timeSlot: f.slot, barter: f.barter, notes: f.notes, weatherNote: weatherNote(w),
      isGift: f.gift, giftName: f.gift ? f.giftName : "", giftPhone: f.gift ? f.giftPhone : "", giftMessage: f.gift ? f.giftMsg : "",
      discountRequest: f.ask ? f.askNote || "Please contact me about a discount." : "",
      optIn: f.opt, website: ""
    });
    if (!res.ok) {
      if (res.items) state.items = res.items.map(normalizeItem); else await loadItems({ quiet: true });
      for (const id of Object.keys(state.basket)) {
        const it = itemById(id);
        if (!it || it.quantity <= 0) delete state.basket[id]; else state.basket[id] = Math.min(state.basket[id], it.quantity);
      }
      safeSet("basket", state.basket); updateFab(); refreshView();
      if (basketCount()) { renderCheckout(f); $("#cErr").textContent = res.error || "Something went wrong. Please try again."; }
      else { checkoutDlg.close(); toast(res.error || "Those items just sold out. Sorry!"); }
      return;
    }
    state.basket = {}; safeSet("basket", state.basket); updateFab();
    checkoutDlg.close();
    await loadItems({ quiet: true });
    refreshView();
    const lines = (res.items || []).map((l) => `<div>${esc(l.icon || "")} ${l.qty} × ${esc(l.name)} at ${money(l.price)}${l.bulk ? " 🎉" : ""}</div>`).join("");
    showThanks(f.name, res, w, { headline: "Order received! 🌽", summary: `${lines}<div><b>Estimated total: ${money(res.total || 0)}</b></div><small>${esc(state.extras.settings.marketNotice || CONFIG.MARKET_NOTICE)}</small>` });
  });
};

/* =====================================================================
   Reserve for a future harvest
   ===================================================================== */
const reserveDlg = $("#reserveDlg");
function openReserve(id) {
  const item = itemById(id);
  if (!item || !reserveOpen(item)) return;
  cur.reserve = id; wxBy.r = undefined;
  const lo = item.harvestStart && item.harvestStart > todayStr() ? item.harvestStart : todayStr();
  $("#reserveBody").innerHTML = `<form id="reserveForm" novalidate>
    <h2>🌱 Reserve ${esc(item.icon)} ${esc(item.name)}</h2>
    <div class="info">Harvest window: <b>${fmtDate(lo)} to ${fmtDate(item.harvestEnd)}</b><br>
      Reserve price: <b>${money(reservePriceFor(item, 1))}</b> each${item.reservePrice > 0 && item.reservePrice < item.price ? ` <small>(normally ${money(item.price)})</small>` : ""}<br>
      <small>Nothing is paid now. The final price follows the local market price and is confirmed at harvest.</small></div>
    <div class="two">
      <div><label class="f" for="rQty">How many (${esc(item.unit)}) *</label><input class="t" id="rQty" type="number" inputmode="numeric" min="1" ${item.reserveMax ? `max="${item.reserveMax}"` : ""} value="1"></div>
      <div><label class="f" for="rDate">Day you'd like it *</label><input class="t" id="rDate" type="date" min="${lo}" max="${esc(item.harvestEnd)}"></div>
    </div>
    <div class="est" id="rTotal"></div><div id="rWx"></div>
    ${personHTML("r", {})}${methodHTML("r", {})}
    <label class="f" for="rNotes">Notes (optional)</label>
    <textarea class="t" id="rNotes" maxlength="400" placeholder="A gift? A discount idea? Anything else?"></textarea>
    ${optHTML("r", {})}${honeypot("r")}
    <p class="err" id="rErr" role="alert"></p>
    <div class="row"><button type="button" class="btn" data-act="close-dlg">Not now</button><button type="submit" class="btn go" id="rBtn">Send reservation request 🌱</button></div>
  </form>`;
  updateReserveTotal();
  reserveDlg.showModal();
}
function updateReserveTotal() {
  const item = itemById(cur.reserve), box = $("#rTotal");
  if (!item || !box) return;
  const qty = parseInt(val("#rQty"), 10) || 0;
  if (qty < 1) { box.textContent = ""; return; }
  const price = reservePriceFor(item, qty);
  box.innerHTML = `Estimate: ${qty} × ${money(price)} = <b>${money(qty * price)}</b>`;
}
SUBMIT.reserveForm = async () => {
  if ($("#rWebsite").value) return;
  const item = itemById(cur.reserve);
  if (!item) return;
  const f = { ...readPerson("r"), ...readMethod("r"), qty: parseInt(val("#rQty"), 10) || 0, date: val("#rDate"), notes: val("#rNotes"), opt: checked("#rOpt") };
  const lo = item.harvestStart && item.harvestStart > todayStr() ? item.harvestStart : todayStr();
  const problem = (f.qty < 1 ? { msg: "Please choose how many you want.", sel: "#rQty" } : null) ||
    (item.reserveMax && f.qty > item.reserveMax ? { msg: `You can reserve up to ${item.reserveMax} at a time.`, sel: "#rQty" } : null) ||
    (!f.date || f.date < lo || f.date > item.harvestEnd ? { msg: `Please pick a day between ${fmtDate(lo)} and ${fmtDate(item.harvestEnd)}.`, sel: "#rDate" } : null) ||
    checkContact(f, "r") || checkMethod(f, "r");
  if (problem) return showErr("r", problem);
  await withSending("r", "Send reservation request 🌱", async () => {
    const w = wxBy.r !== undefined ? wxBy.r : await getWeather(f.date);
    const res = await api.reserve({ itemId: item.id, qty: f.qty, date: f.date, name: f.name, phone: f.phone, email: f.email,
      method: methodLabel(f.method), address: f.extra, notes: f.notes, weatherNote: weatherNote(w), optIn: f.opt, website: "" });
    if (!res.ok) { $("#rErr").textContent = res.error || "Something went wrong. Please try again."; return; }
    reserveDlg.close();
    const l = res.items[0];
    showThanks(f.name, res, w, { headline: "Reservation request received! 🌱",
      summary: `<div>${esc(l.icon)} ${l.qty} × ${esc(l.name)} for <b>${fmtDate(res.date)}</b> at ${money(l.price)} each = about <b>${money(res.total)}</b></div>
        <small>No payment now. The final price follows the local market price and is confirmed at harvest.</small>`,
      note: "I'll contact you to confirm." });
  });
};

/* =====================================================================
   Book a visit (Pick-It-Yourself and activities)
   ===================================================================== */
const bookDlg = $("#bookDlg");
function openBook(kind) {
  const info = bookingInfo(kind);
  if (!info) return;
  cur.book = kind; wxBy.v = undefined;
  $("#bookBody").innerHTML = `<form id="bookForm" novalidate>
    <h2>${esc(info.icon)} ${esc(info.title)}</h2>
    <div class="info"><b>${money(info.price)}</b> per ${info.per}<br><small>${esc(info.blurb)}</small></div>
    <div class="two">
      <div><label class="f" for="vDate">Day *</label><input class="t" id="vDate" type="date" min="${todayStr()}"></div>
      <div><label class="f" for="vSlot">Arrival time *</label><select class="t" id="vSlot"><option value="">Choose…</option>${CONFIG.VISIT_SLOTS.map((s) => `<option>${esc(s)}</option>`).join("")}</select></div>
    </div>
    <div id="vWx"></div>
    <div class="two">
      <div><label class="f" for="vParty">How many people? *</label><input class="t" id="vParty" type="number" inputmode="numeric" min="1" max="${info.max}" value="1"></div>
      <div><label class="f" for="vAges">Ages of kids (optional)</label><input class="t" id="vAges" maxlength="100" placeholder="e.g. 7 and 10"></div>
    </div>
    <div class="est" id="vTotal"></div>
    ${personHTML("v", {})}
    <label class="f" for="vNotes">Notes or questions (optional)</label>
    <textarea class="t" id="vNotes" maxlength="400" placeholder="Anything we should know? Want to ask a price?"></textarea>
    <label class="chk"><input type="checkbox" id="vSafe"> ✅ I understand farm activities carry real risks. Everyone in my group will follow the staff's instructions, wear closed-toe shoes, and kids will stay with an adult.</label>
    ${optHTML("v", {})}${honeypot("v")}
    <p class="err" id="vErr" role="alert"></p>
    <div class="row"><button type="button" class="btn" data-act="close-dlg">Not now</button><button type="submit" class="btn go" id="vBtn">Send request 📅</button></div>
  </form>`;
  updateBookTotal();
  bookDlg.showModal();
}
function updateBookTotal() {
  const info = bookingInfo(cur.book), box = $("#vTotal");
  if (!info || !box) return;
  const party = parseInt(val("#vParty"), 10) || 0;
  box.innerHTML = party >= 1 ? `Estimate: <b>${money(bookingTotal(info, party))}</b>${info.per === "group" ? " for the group" : ` (${party} × ${money(info.price)})`}` : "";
}
SUBMIT.bookForm = async () => {
  if ($("#vWebsite").value) return;
  const info = bookingInfo(cur.book);
  if (!info) return;
  const f = { ...readPerson("v"), date: val("#vDate"), slot: val("#vSlot"), party: parseInt(val("#vParty"), 10) || 0, ages: val("#vAges"), notes: val("#vNotes"), safe: checked("#vSafe"), opt: checked("#vOpt") };
  const problem = (!f.date || f.date < todayStr() ? { msg: "Please pick today or a future day.", sel: "#vDate" } : null) ||
    (!f.slot ? { msg: "Please pick an arrival time.", sel: "#vSlot" } : null) ||
    (f.party < 1 || f.party > info.max ? { msg: `Party size must be between 1 and ${info.max}.`, sel: "#vParty" } : null) ||
    checkContact(f, "v") ||
    (!f.safe ? { msg: "Please tick the safety box so we know you understand.", sel: "#vSafe" } : null);
  if (problem) return showErr("v", problem);
  await withSending("v", "Send request 📅", async () => {
    const w = wxBy.v !== undefined ? wxBy.v : await getWeather(f.date);
    const res = await api.book({ kind: cur.book, date: f.date, timeSlot: f.slot, party: f.party, ages: f.ages, name: f.name, phone: f.phone, email: f.email,
      notes: f.notes, safetyOk: true, weatherNote: weatherNote(w), optIn: f.opt, website: "" });
    if (!res.ok) { $("#vErr").textContent = res.error || "Something went wrong. Please try again."; return; }
    bookDlg.close();
    showThanks(f.name, res, w, { headline: "Visit request received! 📅",
      summary: `<div><b>${esc(res.title)}</b></div><div>${fmtDate(res.date)}, ${esc(res.timeSlot)} · ${res.party} ${res.party > 1 ? "people" : "person"}</div><div>Estimate: <b>${money(res.total)}</b></div>`,
      note: "I'll confirm by phone or email." });
    play(cur.book === "gold" ? "ching" : "honk");
  });
};

/* =====================================================================
   Custom-shape request
   ===================================================================== */
const customDlg = $("#customDlg");
function openCustom(id) {
  const s = state.extras.shapes.find((x) => x.id === id);
  if (!s) return;
  cur.custom = id;
  const earliest = dayOffset(s.leadWeeks * 7);
  $("#customBody").innerHTML = `<form id="customForm" novalidate>
    <h2>${esc(s.icon)} ${esc(s.name)}</h2>
    <div class="info">Extra charge: <b>${money(s.extraCharge)}</b> each, plus the ${esc(s.fruit.toLowerCase() || "fruit")} price at harvest.<br>
      <small>It takes about ${s.leadWeeks} weeks to grow. Nothing is paid online, and I'll confirm once the fruit is on the vine.</small></div>
    <div class="two">
      <div><label class="f" for="kQty">How many? *</label><input class="t" id="kQty" type="number" inputmode="numeric" min="1" max="${s.maxQty}" value="1"></div>
      <div><label class="f" for="kDate">Needed by *</label><input class="t" id="kDate" type="date" min="${earliest}"></div>
    </div>
    <div class="est" id="kTotal"></div>
    ${personHTML("k", {})}${methodHTML("k", {})}
    <label class="f" for="kNotes">Tell me your idea (optional)</label>
    <textarea class="t" id="kNotes" maxlength="500" placeholder="A wedding? A birthday? Any special wishes?"></textarea>
    ${optHTML("k", {})}${honeypot("k")}
    <p class="err" id="kErr" role="alert"></p>
    <div class="row"><button type="button" class="btn" data-act="close-dlg">Not now</button><button type="submit" class="btn go" id="kBtn">Send request 🎨</button></div>
  </form>`;
  updateCustomTotal();
  customDlg.showModal();
}
function updateCustomTotal() {
  const s = state.extras.shapes.find((x) => x.id === cur.custom), box = $("#kTotal");
  if (!s || !box) return;
  const qty = parseInt(val("#kQty"), 10) || 0;
  box.innerHTML = qty >= 1 ? `Extra charges: ${qty} × ${money(s.extraCharge)} = <b>${money(qty * s.extraCharge)}</b> (plus the fruit itself)` : "";
}
SUBMIT.customForm = async () => {
  if ($("#kWebsite").value) return;
  const s = state.extras.shapes.find((x) => x.id === cur.custom);
  if (!s) return;
  const f = { ...readPerson("k"), ...readMethod("k"), qty: parseInt(val("#kQty"), 10) || 0, date: val("#kDate"), notes: val("#kNotes"), opt: checked("#kOpt") };
  const earliest = dayOffset(s.leadWeeks * 7);
  const problem = (f.qty < 1 || f.qty > s.maxQty ? { msg: `Please choose between 1 and ${s.maxQty}.`, sel: "#kQty" } : null) ||
    (!f.date || f.date < earliest ? { msg: `This takes about ${s.leadWeeks} weeks. Please pick ${fmtDate(earliest)} or later.`, sel: "#kDate" } : null) ||
    checkContact(f, "k") || checkMethod(f, "k");
  if (problem) return showErr("k", problem);
  await withSending("k", "Send request 🎨", async () => {
    const res = await api.custom({ shapeId: s.id, qty: f.qty, wantDate: f.date, name: f.name, phone: f.phone, email: f.email,
      method: methodLabel(f.method), address: f.extra, notes: f.notes, optIn: f.opt, website: "" });
    if (!res.ok) { $("#kErr").textContent = res.error || "Something went wrong. Please try again."; return; }
    customDlg.close();
    showThanks(f.name, res, null, { headline: "Custom request received! 🎨",
      summary: `<div>${res.qty} × <b>${esc(res.shape)}</b> by ${fmtDate(res.wantDate)}</div><div>Extra charges: <b>${money(res.total)}</b> plus the fruit at harvest price</div>`,
      note: "I'll confirm if it can be grown in time." });
  });
};

/* =====================================================================
   Reviews, private messages, photo upload, farmer login
   ===================================================================== */
SUBMIT.reviewForm = async () => {
  if ($("#rvWebsite").value) return;
  const kindEl = $('input[name="rvKind"]:checked'), kind = kindEl ? kindEl.value : "review";
  const msg = val("#rvMsg");
  if (msg.length < 5) return showErr("rv", { msg: "Please write a little more (at least 5 characters).", sel: "#rvMsg" });
  await withSending("rv", "Post it 🌻", async () => {
    const res = await api.review({ kind, name: val("#rvName"), rating: kind === "review" ? state.rating : 0, message: msg, contact: val("#rvContact"), website: "" });
    if (!res.ok) { $("#rvErr").textContent = res.error || "Something went wrong. Please try again."; return; }
    await loadReviews();
    renderFeedback();
    showThanks(val("#rvName") || "friend", {}, null, { headline: "Thanks for sharing! 🌻", noCode: true });
  });
};
SUBMIT.messageForm = async () => {
  if ($("#msWebsite").value) return;
  const f = { ...readPerson("ms"), topic: val("#msTopic"), message: val("#msMsg") };
  const problem = checkContact(f, "ms") || (f.message.length < 5 ? { msg: "Please write your message.", sel: "#msMsg" } : null);
  if (problem) return showErr("ms", problem);
  await withSending("ms", "Send message", async () => {
    const res = await api.message({ name: f.name, phone: f.phone, email: f.email, topic: f.topic, message: f.message, website: "" });
    if (!res.ok) { $("#msErr").textContent = res.error || "Something went wrong. Please try again."; return; }
    $("#messageForm").reset();
    showThanks(f.name, {}, null, { headline: "Message sent! 🛎️", noCode: true, note: "I'll get back to you soon." });
  });
};

async function fileToJpeg(file, maxSide = 1280, quality = 0.82) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, base64: dataUrl.split(",")[1] };
}
SUBMIT.uploadForm = async (form) => {
  const file = $("#upFile").files[0];
  if (!file) return showErr("up", { msg: "Please choose a picture first." });
  await withSending("up", "Upload", async () => {
    const img = await fileToJpeg(file);
    const body = { kind: form.dataset.kind, itemId: form.dataset.kind === "farm" ? val("#upItem") : "", title: val("#upTitle") };
    const res = await api.admin("admin_upload_photo", CONFIG.APPS_SCRIPT_URL ? { ...body, mime: "image/jpeg", imageBase64: img.base64 } : { ...body, dataUrl: img.dataUrl });
    if (!res.ok) { $("#upErr").textContent = res.error || "Upload failed."; return; }
    toast("Photo added 📸");
    await loadExtras();
    route();
  });
};
SUBMIT.adminForm = async () => {
  const key = val("#adKey");
  if (!key) return showErr("ad", { msg: "Please enter your key." });
  await withSending("ad", "Log in", async () => {
    const prev = admin.key;
    admin.key = key;
    const res = await api.admin("admin_check");
    if (!res.ok) { admin.key = prev; $("#adErr").textContent = res.error || "That key is not right."; return; }
    setAdminKey(key);
    toast("Farmer mode is on 👨‍🌾");
    route();
  });
};

/* =====================================================================
   Thank-you screen (rotating message + warm glow + floating hearts)
   ===================================================================== */
const thanksDlg = $("#thanks");
function pickThanks(name) {
  const last = safeGet("lastThanks", -1);
  let i;
  do { i = Math.floor(Math.random() * THANKS.length); } while (i === last && THANKS.length > 1);
  safeSet("lastThanks", i);
  return THANKS[i].replaceAll("{name}", name.split(/\s+/)[0] || "friend");
}
function showThanks(name, res, w, ctx) {
  const floaters = ["💛", "🌻", "🍓", "🥕", "🧡", "🌽", "🍎", "💚"];
  let fl = "";
  for (let i = 0; i < 26; i++) {
    fl += `<span class="float" style="--x:${Math.round(Math.random() * 92)}%;--dur:${(3 + Math.random() * 3).toFixed(1)}s;--delay:${(Math.random() * 2.5).toFixed(1)}s">${floaters[i % floaters.length]}</span>`;
  }
  const note = ctx.note || (CONFIG.APPS_SCRIPT_URL ? "" : "(Demo mode: nothing was really sent.)");
  $("#thanksBody").innerHTML = `
    <div class="burst"></div>${fl}
    <div class="farmer-wrap">${farmerSVG()}</div>
    <div class="msg">${esc(pickThanks(name))}</div>
    <div class="tiny"><b>${esc(ctx.headline)}</b></div>
    ${ctx.noCode ? "" : `<div class="tiny">Your cancel code. Save it! You can use it any time to cancel, no questions asked.</div>
      <div class="code" id="theCode">${esc(res.code)}</div>
      <div class="row" style="justify-content:center;margin-top:8px"><button class="btn" id="copyCode" type="button" style="flex:0 1 auto">📋 Copy code</button></div>`}
    ${ctx.summary ? `<div class="sum">${ctx.summary}</div>` : ""}
    ${w && w.risky ? `<div class="wx bad" style="position:relative;text-align:left">⛈️ Rough weather is in the forecast for your day. If it turns bad, just cancel with your code. No hard feelings!</div>` : ""}
    ${note ? `<div class="tiny">${esc(note)}</div>` : ""}
    <div class="row"><button class="btn go" id="closeThanks" type="button">Back to the farm</button></div>`;
  thanksDlg.showModal();
  play("ding"); setTimeout(() => play("crow"), 450);
  const copy = $("#copyCode");
  if (copy) copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(res.code); toast("Code copied! 📋"); } catch { toast("Press and hold the code to copy it."); }
  });
  $("#closeThanks").addEventListener("click", () => { thanksDlg.close(); if (!ctx.noCode) location.hash = "#/"; });
}

/* =====================================================================
   Cancel with a code (orders, reservations, visits, custom requests)
   ===================================================================== */
const cancelDlg = $("#cancelDlg");
function openCancel() {
  $("#cancelBody").innerHTML = `
    <h2>Cancel with your code</h2>
    <p>Plans change, and that's okay! Type the cancel code from your confirmation. It works for orders, reservations, visits and custom requests.</p>
    <input class="t" id="cCode" type="text" placeholder="FARM-XXXXX" maxlength="20" autocomplete="off" style="text-transform:uppercase;font-size:20px;letter-spacing:2px">
    <p class="err" id="cErr2" role="alert"></p>
    <div class="row"><button class="btn" type="button" data-act="close-dlg">Never mind</button>
    <button class="btn danger" id="cGo" type="button">Cancel it</button></div>`;
  cancelDlg.showModal();
}
async function doCancel() {
  const code = val("#cCode").toUpperCase(), err = $("#cErr2"), go = $("#cGo");
  if (code.length < 6) { err.textContent = "Please type your full cancel code."; return; }
  go.disabled = true; go.textContent = "Cancelling…";
  try {
    const res = await api.cancelOrder(code);
    if (!res.ok) { err.textContent = res.error || "Couldn't cancel that one."; go.disabled = false; go.textContent = "Cancel it"; return; }
    await loadItems({ quiet: true }); refreshView();
    $("#cancelBody").innerHTML = `
      <h2>${res.already ? "Already cancelled" : "All cancelled ✅"}</h2>
      <p>${res.already ? "That one was already cancelled." : "No hard feelings at all! I've let the farmer know and put anything on hold back on the shelf."} Thanks for letting us know, and hope to see you another day. 🌻</p>
      <div class="row"><button class="btn go" type="button" data-act="close-dlg">Okay</button></div>`;
  } catch (ex) {
    console.error(ex);
    err.textContent = "Couldn't reach the farm. Please try again.";
    go.disabled = false; go.textContent = "Cancel it";
  }
}

/* =====================================================================
   Events (one listener each, for the whole page)
   ===================================================================== */
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.tagName === "DIALOG") { t.close(); return; } // tap on the dark backdrop
  if (t.closest("#drawer a")) { openDrawer(false); return; }
  const crit = t.closest(".crit");
  if (crit) { play(crit.dataset.snd); crit.classList.remove("jump"); void crit.offsetWidth; crit.classList.add("jump"); return; }
  const lb = t.closest("[data-b]");
  if (lb) { handleBasketButton(lb); return; }
  const b = t.closest("[data-act]");
  if (!b) {
    const snd = t.closest("[data-snd]");
    if (snd) play(snd.dataset.snd);
    return;
  }
  const act = b.dataset.act, id = b.dataset.id, item = id ? itemById(id) : null;
  if (act === "close-dlg") { const d = b.closest("dialog"); if (d) d.close(); return; }
  if (act === "close-drawer") { openDrawer(false); return; }
  if (act === "book") { play(b.dataset.kind === "gold" ? "ching" : "honk"); openBook(b.dataset.kind); return; }
  if (act === "custom") { play("pop"); openCustom(id); return; }
  if (act === "reserve") { play("pop"); openReserve(id); return; }
  if (act === "logout") { setAdminKey(""); toast("Logged out"); route(); return; }
  if (act === "star") {
    state.rating = Number(b.dataset.n);
    document.querySelectorAll("#rvStars button").forEach((s) => s.classList.toggle("on", Number(s.dataset.n) <= state.rating));
    play("pop"); return;
  }
  if (act === "del-review" || act === "del-photo") {
    if (!window.confirm(act === "del-review" ? "Delete this post for good?" : "Remove this photo from the site?")) return;
    const res = await api.admin(act === "del-review" ? "admin_delete_review" : "admin_delete_photo", { id });
    if (!res.ok) { toast(res.error || "That didn't work."); return; }
    toast("Removed 🗑️");
    if (act === "del-review") { await loadReviews(); } else { await loadExtras(); }
    route();
    return;
  }
  if (!item) return;
  const room = Math.max(0, item.quantity - (state.basket[item.id] || 0));
  const curQty = clamp(state.pending[item.id] || 1, 1, Math.max(1, room));
  if (act === "inc") { state.pending[item.id] = clamp(curQty + 1, 1, Math.max(1, room)); play("pop"); refreshView(); }
  else if (act === "dec") { state.pending[item.id] = clamp(curQty - 1, 1, Math.max(1, room)); play("pop"); refreshView(); }
  else if (act === "add" && room > 0) {
    state.basket[item.id] = (state.basket[item.id] || 0) + curQty;
    state.pending[item.id] = 1;
    safeSet("basket", state.basket); updateFab(true); play("cluck");
    toast(`Added ${curQty} × ${item.name} to your basket 🧺`);
    refreshView();
  } else if (act === "bulk" && room >= item.bulkMin) {
    state.basket[item.id] = (state.basket[item.id] || 0) + item.bulkMin;
    safeSet("basket", state.basket); updateFab(true); play("cluck");
    toast(`Bulk deal! ${item.bulkMin} × ${item.name} added 🎉`);
    refreshView();
  }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.classList && t.classList.contains("qty")) { // typed quantity on a card: remember it without redrawing (so a click on "Add" isn't lost)
    const item = itemById(t.dataset.id);
    if (!item) return;
    const room = Math.max(0, item.quantity - (state.basket[item.id] || 0));
    const n = clamp(parseInt(t.value, 10) || 1, 1, Math.max(1, room));
    state.pending[item.id] = n; t.value = n;
    return;
  }
  if (t.name && t.name.endsWith("method")) updateMethodExtra(t.name.slice(0, -"method".length));
  if (/^[crv]Date$/.test(t.id)) showWx(t.id[0], t.value);
  if (t.id === "cGift") { $("#cGiftBox").hidden = !t.checked; updateMethodExtra("c"); }
  if (t.id === "cAsk") $("#cAskBox").hidden = !t.checked;
  if (t.name === "rvKind") $("#rvStarsBox").hidden = t.value !== "review";
});
document.addEventListener("input", (e) => {
  if (e.target.id === "rQty") updateReserveTotal();
  if (e.target.id === "vParty") updateBookTotal();
  if (e.target.id === "kQty") updateCustomTotal();
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  const handler = SUBMIT[e.target.id];
  if (handler) handler(e.target);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openDrawer(false);
  if (e.key === "Enter" && e.target.id === "cCode") doCancel();
});
document.addEventListener("click", (e) => { if (e.target.id === "cGo") doCancel(); });

$("#fab").addEventListener("click", openCheckout);
$("#cancelLink").addEventListener("click", openCancel);
navTab.addEventListener("click", () => openDrawer(!drawer.classList.contains("open")));
drawerBack.addEventListener("click", () => openDrawer(false));
$("#adminOut").addEventListener("click", () => { setAdminKey(""); toast("Logged out"); route(); });
$("#soundBtn").addEventListener("click", () => {
  state.sound = !state.sound; safeSet("sound", state.sound); updateSoundBtn();
  if (state.sound) play("pop");
});
window.addEventListener("hashchange", route);

/* =====================================================================
   Start up
   ===================================================================== */
$("#brand").textContent = "🌾 " + CONFIG.FARM_NAME;
document.title = CONFIG.FARM_NAME;
if (!CONFIG.APPS_SCRIPT_URL) $("#demoRibbon").style.display = "block";

async function init() {
  updateSoundBtn(); updateFab(); setAdminKey(admin.key);
  renderStatus("🐓 Fetching the eggs and tomatoes…");
  await Promise.all([loadItems(), loadExtras()]);
  route();
}
init();

// Keep the stock pictures fresh while the page is open (skip while a dialog is up).
setInterval(async () => {
  if (document.hidden || document.querySelector("dialog[open]")) return;
  await loadItems({ quiet: true });
  refreshView();
}, CONFIG.REFRESH_MS);
