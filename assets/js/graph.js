/* Architecture explorer: each tab is a real project, its services are draggable nodes,
   requests fly along real routes like comets and land in the terminal under the graph. */
(() => {
  const SCENES = {
    leogame: {
      path: "leogame-lms",
      nodes: {
        react: ["React SPA", .08, .18], account: ["Student account", .1, .5], fire: ["Firebase Auth", .1, .84],
        api: ["Django · DRF", .4, .5], gcal: ["Google Calendar", .4, .9], pg: ["PostgreSQL", .7, .16],
        celery: ["Celery", .68, .58], redis: ["Redis", .92, .36], bots: ["aiogram bots", .9, .86]
      },
      tall: { react: [.24, .05], account: [.76, .05], fire: [.24, .22], api: [.62, .3], gcal: [.27, .48], pg: [.76, .5], celery: [.5, .68], redis: [.22, .9], bots: [.76, .9] },
      edges: "react-fire react-api account-api fire-api api-pg api-celery celery-redis celery-bots bots-api api-gcal",
      routes: [
        ["account api pg", "GET  /api/account/schedule/  200  19ms"],
        ["react fire api", "auth firebase id_token      ok"],
        ["account api pg", "POST /api/homework/          201  48ms"],
        ["react api pg", "GET  /api/groups/            200  21ms"],
        ["bots api pg", "bot  POST /api/demo-bookings/ 201  35ms"],
        ["api celery bots", "task notify_new_lead → staff bot  sent"],
        ["api gcal", "calendar sync oauth2         ok   0.8s"],
        ["account api pg", "GET  /api/account/progress/  200  17ms"]
      ],
      text: {
        uk: {
          caption: "Бекенд LMS: React-фронтенд і кабінет студента ходять у DRF API, вхід через Firebase, фонові задачі в Celery, два боти на aiogram і синхронізація з Google Calendar.",
          react: "React-фронтенд, для якого я зробив REST API.",
          account: "Кабінет студента: курси, уроки й матеріали, здача домашніх завдань, оцінки, прогрес і розклад.",
          fire: "Firebase Authentication. Бекенд перевіряє токен у кожному запиті.",
          api: "Групи, зарахування, уроки, перевірка ДЗ, оцінки і прогрес. 390+ тестів, Ruff і CI.",
          pg: "Основна база LMS.",
          celery: "Фонові задачі і сповіщення.",
          redis: "Брокер для Celery.",
          bots: "Публічний бот для запису на демо-урок і бот для команди зі сповіщеннями про нові заявки.",
          gcal: "OAuth 2.0, токени зберігаються зашифрованими."
        },
        en: {
          caption: "The LMS backend: a React frontend and the student account call the DRF API, sign-in goes through Firebase, background jobs run on Celery, plus two aiogram bots and Google Calendar sync.",
          react: "The React frontend I built the REST API for.",
          account: "The student account: courses, lessons and materials, homework submission, grades, progress and schedule.",
          fire: "Firebase Authentication. The backend verifies the token on every request.",
          api: "Groups, enrollment, lessons, homework review, grades and progress. 390+ tests, Ruff and CI.",
          pg: "The main LMS database.",
          celery: "Background jobs and notifications.",
          redis: "Broker for Celery.",
          bots: "A public bot for booking demo lessons and a staff bot with new-lead alerts.",
          gcal: "OAuth 2.0 with encrypted tokens."
        }
      }
    },
    itleo: {
      path: "itleo-admin",
      nodes: {
        user: ["Browser", .07, .42], proxy: ["Proxy · SSL", .29, .42], guni: ["Gunicorn", .5, .42],
        api: ["Django admin", .72, .42], rbac: ["RBAC · 5 roles", .76, .1], pg: ["PostgreSQL", .9, .74],
        backup: ["pg_dump", .62, .9], restore: ["restore check", .32, .9]
      },
      tall: { user: [.5, .05], proxy: [.5, .22], guni: [.5, .39], rbac: [.78, .56], api: [.36, .56], pg: [.25, .75], backup: [.25, .94], restore: [.72, .94] },
      edges: "user-proxy proxy-guni guni-api api-rbac api-pg pg-backup backup-restore",
      routes: [
        ["user proxy guni api pg", "GET  /admin/students/       200  34ms"],
        ["user proxy guni api rbac", "rbac deny role=mentor perm=delete 403"],
        ["pg backup", "cron pg_dump nightly         ok   3.4s"],
        ["backup restore", "restore check latest dump    ok"],
        ["user proxy guni api", "POST /admin/groups/ csrf     ok   302"],
        ["user proxy", "tls certificate valid        ok"]
      ],
      text: {
        uk: {
          caption: "Внутрішня адмін-система: запити йдуть через проксі з SSL і Gunicorn до Django, доступ перевіряється для 5 ролей, а кожен бекап PostgreSQL перевіряється відновленням.",
          user: "Співробітники академії.",
          proxy: "Тут я виправив подвійний заголовок Origin і маршрут ACME challenge для SSL.",
          guni: "Gunicorn у Docker Compose на VPS, який я підтримую.",
          api: "Адмін-система, 300+ тестів, Ruff і CI.",
          rbac: "5 ролей. Заборонено все, що явно не дозволено.",
          pg: "Основна база.",
          backup: "Автоматичні бекапи.",
          restore: "Кожен бекап перевіряється відновленням, щоб він точно працював."
        },
        en: {
          caption: "The internal admin system: requests go through an SSL proxy and Gunicorn to Django, access is checked for 5 roles, and every PostgreSQL backup is verified by restoring it.",
          user: "Academy staff.",
          proxy: "This is where I fixed the duplicated Origin header and the ACME challenge route for SSL.",
          guni: "Gunicorn in Docker Compose on a VPS that I maintain.",
          api: "The admin system, 300+ tests, Ruff and CI.",
          rbac: "5 roles. Everything not explicitly allowed is denied.",
          pg: "The main database.",
          backup: "Automated backups.",
          restore: "Every backup is restored as a check, so I know it works."
        }
      }
    },
    vysh: {
      path: "vyshyvankadaily",
      nodes: {
        user: ["Browser", .07, .46], dj: ["Django 5.2", .34, .46], gen: ["SVG generator", .34, .1],
        pg: ["PostgreSQL", .64, .16], oauth: ["allauth · Google", .64, .46], brevo: ["Brevo", .66, .8],
        sentry: ["Sentry", .92, .62], ci: ["GitHub Actions", .1, .88], heroku: ["Heroku", .36, .84]
      },
      tall: { user: [.5, .05], gen: [.22, .18], oauth: [.76, .18], dj: [.5, .34], pg: [.22, .52], brevo: [.78, .52], heroku: [.25, .72], sentry: [.76, .72], ci: [.5, .93] },
      edges: "user-dj dj-gen gen-pg dj-pg dj-oauth dj-brevo dj-sentry ci-heroku heroku-dj",
      routes: [
        ["user dj pg", "GET  /uk/                   200  12ms"],
        ["dj gen pg", "generate ornaments regions=27  ok"],
        ["user dj", "rate limit /accounts/login/  429"],
        ["user dj oauth", "google oauth callback        ok   302"],
        ["dj brevo", "verify email → brevo         sent"],
        ["ci heroku dj", "ci ruff + 300 tests → deploy  ok"],
        ["user dj pg", "GET  /en/                   200  11ms"]
      ],
      text: {
        uk: {
          caption: "Двомовний застосунок на Django: щодня генерує орнаменти для 27 областей, вхід через Google, листи через Brevo, помилки в Sentry, деплой з GitHub Actions на Heroku.",
          user: "PageSpeed 100 у всіх чотирьох категоріях.",
          dj: "Дві мови через modeltranslation. Strict CSP, rate limiting і заголовки безпеки на A+.",
          gen: "Будує орнамент на групах симетрії (shapely, svgpathtools). Та сама дата й область завжди дають той самий результат.",
          pg: "Орнаменти, блог і користувачі. Щоденні бекапи.",
          oauth: "django-allauth, вхід через Google.",
          brevo: "django-anymail і Brevo для підтвердження email.",
          sentry: "Моніторинг помилок.",
          ci: "Ruff, перевірка міграцій і 300+ тестів на кожен пуш.",
          heroku: "Gunicorn і whitenoise на Heroku."
        },
        en: {
          caption: "A bilingual Django app: it generates ornaments for 27 regions every day, with Google sign-in, email through Brevo, errors in Sentry and deploys from GitHub Actions to Heroku.",
          user: "PageSpeed 100 in all four categories.",
          dj: "Two languages via modeltranslation. Strict CSP, rate limiting and A+ security headers.",
          gen: "Builds the ornament from symmetry groups (shapely, svgpathtools). The same date and region always give the same result.",
          pg: "Ornaments, blog and users. Daily backups.",
          oauth: "django-allauth, Google sign-in.",
          brevo: "django-anymail and Brevo for email verification.",
          sentry: "Error monitoring.",
          ci: "Ruff, a migrations check and 300+ tests on every push.",
          heroku: "Gunicorn and whitenoise on Heroku."
        }
      }
    },
    devscout: {
      path: "devscout",
      nodes: {
        beat: ["Celery Beat", .1, .16], redis: ["Redis", .36, .16], worker: ["Celery worker", .38, .62],
        dou: ["DOU", .08, .5], djinni: ["Djinni RSS", .1, .86], pg: ["PostgreSQL", .64, .44],
        admin: ["Django dashboard", .88, .16], tg: ["Telegram bot", .9, .76]
      },
      tall: { beat: [.27, .06], redis: [.73, .06], worker: [.5, .28], dou: [.22, .48], djinni: [.78, .48], pg: [.5, .68], admin: [.26, .92], tg: [.74, .92] },
      edges: "beat-redis redis-worker worker-dou worker-djinni worker-pg pg-admin pg-tg",
      routes: [
        ["beat redis worker", "beat scrape_jobs             queued"],
        ["worker dou", "GET  dou.ua/vacancies/        200  410ms"],
        ["worker djinni", "GET  djinni.co/jobs/rss/      200  380ms"],
        ["worker pg", "filter stop-words, save +14   ok"],
        ["pg tg", "bot  new python jobs → 6      sent"],
        ["pg admin", "GET  /?source=dou&page=2      200  28ms"],
        ["beat redis worker", "beat cleanup older_than=30d   queued"]
      ],
      text: {
        uk: {
          caption: "Celery Beat за розкладом запускає збір вакансій з DOU і RSS Djinni. Worker фільтрує їх і зберігає в PostgreSQL, а звідти вони йдуть у дашборд на Django і Telegram-бота.",
          beat: "Збір раз на 4–8 годин і нічне очищення старих записів.",
          redis: "Брокер черги.",
          worker: "Парсить вакансії через BeautifulSoup і відсікає нерелевантні за стоп-словами.",
          dou: "Відкритий розділ /vacancies/.",
          djinni: "Офіційна RSS-стрічка вакансій.",
          pg: "Вакансії. Записи, старші за 30 днів, видаляються.",
          admin: "Дашборд на Bootstrap 5: фільтр за джерелом, пошук, пагінація, запуск парсерів.",
          tg: "pyTelegramBotAPI. Приватний бот з whitelist за chat id: запуск парсерів і свіжі вакансії."
        },
        en: {
          caption: "Celery Beat runs job scraping from DOU and the Djinni RSS feed on a schedule. A worker filters the listings and saves them to PostgreSQL, and from there they go to a Django dashboard and a Telegram bot.",
          beat: "Scraping every 4–8 hours and a nightly cleanup of old records.",
          redis: "Queue broker.",
          worker: "Parses listings with BeautifulSoup and drops irrelevant ones by stop words.",
          dou: "The public /vacancies/ section.",
          djinni: "The official job RSS feed.",
          pg: "Job listings. Records older than 30 days are deleted.",
          admin: "A Bootstrap 5 dashboard: source filter, search, pagination, scraper triggers.",
          tg: "pyTelegramBotAPI. A private bot with a chat id whitelist: run scrapers and read fresh listings."
        }
      }
    },
    vartovyi: {
      path: "vartovyi",
      nodes: {
        client: ["Client", .07, .42], api: ["FastAPI", .3, .42], redis: ["Redis", .3, .1], status: ["/status/{slug}", .3, .84],
        svc: ["services", .55, .42], pg: ["PostgreSQL", .6, .82], sched: ["Scheduler", .62, .1],
        probe: ["run_probes", .88, .14], sites: ["Monitored sites", .86, .62]
      },
      tall: { client: [.5, .05], api: [.5, .2], redis: [.82, .2], status: [.22, .36], svc: [.55, .42], pg: [.25, .62], sched: [.74, .6], probe: [.74, .78], sites: [.38, .94] },
      edges: "client-api api-redis api-svc client-status status-svc svc-pg sched-svc sched-probe probe-sites",
      routes: [
        ["client api redis", "auth jti not revoked         ok"],
        ["client api svc pg", "POST /api/v1/monitors        201  23ms"],
        ["sched svc pg", "tick due monitors=12         ok"],
        ["sched probe sites", "probe TaskGroup 12/12 sem=50  ok"],
        ["probe sites", "GET  example.com             200  184ms"],
        ["client status svc pg", "GET  /status/my-company      200  14ms"],
        ["client api redis", "POST /api/v1/auth/refresh rotate  ok"]
      ],
      text: {
        uk: {
          caption: "Моніторинг аптайму на FastAPI. Планувальник кожні 5 секунд бере монітори, run_probes перевіряє сайти паралельно, інциденти відкриваються після кількох падінь поспіль, а відкликані токени лежать у Redis.",
          client: "Веб-панель на чистому HTML/CSS/JS або скрипти з API-ключем.",
          api: "FastAPI і Pydantic v2. JWT access + refresh з ротацією, API-ключі, єдиний формат помилок.",
          redis: "Чорний список jti: вихід і ротація refresh-токенів спрацьовують одразу.",
          status: "Публічна сторінка статусу з uptime за 24 години, 7 і 30 днів.",
          svc: "Сценарії і межі транзакцій. Шари api, services, repositories, domain.",
          pg: "SQLAlchemy 2.0 async + asyncpg, міграції Alembic.",
          sched: "Такт кожні 5 секунд. Сесія БД закривається до мережевих запитів.",
          probe: "TaskGroup + Semaphore, окремий asyncio.timeout() на кожну перевірку, один httpx.AsyncClient.",
          sites: "Перевіряє статус відповіді, ключове слово в тілі і поріг деградації."
        },
        en: {
          caption: "Uptime monitoring on FastAPI. A scheduler picks up monitors every 5 seconds, run_probes checks sites in parallel, incidents open after several failures in a row, and revoked tokens live in Redis.",
          client: "A plain HTML/CSS/JS dashboard, or scripts with an API key.",
          api: "FastAPI and Pydantic v2. JWT access + refresh with rotation, API keys, one error format.",
          redis: "A jti blacklist, so logout and refresh rotation take effect immediately.",
          status: "A public status page with uptime for 24 hours, 7 and 30 days.",
          svc: "Use cases and transaction boundaries. Layers: api, services, repositories, domain.",
          pg: "SQLAlchemy 2.0 async + asyncpg, Alembic migrations.",
          sched: "Ticks every 5 seconds. The DB session closes before any network calls.",
          probe: "TaskGroup + Semaphore, a separate asyncio.timeout() per check, one httpx.AsyncClient.",
          sites: "Checks the status code, a keyword in the body and a degradation threshold."
        }
      }
    }
  };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cv, ctx, tip, logEl, capEl, pathEl, stage;
  let W = 0, H = 0, tall = false, colors = {}, lang = "uk";
  let scene = null, sceneKey = "leogame";
  const nodes = new Map();
  let edges = [], packets = [], drag = null, hover = null, running = false, timer = null, lastFrame = 0, holdUntil = 0;
  const MAX_LOG = 5;

  const css = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  function readColors() { ["--accent", "--ok", "--text", "--muted", "--line", "--surface", "--bg"].forEach(k => colors[k] = css(k)); }

  const home = (id, fx, fy) => {
    if (!tall) return [fx * W, fy * H];
    const t = scene && scene.tall && scene.tall[id];
    return t ? [t[0] * W, t[1] * H] : [(.1 + fy * .8) * W, (.06 + fx * .88) * H];
  };

  function measure() {
    ctx.font = `500 ${W < 480 ? 11 : 12}px "JetBrains Mono", ui-monospace, monospace`;
    nodes.forEach(n => { n.w = ctx.measureText(n.label).width + (W < 480 ? 30 : 38); });
  }

  function setScene(key) {
    sceneKey = key; scene = SCENES[key];
    const ids = Object.keys(scene.nodes);
    nodes.forEach(n => { if (!ids.includes(n.id)) n.target = 0; });
    ids.forEach(id => {
      const [label, fx, fy] = scene.nodes[id];
      let n = nodes.get(id);
      if (!n || n.target === 0 && n.alpha < .05) {
        const [hx, hy] = home(id, fx, fy);
        n = { id, label, fx, fy, x: W / 2 + (hx - W / 2) * .3, y: H / 2 + (hy - H / 2) * .3, vx: 0, vy: 0, alpha: 0, target: 1, pulse: 0, w: 0, tw: Math.random() * 6 };
        nodes.set(id, n);
      }
      Object.assign(n, { label, fx, fy, target: 1 });
      [n.hx, n.hy] = home(id, fx, fy);
    });
    edges = scene.edges.split(" ").map(e => e.split("-"));
    packets = [];
    measure();
    capEl.textContent = scene.text[lang].caption;
    pathEl.textContent = scene.path;
    if (Date.now() > holdUntil) {
      logEl.innerHTML = "";
      scene.routes.slice(0, 3).forEach(r => addLog(r[1]));
    }
    if (reduce) nodes.forEach(n => { n.x = n.hx; n.y = n.hy; n.alpha = n.target; });
    hideTip();
    kick();
  }

  function resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    if (!r.width) return;
    W = r.width; H = r.height; tall = W / H < 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes.forEach(n => { [n.hx, n.hy] = home(n.id, n.fx, n.fy); if (reduce) { n.x = n.hx; n.y = n.hy; } });
    measure();
    kick();
  }

  function line(parts, cls) {
    const li = document.createElement("li");
    if (cls) li.className = cls;
    li.append(...parts);
    logEl.append(li);
    while (logEl.children.length > MAX_LOG) logEl.firstChild.remove();
  }
  function addLog(text) {
    const ts = document.createElement("span"); ts.className = "ts"; ts.textContent = new Date().toTimeString().slice(0, 8);
    const parts = [ts];
    text.split(/(\b(?:200|201|302|ok|sent|queued)\b|\b(?:403|429)\b)/).forEach(p => {
      if (!p) return;
      if (/^(200|201|302|ok|sent|queued)$/.test(p)) { const s = document.createElement("span"); s.className = "ok"; s.textContent = p; parts.push(s); }
      else if (/^(403|429)$/.test(p)) { const s = document.createElement("span"); s.className = "warn"; s.textContent = p; parts.push(s); }
      else parts.push(p);
    });
    line(parts);
  }

  function spawn() {
    if (!scene || packets.length > 4) return;
    const r = scene.routes[Math.floor(Math.random() * scene.routes.length)];
    packets.push({ path: r[0].split(" "), seg: 0, t: 0, speed: .016 + Math.random() * .01, log: r[1], trail: [] });
  }

  function pill(n) {
    if (n.alpha < .02) return;
    const h = W < 480 ? 28 : 32, x = n.x - n.w / 2, y = n.y - h / 2, active = n === hover || n === drag;
    ctx.globalAlpha = n.alpha;
    if (n.pulse > 0) {
      const g = n.pulse * 9;
      ctx.beginPath(); ctx.roundRect(x - g, y - g, n.w + g * 2, h + g * 2, h / 2 + g);
      ctx.strokeStyle = colors["--ok"]; ctx.globalAlpha = n.alpha * (1 - n.pulse) * .7; ctx.lineWidth = 1; ctx.stroke();
      ctx.globalAlpha = n.alpha;
    }
    ctx.beginPath(); ctx.roundRect(x, y, n.w, h, h / 2);
    ctx.fillStyle = active ? colors["--accent"] : colors["--surface"]; ctx.fill();
    ctx.strokeStyle = active ? colors["--accent"] : colors["--line"]; ctx.lineWidth = 1; ctx.stroke();
    // a small star inside the pill that twinkles
    const sx = x + (W < 480 ? 12 : 14), tw = .55 + .45 * Math.sin(n.tw);
    ctx.fillStyle = active ? colors["--bg"] : colors["--accent"];
    ctx.globalAlpha = n.alpha * (active ? 1 : tw);
    star(sx, n.y, 3.2);
    ctx.globalAlpha = n.alpha;
    ctx.fillStyle = active ? colors["--bg"] : colors["--text"];
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n.label, n.x + 6, n.y + 1);
    ctx.globalAlpha = 1;
  }
  function star(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }

  function step(dt) {
    const k = Math.min(dt / 16.7, 3);
    nodes.forEach(n => {
      n.alpha += (n.target - n.alpha) * .12 * k;
      if (n.target === 0 && n.alpha < .02) { nodes.delete(n.id); return; }
      n.tw += .035 * k;
      if (n.pulse > 0) { n.pulse += .03 * k; if (n.pulse >= 1) n.pulse = 0; }
      if (n === drag) return;
      n.vx = (n.vx + (n.hx - n.x) * .05 * k) * Math.pow(.8, k);
      n.vy = (n.vy + (n.hy - n.y) * .05 * k) * Math.pow(.8, k);
      n.x += n.vx * k; n.y += n.vy * k;
    });
    packets = packets.filter(p => {
      p.t += p.speed * k;
      if (p.t < 1) return true;
      p.seg++; p.t = 0;
      const reached = nodes.get(p.path[p.seg]); if (reached) reached.pulse = .01;
      if (p.seg >= p.path.length - 1) { if (Date.now() > holdUntil) addLog(p.log); return false; }
      return true;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    edges.forEach(([a, b]) => {
      const A = nodes.get(a), B = nodes.get(b); if (!A || !B) return;
      const lit = hover && (hover === A || hover === B);
      ctx.globalAlpha = Math.min(A.alpha, B.alpha) * (lit ? 1 : .5);
      ctx.strokeStyle = lit ? colors["--accent"] : colors["--muted"];
      ctx.setLineDash(lit ? [] : [4, 5]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    packets.forEach(p => {
      const A = nodes.get(p.path[p.seg]), B = nodes.get(p.path[p.seg + 1]); if (!A || !B) return;
      const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
      p.trail.push([x, y]); if (p.trail.length > 14) p.trail.shift();
      // comet tail
      for (let i = 1; i < p.trail.length; i++) {
        const [x0, y0] = p.trail[i - 1], [x1, y1] = p.trail[i];
        ctx.globalAlpha = (i / p.trail.length) * .55;
        ctx.strokeStyle = colors["--accent"]; ctx.lineWidth = 1 + (i / p.trail.length) * 2.2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.fillStyle = colors["--accent"];
      ctx.globalAlpha = .18; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    nodes.forEach(pill);
  }

  function loop(now) {
    const dt = lastFrame ? now - lastFrame : 16.7; lastFrame = now;
    step(dt); draw();
    if (running) requestAnimationFrame(loop);
  }
  function kick() { if (reduce || !running) draw(); }

  function pick(e) {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let found = null;
    nodes.forEach(n => { if (n.target && Math.abs(x - n.x) < n.w / 2 + 6 && Math.abs(y - n.y) < 20) found = n; });
    return { x, y, n: found };
  }
  function showTip(n) {
    if (!n) return hideTip();
    tip.innerHTML = "";
    const b = document.createElement("b"); b.textContent = n.label;
    tip.append(b, scene.text[lang][n.id] || "");
    tip.hidden = false;
    const ox = cv.offsetLeft, oy = cv.offsetTop, tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.max(0, Math.min(ox + n.x - tw / 2, stage.clientWidth - tw)) + "px";
    tip.style.top = (n.y > H * .5 ? oy + n.y - th - 26 : oy + n.y + 26) + "px";
  }
  function hideTip() { tip.hidden = true; }

  function bind() {
    cv.addEventListener("pointerdown", e => {
      const p = pick(e); if (!p.n) return;
      drag = p.n; cv.setPointerCapture(e.pointerId); cv.classList.add("dragging"); showTip(drag);
      e.preventDefault();
    });
    cv.addEventListener("pointermove", e => {
      const p = pick(e);
      if (drag) {
        drag.x = Math.max(24, Math.min(W - 24, p.x)); drag.y = Math.max(18, Math.min(H - 18, p.y));
        showTip(drag); kick(); return;
      }
      if (p.n !== hover) { hover = p.n; cv.style.cursor = hover ? "grab" : "default"; showTip(hover); kick(); }
    });
    const release = () => {
      if (!drag) return;
      drag.vx = drag.vy = 0;
      if (reduce) { drag.x = drag.hx; drag.y = drag.hy; }
      drag = null; cv.classList.remove("dragging"); kick();
    };
    cv.addEventListener("pointerup", release);
    cv.addEventListener("pointercancel", release);
    cv.addEventListener("pointerleave", () => { if (!drag) { hover = null; hideTip(); kick(); } });

    // tabs with a sliding indicator, arrow keys move between them
    const tabs = [...document.querySelectorAll(".ex-tab")], ind = document.querySelector(".ex-ind");
    const moveInd = t => { ind.style.width = t.offsetWidth + "px"; ind.style.transform = `translateX(${t.offsetLeft - 4}px)`; };
    const select = t => {
      tabs.forEach(x => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; });
      moveInd(t); setScene(t.dataset.scene);
      const bar = t.parentElement;
      bar.scrollTo({ left: t.offsetLeft - bar.clientWidth / 2 + t.offsetWidth / 2, behavior: reduce ? "auto" : "smooth" });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", e => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n);
      });
    });
    const sel = tabs.find(t => t.getAttribute("aria-selected") === "true") || tabs[0];
    new ResizeObserver(() => moveInd(tabs.find(t => t.getAttribute("aria-selected") === "true") || sel)).observe(document.querySelector(".ex-tabs"));
    moveInd(sel);
    Explorer.select = key => { const t = tabs.find(x => x.dataset.scene === key); if (t) select(t); };
  }

  function start() {
    if (reduce) return;
    // only animate while the explorer is on screen
    new IntersectionObserver(([e]) => {
      const on = e.isIntersecting;
      if (on && !running) { running = true; lastFrame = 0; requestAnimationFrame(loop); timer = setInterval(() => { if (!document.hidden) spawn(); }, 1100); spawn(); }
      if (!on && running) { running = false; clearInterval(timer); }
    }).observe(cv);
  }

  const Explorer = window.Explorer = {
    scenes: Object.keys(SCENES),
    init(opts) {
      cv = document.getElementById("ex-canvas"); if (!cv) return;
      ctx = cv.getContext("2d"); tip = document.getElementById("ex-tip"); logEl = document.getElementById("ex-log");
      capEl = document.getElementById("ex-caption"); pathEl = document.getElementById("ex-path"); stage = cv.parentElement;
      lang = opts.lang; readColors();
      resize(); bind(); setScene(sceneKey); start();
      new ResizeObserver(() => { const w = cv.getBoundingClientRect().width; if (Math.abs(w - W) > 1) resize(); }).observe(cv);
      if (document.fonts) document.fonts.ready.then(() => { measure(); kick(); });
    },
    setLang(l) { lang = l; if (scene) { capEl.textContent = scene.text[lang].caption; hideTip(); } },
    refreshColors() { readColors(); kick(); },
    // the terminal prints into the same log and pauses the live feed for a while
    print(text, cls) { holdUntil = Date.now() + 12000; const s = document.createElement("span"); s.textContent = text; line([s], ((cls || "") + " out").trim()); },
    clear() { holdUntil = Date.now() + 4000; logEl.innerHTML = ""; }
  };
})();
