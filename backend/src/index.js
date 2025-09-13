// Cloudflare Worker for Voice Chat Application
// ES Module format required for AI binding

// Parse chat history from input
function parseChatHistory(chatInput) {
  try {
    if (typeof chatInput === "string") {
      const parsed = JSON.parse(chatInput);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    return Array.isArray(chatInput) ? chatInput : [chatInput];
  } catch (error) {
    console.error("Error parsing chat history:", error);
    return [
      {
        role: "user",
        content: chatInput || "Hello",
      },
    ];
  }
}

// Call Cloudflare AI
async function callCloudflareAI(chatInput, env) {
  try {
    // Use Cloudflare AI binding
    const ai = env.AI;

    // Parse chat history from input
    const messages = parseChatHistory(chatInput);

    // Add system prompt for Chinese response
    const systemPrompt = {
      role: "system",
      content:
        "你是一個友善的AI助手，請用繁體中文回覆。你的名字是「尬聊阿伯」，個性幽默風趣，喜歡與人聊天。請保持對話自然流暢，並適時加入一些台灣用語或幽默元素。",
    };

    // Add system prompt at the beginning
    const allMessages = [systemPrompt, ...messages];

    const response = await ai.run("@cf/google/gemma-3-12b-it", {
      messages: allMessages,
      max_tokens: 1024,
    });

    return {
      output: {
        message: response.response || "抱歉，我無法回應您的訊息。",
      },
    };
  } catch (error) {
    console.error("Cloudflare AI error:", error);
    return {
      output: {
        message: "抱歉，AI 服務暫時無法使用。",
      },
    };
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Serve static assets
    if (url.pathname.startsWith("/assets/") || url.pathname === "/") {
      return env.ASSETS.fetch(request);
    }

    // Handle API routes
    if (
      (url.pathname === "/api/chat" || url.pathname === "/api/messages") &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        let chatInput;

        // Handle different payload formats
        if (body.action === "sendMessage" && body.chatInput) {
          // Frontend format: parse the formatted chat log
          const lines = body.chatInput.split("\n");
          const messages = [];

          for (const line of lines) {
            if (line.startsWith("User: ")) {
              messages.push({ role: "user", content: line.substring(6) });
            } else if (line.startsWith("Assistant: ")) {
              messages.push({ role: "assistant", content: line.substring(11) });
            }
          }

          chatInput = messages;

          // Log conversation ID for debugging
          if (body.conversationId) {
            console.log(
              `Processing message for conversation: ${body.conversationId}`
            );
          }
        } else if (body.message) {
          // Backend format: message + chatHistory
          const chatHistory = body.chatHistory || [];
          chatInput = [...chatHistory, { role: "user", content: body.message }];
        } else {
          throw new Error("Invalid request format");
        }

        // Call AI service
        const aiResponse = await callCloudflareAI(chatInput, env);

        return new Response(JSON.stringify(aiResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("API error:", error);
        return new Response(
          JSON.stringify({ error: "Internal server error" }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // Handle health check
    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Default: serve the main HTML file
    return env.ASSETS.fetch(request);
  },
};
