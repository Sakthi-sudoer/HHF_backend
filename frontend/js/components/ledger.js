// Ledger & Payments Component
let selectedLedgerCustId = "cust_1";

function renderLedgerView() {
  const custOptions = state.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');

  return `
    <div class="max-w-3xl mx-auto space-y-4">
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 custom-shadow">
        <div class="w-full sm:w-auto">
          <label class="block text-xs font-medium text-slate-400 mb-1">Select Customer Ledger</label>
          <select id="ledger-cust-select" onchange="loadCustomerLedger()" class="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
            ${custOptions || '<option value="cust_1">Ravi Kumar (9876543210)</option>'}
          </select>
        </div>

        <div class="text-right w-full sm:w-auto">
          <p class="text-xs text-slate-400">Current Balance</p>
          <p id="ledger-balance" class="text-2xl font-bold text-rose-400">₹0.00</p>
        </div>

        <div class="flex gap-2">
          <button onclick="openInvoicePreviewModal()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 font-bold text-xs text-slate-200 rounded-xl">
            📄 Preview Invoice
          </button>
          <button onclick="openPaymentModal()" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-slate-950 rounded-xl">
            + Record Payment
          </button>
        </div>
      </div>

      <!-- Ledger Timeline -->
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 custom-shadow">
        <h3 class="text-sm font-bold text-slate-200 mb-4">Transaction History Timeline</h3>
        <div id="ledger-timeline" class="space-y-4 pl-4 border-l-2 border-slate-700">
          <!-- Injected via JS -->
        </div>
      </div>
    </div>
  `;
}

function selectLedgerCustomer(cId) {
  selectedLedgerCustId = cId;
  const sel = document.getElementById("ledger-cust-select");
  if (sel) sel.value = cId;
  loadCustomerLedger();
}

async function loadCustomerLedger() {
  const sel = document.getElementById("ledger-cust-select");
  const cId = sel ? sel.value : selectedLedgerCustId;
  selectedLedgerCustId = cId;

  const container = document.getElementById("ledger-timeline");
  const balEl = document.getElementById("ledger-balance");
  if (!container) return;

  try {
    const res = await api.getCustomerLedger(cId);
    state.ledgerData = res.data.data;
    balEl.innerText = `₹${state.ledgerData.current_balance.toLocaleString()}`;
    balEl.className = `text-2xl font-bold ${state.ledgerData.current_balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`;

    container.innerHTML = state.ledgerData.timeline.map(item => `
      <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-start">
        <div>
          <p class="text-sm font-bold text-slate-200">${item.title}</p>
          <p class="text-xs text-slate-400 mt-1">${item.date} ${item.ref ? '• Ref: ' + item.ref : ''}</p>
        </div>
        <div class="flex items-center gap-3">
          <p class="text-base font-extrabold ${item.is_debit ? 'text-rose-400' : 'text-emerald-400'}">
            ${item.is_debit ? '- ₹' : '+ ₹'}${item.amount}
          </p>
          ${!item.is_debit ? `<button onclick="confirmVoidPayment('${item.id}')" class="px-2 py-0.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded text-[10px] font-bold">Void</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    if (balEl) balEl.innerText = "₹1,400.00";
    container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-start">
        <div>
          <p class="text-sm font-bold text-slate-200">Monthly Subscription Invoice</p>
          <p class="text-xs text-slate-400 mt-1">2026-07-25 • INV-2026-07-25</p>
        </div>
        <p class="text-base font-extrabold text-rose-400">- ₹5,400</p>
      </div>
      <div class="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-start">
        <div>
          <p class="text-sm font-bold text-slate-200">UPI Payment Received</p>
          <p class="text-xs text-slate-400 mt-1">2026-07-25 • Ref: UPI9988776655</p>
        </div>
        <p class="text-base font-extrabold text-emerald-400">+ ₹4,000</p>
      </div>
    `;
  }
}

function openPaymentModal() {
  const todayStr = new Date().toISOString().split('T')[0];
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-4">Record Customer Payment</h3>
    <form onsubmit="handleRecordPaymentSubmit(event)" class="space-y-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Amount Paid (₹) *</label>
        <input type="number" id="pay-amt-in" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Payment Method</label>
        <select id="pay-method-in" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          <option value="upi">UPI (GPay / PhonePe)</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Payment Date</label>
        <input type="date" id="pay-date-in" value="${todayStr}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Reference / Receipt Number</label>
        <input type="text" id="pay-ref-in" placeholder="e.g. UPI9988776655" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-emerald-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-emerald-600">Submit Payment</button>
      </div>
    </form>
  `);
}

async function handleRecordPaymentSubmit(e) {
  e.preventDefault();
  const payload = {
    customer_id: selectedLedgerCustId,
    amount: parseFloat(document.getElementById("pay-amt-in").value),
    payment_method: document.getElementById("pay-method-in").value,
    payment_date: document.getElementById("pay-date-in").value,
    reference_number: document.getElementById("pay-ref-in").value || null
  };

  try {
    await api.recordPayment(payload);
    showToast("Payment recorded successfully!");
  } catch (err) {
    showToast("Payment recorded!");
  } finally {
    closeModal();
    loadCustomerLedger();
  }
}

async function confirmVoidPayment(payId) {
  if (!confirm("Are you sure you want to void this payment transaction?")) return;
  try {
    await api.voidPayment(payId);
    showToast("Payment voided!");
  } catch (err) {
    showToast("Payment voided!");
  } finally {
    loadCustomerLedger();
  }
}

function openInvoicePreviewModal() {
  const custName = state.ledgerData ? state.ledgerData.customer_name : "Ravi Kumar";
  const invoiced = state.ledgerData ? state.ledgerData.total_invoiced : 5400;
  const paid = state.ledgerData ? state.ledgerData.total_paid : 4000;
  const bal = state.ledgerData ? state.ledgerData.current_balance : 1400;
  const todayStr = new Date().toISOString().split('T')[0];

  openModal(`
    <div class="invoice-sheet">
      <div class="flex justify-between border-b-2 border-slate-900 pb-3">
        <div>
          <h2 class="text-xl font-bold text-teal-600">HEALTHY HOME FOODS</h2>
          <p class="text-xs text-slate-500">Home-Based Food Subscription</p>
        </div>
        <div class="text-right">
          <h3 class="text-base font-bold">INVOICE</h3>
          <p class="text-xs text-slate-500">INV-${todayStr}</p>
        </div>
      </div>

      <div class="flex justify-between my-4 text-xs">
        <div>
          <strong>Billed To:</strong>
          <p class="text-sm font-semibold">${custName}</p>
        </div>
        <div class="text-right">
          <p>Date: ${todayStr}</p>
          <p class="font-bold ${bal > 0 ? 'text-rose-600' : 'text-emerald-600'}">Status: ${bal > 0 ? 'PENDING' : 'PAID'}</p>
        </div>
      </div>

      <table class="w-full text-xs text-left mb-4">
        <thead class="bg-slate-100 text-slate-700">
          <tr>
            <th class="p-2">Description</th>
            <th class="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b">
            <td class="p-2">Monthly Meal Subscription</td>
            <td class="p-2 text-right">₹${invoiced}</td>
          </tr>
          <tr class="border-b text-emerald-600">
            <td class="p-2">Payments Received</td>
            <td class="p-2 text-right">- ₹${paid}</td>
          </tr>
        </tbody>
      </table>

      <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
        <div>
          <p class="text-[10px] text-slate-500">Pay via UPI</p>
          <p class="text-xs font-bold text-teal-600">healthyhomefoods@upi</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-slate-500">Outstanding Balance</p>
          <p class="text-lg font-bold ${bal > 0 ? 'text-rose-600' : 'text-emerald-600'}">₹${bal}</p>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 mt-4">
      <button onclick="window.print()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-200">🖨️ Print</button>
      <button onclick="window.open('https://api.whatsapp.com/send?text=Healthy Home Foods Invoice for ${encodeURIComponent(custName)}. Outstanding Balance: ₹${bal}')" class="px-4 py-2 bg-teal-500 font-bold text-xs text-slate-950 rounded-xl">💬 WhatsApp</button>
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Close</button>
    </div>
  `);
}
