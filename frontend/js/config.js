// Global Application State & Configuration
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
