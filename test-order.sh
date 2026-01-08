curl -X POST http://localhost:3000/orders \
-H "Content-Type: application/json" \
-d '{
  "user": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "orderId": "ORD-12345",
  "items": [
    {
      "productId": "PROD-001",
      "name": "Wireless Mouse",
      "quantity": 1,
      "price": 25.00
    },
    {
      "productId": "PROD-002",
      "name": "Mechanical Keyboard",
      "quantity": 1,
      "price": 85.00
    }
  ],
  "totalAmount": 110.00
}'
