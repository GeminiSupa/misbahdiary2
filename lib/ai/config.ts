/**
 * Configuration for AI RAG Assistant
 */

export const AI_CONFIG = {
  // Embedding model configuration
  embedding: {
    model: 'text-embedding-ada-002', // OpenAI ada-002
    dimension: 1536,
    // Alternative: 'text-embedding-3-small' (1536) or 'text-embedding-3-large' (3072)
  },

  // LLM configuration
  llm: {
    provider: process.env.AI_LLM_PROVIDER || 'openai', // 'openai' | 'anthropic' | 'local'
    model: process.env.AI_LLM_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  },

  // Vector search configuration
  vector: {
    similarity_threshold: parseFloat(process.env.AI_SIMILARITY_THRESHOLD || '0.7'),
    top_k: parseInt(process.env.AI_TOP_K || '10'),
  },

  // Graph traversal configuration
  graph: {
    max_depth: parseInt(process.env.AI_GRAPH_MAX_DEPTH || '3'),
    max_nodes: parseInt(process.env.AI_GRAPH_MAX_NODES || '50'),
  },

  // Document processing
  processing: {
    chunk_size: parseInt(process.env.AI_CHUNK_SIZE || '1000'),
    chunk_overlap: parseInt(process.env.AI_CHUNK_OVERLAP || '200'),
    max_file_size_mb: parseInt(process.env.AI_MAX_FILE_SIZE_MB || '50'),
  },

  // API keys (should be in .env.local)
  api_keys: {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  },
} as const;

export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!AI_CONFIG.api_keys.openai && !AI_CONFIG.api_keys.anthropic) {
    errors.push('Either OPENAI_API_KEY or ANTHROPIC_API_KEY must be set');
  }

  if (AI_CONFIG.vector.similarity_threshold < 0 || AI_CONFIG.vector.similarity_threshold > 1) {
    errors.push('AI_SIMILARITY_THRESHOLD must be between 0 and 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
