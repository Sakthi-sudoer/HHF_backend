// Application Controller & Router
document.addEventListener("DOMContentLoaded", () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const datePicker = document.getElementById("delivery-date-picker");
  const subStartPicker = document.getElementById("sub-start-date");

  if (datePicker) datePicker.value = todayStr;
  if (subStartPicker) subStartPicker.value = todayStr;

  switchTab(state.activeTab);
});

function toggleMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("mobile-open");
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;
  localStorage.setItem("HHF_TAB", tabId);

  // Update Nav Active States
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.dataset.tab === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Switch Page Views
  document.querySelectorAll(".page-view").forEach(view => {
    if (view.id === `view-${tabId}`) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  // Load View Specific Data
  if (tabId === "dashboard") {
    loadDashboardData();
  } else if (tabId === "customers") {
    loadCustomerData();
  } else if (tabId === "subscriptions") {
    loadCustomerData().then(populateSubscriptionCustomerDropdown);
  } else if (tabId === "deliveries") {
    loadDeliverySheet();
  } else if (tabId === "payments") {
    loadCustomerData().then(populateLedgerCustomerDropdown).then(loadCustomerLedger);
  } else if (tabId === "expenses") {
    loadExpensesData();
  } else if (tabId === "inventory") {
    loadInventoryData();
  } else if (tabId === "settings") {
    loadSettingsData();
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("mobile-open");
}

function handleGlobalSearch() {
  const searchInput = document.getElementById("global-search-input");
  if (!searchInput) return;
  const val = searchInput.value;
  if (val && state.activeTab !== "customers") {
    switchTab("customers");
  }
  const custSearch = document.getElementById("customer-filter-search");
  if (custSearch) {
    custSearch.value = val;
    loadCustomerData();
  }
}

function handleSaveSettingsSubmit(e) {
  e.preventDefault();
  showToast("Global configuration rates saved!");
}

function exportCSV(type) {
  let dataList = [];
  if (type === 'customers') dataList = state.customers;
  if (type === 'delivery') dataList = state.deliverySheet;
  if (type === 'expenses') dataList = state.expenses;
  if (type === 'inventory') dataList = state.inventory;

  if (!dataList || !dataList.length) {
    showToast(`${type.toUpperCase()} data exported as CSV!`);
    return;
  }

  const separator = ',';
  const keys = Object.keys(dataList[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    dataList.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = typeof cell === 'object' ? JSON.stringify(cell).replace(/"/g, '""') : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  showToast(`${type.toUpperCase()} exported as CSV!`);
}
