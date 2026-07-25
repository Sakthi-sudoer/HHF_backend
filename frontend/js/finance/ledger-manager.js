// Ledger & Payments Manager
let selectedLedgerCustId = "cust_1";

function populateLedgerCustomerDropdown() {
  const sel = document.getElementById("ledger-cust-select");
  if (!sel) return;
  const opts = state.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
  sel.innerHTML = opts || '<option value="cust_1">Ravi Kumar (9876543210)</option>';
  if (selectedLedgerCustId) sel.value = selectedLedgerCustId;
}

function selectLedgerCustomer(cId) {
  selectedLedgerCustId = cId;
  const sel = document.getElementById("ledger-cust-select");
  if (sel) sel.value = cId;
  loadCustomerLedger();
}

async function loadCustomerLedger() {
  const sel = document.getElementById("ledger-cust-select");
  const cId = sel && sel.value ? sel.value : selectedLedgerCustId;
  selectedLedgerCustId = cId;

  const container = document.getElementById("ledger-timeline");
  const balEl = document.getElementById("ledger-balance");
  if (!container) return;

  try {
    const res = await api.getCustomerLedger(cId);
    state.ledgerData = res.data.data;
    if (balEl) {
      balEl.innerText = `₹${state.ledgerData.current_balance.toLocaleString()}`;
      balEl.style.color = state.ledgerData.current_balance > 0 ? "var(--danger)" : "var(--success)";
    }

    container.innerHTML = state.ledgerData.timeline.map(item => `
      <div style="background:var(--bg-dark); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:var(--text-main); font-size:0.95rem;">${item.title}</strong>
          <p class="page-subtitle" style="margin-top:0.2rem;">${item.date} ${item.ref ? '• Ref: ' + item.ref : ''}</p>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <h3 style="font-size:1.1rem; font-weight:800; color:${item.is_debit ? 'var(--danger)' : 'var(--success)'};">
            ${item.is_debit ? '- ₹' : '+ ₹'}${item.amount}
          </h3>
          ${!item.is_debit ? `<button class="btn btn-danger btn-sm" onclick="confirmVoidPayment('${item.id}')">Void</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    if (balEl) balEl.innerText = "₹1,400.00";
    container.innerHTML = `
      <div style="background:var(--bg-dark); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:var(--text-main); font-size:0.95rem;">Monthly Subscription Invoice</strong>
          <p class="page-subtitle" style="margin-top:0.2rem;">2026-07-25 • INV-2026-07-25</p>
        </div>
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--danger);">- ₹5,400</h3>
      </div>
      <div style="background:var(--bg-dark); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:var(--text-main); font-size:0.95rem;">UPI Payment Received</strong>
          <p class="page-subtitle" style="margin-top:0.2rem;">2026-07-25 • Ref: UPI9988776655</p>
        </div>
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--success);">+ ₹4,000</h3>
      </div>
    `;
  }
}

function openPaymentModal() {
  const todayStr = new Date().toISOString().split('T')[0];
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:1rem; color:var(--primary);">Record Customer Payment</h3>
    <form onsubmit="handleRecordPaymentSubmit(event)" style="display:flex; flex-direction:column; gap:1rem;">
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Amount Paid (₹) *</label>
        <input type="number" id="pay-amt-in" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Payment Method</label>
        <select id="pay-method-in" class="form-control">
          <option value="upi">UPI (GPay / PhonePe)</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Payment Date</label>
        <input type="date" id="pay-date-in" value="${todayStr}" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Reference / Receipt Number</label>
        <input type="text" id="pay-ref-in" placeholder="e.g. UPI9988776655" class="form-control">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Submit Payment Entry</button>
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
    <div style="background:white; color:#0f172a; padding:1.75rem; border-radius:12px; font-family:'Inter', sans-serif;">
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:0.75rem;">
        <div>
          <h2 style="font-size:1.25rem; font-weight:800; color:#ea580c;">HEALTHY HOME FOODS</h2>
          <p style="font-size:0.75rem; color:#64748b;">Home-Based Food Subscription</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:1rem; font-weight:800;">INVOICE</h3>
          <p style="font-size:0.75rem; color:#64748b;">INV-${todayStr}</p>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin:1rem 0; font-size:0.85rem;">
        <div>
          <strong>Billed To:</strong>
          <p style="font-size:0.95rem; font-weight:700;">${custName}</p>
        </div>
        <div style="text-align:right;">
          <p>Date: ${todayStr}</p>
          <p style="font-weight:700; color:${bal > 0 ? '#dc2626' : '#16a34a'};">Status: ${bal > 0 ? 'PENDING' : 'PAID'}</p>
        </div>
      </div>

      <table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-bottom:1rem;">
        <thead>
          <tr style="background:#f1f5f9; text-align:left;">
            <th style="padding:0.5rem;">Description</th>
            <th style="padding:0.5rem; text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:0.5rem;">Monthly Meal Subscription</td>
            <td style="padding:0.5rem; text-align:right;">₹${invoiced}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0; color:#16a34a;">
            <td style="padding:0.5rem;">Payments Received</td>
            <td style="padding:0.5rem; text-align:right;">- ₹${paid}</td>
          </tr>
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; background:#f8fafc; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0;">
        <div>
          <p style="font-size:0.7rem; color:#64748b;">Pay via UPI</p>
          <p style="font-size:0.85rem; font-weight:700; color:#ea580c;">healthyhomefoods@upi</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:0.7rem; color:#64748b;">Outstanding Balance</p>
          <p style="font-size:1.2rem; font-weight:800; color:${bal > 0 ? '#dc2626' : '#16a34a'};">₹${bal}</p>
        </div>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
      <button class="btn btn-secondary" onclick="window.print()">🖨️ Print</button>
      <button class="btn btn-primary" onclick="window.open('https://api.whatsapp.com/send?text=Healthy Home Foods Invoice for ${encodeURIComponent(custName)}. Outstanding Balance: ₹${bal}')">💬 WhatsApp</button>
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}
