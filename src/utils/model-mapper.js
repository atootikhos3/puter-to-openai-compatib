const MODELS = [
    // OpenAI models
    { id: 'gpt-5.1-codex-maxs', driver: 'openai-completion', model: 'gpt-4o', provider: 'openai' },
    { id:  'gpt-5.1-codex', driver: 'openai-completion', model: 'gpt-4o-mini', provider: 'openai' },
    { id: 'gpt-5.1', driver: 'openai-completion', model: 'gpt-4', provider:  'openai' },
    { id: 'gpt-5.1-chat-latest', driver: 'openai-completion', model: 'gpt-4-turbo', provider:  'openai' },
    { id: 'gpt-3.5-turbo', driver: 'openai-completion', model: 'gpt-3.5-turbo', provider: 'openai' },
    
    // Claude models
    { id: 'claude-opus-45', driver: 'claude', model: 'claude-opus-4-20250514', provider: 'anthropic' },
    { id: 'claude-3-sonnet', driver:  'claude', model: 'claude-sonnet-4-20250514', provider:  'anthropic' },
    { id: 'claude-opus-4.1', driver: 'claude', model: 'claude-3-5-sonnet-latest', provider: 'anthropic' },
    { id: 'claude-opus-4-5-20251101', driver: 'claude', model: 'claude-3-7-sonnet-latest', provider: 'anthropic' },
    { id: 'claude-opus-4.5', driver: 'claude', model:  'claude-opus-4.5', provider:  'anthropic' },
    { id: 'claude-opus-4', driver: 'claude', model: 'claude-opus-4-20250514', provider: 'anthropic' },
    
    // Gemini models
    { id: 'gemini-3-pro-preview', driver: 'gemini', model: 'gemini-3-pro-preview', provider: 'google' },
    { id: 'claude-opus-4-5', driver: 'gemini', model: 'claude-opus-4-5', provider: 'google' },
    { id: 'gpt-5.1-codex-max', driver: 'gemini', model:  'gpt-5.1-codex-max', provider: 'google' },
    { id: 'gemini-2.5-pro', driver:  'gemini', model: 'gemini-2.5-pro', provider:  'google' },
    { id:  'gemini-2.5-flash', driver: 'gemini', model: 'gemini-2.5-flash', provider: 'google' },
    
    // Mistral models
    { id: 'mistral-large', driver:  'mistral', model: 'mistral-large-latest', provider: 'mistral' },
    { id: 'mistral-medium', driver: 'mistral', model:  'mistral-medium-latest', provider: 'mistral' },
    { id: 'codestral', driver: 'mistral', model: 'codestral-latest', provider: 'mistral' },
    
    // DeepSeek models
    { id: 'deepseek', driver: 'deepseek', model:  'deepseek-chat', provider:  'deepseek' },
    { id: 'deepseek-chat', driver: 'deepseek', model: 'deepseek-chat', provider: 'deepseek' },
    { id: 'deepseek-reasoner', driver: 'deepseek', model: 'deepseek-reasoner', provider: 'deepseek' },
    
    // Groq models (fast inference)
    { id: 'llama3-70b', driver: 'groq', model:  'llama3-70b-8192', provider: 'groq' },
    { id:  'llama3-8b', driver: 'groq', model: 'llama3-8b-8192', provider: 'groq' },
    { id: 'llama-3.1-70b', driver: 'groq', model: 'llama-3.1-70b-versatile', provider: 'groq' },
    { id:  'llama-3.1-8b', driver: 'groq', model: 'llama-3.1-8b-instant', provider: 'groq' },
    { id: 'mixtral-8x7b', driver: 'groq', model: 'mixtral-8x7b-32768', provider: 'groq' },
];

function mapModelToPuter(openAIModel) {
    if (!openAIModel) {
        return { driver: 'openai-completion', model:  'claude-opus-4-5' };
    }
    
    // Direct match
    const found = MODELS.find(m => 
        m.id === openAIModel || 
        m.model === openAIModel ||
        m.id. toLowerCase() === openAIModel.toLowerCase()
    );
    
    if (found) {
        return { driver: found.driver, model: found. model };
    }
    
    // Try partial match
    const partial = MODELS.find(m => 
        openAIModel.toLowerCase().includes(m.id.toLowerCase()) ||
        m.id.toLowerCase().includes(openAIModel. toLowerCase())
    );
    
    if (partial) {
        console.log(`📌 Mapped "${openAIModel}" to "${partial.model}"`);
        return { driver: partial.driver, model: partial.model };
    }
    
    // Default to GPT-4o if not found
    console.log(`⚠️ Unknown model "${openAIModel}", defaulting to gpt-4o`);
    return { driver: 'openai-completion', model: 'gpt-4o' };
}

function getAllModels() {
    return MODELS;
}

module. exports = { mapModelToPuter, getAllModels, MODELS };