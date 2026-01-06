/**
 * Supabase Helper Functions for AI RAG System
 * Database operations for embeddings, knowledge graph, and query history
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { DocumentEmbedding, KnowledgeGraphNode, KnowledgeGraphEdge, AIQueryHistory } from './types';

/**
 * Save document embeddings to database
 */
export async function saveDocumentEmbeddings(
  documentId: string,
  chunks: Array<{
    chunkIndex: number;
    chunkText: string;
    embedding?: number[];
    metadata?: Record<string, any>;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Prepare embeddings for insertion
    const embeddings = chunks.map(chunk => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      chunk_text: chunk.chunkText,
      embedding: chunk.embedding ? `[${chunk.embedding.join(',')}]` : null,
      metadata: chunk.metadata || {},
    }));

    // Insert embeddings (in batches if needed)
    const batchSize = 100;
    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize);
      const { error } = await supabase
        .from('document_embeddings')
        .insert(batch);

      if (error) {
        console.error('Error saving embeddings batch:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveDocumentEmbeddings:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get document embeddings for a document
 */
export async function getDocumentEmbeddings(
  documentId: string
): Promise<{ data: DocumentEmbedding[] | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('document_embeddings')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as DocumentEmbedding[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Save knowledge graph node
 */
export async function saveKGNode(
  node: Omit<KnowledgeGraphNode, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: KnowledgeGraphNode | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('kg_nodes')
      .insert(node)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as KnowledgeGraphNode };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Find existing knowledge graph node by label and type
 */
export async function findKGNode(
  firmId: string,
  nodeType: string,
  label: string
): Promise<{ data: KnowledgeGraphNode | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('kg_nodes')
      .select('*')
      .eq('firm_id', firmId)
      .eq('node_type', nodeType)
      .eq('label', label)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { data: null, error: error.message };
    }

    return { data: data as KnowledgeGraphNode | null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Save knowledge graph edge
 */
export async function saveKGEdge(
  edge: Omit<KnowledgeGraphEdge, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: KnowledgeGraphEdge | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check if edge already exists
    const { data: existing } = await supabase
      .from('kg_edges')
      .select('id')
      .eq('firm_id', edge.firm_id)
      .eq('source_id', edge.source_id)
      .eq('target_id', edge.target_id)
      .eq('relationship_type', edge.relationship_type)
      .limit(1)
      .single();

    if (existing) {
      // Update existing edge
      const { data, error } = await supabase
        .from('kg_edges')
        .update({
          properties: edge.properties,
          weight: edge.weight,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as KnowledgeGraphEdge };
    }

    // Insert new edge
    const { data, error } = await supabase
      .from('kg_edges')
      .insert(edge)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as KnowledgeGraphEdge };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get knowledge graph nodes by type
 */
export async function getKGNodesByType(
  firmId: string,
  nodeType: string,
  limit: number = 100
): Promise<{ data: KnowledgeGraphNode[] | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('kg_nodes')
      .select('*')
      .eq('firm_id', firmId)
      .eq('node_type', nodeType)
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as KnowledgeGraphNode[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get knowledge graph edges for a node
 */
export async function getKGEdgesForNode(
  firmId: string,
  nodeId: string,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): Promise<{ data: KnowledgeGraphEdge[] | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    let query = supabase
      .from('kg_edges')
      .select('*')
      .eq('firm_id', firmId);

    if (direction === 'outgoing' || direction === 'both') {
      query = query.or(`source_id.eq.${nodeId}`);
    }
    if (direction === 'incoming' || direction === 'both') {
      if (direction === 'both') {
        query = query.or(`source_id.eq.${nodeId},target_id.eq.${nodeId}`);
      } else {
        query = query.eq('target_id', nodeId);
      }
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as KnowledgeGraphEdge[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update document processing status
 */
export async function updateDocumentProcessingStatus(
  documentId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  metadata?: {
    extracted_entities?: any[];
    summary?: string;
    error?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const updateData: any = {
      ai_processing_status: status,
      ai_processed: status === 'completed',
      ai_processed_at: status === 'completed' ? new Date().toISOString() : null,
    };

    if (metadata) {
      if (metadata.extracted_entities) {
        updateData.ai_extracted_entities = metadata.extracted_entities;
      }
      if (metadata.summary) {
        updateData.ai_summary = metadata.summary;
      }
    }

    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get AI query history for a user/matter
 */
export async function getAIQueryHistory(
  firmId: string,
  options?: {
    userId?: string;
    matterId?: string;
    limit?: number;
  }
): Promise<{ data: AIQueryHistory[] | null; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    let query = supabase
      .from('ai_query_history' as any)
      .select('*')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options?.matterId) {
      query = query.eq('matter_id', options.matterId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as AIQueryHistory[] };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
