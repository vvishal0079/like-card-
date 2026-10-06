/* =========================================================
   CONFIG  -  mothalla indha values-a maathunga
   ========================================================= */
const CONFIG = {
  // Google Apps Script Web App URL. Empty-a irundha localStorage use aagum.
  SCRIPT_URL: "",
  ADMIN_USER: "admin",
  ADMIN_PASS: "admin123",
  LS_RESPONSES: "portfolioResponses",
  LS_THEME: "portfolioTheme",
  SS_ADMIN: "portfolioIsAdmin"
};

const USE_SHEETS = CONFIG.SCRIPT_URL.trim() !== "";

/* =========================================================
   SMALL HELPERS
   ========================================================= */
const $ = (id) => document.getElementById(id);

function setStatus(el, text, type) {
  el.textContent = text;
  el.className = "status" + (type ? " " + type : "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatTime(iso) {
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleString();
}

/* =========================================================
   1. THEME TOGGLE (light / dark)
   ========================================================= */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("theme-toggle").textContent = theme === "dark" ? "Light" : "Dark";
  try { localStorage.setItem(CONFIG.LS_THEME, theme); } catch (e) {}
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(CONFIG.LS_THEME); } catch (e) {}
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

$("theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* =========================================================
   2. STORAGE LAYER
   localStorage (JSON)  <-->  Google Sheets (Apps Script)
   ========================================================= */
function lsGetAll() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.LS_RESPONSES)) || [];
  } catch (e) {
    return [];
  }
}

function lsSave(entry) {
  const all = lsGetAll();
  all.push(entry);
  localStorage.setItem(CONFIG.LS_RESPONSES, JSON.stringify(all));
}

async function saveResponse(entry) {
  if (!USE_SHEETS) {
    lsSave(entry);
    return;
  }
  // text/plain -> CORS preflight avoid aagum (Apps Script-ku important)
  const res = await fetch(CONFIG.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(entry)
  });
  const out = await res.json();
  if (out.status !== "success") throw new Error(out.message || "Save failed");
}

async function getResponses() {
  if (!USE_SHEETS) return lsGetAll();
  const res = await fetch(CONFIG.SCRIPT_URL);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(data.message || "Load failed");
  return data;
}

/* =========================================================
   3. CONTACT FORM
   ========================================================= */
$("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $("form-status");
  const name = $("c-name").value.trim();
  const email = $("c-email").value.trim();
  const message = $("c-message").value.trim();

  if (!name || !email || !message) {
    setStatus(status, "Ella fields-aiyum fill pannunga.", "err");
    return;
  }
  if (!isValidEmail(email)) {
    setStatus(status, "Valid email enter pannunga.", "err");
    return;
  }

  const entry = { name, email, message, timestamp: new Date().toISOString() };
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  setStatus(status, "Sending...", "");

  try {
    await saveResponse(entry);
    setStatus(status, "Thank you! Unga message anuppiyaachu.", "ok");
    e.target.reset();
  } catch (err) {
    console.error(err);
    setStatus(status, "Error: message anuppa mudiyala. Marubadi try pannunga.", "err");
  } finally {
    btn.disabled = false;
  }
});

/* =========================================================
   4. ADMIN LOGIN  (show / hide)
   ========================================================= */
function showResponsesView() {
  $("admin-login").classList.add("hidden");     // login hide
  $("responses").classList.remove("hidden");    // responses show
  renderResponses();
}

function showLoginView() {
  $("responses").classList.add("hidden");
  $("admin-login").classList.remove("hidden");
}

$("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = $("a-user").value.trim();
  const pass = $("a-pass").value;
  const status = $("login-status");

  if (user === CONFIG.ADMIN_USER && pass === CONFIG.ADMIN_PASS) {
    sessionStorage.setItem(CONFIG.SS_ADMIN, "true");
    e.target.reset();
    setStatus(status, "", "");
    showResponsesView();
  } else {
    setStatus(status, "Wrong username or password.", "err");
  }
});

$("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem(CONFIG.SS_ADMIN);
  showLoginView();
});

$("refresh-btn").addEventListener("click", renderResponses);

/* =========================================================
   5. RENDER RESPONSES (dynamic, with timestamps)
   ========================================================= */
async function renderResponses() {
  const list = $("resp-list");
  const count = $("resp-count");
  list.innerHTML = "";
  setStatus(count, "Loading responses...", "");

  let data;
  try {
    data = await getResponses();
  } catch (err) {
    console.error(err);
    setStatus(count, "Responses load panna mudiyala.", "err");
    return;
  }

  // Latest first
  data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  setStatus(
    count,
    data.length + " response(s) from " + (USE_SHEETS ? "Google Sheets" : "localStorage"),
    ""
  );

  if (data.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Innum entha response-um varala.";
    list.appendChild(empty);
    return;
  }

  data.forEach((item) => {
    // textContent use pannarom -> XSS safe
    const card = document.createElement("div");
    card.className = "card resp-card";

    const who = document.createElement("div");
    who.className = "who";
    who.textContent = item.name + " (" + item.email + ")";

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatTime(item.timestamp);

    const msg = document.createElement("p");
    msg.className = "msg";
    msg.textContent = item.message;

    card.append(who, meta, msg);
    list.appendChild(card);
  });
}

/* =========================================================
   INIT
   ========================================================= */
initTheme();
if (sessionStorage.getItem(CONFIG.SS_ADMIN) === "true") {
  showResponsesView();
} else {
  showLoginView();
}
