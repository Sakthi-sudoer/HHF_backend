// UI Management & Routing Helper
function showToast(msg) {
  const toast = document.getElementById("toast");
  const text = document.getElementById("toast-text");
  if (toast && text) {
    text.innerText = msg;
    toast.classList.remove("translate-y-10", "opacity-0");
    setTimeout(() => {
      toast.classList.add("translate-y-10", "opacity-0");
    }, 3500);
  }
}

function openModal(htmlContent) {
  const container = document.getElementById("modal-container");
  const content = document.getElementById("modal-content");
  if (container && content) {
    content.innerHTML = htmlContent;
    container.classList.remove("hidden");
  }
}

function closeModal() {
  const container = document.getElementById("modal-container");
  if (container) {
    container.classList.add("hidden");
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  showToast("Theme toggled!");
}

function openConfigModal() {
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-2">Configure Backend API URL</h3>
    <p class="text-xs text-slate-400 mb-4">Set the cloud backend API Base URL (Render Cloud Server or Localhost).</p>
    <input type="text" id="api-url-in" value="${getApiBase()}" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 mb-4 focus:border-teal-500 outline-none">
    <div class="flex justify-end gap-2">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300 hover:bg-slate-700">Cancel</button>
      <button onclick="saveApiUrl()" class="px-4 py-2 bg-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-teal-600">Save Server</button>
    </div>
  `);
}

function saveApiUrl() {
  const input = document.getElementById("api-url-in");
  if (input) {
    setApiBase(input.value);
    closeModal();
    checkHealth();
    showToast("API Server URL updated!");
  }
}

async function checkHealth() {
  const statusInd = document.getElementById("status-indicator");
  const statusTitle = document.getElementById("status-title");
  try {
    await api.getDashboard("today");
    if (statusInd) statusInd.className = "w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50";
    if (statusTitle) statusTitle.innerText = "Cloud API Connected";
  } catch (err) {
    if (statusInd) statusInd.className = "w-3 h-3 rounded-full bg-amber-500";
    if (statusTitle) statusTitle.innerText = "Offline / Fallback";
  }
}

function exportCSV(type, dataList) {
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
        cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
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
