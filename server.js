const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const config = require('./config');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images, PDFs, documents, and text files
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, documents, and text files are allowed.'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Watsonx Assistant v5 API configuration
const watsonConfig = {
  assistantId: config.WATSON_ASSISTANT_ID,
  apiKey: config.WATSON_API_KEY,
  serviceUrl: config.WATSON_SERVICE_URL,
  instanceId: config.WATSON_INSTANCE_ID
};

// Store sessions and IAM token (in production, use a proper database)
const sessions = new Map();
let iamToken = null;
let tokenExpiry = null;

// Function to get IAM token
async function getIAMToken() {
  // Check if we have a valid token
  if (iamToken && tokenExpiry && Date.now() < tokenExpiry) {
    return iamToken;
  }
  
  try {
    const response = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${watsonConfig.apiKey}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    iamToken = response.data.access_token;
    // Set expiry to 50 minutes (tokens typically last 1 hour)
    tokenExpiry = Date.now() + (50 * 60 * 1000);
    
    console.log('IAM Token obtained successfully');
    return iamToken;
  } catch (error) {
    console.error('Error getting IAM token:', error.response?.data || error.message);
    throw error;
  }
}

// Create session endpoint for Watsonx Assistant v5
app.post('/api/session', async (req, res) => {
  try {
    console.log('Creating session with Watsonx Assistant v5...');
    
    const token = await getIAMToken();
    
    const response = await axios.post(
      `${watsonConfig.serviceUrl}/instances/${watsonConfig.instanceId}/v2/assistants/${watsonConfig.assistantId}/sessions?version=2023-06-15`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const sessionId = response.data.session_id;
    sessions.set(sessionId, { created: new Date() });
    
    console.log('Session created successfully:', sessionId);
    res.json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Authentication failed. Please check your API key and Assistant ID.',
        details: error.response.data
      });
    } else if (error.response?.status === 404) {
      res.status(404).json({ 
        error: 'Assistant not found. Please check your Assistant ID and Instance ID.',
        details: error.response.data
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create session',
        details: error.response?.data || error.message
      });
    }
  }
});

// Send message endpoint for Watsonx Assistant v5
app.post('/api/message', upload.single('file'), async (req, res) => {
  const { sessionId, message } = req.body;
  const uploadedFile = req.file;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  if (!message && !uploadedFile) {
    return res.status(400).json({ error: 'Message or file is required' });
  }
  
  try {
    const token = await getIAMToken();
    
    // Prepare the message text
    let messageText = message || '';
    
    // If a file was uploaded, add file information to the message
    if (uploadedFile) {
      const fileInfo = `[File uploaded: ${uploadedFile.originalname} (${formatFileSize(uploadedFile.size)})]`;
      messageText = messageText ? `${messageText}\n\n${fileInfo}` : fileInfo;
      
      // For now, we'll just send the file info as text
      // In a production environment, you might want to:
      // 1. Upload the file to cloud storage
      // 2. Use Watson's file handling capabilities if available
      // 3. Process the file content and extract text
    }
    
    const response = await axios.post(
      `${watsonConfig.serviceUrl}/instances/${watsonConfig.instanceId}/v2/assistants/${watsonConfig.assistantId}/sessions/${sessionId}/message?version=2023-06-15`,
      {
        input: {
          message_type: 'text',
          text: messageText
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const watsonResponse = response.data;
    
    // Return the full response structure for the frontend to process
    res.json({
      response: watsonResponse,
      sessionId: sessionId,
      fileUploaded: !!uploadedFile,
      fileName: uploadedFile ? uploadedFile.originalname : null
    });
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    
    // Clean up uploaded file if there was an error
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }
    
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Cleanup function to remove old uploaded files
function cleanupOldFiles() {
  const uploadDir = 'uploads/';
  if (!fs.existsSync(uploadDir)) return;
  
  const files = fs.readdirSync(uploadDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  files.forEach(file => {
    const filePath = path.join(uploadDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    }
  });
}

// Delete session endpoint for Watsonx Assistant v5
app.delete('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const token = await getIAMToken();
    
    await axios.delete(
      `${watsonConfig.serviceUrl}/instances/${watsonConfig.instanceId}/v2/assistants/${watsonConfig.assistantId}/sessions/${sessionId}?version=2023-06-15`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      }
    );
    
    sessions.delete(sessionId);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Dummy Medicine API for Watson Webhook Integration
const medicineData = [
    {
        id: 1,
        medicine_name: "Paracetamol",
        medicine_brand: "Tylenol",
        dosage_usage: "500-1000mg every 4-6 hours as needed for pain/fever"
    },
    {
        id: 2,
        medicine_name: "Ibuprofen",
        medicine_brand: "Advil",
        dosage_usage: "200-400mg every 4-6 hours, max 1200mg per day"
    },
    {
        id: 3,
        medicine_name: "Omeprazole",
        medicine_brand: "Prilosec",
        dosage_usage: "20mg once daily before breakfast for acid reflux"
    },
    {
        id: 4,
        medicine_name: "Metformin",
        medicine_brand: "Glucophage",
        dosage_usage: "500mg twice daily with meals for diabetes management"
    },
    {
        id: 5,
        medicine_name: "Amlodipine",
        medicine_brand: "Norvasc",
        dosage_usage: "5-10mg once daily for high blood pressure"
    }
];

// GET endpoint to retrieve all medicines
app.get('/api/medicines', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Medicines retrieved successfully',
            data: medicineData,
            total_count: medicineData.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving medicines',
            error: error.message
        });
    }
});

// GET endpoint to retrieve medicine by ID
app.get('/api/medicines/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const medicine = medicineData.find(med => med.id === id);
        
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found',
                requested_id: id
            });
        }
        
        res.json({
            success: true,
            message: 'Medicine retrieved successfully',
            data: medicine
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving medicine',
            error: error.message
        });
    }
});

// POST endpoint for Watson webhook integration
app.post('/api/medicines/search', (req, res) => {
    try {
        const { query, medicine_name, medicine_brand, dosage_usage } = req.body;
        
        let results = medicineData;
        
        // Filter by medicine name if provided
        if (medicine_name) {
            results = results.filter(med => 
                med.medicine_name.toLowerCase().includes(medicine_name.toLowerCase())
            );
        }
        
        // Filter by brand if provided
        if (medicine_brand) {
            results = results.filter(med => 
                med.medicine_brand.toLowerCase().includes(medicine_brand.toLowerCase())
            );
        }
        
        // Filter by dosage usage if provided
        if (dosage_usage) {
            results = results.filter(med => 
                med.dosage_usage.toLowerCase().includes(dosage_usage.toLowerCase())
            );
        }
        
        // General search query
        if (query) {
            results = results.filter(med => 
                med.medicine_name.toLowerCase().includes(query.toLowerCase()) ||
                med.medicine_brand.toLowerCase().includes(query.toLowerCase()) ||
                med.dosage_usage.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        res.json({
            success: true,
            message: 'Search completed successfully',
            query: query || 'All medicines',
            results_count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching medicines',
            error: error.message
        });
    }
});

// GET endpoint for specific medicine recommendations
app.get('/api/medicines/recommend/:condition', (req, res) => {
    try {
        const condition = req.params.condition.toLowerCase();
        let recommendations = [];
        
        switch (condition) {
            case 'pain':
            case 'fever':
                recommendations = medicineData.filter(med => 
                    med.medicine_name.toLowerCase().includes('paracetamol') ||
                    med.medicine_name.toLowerCase().includes('ibuprofen')
                );
                break;
            case 'acid reflux':
            case 'heartburn':
                recommendations = medicineData.filter(med => 
                    med.medicine_name.toLowerCase().includes('omeprazole')
                );
                break;
            case 'diabetes':
                recommendations = medicineData.filter(med => 
                    med.medicine_name.toLowerCase().includes('metformin')
                );
                break;
            case 'hypertension':
            case 'high blood pressure':
                recommendations = medicineData.filter(med => 
                    med.medicine_name.toLowerCase().includes('amlodipine')
                );
                break;
            default:
                recommendations = medicineData;
        }
        
        res.json({
            success: true,
            message: `Recommendations for ${condition}`,
            condition: condition,
            recommendations_count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting recommendations',
            error: error.message
        });
    }
});

// Dummy Doctors API for Watson Webhook Integration
const doctorsData = [
    // Cardiologists (3 doctors)
    {
        id: 1,
        doctor_name: "Dr. Sarah Johnson",
        doctor_type: "cardiologist",
        email: "sarah.johnson@heartcare.com",
        location: "123 Heart Center, Downtown Medical Plaza, Floor 3",
        available: true
    },
    {
        id: 2,
        doctor_name: "Dr. Michael Chen",
        doctor_type: "cardiologist",
        email: "michael.chen@cardiologyassociates.com",
        location: "456 Cardiovascular Institute, Westside Medical Complex",
        available: false
    },
    {
        id: 3,
        doctor_name: "Dr. Emily Rodriguez",
        doctor_type: "cardiologist",
        email: "emily.rodriguez@hearthealth.com",
        location: "789 Cardiac Care Center, Eastside Hospital, Suite 205",
        available: true
    },
    
    // Neurologists (3 doctors)
    {
        id: 4,
        doctor_name: "Dr. James Wilson",
        doctor_type: "neurologist",
        email: "james.wilson@neurocare.com",
        location: "321 Neurology Center, Brain & Spine Institute, Floor 2",
        available: true
    },
    {
        id: 5,
        doctor_name: "Dr. Lisa Thompson",
        doctor_type: "neurologist",
        email: "lisa.thompson@neurospecialists.com",
        location: "654 Neurological Associates, Central Medical Tower",
        available: true
    },
    {
        id: 6,
        doctor_name: "Dr. Robert Kim",
        doctor_type: "neurologist",
        email: "robert.kim@brainhealth.com",
        location: "987 Neurology Clinic, Northside Medical Center, Suite 401",
        available: false
    },
    
    // Family Physicians (3 doctors)
    {
        id: 7,
        doctor_name: "Dr. Jennifer Davis",
        doctor_type: "family physician",
        email: "jennifer.davis@familycare.com",
        location: "147 Family Medicine Center, Community Health Plaza",
        available: true
    },
    {
        id: 8,
        doctor_name: "Dr. David Martinez",
        doctor_type: "family physician",
        email: "david.martinez@primarycare.com",
        location: "258 Primary Care Associates, Wellness Medical Center",
        available: true
    },
    {
        id: 9,
        doctor_name: "Dr. Amanda Foster",
        doctor_type: "family physician",
        email: "amanda.foster@familyhealth.com",
        location: "369 Family Health Clinic, Downtown Medical Center, Floor 1",
        available: false
    },
    
    // Dermatologists (3 doctors)
    {
        id: 10,
        doctor_name: "Dr. Christopher Lee",
        doctor_type: "dermatologist",
        email: "christopher.lee@skincare.com",
        location: "741 Dermatology Center, Skin & Beauty Institute",
        available: true
    },
    {
        id: 11,
        doctor_name: "Dr. Rachel Green",
        doctor_type: "dermatologist",
        email: "rachel.green@dermspecialists.com",
        location: "852 Skin Care Associates, Medical Arts Building, Suite 301",
        available: true
    },
    {
        id: 12,
        doctor_name: "Dr. Thomas Brown",
        doctor_type: "dermatologist",
        email: "thomas.brown@dermatology.com",
        location: "963 Dermatology Clinic, Westside Medical Plaza, Floor 4",
        available: false
    }
];

// GET endpoint to retrieve all doctors
app.get('/api/doctors', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Doctors retrieved successfully',
            data: doctorsData,
            total_count: doctorsData.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving doctors',
            error: error.message
        });
    }
});

// GET endpoint to retrieve doctor by ID
app.get('/api/doctors/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const doctor = doctorsData.find(doc => doc.id === id);
        
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
                requested_id: id
            });
        }
        
        res.json({
            success: true,
            message: 'Doctor retrieved successfully',
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving doctor',
            error: error.message
        });
    }
});

// POST endpoint for Watson webhook integration - search doctors
app.post('/api/doctors/search', (req, res) => {
    try {
        const { query, doctor_type, available, location } = req.body;
        
        let results = doctorsData;
        
        // Filter by doctor type if provided
        if (doctor_type) {
            results = results.filter(doc => 
                doc.doctor_type.toLowerCase().includes(doctor_type.toLowerCase())
            );
        }
        
        // Filter by availability if provided
        if (available !== undefined) {
            results = results.filter(doc => doc.available === available);
        }
        
        // Filter by location if provided
        if (location) {
            results = results.filter(doc => 
                doc.location.toLowerCase().includes(location.toLowerCase())
            );
        }
        
        // General search query
        if (query) {
            results = results.filter(doc => 
                doc.doctor_name.toLowerCase().includes(query.toLowerCase()) ||
                doc.doctor_type.toLowerCase().includes(query.toLowerCase()) ||
                doc.email.toLowerCase().includes(query.toLowerCase()) ||
                doc.location.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        res.json({
            success: true,
            message: 'Search completed successfully',
            query: query || 'All doctors',
            filters: { doctor_type, available, location },
            results_count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching doctors',
            error: error.message
        });
    }
});

// GET endpoint to get doctors by type
app.get('/api/doctors/type/:type', (req, res) => {
    try {
        const type = req.params.type.toLowerCase();
        const doctors = doctorsData.filter(doc => 
            doc.doctor_type.toLowerCase() === type
        );
        
        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No doctors found for this type',
                requested_type: type,
                available_types: [...new Set(doctorsData.map(doc => doc.doctor_type))]
            });
        }
        
        res.json({
            success: true,
            message: `Doctors of type '${type}' retrieved successfully`,
            doctor_type: type,
            results_count: doctors.length,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving doctors by type',
            error: error.message
        });
    }
});

// GET endpoint to get available doctors
app.get('/api/doctors/available/:status', (req, res) => {
    try {
        const status = req.params.status.toLowerCase();
        let available;
        
        if (status === 'true' || status === 'available') {
            available = true;
        } else if (status === 'false' || status === 'unavailable') {
            available = false;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid status parameter. Use "available", "unavailable", "true", or "false"'
            });
        }
        
        const doctors = doctorsData.filter(doc => doc.available === available);
        
        res.json({
            success: true,
            message: `${available ? 'Available' : 'Unavailable'} doctors retrieved successfully`,
            available: available,
            results_count: doctors.length,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving doctors by availability',
            error: error.message
        });
    }
});

// GET endpoint for doctor recommendations by specialty
app.get('/api/doctors/recommend/:specialty', (req, res) => {
    try {
        const specialty = req.params.specialty.toLowerCase();
        let recommendations = [];
        
        switch (specialty) {
            case 'heart':
            case 'cardiac':
            case 'cardiovascular':
                recommendations = doctorsData.filter(doc => 
                    doc.doctor_type === 'cardiologist' && doc.available
                );
                break;
            case 'brain':
            case 'neurological':
            case 'nervous system':
                recommendations = doctorsData.filter(doc => 
                    doc.doctor_type === 'neurologist' && doc.available
                );
                break;
            case 'general':
            case 'primary':
            case 'family':
                recommendations = doctorsData.filter(doc => 
                    doc.doctor_type === 'family physician' && doc.available
                );
                break;
            case 'skin':
            case 'dermatological':
            case 'dermatology':
                recommendations = doctorsData.filter(doc => 
                    doc.doctor_type === 'dermatologist' && doc.available
                );
                break;
            default:
                recommendations = doctorsData.filter(doc => doc.available);
        }
        
        res.json({
            success: true,
            message: `Recommendations for ${specialty}`,
            specialty: specialty,
            recommendations_count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting doctor recommendations',
            error: error.message
        });
    }
});

// Privacy Notice Route
app.get('/privacy', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Privacy Notice - SymptomSolver</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #667eea;
                    text-align: center;
                    margin-bottom: 30px;
                }
                h2 {
                    color: #333;
                    margin-top: 30px;
                    margin-bottom: 15px;
                }
                p {
                    margin-bottom: 15px;
                    color: #555;
                }
                .back-link {
                    display: inline-block;
                    margin-top: 30px;
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 500;
                }
                .back-link:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Privacy Notice</h1>
                
                <h2>Information We Collect</h2>
                <p>SymptomSolver, powered by IBM Watson, may collect and process the following information:</p>
                <ul>
                    <li>Messages and conversations you have with the chatbot</li>
                    <li>Files and attachments you upload</li>
                    <li>Technical information about your device and browser</li>
                    <li>Usage patterns and interaction data</li>
                </ul>
                
                <h2>How We Use Your Information</h2>
                <p>We use the collected information to:</p>
                <ul>
                    <li>Provide and improve our AI assistant services</li>
                    <li>Process your requests and provide relevant responses</li>
                    <li>Analyze usage patterns to enhance user experience</li>
                    <li>Ensure system security and prevent abuse</li>
                </ul>
                
                <h2>Data Security</h2>
                <p>We implement appropriate security measures to protect your information. However, no method of transmission over the internet is 100% secure.</p>
                
                <h2>Third-Party Services</h2>
                <p>Our service integrates with IBM Watson Assistant, which may have its own privacy policies. We recommend reviewing IBM's privacy practices.</p>
                
                <h2>Data Retention</h2>
                <p>We retain your data only as long as necessary to provide our services and comply with legal obligations.</p>
                
                <h2>Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access your personal data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Withdraw consent for data processing</li>
                </ul>
                
                <h2>Contact Us</h2>
                <p>If you have questions about this privacy notice, please contact us through our support channels.</p>
                
                <a href="/" class="back-link">← Back to Chatbot</a>
            </div>
        </body>
        </html>
    `);
});

// Terms of Use Route
app.get('/terms', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Terms of Use - SymptomSolver</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #667eea;
                    text-align: center;
                    margin-bottom: 30px;
                }
                h2 {
                    color: #333;
                    margin-top: 30px;
                    margin-bottom: 15px;
                }
                p {
                    margin-bottom: 15px;
                    color: #555;
                }
                .back-link {
                    display: inline-block;
                    margin-top: 30px;
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 500;
                }
                .back-link:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Terms of Use</h1>
                
                <h2>Acceptance of Terms</h2>
                <p>By using SymptomSolver, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.</p>
                
                <h2>Service Description</h2>
                <p>SymptomSolver is an AI-powered chatbot that provides general information and assistance. It is not a substitute for professional medical advice, diagnosis, or treatment.</p>
                
                <h2>Medical Disclaimer</h2>
                <p><strong>Important:</strong> The information provided by SymptomSolver is for educational and informational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.</p>
                
                <h2>User Responsibilities</h2>
                <p>You agree to:</p>
                <ul>
                    <li>Provide accurate and truthful information</li>
                    <li>Not share personally sensitive or confidential medical information</li>
                    <li>Use the service responsibly and not for malicious purposes</li>
                    <li>Respect the intellectual property rights of others</li>
                    <li>Not attempt to reverse engineer or hack the service</li>
                </ul>
                
                <h2>Limitation of Liability</h2>
                <p>We are not liable for any damages arising from the use of our service, including but not limited to direct, indirect, incidental, or consequential damages.</p>
                
                <h2>Service Availability</h2>
                <p>We strive to maintain service availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the service at any time.</p>
                
                <h2>Intellectual Property</h2>
                <p>All content and technology used in SymptomSolver is protected by intellectual property laws. You may not copy, distribute, or modify our content without permission.</p>
                
                <h2>Privacy</h2>
                <p>Your privacy is important to us. Please review our Privacy Notice to understand how we collect and use your information.</p>
                
                <h2>Changes to Terms</h2>
                <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of any changes.</p>
                
                <h2>Contact Information</h2>
                <p>For questions about these terms, please contact us through our support channels.</p>
                
                <a href="/" class="back-link">← Back to Chatbot</a>
            </div>
        </body>
        </html>
    `);
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || config.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Watsonx Assistant v5 Chatbot is ready to use!');
  console.log('Watson Config:', {
    assistantId: watsonConfig.assistantId,
    instanceId: watsonConfig.instanceId,
    serviceUrl: watsonConfig.serviceUrl,
    apiKeyLength: watsonConfig.apiKey.length
  });
  
  // Initial cleanup
  cleanupOldFiles();
  
  // Set up periodic cleanup every hour
  setInterval(cleanupOldFiles, 60 * 60 * 1000);
}); 