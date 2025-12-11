// src/services/puter-client.js

const fetch = require('node-fetch');

class PuterClient {
    constructor(authToken) {
        this.authToken = authToken;
        this.apiOrigin = 'https://api.puter.com';
    }

    async chat(params) {
        // Debug logging
        const tokenPreview = this.authToken ? `${this.authToken.substring(0, 10)}...` : 'null';
        console.log(`🔑 Using token: ${tokenPreview}`);
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://puter.com',
            'Referer': 'https://puter.com/'
        };

        const response = await fetch(`${this.apiOrigin}/drivers/call`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                interface: 'puter-chat-completion',
                driver: params.driver || 'openai-completion',
                test_mode: true,
                method: 'complete',
                args: {
                    messages: params.messages,
                    model: params.model,
                    temperature: params.temperature,
                    max_tokens: params.max_tokens,
                    tools: params.tools
                }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Error (${response.status}):`, text);
            try {
                const error = JSON.parse(text);
                throw error;
            } catch (e) {
                throw new Error(text || `HTTP ${response.status}`);
            }
        }

        const data = await response.json();
        if (data.success === false) {
            throw data;
        }
        return data;
    }

    async chatStream(params) {
        // Debug logging
        const tokenPreview = this.authToken ? `${this.authToken.substring(0, 10)}...` : 'null';
        console.log(`🔑 Using token: ${tokenPreview}`);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://puter.com',
            'Referer': 'https://puter.com/'
        };

        const response = await fetch(`${this.apiOrigin}/drivers/call`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                interface: 'puter-chat-completion',
                driver: params.driver || 'openai-completion',
                test_mode: true,
                method: 'complete',
                args: {
                    messages: params.messages,
                    model: params.model,
                    temperature: params.temperature,
                    max_tokens: params.max_tokens,
                    tools: params.tools,
                    stream: true
                }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Error (${response.status}):`, text);
            try {
                const error = JSON.parse(text);
                throw error;
            } catch (e) {
                throw new Error(text || `HTTP ${response.status}`);
            }
        }

        return this.parseStream(response.body);
    }

    async *parseStream(body) {
        const decoder = new TextDecoder();
        let buffer = '';

        for await (const chunk of body) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const parsed = JSON.parse(line);
                        yield parsed;
                    } catch (e) {
                        // Skip non-JSON lines
                    }
                }
            }
        }

        // Handle remaining buffer
        if (buffer.trim()) {
            try {
                yield JSON.parse(buffer);
            } catch (e) {
                // Skip
            }
        }
    }
}

module.exports = PuterClient;
