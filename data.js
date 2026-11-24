"use strict";
/* =====================================================================
   Data layer: pricing rules, sample data for DEMO MODE, the real Google
   backend, and a browser-only demo backend. No drawing happens here.
   ===================================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid mix-ups

/* ---------- pricing rules (the server applies exactly the same ones) ---------- */
const r2 = (n) => Math.round(n * 100) / 100;
const bulkActive = (it) => it.bulkOn && it.bulkMin >= 2 && it.bulkPrice > 0 && it.bulkPrice < it.price;
const unitPrice = (it, qty) => (bulkActive(it) && qty >= it.bulkMin ? it.bulkPrice : it.price);
const reservePriceFor = (it, qty) => {
  const base = unitPrice(it, qty);
  return it.reservePrice > 0 ? Math.min(base, it.reservePrice) : base;
};
const reserveOpen = (it) => it.reserveOn && !!it.harvestEnd && it.harvestEnd >= todayStr();
const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
const fmtDate = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const bookingTotal = (info, party) => r2(info.per === "group" ? info.price : info.price * party);

/* ---------- cleaning up what the server sends ---------- */
function normalizeItem(raw) {
  return {
    id: String(raw.id),
    category: String(raw.category || "").toLowerCase(),
    name: String(raw.name || ""),
    icon: String(raw.icon || "🥬"),
    price: Number(raw.price) || 0,
    unit: String(raw.unit || "each"),
    quantity: Math.max(0, Math.floor(Number(raw.quantity) || 0)),
    maxQuantity: Math.max(1, Math.floor(Number(raw.maxQuantity) || Number(raw.quantity) || 1)),
    container: String(raw.container || "basket"),
    description: String(raw.description || ""),
    bulkOn: raw.bulkOn === true,
    bulkMin: Math.floor(Number(raw.bulkMin) || 0),
    bulkPrice: Number(raw.bulkPrice) || 0,
    reserveOn: raw.reserveOn === true,
    harvestStart: String(raw.harvestStart || ""),
    harvestEnd: String(raw.harvestEnd || ""),
    reservePrice: Number(raw.reservePrice) || 0,
    reserveMax: Math.floor(Number(raw.reserveMax) || 0)
  };
}
const normalizeActivity = (a) => ({
  id: String(a.id), name: String(a.name || ""), icon: String(a.icon || "⭐"), art: String(a.art || ""),
  price: Number(a.price) || 0, per: a.per === "group" ? "group" : "person", duration: String(a.duration || ""),
  minAge: Math.floor(Number(a.minAge) || 0), maxParty: Math.floor(Number(a.maxParty) || 0),
  includes: String(a.includes || ""), description: String(a.description || "")
});
const normalizeShape = (s) => ({
  id: String(s.id), name: String(s.name || ""), icon: String(s.icon || "🍉"), art: String(s.art || "heart"),
  fruit: String(s.fruit || ""), extraCharge: Number(s.extraCharge) || 0, leadWeeks: Math.floor(Number(s.leadWeeks) || 0),
  maxQty: Math.floor(Number(s.maxQty) || 20), description: String(s.description || "")
});
const normalizePhoto = (p) => ({
  id: String(p.id), kind: p.kind === "moment" ? "moment" : "farm", itemId: String(p.itemId || ""),
  title: String(p.title || ""), src: String(p.src || ""), placeholderIcon: String(p.placeholderIcon || "")
});

/* ---------- sample data (DEMO MODE only; your real data lives in the Google Sheet) ---------- */
function sampleItems() {
  const mk = (id, category, name, icon, price, unit, quantity, maxQuantity, container, description, extra = {}) =>
    ({ id, category, name, icon, price, unit, quantity, maxQuantity, container, description, ...extra });
  return [
    mk("apples", "fruits", "Apples", "🍎", 2.5, "lb", 40, 40, "crate", "Crisp and sweet", { bulkOn: true, bulkMin: 20, bulkPrice: 2 }),
    mk("watermelon", "fruits", "Watermelon", "🍉", 6, "each", 8, 10, "skid", "Big, ripe and seedy"),
    mk("grapes", "fruits", "Grapes", "🍇", 4, "lb", 18, 30, "dish", "Muscadines, sweet as candy"),
    mk("peaches", "fruits", "Peaches", "🍑", 3.5, "lb", 5, 30, "basket", "Almost gone this season",
      { reserveOn: true, harvestStart: dayOffset(20), harvestEnd: dayOffset(50), reservePrice: 3, reserveMax: 30 }),
    mk("potatoes", "vegetables", "Potatoes", "🥔", 1.5, "lb", 50, 60, "basket", "Dug this week", { bulkOn: true, bulkMin: 25, bulkPrice: 1 }),
    mk("tomatoes", "vegetables", "Tomatoes", "🍅", 3, "lb", 22, 30, "crate", "Vine-ripened",
      { reserveOn: true, harvestStart: dayOffset(10), harvestEnd: dayOffset(40), reservePrice: 2.5, reserveMax: 40 }),
    mk("corn", "vegetables", "Sweet corn", "🌽", 0.75, "ear", 36, 48, "basket", "Pick up the same day if you can", { bulkOn: true, bulkMin: 24, bulkPrice: 0.55 }),
    mk("carrots", "vegetables", "Carrots", "🥕", 2, "bunch", 15, 20, "pail", "Crunchy and sweet"),
    mk("eggs-chicken", "eggs", "Chicken eggs", "🥚", 5, "dozen", 12, 12, "carton", "Ungraded eggs, from happy hens. Keep refrigerated."),
    mk("eggs-duck", "eggs", "Duck eggs", "🥚", 7, "dozen", 3, 12, "carton", "Ungraded eggs. Rich and big. Keep refrigerated."),
    mk("milk-gallon", "milk", "Pasteurized milk", "🥛", 6, "gallon", 14, 20, "pail", "Grade A pasteurized only"),
    mk("pinto", "beans", "Pinto beans", "🫘", 3, "lb", 30, 40, "sack", "Dried and ready to cook", { bulkOn: true, bulkMin: 20, bulkPrice: 2.4 }),
    mk("greenbeans", "beans", "Green beans", "🫛", 2.5, "lb", 25, 40, "basket", "Snap 'em yourself"),
    mk("beef", "meat", "Ground beef", "🥩", 8, "lb", 20, 30, "cooler", "Grass-fed, processed at an inspected plant"),
    mk("pork", "meat", "Pork sausage", "🌭", 7, "lb", 9, 24, "board", "Home-ground and seasoned"),
    mk("honey", "specialty", "Wildflower honey", "🍯", 12, "jar", 10, 16, "shelf", "Raw and local"),
    mk("jam", "specialty", "Strawberry jam", "🍓", 7, "jar", 6, 16, "shelf", "Grandma's recipe"),
    mk("pickles", "specialty", "Pickles", "🥒", 6, "jar", 16, 16, "shelf", "Crunchy dills")
  ];
}

const SAMPLE_EXTRAS = {
  settings: {
    marketNotice: "", upickEnabled: true, upickEntryFee: 5, upickIncludes: "a bucket and work gloves", upickMaxParty: 12,
    farmAddress: "", farmHours: "By appointment. Book a visit or send a message!", farmPhone: "",
    farmStory: "A family farm where we grow what we eat and share the rest."
  },
  upick: [
    { id: "strawberries", name: "Strawberries", icon: "🍓", picking: "Rows 1-4" },
    { id: "tomatoes", name: "Tomatoes", icon: "🍅", picking: "North garden" },
    { id: "beans", name: "Green beans", icon: "🫛", picking: "By the fence" },
    { id: "corn", name: "Sweet corn", icon: "🌽", picking: "Back field" }
  ],
  activities: [
    { id: "tractor", name: "Tractor Driving", icon: "🚜", art: "tractor", price: 25, per: "person", duration: "30 min", minAge: 10, maxParty: 6,
      includes: "a safety talk", description: "Take the wheel of a real farm tractor with the farmer riding along. Beep beep!" },
    { id: "excavator", name: "Dig a Big Hole", icon: "🏗️", art: "excavator", price: 40, per: "person", duration: "20 min", minAge: 12, maxParty: 4,
      includes: "a safety talk and gear", description: "Run a real excavator with a trained guide beside you and dig the biggest hole of your life." },
    { id: "gold", name: "Gold Mining Trip", icon: "🪙", art: "gold", price: 60, per: "person", duration: "2-3 hours", minAge: 8, maxParty: 6,
      includes: "pans, gear and a keepsake vial",
      description: "Pan and sluice river rocks and collect the concentrate. Your guide handles the extraction and the furnace refining for safety, and you keep whatever gold we recover from your pay dirt. Amounts vary, so think souvenir, not paycheck!" }
  ],
  shapes: [
    { id: "heart-melon", name: "Heart Watermelon", icon: "🍉", art: "heart", fruit: "Watermelon", extraCharge: 15, leadWeeks: 10, maxQty: 12, description: "Grown inside a heart-shaped cage so it ripens into a heart. Perfect for weddings and anniversaries." },
    { id: "cube-melon", name: "Square Watermelon", icon: "🍉", art: "cube", fruit: "Watermelon", extraCharge: 12, leadWeeks: 10, maxQty: 12, description: "Stacks neatly in the fridge and starts every conversation." },
    { id: "star-cuke", name: "Star Cucumber", icon: "🥒", art: "star", fruit: "Cucumber", extraCharge: 3, leadWeeks: 6, maxQty: 40, description: "Slice it and every piece is a star." },
    { id: "pyramid-pumpkin", name: "Pyramid Pumpkin", icon: "🎃", art: "pyramid", fruit: "Pumpkin", extraCharge: 14, leadWeeks: 14, maxQty: 10, description: "A showstopper for fall tables." }
  ],
  badges: [
    { id: "wash", kind: "practice", icon: "🧼", name: "Clean harvest", detail: "Hand washing, clean buckets and clean water at harvest" },
    { id: "eggs", kind: "practice", icon: "🥚", name: "Eggs kept cold", detail: "Refrigerated at 45°F or below and labeled as ungraded" }
  ],
  photos: [
    { id: "dp1", kind: "farm", itemId: "potatoes", title: "Potato rows, week 6", src: "", placeholderIcon: "🥔" },
    { id: "dp2", kind: "farm", itemId: "tomatoes", title: "Tomatoes ripening on the vine", src: "", placeholderIcon: "🍅" },
    { id: "dp3", kind: "farm", itemId: "eggs-chicken", title: "The hens at work", src: "", placeholderIcon: "🐔" },
    { id: "dp4", kind: "farm", itemId: "apples", title: "The apple orchard", src: "", placeholderIcon: "🍎" },
    { id: "dp5", kind: "moment", itemId: "", title: "Picking day with the neighbors", src: "", placeholderIcon: "😄" },
    { id: "dp6", kind: "moment", itemId: "", title: "Tractor ride smiles", src: "", placeholderIcon: "🚜" }
  ]
};

/* =====================================================================
   The real backend (Google Apps Script)
   ===================================================================== */
const realApi = {
  async get(query) {
    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?${query}&t=${Date.now()}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "The farm stand didn't answer.");
    return data;
  },
  async post(body) {
    // text/plain avoids a CORS preflight, which Apps Script can't answer.
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    return res.json();
  },
  async getItems() { return (await this.get("action=items")).items; },
  getExtras() { return this.get("action=extras"); },
  getReviews() { return this.get("action=reviews"); },
  placeOrder(o) { return this.post({ action: "order", ...o }); },
  reserve(o) { return this.post({ action: "reserve", ...o }); },
  book(o) { return this.post({ action: "book", ...o }); },
  custom(o) { return this.post({ action: "custom", ...o }); },
  cancelOrder(code) { return this.post({ action: "cancel", code }); },
  review(o) { return this.post({ action: "review", ...o }); },
  message(o) { return this.post({ action: "message", ...o }); },
  admin(action, payload = {}) { return this.post({ action, adminKey: admin.key, ...payload }); }
};

/* =====================================================================
   Demo backend: everything is kept in this browser only
   ===================================================================== */
const DEMO_KEY = "demo";
const demoApi = {
  _items() { return safeGet("demoItems", null) || sampleItems(); },
  _code() { let c = "FARM-"; for (let i = 0; i < 5; i++) c += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]; return c; },
  _save(code, rec) { const o = safeGet("demoOrders", {}); o[code] = rec; safeSet("demoOrders", o); },
  async getItems() { return this._items(); },
  async getExtras() {
    return { ...SAMPLE_EXTRAS, photos: [...SAMPLE_EXTRAS.photos, ...safeGet("demoPhotos", [])] };
  },
  async getReviews() {
    const mine = safeGet("demoReviews", []).filter((r) => !r.deleted);
    const sample = { id: "sample", kind: "review", name: "Sample review", rating: 5, date: todayStr(), message: "This is a sample so you can see how reviews look. Real ones from your customers will show here." };
    const reviews = [...mine, sample];
    const rated = reviews.filter((r) => r.rating > 0);
    return { ok: true, reviews, avg: rated.length ? r2(rated.reduce((s, r) => s + r.rating, 0) / rated.length) : 0, ratedCount: rated.length };
  },
  async placeOrder(order) {
    const items = this._items();
    const lines = [];
    for (const want of order.items) {
      const it = items.find((i) => i.id === want.id);
      if (!it || it.quantity < want.qty) return { ok: false, error: `Sorry, there's only ${it ? it.quantity : 0} of ${it ? it.name : "that item"} left.`, items };
      const n = normalizeItem(it), price = unitPrice(n, want.qty);
      lines.push({ id: it.id, name: it.name, icon: it.icon, qty: want.qty, unit: it.unit, price, bulk: price < it.price });
    }
    lines.forEach((l) => { items.find((i) => i.id === l.id).quantity -= l.qty; });
    safeSet("demoItems", items);
    const code = this._code();
    this._save(code, { type: "order", lines, status: "Confirmed" });
    return { ok: true, code, items: lines, total: r2(lines.reduce((s, l) => s + l.qty * l.price, 0)) };
  },
  async reserve(o) {
    const it = this._items().find((i) => i.id === o.itemId);
    const n = it && normalizeItem(it);
    if (!n || !reserveOpen(n)) return { ok: false, error: "Sorry, that item is not open for reservations." };
    const lo = n.harvestStart && n.harvestStart > todayStr() ? n.harvestStart : todayStr();
    if (o.date < lo || o.date > n.harvestEnd) return { ok: false, error: `Please pick a day between ${lo} and ${n.harvestEnd}.` };
    if (n.reserveMax && o.qty > n.reserveMax) return { ok: false, error: `You can reserve up to ${n.reserveMax} ${n.unit} at a time.` };
    const price = reservePriceFor(n, o.qty);
    const line = { id: n.id, name: n.name, icon: n.icon, qty: o.qty, unit: n.unit, price, bulk: price < n.price };
    const code = this._code();
    this._save(code, { type: "reservation", lines: [line], status: "Requested" });
    return { ok: true, code, items: [line], total: r2(o.qty * price), date: o.date };
  },
  async book(o) {
    const info = bookingInfo(o.kind);
    if (!info) return { ok: false, error: "Sorry, that activity is not available." };
    if (!(o.party >= 1) || o.party > info.max) return { ok: false, error: `Party size must be between 1 and ${info.max}.` };
    const code = this._code();
    this._save(code, { type: "visit", status: "Requested" });
    return { ok: true, code, title: info.title, total: bookingTotal(info, o.party), date: o.date, timeSlot: o.timeSlot, party: o.party };
  },
  async custom(o) {
    const s = SAMPLE_EXTRAS.shapes.find((x) => x.id === o.shapeId);
    if (!s) return { ok: false, error: "Sorry, that shape is not available." };
    if (o.wantDate < dayOffset(s.leadWeeks * 7)) return { ok: false, error: `This shape takes about ${s.leadWeeks} weeks to grow. Please pick ${dayOffset(s.leadWeeks * 7)} or later.` };
    const code = this._code();
    this._save(code, { type: "custom", status: "Requested" });
    return { ok: true, code, total: r2(o.qty * s.extraCharge), shape: s.name, qty: o.qty, wantDate: o.wantDate };
  },
  async cancelOrder(code) {
    const orders = safeGet("demoOrders", {});
    const o = orders[code];
    if (!o) return { ok: false, error: "We couldn't find that code. Check it and try again." };
    if (o.status === "Cancelled") return { ok: true, already: true };
    if (o.type === "order") {
      const items = this._items();
      o.lines.forEach((l) => { const it = items.find((i) => i.id === l.id); if (it) it.quantity += l.qty; });
      safeSet("demoItems", items);
    }
    o.status = "Cancelled";
    safeSet("demoOrders", orders);
    return { ok: true };
  },
  async review(o) {
    const list = safeGet("demoReviews", []);
    list.unshift({ id: "r" + Date.now(), kind: o.kind, name: o.name || "A neighbor", rating: o.kind === "review" ? o.rating || 0 : 0, message: o.message, date: todayStr() });
    safeSet("demoReviews", list);
    return { ok: true };
  },
  async message() { return { ok: true }; },
  async admin(action, p = {}) {
    if (admin.key !== DEMO_KEY) return { ok: false, error: "That key is not right." };
    if (action === "admin_check") return { ok: true };
    if (action === "admin_delete_review") {
      const list = safeGet("demoReviews", []);
      list.forEach((r) => { if (r.id === p.id) r.deleted = true; });
      safeSet("demoReviews", list);
      return { ok: true };
    }
    if (action === "admin_upload_photo") {
      const list = safeGet("demoPhotos", []);
      list.unshift({ id: "up" + Date.now(), kind: p.kind, itemId: p.itemId || "", title: p.title || "", src: p.dataUrl || "" });
      if (!safeSet("demoPhotos", list)) return { ok: false, error: "This browser's demo storage is full. Try a smaller picture." };
      return { ok: true };
    }
    if (action === "admin_delete_photo") {
      safeSet("demoPhotos", safeGet("demoPhotos", []).filter((x) => x.id !== p.id));
      return { ok: true };
    }
    return { ok: false, error: "Unknown action." };
  }
};
const api = CONFIG.APPS_SCRIPT_URL ? realApi : demoApi;

/* ---------- loading ---------- */
async function loadItems({ quiet = false } = {}) {
  try {
    const raw = await api.getItems();
    state.items = raw.map(normalizeItem).filter((i) => i.id && i.name);
    state.loaded = true; state.loadError = "";
    // Never let the basket hold more than what's on the shelf.
    for (const id of Object.keys(state.basket)) {
      const it = itemById(id);
      if (!it || it.quantity <= 0) delete state.basket[id];
      else state.basket[id] = Math.min(state.basket[id], it.quantity);
    }
    safeSet("basket", state.basket);
    updateFab();
  } catch (err) {
    console.error(err);
    if (!quiet || !state.loaded) state.loadError = "The farm stand didn't answer. Check your connection and try again.";
  }
}
async function loadExtras() {
  try {
    const x = await api.getExtras();
    state.extras = {
      settings: x.settings || {},
      upick: x.upick || [],
      activities: (x.activities || []).map(normalizeActivity),
      shapes: (x.shapes || []).map(normalizeShape),
      badges: x.badges || [],
      photos: (x.photos || []).map(normalizePhoto)
    };
  } catch (err) { console.error(err); } // the shop still works without the extra pages
}
async function loadReviews() {
  try { state.community = await api.getReviews(); state.communityError = ""; }
  catch (err) { console.error(err); state.communityError = "Couldn't load reviews right now."; }
}

/* ---------- booking info shared by the visit pages and the form ---------- */
function bookingInfo(kind) {
  const s = state.extras.settings;
  if (kind === "upick") {
    return { title: "Pick-It-Yourself visit", icon: "🍓", price: Number(s.upickEntryFee) || 0, per: "person", max: Number(s.upickMaxParty) || 12,
      blurb: `Entry fee per person${s.upickIncludes ? ", includes " + s.upickIncludes : ""}. Pick what you like and we weigh it on the way out.` };
  }
  const a = state.extras.activities.find((x) => x.id === kind);
  if (!a) return null;
  return { title: a.name, icon: a.icon, price: a.price, per: a.per, max: a.maxParty || Number(s.upickMaxParty) || 12,
    blurb: [a.duration, a.minAge ? `ages ${a.minAge}+` : "", a.includes ? `includes ${a.includes}` : ""].filter(Boolean).join(" · ") };
}
