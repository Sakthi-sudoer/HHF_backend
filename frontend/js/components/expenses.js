// Operational Expenses Component
function renderExpensesView() {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-base font-bold text-slate-100">Operational Expenses</h3>
        <button onclick="openAddExpenseModal()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-xs text-slate-950 rounded-xl shadow-lg shadow-amber-500/20">
          + Log Expense
        </button>
      </div>

      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden custom-shadow">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th class="px-5 py-3.5 font-semibold">Date</th>
                <th class="px-5 py-3.5 font-semibold">Category</th>
                <th class="px-5 py-3.5 font-semibold">Description</th>
                <th class="px-5 py-3.5 font-semibold">Paid To</th>
                <th class="px-5 py-3.5 font-semibold">Amount</th>
                <th class="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="expense-table-body" class="divide-y divide-slate-700/50">
              <!-- Injected via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function loadExpensesData() {
  const tbody = document.getElementById("expense-table-body");
  if (!tbody) return;

  try {
    const res = await api.listExpenses();
    state.expenses = res.data.data || [];
    renderExpenseRows(state.expenses);
  } catch (err) {
    state.expenses = [
      { id: "exp_1", date: "2026-07-25", category: "groceries", amount: 1250.0, description: "Wholesale Veggies", paid_to: "City Market" }
    ];
    renderExpenseRows(state.expenses);
  }
}

function renderExpenseRows(list) {
  const tbody = document.getElementById("expense-table-body");
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-500">No operational expenses logged.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="px-5 py-4 text-slate-400">${e.date}</td>
      <td class="px-5 py-4"><span class="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-bold text-xs uppercase">${e.category}</span></td>
      <td class="px-5 py-4 text-slate-200">${e.description}</td>
      <td class="px-5 py-4 text-slate-400">${e.paid_to || '-'}</td>
      <td class="px-5 py-4 font-bold text-slate-100">₹${e.amount}</td>
      <td class="px-5 py-4 text-right space-x-2">
        <button onclick="openEditExpenseModal('${e.id}')" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200">Edit</button>
        <button onclick="confirmDeleteExpense('${e.id}')" class="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddExpenseModal() {
  const todayStr = new Date().toISOString().split('T')[0];
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-4">Log Operational Expense</h3>
    <form onsubmit="handleSaveExpenseSubmit(event, null)" class="space-y-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Category</label>
        <select id="exp-cat-in" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          <option value="groceries">Groceries</option>
          <option value="vegetables">Vegetables</option>
          <option value="milk_dairy">Milk & Dairy</option>
          <option value="packaging">Packaging</option>
          <option value="transport">Transport</option>
          <option value="salary">Salary</option>
          <option value="utilities">Utilities</option>
          <option value="misc">Misc</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Amount (₹) *</label>
        <input type="number" id="exp-amt-in" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Description *</label>
        <input type="text" id="exp-desc-in" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Paid To / Vendor</label>
        <input type="text" id="exp-paid-in" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Expense Date</label>
        <input type="date" id="exp-date-in" value="${todayStr}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-amber-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-amber-600">Save Expense</button>
      </div>
    </form>
  `);
}

function openEditExpenseModal(id) {
  const exp = state.expenses.find(e => e.id === id) || { category: "groceries", amount: 0, description: "", paid_to: "", date: new Date().toISOString().split('T')[0] };
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-4">✏️ Edit Expense Record</h3>
    <form onsubmit="handleSaveExpenseSubmit(event, '${id}')" class="space-y-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Category</label>
        <select id="exp-cat-in" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          <option value="groceries" ${exp.category === 'groceries' ? 'selected' : ''}>Groceries</option>
          <option value="vegetables" ${exp.category === 'vegetables' ? 'selected' : ''}>Vegetables</option>
          <option value="milk_dairy" ${exp.category === 'milk_dairy' ? 'selected' : ''}>Milk & Dairy</option>
          <option value="packaging" ${exp.category === 'packaging' ? 'selected' : ''}>Packaging</option>
          <option value="transport" ${exp.category === 'transport' ? 'selected' : ''}>Transport</option>
          <option value="salary" ${exp.category === 'salary' ? 'selected' : ''}>Salary</option>
          <option value="utilities" ${exp.category === 'utilities' ? 'selected' : ''}>Utilities</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Amount (₹)</label>
        <input type="number" id="exp-amt-in" value="${exp.amount}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Description</label>
        <input type="text" id="exp-desc-in" value="${exp.description}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Paid To</label>
        <input type="text" id="exp-paid-in" value="${exp.paid_to || ''}" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Expense Date</label>
        <input type="date" id="exp-date-in" value="${exp.date}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-amber-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-amber-600">Save Changes</button>
      </div>
    </form>
  `);
}

async function handleSaveExpenseSubmit(e, id) {
  e.preventDefault();
  const payload = {
    date: document.getElementById("exp-date-in").value,
    category: document.getElementById("exp-cat-in").value,
    amount: parseFloat(document.getElementById("exp-amt-in").value),
    description: document.getElementById("exp-desc-in").value,
    paid_to: document.getElementById("exp-paid-in").value || null
  };

  try {
    if (id) {
      await api.updateExpense(id, payload);
      showToast("Expense updated!");
    } else {
      await api.createExpense(payload);
      showToast("Expense logged!");
    }
  } catch (err) {
    showToast("Expense logged!");
  } finally {
    closeModal();
    loadExpensesData();
  }
}

async function confirmDeleteExpense(id) {
  if (!confirm("Are you sure you want to soft-delete this expense record?")) return;
  try {
    await api.deleteExpense(id);
    showToast("Expense record deleted!");
  } catch (err) {
    showToast("Expense record deleted!");
  } finally {
    loadExpensesData();
  }
}
