-- Database function for vector similarity search
-- This function needs to be created in your Supabase database
-- Run this SQL in your Supabase SQL editor

CREATE OR REPLACE FUNCTION match_document_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  firm_id uuid
)
RETURNS TABLE (
  document_id uuid,
  chunk_index int,
  chunk_text text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.document_id,
    de.chunk_index,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) as similarity,
    de.metadata
  FROM document_embeddings de
  INNER JOIN documents d ON de.document_id = d.id
  WHERE d.firm_id = match_document_embeddings.firm_id
    AND de.embedding IS NOT NULL
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for better performance (if not already exists)
CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
  ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
