# 👨‍⚕️ Doctors API for IBM Watson Webhook Integration

This API provides doctor information that can be integrated with IBM Watson Assistant through REST webhook calls.

## 📊 Data Structure

The API contains 12 doctors with the following structure:

| Column | Description | Example |
|--------|-------------|---------|
| `id` | Unique identifier | 1, 2, 3, ..., 12 |
| `doctor_name` | Full name of doctor | "Dr. Sarah Johnson" |
| `doctor_type` | Medical specialty | "cardiologist", "neurologist", "family physician", "dermatologist" |
| `email` | Contact email | "sarah.johnson@heartcare.com" |
| `location` | Office address | "123 Heart Center, Downtown Medical Plaza, Floor 3" |
| `available` | Availability status | true/false |

## 🏥 Doctor Distribution

**12 Doctors across 4 specialties (3 doctors each):**

### Cardiologists (3 doctors)
- Dr. Sarah Johnson - Available
- Dr. Michael Chen - Unavailable  
- Dr. Emily Rodriguez - Available

### Neurologists (3 doctors)
- Dr. James Wilson - Available
- Dr. Lisa Thompson - Available
- Dr. Robert Kim - Unavailable

### Family Physicians (3 doctors)
- Dr. Jennifer Davis - Available
- Dr. David Martinez - Available
- Dr. Amanda Foster - Unavailable

### Dermatologists (3 doctors)
- Dr. Christopher Lee - Available
- Dr. Rachel Green - Available
- Dr. Thomas Brown - Unavailable

## 🚀 Available Endpoints

### 1. Get All Doctors
```
GET /api/doctors
```

**Response:**
```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "id": 1,
      "doctor_name": "Dr. Sarah Johnson",
      "doctor_type": "cardiologist",
      "email": "sarah.johnson@heartcare.com",
      "location": "123 Heart Center, Downtown Medical Plaza, Floor 3",
      "available": true
    },
    // ... more doctors
  ],
  "total_count": 12
}
```

### 2. Get Doctor by ID
```
GET /api/doctors/:id
```

**Example:** `GET /api/doctors/1`

**Response:**
```json
{
  "success": true,
  "message": "Doctor retrieved successfully",
  "data": {
    "id": 1,
    "doctor_name": "Dr. Sarah Johnson",
    "doctor_type": "cardiologist",
    "email": "sarah.johnson@heartcare.com",
    "location": "123 Heart Center, Downtown Medical Plaza, Floor 3",
    "available": true
  }
}
```

### 3. Search Doctors
```
POST /api/doctors/search
```

**Request Body:**
```json
{
  "query": "cardiologist",
  "doctor_type": "cardiologist",
  "available": true,
  "location": "downtown"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "query": "cardiologist",
  "filters": {
    "doctor_type": "cardiologist",
    "available": true,
    "location": "downtown"
  },
  "results_count": 1,
  "data": [
    {
      "id": 1,
      "doctor_name": "Dr. Sarah Johnson",
      "doctor_type": "cardiologist",
      "email": "sarah.johnson@heartcare.com",
      "location": "123 Heart Center, Downtown Medical Plaza, Floor 3",
      "available": true
    }
  ]
}
```

### 4. Get Doctors by Type
```
GET /api/doctors/type/:type
```

**Available types:** `cardiologist`, `neurologist`, `family physician`, `dermatologist`

**Example:** `GET /api/doctors/type/cardiologist`

**Response:**
```json
{
  "success": true,
  "message": "Doctors of type 'cardiologist' retrieved successfully",
  "doctor_type": "cardiologist",
  "results_count": 3,
  "data": [
    // 3 cardiologists
  ]
}
```

### 5. Get Available/Unavailable Doctors
```
GET /api/doctors/available/:status
```

**Available statuses:** `available`, `unavailable`, `true`, `false`

**Example:** `GET /api/doctors/available/available`

**Response:**
```json
{
  "success": true,
  "message": "Available doctors retrieved successfully",
  "available": true,
  "results_count": 9,
  "data": [
    // 9 available doctors
  ]
}
```

### 6. Get Doctor Recommendations
```
GET /api/doctors/recommend/:specialty
```

**Available specialties:**
- `heart`, `cardiac`, `cardiovascular` - Returns available cardiologists
- `brain`, `neurological`, `nervous system` - Returns available neurologists
- `general`, `primary`, `family` - Returns available family physicians
- `skin`, `dermatological`, `dermatology` - Returns available dermatologists

**Example:** `GET /api/doctors/recommend/heart`

**Response:**
```json
{
  "success": true,
  "message": "Recommendations for heart",
  "specialty": "heart",
  "recommendations_count": 2,
  "data": [
    {
      "id": 1,
      "doctor_name": "Dr. Sarah Johnson",
      "doctor_type": "cardiologist",
      "email": "sarah.johnson@heartcare.com",
      "location": "123 Heart Center, Downtown Medical Plaza, Floor 3",
      "available": true
    },
    {
      "id": 3,
      "doctor_name": "Dr. Emily Rodriguez",
      "doctor_type": "cardiologist",
      "email": "emily.rodriguez@hearthealth.com",
      "location": "789 Cardiac Care Center, Eastside Hospital, Suite 205",
      "available": true
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
- **URL:** `http://localhost:3000/api/doctors/search`
- **Method:** `POST`
- **Headers:** 
  ```
  Content-Type: application/json
  ```
- **Body:** 
  ```json
  {
    "query": "{{input.text}}",
    "doctor_type": "{{context.doctor_type}}",
    "available": true
  }
  ```

#### Example Watson Assistant Action:
```
When user asks about doctors:
1. Extract doctor type from user input
2. Call webhook: POST /api/doctors/search
3. Extract doctor information from response
4. Display doctor details to user
```

### Sample Watson Assistant Response Handling

```javascript
// In Watson Assistant webhook response handling
if (webhook_response.success) {
    const doctors = webhook_response.data;
    let response = "Here are the doctors I found:\n\n";
    
    doctors.forEach(doctor => {
        const status = doctor.available ? "✅ Available" : "❌ Unavailable";
        response += `👨‍⚕️ **${doctor.doctor_name}** (${doctor.doctor_type})\n`;
        response += `📧 Email: ${doctor.email}\n`;
        response += `📍 Location: ${doctor.location}\n`;
        response += `📊 Status: ${status}\n\n`;
    });
    
    return response;
} else {
    return "Sorry, I couldn't find any doctors matching your criteria.";
}
```

## 🧪 Testing the API

### 1. Using the Test Interface
Open `test_doctors_api.html` in your browser to test all endpoints interactively.

### 2. Using cURL

```bash
# Get all doctors
curl http://localhost:3000/api/doctors

# Get doctor by ID
curl http://localhost:3000/api/doctors/1

# Search doctors
curl -X POST http://localhost:3000/api/doctors/search \
  -H "Content-Type: application/json" \
  -d '{"query": "cardiologist", "available": true}'

# Get doctors by type
curl http://localhost:3000/api/doctors/type/cardiologist

# Get available doctors
curl http://localhost:3000/api/doctors/available/available

# Get recommendations
curl http://localhost:3000/api/doctors/recommend/heart
```

### 3. Using Postman
Import these requests into Postman:

1. **Get All Doctors**
   - Method: GET
   - URL: `http://localhost:3000/api/doctors`

2. **Search Doctors**
   - Method: POST
   - URL: `http://localhost:3000/api/doctors/search`
   - Headers: `Content-Type: application/json`
   - Body: `{"query": "cardiologist", "available": true}`

3. **Get Doctors by Type**
   - Method: GET
   - URL: `http://localhost:3000/api/doctors/type/cardiologist`

## 📋 Sample Doctor Data

| ID | Doctor Name | Type | Email | Location | Available |
|----|-------------|------|-------|----------|-----------|
| 1 | Dr. Sarah Johnson | Cardiologist | sarah.johnson@heartcare.com | 123 Heart Center, Downtown Medical Plaza, Floor 3 | ✅ |
| 2 | Dr. Michael Chen | Cardiologist | michael.chen@cardiologyassociates.com | 456 Cardiovascular Institute, Westside Medical Complex | ❌ |
| 3 | Dr. Emily Rodriguez | Cardiologist | emily.rodriguez@hearthealth.com | 789 Cardiac Care Center, Eastside Hospital, Suite 205 | ✅ |
| 4 | Dr. James Wilson | Neurologist | james.wilson@neurocare.com | 321 Neurology Center, Brain & Spine Institute, Floor 2 | ✅ |
| 5 | Dr. Lisa Thompson | Neurologist | lisa.thompson@neurospecialists.com | 654 Neurological Associates, Central Medical Tower | ✅ |
| 6 | Dr. Robert Kim | Neurologist | robert.kim@brainhealth.com | 987 Neurology Clinic, Northside Medical Center, Suite 401 | ❌ |
| 7 | Dr. Jennifer Davis | Family Physician | jennifer.davis@familycare.com | 147 Family Medicine Center, Community Health Plaza | ✅ |
| 8 | Dr. David Martinez | Family Physician | david.martinez@primarycare.com | 258 Primary Care Associates, Wellness Medical Center | ✅ |
| 9 | Dr. Amanda Foster | Family Physician | amanda.foster@familyhealth.com | 369 Family Health Clinic, Downtown Medical Center, Floor 1 | ❌ |
| 10 | Dr. Christopher Lee | Dermatologist | christopher.lee@skincare.com | 741 Dermatology Center, Skin & Beauty Institute | ✅ |
| 11 | Dr. Rachel Green | Dermatologist | rachel.green@dermspecialists.com | 852 Skin Care Associates, Medical Arts Building, Suite 301 | ✅ |
| 12 | Dr. Thomas Brown | Dermatologist | thomas.brown@dermatology.com | 963 Dermatology Clinic, Westside Medical Plaza, Floor 4 | ❌ |

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
- `404` - Doctor not found
- `400` - Invalid parameters
- `500` - Server error

## 🚀 Getting Started

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test the API:**
   - Open `http://localhost:3000/test_doctors_api.html`
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
- 9 doctors are available, 3 are unavailable
- Each specialty has at least 2 available doctors

## 🔗 Related Files

- `server.js` - Main server with API endpoints
- `test_doctors_api.html` - Interactive test interface
- `config.js` - Configuration file
- `package.json` - Dependencies and scripts 