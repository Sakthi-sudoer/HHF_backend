// Global App Config & State
const LOCAL_API_BASE = "http://127.0.0.1:8001/api/v1";
const RENDER_API_BASE = "https://hhf-backend-4h27.onrender.com/api/v1";

const state = {
  apiBase: localStorage.getItem("HHF_API_URL") || LOCAL_API_BASE,
  activeTab: localStorage.getItem("HHF_TAB") || "dashboard",
  theme: localStorage.getItem("HHF_THEME") || "dark",
  fontSize: localStorage.getItem("HHF_FONT_SIZE") || "normal",
  customers: [],
  dashboardData: null,
  deliverySheet: [],
  expenses: [],
  inventory: [],
  ledgerData: null
};

// Initialize Theme & Font Size on Load
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(state.theme);
  applyFontSize(state.fontSize);
});

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem("HHF_THEME", theme);
  const html = document.documentElement;
  if (theme === 'light') {
    html.classList.add('theme-light');
  } else {
    html.classList.remove('theme-light');
  }
}

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme.toUpperCase()} theme!`);
}

function applyFontSize(size) {
  state.fontSize = size;
  localStorage.setItem("HHF_FONT_SIZE", size);
  const html = document.documentElement;
  html.classList.remove('font-large', 'font-xlarge');
  if (size === 'large') html.classList.add('font-large');
  if (size === 'xlarge') html.classList.add('font-xlarge');

  document.querySelectorAll('.font-scale-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
}

function setFontSize(size) {
  applyFontSize(size);
  showToast(`Font size updated to ${size.toUpperCase()}!`);
}

function getApiBase() {
  return state.apiBase;
}

function setApiBase(url) {
  state.apiBase = url;
  localStorage.setItem("HHF_API_URL", url);
}

function toggleQuickServer() {
  const current = getApiBase();
  const next = current.includes("127.0.0.1") || current.includes("localhost") ? RENDER_API_BASE : LOCAL_API_BASE;
  setApiBase(next);
  const label = next.includes("127.0.0.1") ? "Localhost (Port 8001)" : "Cloud Server (Render)";
  showToast(`Connected to ${label}!`);
  if (typeof switchTab === 'function') switchTab(state.activeTab);
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success);"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function openModal(htmlContent) {
  const overlay = document.getElementById("modal-overlay");
  const content = document.getElementById("modal-content");
  if (overlay && content) {
    content.innerHTML = htmlContent;
    overlay.style.display = "flex";
  }
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}

function openConfigModal() {
  openModal(`
    <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--text-main);">Configure Backend API Server</h3>
    <p class="page-subtitle" style="margin-bottom:1rem;">Select or enter your backend API Base URL:</p>
    <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
      <button type="button" class="btn btn-secondary btn-sm" onclick="setQuickServer('${LOCAL_API_BASE}')">💻 Local (Port 8001)</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="setQuickServer('${RENDER_API_BASE}')">☁️ Render Cloud</button>
    </div>
    <input type="text" id="api-url-in" value="${getApiBase()}" class="form-control" style="margin-bottom:1.25rem;">
    <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
      <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="saveApiUrl()">Save & Connect</button>
    </div>
  `);
}

function setQuickServer(url) {
  const input = document.getElementById("api-url-in");
  if (input) input.value = url;
}

function saveApiUrl() {
  const input = document.getElementById("api-url-in");
  if (input) {
    setApiBase(input.value);
    closeModal();
    showToast("API Server URL updated!");
    if (typeof switchTab === 'function') switchTab(state.activeTab);
  }
}
