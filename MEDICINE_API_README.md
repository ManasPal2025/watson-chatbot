# 🏥 Medicine API for IBM Watson Webhook Integration

This API provides medicine information that can be integrated with IBM Watson Assistant through REST webhook calls.

## 📊 Data Structure

The API contains 5 medicines with the following structure:

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique identifier | 1, 2, 3, 4, 5 |
| `medicine_name` | Generic name of medicine | "Paracetamol", "Ibuprofen" |
| `medicine_brand` | Brand name | "Tylenol", "Advil" |
| `dosage_usage` | Dosage instructions | "500-1000mg every 4-6 hours" |

## 🚀 Available Endpoints

### 1. Get All Medicines
```
GET /api/medicines
```

**Response:**
```json
{
  "success": true,
  "message": "Medicines retrieved successfully",
  "data": [
    {
      "id": 1,
      "medicine_name": "Paracetamol",
      "medicine_brand": "Tylenol",
      "dosage_usage": "500-1000mg every 4-6 hours as needed for pain/fever"
    },
    // ... more medicines
  ],
  "total_count": 5
}
```

### 2. Get Medicine by ID
```
GET /api/medicines/:id
```

**Example:** `GET /api/medicines/1`

**Response:**
```json
{
  "success": true,
  "message": "Medicine retrieved successfully",
  "data": {
    "id": 1,
    "medicine_name": "Paracetamol",
    "medicine_brand": "Tylenol",
    "dosage_usage": "500-1000mg every 4-6 hours as needed for pain/fever"
  }
}
```

### 3. Search Medicines
```
POST /api/medicines/search
```

**Request Body:**
```json
{
  "query": "paracetamol"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "query": "paracetamol",
  "results_count": 1,
  "data": [
    {
      "id": 1,
      "medicine_name": "Paracetamol",
      "medicine_brand": "Tylenol",
      "dosage_usage": "500-1000mg every 4-6 hours as needed for pain/fever"
    }
  ]
}
```

### 4. Get Medicine Recommendations
```
GET /api/medicines/recommend/:condition
```

**Available conditions:**
- `pain` or `fever` - Returns Paracetamol and Ibuprofen
- `acid reflux` or `heartburn` - Returns Omeprazole
- `diabetes` - Returns Metformin
- `hypertension` or `high blood pressure` - Returns Amlodipine

**Example:** `GET /api/medicines/recommend/pain`

**Response:**
```json
{
  "success": true,
  "message": "Recommendations for pain",
  "condition": "pain",
  "recommendations_count": 2,
  "data": [
    {
      "id": 1,
      "medicine_name": "Paracetamol",
      "medicine_brand": "Tylenol",
      "dosage_usage": "500-1000mg every 4-6 hours as needed for pain/fever"
    },
    {
      "id": 2,
      "medicine_name": "Ibuprofen",
      "medicine_brand": "Advil",
      "dosage_usage": "200-400mg every 4-6 hours, max 1200mg per day"
    }
  ]
}
```

## 🤖 IBM Watson Integration

### Setting up Webhook in Watson Assistant

1. **Go to your Watson Assistant instance**
2. **Navigate to Actions** (or Skills in older versions)
3. **Create a new action or edit existing one**
4. **Add a webhook step** with the following configuration:

#### Webhook Configuration:
- **URL:** `http://localhost:3000/api/medicines/search`
- **Method:** `POST`
- **Headers:** 
  ```
  Content-Type: application/json
  ```
- **Body:** 
  ```json
  {
    "query": "{{input.text}}"
  }
  ```

#### Example Watson Assistant Action:
```
When user asks about medicines:
1. Call webhook: POST /api/medicines/search
2. Extract medicine information from response
3. Display medicine details to user
```

### Sample Watson Assistant Response Handling

```javascript
// In Watson Assistant webhook response handling
if (webhook_response.success) {
    const medicines = webhook_response.data;
    let response = "Here are the medicines I found:\n\n";
    
    medicines.forEach(med => {
        response += `💊 **${med.medicine_name}** (${med.medicine_brand})\n`;
        response += `📋 Dosage: ${med.dosage_usage}\n\n`;
    });
    
    return response;
} else {
    return "Sorry, I couldn't find any medicines matching your query.";
}
```

## 🧪 Testing the API

### 1. Using the Test Interface
Open `test_medicine_api.html` in your browser to test all endpoints interactively.

### 2. Using cURL

```bash
# Get all medicines
curl http://localhost:3000/api/medicines

# Get medicine by ID
curl http://localhost:3000/api/medicines/1

# Search medicines
curl -X POST http://localhost:3000/api/medicines/search \
  -H "Content-Type: application/json" \
  -d '{"query": "paracetamol"}'

# Get recommendations
curl http://localhost:3000/api/medicines/recommend/pain
```

### 3. Using Postman
Import these requests into Postman:

1. **Get All Medicines**
   - Method: GET
   - URL: `http://localhost:3000/api/medicines`

2. **Search Medicines**
   - Method: POST
   - URL: `http://localhost:3000/api/medicines/search`
   - Headers: `Content-Type: application/json`
   - Body: `{"query": "paracetamol"}`

## 📋 Sample Medicine Data

| ID | Medicine Name | Brand | Dosage Usage |
|----|---------------|-------|--------------|
| 1 | Paracetamol | Tylenol | 500-1000mg every 4-6 hours as needed for pain/fever |
| 2 | Ibuprofen | Advil | 200-400mg every 4-6 hours, max 1200mg per day |
| 3 | Omeprazole | Prilosec | 20mg once daily before breakfast for acid reflux |
| 4 | Metformin | Glucophage | 500mg twice daily with meals for diabetes management |
| 5 | Amlodipine | Norvasc | 5-10mg once daily for high blood pressure |

## 🔧 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `404` - Medicine not found
- `500` - Server error

## 🚀 Getting Started

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test the API:**
   - Open `http://localhost:3000/test_medicine_api.html`
   - Or use cURL/Postman with the examples above

3. **Integrate with Watson:**
   - Configure webhook in Watson Assistant
   - Use the endpoints in your conversation flows

## 📝 Notes

- The API runs on `http://localhost:3000`
- All responses are in JSON format
- The API is stateless and doesn't require authentication
- Data is stored in memory (resets on server restart)
- Perfect for testing and development purposes

## 🔗 Related Files

- `server.js` - Main server with API endpoints
- `test_medicine_api.html` - Interactive test interface
- `config.js` - Configuration file
- `package.json` - Dependencies and scripts 