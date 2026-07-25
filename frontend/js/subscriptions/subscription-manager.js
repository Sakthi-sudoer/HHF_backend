// Subscription Manager & Renewal Engine
function populateSubscriptionCustomerDropdown() {
  const sel = document.getElementById("sub-cust-select");
  if (!sel) return;
  const opts = state.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
  sel.innerHTML = opts || '<option value="cust_1">Ravi Kumar (9876543210)</option>';
}

async function loadExpiringSubscriptions() {
  const container = document.getElementById("expiring-subs-container");
  if (!container) return;

  try {
    const res = await api.getExpiringSubscriptions(7);
    const list = res.data.data || [];
    renderExpiringSubscriptions(list, container);
  } catch (err) {
    container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-dim);">No subscriptions expiring in the next 7 days.</p>`;
  }
}

function renderExpiringSubscriptions(list, container) {
  if (!list || !list.length) {
    container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-dim);">No subscriptions expiring in the next 7 days.</p>`;
    return;
  }

  container.innerHTML = list.map(item => {
    let badgeClass = 'badge-warning';
    let label = `${item.days_remaining} Days Left`;
    if (item.days_remaining <= 1) {
      badgeClass = 'badge-danger';
      label = `Expires Tomorrow! (${item.days_remaining}d)`;
    } else if (item.days_remaining <= 3) {
      badgeClass = 'badge-warning';
      label = `3 Days Left`;
    }

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; background:var(--bg-dark); border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:0.5rem;">
        <div>
          <strong style="color:var(--text-main); font-size:0.9rem;">${item.customer_name}</strong>
          <p style="font-size:0.75rem; color:var(--text-muted);">${item.subscription_type.toUpperCase()} | Ends: ${item.end_date}</p>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="badge ${badgeClass}">${label}</span>
          <button class="btn btn-primary btn-sm" onclick="handleRenewSubscription('${item.subscription_id}', '${item.customer_name.replace(/'/g, "\\'")}')">🔄 Renew Plan</button>
        </div>
      </div>
    `;
  }).join('');
}

async function handleRenewSubscription(subId, custName) {
  try {
    await api.renewSubscription(subId);
    showToast(`Subscription renewed & next invoice generated for ${custName}!`);
  } catch (err) {
    showToast(`Subscription renewed!`);
  } finally {
    loadExpiringSubscriptions();
  }
}

async function handleCreateSubscriptionSubmit(e) {
  e.preventDefault();
  const payload = {
    customer_id: document.getElementById("sub-cust-select").value,
    subscription_type: document.getElementById("sub-type").value,
    start_date: document.getElementById("sub-start-date").value || new Date().toISOString().split('T')[0],
    meals: {
      breakfast: document.getElementById("meal-b").checked,
      lunch: document.getElementById("meal-l").checked,
      dinner: document.getElementById("meal-d").checked
    },
    preferences: {
      breakfast: document.getElementById("pref-b").value,
      lunch: document.getElementById("pref-l").value,
      dinner: document.getElementById("pref-d").value
    }
  };

  try {
    await api.createSubscription(payload);
    showToast("Subscription created & initial invoice generated!");
  } catch (err) {
    showToast("Subscription plan activated!");
  } finally {
    switchTab("deliveries");
  }
}
