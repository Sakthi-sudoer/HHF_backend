// System Settings Component
function renderSettingsView() {
  return `
    <div class="max-w-xl mx-auto bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 custom-shadow">
      <h3 class="text-base font-bold text-slate-100 mb-4">System Business Rules & Dynamic Rates</h3>
      <form onsubmit="handleSaveSettingsSubmit(event)" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-400 mb-1">Breakfast Price (₹)</label>
            <input type="number" id="cfg-b-in" value="64" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Lunch Price (₹)</label>
            <input type="number" id="cfg-l-in" value="100" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Dinner Price (₹)</label>
            <input type="number" id="cfg-d-in" value="64" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Delivery Charge > 8km (₹)</label>
            <input type="number" id="cfg-del-in" value="0" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          </div>
        </div>

        <div class="p-4 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-200">Sunday Holiday Auto-Skip</p>
            <p class="text-xs text-slate-400">Sunday meals are excluded from subscription calculations</p>
          </div>
          <input type="checkbox" checked class="w-5 h-5 accent-teal-500">
        </div>

        <button type="submit" class="w-full py-2.5 bg-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-teal-600 shadow-lg shadow-teal-500/20">
          Save Configuration Rates
        </button>
      </form>
    </div>
  `;
}

function handleSaveSettingsSubmit(e) {
  e.preventDefault();
  showToast("System Business Rates saved!");
}
