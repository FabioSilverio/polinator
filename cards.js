/* POLINATOR — city sheet: photos, score, history, cost of living, attractions, sharing.
   Opens from any element with [data-city]. Desktop: centred card. Phone: bottom sheet
   with drag-to-dismiss (1:1 tracking, rubber-band, velocity-aware release). */
(() => {
  "use strict";
  const P = window.POL;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = window.matchMedia("(max-width: 760px)");
  const A = () => window.POLAPP;

  const root = $("#sheetRoot");
  const sheet = $("#sheet");
  const body = $("#sheetBody");
  let current = null, trigger = null, closing = 0;

  const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
  const ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  };

  const metric = (id) => A().metrics.find((m) => m.id === id);
  const media = (id) => (P.media && P.media[id]) || { gallery: [] };
  const photos = (id) => {
    const md = media(id);
    const list = [];
    if (md.img) list.push({ src: md.img, file: md.leadFile });
    (md.gallery || []).forEach((g) => list.push(g));
    return list;
  };
  const commons = (file) => "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(String(file || "").replace(/ /g, "_"));
  const shareUrl = (id) => location.origin + location.pathname + "#c-" + id;

  function costRows(m) {
    const d = m.daily;
    return [
      ["Hotel por noite", d * 0.5, "quarto duplo dividido, 3–4★"],
      ["Refeições do dia", d * 0.32, `cerca de ${A().fmtUSD((d * 0.32) / 3)} por refeição`],
      ["Transporte e passeios", d * 0.18, "metrô, táxi, ingressos"],
    ];
  }

  function trimExtract(t, max = 520) {
    if (!t || t.length <= max) return t || "";
    const cut = t.slice(0, max);
    const dot = cut.lastIndexOf(". ");
    return (dot > 200 ? cut.slice(0, dot + 1) : cut + "…");
  }

  /* ---------------- render ---------------- */
  function html(m) {
    const F = A();
    const info = P.info[m.id] || { hist: "", attr: [] };
    const md = media(m.id);
    const ph = photos(m.id);
    const order = F.order();
    const rank = F.rankOf(m.id);
    const circ = 2 * Math.PI * 30;
    return `
      <header class="sh-hero">
        <div class="gal" id="gal">${ph.map((p, i) => `<figure><img src="${esc(p.src)}" alt="${i === 0 ? esc(m.city) : ""}" ${i ? 'loading="lazy"' : ""} decoding="async" crossorigin="anonymous"></figure>`).join("")}</div>
        <div class="sh-shade" aria-hidden="true"></div>
        <div class="sh-top">
          <span class="rankchip">#${rank} de ${order.length || F.metrics.length}</span>
          <div class="sh-nav">
            <button class="glass-btn" type="button" data-act="prev" aria-label="Cidade anterior">${ICON.prev}</button>
            <button class="glass-btn" type="button" data-act="next" aria-label="Próxima cidade">${ICON.next}</button>
            <button class="glass-btn" type="button" data-act="close" aria-label="Fechar">${ICON.close}</button>
          </div>
        </div>
        <div class="sh-title">
          <div>
            <p class="sh-eyebrow">${esc(m.country)} · ${esc(regionName(m.region))}</p>
            <h2 id="sheetTitle">${esc(m.city)}</h2>
          </div>
          <div class="ring" aria-label="Nota ${m.score} de 100">
            <svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" class="tr"/><circle cx="36" cy="36" r="30" class="pr" style="stroke-dasharray:${circ.toFixed(1)};stroke-dashoffset:${(circ * (1 - m.score / 100)).toFixed(1)}"/></svg>
            <b data-k="score">${m.score}</b><small>nota</small>
          </div>
        </div>
        ${ph.length > 1 ? `<div class="dots" role="tablist" aria-label="Fotos">${ph.map((_, i) => `<button type="button" role="tab" aria-label="Foto ${i + 1}" data-dot="${i}" aria-selected="${i === 0}"></button>`).join("")}</div>` : ""}
        ${ph.length ? `<a class="credit" id="credit" href="${commons(ph[0].file)}" target="_blank" rel="noopener">Foto: Wikimedia Commons</a>` : ""}
      </header>

      <div class="sh-content">
        <div class="kpis">
          <div><small>Por dia</small><b data-k="daily">${F.fmtUSD(m.daily)}</b></div>
          <div><small>7 dias + voo</small><b data-k="trip">${F.fmtUSD(m.trip)}</b></div>
          <div><small>${m.cur === "USD" ? "Moeda" : "US$ 1 vale"}</small><b data-k="rate">${rateTxt(m)}</b></div>
          <div><small>Dólar real 12m</small><b data-k="real" class="${F.cls(m.real12)}">${F.fmtPct(m.real12)}</b></div>
        </div>

        <div class="sh-grid">
          <div class="col">
            <section>
              <h3>História</h3>
              <p class="hist">${esc(info.hist)}</p>
              ${md.extract ? `<p class="wiki">${esc(trimExtract(md.extract))} <a href="${esc(md.url || "#")}" target="_blank" rel="noopener">Wikipedia${md.lang === "en" ? " (em inglês)" : ""} ↗</a></p>` : ""}
            </section>
            <section>
              <h3>Atrações</h3>
              <ol class="attr">${info.attr.map((a, i) => `<li><a href="${F.mapsUrl(a + ", " + m.city + ", " + m.country)}" target="_blank" rel="noopener"><span class="n">${i + 1}</span><span class="t">${esc(a)}</span>${PIN}</a></li>`).join("")}</ol>
            </section>
          </div>
          <div class="col">
            <section>
              <h3>Custo de vida</h3>
              <p class="vs" data-k="vs">${vsTxt(m)}</p>
              <div class="costs" data-k="costs">${costsHTML(m)}</div>
              <p class="fine">Estimativas do POLINATOR com o câmbio de ${esc(F.dateLabel())}. Não são cotações.</p>
            </section>
            ${m.why ? `<section class="hot"><h3>Por que está em alta</h3><p>${esc(m.why)}</p></section>` : ""}
          </div>
        </div>

        <div class="sh-actions">
          <button class="act primary" type="button" data-act="share">${ICON.share}<span>Compartilhar</span></button>
          <button class="act" type="button" data-act="image">${ICON.image}<span>Imagem do card</span></button>
          <button class="act" type="button" data-act="copy">${ICON.link}<span>Copiar link</span></button>
          <a class="act" href="${F.mapsUrl(m.city + ", " + m.country)}" target="_blank" rel="noopener">${PIN}<span>Google Maps</span></a>
        </div>
      </div>`;
  }
  function vsTxt(m) {
    const nyc = Math.round((1 - m.daily / P.DAILY_NYC) * 100);
    return nyc >= 0 ? `${nyc}% mais barato que Nova York` : `${-nyc}% mais caro que Nova York`;
  }
  function rateTxt(m) { return m.cur === "USD" ? "dólar americano" : `${A().fmtRate(m.now)} ${m.cur}`; }
  function costsHTML(m) {
    const F = A();
    const rows = costRows(m);
    const max = Math.max(...rows.map((r) => r[1]));
    return rows.map(([l, v, n]) => `
      <div class="cost"><div class="cl"><span>${l}</span><small>${esc(n)}</small></div><b>${F.fmtUSD(v)}</b><span class="cbar"><i style="transform:scaleX(${(v / max).toFixed(3)})"></i></span></div>`).join("") + `
      <div class="cost total"><div class="cl"><span>Total por dia</span><small>por pessoa</small></div><b>${F.fmtUSD(m.daily)}</b></div>
      <div class="cost total"><div class="cl"><span>Passagem ida e volta</span><small>econômica, saindo dos EUA</small></div><b>${F.fmtUSD(m.fare)}</b></div>`;
  }
  const regionName = (r) => ({ americas: "Américas", europa: "Europa", asia: "Ásia", africa: "África e Oriente Médio", oceania: "Oceania" }[r] || "");

  function wireGallery() {
    const gal = $("#gal", body);
    if (!gal) return;
    gal.querySelectorAll("img").forEach((img) => {
      const done = () => img.classList.add("in");
      if (img.complete && img.naturalWidth) done(); else img.addEventListener("load", done, { once: true });
      img.addEventListener("error", () => img.closest("figure").remove(), { once: true });
    });
    const dots = body.querySelectorAll("[data-dot]");
    const ph = photos(current);
    let raf = 0;
    gal.addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = Math.round(gal.scrollLeft / gal.clientWidth);
        dots.forEach((d, j) => d.setAttribute("aria-selected", String(j === i)));
        const c = $("#credit", body);
        if (c && ph[i]) c.href = commons(ph[i].file);
      });
    }, { passive: true });
    dots.forEach((d) => d.addEventListener("click", () => gal.scrollTo({ left: +d.dataset.dot * gal.clientWidth, behavior: reduced ? "auto" : "smooth" })));
  }

  function animateRing() {
    if (reduced) return;
    const pr = $(".ring .pr", body);
    if (!pr) return;
    const circ = 2 * Math.PI * 30;
    pr.animate([{ strokeDashoffset: circ }, { strokeDashoffset: pr.style.strokeDashoffset }], { duration: 700, delay: 120, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" });
  }

  /* ---------------- open / close ---------------- */
  function open(id, from) {
    const m = metric(id);
    if (!m) return;
    const wasOpen = !root.hidden && root.classList.contains("open");
    current = id;
    if (from) trigger = from;
    body.innerHTML = html(m);
    body.scrollTop = 0;
    wireGallery();
    animateRing();
    history.replaceState(null, "", "#c-" + id);
    if (wasOpen) {
      if (!reduced) { body.classList.remove("swap"); void body.offsetWidth; body.classList.add("swap"); }
      return;
    }
    clearTimeout(closing);
    root.hidden = false;
    document.documentElement.classList.add("sheet-lock");
    sheet.style.transform = "";
    sheet.style.transition = "";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add("open");
      sheet.focus({ preventScroll: true });
    }));
  }

  function close() {
    if (root.hidden) return;
    root.classList.remove("open");
    sheet.style.transform = "";
    history.replaceState(null, "", location.pathname + location.search);
    document.documentElement.classList.remove("sheet-lock");
    clearTimeout(closing);
    closing = setTimeout(() => { root.hidden = true; body.innerHTML = ""; current = null; }, reduced ? 10 : 320);
    if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
  }

  function step(dir) {
    const order = A().order();
    if (!order.length || !current) return;
    let i = order.indexOf(current);
    i = i < 0 ? 0 : (i + dir + order.length) % order.length;
    open(order[i]);
  }

  function refresh() {
    if (!current || root.hidden) return;
    const m = metric(current);
    if (!m) return;
    const F = A();
    const set = (k, v) => { const el = body.querySelector(`[data-k="${k}"]`); if (el) el.textContent = v; };
    set("daily", F.fmtUSD(m.daily));
    set("trip", F.fmtUSD(m.trip));
    set("rate", rateTxt(m));
    const costs = body.querySelector('[data-k="costs"]');
    if (costs) costs.innerHTML = costsHTML(m);
    const vs = body.querySelector('[data-k="vs"]');
    if (vs) vs.textContent = vsTxt(m);
    set("real", F.fmtPct(m.real12));
    set("score", m.score);
  }

  /* ---------------- sharing ---------------- */
  function shareText(m) {
    const F = A();
    return `${m.city} (${m.country}): nota ${m.score} no POLINATOR. Cerca de ${F.fmtUSD(m.daily)} por dia e ${F.fmtUSD(m.trip)} por 7 dias com voo, com o câmbio de ${F.dateLabel()}.`;
  }
  async function shareLink() {
    const m = metric(current);
    const data = { title: `${m.city} · POLINATOR`, text: shareText(m), url: shareUrl(m.id) };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    copyLink();
  }
  async function copyLink() {
    const m = metric(current);
    try { await navigator.clipboard.writeText(`${shareText(m)} ${shareUrl(m.id)}`); A().toast("Link do card copiado"); }
    catch (e) { A().toast("Não deu para copiar. Use o endereço da barra."); }
  }

  function loadImg(src) {
    return new Promise((res) => {
      if (!src) return res(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    const words = text.split(" ");
    let line = "", lines = 0;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        if (++lines === maxLines) { ctx.fillText(line.replace(/[,.;:]?$/, "…"), x, y); return y + lh; }
        ctx.fillText(line, x, y); y += lh; line = words[i];
      } else line = test;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }

  async function makeImage(m) {
    const F = A();
    const info = P.info[m.id] || { attr: [], hist: "" };
    const W = 1080, H = 1350;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    try { await Promise.all(["800 96px Inter", "600 40px Inter", "500 30px Inter", "600 34px 'JetBrains Mono'"].map((f) => document.fonts.load(f))); } catch (e) { /* fallback fonts */ }
    ctx.fillStyle = "#0b0b0d"; ctx.fillRect(0, 0, W, H);
    const img = await loadImg(media(m.id).img);
    const PH = 780;
    if (img) {
      const s = Math.max(W / img.width, PH / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (W - w) / 2, (PH - h) / 2, w, h);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, PH); g.addColorStop(0, "#2a2207"); g.addColorStop(1, "#0d1830"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, PH);
    }
    let g = ctx.createLinearGradient(0, PH - 420, 0, PH + 2);
    g.addColorStop(0, "rgba(11,11,13,0)"); g.addColorStop(1, "rgba(11,11,13,1)");
    ctx.fillStyle = g; ctx.fillRect(0, PH - 420, W, 422);
    g = ctx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);

    // brand
    ctx.fillStyle = "#ffc53d"; ctx.beginPath(); ctx.arc(84, 84, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "700 40px Inter, system-ui, sans-serif"; ctx.textBaseline = "middle";
    ctx.fillText("polinator", 112, 86);
    // rank chip
    const rk = `#${F.rankOf(m.id)} de ${F.metrics.length}`;
    ctx.font = "600 30px 'JetBrains Mono', monospace";
    const rw = ctx.measureText(rk).width + 44;
    ctx.fillStyle = "rgba(0,0,0,.45)"; rr(ctx, W - 64 - rw, 60, rw, 54, 27); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(rk, W - 64 - rw + 22, 88);

    // title + ring
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "600 34px Inter, system-ui, sans-serif";
    ctx.fillText(`${m.country} · ${regionName(m.region)}`.toUpperCase(), 64, PH - 120);
    ctx.fillStyle = "#fff"; ctx.font = "800 96px Inter, system-ui, sans-serif";
    let size = 96;
    while (ctx.measureText(m.city).width > W - 64 - 260 && size > 56) { size -= 4; ctx.font = `800 ${size}px Inter, system-ui, sans-serif`; }
    ctx.fillText(m.city, 64, PH - 30);
    const cx = W - 140, cy = PH - 70, r = 74;
    ctx.lineWidth = 14; ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#ffc53d"; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * m.score) / 100); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "700 64px 'JetBrains Mono', monospace"; ctx.fillText(String(m.score), cx, cy + 14);
    ctx.font = "500 22px Inter, system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillText("NOTA", cx, cy + 46);
    ctx.textAlign = "left";

    // stats
    const stats = [["Por dia", F.fmtUSD(m.daily)], ["7 dias + voo", F.fmtUSD(m.trip)], ["Dólar real 12m", F.fmtPct(m.real12)]];
    const bw = (W - 128 - 32) / 3;
    stats.forEach(([l, v], i) => {
      const x = 64 + i * (bw + 16), y = PH + 40;
      ctx.fillStyle = "rgba(255,255,255,.06)"; rr(ctx, x, y, bw, 132, 24); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "500 26px Inter, system-ui, sans-serif"; ctx.fillText(l, x + 26, y + 48);
      ctx.fillStyle = i === 2 ? (m.real12 >= 0 ? "#3fd39a" : "#f4707a") : "#fff"; ctx.font = "600 40px 'JetBrains Mono', monospace"; ctx.fillText(v, x + 26, y + 102);
    });
    // attractions
    let y = PH + 230;
    ctx.fillStyle = "#ffc53d"; ctx.font = "600 26px 'JetBrains Mono', monospace"; ctx.fillText("ATRAÇÕES", 64, y);
    y += 50;
    ctx.font = "500 32px Inter, system-ui, sans-serif";
    info.attr.slice(0, 4).forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      ctx.fillStyle = "#ffc53d"; ctx.fillText(String(i + 1), 64 + col * 476, y + row * 52);
      ctx.fillStyle = "#e9eaec";
      const maxW = 410;
      let t = a;
      while (ctx.measureText(t).width > maxW && t.length > 4) t = t.slice(0, -2);
      ctx.fillText(t === a ? a : t.trim() + "…", 100 + col * 476, y + row * 52);
    });
    // footer
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.font = "500 24px Inter, system-ui, sans-serif";
    ctx.fillText(`Preços estimados por pessoa · câmbio de ${F.dateLabel()}`, 64, H - 52);
    ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "600 24px 'JetBrains Mono', monospace";
    ctx.fillText(location.host || "polinator.vercel.app", W - 64, H - 52);
    ctx.textAlign = "left";
    return new Promise((res) => cv.toBlob((b) => res(b), "image/png"));
  }

  async function shareImage(btn) {
    const m = metric(current);
    const label = btn && btn.querySelector("span");
    const prev = label ? label.textContent : "";
    if (label) label.textContent = "Gerando…";
    btn && (btn.disabled = true);
    try {
      const blob = await makeImage(m);
      if (!blob) throw new Error("blob");
      const file = new File([blob], `polinator-${m.id}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `${m.city} · POLINATOR`, text: shareText(m) + " " + shareUrl(m.id) }); return; }
        catch (e) { if (e && e.name === "AbortError") return; }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      A().toast("Imagem do card salva");
    } catch (e) {
      A().toast("Não deu para gerar a imagem agora");
    } finally {
      if (label) label.textContent = prev;
      btn && (btn.disabled = false);
    }
  }

  /* ---------------- drag to dismiss (phone) ---------------- */
  (function drag() {
    let startY = 0, dy = 0, active = false, locked = null, hist = [], h = 0, sx = 0;
    const rubber = (o, d, c = 0.55) => (o * d * c) / (d + c * Math.abs(o));
    sheet.addEventListener("pointerdown", (e) => {
      if (!phone.matches || e.button) return;
      if (!e.target.closest(".sh-hero, .grab")) return;
      if (e.target.closest("button, a")) return;
      active = true; locked = null; startY = e.clientY; sx = e.clientX; dy = 0; h = sheet.offsetHeight;
      hist = [{ y: e.clientY, t: e.timeStamp }];
    });
    sheet.addEventListener("pointermove", (e) => {
      if (!active) return;
      const ddy = e.clientY - startY, ddx = e.clientX - sx;
      if (locked === null) {
        if (Math.abs(ddy) < 10 && Math.abs(ddx) < 10) return;
        locked = Math.abs(ddy) > Math.abs(ddx) && ddy > 0 ? "y" : "no";
        if (locked === "y") { sheet.setPointerCapture(e.pointerId); sheet.style.transition = "none"; }
      }
      if (locked !== "y") return;
      e.preventDefault();
      dy = ddy > 0 ? ddy : rubber(ddy, h);
      sheet.style.transform = `translate3d(0, ${dy}px, 0)`;
      hist.push({ y: e.clientY, t: e.timeStamp });
      if (hist.length > 6) hist.shift();
    });
    const end = (e) => {
      if (!active) return;
      active = false;
      if (locked !== "y") return;
      const a = hist[0], b = hist[hist.length - 1];
      const v = b && a && b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0; // px/ms
      const projected = dy + (v * 1000 * 0.998) / (1 - 0.998) / 1000; // Apple's projection, in px
      sheet.style.transition = "";
      if (dy > h * 0.3 || v > 0.6 || projected > h * 0.5) {
        const remain = Math.max(0, h - dy);
        const dur = clampN(remain / Math.max(v, 1.2), 140, 320);
        sheet.style.transition = `transform ${dur}ms cubic-bezier(0.32, 0.72, 0, 1)`;
        sheet.style.transform = `translate3d(0, ${h}px, 0)`;
        root.classList.remove("open");
        setTimeout(() => { sheet.style.transition = ""; close(); }, dur);
      } else {
        sheet.style.transform = "";
      }
    };
    const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
    sheet.addEventListener("pointerup", end);
    sheet.addEventListener("pointercancel", end);
  })();

  /* ---------------- events ---------------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-city]");
    if (t && !e.defaultPrevented) { e.preventDefault(); open(t.dataset.city, t); return; }
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target.closest && e.target.closest("[data-city]");
    if (t && t.tagName !== "BUTTON" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(t.dataset.city, t); return; }
    if (root.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key === "ArrowRight" && !e.target.closest("input, select")) step(1);
    if (e.key === "ArrowLeft" && !e.target.closest("input, select")) step(-1);
    if (e.key === "Tab") {
      const f = [...sheet.querySelectorAll("a[href], button:not([disabled])")].filter((x) => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) { close(); return; }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "close") close();
    if (act === "prev") step(-1);
    if (act === "next") step(1);
    if (act === "share") shareLink();
    if (act === "copy") copyLink();
    if (act === "image") shareImage(b);
  });
  window.addEventListener("hashchange", () => {
    const m = location.hash.match(/^#c-([\w-]+)/);
    if (m && m[1] !== current) open(m[1]);
  });

  window.POLCARD = {
    open, close, refresh,
    openFromHash() { const m = location.hash.match(/^#c-([\w-]+)/); if (m) open(m[1]); },
  };
})();
