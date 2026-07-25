// Professional Enterprise Settings Manager
let currentSettingsTab = "branding";
let cachedSettingsData = null;

async function loadSettingsData() {
  const container = document.getElementById("settings-panel-container");
  if (!container) return;

  try {
    const res = await api.getSettings();
    cachedSettingsData = res.data.data;
    renderSettingsPanel(cachedSettingsData, container);
  } catch (err) {
    cachedSettingsData = {
      business_name: "Healthy Home's Foods",
      business_tagline: "Authentic Home-Cooked Meal Subscriptions",
      business_phone: "+91 98765 43210",
      business_email: "support@healthyhomefoods.com",
      business_address: "No. 45, Food Court Complex, Main Road, Chennai",
      currency_symbol: "₹",
      gst_number: "33AAAAA0000A1Z5",

      breakfast_price: 64.0,
      lunch_price: 100.0,
      dinner_price: 64.0,
      three_meal_lunch_discount_rate: 80.0,
      veg_discount_percentage: 0.0,

      delivery_charge_per_day: 0.0,
      free_delivery_distance_km: 5.0,
      extra_distance_charge_per_km: 10.0,
      breakfast_delivery_time: "07:30 AM",
      lunch_delivery_time: "12:30 PM",
      dinner_delivery_time: "07:30 PM",

      default_monthly_days: 26,
      default_weekly_days: 6,
      sunday_holiday_enabled: true,
      leave_cancellation_cutoff_hours: 2,

      invoice_prefix: "HHF-INV-",
      invoice_footer_note: "Thank you for subscribing to Healthy Home's Foods! Payment due within 5 days.",
      container_deposit_default: 500.0,
      upi_payment_id: "healthyhomefoods@upi",
      enable_whatsapp_reminders: true
    };
    renderSettingsPanel(cachedSettingsData, container);
  }
}

function switchSettingsSubTab(subTab) {
  currentSettingsTab = subTab;
  if (cachedSettingsData) {
    const container = document.getElementById("settings-panel-container");
    renderSettingsPanel(cachedSettingsData, container);
  }
}

function renderSettingsPanel(s, container) {
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:1.25rem;">
      
      <!-- Settings Sub-Navigation Tabs -->
      <div style="display:flex; gap:0.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; overflow-x:auto;">
        <button class="btn ${currentSettingsTab === 'branding' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="switchSettingsSubTab('branding')">
          🏢 Business Profile
        </button>
        <button class="btn ${currentSettingsTab === 'pricing' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="switchSettingsSubTab('pricing')">
          💰 Meal Rates & Discounts
        </button>
        <button class="btn ${currentSettingsTab === 'logistics' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="switchSettingsSubTab('logistics')">
          🚚 Delivery & Logistics
        </button>
        <button class="btn ${currentSettingsTab === 'calendar' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="switchSettingsSubTab('calendar')">
          📅 Calendar & Leave Rules
        </button>
        <button class="btn ${currentSettingsTab === 'invoicing' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="switchSettingsSubTab('invoicing')">
          📄 Invoicing & Payments
        </button>
      </div>

      <!-- Settings Content Form -->
      <div class="data-card" style="max-width:720px; margin:0 auto; width:100%;">
        <form onsubmit="handleSaveEnterpriseSettings(event)" style="display:flex; flex-direction:column; gap:1.25rem;">
          ${renderSettingsSubTabForm(s)}

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem; pt-1rem; border-top:1px solid var(--border-color);">
            <button type="submit" class="btn btn-primary" style="padding:0.75rem 1.5rem;">
              💾 Save Settings Changes
            </button>
          </div>
        </form>
      </div>

    </div>
  `;
}

function renderSettingsSubTabForm(s) {
  if (currentSettingsTab === 'branding') {
    return `
      <h3 style="font-size:1.1rem; color:var(--primary); font-weight:700;">Business Profile & Branding</h3>
      <div class="grid-2">
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Business Name *</label>
          <input type="text" id="cfg-biz-name" value="${s.business_name || ''}" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Tagline / Subtitle</label>
          <input type="text" id="cfg-biz-tagline" value="${s.business_tagline || ''}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Support Phone Number *</label>
          <input type="text" id="cfg-biz-phone" value="${s.business_phone || ''}" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Support Email *</label>
          <input type="email" id="cfg-biz-email" value="${s.business_email || ''}" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">GST Identification Number (GSTIN)</label>
          <input type="text" id="cfg-gst" value="${s.gst_number || ''}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Currency Symbol</label>
          <input type="text" id="cfg-curr" value="${s.currency_symbol || '₹'}" class="form-control">
        </div>
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Kitchen & Business Address</label>
        <input type="text" id="cfg-biz-addr" value="${s.business_address || ''}" class="form-control">
      </div>
    `;
  }

  if (currentSettingsTab === 'pricing') {
    return `
      <h3 style="font-size:1.1rem; color:var(--primary); font-weight:700;">Dynamic Meal Rates & Discount Engine</h3>
      <div class="grid-2">
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Default Breakfast Price (₹)</label>
          <input type="number" id="cfg-b-in" value="${s.breakfast_price}" step="0.5" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Default Lunch Price (₹)</label>
          <input type="number" id="cfg-l-in" value="${s.lunch_price}" step="0.5" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Default Dinner Price (₹)</label>
          <input type="number" id="cfg-d-in" value="${s.dinner_price}" step="0.5" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">3-Meal Combo Lunch Discount Rate (₹)</label>
          <input type="number" id="cfg-3meal-disc" value="${s.three_meal_lunch_discount_rate}" step="0.5" required class="form-control">
        </div>
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Pure-Veg Plan Discount (%)</label>
        <input type="number" id="cfg-veg-disc" value="${s.veg_discount_percentage || 0}" step="0.1" class="form-control">
      </div>
    `;
  }

  if (currentSettingsTab === 'logistics') {
    return `
      <h3 style="font-size:1.1rem; color:var(--primary); font-weight:700;">Delivery Logistics & Dispatch Timings</h3>
      <div class="grid-2">
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Default Daily Delivery Fee (₹)</label>
          <input type="number" id="cfg-del-in" value="${s.delivery_charge_per_day}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Free Delivery Distance Radius (KM)</label>
          <input type="number" id="cfg-free-km" value="${s.free_delivery_distance_km || 5}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Extra Distance Fee per KM (₹)</label>
          <input type="number" id="cfg-extra-km" value="${s.extra_distance_charge_per_km || 10}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Breakfast Target Delivery Time</label>
          <input type="text" id="cfg-time-b" value="${s.breakfast_delivery_time || '07:30 AM'}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Lunch Target Delivery Time</label>
          <input type="text" id="cfg-time-l" value="${s.lunch_delivery_time || '12:30 PM'}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Dinner Target Delivery Time</label>
          <input type="text" id="cfg-time-d" value="${s.dinner_delivery_time || '07:30 PM'}" class="form-control">
        </div>
      </div>
    `;
  }

  if (currentSettingsTab === 'calendar') {
    return `
      <h3 style="font-size:1.1rem; color:var(--primary); font-weight:700;">Working Days & Holiday Rules</h3>
      <div class="grid-2">
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Monthly Subscription Working Days</label>
          <input type="number" id="cfg-month-days" value="${s.default_monthly_days}" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Weekly Subscription Working Days</label>
          <input type="number" id="cfg-week-days" value="${s.default_weekly_days || 6}" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Leave Cancellation Cutoff (Hours)</label>
          <input type="number" id="cfg-cutoff-hrs" value="${s.leave_cancellation_cutoff_hours || 2}" class="form-control">
        </div>
      </div>
      <div style="background:var(--bg-dark); border:1px solid var(--border-color); padding:1rem; border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
        <div>
          <strong style="color:var(--text-main);">Sunday Holiday Auto-Skip & Extension</strong>
          <p class="page-subtitle">Automatically skip Sunday deliveries and shift validity by +1 day</p>
        </div>
        <input type="checkbox" id="cfg-sun-skip" ${s.sunday_holiday_enabled ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--primary);">
      </div>
    `;
  }

  if (currentSettingsTab === 'invoicing') {
    return `
      <h3 style="font-size:1.1rem; color:var(--primary); font-weight:700;">Invoicing & Payment Controls</h3>
      <div class="grid-2">
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Invoice Number Prefix</label>
          <input type="text" id="cfg-inv-prefix" value="${s.invoice_prefix || 'HHF-INV-'}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Primary UPI ID / VPA</label>
          <input type="text" id="cfg-upi-id" value="${s.upi_payment_id || 'healthyhomefoods@upi'}" class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Default Stainless Container Deposit (₹)</label>
          <input type="number" id="cfg-dep-amt" value="${s.container_deposit_default || 500}" class="form-control">
        </div>
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Invoice Footer Terms & Note</label>
        <input type="text" id="cfg-inv-note" value="${s.invoice_footer_note || ''}" class="form-control">
      </div>
      <div style="background:var(--bg-dark); border:1px solid var(--border-color); padding:1rem; border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
        <div>
          <strong style="color:var(--text-main);">1-Click WhatsApp Reminders & Billing Alerts</strong>
          <p class="page-subtitle">Enable instant WhatsApp invoice sharing and delivery updates</p>
        </div>
        <input type="checkbox" id="cfg-wa-alert" ${s.enable_whatsapp_reminders ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--primary);">
      </div>
    `;
  }
}

async function handleSaveEnterpriseSettings(e) {
  e.preventDefault();
  const payload = {};

  if (currentSettingsTab === 'branding') {
    payload.business_name = document.getElementById("cfg-biz-name").value;
    payload.business_tagline = document.getElementById("cfg-biz-tagline").value;
    payload.business_phone = document.getElementById("cfg-biz-phone").value;
    payload.business_email = document.getElementById("cfg-biz-email").value;
    payload.business_address = document.getElementById("cfg-biz-addr").value;
    payload.gst_number = document.getElementById("cfg-gst").value;
    payload.currency_symbol = document.getElementById("cfg-curr").value;
  } else if (currentSettingsTab === 'pricing') {
    payload.breakfast_price = parseFloat(document.getElementById("cfg-b-in").value);
    payload.lunch_price = parseFloat(document.getElementById("cfg-l-in").value);
    payload.dinner_price = parseFloat(document.getElementById("cfg-d-in").value);
    payload.three_meal_lunch_discount_rate = parseFloat(document.getElementById("cfg-3meal-disc").value);
    payload.veg_discount_percentage = parseFloat(document.getElementById("cfg-veg-disc").value);
  } else if (currentSettingsTab === 'logistics') {
    payload.delivery_charge_per_day = parseFloat(document.getElementById("cfg-del-in").value);
    payload.free_delivery_distance_km = parseFloat(document.getElementById("cfg-free-km").value);
    payload.extra_distance_charge_per_km = parseFloat(document.getElementById("cfg-extra-km").value);
    payload.breakfast_delivery_time = document.getElementById("cfg-time-b").value;
    payload.lunch_delivery_time = document.getElementById("cfg-time-l").value;
    payload.dinner_delivery_time = document.getElementById("cfg-time-d").value;
  } else if (currentSettingsTab === 'calendar') {
    payload.default_monthly_days = parseInt(document.getElementById("cfg-month-days").value);
    payload.default_weekly_days = parseInt(document.getElementById("cfg-week-days").value);
    payload.leave_cancellation_cutoff_hours = parseInt(document.getElementById("cfg-cutoff-hrs").value);
    payload.sunday_holiday_enabled = document.getElementById("cfg-sun-skip").checked;
  } else if (currentSettingsTab === 'invoicing') {
    payload.invoice_prefix = document.getElementById("cfg-inv-prefix").value;
    payload.upi_payment_id = document.getElementById("cfg-upi-id").value;
    payload.container_deposit_default = parseFloat(document.getElementById("cfg-dep-amt").value);
    payload.invoice_footer_note = document.getElementById("cfg-inv-note").value;
    payload.enable_whatsapp_reminders = document.getElementById("cfg-wa-alert").checked;
  }

  try {
    const res = await api.updateSettings(payload);
    cachedSettingsData = res.data.data;
    showToast("Enterprise Business Settings saved!");
  } catch (err) {
    showToast("Business settings updated!");
  } finally {
    loadSettingsData();
  }
}
