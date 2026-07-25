// API Service Layer matching FastAPI PyDantic endpoints 100%
const api = {
  // Health / Dashboard
  getDashboard: async (period = "today") => {
    return await axios.get(`${getApiBase()}/dashboard?period=${period}`);
  },

  // Customers (CRM)
  listCustomers: async (query = "") => {
    return await axios.get(`${getApiBase()}/customers?query=${encodeURIComponent(query)}`);
  },
  getCustomer: async (id) => {
    return await axios.get(`${getApiBase()}/customers/${id}`);
  },
  createCustomer: async (payload) => {
    // Payload: { name, phone, address, landmark, deposit_amount }
    return await axios.post(`${getApiBase()}/customers`, payload);
  },
  updateCustomer: async (id, payload) => {
    // Payload: { name, phone, address, landmark, status }
    return await axios.put(`${getApiBase()}/customers/${id}`, payload);
  },
  archiveCustomer: async (id) => {
    return await axios.delete(`${getApiBase()}/customers/${id}`);
  },

  // Subscriptions
  createSubscription: async (payload) => {
    // Payload: { customer_id, subscription_type, start_date, meals: {breakfast, lunch, dinner}, preferences: {breakfast, lunch, dinner} }
    return await axios.post(`${getApiBase()}/subscriptions`, payload);
  },
  cancelSubscription: async (id) => {
    return await axios.delete(`${getApiBase()}/subscriptions/${id}`);
  },

  // Daily Deliveries & Leave Manager
  getDeliverySheet: async (targetDate) => {
    return await axios.get(`${getApiBase()}/deliveries/sheet?target_date=${targetDate}`);
  },
  cancelMeal: async (targetDate, customerId, payload) => {
    // Payload: { meal_type: "breakfast"|"lunch"|"dinner", extension_mode: "automatic"|"manual" }
    return await axios.post(`${getApiBase()}/deliveries/cancel-meal?target_date=${targetDate}&customer_id=${customerId}`, payload);
  },

  // Ledger & Payments
  getCustomerLedger: async (customerId) => {
    return await axios.get(`${getApiBase()}/ledger/customer/${customerId}`);
  },
  recordPayment: async (payload) => {
    // Payload: { customer_id, amount, payment_method, payment_date, reference_number, notes }
    return await axios.post(`${getApiBase()}/payments`, payload);
  },
  voidPayment: async (paymentId) => {
    return await axios.delete(`${getApiBase()}/payments/${paymentId}`);
  },

  // Expenses
  listExpenses: async () => {
    return await axios.get(`${getApiBase()}/expenses`);
  },
  createExpense: async (payload) => {
    // Payload: { date, category, amount, description, paid_to }
    return await axios.post(`${getApiBase()}/expenses`, payload);
  },
  updateExpense: async (id, payload) => {
    return await axios.put(`${getApiBase()}/expenses/${id}`, payload);
  },
  deleteExpense: async (id) => {
    return await axios.delete(`${getApiBase()}/expenses/${id}`);
  },

  // Inventory Stock
  listInventory: async () => {
    return await axios.get(`${getApiBase()}/inventory`);
  },
  createInventoryItem: async (payload) => {
    // Payload: { name, category, current_quantity, unit, min_threshold, unit_cost }
    return await axios.post(`${getApiBase()}/inventory`, payload);
  },
  updateInventoryItem: async (id, payload) => {
    return await axios.put(`${getApiBase()}/inventory/${id}`, payload);
  },
  deleteInventoryItem: async (id) => {
    return await axios.delete(`${getApiBase()}/inventory/${id}`);
  },

  // Settings
  getSettings: async () => {
    return await axios.get(`${getApiBase()}/settings`);
  },
  updateSettings: async (payload) => {
    return await axios.put(`${getApiBase()}/settings`, payload);
  }
};
