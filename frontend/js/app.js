// Application Main Controller & Router
document.addEventListener("DOMContentLoaded", () => {
  switchTab(state.activeTab);
  checkHealth();
});

function switchTab(tabId) {
  state.activeTab = tabId;
  localStorage.setItem("HHF_TAB", tabId);

  // Highlight Desktop Navigation
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('bg-slate-800', 'text-teal-400', 'border-l-4', 'border-teal-500'));
  const desktopNav = document.getElementById(`nav-${tabId}`);
  if (desktopNav) desktopNav.classList.add('bg-slate-800', 'text-teal-400', 'border-l-4', 'border-teal-500');

  // Highlight Mobile Navigation
  document.querySelectorAll('.mobile-nav').forEach(el => el.classList.remove('text-teal-400'));
  const mobileNav = document.getElementById(`mobile-nav-${tabId}`);
  if (mobileNav) mobileNav.classList.add('text-teal-400');

  // Update Page Title
  const headers = {
    dashboard: ["Dashboard Overview", "Live operational & financial metrics"],
    customers: ["Customer CRM", "Manage customer profiles & soft-deletes"],
    subscriptions: ["New Meal Plan", "Monthly, Weekly & Trial options"],
    delivery: ["Daily Delivery Matrix", "Meal roster & leave extensions"],
    ledger: ["Customer Ledger", "Double-entry timeline & void payments"],
    expenses: ["Operational Expenses", "Categorized expense tracking"],
    inventory: ["Stock & Inventory", "Kitchen ingredient stock management"],
    settings: ["System Settings", "Configure business pricing rules"]
  };

  if (headers[tabId]) {
    const titleEl = document.getElementById("page-title");
    const subEl = document.getElementById("page-subtitle");
    if (titleEl) titleEl.innerText = headers[tabId][0];
    if (subEl) subEl.innerText = headers[tabId][1];
  }

  // Render View into Container
  const container = document.getElementById("view-container");
  if (!container) return;

  if (tabId === 'dashboard') {
    container.innerHTML = renderDashboardView();
    loadDashboardData();
  } else if (tabId === 'customers') {
    container.innerHTML = renderCustomersView();
    loadCustomerData();
  } else if (tabId === 'subscriptions') {
    container.innerHTML = renderSubscriptionsView();
  } else if (tabId === 'delivery') {
    container.innerHTML = renderDeliveriesView();
    loadDeliverySheet();
  } else if (tabId === 'ledger') {
    container.innerHTML = renderLedgerView();
    loadCustomerLedger();
  } else if (tabId === 'expenses') {
    container.innerHTML = renderExpensesView();
    loadExpensesData();
  } else if (tabId === 'inventory') {
    container.innerHTML = renderInventoryView();
    loadInventoryData();
  } else if (tabId === 'settings') {
    container.innerHTML = renderSettingsView();
  }
}
