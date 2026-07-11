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

// ---- Eventos: ahora se leen y se publican contra un Google
// Sheet, a través de un Apps Script desplegado como Web App.
// Pega aquí la URL que te da Google al desplegar (termina en
// /exec). Instrucciones completas en GUIA-EVENTOS.md.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwrJv8Gsbztshpk3CtSTuDHavn0pfr2bUfHJWApdf2aPwMtJTQYOI5kpwvxSlzhyB44xQ/exec";

const DISCORD_INVITE = "https://discord.gg/3vuTvaYRAt";

// El usuario/contraseña de admin YA NO se validan aquí — se
// validan dentro del Apps Script (código que los visitantes del
// sitio no pueden ver), que es un lugar más seguro para esa
// comparación que el JS del navegador.

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
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
  const loginSubmitBtn = loginForm.querySelector("button[type=submit]");
  const userInput = document.getElementById("admin-user");
  const passInput = document.getElementById("admin-pass");

  const eventForm = document.getElementById("event-form");
  const eventSubmitBtn = eventForm.querySelector("button[type=submit]");
  const logoutBtn = document.getElementById("admin-logout-btn");
  const formError = document.getElementById("event-form-error");
  const titleInput = document.getElementById("event-title");
  const dateInput = document.getElementById("event-date");
  const descInput = document.getElementById("event-desc");
  const boldBtn = document.getElementById("event-bold-btn");
  const imageInput = document.getElementById("event-image");

  // Credenciales guardadas SOLO en memoria mientras dura la sesión
  // del panel admin (no se guardan en disco). Se reenvían en cada
  // publicación porque la validación real ocurre en el Apps Script.
  let sessionUser = "";
  let sessionPass = "";

  function showView(view) {
    [eventsView, loginView, panelView].forEach((v) => v.hidden = true);
    view.hidden = false;
  }

  function eventCardHtml(ev) {
    return `
      <div class="event-card">
        <span class="ev-date mono">${escapeHtml(ev.date || "")}</span>
        <h4>${escapeHtml(ev.title || "Evento")}</h4>
        <p>${renderEventText(ev.desc || "")}</p>
        ${ev.image ? `<img src="${escapeHtml(ev.image)}" alt="${escapeHtml(ev.title || "Evento")}" loading="lazy">` : ""}
      </div>`;
  }

  async function loadEvents() {
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("PEGA_AQUI") === 0) {
      listEl.innerHTML = `<p class="events-empty mono">FALTA CONECTAR APPS_SCRIPT_URL EN site.js</p>`;
      return;
    }
    listEl.innerHTML = `<p class="events-empty mono">CARGANDO EVENTOS…</p>`;
    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: "GET" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error");
      if (!data.events.length) {
        listEl.innerHTML = `<p class="events-empty mono">SIN EVENTOS PROGRAMADOS POR AHORA</p>`;
        return;
      }
      listEl.innerHTML = data.events.map(eventCardHtml).join("");
    } catch (err) {
      listEl.innerHTML = `<p class="events-empty mono">NO SE PUDIERON CARGAR LOS EVENTOS. INTENTA MÁS TARDE.</p>`;
    }
  }

  function openModal() {
    showView(eventsView);
    overlay.classList.add("active");
    document.body.classList.add("modal-open");
    loadEvents();
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

  // El login real (usuario/contraseña) se valida dentro del Apps
  // Script al publicar. Aquí solo guardamos lo escrito para
  // reenviarlo, y confirmamos abriendo el panel — si las
  // credenciales fueran incorrectas, el error aparece al publicar.
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("PEGA_AQUI") === 0) {
      loginError.textContent = "Falta conectar APPS_SCRIPT_URL en site.js.";
      loginError.hidden = false;
      return;
    }
    sessionUser = userInput.value.trim();
    sessionPass = passInput.value;
    loginForm.reset();
    formError.hidden = true;
    showView(panelView);
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

  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const title = titleInput.value.trim();
    const date = dateInput.value;
    const desc = descInput.value.trim();
    const image = imageInput.value.trim();
    if (!title || !date || !desc) {
      formError.textContent = "Completa título, fecha y descripción.";
      formError.hidden = false;
      return;
    }
    if (image && !/^https?:\/\//i.test(image)) {
      formError.textContent = "El link de imagen debe empezar con http:// o https://";
      formError.hidden = false;
      return;
    }

    eventSubmitBtn.disabled = true;
    eventSubmitBtn.textContent = "Publicando…";
    try {
      // Content-Type text/plain evita el preflight CORS que Apps
      // Script no maneja; el propio script parsea el JSON del body.
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ user: sessionUser, pass: sessionPass, date, title, desc, image })
      });
      const data = await res.json();
      if (!data.ok) {
        formError.textContent = data.error || "No se pudo publicar el evento.";
        formError.hidden = false;
        return;
      }
      eventForm.reset();
      toast("Evento publicado para todos.");
      showView(eventsView);
      loadEvents();
    } catch (err) {
      formError.textContent = "Error de conexión. Intenta de nuevo.";
      formError.hidden = false;
    } finally {
      eventSubmitBtn.disabled = false;
      eventSubmitBtn.textContent = "Publicar";
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionUser = "";
    sessionPass = "";
    eventForm.reset();
    formError.hidden = true;
    showView(eventsView);
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
