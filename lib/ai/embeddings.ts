/**
 * Embedding Generation Utilities
 * Handles text embedding generation using OpenAI
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

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getOpenAIClient();
    
    const response = await client.embeddings.create({
      model: AI_CONFIG.embedding.model,
      input: text,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  try {
    const client = getOpenAIClient();
    const embeddings: number[][] = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await client.embeddings.create({
        model: AI_CONFIG.embedding.model,
        input: batch,
      });

      if (!response.data || response.data.length !== batch.length) {
        throw new Error(`Expected ${batch.length} embeddings, got ${response.data?.length || 0}`);
      }

      embeddings.push(...response.data.map(item => item.embedding));
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings batch:', error);
    throw error;
  }
}

/**
 * Check if embeddings are available (API key is set)
 */
export function areEmbeddingsAvailable(): boolean {
  return !!AI_CONFIG.api_keys.openai;
}
