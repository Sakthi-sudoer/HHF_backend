# Frontend AI & Developer Integration Guide

This guide enables any external developer or AI agent (building React, Flutter, Android, iOS, Vue, or Desktop frontends) to integrate seamlessly with the Food Subscription & Ledger Management System backend without seeing backend source code.

---

## 1. Base URL & Environment Setup

- **Local Base URL**: `http://localhost:8000/api/v1`
- **Network / LAN Base URL**: `http://<server-ip>:8000/api/v1`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **OpenAPI JSON Spec**: `http://localhost:8000/openapi.json`

---

## 2. Global Request & Response Envelope

Every single API request returns HTTP status code 200/201 on success or 4xx/5xx on failure, with a standard JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Human readable summary of action executed",
  "errors": []
}
```

### Standard Response Types
- `success` (`boolean`): `true` if request completed successfully, `false` otherwise.
- `data` (`object` / `array` / `null`): Standard response payload.
- `message` (`string`): Toast message or UI status text.
- `errors` (`array` of strings): Detailed validation or domain error strings.

---

## 3. Mandatory Frontend Rules (Frontend Independence)

> [!IMPORTANT]
> The backend contains 100% of the business logic.
> Frontends **MUST NEVER**:
> 1. Calculate invoice pricing or delivery charge totals.
> 2. Calculate subscription end dates or Sunday skips.
> 3. Calculate meal extensions or cancellation credits.
> 4. Calculate customer running balances or profits.
> 
> Simply render values directly from backend API responses!

---

## 4. Frontend Code Examples

### A. JavaScript / TypeScript Fetch Example (Daily Sheet & Meal Cancel)

```javascript
const BASE_URL = "http://localhost:8000/api/v1";

// 1. Fetch Today's Daily Sheet
async function getDailySheet(dateStr) {
  const response = await fetch(`${BASE_URL}/deliveries/sheet?target_date=${dateStr}`);
  const result = await response.json();
  if (result.success) {
    console.log("Daily Sheet Records:", result.data);
    return result.data;
  } else {
    alert(`Error: ${result.message}`);
  }
}

// 2. Cancel Dinner with Automatic Extension
async function cancelDinner(dateStr, customerId) {
  const response = await fetch(`${BASE_URL}/deliveries/cancel-meal?target_date=${dateStr}&customer_id=${customerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      meal_type: "dinner",
      extension_mode: "automatic"
    })
  });
  
  const result = await response.json();
  if (result.success) {
    const data = result.data;
    alert(`Dinner cancelled! Subscription extended to ${data.newSubscriptionEndDate}`);
  }
}
```

---

### B. Flutter / Dart HTTP Example (Record Payment)

```dart
import 'dart:convert';
import 'http/http.dart' as http;

Future<void> recordPayment(String customerId, double amount, String method) async {
  final url = Uri.parse('http://192.168.1.100:8000/api/v1/payments');
  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'customer_id': customerId,
      'amount': amount,
      'payment_method': method,
      'payment_date': '2026-07-25',
      'reference_number': 'UPI12345678'
    }),
  );

  final resData = jsonDecode(response.body);
  if (resData['success'] == true) {
    print('Payment Recorded: ${resData['data']['receipt_number']}');
  }
}
```

---

### C. cURL Testing Example (Dashboard Overview)

```bash
curl -X GET "http://localhost:8000/api/v1/dashboard?period=today" \
     -H "accept: application/json"
```
