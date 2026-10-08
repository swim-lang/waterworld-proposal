import { createViewer, prefersReducedMotion } from "./viewer.js";

/* ───────────────────────── data ───────────────────────── */

const STOPS = [
  {
    n: 1, title: "Start here", section: "#start", slug: "01-entrance-gate", landmark: "Main entrance",
    map: { x: 120, y: 88, w: 220, h: 182 },
    headline: "Everybody working from the same Water World",
    body: "Different contributors are using different fonts, styles, and treatments. We'll build a shared system around the strongest parts of the existing brand, with particular attention to typography.",
    facts: [["Kickoff", "Nov 18"], ["Delivery", "Dec 23"], ["Focus", "Typography"]],
    cta: "Read the intro",
    teaser: "Why we're here, what we heard from your team, and what should get easier.",
  },
  {
    n: 2, title: "Our approach", section: "#approach", slug: "02-lazy-river", landmark: "Lazy River",
    map: { x: 485, y: 126, w: 250, h: 144 },
    headline: "Get the basics working. Then see what they make possible.",
    body: "Four phases: understand the starting point, develop the system, put it to work, and make the handoff useful.",
    facts: [["Phases", "4"], ["Kickoff", "90 min"], ["Training", "60 min"]],
    cta: "See our approach",
    teaser: "Four phases, from a kickoff workshop to a handoff your team can actually use.",
  },
  {
    n: 3, title: "Selected work", section: "#work", slug: "03-slide-tower", landmark: "Slide tower",
    map: { x: 25, y: 300, w: 210, h: 245 },
    headline: "A few things we've enjoyed making",
    body: "Our work often involves illustration, characters, and expressive visual ideas. These projects show how those ideas become a system people can use.",
    facts: [["Projects", "3"], ["Each shows", "System + uses"], ["Sectors", "Retail"]],
    cta: "Browse the work",
    teaser: "Tagawa Gardens, Moat, and Freddie: one idea carried through a whole system.",
  },
  {
    n: 4, title: "Your team", section: "#team", slug: "04-alpine-springs-gondola", landmark: "Alpine Springs Express Gondola",
    map: { x: 305, y: 358, w: 230, h: 187 },
    headline: "You'll work with the people doing the work",
    body: "Anchovies is a boutique Denver agency. You'll have direct access to Sean and the designers developing the system, from the first review through the final handoff.",
    facts: [["Founder & CD", "Sean"], ["Illustrative AD", "Kira"], ["Art Director", "Logan"]],
    cta: "Meet the team",
    teaser: "Sean, Kira, and Logan: the people presenting are the people doing the work.",
  },
  {
    n: 5, title: "Try the tool", section: "#tool", slug: "05-cowabunga-beach", landmark: "Cowabunga Beach",
    map: { x: 600, y: 358, w: 220, h: 187 },
    headline: "Some design decisions only need to be made once",
    body: "A recurring promotion shouldn't require rebuilding the layout every time. Edit a headline, image, and event details to see how a coded template responds.",
    facts: [["Edit", "Headline"], ["Swap", "Photo"], ["Update", "Details"]],
    cta: "Try a sample",
    teaser: "Edit a headline, swap a photo, and watch a coded template keep the design in place.",
  },
  {
    n: 6, title: "Scope & Pricing", section: "#pricing", slug: "06-thunder-bay", landmark: "Thunder Bay wave pool",
    map: { x: 100, y: 661, w: 260, h: 159 },
    headline: "A useful foundation for the next season",
    body: "The base engagement covers discovery, the visual system, comprehensive standards, sample applications, editable templates, and handoff.",
    facts: [["Fixed fee", "$10,000"], ["Payments", "50/25/25"], ["Delivery", "Dec 23"]],
    cta: "See the full scope",
    teaser: "A $10,000 fixed fee, a 50/25/25 payment schedule, and delivery by December 23.",
  },
  {
    n: 7, title: "Your questions", section: "#questions", slug: "07-lost-river-of-the-pharaohs", landmark: "Lost River of the Pharaohs",
    map: { x: 502, y: 643, w: 215, h: 177 },
    headline: "Eight good questions, answered",
    body: "Every question from the RFP, answered plainly: from what makes a standards guide useful to how we'd approach the typography.",
    facts: [["Questions", "8"], ["Answered", "All 8"], ["Jargon", "None"]],
    cta: "Read the answers",
    teaser: "Straight answers to all eight of your questions.",
  },
];

// scenery on the map (design units: 840 × 870 stage)
const DECOR = [
  ["08-voyage-volcano", 372, 150, 96, 93],
  ["10-bush-1", 360, 292, 56, 52], ["11-bush-2", 770, 240, 52, 45], ["10-bush-1", 40, 628, 56, 52],
  ["11-bush-2", 395, 770, 52, 45], ["11-bush-2", 775, 620, 52, 45],
  ["20-guest-1", 385, 236, 28, 44], ["22-guest-3", 790, 700, 28, 46],
  ["24-guest-5", 250, 612, 32, 41], ["25-guest-6", 470, 740, 31, 48], ["26-group-family", 575, 590, 36, 63],
  ["27-group-chat", 330, 600, 40, 54], ["28-group-trio", 690, 280, 50, 59],
];

const STAGE_W = 840, STAGE_H = 870;
const mapImg = (slug) => `assets/map/${slug}.webp`;
const detailImg = (slug) => `assets/detail/${slug}.webp`;
const reduced = prefersReducedMotion();
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ───────────────────────── loader ───────────────────────── */

const loader = document.getElementById("loader");
(function runLoader() {
  let seen = false;
  try { seen = sessionStorage.getItem("ww-loaded") === "1"; } catch (e) { /* storage blocked */ }
  if (seen) { loader.remove(); return; }
  const started = performance.now();
  const minShow = reduced ? 300 : 1100;
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    const wait = Math.max(0, minShow - (performance.now() - started));
    setTimeout(() => {
      loader.classList.add("is-done");
      setTimeout(() => loader.remove(), 600);
      try { sessionStorage.setItem("ww-loaded", "1"); } catch (e) { /* ignore */ }
    }, wait);
  };
  if (document.readyState === "complete") done(); else window.addEventListener("load", done);
  setTimeout(done, 4000); // never hold people up for long
})();

/* ───────────────────────── park map (home) ───────────────────────── */

const stage = document.getElementById("park-stage");
const park = stage.parentElement;
const px = (v) => `${v}px`;

function buildMap() {
  stage.style.width = px(STAGE_W);
  stage.style.height = px(STAGE_H);
  stage.innerHTML = `
    <svg class="park-ground" width="900" height="860" viewBox="0 0 900 860" aria-hidden="true">
      <path d="M70 205 C 38 128, 128 42, 248 56 C 328 66, 362 28, 452 36 C 560 46, 612 18, 702 60 C 792 102, 834 170, 816 262 C 804 332, 846 384, 836 472 C 826 560, 798 604, 820 684 C 842 772, 762 848, 650 842 C 560 838, 518 862, 428 852 C 330 842, 282 868, 190 846 C 90 822, 28 762, 44 670 C 56 600, 18 556, 24 478 C 30 398, 72 358, 56 290 C 48 254, 76 232, 70 205 Z"/>
    </svg>`;
  DECOR.forEach(([slug, x, y, w, h]) => {
    const img = document.createElement("img");
    img.className = "decor";
    img.src = mapImg(slug);
    img.alt = "";
    Object.assign(img.style, { left: px(x), top: px(y), width: px(w), height: px(h) });
    stage.appendChild(img);
  });
  // draw back-to-front so nearer landmarks overlap the ones behind; keep tab order 1 → 7
  [...STOPS].sort((a, b) => (a.map.y + a.map.h) - (b.map.y + b.map.h)).forEach((s) => {
    const a = document.createElement("a");
    a.className = "stop";
    a.href = s.section;
    a.dataset.n = s.n;
    a.setAttribute("aria-label", `Stop ${s.n}: ${s.title}. ${s.landmark}.`);
    Object.assign(a.style, { left: px(s.map.x), top: px(s.map.y), width: px(s.map.w), height: px(s.map.h) });
    a.innerHTML = `
      <span class="stop-art"><img src="${mapImg(s.slug)}" alt="" draggable="false" /></span>
      <span class="stop-pin"><span class="num">${s.n}</span><span class="stop-title">${s.title}</span><span class="stop-go" aria-hidden="true">→</span></span>`;
    if (finePointer && !reduced) {
      a.addEventListener("pointerenter", () => startHoverSpin(a, s));
      a.addEventListener("pointerleave", () => stopHoverSpin(a));
    }
    a.addEventListener("focus", () => a.classList.add("is-hover"));
    a.addEventListener("blur", () => a.classList.remove("is-hover"));
    stage.appendChild(a);
  });
  fitMap();
}

function fitMap() {
  const scale = Math.min(park.clientWidth / STAGE_W, 1.15);
  stage.style.transform = `scale(${scale})`;
  park.style.height = px(STAGE_H * scale);
}
new ResizeObserver(fitMap).observe(park);

// hover: the landmark grows a little, then its 3D model picks up from the picture and turns slowly
let hoverTimer = 0;
function startHoverSpin(el, s) {
  el.classList.add("is-hover");
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    if (!el.classList.contains("is-hover") || el._viewer) return;
    const art = el.querySelector(".stop-art");
    const host = document.createElement("span");
    host.className = "stop-3d";
    art.appendChild(host);
    el._viewer = createViewer(host, {
      slug: s.slug, view: "map", turn: 0.18, animate: true,
      // the still fills .stop-art; the canvas host is larger so the model can turn without clipping
      getBox: () => ({ x: -host.offsetLeft, y: -host.offsetTop, w: art.offsetWidth, h: art.offsetHeight }),
      onReady: () => el.classList.add("has-3d"),
    });
  }, 120);
}
function stopHoverSpin(el) {
  el.classList.remove("is-hover", "has-3d");
  if (el._viewer) {
    const v = el._viewer;
    el._viewer = null;
    setTimeout(() => { v.dispose(); el.querySelector(".stop-3d")?.remove(); }, 250);
  }
}

/* ───────────────────────── mobile park tour (home) ───────────────────────── */

const tour = document.getElementById("tour");
const track = document.getElementById("tour-track");
const dots = document.getElementById("tour-dots");
let tourIndex = 1;

function buildTour() {
  track.innerHTML = STOPS.map((s) => `
    <li class="tour-card" data-n="${s.n}">
      <img src="${mapImg(s.slug)}" alt="${s.landmark}" loading="lazy" />
      <p class="tour-title"><span class="num">${s.n}</span>${s.title}</p>
      <p class="tour-teaser">${s.teaser}</p>
      <a class="btn btn-ink" href="${s.section}">Visit this stop <span aria-hidden="true">→</span></a>
    </li>`).join("");
  dots.innerHTML = STOPS.map((s) => "<span></span>").join("");
  const cards = [...track.children];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.intersectionRatio > 0.6) setTourIndex(Number(en.target.dataset.n)); });
  }, { root: track, threshold: [0.6] });
  cards.forEach((c) => io.observe(c));
  setTourIndex(1);
  const go = (d) => {
    const n = Math.min(7, Math.max(1, tourIndex + d));
    track.scrollTo({ left: cards[n - 1].offsetLeft - track.offsetLeft - 20, behavior: reduced ? "auto" : "smooth" });
  };
  document.getElementById("tour-prev").addEventListener("click", () => go(-1));
  document.getElementById("tour-next").addEventListener("click", () => go(1));
}
function setTourIndex(n) {
  tourIndex = n;
  document.getElementById("tour-n").textContent = n;
  [...dots.children].forEach((d, i) => d.classList.toggle("on", i === n - 1));
  document.getElementById("tour-prev").disabled = n === 1;
  document.getElementById("tour-next").disabled = n === 7;
}

// hero button: on phones it starts the guided tour; on desktop it goes to the first stop
const heroBtn = document.querySelector(".hero .btn-sun");
const phone = window.matchMedia("(max-width: 760px)");
function applyLayout() {
  tour.hidden = !phone.matches;
  heroBtn.firstChild.textContent = phone.matches ? "Start the tour " : "Start at stop 1 ";
  heroBtn.setAttribute("href", phone.matches ? "#tour" : "#start");
}
phone.addEventListener("change", applyLayout);

/* ───────────────────────── stop pages ─────────────────────────
   Each section is its own page: the turning landmark and a summary up top,
   then scroll down for everything in that section. The park map is home. */

const home = document.getElementById("home");
const navMap = document.querySelector(".nav-map");
const sections = STOPS.map((s) => document.querySelector(s.section));
let pageViewer = null;
let currentStop = 0;

function buildStopPages() {
  STOPS.forEach((s, i) => {
    const sec = sections[i];
    sec.classList.add("stop-page");
    const prev = STOPS[i - 1], next = STOPS[i + 1];
    const title = sec.querySelector(".section-head h2").textContent;
    const intro = document.createElement("header");
    intro.className = "stop-intro";
    intro.innerHTML = `
      <div class="si-stage"><img class="si-poster" src="${detailImg(s.slug)}" alt="${s.landmark}, modelled in 3D" /></div>
      <div class="si-content">
        <p class="si-label"><span class="num">${s.n}</span>${s.title}</p>
        <h1 tabindex="-1">${title}</h1>
        <p class="si-body">${s.body}</p>
        <dl class="si-facts">${s.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
        <a class="btn btn-sun si-more" href="#${sec.id}-more">Keep reading <span aria-hidden="true">↓</span></a>
      </div>`;
    sec.prepend(intro);
    const anchor = document.createElement("span");
    anchor.id = `${sec.id}-more`;
    anchor.className = "si-anchor";
    intro.after(anchor);
    const nav = document.createElement("nav");
    nav.className = "stop-nav";
    nav.setAttribute("aria-label", "Stops");
    nav.innerHTML = `
      <a class="stop-nav-prev" href="${prev ? prev.section : "#top"}"><span class="k">${prev ? "Previous stop" : "Back to"}</span><span class="v"><span aria-hidden="true">←</span> ${prev ? `${prev.n} · ${prev.title}` : "The park map"}</span></a>
      <div class="sv-dots" aria-hidden="true">${STOPS.map((t) => `<span class="${t.n === s.n ? "on" : ""}"></span>`).join("")}</div>
      <a class="stop-nav-next" href="${next ? next.section : "#top"}"><span class="k">${next ? "Next stop" : "Back to"}</span><span class="v">${next ? `${next.n} · ${next.title}` : "The park map"} <span aria-hidden="true">→</span></span></a>`;
    sec.append(nav);
  });
}

function route() {
  const id = location.hash.replace("#", "");
  if (id.endsWith("-more")) return; // in-page "keep reading" jump
  const n = STOPS.findIndex((s) => s.section === `#${id}`) + 1;
  if (pageViewer) { pageViewer.dispose(); pageViewer = null; }
  if (!n) { // home
    currentStop = 0;
    home.hidden = false;
    sections.forEach((sec) => sec.classList.remove("is-current"));
    navMap.hidden = true;
    document.title = "Water World × Anchovies · Visual Brand Standards Proposal";
    window.scrollTo(0, 0);
    return;
  }
  const s = STOPS[n - 1], sec = sections[n - 1];
  currentStop = n;
  home.hidden = true;
  sections.forEach((el) => el.classList.toggle("is-current", el === sec));
  navMap.hidden = false;
  document.title = `${s.n} · ${s.title} · Water World × Anchovies`;
  window.scrollTo(0, 0);
  sec.classList.remove("has-3d");
  const stageEl = sec.querySelector(".si-stage");
  const host = document.createElement("div");
  host.className = "si-3d";
  stageEl.querySelector(".si-3d")?.remove();
  stageEl.appendChild(host);
  pageViewer = createViewer(host, {
    slug: s.slug, view: "detail", turn: 0.14, animate: true,
    getBox: () => ({ x: -host.offsetLeft, y: -host.offsetTop, w: stageEl.clientWidth, h: stageEl.clientHeight }),
    onReady: () => sec.classList.add("has-3d"),
  });
  sec.querySelector(".stop-intro h1").focus({ preventScroll: true });
}

window.addEventListener("hashchange", route);
document.addEventListener("keydown", (e) => {
  if (!currentStop || e.target.closest("input, textarea, select, [contenteditable]")) return;
  if (e.key === "Escape") location.hash = "#top";
});

/* ───────────────────────── template tool ───────────────────────── */

const PALETTES = [
  { name: "Water World blue", bg: "#005299", ink: "#FFFFFF", accent: "#FFC629", panel: "#E3F4FC" },
  { name: "Sun", bg: "#FFC629", ink: "#005299", accent: "#005299", panel: "#FFFFFF" },
  { name: "Splash", bg: "#2BA8E0", ink: "#005299", accent: "#FFFFFF", panel: "#E3F4FC" },
  { name: "Shallows", bg: "#D9EFFB", ink: "#005299", accent: "#2BA8E0", panel: "#FFFFFF" },
];
// real Water World photography (from waterworldcolorado.com), so the demo looks like their own posts
const TOOL_IMAGES = [
  ["centennial-basin", "Riders on a raft in the Centennial Basin bowl"], ["critter-cove", "Critter Cove play area and slides"],
  ["splash", "A little one splashing in the water"], ["tube-riders", "Two friends riding a tube down a slide"],
];
const toolImg = (name) => `assets/tool/${name}.jpg`;

function buildTool() {
  const form = document.getElementById("tool-form");
  const canvas = document.getElementById("tool-canvas");
  const ctx = canvas.getContext("2d");
  const state = { palette: 0, pattern: "none", strength: 50, patternColor: "auto", image: null, imageIsPhoto: false };
  const logo = new Image(); logo.src = "assets/brand/water-world-logo.png";

  const imgWrap = document.getElementById("tool-images");
  imgWrap.innerHTML = TOOL_IMAGES.map(([slug, label], i) => `
    <label class="tool-thumb"><input type="radio" name="image" value="${slug}" ${i === 0 ? "checked" : ""} />
    <img src="${toolImg(slug)}" alt="${label}" /></label>`).join("");
  const sw = document.getElementById("tool-swatches");
  sw.innerHTML = PALETTES.map((p, i) => `
    <label class="swatch" title="${p.name}"><input type="radio" name="palette" value="${i}" ${i === 0 ? "checked" : ""} />
    <span style="background:${p.bg}"></span><span class="sr">${p.name}</span></label>`).join("");

  function loadImage(src) {
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
  }

  function fitHeadline(text, maxW, maxLines) {
    for (let size = 128; size >= 60; size -= 4) {
      ctx.font = `900 ${size}px Fraunces`;
      const words = text.split(/\s+/).filter(Boolean);
      const lines = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width <= maxW) line = test;
        else { if (line) lines.push(line); line = w; }
      }
      if (line) lines.push(line);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
      if (lines.length <= maxLines && widest <= maxW) return { size, lines };
    }
    ctx.font = "900 60px Fraunces";
    return { size: 60, lines: [text.slice(0, 40) + "…"] };
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function draw() {
    const p = PALETTES[state.palette];
    const W = canvas.width, H = canvas.height, M = 64;
    ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
    const pc = state.patternColor === "auto" ? p.accent : state.patternColor;
    if (state.pattern === "ripples") drawRipples(pc, W, H);
    if (state.pattern === "waves") drawWaveEdge(pc, W, H);

    // image panel
    const ix = M, iy = M, iw = W - M * 2, ih = 700;
    ctx.save(); roundRect(ix, iy, iw, ih, 36); ctx.clip();
    ctx.fillStyle = p.panel; ctx.fillRect(ix, iy, iw, ih);
    if (state.image) {
      const im = state.image;
      const s = state.imageIsPhoto ? Math.max(iw / im.width, ih / im.height) : Math.min((iw - 80) / im.width, (ih - 60) / im.height);
      const dw = im.width * s, dh = im.height * s;
      ctx.drawImage(im, ix + (iw - dw) / 2, iy + (ih - dh) / 2 + (state.imageIsPhoto ? 0 : 20), dw, dh);
    }
    ctx.restore();

    // logo plate
    if (logo.complete) {
      ctx.fillStyle = "#FFFFFF"; roundRect(ix + 28, iy + 28, 300, 92, 46); ctx.fill();
      ctx.drawImage(logo, ix + 52, iy + 44, 252, 59);
    }

    // headline, date, details
    const data = new FormData(form);
    // the wave edge takes the bottom of the post, so the headline gets two lines instead of three
    const head = fitHeadline(String(data.get("headline") || " "), iw, state.pattern === "waves" ? 2 : 3);
    let y = iy + ih + 64;
    // keep the copy legible over a full-bleed pattern: calm the pattern behind the text block
    if (state.pattern === "ripples") {
      const top = iy + ih + 24, bottom = H - 30;
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, hexA(p.bg, 0)); g.addColorStop(0.12, hexA(p.bg, 0.72)); g.addColorStop(0.88, hexA(p.bg, 0.72)); g.addColorStop(1, hexA(p.bg, 0));
      ctx.fillStyle = g; ctx.fillRect(0, top, W, bottom - top);
    }
    ctx.fillStyle = p.ink; ctx.textBaseline = "top";
    ctx.font = `900 ${head.size}px Fraunces`;
    head.lines.forEach((l) => { ctx.fillText(l, M, y); y += head.size * 1.0; });
    y += 26;
    ctx.fillStyle = p.accent; ctx.font = "700 46px 'Instrument Sans'";
    ctx.fillText(String(data.get("date") || ""), M, y, iw);
    y += 62;
    ctx.fillStyle = p.ink; ctx.globalAlpha = 0.9; ctx.font = "500 38px 'Instrument Sans'";
    ctx.fillText(String(data.get("details") || ""), M, y, iw);
    ctx.globalAlpha = 1;
  }

  // water patterns, coloured from the chosen palette
  function wavePath(y, amp, len, phase, W) {
    ctx.moveTo(-20, y);
    for (let x = -20; x <= W + 20; x += 8) ctx.lineTo(x, y + Math.sin((x / len) * Math.PI * 2 + phase) * amp);
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  // strength 0–100 → ripples 6–40% opacity; the wave edge 35–100%
  function drawRipples(color, W, H) {
    ctx.save();
    ctx.strokeStyle = color; ctx.globalAlpha = 0.06 + (state.strength / 100) * 0.34; ctx.lineWidth = 7; ctx.lineCap = "round";
    for (let y = 20, i = 0; y < H + 40; y += 46, i++) {
      ctx.beginPath(); wavePath(y, 9, 132, i % 2 ? Math.PI : 0, W); ctx.stroke();
    }
    ctx.restore();
  }
  function drawWaveEdge(color, W, H) {
    const layers = [[H - 128, 0.3, 0.4], [H - 96, 0.6, 1.9], [H - 62, 1, 3.3]];
    const k = 0.35 + (state.strength / 100) * 0.65;
    ctx.save();
    ctx.fillStyle = color;
    for (const [y, alpha, phase] of layers) {
      ctx.globalAlpha = alpha * k;
      ctx.beginPath(); wavePath(y, 14, 260, phase, W); ctx.lineTo(W + 20, H); ctx.lineTo(-20, H); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  async function setStockImage(slug) {
    state.image = await loadImage(toolImg(slug));
    state.imageIsPhoto = true;
    draw();
  }

  form.addEventListener("input", async (e) => {
    if (e.target.name === "palette") state.palette = Number(e.target.value);
    if (e.target.name === "pattern") { state.pattern = e.target.value; document.getElementById("pattern-adjust").hidden = state.pattern === "none"; }
    if (e.target.name === "patternStrength") state.strength = Number(e.target.value);
    if (e.target.name === "patternColor") state.patternColor = e.target.value;
    if (e.target.name === "image") await setStockImage(e.target.value);
    draw();
  });
  form.upload.addEventListener("change", async () => {
    const f = form.upload.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    state.image = await loadImage(url);
    state.imageIsPhoto = true;
    form.querySelectorAll("input[name=image]").forEach((r) => (r.checked = false));
    draw();
  });
  document.getElementById("tool-export").addEventListener("click", () => {
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "water-world-template-demo.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, "image/png");
  });

  Promise.all([document.fonts.load("900 64px Fraunces"), document.fonts.load("700 40px 'Instrument Sans'"), document.fonts.load("500 40px 'Instrument Sans'")])
    .catch(() => {})
    .then(() => { logo.onload = draw; setStockImage(TOOL_IMAGES[0][0]); });
}

/* ───────────────────────── print / PDF ───────────────────────── */

// every answer prints, even if it was collapsed on screen
let closedForPrint = [];
window.addEventListener("beforeprint", () => {
  closedForPrint = [...document.querySelectorAll(".qa details:not([open]), .phase-details details:not([open])")];
  closedForPrint.forEach((d) => (d.open = true));
});
window.addEventListener("afterprint", () => closedForPrint.forEach((d) => (d.open = false)));

/* ───────────────────────── boot ───────────────────────── */

buildMap();
buildTour();
buildTool();
buildStopPages();
applyLayout();
route();
