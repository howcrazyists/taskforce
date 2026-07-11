// ============================================================
// FARD ROBLOX — site.js
// Sitio 100% estático (sin backend). Para editar escuadrones o
// eventos fijos, toca los arreglos SQUADRONS / EVENTS de aquí
// abajo y sube el archivo a GitHub.
// ============================================================

const SQUADRONS = [
  { id:"uct-mide", name:"UCT-MIDE", code:"UCT-MIDE", role:"Unidad de Control Táctico", color:"#c9a24b",
    description:"Unidad de coordinación y control táctico de FARD Roblox.", logoUrl:"",
    groupUrl:"https://www.roblox.com/es/communities/35527172/UCT-MIDE#!/about" },
  { id:"esc-combate", name:"Escuadrón de Combate", code:"ESC-COM", role:"Combate aéreo", color:"#ce1126",
    description:"Escuadrón encargado de la interceptación y el combate aéreo.",
    logoUrl:"https://combate.online/assets/logo-combate-BBQGS06Y.png",
    groupUrl:"https://www.roblox.com/es/communities/35286854/Escuadr-n-de-combate#!/about" },
  { id:"esc-rescate", name:"Escuadrón de Rescate y Fuerzas Especiales", code:"ESC-RES",
    role:"Rescate y operaciones especiales", color:"#1c4c7c",
    description:"Escuadrón de búsqueda, rescate y operaciones especiales.",
    logoUrl:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Escuadron_de_Rescate_fuerza_Aerea_Dominicana.svg/330px-Escuadron_de_Rescate_fuerza_Aerea_Dominicana.svg.png",
    groupUrl:"https://www.roblox.com/es/communities/35895190/Comando-de-fuerzas-especiales-FARD-ROBLOX#!/about" },
  { id:"esc-transporte", name:"Escuadrón de Transporte", code:"ESC-TRA", role:"Transporte aéreo", color:"#3b7a57",
    description:"Escuadrón encargado del transporte aéreo de tropas y suministros.", logoUrl:"",
    groupUrl:"https://www.roblox.com/es/communities/35200398/Escuadr-n-de-transporte#!/about" },
  { id:"cadetes", name:"Cadetes", code:"CADETES", role:"Formación y entrenamiento", color:"#8a97a6",
    description:"Programa de formación para nuevos miembros de FARD Roblox.", logoUrl:"", groupUrl:"", comingSoon:true }
];

// Eventos fijos (los ve todo el mundo). El panel admin genera el
// bloque de texto para que pegues aquí nuevos objetos.
const EVENTS = [
  // { date:"2026-08-15", title:"Ejercicio conjunto", desc:"Formación abierta a todos los escuadrones.", image:"" }
];

const DISCORD_INVITE = "https://discord.gg/3vuTvaYRAt";

// ---- Admin: usuario en claro (no es un secreto), contraseña
// nunca en texto plano — se compara por hash SHA-256. Aun así,
// como el sitio no tiene servidor, esto es un candado simbólico:
// cualquiera puede leer el hash en el código fuente y, con
// suficiente esfuerzo, intentar romperlo. No protege nada real.
const ADMIN_USER = "TASKFORCE0102";
const ADMIN_PASS_HASH = "23075e4476616bb67e3588e0c20f44ee44fdfe7134d96edacda7879ca64c0132";
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 30000;

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Convierte texto ya escapado con **negrita** estilo Discord a <strong>.
// Se escapa PRIMERO y se convierte DESPUÉS, para que nadie pueda
// inyectar HTML metiendo etiquetas dentro del texto del evento.
function renderEventText(raw = "") {
  const safe = escapeHtml(raw);
  return safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// ------------------------------------------------------------
// ESCUADRONES
// ------------------------------------------------------------
function buildSquadCardEl(s) {
  const color = s.color || "#1c4c7c";
  const joinUrl = s.groupUrl || DISCORD_INVITE;
  const card = document.createElement("div");
  card.className = "squad-card reveal";
  card.innerHTML = `
    <div class="squad-head">
      <div class="squad-patch">${
        s.logoUrl ? `<img src="${escapeHtml(s.logoUrl)}" alt="Logo de ${escapeHtml(s.name || "")}">`
                   : escapeHtml((s.code || s.name || "??").slice(0, 3).toUpperCase())
      }</div>
      <div class="squad-title">
        <div class="t">${escapeHtml(s.name || "Escuadrón")}</div>
        <div class="c">${escapeHtml(s.code || "")}</div>
      </div>
    </div>
    <div class="squad-body"><p>${escapeHtml(s.description || "Sin descripción todavía.")}</p></div>
    <div class="squad-meta"><span>${escapeHtml(s.role || "Rol sin definir")}</span></div>
    <div class="squad-foot">
      ${s.comingSoon ? `<span class="btn btn-disabled">Próximamente</span>`
                      : `<a class="btn btn-primary" href="${escapeHtml(joinUrl)}" target="_blank" rel="noopener noreferrer">Solicitar unirme</a>`}
    </div>`;
  const patch = card.querySelector(".squad-patch");
  patch.style.background = color + "22";
  patch.style.borderColor = color;
  patch.style.color = color;
  return card;
}

function buildGroupRowEl(s) {
  const color = s.color || "#1c4c7c";
  const active = !!s.groupUrl && !s.comingSoon;
  const row = document.createElement(active ? "a" : "div");
  row.className = "group-row" + (active ? "" : " group-row-disabled");
  if (active) { row.href = s.groupUrl; row.target = "_blank"; row.rel = "noopener noreferrer"; }
  row.innerHTML = `
    <span class="group-dot"></span>
    <span class="group-name">${escapeHtml(s.name || "Escuadrón")}</span>
    <span class="group-status mono">${active ? "Ver grupo →" : "Próximamente"}</span>`;
  row.querySelector(".group-dot").style.background = color;
  return row;
}

function renderSquadrons() {
  const grid = document.getElementById("squadrons-grid");
  const groupsList = document.getElementById("squadron-groups");
  if (grid) { grid.innerHTML = ""; SQUADRONS.forEach((s) => grid.appendChild(buildSquadCardEl(s))); }
  if (groupsList) { groupsList.innerHTML = ""; SQUADRONS.forEach((s) => groupsList.appendChild(buildGroupRowEl(s))); }
  observeReveals();
}

function observeReveals() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => observer.observe(el));
}

// ------------------------------------------------------------
// PAGER
// ------------------------------------------------------------
function initPager() {
  const pages = document.querySelectorAll(".pager-page");
  const dots = document.querySelectorAll(".pager-dots .dot");
  if (!pages.length) return;
  let current = 0;
  const total = pages.length;

  function goTo(index) {
    index = Math.max(0, Math.min(total - 1, index));
    if (index === current) return;
    current = index;
    pages.forEach((p, i) => p.classList.toggle("is-active", i === current));
    dots.forEach((d, i) => d.classList.toggle("active", i === current));
    window.scrollTo(0, 0);
  }

  dots.forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.page))));
  document.querySelectorAll("[data-goto-page]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); goTo(Number(el.dataset.gotoPage)); });
  });

  let startX = 0, startY = 0, tracking = false;
  function onStart(x, y) { startX = x; startY = y; tracking = true; }
  function onEnd(x, y) {
    if (!tracking) return;
    tracking = false;
    const dx = x - startX, dy = y - startY;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(dx < 0 ? current + 1 : current - 1);
  }
  document.addEventListener("touchstart", (e) => {
    if (document.body.classList.contains("lightbox-open") || document.body.classList.contains("modal-open")) return;
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (document.body.classList.contains("lightbox-open") || document.body.classList.contains("modal-open")) return;
    onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: true });
}

// ------------------------------------------------------------
// LIGHTBOX
// ------------------------------------------------------------
function initLightbox() {
  const overlay = document.getElementById("lightbox");
  if (!overlay) return;
  const img = overlay.querySelector(".lightbox-img");
  const closeBtn = overlay.querySelector(".lightbox-close");
  const prevBtn = overlay.querySelector(".lightbox-prev");
  const nextBtn = overlay.querySelector(".lightbox-next");
  const counter = overlay.querySelector(".lightbox-counter");

  let images = [], index = 0, scale = 1, panX = 0, panY = 0;
  const MIN_SCALE = 1, MAX_SCALE = 4;

  function collectImages() {
    images = Array.from(document.querySelectorAll(".frame img")).map((el) => ({ src: el.currentSrc || el.src, alt: el.alt }));
  }
  function applyTransform() {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? "grab" : "zoom-in";
  }
  function resetZoom() { scale = 1; panX = 0; panY = 0; applyTransform(); }
  function setScale(next) {
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    if (scale === MIN_SCALE) { panX = 0; panY = 0; }
    applyTransform();
  }
  function render() {
    const item = images[index];
    if (!item) return;
    img.src = item.src; img.alt = item.alt || "";
    counter.textContent = `${index + 1} / ${images.length}`;
    resetZoom();
  }
  function open(startIndex) { collectImages(); index = startIndex; render(); overlay.classList.add("active"); document.body.classList.add("lightbox-open"); }
  function close() { overlay.classList.remove("active"); document.body.classList.remove("lightbox-open"); img.src = ""; }
  function next() { index = (index + 1) % images.length; render(); }
  function prev() { index = (index - 1 + images.length) % images.length; render(); }

  document.querySelectorAll(".frame img").forEach((thumb, i) => { thumb.style.cursor = "zoom-in"; thumb.addEventListener("click", () => open(i)); });
  closeBtn.addEventListener("click", close);
  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); next(); });
  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); prev(); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("active")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === "+" || e.key === "=") setScale(scale + 0.4);
    else if (e.key === "-") setScale(scale - 0.4);
  });

  let lastTap = 0;
  img.addEventListener("dblclick", () => setScale(scale > 1 ? 1 : 2.5));
  img.addEventListener("wheel", (e) => { e.preventDefault(); setScale(scale + (e.deltaY < 0 ? 0.3 : -0.3)); }, { passive: false });

  let touchMode = null, startX = 0, startY = 0, pinchStartDist = 0, pinchStartScale = 1, panStartX = 0, panStartY = 0;
  function dist(t1, t2) { return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); }

  img.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) { touchMode = "pinch"; pinchStartDist = dist(e.touches[0], e.touches[1]); pinchStartScale = scale; }
    else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap < 300) setScale(scale > 1 ? 1 : 2.5);
      lastTap = now;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      panStartX = panX; panStartY = panY;
      touchMode = scale > 1 ? "pan" : "swipe";
    }
  }, { passive: true });

  img.addEventListener("touchmove", (e) => {
    if (touchMode === "pinch" && e.touches.length === 2) { setScale(pinchStartScale * (dist(e.touches[0], e.touches[1]) / pinchStartDist)); }
    else if (touchMode === "pan" && e.touches.length === 1) {
      panX = panStartX + (e.touches[0].clientX - startX);
      panY = panStartY + (e.touches[0].clientY - startY);
      applyTransform();
    }
  }, { passive: true });

  img.addEventListener("touchend", (e) => {
    if (touchMode === "swipe" && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prev();
    }
    touchMode = null;
  }, { passive: true });
}

function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3200);
}

// ------------------------------------------------------------
// EVENTOS — modal público + panel admin
// ------------------------------------------------------------
function initEvents() {
  const openCard = document.getElementById("eventos-card");
  const overlay = document.getElementById("events-modal");
  if (!openCard || !overlay) return;

  const closeBtn = document.getElementById("events-modal-close");
  const eventsView = document.getElementById("events-view");
  const loginView = document.getElementById("admin-login-view");
  const panelView = document.getElementById("admin-panel-view");
  const listEl = document.getElementById("events-list");

  const adminOpenBtn = document.getElementById("admin-open-btn");
  const loginForm = document.getElementById("admin-login-form");
  const loginCancel = document.getElementById("admin-login-cancel");
  const loginError = document.getElementById("admin-login-error");
  const userInput = document.getElementById("admin-user");
  const passInput = document.getElementById("admin-pass");

  const eventForm = document.getElementById("event-form");
  const logoutBtn = document.getElementById("admin-logout-btn");
  const formError = document.getElementById("event-form-error");
  const titleInput = document.getElementById("event-title");
  const dateInput = document.getElementById("event-date");
  const descInput = document.getElementById("event-desc");
  const boldBtn = document.getElementById("event-bold-btn");
  const imageInput = document.getElementById("event-image");
  const imagePreview = document.getElementById("event-image-preview");
  const exportBox = document.getElementById("event-export");
  const exportCode = document.getElementById("event-export-code");
  const exportCopy = document.getElementById("event-export-copy");

  const LOCAL_EVENTS_KEY = "fard_local_events";
  let loginAttempts = 0;
  let lockedUntil = 0;
  let pendingImageDataUrl = "";

  function getLocalEvents() {
    try { return JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveLocalEvent(ev) {
    const all = getLocalEvents();
    all.push(ev);
    try { localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(all)); } catch (e) {}
  }

  function showView(view) {
    [eventsView, loginView, panelView].forEach((v) => v.hidden = true);
    view.hidden = false;
  }

  function renderEvents() {
    const all = [...EVENTS, ...getLocalEvents()].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!all.length) {
      listEl.innerHTML = `<p class="events-empty mono">SIN EVENTOS PROGRAMADOS POR AHORA</p>`;
      return;
    }
    listEl.innerHTML = all.map((ev) => `
      <div class="event-card">
        <span class="ev-date mono">${escapeHtml(ev.date || "")}</span>
        <h4>${escapeHtml(ev.title || "Evento")}</h4>
        <p>${renderEventText(ev.desc || "")}</p>
        ${ev.image ? `<img src="${ev.image}" alt="${escapeHtml(ev.title || "Evento")}">` : ""}
      </div>`).join("");
  }

  function openModal() {
    renderEvents();
    showView(eventsView);
    overlay.classList.add("active");
    document.body.classList.add("modal-open");
  }
  function closeModal() {
    overlay.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  openCard.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("active")) closeModal(); });

  adminOpenBtn.addEventListener("click", () => {
    loginError.hidden = true;
    loginForm.reset();
    showView(loginView);
  });
  loginCancel.addEventListener("click", () => showView(eventsView));

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;

    if (Date.now() < lockedUntil) {
      loginError.textContent = "Demasiados intentos. Espera unos segundos e intenta de nuevo.";
      loginError.hidden = false;
      return;
    }

    const user = userInput.value.trim();
    const pass = passInput.value;
    const passHash = await sha256Hex(pass);

    if (user === ADMIN_USER && passHash === ADMIN_PASS_HASH) {
      loginAttempts = 0;
      loginForm.reset();
      showView(panelView);
    } else {
      loginAttempts++;
      loginError.textContent = "Usuario o contraseña incorrectos.";
      loginError.hidden = false;
      passInput.value = "";
      if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
        loginAttempts = 0;
        loginError.textContent = "Demasiados intentos. Espera 30 segundos.";
      }
    }
  });

  boldBtn.addEventListener("click", () => {
    const start = descInput.selectionStart, end = descInput.selectionEnd;
    const val = descInput.value;
    if (start === end) return;
    descInput.value = val.slice(0, start) + "**" + val.slice(start, end) + "**" + val.slice(end);
    descInput.focus();
    descInput.selectionStart = start;
    descInput.selectionEnd = end + 4;
  });

  const MAX_IMAGE_BYTES = 800 * 1024;
  imageInput.addEventListener("change", () => {
    formError.hidden = true;
    pendingImageDataUrl = "";
    imagePreview.hidden = true;
    const file = imageInput.files[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      formError.textContent = "Formato no soportado. Usa PNG, JPG o WEBP.";
      formError.hidden = false;
      imageInput.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      formError.textContent = "La imagen pesa más de 800 KB. Usa una más liviana.";
      formError.hidden = false;
      imageInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingImageDataUrl = reader.result;
      imagePreview.src = pendingImageDataUrl;
      imagePreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.hidden = true;

    const title = titleInput.value.trim();
    const date = dateInput.value;
    const desc = descInput.value.trim();
    if (!title || !date || !desc) {
      formError.textContent = "Completa título, fecha y descripción.";
      formError.hidden = false;
      return;
    }

    const ev = { date, title, desc, image: pendingImageDataUrl || "" };
    saveLocalEvent(ev);

    const codeLines = [
      "  { date:\"" + date + "\", title:" + JSON.stringify(title) + ", desc:" + JSON.stringify(desc) + ",",
      "    image:" + (ev.image ? "\"" + ev.image.slice(0, 60) + "...\" /* pega el data URL completo desde tu navegador */" : "\"\"") + " },"
    ];
    exportCode.value = codeLines.join("\n");
    exportBox.hidden = false;

    eventForm.reset();
    imagePreview.hidden = true;
    pendingImageDataUrl = "";
    toast("Evento guardado en este navegador.");
  });

  exportCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(exportCode.value);
      toast("Código copiado.");
    } catch (e) {
      exportCode.select();
      toast("Selecciona y copia manualmente (Ctrl/Cmd+C).");
    }
  });

  logoutBtn.addEventListener("click", () => {
    exportBox.hidden = true;
    eventForm.reset();
    imagePreview.hidden = true;
    showView(eventsView);
    renderEvents();
  });
}

// ------------------------------------------------------------
// EASTER EGG
// ------------------------------------------------------------
const EASTEREGG_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG4AAABKCAYAAABaZmHbAAACS0lEQVR4nO2bvVEDMRCFFwq4Jhw7JqIC90BEHwx9ELkHKiBy7NhNuAET3eARPt/qZ6V96/dl9txJT/uZQyuwCCGEEEIIIYTE47DfXUZnsOJ5dABSBsWBQnGgUBwoYcXNG5OoG5Sw4qJDcaBQHCgUBwrFgUJxoFAcKCHFpb1bxF4upLhHgOJAoThQQop7eft+uvc6AiHFPQIUB0pIcWwHiFsoDhSKA4XiQKE4UEI1pprdY5RmPMQiSrb76AKhw7foz1AFQoa2aKjRBMKE7Xn6gSDRfcCRx1WeBboN5ul80aNAd4E8CUvxJNBNEM/CUjwIHB4ASVjKSIHDjrwO+92ltbS1QrYutMUatHT/xFjLujd+zrUtsljSbaJeRcoRp7mnhB4CzSdoWRRNQUrEae/PxVKg2cCjClArTjNOLhYCm/+ybjVW6WJbidOOmUsriU0G8bQwC3GasXOpzeJiIS0fJZbitPPkUJpp6KPD4tl/ne14Ost2M3Wbr4bcbFkXI/zh8rDfXY6n87/3t5upy9y1Y2gzqi5CECYi8vXxuprz/fMHogVaq5fpT1zPkwSNtJke8masapa9AG//SZUjLMWbwJy6FQdPg/Q+Ka8RltJToEib2lW3Ax6FbTeTXG9Q0tdLjBDYtR0YgVbYTCru1vtL9BZYgvuAIuvS5kLPj6CldkDk77GkHdMrrsOVbu9v3ae9TnOfB1yGqi2oVlyr+UbgKsw1S8VcK+A9CaX3epMm4vhrVreKZV3AEXOGpWW/hjAvIYQQQgghhBBCHPELm9dHqDl9qP8AAAAASUVORK5CYII=";

function initEasterEgg() {
  const egg = document.getElementById("easter-plane");
  if (!egg) return;
  egg.style.backgroundImage = `url("${EASTEREGG_ICON}")`;

  let found = 0;
  try { found = Number(localStorage.getItem("fard_egg_found") || 0); } catch (e) {}

  function randomPos() {
    const margin = 90;
    const maxX = Math.max(margin, window.innerWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - margin);
    egg.style.left = (margin + Math.random() * (maxX - margin)) + "px";
    egg.style.top = (margin + Math.random() * (maxY - margin)) + "px";
  }

  function show() {
    randomPos();
    egg.classList.remove("egg-fly-away");
    egg.classList.add("egg-visible");
    clearTimeout(show._hideTimer);
    show._hideTimer = setTimeout(() => { egg.classList.remove("egg-visible"); scheduleNext(); }, 9000);
  }
  function scheduleNext() { setTimeout(show, 40000 + Math.random() * 60000); }

  egg.addEventListener("click", () => {
    clearTimeout(show._hideTimer);
    found++;
    try { localStorage.setItem("fard_egg_found", String(found)); } catch (e) {}
    egg.classList.remove("egg-visible");
    egg.classList.add("egg-fly-away");
    toast(`Interceptado. Van ${found} ${found === 1 ? "vez" : "veces"} que lo encuentras.`);
    setTimeout(() => { egg.classList.remove("egg-fly-away"); scheduleNext(); }, 700);
  });

  setTimeout(show, 800);
}

document.addEventListener("DOMContentLoaded", () => {
  renderSquadrons();
  initPager();
  initLightbox();
  initEvents();
  initEasterEgg();
});
