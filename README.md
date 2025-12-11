# 🚀 Puter AI Proxy

OpenAI-compatible proxy server for **Puter. com's FREE AI models**. 

Use **Claude, GPT-4, Gemini, Mistral, DeepSeek** and more in **Cursor, Roo Code, Continue, Cody** - all for FREE!

## ⚡ Quick Start

```bash
# Clone and install
git clone https://github.com/moeygarali1-a11y/puter. git
cd puter
npm install

# Start the proxy
npm start
```

A browser will open → **complete the captcha** → Server ready!

## 🔧 Configure Your Coding Agent

### Cursor
```json
{
  "openai. apiBase": "http://localhost:3000/v1",
  "openai. apiKey": "not-needed"
}
```

### Roo Code / Continue
Set API Base to `http://localhost:3000/v1`

## 📦 Available Models

| Model ID | Provider | Best For |
|----------|----------|----------|
| `gpt-4o` | OpenAI | General coding |
| `claude-3.5-sonnet` | Anthropic | Complex reasoning |
| `claude-4-opus` | Anthropic | Best quality |
| `gemini-pro` | Google | Fast + smart |
| `deepseek-chat` | DeepSeek | Code generation |
| `llama3-70b` | Groq | Super fast |
| `mistral-large` | Mistral | European AI |
| `codestral` | Mistral | Code-specific |

## 🔄 Auto-Refresh

When credits run out: 
1. Proxy detects the error
2. Opens browser for new session
3. Continues automatically! 

## 📡 API Endpoints

- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat (OpenAI-compatible)
- `GET /health` - Health check

## 🧪 Test It

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role":  "user", "content": "Hello! "}]
  }'
```

## License

MIT