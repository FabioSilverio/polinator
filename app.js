(() => {
  "use strict";
  const P = window.POL;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
  const EASE_IO = "cubic-bezier(0.77, 0, 0.175, 1)";

  /* ---------- formatting ---------- */
  const fmtPct = (v, d = 1) => {
    if (!isFinite(v)) return "—";
    const r = Math.abs(v) < 0.05 ? 0 : v;
    return (r > 0 ? "+" : r < 0 ? "−" : "") + Math.abs(r).toFixed(d).replace(".", ",") + "%";
  };
  const fmtPts = (v) => (v > 0.05 ? "+" : v < -0.05 ? "−" : "") + Math.abs(v).toFixed(1).replace(".", ",");
  const cls = (v) => (v > 0.4 ? "up" : v < -0.4 ? "down" : "flat");
  const fmtRate = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: v < 10 ? 3 : v < 1000 ? 2 : 0 });
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const fmtDate = (iso) => { const [y, m, d] = iso.split("-"); return `${+d} ${MONTHS[+m - 1]} ${y}`; };
  const fmtMonth = (iso) => { const [y, m] = iso.split("-"); return `${MONTHS[+m - 1]} ${y.slice(2)}`; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- number tween (interruptible: always starts from the value on screen) ---------- */
  function tween(el, to, fmt, dur = 800) {
    if (!el) return;
    const from = el._v == null ? to : el._v;
    cancelAnimationFrame(el._raf);
    if (reduced || Math.abs(from - to) < 1e-9) { el._v = to; el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el._v = from + (to - from) * e;
      el.textContent = fmt(el._v);
      if (p < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }
  const swapText = (el, txt) => {
    if (!el || el.textContent === txt) return;
    el.textContent = txt;
    if (reduced) return;
    el.classList.remove("swap-in"); void el.offsetWidth; el.classList.add("swap-in");
  };

  const fmtUSD = (v) => "US$ " + Math.round(v).toLocaleString("pt-BR");
  const mapsUrl = (q) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  const PIN = '<svg class="pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
  const cityLink = (m, cls = "city-link") => `<a class="${cls}" href="${mapsUrl(m.city + ", " + m.country)}" target="_blank" rel="noopener" title="Abrir ${esc(m.city)} no Google Maps">${esc(m.city)}${PIN}</a>`;
  const CUR = [...new Set(Object.values(P.countries).map((c) => c.cur))];
  const FLOAT = CUR.filter((c) => c !== "USD" && !Object.values(P.countries).find((k) => k.cur === c && k.peg));
  const N = 25; // months t-24 … t (index 24 = latest)

  const S = {
    R: new Array(N).fill(null), dates: new Array(N).fill(null), live: false, hist: false,
    t: 24, metrics: [], region: "all", sort: "score", showAll: false,
    selected: null, legend: null, firstRank: true, playing: null, k: 1,
  };

  /* =================== FX loading =================== */
  const urlsFor = (d) => [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${d}/v1/currencies/usd.min.json`,
    `https://${d}.currency-api.pages.dev/v1/currencies/usd.min.json`,
  ];
  async function getJSON(urls, timeout = 8000) {
    for (const u of urls) {
      try {
        const ctl = new AbortController();
        const tm = setTimeout(() => ctl.abort(), timeout);
        const r = await fetch(u, { signal: ctl.signal });
        clearTimeout(tm);
        if (r.ok) return await r.json();
      } catch (e) { /* next */ }
    }
    throw new Error("unreachable");
  }
  function pick(rates) {
    const o = { USD: 1 };
    for (const c of CUR) { const v = c === "USD" ? 1 : rates[c.toLowerCase()] ?? rates[c]; if (v) o[c] = +v; }
    return o;
  }
  function monthsBack(iso, m) {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() - m);
    return d.toISOString().slice(0, 10);
  }
  function seedSnapshot() {
    const f = P.fallback;
    S.R[24] = { ...f.now }; S.R[21] = { ...f.m3 }; S.R[12] = { ...f.y1 };
    S.dates[24] = f.date; S.dates[21] = monthsBack(f.date, 3); S.dates[12] = monthsBack(f.date, 12);
  }

  async function loadFX() {
    setStatus("loading");
    let latest = null;
    try { const j = await getJSON(urlsFor("latest")); latest = { date: j.date, rates: pick(j.usd) }; }
    catch (e) {
      try { const j = await getJSON(["https://open.er-api.com/v6/latest/USD"]); latest = { date: new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10), rates: pick(j.rates) }; }
      catch (e2) { latest = null; }
    }
    if (!latest) { setStatus("off"); S.histDone = true; renderAll(); return; }
    S.R[24] = { ...P.fallback.now, ...latest.rates };
    S.dates[24] = latest.date;
    S.live = true;
    setStatus("live");
    renderAll();

    const dates = Array.from({ length: 24 }, (_, i) => monthsBack(latest.date, 24 - i));
    const res = await Promise.allSettled(dates.map((d) => getJSON(urlsFor(d), 9000)));
    let ok = 0;
    res.forEach((r, i) => {
      S.dates[i] = dates[i];
      if (r.status === "fulfilled") { S.R[i] = pick(r.value.usd); ok++; }
    });
    S.hist = !!(ok >= 18 && S.R[12] && S.R[0]);
    S.histDone = true;
    setupTimeline();
    renderAll();
  }

  function rateAt(i, c) {
    for (let d = 0; d <= 3; d++) {
      for (const j of [i - d, i + d]) if (j >= 0 && j < N && S.R[j] && S.R[j][c]) return S.R[j][c];
    }
    return S.R[24] && S.R[24][c] ? S.R[24][c] : 1;
  }

  function setStatus(s) {
    const st = $("#dxStatus");
    st.className = "status " + (s === "live" ? "live" : s === "off" ? "off" : "");
    st.querySelector("span").textContent =
      s === "live" ? "Câmbio ao vivo" : s === "off" ? "Sem conexão · cotação de " + fmtDate(P.fallback.date) : "Buscando câmbio…";
  }

  /* =================== scoring at month t =================== */
  function compute(t) {
    const yi = t - 12, mi = t - 3;
    return P.cities.map((c) => {
      const k = P.countries[c.cc];
      const cur = k.cur;
      const now = rateAt(t, cur), y1 = rateAt(yi, cur), m3 = rateAt(mi, cur);
      const nom12 = (now / y1 - 1) * 100;
      const nom3 = (now / m3 - 1) * 100;
      const real12 = ((1 + nom12 / 100) * (1 + P.US_INFL / 100) / (1 + k.infl / 100) - 1) * 100;
      const eff = c.cost / (1 + real12 / 100);
      const value = clamp((90 - eff) / 70, 0, 1) * 100;
      const fx = clamp((real12 + 15) / 30, 0, 1) * 100;
      const mom = clamp((nom3 + 6) / 12, 0, 1) * 100;
      const score = Math.round(0.5 * value + 0.2 * fx + 0.1 * mom + 0.2 * (c.hype / 3) * 100);
      const series = [];
      for (let i = yi; i <= t; i++) if (S.R[i] && S.R[i][cur]) series.push(S.R[i][cur]);
      const daily = (P.DAILY_NYC * eff) / 100;
      const fare = P.fare[c.id] ?? P.fareByRegion[c.region];
      return { ...c, country: k.name, cur, peg: !!k.peg || cur === "USD", now, nom12, nom3, real12, eff, score, series, daily, fare, trip: fare + daily * 7 };
    });
  }
  const citiesOf = (cc) => S.metrics.filter((m) => m.cc === cc).sort((a, b) => b.score - a.score);
  const best = (list) => list.slice().sort((a, b) => b.score - a.score)[0];
  const bestForState = (name) => best(S.metrics.filter((m) => (P.states[name] || []).includes(m.cc)));
  const countryMetric = (cc) => S.metrics.find((m) => m.cc === cc);
  const destColor = (cc) => P.destColors[cc] || "#9aa0a6";

  /* =================== hero duel =================== */
  function renderHero() {
    const sorted = S.metrics.slice().sort((a, b) => b.score - a.score);
    const [a, b] = sorted;
    const live = S.t === 24;
    swapText($("#hNameA"), a.city); $("#hSubA").textContent = `${a.country} · ${a.cur}`;
    swapText($("#hNameB"), b.city); $("#hSubB").textContent = `${b.country} · ${b.cur}`;
    const avA = $("#hAvA"), avB = $("#hAvB");
    avA.textContent = a.cc; avB.textContent = b.cc;
    $("#hLead").textContent = a.city;
    const hl = $("#headline");
    const txt = live ? " lidera agora" : ` liderava em ${fmtMonth(S.dates[S.t] || "")}`;
    if (hl.lastChild.textContent !== txt) hl.lastChild.textContent = txt;
    tween($("#hScoreA"), a.score, (v) => Math.round(v));
    tween($("#hScoreB"), b.score, (v) => Math.round(v));
    $("#hNoteA").textContent = `nota · dólar real 12m ${fmtPct(a.real12)}`;
    $("#hNoteB").textContent = `nota · dólar real 12m ${fmtPct(b.real12)}`;
    const share = clamp(a.score / (a.score + b.score), 0.3, 0.7);
    $("#duelFill").style.transform = `scaleX(${share.toFixed(4)})`;
    const lt = $("#heroLive");
    lt.classList.toggle("past", !live);
    $("#heroLiveTxt").textContent = live ? (S.live ? `ao vivo · ${fmtDate(S.dates[24])}` : `cotação de ${fmtDate(P.fallback.date)}`) : `replay · ${fmtDate(S.dates[S.t] || "")}`;
    $("#heroProg").style.transform = `scaleX(${S.hist ? (S.t - 12) / 12 : 1})`;
    $("#hdrDate").textContent = fmtDate(S.dates[S.t] || P.fallback.date);
  }

  /* =================== left panel =================== */
  function dollarIndex() {
    const out = [];
    for (let t = 12; t <= 24; t++) {
      if (!S.R[t]) continue;
      let sn = 0, sr = 0, n = 0;
      for (const c of FLOAT) {
        const r0 = rateAt(12, c), r1 = S.R[t][c];
        if (!r0 || !r1) continue;
        const k = Object.values(P.countries).find((x) => x.cur === c);
        const g = r1 / r0;
        const infl = Math.pow((1 + P.US_INFL / 100) / (1 + k.infl / 100), (t - 12) / 12);
        sn += Math.log(g); sr += Math.log(g * infl); n++;
      }
      if (n) out.push({ t, nom: Math.exp(sn / n) * 100, real: Math.exp(sr / n) * 100 });
    }
    return out;
  }

  let chartBuilt = false, chartKey = "", chartGeo = null;
  function renderChart() {
    const box = $("#chart");
    if (!S.histDone) return;
    const pts = dollarIndex();
    if (pts.length < 2) { box.innerHTML = ""; return; }
    const key = S.dates[24] + "|" + pts.length;
    if (key === chartKey && chartGeo) { moveCursor(pts); return; }
    chartKey = key;
    const W = 290, H = 150, L = 34, R = 8, T = 8, B = 20;
    const vals = pts.flatMap((p) => [p.nom, p.real]).concat(100);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = Math.max(0.6, (hi - lo) * 0.18); lo -= pad; hi += pad;
    const x = (t) => L + ((t - 12) / 12) * (W - L - R);
    const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const line = (key) => "M" + pts.map((p) => `${x(p.t).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" L");
    const area = (key) => line(key) + ` L${x(pts[pts.length - 1].t).toFixed(1)},${H - B} L${x(pts[0].t).toFixed(1)},${H - B} Z`;
    const ticks = [lo + (hi - lo) * 0.15, 100, lo + (hi - lo) * 0.85];
    const cur = pts[pts.length - 1];
    const first = !chartBuilt;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Índice do dólar: nominal ${fmtPct(cur.nom - 100)}, real ${fmtPct(cur.real - 100)}">
      <defs>
        <linearGradient id="gNom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc53d" stop-opacity=".22"/><stop offset="1" stop-color="#ffc53d" stop-opacity="0"/></linearGradient>
        <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f7dff" stop-opacity=".2"/><stop offset="1" stop-color="#4f7dff" stop-opacity="0"/></linearGradient>
      </defs>
      <g class="grid">${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`).join("")}</g>
      <line class="base" x1="${L}" x2="${W - R}" y1="${y(100).toFixed(1)}" y2="${y(100).toFixed(1)}"/>
      ${ticks.map((v) => `<text x="${L - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${Math.round(v)}</text>`).join("")}
      <text x="${L}" y="${H - 4}">${esc(fmtMonth(S.dates[12] || ""))}</text>
      <text x="${W - R}" y="${H - 4}" text-anchor="end">${esc(fmtMonth(S.dates[24] || ""))}</text>
      <path class="ar real" d="${area("real")}"/><path class="ar nom" d="${area("nom")}"/>
      <path class="ln real" d="${line("real")}"/><path class="ln nom" d="${line("nom")}"/>
      <g class="cursor">
        <line x1="0" x2="0" y1="${T}" y2="${H - B}"/>
        <circle class="cn" cx="0" cy="0" r="3.6" fill="#ffc53d" stroke="#000" stroke-width="1.5"/>
        <circle class="cr" cx="0" cy="0" r="3.6" fill="#4f7dff" stroke="#000" stroke-width="1.5"/>
      </g>
    </svg>`;
    chartGeo = { x, y };
    moveCursor(pts, true);
    if (first && !reduced) {
      box.querySelectorAll(".ln").forEach((p, i) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1400, delay: 120 + i * 120, easing: EASE_OUT, fill: "backwards" });
      });
      box.querySelectorAll(".ar").forEach((p) => p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 700, easing: EASE_OUT, fill: "backwards" }));
    }
    chartBuilt = true;
  }
  function moveCursor(pts, instant) {
    const cur = pts.find((p) => p.t === S.t) || pts[pts.length - 1];
    const { x, y } = chartGeo;
    const g = $("#chart .cursor");
    const set = (el, tr) => { if (instant) el.style.transition = "none"; el.style.transform = tr; if (instant) { void el.getBoundingClientRect(); el.style.transition = ""; } };
    set(g, `translateX(${x(cur.t).toFixed(1)}px)`);
    set($(".cn", g), `translateY(${y(cur.nom).toFixed(1)}px)`);
    set($(".cr", g), `translateY(${y(cur.real).toFixed(1)}px)`);
    tween($("#dxNom"), cur.nom - 100, (v) => fmtPct(v));
    tween($("#dxReal"), cur.real - 100, (v) => fmtPct(v));
  }

  function renderLeft() {
    renderChart();
    // per-country (floating currencies only, one row per country)
    const byC = {};
    S.metrics.forEach((m) => { if (!m.peg) byC[m.cc] = m; });
    const cs = Object.values(byC);
    const cheaper = cs.filter((m) => m.real12 > 0).length;
    tween($("#kpiN"), cheaper, (v) => Math.round(v));
    $("#kpiTot").textContent = cs.length;
    const worst = cs.slice().sort((a, b) => a.real12 - b.real12)[0];
    $("#kpiWorst").textContent = `${worst.country} (${fmtPct(worst.real12)})`;

    // regions
    const regs = [["americas", "Américas"], ["europa", "Europa"], ["asia", "Ásia"], ["africa", "Áfr./OM"], ["oceania", "Oceania"]];
    const rbox = $("#regions");
    if (!rbox.children.length) rbox.innerHTML = regs.map(([id, l]) => `<div><small>${l}</small><b data-r="${id}">0</b></div>`).join("");
    regs.forEach(([id]) => {
      const list = S.metrics.filter((m) => m.region === id);
      const avg = list.reduce((s, m) => s + m.real12, 0) / list.length;
      const el = rbox.querySelector(`[data-r="${id}"]`);
      el.className = cls(avg);
      tween(el, avg, fmtPts);
    });

    // top gainers with FLIP reorder
    const top = cs.slice().sort((a, b) => b.real12 - a.real12).slice(0, 6);
    const maxV = Math.max(...top.map((m) => m.real12), 1);
    flipList($("#gainers"), top, (m) => m.cc, (el, m, i) => {
      if (!el.firstChild) el.innerHTML = `<span class="cc"></span><span class="bar"><span></span></span><span class="v"></span>`;
      el.children[0].textContent = m.cur;
      el.children[0].title = m.country;
      el.children[1].firstChild.style.transform = `scaleX(${clamp(m.real12 / maxV, 0.02, 1).toFixed(3)})`;
      tween(el.children[2], m.real12, (v) => fmtPct(v));
    });
  }

  /* ---------- FLIP helper (keyed list, smooth reorder) ---------- */
  function flipList(ul, items, key, fill) {
    const before = new Map();
    [...ul.children].forEach((el) => before.set(el.dataset.k, el.getBoundingClientRect().top));
    const existing = new Map([...ul.children].map((el) => [el.dataset.k, el]));
    const frag = document.createDocumentFragment();
    items.forEach((it, i) => {
      const k = String(key(it));
      let el = existing.get(k);
      if (!el) { el = document.createElement("li"); el.dataset.k = k; }
      fill(el, it, i);
      frag.appendChild(el);
    });
    ul.replaceChildren(frag);
    if (reduced) return;
    let n = 0;
    [...ul.children].forEach((el) => {
      const f = before.get(el.dataset.k);
      const l = el.getBoundingClientRect().top;
      if (f == null) {
        if (before.size) el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: Math.min(n++ * 20, 240), easing: EASE_OUT, fill: "backwards" });
      } else if (Math.abs(f - l) > 1) {
        el.animate([{ transform: `translateY(${f - l}px)` }, { transform: "none" }], { duration: 420, easing: EASE_IO });
      }
    });
  }

  /* =================== map =================== */
  let svg, zoomG, paths, labels, callouts, zoom, pathGen, centroids = {};
  const CALLOUT = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"];
  const NUDGE = { FL: [16, 6], LA: [-10, -2], MI: [12, 22], CA: [-10, 6], ID: [0, 22], KY: [8, 2], VA: [10, 4], WV: [-4, 6], NY: [8, 2], HI: [6, -18], AK: [0, 0], MN: [-6, 0], OK: [12, 0], TX: [8, 0], NC: [6, 0], TN: [4, 0], SC: [4, 2] };
  const tip = $("#tip");
  let tipTimer = 0;

  function intensity(score) { return 0.28 + clamp((score - 48) / 36, 0, 1) * 0.62; }

  function largestCentroid(f) {
    if (f.geometry.type !== "MultiPolygon") return pathGen.centroid(f);
    let bestA = -1, bestF = f;
    f.geometry.coordinates.forEach((poly) => {
      const g = { type: "Feature", geometry: { type: "Polygon", coordinates: poly } };
      const a = pathGen.area(g);
      if (a > bestA) { bestA = a; bestF = g; }
    });
    return pathGen.centroid(bestF);
  }

  async function drawMap() {
    svg = d3.select("#map");
    const mq = window.matchMedia("(max-width: 760px)");
    const fitBox = () => svg.attr("viewBox", mq.matches ? "0 0 975 615" : "0 0 1110 700");
    fitBox();
    mq.addEventListener("change", fitBox);
    let topo;
    try { topo = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-albers-10m.json"); }
    catch (e) {
      svg.append("text").attr("x", 487).attr("y", 300).attr("text-anchor", "middle").attr("fill", "#8e939a").attr("font-size", 18).text("Não deu para carregar o mapa. Use a lista ao lado.");
      return;
    }
    const features = topojson.feature(topo, topo.objects.states).features.filter((f) => P.states[f.properties.name]);
    pathGen = d3.geoPath();
    zoomG = svg.append("g").attr("class", "zoomable");
    paths = zoomG.append("g").selectAll("path").data(features).join("path")
      .attr("class", "state-path")
      .attr("d", pathGen)
      .attr("fill", (d) => destColor(P.states[d.properties.name][0]))
      .attr("fill-opacity", 0.32)
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", (d) => d.properties.name)
      .on("pointerenter", (e, d) => { if (e.pointerType === "mouse") showTip(e, d.properties.name); })
      .on("pointermove", (e) => { if (e.pointerType === "mouse") moveTip(e); })
      .on("pointerleave", hideTip)
      .on("click", (e, d) => { hideTip(); selectState(d.properties.name === S.selected ? null : d.properties.name, true); })
      .on("keydown", (e, d) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectState(d.properties.name); }
        if (e.key === "Escape") selectState(null);
      });

    features.forEach((f) => {
      const ab = P.stateAbbr[f.properties.name];
      const [cx, cy] = largestCentroid(f);
      const n = NUDGE[ab] || [0, 0];
      centroids[f.properties.name] = [cx + n[0], cy + n[1]];
    });

    labels = zoomG.append("g").selectAll("g").data(features.filter((f) => !CALLOUT.includes(P.stateAbbr[f.properties.name]))).join("g")
      .attr("class", "lbl")
      .attr("transform", (d) => `translate(${centroids[d.properties.name]})`);
    labels.append("text").attr("class", "ab").attr("text-anchor", "middle").attr("y", -2).text((d) => P.stateAbbr[d.properties.name]);
    labels.append("text").attr("class", "v").attr("text-anchor", "middle").attr("y", 11).text("");

    // callouts for the small north-east states
    const cg = svg.append("g").attr("class", "callouts");
    const order = CALLOUT.map((ab) => Object.keys(P.stateAbbr).find((n) => P.stateAbbr[n] === ab)).filter((n) => centroids[n]);
    callouts = cg.selectAll("g").data(order).join("g")
      .attr("class", "callout").attr("tabindex", 0).attr("role", "button").attr("aria-label", (d) => d)
      .on("click", (e, d) => selectState(d === S.selected ? null : d, true))
      .on("keydown", (e, d) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectState(d); } })
      .on("pointerenter", (e, d) => { if (e.pointerType === "mouse") showTip(e, d); })
      .on("pointermove", (e) => { if (e.pointerType === "mouse") moveTip(e); })
      .on("pointerleave", hideTip);
    callouts.each(function (d, i) {
      const g = d3.select(this);
      const [cx, cy] = centroids[d];
      const py = 150 + i * 34;
      g.append("polyline").attr("points", `${cx},${cy} ${cx + 18},${cy} 1000,${py + 13}`);
      g.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 2.4).attr("fill", "#fff");
      g.append("rect").attr("x", 1002).attr("y", py).attr("width", 96).attr("height", 26).attr("rx", 7).attr("fill", destColor(P.states[d][0]));
      g.append("text").attr("x", 1014).attr("y", py + 17.5).text(P.stateAbbr[d]);
      g.append("text").attr("class", "v").attr("x", 1088).attr("y", py + 17.5).attr("text-anchor", "end").text("");
    });

    zoom = d3.zoom().scaleExtent([1, 7]).translateExtent([[-60, -60], [1170, 680]])
      .filter((e) => {
        if (e.type === "wheel") return e.ctrlKey || e.metaKey;
        if (e.type === "touchstart") return e.touches.length > 1 || S.k > 1.01;
        return !e.button;
      })
      .on("zoom", (e) => {
        S.k = e.transform.k;
        zoomG.attr("transform", e.transform);
        labels.attr("transform", (d) => `translate(${centroids[d.properties.name]}) scale(${1 / e.transform.k})`);
        $(".callouts").classList.toggle("hide", e.transform.k > 1.05);
      });
    svg.call(zoom).on("dblclick.zoom", null);
    svg.style("touch-action", "pan-y");

    $("#zIn").addEventListener("click", () => svg.transition().duration(reduced ? 0 : 520).ease(d3.easeCubicInOut).call(zoom.scaleBy, 1.6));
    $("#zOut").addEventListener("click", () => svg.transition().duration(reduced ? 0 : 520).ease(d3.easeCubicInOut).call(zoom.scaleBy, 1 / 1.6));

    // entrance wave, west → east
    if (!reduced) {
      paths.each(function (d) {
        const [x] = centroids[d.properties.name];
        this.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 80 + (x / 975) * 700, easing: EASE_OUT, fill: "backwards" });
      });
      labels.each(function (d) {
        const [x] = centroids[d.properties.name];
        this.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 500 + (x / 975) * 700, easing: EASE_OUT, fill: "backwards" });
      });
    }
    renderMap(true);
  }

  function renderMap(first) {
    if (!paths) return;
    const dur = first || reduced ? 0 : 650;
    const sc = {};
    Object.keys(P.states).forEach((n) => { const b = bestForState(n); sc[n] = b ? b.score : 50; });
    paths.transition("fill").duration(dur).ease(d3.easeCubicOut).attr("fill-opacity", (d) => intensity(sc[d.properties.name]));
    const bcc = {};
    Object.keys(P.states).forEach((n) => { const b = bestForState(n); bcc[n] = b ? b.cc : ""; });
    labels.select(".v").transition("txt").duration(first ? 0 : dur).tween("text", function (d) {
      const n = d.properties.name, to = sc[n];
      const prev = parseInt((this.textContent.match(/d+/) || [])[0], 10);
      const i = d3.interpolateNumber(isFinite(prev) ? prev : to, to);
      return (t) => { this.textContent = `${bcc[n]} ${Math.round(i(t))}`; };
    });
    callouts.select("text.v").text((d) => `${bcc[d]} ${sc[d]}`);
    paths.attr("aria-label", (d) => {
      const n = d.properties.name; const b = bestForState(n);
      return `${n}: ${P.states[n].map((c) => P.countries[c].name).join(", ")}. Melhor jogada ${b.city}, nota ${b.score}`;
    });
    applyMapState();
  }

  function applyMapState() {
    if (!paths) return;
    const dim = (n) => (S.legend && P.states[n][0] !== S.legend) || (S.selected && n !== S.selected);
    paths.classed("is-active", (d) => d.properties.name === S.selected).classed("is-dim", (d) => dim(d.properties.name));
    labels.classed("is-dim", (d) => dim(d.properties.name));
    callouts.classed("is-active", (d) => d === S.selected).style("opacity", (d) => (dim(d) ? 0.3 : 1));
    if (S.selected) {
      const node = paths.filter((d) => d.properties.name === S.selected).node();
      if (node && node.nextSibling) { const f = document.activeElement === node; node.parentNode.appendChild(node); if (f) node.focus({ preventScroll: true }); }
    }
  }

  function zoomTo(name) {
    if (!zoom) return;
    const box = $("#map").viewBox.baseVal;
    let tr = d3.zoomIdentity;
    if (name) {
      const f = paths.filter((d) => d.properties.name === name).datum();
      const [[x0, y0], [x1, y1]] = pathGen.bounds(f);
      const k = clamp(0.55 / Math.max((x1 - x0) / 975, (y1 - y0) / 610), 1, 5);
      if (k > 1.25) tr = d3.zoomIdentity.translate(975 / 2, box.height / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    }
    svg.transition().duration(reduced ? 0 : 600).ease(d3.easeCubicInOut).call(zoom.transform, tr);
  }

  function showTip(e, name) {
    const b = bestForState(name);
    tip.innerHTML = `<b>${esc(name)}</b><span>${P.states[name].map((c, i) => `${i + 1}º ${esc(P.countries[c].name)}`).join(" · ")}</span><br><span>Melhor jogada: ${esc(b.city)} · <span class="sc">${b.score}</span> · ${fmtUSD(b.daily)}/dia</span>`;
    clearTimeout(tipTimer);
    tip.classList.toggle("instant", tip.classList.contains("show"));
    moveTip(e);
    tip.classList.add("show");
  }
  function moveTip(e) {
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + 16, y = e.clientY + 16;
    if (x + w > innerWidth - 12) x = e.clientX - w - 16;
    if (y + h > innerHeight - 12) y = e.clientY - h - 16;
    tip.style.setProperty("--tx", x + "px"); tip.style.setProperty("--ty", y + "px");
  }
  function hideTip() { tipTimer = setTimeout(() => tip.classList.remove("show", "instant"), 70); }

  function renderLegend() {
    const tally = {};
    Object.values(P.states).forEach((l) => { tally[l[0]] = (tally[l[0]] || 0) + 1; });
    const order = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);
    const box = $("#legend");
    box.innerHTML = `<div class="chips">${order.map((cc) => `<button type="button" data-cc="${cc}" aria-pressed="false"><i style="background:${destColor(cc)}"></i>${esc(P.countries[cc].name)} <span class="n">${tally[cc]}</span></button>`).join("")}</div>
      <div class="scale"><span class="sw"><i style="opacity:.3"></i><i style="opacity:.5"></i><i style="opacity:.7"></i><i style="opacity:.9"></i></span>melhor jogada: nota até 55 · 65 · 75 · mais</div>`;
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-cc]");
      if (!b) return;
      S.legend = S.legend === b.dataset.cc ? null : b.dataset.cc;
      box.classList.toggle("filtering", !!S.legend);
      box.querySelectorAll("button[data-cc]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cc === S.legend)));
      applyMapState();
    });
  }

  function renderPill() {
    const pill = $("#mapPill");
    let html;
    if (S.selected) {
      const b = bestForState(S.selected);
      html = `<span class="mini" style="--c:${destColor(b.cc)}">${b.cc}</span><span class="txt"><b>${esc(S.selected)}</b> <span>→</span> ${esc(b.city)} <span>·</span> <span class="sc">${b.score}</span></span>`;
    } else {
      const top = best(S.metrics);
      html = `<span class="mini" style="--c:#ffc53d">${top.cc}</span><span class="txt"><b>${esc(top.city)}</b> é o melhor destino <span>· ${esc(fmtDate(S.dates[S.t] || P.fallback.date))}</span></span>`;
    }
    if (pill.innerHTML !== html) {
      pill.innerHTML = html;
      if (!reduced) pill.animate([{ opacity: 0.4, filter: "blur(4px)", transform: "translateX(-50%) scale(.97)" }, { opacity: 1, filter: "blur(0)", transform: "translateX(-50%) scale(1)" }], { duration: 260, easing: EASE_OUT });
    }
  }

  /* =================== state panel =================== */
  const sel = $("#stateSelect");
  function fillSelect() {
    sel.innerHTML = `<option value="">Todos os estados</option>` + Object.keys(P.states).sort().map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join("");
    sel.addEventListener("change", () => selectState(sel.value || null, false));
  }
  function selectState(name, fromMap) {
    S.selected = name;
    sel.value = name || "";
    applyMapState();
    zoomTo(name);
    renderPill();
    renderState(true);
    if (fromMap && name && innerWidth <= 1180) $(".side").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }
  function fxChip(cc) {
    const m = countryMetric(cc);
    if (!m) return "";
    if (m.peg) return `<span class="fx flat">atrelada ao US$</span>`;
    return `<span class="fx ${cls(m.nom12)}">US$ ${fmtPct(m.nom12)} ${m.cur}</span>`;
  }
  function renderState(animate) {
    const body = $("#stateBody");
    let prefs, title, abbr, sub;
    if (S.selected) {
      prefs = P.states[S.selected]; title = S.selected; abbr = P.stateAbbr[S.selected];
      sub = "Para onde mais viajam fora dos EUA";
    } else {
      const tally = {};
      Object.values(P.states).forEach((l) => { tally[l[0]] = (tally[l[0]] || 0) + 1; });
      prefs = Object.keys(tally).sort((a, b) => tally[b] - tally[a]).slice(0, 3);
      title = "Estados Unidos"; abbr = "EUA"; sub = "Destinos nº 1 mais comuns · toque num estado";
    }
    const pool = S.metrics.filter((m) => prefs.includes(m.cc));
    const b = best(pool);
    const out = best(S.metrics.filter((m) => !prefs.includes(m.cc)));
    body.innerHTML = `
      <div class="st-title"><span class="ab">${abbr}</span><div><b>${esc(title)}</b><span>${esc(sub)}</span></div></div>
      <div class="prefs">${prefs.map((cc, i) => {
        const cities = citiesOf(cc);
        return `<div class="pref"><span class="rk">${i + 1}</span><i style="background:${destColor(cc)}"></i><b>${esc(P.countries[cc].name)} <span>· ${cities.map((c) => esc(c.city)).slice(0, 2).join(", ")}</span></b>${fxChip(cc)}</div>`;
      }).join("")}</div>
      <div class="pick">
        <small>Melhor jogada</small>
        <div class="p-row"><h4>${cityLink(b)}</h4><span class="p-sc">${b.score}</span></div>
        <p>${esc(b.country)} · dólar real ${fmtPct(b.real12)}</p>
        <div class="p-price"><span><small>Por dia</small><b>${fmtUSD(b.daily)}</b></span><span><small>7 dias + voo</small><b>${fmtUSD(b.trip)}</b></span></div>
      </div>
      <p class="sub">Fora do roteiro de sempre: <b style="color:var(--fg)">${esc(out.city)}</b>, ${esc(out.country)} · <span class="mono amber">${out.score}</span></p>`;
    if (animate && !reduced) { body.classList.remove("swap"); void body.offsetWidth; body.classList.add("swap"); }
  }

  /* =================== feed =================== */
  const FEED_COLORS = { edreams: "#ff8a5b", gholiday: "#4f9dff", gsummer: "#4f9dff", nomad: "#c48cf5", insure: "#3fd39a", news: "#ffc53d", fx: "#35c2e8", rank: "#ffc53d" };
  function feedPool() {
    const items = [];
    P.surveys.forEach((s) => {
      items.push({ c: FEED_COLORS[s.id] || "#ccc", av: s.org.slice(0, 2).toUpperCase(), who: s.org.split("·")[0].trim(), text: `${s.title}: ${s.items.slice(0, 3).map((x, i) => `${i + 1}º ${x.label}`).join(", ")}`, meta: s.date, url: s.url });
    });
    P.news.forEach((n) => items.push({ c: FEED_COLORS.news, av: n.tag.slice(0, 2).toUpperCase(), who: n.src, text: n.title, meta: n.date, url: n.url }));
    return items;
  }
  function liveItems() {
    const byC = {};
    S.metrics.forEach((m) => { if (!m.peg) byC[m.cc] = m; });
    const cs = Object.values(byC).sort((a, b) => b.real12 - a.real12);
    const d = fmtDate(S.dates[S.t] || P.fallback.date);
    const top = best(S.metrics);
    const cheap = S.metrics.slice().sort((a, b) => a.eff - b.eff)[0];
    return [
      { c: FEED_COLORS.rank, av: "PO", who: "Ranking", text: `${top.city} lidera com nota ${top.score}.`, meta: d },
      { c: FEED_COLORS.fx, av: cs[0].cur.slice(0, 2), who: cs[0].cur, text: `US$ 1 = ${fmtRate(cs[0].now)} ${cs[0].cur}. Dólar ${fmtPct(cs[0].real12)} real em 12 meses em ${cs[0].country}.`, meta: d },
      { c: FEED_COLORS.fx, av: cs[1].cur.slice(0, 2), who: cs[1].cur, text: `${cs[1].country}: dólar ${fmtPct(cs[1].nom12)} em 12 meses (${fmtPct(cs[1].real12)} descontada a inflação).`, meta: d },
      { c: "#f4707a", av: cs[cs.length - 1].cur.slice(0, 2), who: cs[cs.length - 1].cur, text: `${cs[cs.length - 1].country} ficou mais caro: dólar ${fmtPct(cs[cs.length - 1].real12)} real em 12 meses.`, meta: d },
      { c: FEED_COLORS.rank, av: "PO", who: "Mais barato", text: `${cheap.city} tem o menor custo efetivo: ${cheap.eff.toFixed(0)} (Nova York = 100).`, meta: d },
    ];
  }
  let feedQueue = [], feedTimer = 0, feedHover = false;
  function feedLi(it) {
    const li = document.createElement("li");
    li.style.setProperty("--c", it.c);
    li.innerHTML = `<span class="av">${esc(it.av)}</span><div class="msg"><b>${esc(it.who)}</b>: ${esc(it.text)}<span class="meta">${esc(it.meta)}${it.url ? ` · <a href="${esc(it.url)}" target="_blank" rel="noopener">fonte</a>` : ""}</span></div>`;
    return li;
  }
  function pushFeed(it, animate) {
    const ul = $("#feed");
    const li = feedLi(it);
    if (animate && !reduced) li.classList.add("enter");
    ul.prepend(li);
    while (ul.children.length > 16) ul.lastChild.remove();
  }
  function startFeed() {
    const pool = feedPool();
    const live = liveItems();
    const initial = [pool[0], live[1], pool[1], live[3], pool[2], pool[5]].filter(Boolean);
    initial.reverse().forEach((it) => pushFeed(it, false));
    feedQueue = [...live, ...pool.slice(3)];
    const ul = $("#feed");
    ul.addEventListener("pointerenter", () => (feedHover = true));
    ul.addEventListener("pointerleave", () => (feedHover = false));
    if (reduced) return;
    feedTimer = setInterval(() => {
      if (feedHover || document.visibilityState !== "visible") return;
      if (!feedQueue.length) feedQueue = [...liveItems(), ...feedPool()];
      pushFeed(feedQueue.shift(), true);
    }, 5200);
  }

  /* =================== timeline =================== */
  const range = $("#tRange");
  function setupTimeline() {
    const ok = S.hist;
    range.disabled = !ok;
    $("#playBtn").disabled = !ok;
    const ticks = $("#ticks");
    if (!ok) { ticks.innerHTML = ""; updateRangeFill(); return; }
    ticks.innerHTML = Array.from({ length: 13 }, (_, i) => `<span style="left:${(i / 12) * 100}%">${esc(fmtMonth(S.dates[12 + i]).split(" ")[0])}</span>`).join("");
    updateRangeFill();
  }
  function updateRangeFill() {
    const i = S.t - 12;
    range.value = i;
    range.style.setProperty("--p", (i / 12) * 100 + "%");
    $("#tDate").textContent = fmtDate(S.dates[S.t] || P.fallback.date);
    $("#ticks").querySelectorAll("span").forEach((s, j) => s.classList.toggle("on", j === i));
    $("#liveBtn").classList.toggle("on", S.t === 24);
  }
  function setT(t) {
    t = clamp(t, 12, 24);
    if (t === S.t) return;
    S.t = t;
    renderAll();
  }
  function play() {
    const btn = $("#playBtn");
    if (S.playing) { stop(); return; }
    if (S.t === 24) setT(12);
    btn.classList.add("on");
    btn.setAttribute("aria-label", "Pausar");
    S.playing = setInterval(() => {
      if (S.t >= 24) { stop(); return; }
      setT(S.t + 1);
    }, reduced ? 1600 : 1150);
  }
  function stop() {
    clearInterval(S.playing); S.playing = null;
    const btn = $("#playBtn");
    btn.classList.remove("on");
    btn.setAttribute("aria-label", "Reproduzir os últimos 12 meses");
  }

  /* =================== research sections =================== */
  function desireRanking() {
    const pts = {}, hits = {};
    P.surveys.forEach((s) => {
      const w = P.surveyWeights[s.id] || 1, n = s.items.length;
      s.items.forEach((it, i) => {
        const p = s.id === "insure" ? w * Math.sqrt((parseInt(it.note, 10) || 1) / 29) : w * (1 - (0.7 * i) / n);
        pts[it.cc] = (pts[it.cc] || 0) + p;
        (hits[it.cc] = hits[it.cc] || []).push(s);
      });
    });
    const rows = Object.keys(pts).map((cc) => ({ cc, pts: pts[cc], hits: hits[cc] })).sort((a, b) => b.pts - a.pts);
    rows.forEach((r) => (r.idx = Math.round((r.pts / rows[0].pts) * 100)));
    return rows;
  }
  const ccName = (cc) => (P.countries[cc] ? P.countries[cc].name : (P.extraNames && P.extraNames[cc]) || cc);
  function renderDesire() {
    const rows = desireRanking();
    const top = rows[0];
    const bc = citiesOf(top.cc)[0];
    $("#topWish").innerHTML = `
      <p class="label amber">Mais desejado agora</p>
      <p class="big">${esc(P.countries[top.cc].name)}</p>
      <p class="why">Aparece em ${top.hits.length} das ${P.surveys.length} listas, de buscas antecipadas a viagens já compradas. Onde o seu dólar rende mais por lá:</p>
      <div class="mentions">${top.hits.map((s) => `<span>${esc(s.title)}</span>`).join("")}</div>
      <div class="wish-spend">
        <div><small>Melhor cidade pra gastar · nota ${bc.score}</small><strong>${cityLink(bc)}</strong></div>
        <div><small>Por dia, estimado</small><strong>${fmtUSD(bc.daily)}</strong></div>
        <div><small>7 dias + voo</small><strong>${fmtUSD(bc.trip)}</strong></div>
      </div>`;
    const bars = $("#bars");
    if (!bars.children.length) {
      bars.innerHTML = rows.slice(0, 9).map((r, i) => `<li><span class="rk">${i + 1}</span><a class="nm" href="${mapsUrl(ccName(r.cc))}" target="_blank" rel="noopener" title="Abrir ${esc(ccName(r.cc))} no Google Maps">${esc(ccName(r.cc))}</a><span class="track"><span class="fill" data-v="${r.idx / 100}"></span></span><span class="v">${r.idx}</span></li>`).join("");
      const fills = bars.querySelectorAll(".fill");
      const fire = () => fills.forEach((f, i) => { f.style.transitionDelay = i * 50 + "ms"; f.style.transform = `scaleX(${f.dataset.v})`; });
      if (reduced || !("IntersectionObserver" in window)) fire();
      else { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { fire(); io.disconnect(); } }, { threshold: 0.3 }); io.observe(bars); }
    }
  }
  function placeItem(it) {
    const country = ccName(it.cc);
    const isCountry = it.label === country || it.country;
    const metric = S.metrics.find((m) => m.city === it.label);
    const inCountry = isCountry ? S.metrics.filter((m) => m.cc === it.cc) : [];
    const from = inCountry.length ? Math.min(...inCountry.map((m) => m.daily)) : null;
    const q = it.q || (isCountry ? country : `${it.label}, ${country}`);
    const sub = isCountry ? "país" : country;
    const price = metric ? `<span class="price mono">${fmtUSD(metric.daily)}/dia</span>` : from ? `<span class="price mono">desde ${fmtUSD(from)}/dia</span>` : "<span></span>";
    return `<a class="place-link" href="${mapsUrl(q)}" target="_blank" rel="noopener" title="Abrir ${esc(it.label)} no Google Maps">
        <span class="pl"><b>${esc(it.label)}</b><small>${esc(sub)}</small></span>
        ${it.note ? `<em>${esc(it.note)}${from ? ` · desde ${fmtUSD(from)}/dia` : ""}</em>` : price}${PIN}
      </a>`;
  }
  function renderSurveys() {
    $("#surveys").innerHTML = P.surveys.map((s) => `
      <article class="survey card">
        <span class="kind">${esc(s.kind)}</span>
        <div><h3>${esc(s.title)}</h3><p class="org">${esc(s.org)} · ${esc(s.date)}</p></div>
        <ol>${s.items.map((it, i) => `<li><span class="n">${i + 1}</span>${placeItem(it)}</li>`).join("")}</ol>
        <p class="method">${esc(s.method)}</p>
        <a class="src" href="${esc(s.url)}" target="_blank" rel="noopener">Ver fonte ↗</a>
      </article>`).join("");
    $("#news").innerHTML = P.news.map((n) => `<a href="${esc(n.url)}" target="_blank" rel="noopener"><span class="tag">${esc(n.tag)}</span><b>${esc(n.title)}</b><small>${esc(n.src)} · ${esc(n.date)}</small></a>`).join("");
    const seen = new Set();
    $("#sources").innerHTML = [...P.surveys.map((s) => ({ t: s.org, u: s.url, d: s.date })), ...P.news.map((n) => ({ t: `${n.src}: ${n.title}`, u: n.url, d: n.date }))]
      .filter((x) => (seen.has(x.u) ? false : seen.add(x.u)))
      .map((x) => `<li><a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)}</a> · ${esc(x.d)}</li>`).join("");
  }

  /* =================== segmented controls =================== */
  function placeThumb(el, b, instant) {
    const thumb = $(".thumb", el);
    if (!thumb || !b) return;
    if (instant) thumb.style.transition = "none";
    thumb.style.width = b.offsetWidth + "px";
    thumb.style.transform = `translateX(${b.offsetLeft}px)`;
    if (instant) { void thumb.offsetWidth; thumb.style.transition = ""; }
  }
  function makeSeg(el, items, getVal, onPick) {
    el.innerHTML = `<span class="thumb" aria-hidden="true"></span>` + items.map((it) => `<button type="button" data-v="${it.id}" aria-pressed="false">${esc(it.label)}</button>`).join("");
    const place = (instant) => {
      const b = el.querySelector(`button[data-v="${getVal()}"]`);
      el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      placeThumb(el, b, instant);
    };
    el.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; onPick(b.dataset.v); place(false); });
    addEventListener("resize", () => place(true));
    if (document.fonts) document.fonts.ready.then(() => place(true));
    place(true);
  }
  function setupTabs() {
    const tabs = $("#tabs");
    const links = [...tabs.querySelectorAll("a")];
    let current = "mapa";
    const set = (id, instant) => {
      current = id;
      links.forEach((a) => a.setAttribute("aria-current", String(a.dataset.sec === id)));
      placeThumb(tabs, links.find((a) => a.dataset.sec === id), instant);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        const vis = es.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) set(vis.target.id === "metodo" ? "ranking" : vis.target.id);
      }, { rootMargin: "-40% 0px -50% 0px" });
      ["mapa", "pesquisas", "ranking", "metodo"].forEach((id) => io.observe(document.getElementById(id)));
    }
    addEventListener("resize", () => set(current, true));
    if (document.fonts) document.fonts.ready.then(() => set(current, true));
    set("mapa", true);
  }

  /* =================== ranking =================== */
  function spark(series) {
    const w = 92, h = 28, pad = 3;
    if (!series || series.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"></svg>`;
    const min = Math.min(...series), max = Math.max(...series);
    const span = max - min || 1;
    const pts = series.map((v, i) => [pad + (i / (series.length - 1)) * (w - pad * 2), h - pad - ((v - min) / span) * (h - pad * 2)]);
    const flat = (max - min) / max < 0.002;
    const line = flat ? `M${pad},${h / 2} L${w - pad},${h / 2}` : "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L");
    const up = series[series.length - 1] >= series[0];
    const col = flat ? "var(--faint)" : up ? "var(--good)" : "var(--bad)";
    const end = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true">${flat ? "" : `<path d="${line} L${w - pad},${h} L${pad},${h} Z" fill="${col}" fill-opacity=".12"/>`}<path d="${line}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>${flat ? "" : `<circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="2.2" fill="${col}"/>`}</svg>`;
  }
  function renderRank() {
    const list = S.metrics.filter((m) => S.region === "all" || m.region === S.region);
    const sorters = { score: (a, b) => b.score - a.score, cost: (a, b) => a.trip - b.trip, fx: (a, b) => b.real12 - a.real12, hype: (a, b) => b.hype - a.hype || b.score - a.score };
    list.sort(sorters[S.sort]);
    const shown = list.slice(0, S.showAll ? list.length : 15);
    flipList($("#rankList"), shown, (m) => m.id, (el, m, i) => {
      if (!el.firstChild) {
        el.className = "row";
        const dots = [0, 1, 2].map((j) => `<i class="${j < m.hype ? "on" : ""}"></i>`).join("");
        el.innerHTML = `<span class="pos"></span>
          <div class="place">${cityLink(m)}<span class="sub"></span></div>
          <div class="meta">
            <div class="cell"><small>Real 12m</small><span class="fx c-real"></span></div>
            <div class="cell c-spark"></div>
            <div class="cell"><small>Por dia</small><span class="mono c-day"></span></div>
            <div class="cell"><small>7 dias + voo</small><span class="mono c-trip"></span></div>
          </div>
          <div class="score"><div class="track"><div class="fill"></div></div><b class="c-score"></b><span class="hype" title="Em alta: citado em ${m.hype} de 3 níveis">${dots}</span></div>
          ${m.why ? `<div class="why">${esc(m.why)}</div>` : ""}`;
        el.querySelector(".c-score")._v = m.score;
      }
      const pos = el.querySelector(".pos");
      pos.textContent = i + 1;
      pos.classList.toggle("top", i < 3);
      el.querySelector(".sub").textContent = `${m.country} · ${m.cur}${m.cur !== "USD" ? " " + fmtRate(m.now) : ""}`;
      const r = el.querySelector(".c-real");
      r.className = "fx c-real " + cls(m.real12);
      tween(r, m.real12, (v) => fmtPct(v), 600);
      el.querySelector(".c-spark").innerHTML = spark(m.series);
      tween(el.querySelector(".c-day"), m.daily, fmtUSD, 600);
      tween(el.querySelector(".c-trip"), m.trip, fmtUSD, 600);
      el.querySelector(".fill").style.transform = `scaleX(${m.score / 100})`;
      tween(el.querySelector(".c-score"), m.score, (v) => Math.round(v), 600);
    });
    const btn = $("#moreBtn");
    btn.hidden = list.length <= 15;
    btn.textContent = S.showAll ? "Mostrar só o top 15" : `Ver todas as ${list.length}`;
  }

  /* =================== boot =================== */
  function renderAll() {
    S.metrics = compute(S.t);
    renderHero();
    renderLeft();
    renderMap(false);
    renderPill();
    renderState(false);
    renderRank();
    renderSurveys();
    renderDesire();
    updateRangeFill();
    $("#sbCount").textContent = S.metrics.length;
    $("#sbCur").textContent = FLOAT.length;
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function boot() {
    if (!reduced) { document.body.classList.add("boot"); setTimeout(() => document.body.classList.remove("boot"), 1400); }
    // start the counters from zero so the first paint counts up
    ["#hScoreA", "#hScoreB", "#kpiN"].forEach((s) => ($(s)._v = 0));
    ["#dxNom", "#dxReal"].forEach((s) => ($(s)._v = 0));
    seedSnapshot();
    S.metrics = compute(24);
    renderLegend();
    fillSelect();
    renderSurveys();
    renderDesire();
    makeSeg($("#regionSeg"), P.regions, () => S.region, (v) => { S.region = v; S.showAll = false; renderRank(); });
    makeSeg($("#sortSeg"), [{ id: "score", label: "Nota" }, { id: "cost", label: "Mais barato" }, { id: "fx", label: "Câmbio" }, { id: "hype", label: "Em alta" }], () => S.sort, (v) => { S.sort = v; renderRank(); });
    setupTabs();
    renderAll();
    startFeed();
    drawMap();
    setupTimeline();
    loadFX();

    range.addEventListener("input", () => { stop(); setT(12 + +range.value); });
    $("#playBtn").addEventListener("click", play);
    $("#liveBtn").addEventListener("click", () => { stop(); setT(24); });
    $("#moreBtn").addEventListener("click", () => { S.showAll = !S.showAll; renderRank(); });
    $("#shareBtn").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href.split("#")[0]); toast("Link copiado"); }
      catch (e) { toast("Copie o endereço na barra do navegador"); }
    });
    $("#fsBtn").addEventListener("click", () => {
      const d = document;
      if (d.fullscreenElement) d.exitFullscreen?.();
      else d.documentElement.requestFullscreen?.().catch(() => toast("Tela cheia indisponível aqui"));
    });
    addEventListener("keydown", (e) => {
      if (e.target.closest("input, select, textarea")) return;
      if (e.key === "Escape" && S.selected) selectState(null);
    });
    setInterval(() => { if (document.visibilityState === "visible" && S.t === 24 && !S.playing) loadFX(); }, 30 * 60 * 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
