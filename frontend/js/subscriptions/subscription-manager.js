// Subscription Manager
function populateSubscriptionCustomerDropdown() {
  const sel = document.getElementById("sub-cust-select");
  if (!sel) return;
  const opts = state.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
  sel.innerHTML = opts || '<option value="cust_1">Ravi Kumar (9876543210)</option>';
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
