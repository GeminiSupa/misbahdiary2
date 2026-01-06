/**
 * LLM Integration Utilities
 * Handles chat completion using OpenAI
 */

import OpenAI from 'openai';
import { AI_CONFIG } from './config';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = AI_CONFIG.api_keys.openai;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Generate chat completion using OpenAI
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<string> {
  try {
    const client = getOpenAIClient();

    // Ensure stream is false for non-streaming responses
    const stream = options?.stream ?? false;
    
    const response = await client.chat.completions.create({
      model: AI_CONFIG.llm.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options?.temperature ?? AI_CONFIG.llm.temperature,
      max_tokens: options?.max_tokens ?? AI_CONFIG.llm.max_tokens,
      stream: stream,
    });

    // Handle streaming response
    if (stream) {
      let fullContent = '';
      for await (const chunk of response as any) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
      }
      return fullContent;
    }

    // Handle non-streaming response
    const completion = response as any;
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No response from LLM');
    }

    return completion.choices[0].message?.content || '';
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
}

/**
 * Generate chat completion with context (for RAG)
 */
export async function generateRAGResponse(
  userQuery: string,
  context: string[],
  systemPrompt?: string
): Promise<string> {
  const messages: ChatMessage[] = [];

  // System prompt
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  } else {
    messages.push({
      role: 'system',
      content: `You are an AI legal research assistant. You help lawyers by analyzing legal documents, finding relevant cases and precedents, and answering questions about legal matters. Use the provided context to answer questions accurately. If the context doesn't contain enough information, say so. Always cite your sources when possible.`,
    });
  }

  // Add context
  if (context.length > 0) {
    const contextText = context
      .map((c, i) => `[Source ${i + 1}]\n${c}`)
      .join('\n\n---\n\n');

    messages.push({
      role: 'user',
      content: `Context from documents:\n\n${contextText}\n\n---\n\nQuestion: ${userQuery}`,
    });
  } else {
    messages.push({
      role: 'user',
      content: userQuery,
    });
  }

  return generateChatCompletion(messages);
}

/**
 * Check if LLM is available (API key is set)
 */
export function isLLMAvailable(): boolean {
  return !!AI_CONFIG.api_keys.openai;
}
