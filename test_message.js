const axios = require('axios');
const config = require('./config');

async function testMessage() {
    console.log('Testing message sending to Watsonx Assistant v5...');
    
    try {
        // First get IAM token
        const tokenResponse = await axios.post(
            'https://iam.cloud.ibm.com/identity/token',
            `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${config.WATSON_API_KEY}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        const token = tokenResponse.data.access_token;
        console.log('✅ IAM Token obtained');
        
        // Create session
        const sessionResponse = await axios.post(
            `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions?version=2023-06-15`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const sessionId = sessionResponse.data.session_id;
        console.log('✅ Session created:', sessionId);
        
        // Send a test message
        const testMessages = [
            'Hello',
            'Hi there',
            'How are you?',
            'What can you help me with?'
        ];
        
        for (const message of testMessages) {
            console.log(`\n--- Testing message: "${message}" ---`);
            
            const messageResponse = await axios.post(
                `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions/${sessionId}/message?version=2023-06-15`,
                {
                    input: {
                        message_type: 'text',
                        text: message
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const response = messageResponse.data;
            console.log('✅ Response received');
            console.log('Full response structure:', JSON.stringify(response, null, 2));
            
            if (response.output && response.output.generic && response.output.generic.length > 0) {
                console.log('Text response:', response.output.generic[0].text);
            } else {
                console.log('No text response found in output');
            }
            
            // Wait a bit between messages
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Clean up
        await axios.delete(
            `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions/${sessionId}?version=2023-06-15`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        console.log('\n✅ Session cleaned up');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testMessage(); 