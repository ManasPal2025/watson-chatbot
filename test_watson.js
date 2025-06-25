const axios = require('axios');
const config = require('./config');

async function testWatsonConnection() {
    console.log('Testing Watsonx Assistant v5 connection...');
    console.log('Assistant ID:', config.WATSON_ASSISTANT_ID);
    console.log('Instance ID:', config.WATSON_INSTANCE_ID);
    console.log('Service URL:', config.WATSON_SERVICE_URL);
    console.log('API Key length:', config.WATSON_API_KEY.length);
    
    try {
        // Test Watsonx Assistant v5 API
        console.log('\n--- Testing Watsonx Assistant v5 API ---');
        const response = await axios.post(
            `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${config.WATSON_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        console.log('✅ Success with Watsonx Assistant v5!');
        console.log('Session ID:', response.data.session_id);
        
        // Test sending a message
        console.log('\n--- Testing message sending ---');
        const messageResponse = await axios.post(
            `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions/${response.data.session_id}/message`,
            {
                input: {
                    message_type: 'text',
                    text: 'Hello, how are you?'
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.WATSON_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        console.log('✅ Message sent successfully!');
        console.log('Response:', messageResponse.data.output.generic[0]?.text || 'No text response');
        
        // Clean up the session
        await axios.delete(
            `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions/${response.data.session_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${config.WATSON_API_KEY}`
                }
            }
        );
        console.log('✅ Session cleaned up successfully!');
        
    } catch (error) {
        console.log('❌ Failed to connect to Watsonx Assistant v5');
        console.log('Error Status:', error.response?.status);
        console.log('Error Message:', error.response?.data?.error || error.message);
        console.log('Full Error Details:', error.response?.data);
        
        console.log('\n--- Troubleshooting Tips ---');
        console.log('1. Check if your Watsonx Assistant instance is active');
        console.log('2. Verify the Assistant ID is correct');
        console.log('3. Verify the Instance ID is correct');
        console.log('4. Check if your API key is valid');
        console.log('5. Make sure your Watsonx Assistant service is in the correct region');
    }
}

testWatsonConnection(); 