# Graph RAG Assistant - Quick Start Guide

## Overview

This guide will help you get started with the AI-based Graph RAG Assistant implementation in your Lawyer Diary application.

## Current Status

✅ **Phase 1 Complete:**
- Database schema extensions created
- TypeScript types and configuration
- Basic API routes structure
- RLS policies for security

🚧 **Next Steps:**
- Install dependencies
- Set up environment variables
- Implement document processing
- Integrate LLM and embedding services
- Build UI components

## Installation

### 1. Install Required Dependencies

```bash
cd web
npm install openai @langchain/openai @langchain/core chromadb pdf-parse
```

### 2. Set Up Environment Variables

Add to `web/.env.local`:

```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AI Settings (optional, defaults provided)
AI_LLM_PROVIDER=openai
AI_LLM_MODEL=gpt-4-turbo-preview
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
AI_SIMILARITY_THRESHOLD=0.7
AI_TOP_K=10
```

### 3. Apply Database Migrations

Run the AI RAG schema migration:

```bash
# If using Supabase CLI
supabase migration up

# Or apply directly via SQL
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/add_ai_rag_schema.sql
```

**Important:** Ensure the `vector` extension is enabled in your Supabase project:
- Go to Supabase Dashboard → Database → Extensions
- Enable "vector" extension

### 4. Verify Installation

Check that the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'document_embeddings',
  'kg_nodes',
  'kg_edges',
  'ai_query_history',
  'legal_resources'
);
```

## Architecture Decisions

### Recommended Approach: PostgreSQL-Centric (MVP)

For getting started quickly, we recommend using **PostgreSQL with pgvector** (already in Supabase) rather than setting up a separate Neo4j instance. This approach:

- ✅ Leverages existing Supabase infrastructure
- ✅ No additional database to manage
- ✅ Lower operational complexity
- ✅ Can migrate to Apache Age or Neo4j later if needed

### When to Consider Neo4j

Consider Neo4j if you need:
- Complex graph analytics
- Very large knowledge graphs (millions of nodes)
- Advanced graph algorithms
- Better performance for deep graph traversals

## Implementation Phases

### Phase 1: Foundation ✅ (Current)
- [x] Database schema
- [x] Type definitions
- [x] API route structure
- [x] Security (RLS policies)

### Phase 2: Document Processing (Next)
- [ ] PDF extraction (MinerU integration)
- [ ] OCR for scanned documents
- [ ] Text chunking strategy
- [ ] Embedding generation
- [ ] Entity extraction

### Phase 3: Graph Construction
- [ ] Entity extraction from documents
- [ ] Relationship identification
- [ ] Graph node/edge creation
- [ ] Graph traversal logic

### Phase 4: RAG Implementation
- [ ] LightRAG integration
- [ ] Vector similarity search
- [ ] Hybrid retrieval (graph + vector)
- [ ] Context assembly
- [ ] LLM response generation

### Phase 5: UI Components
- [ ] Chat interface
- [ ] Document analysis view
- [ ] Template generator
- [ ] Research assistant panel

## Testing the API

### Test Chat Endpoint

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key points in this case?",
    "matter_id": "your-matter-id"
  }'
```

### Test Document Ingestion

```bash
curl -X POST http://localhost:3000/api/ai/ingest \
  -F "document_id=your-document-id"
```

## Next Implementation Steps

1. **Implement Embedding Generation**
   - Create utility function to generate embeddings using OpenAI
   - Store embeddings in `document_embeddings` table

2. **Implement Document Processing**
   - Add PDF parsing logic
   - Implement intelligent chunking
   - Extract entities using NER (Named Entity Recognition)

3. **Implement Graph Construction**
   - Extract legal entities (cases, statutes, parties)
   - Identify relationships
   - Populate `kg_nodes` and `kg_edges` tables

4. **Implement RAG Logic**
   - Vector similarity search
   - Graph traversal
   - Context assembly
   - LLM integration

5. **Build UI Components**
   - Chat interface
   - Document analysis view
   - Integration with existing case pages

## Resources

- [PGVector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [LightRAG GitHub](https://github.com/HKUDS/LightRAG)
- [LangChain Documentation](https://js.langchain.com/)

## Support

For questions or issues, refer to:
- `GRAPH_RAG_IMPLEMENTATION.md` - Full implementation plan
- API routes in `web/app/api/ai/`
- Type definitions in `web/lib/ai/types.ts`
