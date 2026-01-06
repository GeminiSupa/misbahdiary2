-- Add AI processing columns to documents table
-- This migration adds columns needed for AI document processing

-- Add AI processing columns if they don't exist
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_extracted_entities JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Create index for processing status queries
CREATE INDEX IF NOT EXISTS documents_ai_processed_idx ON documents(ai_processed, ai_processing_status);

-- Add comment for documentation
COMMENT ON COLUMN documents.ai_processed IS 'Whether the document has been processed by AI';
COMMENT ON COLUMN documents.ai_processing_status IS 'Current status of AI processing: pending, processing, completed, or failed';
COMMENT ON COLUMN documents.ai_processed_at IS 'Timestamp when AI processing was completed';
COMMENT ON COLUMN documents.ai_extracted_entities IS 'JSON array of entities extracted from the document';
COMMENT ON COLUMN documents.ai_summary IS 'AI-generated summary of the document content';

