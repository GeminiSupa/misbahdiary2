/**
 * RAG Retrieval Utilities
 * Handles vector similarity search and graph traversal for RAG
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateEmbedding } from './embeddings';
import { AI_CONFIG } from './config';
import type { AISource } from './types';

/**
 * Perform vector similarity search
 */
export async function vectorSimilaritySearch(
  query: string,
  firmId: string,
  options?: {
    limit?: number;
    threshold?: number;
    matterId?: string;
  }
): Promise<Array<{
  chunk_text: string;
  document_id: string;
  chunk_index: number;
  similarity: number;
  metadata: any;
}>> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    const supabase = await createSupabaseServerClient();
    
    // Use direct query instead of RPC (more reliable on Vercel)
    // First get all embeddings for the firm
    let query = supabase
      .from('document_embeddings')
      .select(`
        chunk_text,
        chunk_index,
        document_id,
        embedding,
        metadata,
        documents!inner(firm_id, matter_id)
      `)
      .eq('documents.firm_id', firmId);

    // If matterId is provided, filter by matter
    if (options?.matterId) {
      query = query.eq('documents.matter_id', options.matterId);
    }

    const { data: embeddings, error } = await query.limit(100); // Limit to avoid timeout

    if (error || !embeddings) {
      console.error('Error fetching embeddings:', error);
      return [];
    }

    // Calculate cosine similarity manually (Vercel-friendly)
    const results = embeddings
      .map((emb: any) => {
        if (!emb.embedding || !Array.isArray(emb.embedding)) return null;
        const similarity = cosineSimilarity(queryEmbedding, emb.embedding);
        return {
          chunk_text: emb.chunk_text,
          document_id: emb.document_id,
          chunk_index: emb.chunk_index,
          similarity,
          metadata: emb.metadata || {},
        };
      })
      .filter((r): r is NonNullable<typeof r> => 
        r !== null && r.similarity >= (options?.threshold ?? AI_CONFIG.vector.similarity_threshold)
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options?.limit ?? AI_CONFIG.vector.top_k);

    return results;
  } catch (error) {
    console.error('Error in vector similarity search:', error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve relevant context for RAG
 */
export async function retrieveRAGContext(
  query: string,
  firmId: string,
  options?: {
    matterId?: string;
    maxChunks?: number;
  }
): Promise<{
  chunks: Array<{
    text: string;
    source: AISource;
    relevance: number;
  }>;
}> {
  try {
    // Perform vector similarity search
    const vectorResults = await vectorSimilaritySearch(query, firmId, {
      limit: options?.maxChunks ?? AI_CONFIG.vector.top_k,
      matterId: options?.matterId,
    });

    const supabase = await createSupabaseServerClient();

    // Get document metadata for sources
    const documentIds = [...new Set(vectorResults.map(r => r.document_id))];
    const { data: documents } = await supabase
      .from('documents')
      .select('id, file_name, matter_id')
      .in('id', documentIds);

    const documentMap = new Map(
      documents?.map(d => [d.id, d]) || []
    );

    const chunks = vectorResults.map(result => {
      const doc = documentMap.get(result.document_id);
      return {
        text: result.chunk_text,
        source: {
          id: result.document_id,
          type: 'document' as const,
          title: doc?.file_name || 'Unknown Document',
          relevance_score: result.similarity,
        },
        relevance: result.similarity,
      };
    });

    return { chunks };
  } catch (error) {
    console.error('Error retrieving RAG context:', error);
    return { chunks: [] };
  }
}
