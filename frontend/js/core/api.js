// Axios API Service Client connecting to FastAPI backend
const api = {
  getDashboard: async (period = "today") => {
    return await axios.get(`${getApiBase()}/dashboard?period=${period}`);
  },

  listCustomers: async (query = "") => {
    return await axios.get(`${getApiBase()}/customers?query=${encodeURIComponent(query)}`);
  },
  createCustomer: async (payload) => {
    return await axios.post(`${getApiBase()}/customers`, payload);
  },
  updateCustomer: async (id, payload) => {
    return await axios.put(`${getApiBase()}/customers/${id}`, payload);
  },
  archiveCustomer: async (id) => {
    return await axios.delete(`${getApiBase()}/customers/${id}`);
  },

  createSubscription: async (payload) => {
    return await axios.post(`${getApiBase()}/subscriptions`, payload);
  },
  cancelSubscription: async (id) => {
    return await axios.delete(`${getApiBase()}/subscriptions/${id}`);
  },

  getDeliverySheet: async (targetDate) => {
    return await axios.get(`${getApiBase()}/deliveries/sheet?target_date=${targetDate}`);
  },
  cancelMeal: async (targetDate, customerId, payload) => {
    return await axios.post(`${getApiBase()}/deliveries/cancel-meal?target_date=${targetDate}&customer_id=${customerId}`, payload);
  },

  getCustomerLedger: async (customerId) => {
    return await axios.get(`${getApiBase()}/ledger/customer/${customerId}`);
  },
  recordPayment: async (payload) => {
    return await axios.post(`${getApiBase()}/payments`, payload);
  },
  voidPayment: async (paymentId) => {
    return await axios.delete(`${getApiBase()}/payments/${paymentId}`);
  },

  listExpenses: async () => {
    return await axios.get(`${getApiBase()}/expenses`);
  },
  createExpense: async (payload) => {
    return await axios.post(`${getApiBase()}/expenses`, payload);
  },
  updateExpense: async (id, payload) => {
    return await axios.put(`${getApiBase()}/expenses/${id}`, payload);
  },
  deleteExpense: async (id) => {
    return await axios.delete(`${getApiBase()}/expenses/${id}`);
  },

  listInventory: async () => {
    return await axios.get(`${getApiBase()}/inventory`);
  },
  createInventoryItem: async (payload) => {
    return await axios.post(`${getApiBase()}/inventory`, payload);
  },
  updateInventoryItem: async (id, payload) => {
    return await axios.put(`${getApiBase()}/inventory/${id}`, payload);
  },
  deleteInventoryItem: async (id) => {
    return await axios.delete(`${getApiBase()}/inventory/${id}`);
  }
};
