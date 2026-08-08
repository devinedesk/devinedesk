import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { env } from '@/src/lib/env';
import { SettingsService } from '@/src/lib/services/settingsService';
import { z } from 'zod';
import { withApiAuth } from '@/src/lib/apiHandler';

// Default fallback models if user hasn't configured any
const DEFAULT_FALLBACK_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
];

const chatSchema = z.object({
  messages: z.array(z.any()).min(1, 'Messages are required'),
  agentId: z.string().optional(),
  conversationId: z.string().optional(),
});

export const POST = withApiAuth({
  schema: chatSchema,
  handler: async (req, { auth, body }) => {
    try {
      const { messages, agentId, conversationId } = body;

      // Verify conversation
      if (conversationId) {
        const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conv || conv.userId !== auth.user.id) {
          return NextResponse.json(
            { error: 'Conversation not found or unauthorized' },
            { status: 403 }
          );
        }
      }

      // Fetch user settings for dynamic routing
      const userSettings = await SettingsService.getSettings(auth.user.id);

      // Construct the fallback chain based on user preferences
      const modelsToTry = [];

      if (userSettings.defaultModel) {
        modelsToTry.push(userSettings.defaultModel);
      }
      if (userSettings.fallbackModel) {
        modelsToTry.push(userSettings.fallbackModel);
      }

      // Append system defaults at the end to ensure *something* works
      for (const m of DEFAULT_FALLBACK_MODELS) {
        if (!modelsToTry.includes(m)) {
          modelsToTry.push(m);
        }
      }

      // Attempt generation with retries and fallback models
      let streamResp = null;
      let usedModel = modelsToTry[0];

      for (const model of modelsToTry) {
        try {
          const fetchResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: messages,
              stream: true, // Enable server-sent events stream
            }),
          });

          if (fetchResp.ok) {
            streamResp = fetchResp;
            usedModel = model;
            break; // Successfully connected to a model
          } else {
            console.warn(
              `[AI System] Model ${model} failed with status: ${fetchResp.status}. Trying fallback...`
            );
          }
        } catch (e) {
          console.warn(`[AI System] Network error for model ${model}. Trying fallback...`);
        }
      }

      if (!streamResp) {
        return NextResponse.json(
          { error: 'All AI models are currently unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      // Create a ReadableStream to pipe the response directly to the client
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          const reader = streamResp.body.getReader();
          let aiContent = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter((line) => line.trim() !== '');

              for (const line of lines) {
                if (line.replace(/^data: /, '') === '[DONE]') {
                  break;
                }
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.replace(/^data: /, ''));
                    const text = data.choices[0]?.delta?.content || '';
                    aiContent += text;
                    controller.enqueue(encoder.encode(text));
                  } catch (e) {
                    // Ignore JSON parse errors for incomplete chunks
                  }
                }
              }
            }

            // Save the AI message asynchronously after stream finishes
            if (conversationId && aiContent) {
              await prisma.message.create({
                data: {
                  conversationId,
                  role: 'assistant',
                  content: aiContent,
                },
              });
            }
          } catch (e) {
            console.error('[AI System] Streaming Error:', e);
            controller.error(e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (error) {
      console.error('[AI System] Chat Route Error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});
