
const REVIEW_MODE = true; // ponlo en false cuando termines
const review = { missing: new Set(), mismatched: new Set() };
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const TMDB_OVERRIDES = {
  "A TODO GAS": 9799,
  "ACORRALADO": 1368,
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

// cache para no buscar lo mismo mil veces
const SEARCH_CACHE = new Map();   // titulo_norm -> result (id, poster_path, ...)
const DETAILS_CACHE = new Map();  // tmdbId -> full details

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

    card.addEventListener("click", () => openModal(p, index));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") openModal(p, index);
    });

    grid.appendChild(card);
    // cargar poster en segundo plano (no bloquea la UI)
    loadPosterForCard(p, card).catch(() => {});
  });

  // Si al renderizar no hay foco (o se perdió), fócalo al primero
  setTimeout(() => {
    if (!document.activeElement || document.activeElement === document.body) {
      const firstCard = $$(".card")[0];
      if (firstCard) firstCard.focus();
    }
  }, 50);
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
    if (!q) {
      filtered = peliculas;
    } else {
      filtered = peliculas.filter(
        (p) =>
          normalize(p.titulo).includes(q) || normalize(p.nota || "").includes(q)
      );
    }
    render();
  });

  // Cerrar modal
  $("#closeBtn").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  // NAVEGACIÓN CON FLECHAS (por geometría)
  document.addEventListener("keydown", (e) => {
    const modalOpen = !$("#modal").classList.contains("hidden");

    // Si el modal está abierto: Escape/Backspace cierra
    if (modalOpen) {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        closeModal();
      }
      return;
    }

    // Si estás en el buscador y pulsas abajo: saltar a la primera card
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
    const fromEl = active;

    if (Number.isNaN(fromIndex)) return;

    if (e.key === "Enter") {
      e.preventDefault();
      openModal(filtered[fromIndex], fromIndex);
      return;
    }

    const dir =
      e.key === "ArrowLeft"
        ? "left"
        : e.key === "ArrowRight"
        ? "right"
        : e.key === "ArrowUp"
        ? "up"
        : e.key === "ArrowDown"
        ? "down"
        : null;

    if (!dir) return;

    e.preventDefault();

    const next = findNextByGeometry(fromEl, cards, dir);
    if (next) {
      next.focus();
      next.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  });
}

// Busca la tarjeta “más natural” en la dirección pedida usando posiciones reales
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

    // Filtrar candidatos por dirección
    if (dir === "down" && cy <= fromCy + 1) continue;
    if (dir === "up" && cy >= fromCy - 1) continue;
    if (dir === "right" && cx <= fromCx + 1) continue;
    if (dir === "left" && cx >= fromCx - 1) continue;

    const dx = cx - fromCx;
    const dy = cy - fromCy;

    // Score: prioriza alineación en el eje perpendicular, y luego distancia en el eje principal
    const score =
      dir === "down" || dir === "up"
        ? Math.abs(dx) * 3 + Math.abs(dy)
        : Math.abs(dy) * 3 + Math.abs(dx);

    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
}

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
  $("#closeBtn").focus();

  try {

    // --- SKIP manual ---
    if (typeof TMDB_SKIP !== "undefined" && TMDB_SKIP.has(p.titulo)) {
      if (typeof REVIEW_MODE !== "undefined" && REVIEW_MODE) {
        review.missing.add(p.titulo);
      }
      return;
    }

    // --- Buscar en TMDB (con override si existe) ---
    const match = await searchTmdb(p.titulo);

    if (!match?.id) {
      if (typeof REVIEW_MODE !== "undefined" && REVIEW_MODE) {
        review.missing.add(p.titulo);
      }
      return;
    }

    const details = await getTmdbDetails(match.id);

    if (!details) {
      if (typeof REVIEW_MODE !== "undefined" && REVIEW_MODE) {
        review.missing.add(p.titulo);
      }
      return;
    }

    // --- Poster grande ---
    if (details.poster_path) {
      posterEl.textContent = "";
      posterEl.style.backgroundImage = `url(${IMG_BASE_MODAL}${details.poster_path})`;
      posterEl.style.backgroundSize = "cover";
      posterEl.style.backgroundPosition = "center";
    } else {
      if (typeof REVIEW_MODE !== "undefined" && REVIEW_MODE) {
        review.missing.add(p.titulo);
      }
    }

    // --- Datos extra ---
    const year = details.release_date
      ? details.release_date.slice(0, 4)
      : "";

    const sinopsis = details.overview || "";

    const cast = details.credits?.cast
      ? details.credits.cast.slice(0, 8).map(c => c.name).join(", ")
      : "";

    const extra = [
      year ? `Año: ${year}` : "",
      sinopsis ? `\n\n${sinopsis}` : "",
      cast ? `\n\nReparto: ${cast}` : ""
    ].filter(Boolean).join("");

    $("#note").textContent =
      (p.nota ? p.nota + "\n" : "") + extra;

  } catch (err) {
    console.error("TMDB error:", err);

    if (typeof REVIEW_MODE !== "undefined" && REVIEW_MODE) {
      review.missing.add(p.titulo);
    }
  }
}

function closeModal() {
  const modal = $("#modal");
  if (!modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
    const previous = document.querySelector(`[data-index="${lastFocusedIndex}"]`);
    if (previous) previous.focus();
  }
}

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

async function searchTmdb(title) {
  // 0) Skip manual
  if (typeof TMDB_SKIP !== "undefined" && TMDB_SKIP.has(title)) return null;

  // 1) Override manual por ID -> devolvemos id + poster_path (desde detalles)
  if (typeof TMDB_OVERRIDES !== "undefined" && TMDB_OVERRIDES[title]) {
    const id = TMDB_OVERRIDES[title];
    const details = await getTmdbDetails(id);
    if (!details) return { id };
    return { id, poster_path: details.poster_path || null };
  }

  // 2) Cache normal por búsqueda
  const key = normalize(title);
  if (SEARCH_CACHE.has(key)) return SEARCH_CACHE.get(key);

  const res = await fetch(`${TMDB_PROXY_BASE}/search?query=${encodeURIComponent(title)}`);
  const data = await res.json();

  const first = data?.results?.[0] || null;
  SEARCH_CACHE.set(key, first);
  return first;
}

async function getTmdbDetails(id) {
  if (DETAILS_CACHE.has(id)) return DETAILS_CACHE.get(id);

  const res = await fetch(`${TMDB_PROXY_BASE}/movie?id=${encodeURIComponent(id)}`);
  const data = await res.json();

  DETAILS_CACHE.set(id, data);
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

load();