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

// Eventos y Manual se leen/publican contra un Google Sheet, a
// través de un Apps Script desplegado como Web App. Pega aquí la
// URL que te da Google al desplegar (termina en /exec).
// Instrucciones completas en GUIA-EVENTOS.md.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwrJv8Gsbztshpk3CtSTuDHavn0pfr2bUfHJWApdf2aPwMtJTQYOI5kpwvxSlzhyB44xQ/exec";

const DISCORD_INVITE = "https://discord.gg/3vuTvaYRAt";
const MANUAL_PDF_URL = "docs/manual-ceremonias.pdf";

// La contraseña de administrador se valida dentro del Apps Script,
// no aquí — este archivo no contiene ningún secreto.

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
  const adminToolbar = document.getElementById("admin-toolbar");

  const adminOpenBtn = document.getElementById("admin-open-btn");
  const adminAddBtn = document.getElementById("admin-add-btn");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  const adminPanelCancel = document.getElementById("admin-panel-cancel");
  const loginForm = document.getElementById("admin-login-form");
  const loginCancel = document.getElementById("admin-login-cancel");
  const loginError = document.getElementById("admin-login-error");
  const passInput = document.getElementById("admin-pass");

  const eventForm = document.getElementById("event-form");
  const eventSubmitBtn = eventForm.querySelector("button[type=submit]");
  const formError = document.getElementById("event-form-error");
  const titleInput = document.getElementById("event-title");
  const dateInput = document.getElementById("event-date");
  const descInput = document.getElementById("event-desc");
  const boldBtn = document.getElementById("event-bold-btn");
  const imageInput = document.getElementById("event-image");

  // La contraseña se guarda SOLO en memoria mientras dura la sesión
  // del panel admin (nunca en disco); se reenvía en cada acción
  // porque la validación real ocurre en el Apps Script.
  let sessionPass = "";
  let isAdmin = false;
  let currentEvents = [];

  function showView(view) {
    [eventsView, loginView, panelView].forEach((v) => v.hidden = true);
    view.hidden = false;
  }

  function eventCardHtml(ev) {
    const deleteBtn = isAdmin
      ? `<button type="button" class="event-delete-btn mono" data-id="${escapeHtml(ev.id || "")}">Eliminar</button>`
      : "";
    return `
      <div class="event-card">
        <span class="ev-date mono">${escapeHtml(ev.date || "")}</span>
        <h4>${escapeHtml(ev.title || "Evento")}</h4>
        <p>${renderEventText(ev.desc || "")}</p>
        ${ev.image ? `<img src="${escapeHtml(ev.image)}" alt="${escapeHtml(ev.title || "Evento")}" loading="lazy">` : ""}
        ${deleteBtn}
      </div>`;
  }

  function renderEventsList() {
    if (!currentEvents.length) {
      listEl.innerHTML = `<p class="events-empty mono">SIN EVENTOS PROGRAMADOS POR AHORA</p>`;
      return;
    }
    listEl.innerHTML = currentEvents.map(eventCardHtml).join("");
    if (isAdmin) {
      listEl.querySelectorAll(".event-delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => deleteEvent(btn.dataset.id, btn));
      });
    }
  }

  async function loadEvents() {
    if (!APPS_SCRIPT_URL) {
      listEl.innerHTML = `<p class="events-empty mono">FALTA CONECTAR APPS_SCRIPT_URL EN site.js</p>`;
      return;
    }
    listEl.innerHTML = `<p class="events-empty mono">CARGANDO EVENTOS…</p>`;
    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: "GET" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error");
      currentEvents = data.events;
      renderEventsList();
    } catch (err) {
      listEl.innerHTML = `<p class="events-empty mono">NO SE PUDIERON CARGAR LOS EVENTOS. INTENTA MÁS TARDE.</p>`;
    }
  }

  async function deleteEvent(id, btn) {
    if (!id) return;
    if (!confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return;
    btn.disabled = true;
    btn.textContent = "Eliminando…";
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", pass: sessionPass, id })
      });
      const data = await res.json();
      if (!data.ok) {
        toast(data.error || "No se pudo eliminar el evento.");
        btn.disabled = false;
        btn.textContent = "Eliminar";
        return;
      }
      toast("Evento eliminado.");
      loadEvents();
    } catch (err) {
      toast("Error de conexión. Intenta de nuevo.");
      btn.disabled = false;
      btn.textContent = "Eliminar";
    }
  }

  function setAdminMode(on) {
    isAdmin = on;
    adminToolbar.hidden = !on;
    adminOpenBtn.hidden = on;
    renderEventsList();
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

  // Confirma la contraseña contra el Apps Script antes de activar
  // el modo admin (mostrar botones de eliminar y agregar evento).
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    if (!APPS_SCRIPT_URL) {
      loginError.textContent = "Falta conectar APPS_SCRIPT_URL en site.js.";
      loginError.hidden = false;
      return;
    }
    const submitBtn = loginForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "check", pass: passInput.value })
      });
      const data = await res.json();
      if (!data.ok) {
        loginError.textContent = data.error || "Contraseña incorrecta.";
        loginError.hidden = false;
        passInput.value = "";
        return;
      }
      sessionPass = passInput.value;
      loginForm.reset();
      setAdminMode(true);
      showView(eventsView);
    } catch (err) {
      loginError.textContent = "Error de conexión. Intenta de nuevo.";
      loginError.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  adminAddBtn.addEventListener("click", () => {
    formError.hidden = true;
    eventForm.reset();
    showView(panelView);
  });
  adminPanelCancel.addEventListener("click", () => showView(eventsView));

  adminLogoutBtn.addEventListener("click", () => {
    sessionPass = "";
    setAdminMode(false);
    showView(eventsView);
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
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "publish", pass: sessionPass, date, title, desc, image })
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
}

// ------------------------------------------------------------
// SIDEBAR — menú deslizante con accesos a cada sección
// ------------------------------------------------------------
function initSidebar() {
  const openBtn = document.getElementById("sidebar-open-btn");
  const overlay = document.getElementById("sidebar-overlay");
  const closeBtn = document.getElementById("sidebar-close-btn");
  if (!openBtn || !overlay) return;

  function open() {
    overlay.classList.add("active");
    document.body.classList.add("modal-open");
  }
  function close() {
    overlay.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("active")) close(); });
  overlay.querySelectorAll("[data-close-sidebar]").forEach((el) => el.addEventListener("click", close));

  const manualBtn = document.getElementById("sidebar-manual-btn");
  const manualModal = document.getElementById("manual-modal");
  if (manualBtn && manualModal) {
    manualBtn.addEventListener("click", () => {
      close();
      manualModal.classList.add("active");
      document.body.classList.add("modal-open");
    });
  }
}

// ------------------------------------------------------------
// MANUAL DE INSTRUCCIONES — acceso protegido solo con contraseña
// ------------------------------------------------------------
function initManual() {
  const overlay = document.getElementById("manual-modal");
  if (!overlay) return;

  const closeBtn = document.getElementById("manual-modal-close");
  const loginView = document.getElementById("manual-login-view");
  const unlockedView = document.getElementById("manual-unlocked-view");
  const loginForm = document.getElementById("manual-login-form");
  const loginCancel = document.getElementById("manual-login-cancel");
  const loginError = document.getElementById("manual-login-error");
  const passInput = document.getElementById("manual-pass");

  function close() {
    overlay.classList.remove("active");
    document.body.classList.remove("modal-open");
  }
  function reset() {
    loginView.hidden = false;
    unlockedView.hidden = true;
    loginError.hidden = true;
    loginForm.reset();
  }

  closeBtn.addEventListener("click", () => { close(); reset(); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) { close(); reset(); } });
  loginCancel.addEventListener("click", () => { close(); reset(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("active")) { close(); reset(); } });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    if (!APPS_SCRIPT_URL) {
      loginError.textContent = "Falta conectar APPS_SCRIPT_URL en site.js.";
      loginError.hidden = false;
      return;
    }
    const submitBtn = loginForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "check", pass: passInput.value })
      });
      const data = await res.json();
      if (!data.ok) {
        loginError.textContent = data.error || "Contraseña incorrecta.";
        loginError.hidden = false;
        passInput.value = "";
        return;
      }
      loginView.hidden = true;
      unlockedView.hidden = false;
    } catch (err) {
      loginError.textContent = "Error de conexión. Intenta de nuevo.";
      loginError.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// EASTER EGG
// ------------------------------------------------------------
const EASTEREGG_ICON = "data:image/png;base64,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";

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
  initSidebar();
  initManual();
  initEasterEgg();
});