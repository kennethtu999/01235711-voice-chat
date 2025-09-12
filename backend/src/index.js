/**
 * Cloudflare Worker for Voice Chat Application
 * Handles AI API routing and static file serving
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }

    // Serve static files
    return handleStaticRequest(request, env);
  },
};

async function handleApiRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/messages' && request.method === 'POST') {
    return handleMessages(request, env);
  }

  return new Response('Not Found', { status: 404 });
}

async function handleMessages(request, env) {
  try {
    const body = await request.json();
    const { action, chatInput } = body;

    if (action !== 'sendMessage') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get AI provider from environment
    const aiProvider = env.AI_PROVIDER || 'cloudflare';

    let response;
    if (aiProvider === 'cloudflare') {
      response = await callCloudflareAI(chatInput, env);
    } else if (aiProvider === 'anthropic') {
      response = await callAnthropicAI(chatInput, env);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid AI provider' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling messages:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Parse chat history from formatted string
function parseChatHistory(chatInput) {
  const messages = [];
  const lines = chatInput.split('\n');

  for (const line of lines) {
    if (line.startsWith('User: ')) {
      messages.push({
        role: 'user',
        content: line.replace('User: ', ''),
      });
    } else if (line.startsWith('Assistant: ')) {
      messages.push({
        role: 'assistant',
        content: line.replace('Assistant: ', ''),
      });
    }
  }

  return messages;
}

async function callCloudflareAI(chatInput, env) {
  try {
    // Use Cloudflare AI binding
    const ai = env.AI;

    // Parse chat history from input
    const messages = parseChatHistory(chatInput);

    // Add system prompt for Chinese response
    const systemPrompt = {
      role: 'system',
      content:
        '你是一個友善的AI助手，請用繁體中文回覆。你的名字是「尬聊阿伯」，個性幽默風趣，喜歡與人聊天。請保持對話自然流暢，並適時加入一些台灣用語或幽默元素。',
    };

    // Add system prompt at the beginning
    const allMessages = [systemPrompt, ...messages];

    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: allMessages,
      max_tokens: 1024,
    });

    return {
      output: {
        message: response.response || '抱歉，我無法回應您的訊息。',
      },
    };
  } catch (error) {
    console.error('Cloudflare AI error:', error);
    return {
      output: {
        message: '抱歉，AI 服務暫時無法使用。',
      },
    };
  }
}

async function callAnthropicAI(chatInput, env) {
  try {
    // Parse chat history from input
    const messages = parseChatHistory(chatInput);

    // Add system prompt for Chinese response
    const systemPrompt = {
      role: 'system',
      content:
        '你是一個友善的AI助手，請用繁體中文回覆。你的名字是「尬聊阿伯」，個性幽默風趣，喜歡與人聊天。請保持對話自然流暢，並適時加入一些台灣用語或幽默元素。',
    };

    // Add system prompt at the beginning
    const allMessages = [systemPrompt, ...messages];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: allMessages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Anthropic API error');
    }

    return {
      output: {
        message: data.content?.[0]?.text || '抱歉，我無法回應您的訊息。',
      },
    };
  } catch (error) {
    console.error('Anthropic AI error:', error);
    return {
      output: {
        message: '抱歉，AI 服務暫時無法使用。',
      },
    };
  }
}

async function handleStaticRequest(request, env) {
  const url = new URL(request.url);
  let pathname = url.pathname;

  // Default to index.html for root path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Try to get the file from the public directory
  try {
    // Use the correct way to serve static files in Cloudflare Workers
    const file = await env.ASSETS.fetch(
      new Request(`https://example.com${pathname}`)
    );

    if (file.status === 404) {
      // If file not found, try index.html for SPA routing
      const indexFile = await env.ASSETS.fetch(
        new Request('https://example.com/index.html')
      );
      return indexFile;
    }

    return file;
  } catch (error) {
    console.error('Error serving static file:', error);
    return new Response('File not found', { status: 404 });
  }
}
