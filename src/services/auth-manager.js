const WebSocket = require('ws');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AuthManager {
    constructor(browserType = 'chrome') {
        this.token = null;
        this.ws = null;
        this.browserType = browserType; // 'chrome' or 'edge'
    }

    async getToken() {
        if (this.token) return this.token;
        return await this.authenticate();
    }

    async authenticate() {
        console.log(`🌐 Attempting to connect to existing ${this.browserType}...`);

        let debugUrl = 'http://127.0.0.1:9222';
        
        // 1. Try to connect to existing browser
        try {
            await fetch(`${debugUrl}/json/version`);
            console.log(`✅ Found existing ${this.browserType} on port 9222!`);
        } catch (e) {
            console.log(`⚠️  No existing ${this.browserType} found on port 9222.`);
            console.log(`🚀 Launching fresh ${this.browserType} instance for you...`);
            await this.launchBrowser();
            
            // Wait for browser to start
            console.log(`⏳ Waiting for ${this.browserType} to initialize...`);
            await new Promise(r => setTimeout(r, 3000));
        }

        // 2. Find the Puter tab or create one
        let wsUrl = await this.findOrCreatePuterTab(debugUrl);
        if (!wsUrl) {
            throw new Error('Could not find or create a tab for Puter.com');
        }

        // 3. Connect via WebSocket (CDP)
        console.log('🔌 Connecting to tab via WebSocket...');
        this.ws = new WebSocket(wsUrl);

        return new Promise((resolve, reject) => {
            this.ws.on('open', async () => {
                console.log('✅ WebSocket Connected!');

                // Check for token immediately
                const token = await this.checkToken();
                if (token) {
                    console.log('✅ Token found immediately!');
                    this.token = token;
                    this.ws.close();
                    resolve(token);
                    return;
                }

                console.log('⏳ Waiting for you to log in (checking every 2s)...');
                
                // Poll for token every 2 seconds
                const interval = setInterval(async () => {
                    const token = await this.checkToken();
                    if (token) {
                        console.log('✅ Token captured successfully!');
                        clearInterval(interval);
                        this.token = token;
                        this.ws.close();
                        resolve(token);
                    }
                }, 2000);

                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(interval);
                    this.ws.close();
                    reject(new Error('Authentication timed out (5 mins)'));
                }, 300000);
            });

            this.ws.on('error', (err) => {
                console.error('❌ WebSocket error:', err);
                reject(err);
            });
        });
    }

    async launchBrowser() {
        let paths = [];
        let userDataDirName = '';

        if (this.browserType === 'edge') {
            paths = [
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe'
            ];
            userDataDirName = '../../edge-profile';
        } else {
            // Default to Chrome
            paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
            ];
            userDataDirName = '../../chrome-profile';
        }

        let executablePath = null;
        for (const p of paths) {
            if (fs.existsSync(p)) {
                executablePath = p;
                break;
            }
        }

        if (!executablePath) {
            console.error(`❌ Could not find ${this.browserType}!`);
            console.error(`👉 Please run ${this.browserType} manually with: --remote-debugging-port=9222`);
            throw new Error(`${this.browserType} not found`);
        }

        const userDataDir = path.resolve(__dirname, userDataDirName);
        
        // Launch browser as a completely detached process
        // We DO NOT pipe stdio, so it doesn't look like a child process
        const child = spawn(executablePath, [
            '--remote-debugging-port=9222',
            `--user-data-dir=${userDataDir}`,
            '--no-first-run',
            '--no-default-browser-check',
            'https://puter.com'
        ], {
            detached: true,
            stdio: 'ignore'
        });

        child.unref(); // Allow Node to exit even if browser is running
    }

    async findOrCreatePuterTab(debugUrl) {
        // Get list of tabs
        const res = await fetch(`${debugUrl}/json`);
        const tabs = await res.json();

        // Look for existing Puter tab
        const puterTab = tabs.find(t => t.url.includes('puter.com'));
        
        if (puterTab) {
            console.log('found existing puter tab');
            return puterTab.webSocketDebuggerUrl;
        }

        // Create new tab if none found
        console.log('✨ Creating new Puter tab...');
        const newTabRes = await fetch(`${debugUrl}/json/new?https://puter.com`);
        const newTab = await newTabRes.json();
        return newTab.webSocketDebuggerUrl;
    }

    async checkToken() {
        return new Promise((resolve) => {
            const id = Math.floor(Math.random() * 100000);
            
            // Listener for this specific request
            const listener = (data) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.id === id && msg.result && msg.result.result) {
                        const val = msg.result.result.value;
                        if (val && val.length > 0) {
                            this.ws.off('message', listener);
                            resolve(val);
                        } else {
                            // Don't remove listener yet, might be resolving false
                            this.ws.off('message', listener);
                            resolve(null);
                        }
                    }
                } catch (e) {
                    // ignore parse errors
                }
            };

            this.ws.on('message', listener);

            // Send CDP command to evaluate JS
            const expression = `
                localStorage.getItem('puter.auth.token') || 
                localStorage.getItem('auth_token') || 
                sessionStorage.getItem('puter.auth.token')
            `;

            this.ws.send(JSON.stringify({
                id: id,
                method: 'Runtime.evaluate',
                params: {
                    expression: expression,
                    returnByValue: true
                }
            }));
            
            // Small timeout to cleanup listener if no response (rare)
            setTimeout(() => {
                this.ws.off('message', listener);
                resolve(null);
            }, 1000);
        });
    }

    async refreshToken() {
        console.log('🔄 Refreshing Puter session...');
        this.token = null;

        // If using Edge, clear the profile to force a fresh account creation
        if (this.browserType === 'edge') {
            await this.clearEdgeProfile();
        }

        return await this.authenticate();
    }

    async clearEdgeProfile() {
        console.log('♻️  Clearing Edge profile to generate a new temporary account...');
        
        // 1. Kill any existing Edge processes on port 9222 to release the file lock
        try {
            const child = spawn('taskkill', ['/F', '/IM', 'msedge.exe'], { stdio: 'ignore' });
            await new Promise(r => child.on('close', r));
            // Wait a bit for the process to fully exit
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            // Ignore errors if Edge wasn't running
        }

        // 2. Delete the edge-profile directory
        const userDataDir = path.resolve(__dirname, '../../edge-profile');
        if (fs.existsSync(userDataDir)) {
            try {
                fs.rmSync(userDataDir, { recursive: true, force: true });
                console.log('✅ Edge profile cleared!');
            } catch (e) {
                console.error('⚠️  Could not clear Edge profile (might be in use):', e.message);
            }
        }
    }
}

module.exports = AuthManager;
