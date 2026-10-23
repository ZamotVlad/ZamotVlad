(() => {
  const root = document.documentElement;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- language ---------- */
  let lang = root.lang === "en" ? "en" : "uk";
  const t = k => (I18N[lang] && I18N[lang][k]) || I18N.uk[k] || k;

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
  function setLang(l) { lang = l; store.set("site-lang", l); applyLang(); }
  $("#lang-btn").addEventListener("click", () => setLang(lang === "uk" ? "en" : "uk"));

  function duration(from, to) {
    let m = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1;
    const y = Math.floor(m / 12); m %= 12;
    return [y ? `${y} ${t("dur.y")}` : "", m ? `${m} ${t("dur.m")}` : ""].filter(Boolean).join(" ");
  }

  /* ---------- theme ---------- */
  function toggleTheme() {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    const swap = () => {
      root.dataset.theme = next; store.set("site-theme", next);
      $('meta[name="theme-color"]').setAttribute("content", next === "light" ? "#f2ede5" : "#1d1a17");
      if (window.Explorer) Explorer.refreshColors();
    };
    if (document.startViewTransition && !reduce) document.startViewTransition(swap); else swap();
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

  /* ---------- reveal: only things below the fold get a small slide ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    const rv = $$(".rv").filter(el => el.getBoundingClientRect().top > innerHeight);
    rv.forEach(el => el.classList.add("pre"));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(el => io.observe(el));
  }

  /* ---------- incidents slider: buttons, drag, range scrubber ---------- */
  const track = $("#inc-track"), range = $("#inc-range"), count = $("#inc-count");
  const prev = $("#inc-prev"), next = $("#inc-next"), cards = [...track.children];
  const stepW = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20);
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  function syncSlider() {
    const max = maxScroll(), p = max ? track.scrollLeft / max : 0;
    range.value = Math.round(p * 1000);
    range.style.setProperty("--fill", (p * 100).toFixed(1) + "%");
    const i = Math.min(cards.length, Math.round(track.scrollLeft / stepW()) + 1);
    count.textContent = `${max - track.scrollLeft < 4 ? cards.length : i} / ${cards.length}`;
    prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft > max - 4;
  }
  const behavior = reduce ? "auto" : "smooth";
  prev.addEventListener("click", () => track.scrollBy({ left: -stepW(), behavior }));
  next.addEventListener("click", () => track.scrollBy({ left: stepW(), behavior }));
  range.addEventListener("input", () => { track.scrollLeft = range.value / 1000 * maxScroll(); });
  track.addEventListener("scroll", syncSlider, { passive: true });
  addEventListener("resize", syncSlider);
  track.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
  });
  // mouse drag (touch already scrolls natively)
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
    if (moved) {
      track.classList.remove("dragging");
      const i = Math.round(track.scrollLeft / stepW());
      track.scrollTo({ left: i * stepW(), behavior });
    }
  });
  syncSlider();

  /* ---------- skills highlight ---------- */
  const targets = $$(".hl-target"), skills = $$(".skill[data-skill]"), used = $("#used");
  let activeSkill = null;
  function renderUsed() {
    used.innerHTML = "";
    if (!activeSkill) {
      const s = document.createElement("span"); s.textContent = t("used.hint"); used.append(s);
      document.body.classList.remove("dim"); targets.forEach(x => x.classList.remove("hit"));
      return;
    }
    const hits = targets.filter(x => x.dataset.skills.split(" ").includes(activeSkill));
    targets.forEach(x => x.classList.toggle("hit", hits.includes(x)));
    document.body.classList.toggle("dim", hits.length > 0);
    if (!hits.length) { const s = document.createElement("span"); s.textContent = t("used.none"); used.append(s); return; }
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
  addEventListener("keydown", e => { if (e.key === "Escape" && activeSkill && !$("#palette").open) { activeSkill = null; skills.forEach(b => b.setAttribute("aria-pressed", "false")); renderUsed(); } });

  /* ---------- command palette ---------- */
  const pal = $("#palette"), input = $("#pal-input"), list = $("#pal-list");
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $("#kbd").textContent = isMac ? "⌘K" : "Ctrl K";
  const go = id => () => { const el = document.getElementById(id); el && el.scrollIntoView({ behavior }); };
  const open = url => () => window.open(url, "_blank", "noopener");
  const commands = () => [
    { label: t("nav.exp"), kind: "pal.go", run: go("experience") },
    { label: t("nav.inc"), kind: "pal.go", run: go("incidents") },
    { label: t("nav.proj"), kind: "pal.go", run: go("projects") },
    { label: t("nav.skills"), kind: "pal.go", run: go("skills") },
    { label: t("edu.title"), kind: "pal.go", run: go("education") },
    { label: t("nav.contact"), kind: "pal.go", run: go("contact") },
    { label: t("pal.top"), kind: "pal.go", run: () => scrollTo({ top: 0, behavior }) },
    { label: t("pal.copy"), kind: "pal.act", run: copyMail },
    { label: t("pal.theme"), kind: "pal.act", run: toggleTheme },
    { label: t("pal.lang"), kind: "pal.act", run: () => setLang(lang === "uk" ? "en" : "uk") },
    { label: t("pal.cv"), kind: "pal.link", run: open("assets/cv/Vladyslav_Zamotailo_Backend_Python.pdf") },
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

  /* ---------- boot ---------- */
  $("#year").textContent = new Date().getFullYear();
  applyLang();
  if (window.Explorer) Explorer.init({ lang });
})();
