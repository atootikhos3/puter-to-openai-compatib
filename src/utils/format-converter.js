function openAIToPuter(openAIRequest) {
    return {
        messages:  openAIRequest. messages,
        model: openAIRequest.model,
        driver: openAIRequest.driver,
        stream:  openAIRequest. stream || false,
        temperature: openAIRequest.temperature,
        max_tokens: openAIRequest.max_tokens,
        tools: openAIRequest.tools
    };
}

function puterToOpenAI(puterResponse, requestId, model) {
    // Handle different Puter response formats
    let content = '';
    let toolCalls = null;
    
    if (puterResponse?. message?. content) {
        content = puterResponse.message.content;
    } else if (puterResponse?.result?.message?.content) {
        content = puterResponse.result.message.content;
    } else if (typeof puterResponse === 'string') {
        content = puterResponse;
    } else if (puterResponse?. text) {
        content = puterResponse. text;
    }
    
    // Handle tool calls
    if (puterResponse?. message?.tool_calls) {
        toolCalls = puterResponse.message.tool_calls;
    }
    
    const message = {
        role: 'assistant',
        content: content
    };
    
    if (toolCalls) {
        message.tool_calls = toolCalls;
    }
    
    return {
        id: requestId,
        object: 'chat.completion',
        created: Math. floor(Date.now() / 1000),
        model: model,
        choices: [{
            index: 0,
            message: message,
            finish_reason: toolCalls ? 'tool_calls' : 'stop'
        }],
        usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
        }
    };
}

function puterStreamToOpenAI(puterChunk, requestId, model) {
    // Handle text chunks
    if (puterChunk. text) {
        return {
            id:  requestId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date. now() / 1000),
            model: model,
            choices: [{
                index: 0,
                delta: { content: puterChunk.text },
                finish_reason: null
            }]
        };
    }
    
    // Handle Claude-style tool calls
    if (puterChunk. type === 'tool_use') {
        return {
            id:  requestId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date. now() / 1000),
            model: model,
            choices: [{
                index: 0,
                delta: {
                    tool_calls: [{
                        id: puterChunk.id,
                        type: 'function',
                        function: {
                            name: puterChunk.name,
                            arguments: JSON.stringify(puterChunk.input || {})
                        }
                    }]
                },
                finish_reason:  null
            }]
        };
    }
    
    // Handle OpenAI-style tool calls
    if (puterChunk. tool_calls) {
        return {
            id: requestId,
            object: 'chat.completion. chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                delta: { tool_calls: puterChunk.tool_calls },
                finish_reason: null
            }]
        };
    }
    
    // Handle final message
    if (puterChunk.message?. content) {
        return {
            id: requestId,
            object: 'chat.completion. chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop'
            }]
        };
    }
    
    return null;
}

module.exports = { openAIToPuter, puterToOpenAI, puterStreamToOpenAI };