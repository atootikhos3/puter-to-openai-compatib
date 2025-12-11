const express = require('express');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');
const AuthManager = require('./services/auth-manager');
const PuterClient = require('./services/puter-client');
const { mapModelToPuter, getAllModels } = require('./utils/model-mapper');
const { openAIToPuter, puterToOpenAI, puterStreamToOpenAI } = require('./utils/format-converter');

const app = express();
// Increase the limit to 500mb to handle extremely large conversation history (effectively no limit)
app.use(express.json({ limit: '500mb' }));

const PORT = process.env.PORT || 3000;
let authManager = null;
let puterClient = null;

// Prompt for browser choice
function promptBrowserChoice() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n🌐 Choose your browser for authentication:');
        console.log('1) Google Chrome');
        console.log('2) Microsoft Edge');
        
        rl.question('\nSelect (1/2) [default: 1]: ', (answer) => {
            rl.close();
            if (answer.trim() === '2') {
                resolve('edge');
            } else {
                resolve('chrome');
            }
        });
    });
}

// Initialize
async function init() {
    console.log('🚀 Starting Puter AI Proxy...');
    
    const browserChoice = await promptBrowserChoice();
    authManager = new AuthManager(browserChoice);

    console.log(`\n📱 Opening ${browserChoice === 'edge' ? 'Microsoft Edge' : 'Google Chrome'} for authentication...`);
    
    const token = await authManager.getToken();
    puterClient = new PuterClient(token);
    
    console.log('✅ Authentication successful!');
    console.log(`🌐 Proxy server ready at http://localhost:${PORT}`);
    console.log('\n📝 Configure your coding agent:');
    console.log(`   API Base: http://localhost:${PORT}/v1`);
    console.log('   API Key: not-needed (any value works)\n');
}

// GET /v1/models - List available models
app.get('/v1/models', (req, res) => {
    const models = getAllModels();
    res.json({
        object: 'list',
        data: models.map(m => ({
            id: m.id,
            object: 'model',
            created: Date.now(),
            owned_by: m.provider
        }))
    });
});

// POST /v1/chat/completions - Main chat endpoint
app.post('/v1/chat/completions', async (req, res) => {
    try {
        const { model, messages, stream, temperature, max_tokens, tools } = req.body;
        const requestId = `chatcmpl-${uuidv4()}`;
        
        console.log(`📨 Request: model=${model}, stream=${stream}, messages=${messages.length}`);
        
        // Map OpenAI model name to Puter driver/model
        const puterConfig = mapModelToPuter(model);
        
        // Convert request format
        const puterRequest = openAIToPuter({
            messages,
            model: puterConfig.model,
            driver: puterConfig.driver,
            stream: stream || false,
            temperature,
            max_tokens,
            tools
        });
        
        if (stream) {
            // Streaming response
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            try {
                const puterStream = await puterClient.chatStream(puterRequest);
                
                for await (const chunk of puterStream) {
                    const openAIChunk = puterStreamToOpenAI(chunk, requestId, model);
                    if (openAIChunk) {
                        res.write(`data: ${JSON.stringify(openAIChunk)}\n\n`);
                    }
                }
                
                res.write('data: [DONE]\n\n');
                res.end();
                console.log('✅ Streaming response complete');
            } catch (error) {
                if (await handleCreditsExhausted(error)) {
                    const retryStream = await puterClient.chatStream(puterRequest);
                    for await (const chunk of retryStream) {
                        const openAIChunk = puterStreamToOpenAI(chunk, requestId, model);
                        if (openAIChunk) {
                            res.write(`data: ${JSON.stringify(openAIChunk)}\n\n`);
                        }
                    }
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                }
                throw error;
            }
        } else {
            // Non-streaming response
            try {
                const puterResponse = await puterClient.chat(puterRequest);
                const openAIResponse = puterToOpenAI(puterResponse, requestId, model);
                res.json(openAIResponse);
                console.log('✅ Response sent');
            } catch (error) {
                if (await handleCreditsExhausted(error)) {
                    const puterResponse = await puterClient.chat(puterRequest);
                    const openAIResponse = puterToOpenAI(puterResponse, requestId, model);
                    res.json(openAIResponse);
                    return;
                }
                throw error;
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message || error);
        res.status(500).json({
            error: {
                message: error.message || 'Internal server error',
                type: 'server_error'
            }
        });
    }
});

// Handle credits exhausted - refresh session
async function handleCreditsExhausted(error) {
    const isCreditsError = error?.error?.delegate === 'usage-limited-chat' ||
        error?.message?.includes('usage-limited') ||
        error?.error?.message?.includes('Permission denied') ||
        error?.message?.includes('invalid json response body') ||
        error?.message?.includes('Forbidden');
    
    if (isCreditsError) {
        console.log('💳 Credits exhausted or token invalid, refreshing session...');
        const newToken = await authManager.refreshToken();
        puterClient = new PuterClient(newToken);
        console.log('✅ Session refreshed!');
        return true;
    }
    return false;
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', authenticated: !!puterClient });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Puter AI Proxy',
        version: '1.0.0',
        endpoints: {
            models: 'GET /v1/models',
            chat: 'POST /v1/chat/completions',
            health: 'GET /health'
        }
    });
});

// Start server
app.listen(PORT, async () => {
    await init();
});
