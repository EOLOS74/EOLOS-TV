const $ = (sel) => document.querySelector(sel);

let peliculas = [];
let filtered = [];

async function load() {
  const res = await fetch("peliculas.json");
  peliculas = await res.json();

  // Orden por título normalizado si existe, si no por título
  peliculas.sort((a,b) => (a.titulo_norm || a.titulo).localeCompare(b.titulo_norm || b.titulo, "es"));

  filtered = peliculas;
  render();
  setupEvents();
}

function render() {
  const grid = $("#grid");
  grid.innerHTML = "";

  $("#count").textContent = `${filtered.length} / ${peliculas.length}`;

  for (const p of filtered) {
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0; // importante para mando
    card.dataset.numero = p.numero;

    card.innerHTML = `
      <div class="poster">🎞️</div>
      <div class="cardTitle">${escapeHtml(p.titulo)}</div>
      <div class="cardMeta">Nº ${p.numero}${p.nota ? " • " + escapeHtml(p.nota) : ""}</div>
    `;

    card.addEventListener("click", () => openModal(p));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openModal(p);
    });

    grid.appendChild(card);
  }
}

function setupEvents() {
  $("#search").addEventListener("input", (e) => {
    const q = normalize(e.target.value);
    if (!q) {
      filtered = peliculas;
      render();
      return;
    }
    filtered = peliculas.filter(p => {
      const t = normalize(p.titulo);
      const n = normalize(p.nota || "");
      return t.includes(q) || n.includes(q);
    });
    render();
  });

  $("#closeBtn").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function openModal(p) {
  $("#num").textContent = `Nº ${p.numero}`;
  $("#title").textContent = p.titulo;
  $("#note").textContent = p.nota ? p.nota : "";
  $("#modal").classList.remove("hidden");
  $("#closeBtn").focus();
}

function closeModal() {
  const modal = $("#modal");
  if (!modal.classList.contains("hidden")) {
    modal.classList.add("hidden");
  }
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s) {
  return (s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c])
  );
}

load();