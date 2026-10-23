(() => {
  const root = document.documentElement;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reduce ? "auto" : "smooth";
  const transition = fn => (document.startViewTransition && !reduce) ? document.startViewTransition(fn) : fn();

  /* ---------- language ---------- */
  let lang = root.lang === "en" ? "en" : "uk";
  const t = (k, c) => {
    const s = (I18N[lang] && I18N[lang][k]) || I18N.uk[k] || k;
    return c === undefined ? s : s.replace("{c}", c);
  };

  function applyLang() {
    root.lang = lang;
    document.title = t("meta.title");
    $('meta[name="description"]').setAttribute("content", t("meta.desc"));
    $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$("[data-i18n-ph]").forEach(el => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
    $("#lang-btn").textContent = lang === "uk" ? "EN" : "UA";
    $("#job1-dur").textContent = duration(new Date(2025, 0, 1), new Date());
    renderUsed();
    if (window.Explorer) Explorer.setLang(lang);
  }
  function setLang(l) { lang = l; store.set("site-lang", l); transition(applyLang); }
  $("#lang-btn").addEventListener("click", () => setLang(lang === "uk" ? "en" : "uk"));

  function duration(from, to) {
    let m = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
    const y = Math.floor(m / 12); m %= 12;
    return [y ? `${y} ${t("dur.y")}` : "", m ? `${m} ${t("dur.m")}` : ""].filter(Boolean).join(" ");
  }

  /* ---------- theme ---------- */
  function toggleTheme() {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    transition(() => {
      root.dataset.theme = next; store.set("site-theme", next);
      $('meta[name="theme-color"]').setAttribute("content", next === "light" ? "#f2ede5" : "#1d1a17");
      if (window.Explorer) Explorer.refreshColors();
      Sky.refresh();
    });
  }
  $("#theme-btn").addEventListener("click", toggleTheme);

  /* ---------- toast + copy ---------- */
  const toast = $("#toast"); let toastTimer;
  function say(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
  function copyMail() {
    const mail = $("#mail").textContent.trim();
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents($("#mail"));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      say(t("copy.fail"));
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(() => say(t("copied")), fallback);
    else fallback();
  }
  $("#copy-mail").addEventListener("click", copyMail);
  const openCv = () => window.open("assets/cv/Vladyslav_Zamotailo_Backend_Python.pdf", "_blank", "noopener");

  /* ---------- header: border, progress, active section ---------- */
  const top = $("#top"), bar = $("#progress");
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    top.classList.toggle("scrolled", y > 8);
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const navLinks = $$(".nav a");
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.setAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id ? "true" : "false"));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => spy.observe(s));

  /* ---------- reveal: CSS scroll-driven animations where supported, otherwise a small observer ---------- */
  const scrollTimeline = CSS.supports && CSS.supports("animation-timeline: view()");
  if (!reduce && !scrollTimeline && "IntersectionObserver" in window) {
    const rv = $$(".rv").filter(el => el.getBoundingClientRect().top > innerHeight);
    rv.forEach(el => el.classList.add("pre"));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(el => io.observe(el));
  }

  /* ---------- slider: buttons, mouse drag, range scrubber ---------- */
  const track = $("#inc-track"), range = $("#inc-range"), count = $("#inc-count");
  const prev = $("#inc-prev"), next = $("#inc-next"), cards = [...track.children];
  const gap = () => parseFloat(getComputedStyle(track).columnGap) || 20;
  const stepW = () => cards[0].getBoundingClientRect().width + gap();
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  let scrubbing = false;
  function paintRange(v) { range.style.setProperty("--fill", (v / 10).toFixed(1) + "%"); }
  function syncSlider() {
    const max = maxScroll();
    if (!scrubbing) {
      const v = max ? Math.round(track.scrollLeft / max * 1000) : 0;
      range.value = v; paintRange(v);
    }
    // count from scroll progress: on wide screens the track scrolls less than one card width
    const i = max ? 1 + Math.round(track.scrollLeft / max * (cards.length - 1)) : 1;
    count.textContent = `${i} / ${cards.length}`;
    prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft > max - 4;
    range.disabled = max < 4;
  }
  // snap points are card starts, clamped to the end of the track (the last cards may share one)
  const snapToNearest = () => {
    const max = maxScroll(), x = track.scrollLeft;
    const points = cards.map((_, i) => Math.min(i * stepW(), max));
    const left = points.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a, 0);
    track.scrollTo({ left, behavior });
  };
  prev.addEventListener("click", () => track.scrollBy({ left: -stepW(), behavior }));
  next.addEventListener("click", () => track.scrollBy({ left: stepW(), behavior }));
  range.addEventListener("input", () => {
    // while the thumb moves, snapping is off so the cards follow the thumb exactly
    if (!scrubbing) { scrubbing = true; track.classList.add("scrubbing"); }
    paintRange(range.value);
    track.scrollLeft = range.value / 1000 * maxScroll();
  });
  const endScrub = () => {
    if (!scrubbing) return;
    scrubbing = false; track.classList.remove("scrubbing"); syncSlider();
  };
  range.addEventListener("change", endScrub);
  range.addEventListener("pointerup", endScrub);
  range.addEventListener("blur", endScrub);
  track.addEventListener("scroll", syncSlider, { passive: true });
  addEventListener("resize", syncSlider);
  track.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
  });
  let dragX = null, startLeft = 0, moved = false;
  track.addEventListener("pointerdown", e => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragX = e.clientX; startLeft = track.scrollLeft; moved = false;
  });
  addEventListener("pointermove", e => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    if (!moved && Math.abs(dx) > 4) { moved = true; track.classList.add("dragging"); }
    if (moved) track.scrollLeft = startLeft - dx;
  });
  addEventListener("pointerup", () => {
    if (dragX === null) return;
    dragX = null;
    if (moved) { track.classList.remove("dragging"); snapToNearest(); }
  });
  syncSlider();

  /* ---------- skills highlight ---------- */
  const targets = $$(".hl-target"), skills = $$(".skill[data-skill]"), used = $("#used");
  let activeSkill = null;
  function renderUsed() {
    used.innerHTML = "";
    const btn = skills.find(b => b.dataset.skill === activeSkill);
    const hits = activeSkill ? targets.filter(x => x.dataset.skills.split(" ").includes(activeSkill)) : [];
    targets.forEach(x => x.classList.toggle("hit", hits.includes(x)));
    document.body.classList.toggle("dim", hits.length > 0);
    const note = (text, cls) => { const s = document.createElement("span"); s.textContent = text; if (cls) s.className = cls; used.append(s); };
    if (!activeSkill) return note(t("used.hint"));
    if (btn && btn.dataset.note) return note(t(btn.dataset.note));
    if (!hits.length) return note(t("used.none"));
    const b = document.createElement("b"); b.textContent = t("used.in"); used.append(b);
    hits.forEach((h, i) => {
      const a = document.createElement("a");
      a.href = "#" + (h.closest("section") || {}).id; a.textContent = h.dataset.name;
      a.addEventListener("click", e => {
        e.preventDefault();
        if (h.tagName === "DETAILS") h.open = true;
        h.scrollIntoView({ behavior, block: "center" });
      });
      used.append(a);
      if (i < hits.length - 1) used.append(document.createTextNode("·"));
    });
  }
  skills.forEach(btn => {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      activeSkill = activeSkill === btn.dataset.skill ? null : btn.dataset.skill;
      skills.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.skill === activeSkill)));
      renderUsed();
    });
  });
  addEventListener("keydown", e => {
    if (e.key === "Escape" && activeSkill && !$("#palette").open) { activeSkill = null; skills.forEach(b => b.setAttribute("aria-pressed", "false")); renderUsed(); }
  });

  /* ---------- terminal under the graph ---------- */
  const term = $("#term"), history = []; let hIdx = 0;
  const sections = ["experience", "incidents", "projects", "skills", "education", "contact"];
  const projectAliases = { leogame: "leogame", lms: "leogame", itleo: "itleo", admin: "itleo", vysh: "vysh", vyshyvankadaily: "vysh", devscout: "devscout", vartovyi: "vartovyi" };
  function runCommand(raw) {
    const [cmd, ...args] = raw.trim().split(/\s+/), arg = (args[0] || "").toLowerCase(), say = (k, c, cls) => Explorer.print(t(k, c), cls);
    Explorer.print("$ " + raw, "cmd");
    switch ((cmd || "").toLowerCase()) {
      case "": return;
      case "help": return say("t.help");
      case "whoami": return say("t.whoami");
      case "stack": return say("t.stack");
      case "projects": return say("t.projects");
      case "ls": return say("t.ls");
      case "contact": return say("t.contact");
      case "cv": say("t.cv"); return openCv();
      case "theme": toggleTheme(); return say("t.theme");
      case "lang": return setLang(lang === "uk" ? "en" : "uk");
      case "clear": return Explorer.clear();
      case "sudo": return say("t.sudo", null, "warn");
      case "cd": {
        const id = sections.find(s => s.startsWith(arg));
        if (!arg || !id) return say("t.cdnf", arg || "?", "warn");
        return document.getElementById(id).scrollIntoView({ behavior });
      }
      case "open": {
        const key = projectAliases[arg];
        if (!key) return say("t.opennf", arg || "?", "warn");
        say("t.open", key); return Explorer.select(key);
      }
      default: return say("t.nf", cmd, "warn");
    }
  }
  $("#term-form").addEventListener("submit", e => {
    e.preventDefault();
    const v = term.value; term.value = "";
    if (v.trim()) { history.push(v); hIdx = history.length; }
    runCommand(v);
  });
  term.addEventListener("keydown", e => {
    if (e.key === "ArrowUp" && history.length) { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); term.value = history[hIdx]; }
    if (e.key === "ArrowDown" && history.length) { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); term.value = history[hIdx] || ""; }
    if (e.key === "Tab" && term.value) {
      const all = ["help", "whoami", "stack", "projects", "open ", "ls", "cd ", "contact", "cv", "theme", "lang", "clear"];
      const m = all.find(c => c.startsWith(term.value.toLowerCase()));
      if (m) { e.preventDefault(); term.value = m; }
    }
  });

  /* ---------- starfield behind the hero ---------- */
  const Sky = (() => {
    const cv = $("#sky"); if (!cv) return { refresh() {} };
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, stars = [], comet = null, mx = 0, my = 0, tx = 0, ty = 0, running = false, starC = "", accC = "";
    const css = k => getComputedStyle(root).getPropertyValue(k).trim();
    function refresh() { starC = css("--text"); accC = css("--accent"); if (!running) draw(0); }
    function resize() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(W * H / 5200);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + .25,
        d: Math.random() * .8 + .2, p: Math.random() * 6.28, s: Math.random() * .02 + .005, warm: Math.random() < .14
      }));
      if (!running) draw(0);
    }
    function draw(time) {
      ctx.clearRect(0, 0, W, H);
      tx += (mx - tx) * .05; ty += (my - ty) * .05;
      for (const s of stars) {
        s.p += s.s;
        const a = reduce ? .55 : .35 + .45 * Math.sin(s.p);
        const x = (s.x + tx * s.d * 14 + W) % W, y = (s.y + ty * s.d * 10 + H) % H;
        ctx.globalAlpha = a * (s.warm ? .9 : .55);
        ctx.fillStyle = s.warm ? accC : starC;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
      }
      if (!reduce) {
        if (!comet && Math.random() < .0025) comet = { x: Math.random() * W * .7, y: Math.random() * H * .4, vx: 5 + Math.random() * 3, vy: 2 + Math.random() * 1.5, life: 1 };
        if (comet) {
          const c = comet, g = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * 14, c.y - c.vy * 14);
          g.addColorStop(0, accC); g.addColorStop(1, "transparent");
          ctx.globalAlpha = c.life; ctx.strokeStyle = g; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x - c.vx * 14, c.y - c.vy * 14); ctx.stroke();
          c.x += c.vx; c.y += c.vy; c.life -= .012;
          if (c.life <= 0 || c.x > W || c.y > H) comet = null;
        }
      }
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(draw);
    }
    addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    new ResizeObserver(resize).observe(cv);
    if (!reduce) new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; requestAnimationFrame(draw); }
      else if (!e.isIntersecting) running = false;
    }).observe(cv);
    refresh(); resize();
    return { refresh };
  })();

  /* ---------- command palette ---------- */
  const pal = $("#palette"), input = $("#pal-input"), list = $("#pal-list");
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $("#kbd").textContent = isMac ? "⌘K" : "Ctrl K";
  const go = id => () => { const el = document.getElementById(id); el && el.scrollIntoView({ behavior }); };
  const open = url => () => window.open(url, "_blank", "noopener");
  const commands = () => [
    { label: t("nav.exp"), kind: "pal.go", run: go("experience") },
    { label: t("inc.title"), kind: "pal.go", run: go("incidents") },
    { label: t("proj.title"), kind: "pal.go", run: go("projects") },
    { label: t("nav.skills"), kind: "pal.go", run: go("skills") },
    { label: t("edu.title"), kind: "pal.go", run: go("education") },
    { label: t("nav.contact"), kind: "pal.go", run: go("contact") },
    { label: t("pal.top"), kind: "pal.go", run: () => scrollTo({ top: 0, behavior }) },
    { label: t("pal.copy"), kind: "pal.act", run: copyMail },
    { label: t("pal.theme"), kind: "pal.act", run: toggleTheme },
    { label: t("pal.lang"), kind: "pal.act", run: () => setLang(lang === "uk" ? "en" : "uk") },
    { label: t("pal.cv"), kind: "pal.link", run: openCv },
    { label: "GitHub", kind: "pal.link", run: open("https://github.com/ZamotVlad") },
    { label: "LinkedIn", kind: "pal.link", run: open("https://www.linkedin.com/in/vladyslav-zamotailo/") },
    { label: "Telegram", kind: "pal.link", run: open("https://t.me/zamotvlad") },
    { label: "VyshyvankaDaily", kind: "pal.link", run: open("https://vyshyvankadaily.live") }
  ];
  let shown = [], sel = 0;
  function renderPal() {
    const q = input.value.trim().toLowerCase();
    shown = commands().filter(c => c.label.toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = "";
    if (!shown.length) { const li = document.createElement("li"); li.className = "empty"; li.textContent = t("pal.empty"); list.append(li); return; }
    shown.forEach((c, i) => {
      const li = document.createElement("li");
      li.id = "pal-" + i; li.setAttribute("role", "option"); li.setAttribute("aria-selected", String(i === sel));
      const s = document.createElement("span"); s.textContent = c.label;
      const k = document.createElement("small"); k.textContent = t(c.kind);
      li.append(s, k);
      li.addEventListener("mousemove", () => { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener("click", () => run(i));
      list.append(li);
    });
    input.setAttribute("aria-activedescendant", "pal-" + sel);
  }
  function mark() {
    [...list.children].forEach((li, i) => li.setAttribute("aria-selected", String(i === sel)));
    input.setAttribute("aria-activedescendant", "pal-" + sel);
    const cur = list.children[sel]; cur && cur.scrollIntoView({ block: "nearest" });
  }
  function run(i) { const c = shown[i]; if (!c) return; pal.close(); c.run(); }
  function openPal() { input.value = ""; sel = 0; renderPal(); pal.showModal(); input.focus(); }
  $("#open-palette").addEventListener("click", openPal);
  addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.open ? pal.close() : openPal(); }
  });
  input.addEventListener("input", () => { sel = 0; renderPal(); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); mark(); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); mark(); }
    if (e.key === "Enter") { e.preventDefault(); run(sel); }
  });
  pal.addEventListener("click", e => { if (e.target === pal) pal.close(); });

  // browsers without the Popover API: the footer button toggles the panel by hand
  const hood = $("#hood");
  if (!HTMLElement.prototype.hasOwnProperty("popover")) {
    hood.hidden = true;
    $("#hood-btn").addEventListener("click", () => { hood.hidden = !hood.hidden; });
  }

  /* ---------- boot ---------- */
  $("#year").textContent = new Date().getFullYear();
  applyLang();
  if (window.Explorer) Explorer.init({ lang });
})();
