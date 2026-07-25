# Frontend Integration Code Examples (Including Edit & Delete Operations)

This document provides copy-paste ready code examples for connecting React, JavaScript/TypeScript, Flutter, and Axios applications to the backend API.

---

## 1. JavaScript / React (Native Fetch API)

### A. Edit Customer Details (`PUT`)
```typescript
const BASE_URL = "http://localhost:8001/api/v1";

export async function updateCustomer(customerId: string, payload: {
  name?: string;
  phone?: string;
  address?: string;
  landmark?: string;
  status?: "active" | "paused" | "archived";
}) {
  const response = await fetch(`${BASE_URL}/customers/${customerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return await response.json();
}
```

### B. Archive Customer (Soft Delete `DELETE`)
```typescript
export async function archiveCustomer(customerId: string) {
  const response = await fetch(`${BASE_URL}/customers/${customerId}`, {
    method: "DELETE"
  });
  return await response.json();
}
```

### C. Edit Operational Expense (`PUT`)
```typescript
export async function updateExpense(expenseId: string, payload: {
  date: string;
  category: string;
  amount: number;
  description: string;
  paid_to?: string;
}) {
  const response = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return await response.json();
}
```

### D. Delete Operational Expense (Soft Delete `DELETE`)
```typescript
export async function deleteExpense(expenseId: string) {
  const response = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
    method: "DELETE"
  });
  return await response.json();
}
```

### E. Void Payment (`DELETE`)
```typescript
export async function voidPayment(paymentId: string) {
  const response = await fetch(`${BASE_URL}/payments/${paymentId}`, {
    method: "DELETE"
  });
  return await response.json();
}
```

---

## 2. Flutter / Dart HTTP Client (Edit & Delete)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = "http://10.0.2.2:8001/api/v1"; // 10.0.2.2 for Android Emulator

  // 1. Edit Customer (PUT)
  static Future<bool> updateCustomer(String customerId, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/customers/$customerId'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return response.statusCode == 200;
  }

  // 2. Soft Delete Customer (DELETE)
  static Future<bool> archiveCustomer(String customerId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/customers/$customerId'),
    );
    return response.statusCode == 200;
  }
}
```
