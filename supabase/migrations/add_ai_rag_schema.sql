-- AI RAG System Schema Extensions
-- This migration adds tables and extensions needed for the Graph RAG Assistant

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
-- Note: Apache Age extension needs to be installed separately
-- For now, we'll use a relational approach that can be migrated to Age later

-- Document embeddings table for vector similarity search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension (adjust if using different model)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS document_embeddings_vector_idx 
  ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for document lookups
CREATE INDEX IF NOT EXISTS document_embeddings_document_id_idx 
  ON document_embeddings(document_id);

-- Knowledge graph nodes (entities extracted from documents)
CREATE TABLE IF NOT EXISTS kg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL, -- 'case', 'statute', 'precedent', 'party', 'judge', 'court', etc.
  label TEXT NOT NULL, -- Human-readable label
  properties JSONB DEFAULT '{}', -- Flexible properties storage
  embedding vector(1536), -- Optional: for semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for knowledge graph nodes
CREATE INDEX IF NOT EXISTS kg_nodes_firm_id_idx ON kg_nodes(firm_id);
CREATE INDEX IF NOT EXISTS kg_nodes_type_idx ON kg_nodes(node_type);
CREATE INDEX IF NOT EXISTS kg_nodes_label_idx ON kg_nodes(label);
CREATE INDEX IF NOT EXISTS kg_nodes_embedding_idx 
  ON kg_nodes 
  USING ivfflat (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

-- Knowledge graph edges (relationships between entities)
CREATE TABLE IF NOT EXISTS kg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES kg_nodes(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES kg_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'cites', 'references', 'relates_to', 'opposes', 'represents', etc.
  properties JSONB DEFAULT '{}',
  weight FLOAT DEFAULT 1.0, -- For weighted graph traversal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_loops CHECK (source_id != target_id)
);

-- Indexes for knowledge graph edges
CREATE INDEX IF NOT EXISTS kg_edges_firm_id_idx ON kg_edges(firm_id);
CREATE INDEX IF NOT EXISTS kg_edges_source_idx ON kg_edges(source_id);
CREATE INDEX IF NOT EXISTS kg_edges_target_idx ON kg_edges(target_id);
CREATE INDEX IF NOT EXISTS kg_edges_relationship_type_idx ON kg_edges(relationship_type);

-- AI query history for learning and audit
CREATE TABLE IF NOT EXISTS ai_query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  response TEXT,
  sources JSONB DEFAULT '[]', -- Array of source document/node IDs
  query_type TEXT DEFAULT 'chat', -- 'chat', 'analyze', 'draft', 'research'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query history
CREATE INDEX IF NOT EXISTS ai_query_history_firm_id_idx ON ai_query_history(firm_id);
CREATE INDEX IF NOT EXISTS ai_query_history_user_id_idx ON ai_query_history(user_id);
CREATE INDEX IF NOT EXISTS ai_query_history_matter_id_idx ON ai_query_history(matter_id);
CREATE INDEX IF NOT EXISTS ai_query_history_created_at_idx ON ai_query_history(created_at DESC);

-- Legal resources (trusted external legal databases)
CREATE TABLE IF NOT EXISTS legal_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'case_law', 'statute', 'regulation', 'precedent', etc.
  jurisdiction TEXT,
  citation TEXT,
  content TEXT,
  summary TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}', -- date, court, judge, etc.
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for legal resources
CREATE INDEX IF NOT EXISTS legal_resources_type_idx ON legal_resources(resource_type);
CREATE INDEX IF NOT EXISTS legal_resources_jurisdiction_idx ON legal_resources(jurisdiction);
CREATE INDEX IF NOT EXISTS legal_resources_citation_idx ON legal_resources(citation);
CREATE INDEX IF NOT EXISTS legal_resources_embedding_idx 
  ON legal_resources 
  USING ivfflat (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

-- Document processing status
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_extracted_entities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Index for processing status
CREATE INDEX IF NOT EXISTS documents_ai_processed_idx ON documents(ai_processed, ai_processing_status);

-- RLS Policies for AI tables
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_query_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access embeddings for documents in their firm
CREATE POLICY "Users can view document embeddings for their firm"
  ON document_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN matters m ON d.matter_id = m.id
      JOIN profiles p ON p.firm_id = m.firm_id
      WHERE d.id = document_embeddings.document_id
      AND p.id = auth.uid()
    )
  );

-- RLS Policy: Users can only access knowledge graph nodes for their firm
CREATE POLICY "Users can view kg nodes for their firm"
  ON kg_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.firm_id = kg_nodes.firm_id
      AND p.id = auth.uid()
    )
  );

-- RLS Policy: Users can only access knowledge graph edges for their firm
CREATE POLICY "Users can view kg edges for their firm"
  ON kg_edges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.firm_id = kg_edges.firm_id
      AND p.id = auth.uid()
    )
  );

-- RLS Policy: Users can only view their own query history
CREATE POLICY "Users can view their own query history"
  ON ai_query_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.firm_id = ai_query_history.firm_id
      AND p.id = auth.uid()
    )
  );

-- RLS Policy: Users can insert their own queries
CREATE POLICY "Users can insert their own queries"
  ON ai_query_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.firm_id = ai_query_history.firm_id
      AND p.id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_document_embeddings_updated_at
  BEFORE UPDATE ON document_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_kg_nodes_updated_at
  BEFORE UPDATE ON kg_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_kg_edges_updated_at
  BEFORE UPDATE ON kg_edges
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_legal_resources_updated_at
  BEFORE UPDATE ON legal_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();
