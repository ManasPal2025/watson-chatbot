const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Watson Assistant API configuration
const watsonConfig = {
  assistantId: config.WATSON_ASSISTANT_ID,
  apiKey: config.WATSON_API_KEY,
  serviceUrl: config.WATSON_SERVICE_URL
};

// Store sessions (in production, use a proper database)
const sessions = new Map();

// Alternative authentication method - try without "Bearer" prefix
app.post('/api/session', async (req, res) => {
  try {
    console.log('Creating session with alternative auth method...');

    const response = await axios.post(
      `${watsonConfig.serviceUrl}/instances/${watsonConfig.assistantId}/v2/sessions`,
      {},
      {
        headers: {
          'Authorization': watsonConfig.apiKey, // Try without "Bearer" prefix
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
    } else {
      res.status(500).json({ 
        error: 'Failed to create session',
        details: error.response?.data || error.message
      });
    }
  }
});

// Send message endpoint
app.post('/api/message', async (req, res) => {
  const { sessionId, message } = req.body;
  
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'Session ID and message are required' });
  }
  
  try {
    const response = await axios.post(
      `${watsonConfig.serviceUrl}/instances/${watsonConfig.assistantId}/v2/sessions/${sessionId}/message`,
      {
        input: {
          message_type: 'text',
          text: message
        }
      },
      {
        headers: {
          'Authorization': watsonConfig.apiKey, // Try without "Bearer" prefix
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const watsonResponse = response.data;
    res.json({
      response: watsonResponse.output.generic[0]?.text || 'I apologize, but I couldn\'t process your request.',
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete session endpoint
app.delete('/api/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    await axios.delete(
      `${watsonConfig.serviceUrl}/instances/${watsonConfig.assistantId}/v2/sessions/${sessionId}`,
      {
        headers: {
          'Authorization': watsonConfig.apiKey // Try without "Bearer" prefix
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

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Alternative server running on http://localhost:${config.PORT}`);
  console.log('Chatbot is ready to use!');
  console.log('Watson Config:', {
    assistantId: watsonConfig.assistantId,
    serviceUrl: watsonConfig.serviceUrl,
    apiKeyLength: watsonConfig.apiKey.length
  });
}); 