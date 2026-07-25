// Global App Config & State
const DEFAULT_API_BASE = "https://hhf-backend-4h27.onrender.com/api/v1";

const state = {
  apiBase: localStorage.getItem("HHF_API_URL") || DEFAULT_API_BASE,
  activeTab: localStorage.getItem("HHF_TAB") || "dashboard",
  customers: [],
  dashboardData: null,
  deliverySheet: [],
  expenses: [],
  inventory: [],
  ledgerData: null
};

function getApiBase() {
  return state.apiBase;
}

function setApiBase(url) {
  state.apiBase = url;
  localStorage.setItem("HHF_API_URL", url);
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
    <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--text-main);">Configure Backend API URL</h3>
    <p class="page-subtitle" style="margin-bottom:1rem;">Set the live cloud backend API Base URL.</p>
    <input type="text" id="api-url-in" value="${getApiBase()}" class="form-control" style="margin-bottom:1.25rem;">
    <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveApiUrl()">Save & Reconnect</button>
    </div>
  `);
}

function saveApiUrl() {
  const input = document.getElementById("api-url-in");
  if (input) {
    setApiBase(input.value);
    closeModal();
    showToast("API Server URL updated!");
  }
}
