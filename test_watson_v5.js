const axios = require('axios');
const config = require('./config');

async function testWatsonV5Connection() {
    console.log('Testing Watsonx Assistant v5 with different auth methods...');
    console.log('Assistant ID:', config.WATSON_ASSISTANT_ID);
    console.log('Instance ID:', config.WATSON_INSTANCE_ID);
    console.log('Service URL:', config.WATSON_SERVICE_URL);
    console.log('API Key length:', config.WATSON_API_KEY.length);
    
    const testCases = [
        {
            name: 'Bearer Token',
            headers: {
                'Authorization': `Bearer ${config.WATSON_API_KEY}`,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'Direct API Key',
            headers: {
                'Authorization': config.WATSON_API_KEY,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'X-API-Key Header',
            headers: {
                'X-API-Key': config.WATSON_API_KEY,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'API Key in Query',
            headers: {
                'Content-Type': 'application/json'
            },
            useQueryParam: true
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n--- Testing: ${testCase.name} ---`);
        
        try {
            let url = `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions`;
            
            if (testCase.useQueryParam) {
                url += `?api_key=${config.WATSON_API_KEY}`;
            }
            
            const response = await axios.post(
                url,
                {},
                {
                    headers: testCase.headers,
                    timeout: 10000
                }
            );
            
            console.log('✅ Success!');
            console.log('Session ID:', response.data.session_id);
            
            // Clean up
            await axios.delete(
                `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions/${response.data.session_id}`,
                {
                    headers: testCase.headers
                }
            );
            
            console.log('✅ Session cleaned up!');
            return testCase; // Return the successful method
            
        } catch (error) {
            console.log('❌ Failed');
            console.log('Status:', error.response?.status);
            console.log('Error:', error.response?.data?.error || error.message);
        }
    }
    
    console.log('\n❌ All authentication methods failed');
    return null;
}

// Also test if we need to get an IAM token first
async function testWithIAMToken() {
    console.log('\n--- Testing IAM Token Authentication ---');
    
    try {
        // First get an IAM token
        const tokenResponse = await axios.post(
            'https://iam.cloud.ibm.com/identity/token',
            `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${config.WATSON_API_KEY}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        const accessToken = tokenResponse.data.access_token;
        console.log('✅ IAM Token obtained');
        
        // Now try to create a session with the IAM token
        const sessionResponse = await axios.post(
            `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Session created with IAM token!');
        console.log('Session ID:', sessionResponse.data.session_id);
        
        // Clean up
        await axios.delete(
            `${config.WATSON_SERVICE_URL}/instances/${config.WATSON_INSTANCE_ID}/v2/assistants/${config.WATSON_ASSISTANT_ID}/sessions/${sessionResponse.data.session_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        return { method: 'IAM Token', token: accessToken };
        
    } catch (error) {
        console.log('❌ IAM Token method failed');
        console.log('Error:', error.response?.data || error.message);
        return null;
    }
}

async function runAllTests() {
    console.log('Starting comprehensive Watsonx Assistant v5 tests...\n');
    
    // Test direct methods first
    const directResult = await testWatsonV5Connection();
    
    if (!directResult) {
        // Try IAM token method
        const iamResult = await testWithIAMToken();
        
        if (iamResult) {
            console.log('\n✅ IAM Token method works! Use this for your application.');
            return iamResult;
        }
    } else {
        console.log('\n✅ Direct method works! Use this for your application.');
        return directResult;
    }
    
    console.log('\n❌ All authentication methods failed. Please check your credentials.');
    return null;
}

runAllTests(); 