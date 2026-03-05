/* =========================
   Helpers / Config
========================= */

const REVIEW_MODE = true; // ponlo en false cuando termines
const review = { missing: new Set(), mismatched: new Set() };

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const TMDB_OVERRIDES = {
  "A TODO GAS": 9799,
  "ACORRALADO": 1368,
  "AGARRALO COMO PUEDAS": 37136,
  "ALIEN 2": 679,
  "ALIEN 3": 8077,
  "ALIEN 4": 8078,
  "ALIEN 5": 945961,
  "AMEN": 9045,
  "APOCALIYSIS NOW": 28,
  "ASESINOS": 9691,
  "AZUMI": 5889,
  "CARMEN": 763261,
  "CONDENADO": 13536,
  "CORTOCIRCUITO": 2605,
  "DEPREDADOR": 106,
  "DRACULA": 6114,
  "EL BOSQUE": 6947,
  "EL CASTIGADOR": 7220,
  "EL DIA MAS LARGO": 9289,
  "EL DIARIO DE BRIGET JONES": 634,
  "EL DIARIO DE BRIGET JONES 2": 9801,
  "EL DIARIO DE ELLEN RIMBAUER": 1368089,
  "EL ESCONDITE": 11096,
  "EL EXORSISTA (EL COMIENZO)": 11026,
  "EL GOLPE": 9277,
  "EL HUNDIMIENTO": 613,
  "EL INTERNADO": 21198,
  "EL PIANISTA": 423,
  "EL PLANETA DE LOS SIMIOS 1": 871,
  "EL PLANETA DE LOS SIMIOS 2": 1685,
  "EL PLANETA DE LOS SIMIOS 3": 1687,
  "EL PLANETA DE LOS SIMIOS 4": 1688,
  "EL PLANETA DE LOS SIMIOS 5": 1705,
  "EL PROTEGIDO": 9741,
  "EL SEÑOR DE LOS ANILLOS 1 (DISCO 1)": 120,
  "EL SEÑOR DE LOS ANILLOS 1 (DISCO 2)": 120,
  "EL SEÑOR DE LOS ANILLOS 2 (DISCO 1)": 121,
  "EL SEÑOR DE LOS ANILLOS 2 (DISCO 2)": 121,
  "EL SEÑOR DE LOS ANILLOS 3 (DISCO 1)": 122,
  "EL SEÑOR DE LOS ANILLOS 3 (DISCO 2)": 122,
  "EL SILENCIO DE LOS CORDEROS 4": 1248,
  "EL ULTIMO ESCALON": 11601,
  "EN LA OSCURIDAD": 10727,
  "ENCERRADO": 9972,
  "ENCUENTROS EN LA 3ª FASE": 840,
  "EVIL DEAD": 765,
  "FRAGILES": 11348,
  "GANSTERS DE NEW YORK": 3131,
  "GENESIS": 882405,
  "GHOST IN THE SHELL 1": 9323,
  "GIGOLO": 10402,
  "HARRY POTTER 2": 672,
  "HARRY POTTER 1": 671,
  "HERMANOS DE SANGRE 1": { type: "tv", id: 4613 },
  "HERMANOS DE SANGRE 2": { type: "tv", id: 4613 },
  "HERMANOS DE SANGRE 3": { type: "tv", id: 4613 },
  "HERMANOS DE SANGRE 4": { type: "tv", id: 4613 },
  "HERMANOS DE SANGRE 5": { type: "tv", id: 4613 },
  "HERMANOS DE SANGRE 6": { type: "tv", id: 4613 },
  "HITLER, EL REINADO DEL MAL": { type: "tv", id: 46976 },
  "INFIEL": 2251,
  "JESUS DE NAZARET": { type: "tv", id: 19649 },
  "KING KONG": 254,
  "LA 7ª PROFECIA": 11082,
  "LA BUSQUEDA": 2059,
  "LA GUERRA DE LOS MUNDOS": 74,
  "LA INTERPRETE": 179,
  "LA ISLA": 1635,
  "LA MALDICION": 11838,
  "LA MISION": 11416,
  "LA NIEBLA": 5876,
  "LA PROFECIA": 794,
  "LA TERMINAL": 594,
  "LA VENGANZA DEL CONDE DE MONTECRITO": 11362,
  "LOS OTROS": 1933,
  "LOS ROMPEHUESOS": 11590,
  "MANUAL DEL AMOR": 20068,
  "MISION IMPOSIBLE": 954,
  "NAUFRAGO": 8358,
  "PERSEGUIDO": 865,
  "PITCH BLACK": 2787,
  "ROSE RED - DISCO 1": { type: "tv", id: 19654 },
  "ROSE RED - DISCO 2": { type: "tv", id: 19654 },
  "SAINT AND SOLDIERS": 306063,
  "SAW 2": 215,
  "SAW 3": 214,
  "SEVEN": 807,
  "STAR WARS: EPISODIO 1": 1893,
  "STAR WARS: EPISODIO 2": 1894,
  "STAR WARS: EPISODIO 3": 1895,
  "STAR WARS: EPISODIO 4": 11,
  "STAR WARS: EPISODIO 5": 1891,
  "STAR WARS: EPISODIO 6": 1892,
  "STAR WARS - EXTRAS 1": 72694,
  "STAR WARS - EXTRAS 2": 72694,
  "STAR WARS - EXTRAS 3": 72694,
  "STAR WARS - EXTRAS 4": 72694,
  "SUPERMAN": 1924,
  "THE GAME": 2649,
  "THEY": 16028,
  "TIBURON": 578,
  "TIO VIVO": 75508,
  "TROYA": 652,
  "X-MEN": 36657,
  "X-MEN 3": 36668,
  "XXX 2": 47971,
  "ZATOICHI": 246,
};

const TMDB_SKIP = new Set([
  //"A TODO GAS"
]);

let peliculas = [];
let filtered = [];
let lastFocusedIndex = 0;

const TMDB_PROXY_BASE = "https://empty-paper-474c.eligioalmuedo.workers.dev";
const IMG_BASE_CARD = "https://image.tmdb.org/t/p/w342";
const IMG_BASE_MODAL = "https://image.tmdb.org/t/p/w500";

// caches
const SEARCH_CACHE = new Map();   // titulo_norm -> search result
const DETAILS_CACHE = new Map();  // type:id -> details

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s) {
  return (s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])
  );
}

/* =========================
   App
========================= */

async function load() {
  const res = await fetch("peliculas.json");
  peliculas = await res.json();

  peliculas.sort((a, b) =>
    (a.titulo_norm || a.titulo).localeCompare(b.titulo_norm || b.titulo, "es")
  );

  filtered = peliculas;
  render();
  setupEvents();
}

function render() {
  const grid = $("#grid");
  grid.innerHTML = "";

  $("#count").textContent = `${filtered.length} / ${peliculas.length}`;

  filtered.forEach((p, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;
    card.dataset.index = String(index);

    card.innerHTML = `
      <div class="poster" data-poster="1">🎞️</div>
      <div class="cardTitle">${escapeHtml(p.titulo)}</div>
      <div class="cardMeta">Nº ${p.numero}${p.nota ? " • " + escapeHtml(p.nota) : ""}</div>
    `;

    // En TV con cursor, esto abre siempre (porque es click del puntero)
    card.addEventListener("click", () => openModal(p, index));

    grid.appendChild(card);

    loadPosterForCard(p, card).catch(() => {});
  });

  // foco inicial (en TV puede no importar)
  setTimeout(() => {
    const first = document.querySelector(".card");
    if (first) first.focus();
  }, 150);

  if (REVIEW_MODE) {
    setTimeout(() => {
      if (review.missing.size) {
        console.log("SIN CARÁTULA / SIN MATCH:", Array.from(review.missing).sort());
      }
    }, 1500);
  }
}

function setupEvents() {
  // BUSCADOR
  $("#search").addEventListener("input", (e) => {
    const q = normalize(e.target.value);
    filtered = !q
      ? peliculas
      : peliculas.filter(p => normalize(p.titulo).includes(q) || normalize(p.nota || "").includes(q));
    render();
  });

  // ===== CIERRE MODAL: click/puntero/touch + zona caliente =====
  const closeBtn = $("#closeBtn");
  const modal = $("#modal");
  const modalCard = document.querySelector(".modalCard");

  // Forzar X grande y por encima (TV cursor a veces “tapa” botones pequeños)
  function ensureCloseBtnTop() {
    if (!closeBtn || !modalCard) return;
    modalCard.style.position = "relative";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "10px";
    closeBtn.style.right = "10px";
    closeBtn.style.width = "72px";
    closeBtn.style.height = "72px";
    closeBtn.style.fontSize = "30px";
    closeBtn.style.lineHeight = "72px";
    closeBtn.style.textAlign = "center";
    closeBtn.style.zIndex = "2147483647";
    closeBtn.style.pointerEvents = "auto";
    closeBtn.style.touchAction = "manipulation";
  }

  const close = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    closeModal();
  };

  // Click directo en la X
  if (closeBtn) {
    closeBtn.addEventListener("click", close);
    closeBtn.addEventListener("pointerdown", (e) => { e.stopPropagation(); }); // evita que “caiga” al modalCard
    closeBtn.addEventListener("pointerup", close, true);
    closeBtn.addEventListener("touchend", close, true);
  }

  // Click fuera de la tarjeta (fondo)
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target && e.target.id === "modal") closeModal();
    });
    modal.addEventListener("pointerup", (e) => {
      if (e.target && e.target.id === "modal") closeModal();
    }, true);
  }

  // Zona caliente: esquina superior derecha de la tarjeta (por si la X queda “tapada”)
  if (modalCard) {
    modalCard.addEventListener("pointerup", (e) => {
      const modalOpen = !modal.classList.contains("hidden");
      if (!modalOpen) return;

      const r = modalCard.getBoundingClientRect();
      const hotW = Math.min(140, r.width * 0.28);
      const hotH = Math.min(140, r.height * 0.28);

      const inHotZone =
        e.clientX >= (r.right - hotW) &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= (r.top + hotH);

      if (inHotZone) closeModal();
    }, true);
  }

  // Navegación con teclado para PC (no estorba en TV cursor)
  document.addEventListener("keydown", (e) => {
    const modalOpen = !modal.classList.contains("hidden");
    if (modalOpen) {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        closeModal();
      }
      return;
    }

    if (document.activeElement === $("#search") && e.key === "ArrowDown") {
      const first = $$(".card")[0];
      if (first) {
        e.preventDefault();
        first.focus();
        first.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const active = document.activeElement;
    if (!active || !active.classList.contains("card")) return;

    const cards = Array.from($$(".card"));
    const fromIndex = parseInt(active.dataset.index, 10);
    if (Number.isNaN(fromIndex)) return;

    if (e.key === "Enter") {
      e.preventDefault();
      openModal(filtered[fromIndex], fromIndex);
      return;
    }

    const dir =
      e.key === "ArrowLeft" ? "left" :
      e.key === "ArrowRight" ? "right" :
      e.key === "ArrowUp" ? "up" :
      e.key === "ArrowDown" ? "down" :
      null;

    if (!dir) return;

    e.preventDefault();
    const next = findNextByGeometry(active, cards, dir);
    if (next) {
      next.focus();
      next.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  });

  // Asegurar la X arriba desde el inicio
  ensureCloseBtnTop();

  // Y cada vez que se abra el modal (por si el navegador “recoloca” cosas)
  const _open = openModal;
  openModal = async function(p, index) {
    ensureCloseBtnTop();
    return _open(p, index);
  };
}

// Geometría para PC
function findNextByGeometry(fromEl, allEls, dir) {
  const from = fromEl.getBoundingClientRect();
  const fromCx = (from.left + from.right) / 2;
  const fromCy = (from.top + from.bottom) / 2;

  let best = null;
  let bestScore = Infinity;

  for (const el of allEls) {
    if (el === fromEl) continue;

    const r = el.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;

    if (dir === "down" && cy <= fromCy + 1) continue;
    if (dir === "up" && cy >= fromCy - 1) continue;
    if (dir === "right" && cx <= fromCx + 1) continue;
    if (dir === "left" && cx >= fromCx - 1) continue;

    const dx = cx - fromCx;
    const dy = cy - fromCy;

    const score =
      (dir === "down" || dir === "up")
        ? Math.abs(dx) * 3 + Math.abs(dy)
        : Math.abs(dy) * 3 + Math.abs(dx);

    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
}

/* =========================
   Modal
========================= */

async function openModal(p, index) {
  lastFocusedIndex = index;

  $("#num").textContent = `Nº ${p.numero}`;
  $("#title").textContent = p.titulo;
  $("#note").textContent = p.nota ? p.nota : "";

  const posterEl = document.querySelector(".modalBody .poster");
  posterEl.textContent = "🎞️";
  posterEl.style.backgroundImage = "";
  posterEl.style.backgroundSize = "";
  posterEl.style.backgroundPosition = "";

  $("#modal").classList.remove("hidden");

  // En TV cursor no siempre hay foco real, pero no estorba:
  $("#closeBtn").focus?.();

  try {
    if (TMDB_SKIP.has(p.titulo)) {
      if (REVIEW_MODE) review.missing.add(p.titulo);
      return;
    }

    const match = await searchTmdb(p.titulo);
    if (!match?.id) {
      if (REVIEW_MODE) review.missing.add(p.titulo);
      return;
    }

    const details = await getTmdbDetails({ type: match.type || "movie", id: match.id });
    if (!details) {
      if (REVIEW_MODE) review.missing.add(p.titulo);
      return;
    }

    if (details.poster_path) {
      posterEl.textContent = "";
      posterEl.style.backgroundImage = `url(${IMG_BASE_MODAL}${details.poster_path})`;
      posterEl.style.backgroundSize = "cover";
      posterEl.style.backgroundPosition = "center";
    } else {
      if (REVIEW_MODE) review.missing.add(p.titulo);
    }

    const date = details.release_date || details.first_air_date || "";
    const year = date ? date.slice(0, 4) : "";
    const sinopsis = details.overview || "";

    const cast = details.credits?.cast
      ? details.credits.cast.slice(0, 8).map(c => c.name).join(", ")
      : "";

    const extra = [
      year ? `Año: ${year}` : "",
      sinopsis ? `\n\n${sinopsis}` : "",
      cast ? `\n\nReparto: ${cast}` : ""
    ].filter(Boolean).join("");

    $("#note").textContent = (p.nota ? p.nota + "\n" : "") + extra;
  } catch (err) {
    console.error("TMDB error:", err);
    if (REVIEW_MODE) review.missing.add(p.titulo);
  }
}

function closeModal() {
  const modal = $("#modal");
  if (!modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
    const prev = document.querySelector(`[data-index="${lastFocusedIndex}"]`);
    prev?.focus?.();
  }
}

/* =========================
   TMDB
========================= */

async function searchTmdb(title) {
  if (TMDB_SKIP.has(title)) return null;

  // overrides
  if (TMDB_OVERRIDES && TMDB_OVERRIDES[title]) {
    const ov = TMDB_OVERRIDES[title];

    if (typeof ov === "number") {
      const details = await getTmdbDetails({ type: "movie", id: ov });
      return { id: ov, type: "movie", poster_path: details?.poster_path || null };
    }

    const type = ov.type || "movie";
    const id = ov.id;
    const details = await getTmdbDetails({ type, id });
    return { id, type, poster_path: details?.poster_path || null };
  }

  const key = normalize(title);
  if (SEARCH_CACHE.has(key)) return SEARCH_CACHE.get(key);

  const res = await fetch(`${TMDB_PROXY_BASE}/search?query=${encodeURIComponent(title)}`);
  const data = await res.json();

  const first = data?.results?.[0] || null;
  SEARCH_CACHE.set(key, first);
  return first;
}

async function getTmdbDetails(ref) {
  const type = ref?.type || "movie";
  const id = ref?.id ?? ref;

  const cacheKey = `${type}:${id}`;
  if (DETAILS_CACHE.has(cacheKey)) return DETAILS_CACHE.get(cacheKey);

  const endpoint = type === "tv" ? "tv" : "movie";
  const res = await fetch(`${TMDB_PROXY_BASE}/${endpoint}?id=${encodeURIComponent(id)}`);
  const data = await res.json();

  DETAILS_CACHE.set(cacheKey, data);
  return data;
}

async function loadPosterForCard(p, cardEl) {
  const posterDiv = cardEl.querySelector('[data-poster="1"]');
  if (!posterDiv) return;

  const match = await searchTmdb(p.titulo);

  if (!match?.poster_path) {
    if (REVIEW_MODE) review.missing.add(p.titulo);
    return;
  }

  posterDiv.textContent = "";
  posterDiv.style.backgroundImage = `url(${IMG_BASE_CARD}${match.poster_path})`;
  posterDiv.style.backgroundSize = "cover";
  posterDiv.style.backgroundPosition = "center";
}

/* =========================
   Start
========================= */

load();