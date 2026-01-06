# AI-Based Graph RAG Assistant for Lawyers - Implementation Plan

## Overview

This document outlines the implementation strategy for integrating an AI-based Graph RAG (Retrieval Augmented Generation) Assistant into the Lawyer Diary application. The system will consolidate trusted legal resources with user's confidential case data, enabling intelligent research, document analysis, and automated drafting.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Assistant UI Components                          │   │
│  │  - Chat Interface                                    │   │
│  │  - Document Analysis View                            │   │
│  │  - Template Generator                                │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              API Layer (Next.js API Routes)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/ai/chat          - Chat with RAG assistant     │   │
│  │  /api/ai/analyze       - Document analysis           │   │
│  │  /api/ai/draft         - Template generation         │   │
│  │  /api/ai/ingest        - Document ingestion          │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  Supabase   │ │   Neo4j/    │ │  ChromaDB  │
│  PostgreSQL │ │  Apache Age │ │  (Metadata)│
│  + PGVector │ │  (Graph DB) │ │            │
└─────────────┘ └──────────────┘ └────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
            ┌───────────▼───────────┐
            │   LightRAG Engine     │
            │   (Graph RAG Logic)   │
            └───────────────────────┘
                        │
            ┌───────────▼───────────┐
            │  Document Processing  │
            │  MinerU + OlmOCR      │
            └───────────────────────┘
```

## Technology Stack

### Core Components

1. **Graph Database**: 
   - **Option A**: Neo4j (recommended for complex relationships)
   - **Option B**: PostgreSQL with Apache Age extension (leverages existing Supabase setup)

2. **Vector Storage**: 
   - **PGVector** extension in Supabase PostgreSQL (already available)

3. **Graph RAG Framework**: 
   - **LightRAG** - Lightweight graph-based RAG implementation

4. **Document Processing**:
   - **MinerU** - PDF/document extraction and parsing
   - **OlmOCR** - OCR for scanned documents

5. **Metadata Store**:
   - **ChromaDB** - For metadata-driven document analysis and retrieval

6. **LLM Integration**:
   - OpenAI GPT-4 / Claude (via API)
   - Or open-source alternatives (Llama 3, Mistral)

## Implementation Phases

### Phase 1: Foundation & Infrastructure (Week 1-2)

#### 1.1 Database Schema Extensions
- Extend Supabase schema for:
  - Knowledge graph nodes and edges
  - Document embeddings (using pgvector)
  - Legal resource metadata
  - User query history

#### 1.2 Graph Database Setup
- **If using Neo4j**: Set up Neo4j AuraDB or self-hosted instance
- **If using Apache Age**: Install and configure Apache Age extension in Supabase
- Create initial graph schema for legal entities

#### 1.3 Vector Storage Setup
- Enable pgvector extension in Supabase
- Create embeddings table with vector columns
- Set up indexing for similarity search

### Phase 2: Document Processing Pipeline (Week 2-3)

#### 2.1 Document Ingestion Service
- Create background job/API endpoint for document processing
- Integrate MinerU for PDF extraction
- Integrate OlmOCR for scanned document OCR
- Extract structured data (entities, dates, citations, etc.)

#### 2.2 Document Chunking & Embedding
- Implement intelligent chunking strategy for legal documents
- Generate embeddings using OpenAI/Claude embeddings API
- Store embeddings in pgvector

#### 2.3 Graph Construction
- Extract entities (cases, statutes, precedents, parties)
- Create relationships (cites, references, relates_to)
- Populate graph database with extracted knowledge

### Phase 3: RAG System Integration (Week 3-4)

#### 3.1 LightRAG Integration
- Install and configure LightRAG
- Create custom graph traversal strategies for legal research
- Implement query understanding and entity extraction

#### 3.2 Retrieval System
- Hybrid search: Vector similarity + Graph traversal
- Implement relevance ranking
- Context window management

#### 3.3 ChromaDB Integration
- Set up ChromaDB for metadata storage
- Index document metadata (type, jurisdiction, date, etc.)
- Enable metadata-filtered retrieval

### Phase 4: AI Assistant Interface (Week 4-5)

#### 4.1 API Routes
- `/api/ai/chat` - Main chat endpoint with RAG
- `/api/ai/analyze` - Document analysis endpoint
- `/api/ai/draft` - Template generation endpoint
- `/api/ai/ingest` - Document ingestion endpoint

#### 4.2 Frontend Components
- Chat interface component
- Document analysis view
- Template generator UI
- Research assistant panel

#### 4.3 Integration with Existing Features
- Link AI assistant to case documents
- Enable context-aware queries from case details
- Integrate with matter timeline

### Phase 5: Legal Resource Integration (Week 5-6)

#### 5.1 Legal Database Ingestion
- Identify trusted legal resource APIs/databases
- Set up ingestion pipeline for:
  - Case law databases
  - Statutory law
  - Legal precedents
  - Regulatory documents

#### 5.2 Knowledge Graph Population
- Extract and link legal entities
- Build citation networks
- Create jurisdiction-specific subgraphs

### Phase 6: Template & Drafting System (Week 6-7)

#### 6.1 Template Library
- Create template storage system
- Define template variables and placeholders
- Link templates to case types

#### 6.2 AI-Powered Drafting
- Implement template filling with AI
- Context-aware content generation
- Citation and reference insertion
- Compliance checking

## Detailed Technical Specifications

### Database Schema Extensions

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS age; -- If using Apache Age

-- Document embeddings table
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  chunk_index INTEGER,
  chunk_text TEXT,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Knowledge graph nodes (if using PostgreSQL + Apache Age)
CREATE TABLE kg_nodes (
  id UUID PRIMARY KEY,
  node_type TEXT, -- 'case', 'statute', 'precedent', 'party', etc.
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge graph edges
CREATE TABLE kg_edges (
  id UUID PRIMARY KEY,
  source_id UUID REFERENCES kg_nodes(id),
  target_id UUID REFERENCES kg_nodes(id),
  relationship_type TEXT, -- 'cites', 'references', 'relates_to', etc.
  properties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query history for learning
CREATE TABLE ai_query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  matter_id UUID REFERENCES matters(id),
  query TEXT,
  response TEXT,
  sources JSONB, -- Array of source document IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal resources metadata
CREATE TABLE legal_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  resource_type TEXT, -- 'case_law', 'statute', 'regulation', etc.
  jurisdiction TEXT,
  citation TEXT,
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Route Structure

```typescript
// app/api/ai/chat/route.ts
export async function POST(request: Request) {
  // 1. Extract query and context (matter_id, user_id)
  // 2. Use LightRAG to traverse graph and retrieve relevant nodes
  // 3. Perform vector similarity search for semantic matches
  // 4. Combine graph and vector results
  // 5. Generate response using LLM with retrieved context
  // 6. Log query and response
  // 7. Return response with sources
}

// app/api/ai/analyze/route.ts
export async function POST(request: Request) {
  // 1. Receive document ID
  // 2. Extract entities and relationships
  // 3. Find similar cases/precedents
  // 4. Generate analysis report
  // 5. Return structured analysis
}

// app/api/ai/draft/route.ts
export async function POST(request: Request) {
  // 1. Receive template type and case context
  // 2. Retrieve relevant precedents and templates
  // 3. Generate draft using LLM
  // 4. Insert citations and references
  // 5. Return draft document
}

// app/api/ai/ingest/route.ts
export async function POST(request: Request) {
  // 1. Receive document file
  // 2. Process with MinerU/OlmOCR
  // 3. Extract text and structure
  // 4. Generate embeddings
  // 5. Extract entities for graph
  // 6. Store in database
  // 7. Update graph database
}
```

## Integration Points with Existing System

### 1. Document Upload Flow
- Extend `uploadMatterDocument` action to trigger AI ingestion
- Add background processing for uploaded documents
- Store processing status in documents table

### 2. Case View Integration
- Add "AI Research Assistant" panel to case detail page
- Enable context-aware queries from case details
- Show AI-generated insights in matter timeline

### 3. Search Enhancement
- Enhance existing search with AI-powered semantic search
- Add "Ask AI" option in search interface

## Security & Privacy Considerations

1. **Data Isolation**: Ensure AI queries respect RLS policies
2. **Confidentiality**: Never send confidential data to external LLM APIs without encryption
3. **Audit Trail**: Log all AI queries and document access
4. **Access Control**: Restrict AI features based on user roles
5. **Data Retention**: Implement policies for AI query history

## Cost Considerations

1. **LLM API Costs**: Estimate based on token usage
2. **Vector Storage**: PGVector is free in Supabase
3. **Neo4j**: Consider AuraDB free tier or self-hosting
4. **ChromaDB**: Can be self-hosted or use managed service
5. **Document Processing**: MinerU/OlmOCR can run on server

## Recommended Starting Approach

### Option 1: PostgreSQL-Centric (Recommended for MVP)
- Use **Apache Age** extension in Supabase PostgreSQL
- Leverage existing Supabase infrastructure
- Lower operational complexity
- Good for getting started quickly

### Option 2: Neo4j-Centric (Recommended for Scale)
- Separate Neo4j instance for graph database
- Better performance for complex graph queries
- More features for graph analytics
- Requires additional infrastructure

## Next Steps

1. **Decision**: Choose between Neo4j or Apache Age
2. **Setup**: Configure chosen graph database
3. **Schema**: Create database schema extensions
4. **POC**: Build minimal working prototype
5. **Iterate**: Add features incrementally

## Dependencies to Add

```json
{
  "dependencies": {
    "@neo4j/neo4j-driver": "^5.x", // If using Neo4j
    "chromadb": "^0.4.x",
    "openai": "^4.x",
    "langchain": "^0.1.x", // For LLM orchestration
    "pdf-parse": "^1.1.x", // For PDF processing
    "tesseract.js": "^5.x" // For OCR (alternative to OlmOCR)
  }
}
```

## Success Metrics

1. **Query Response Time**: < 3 seconds for simple queries
2. **Relevance**: > 80% user satisfaction with AI responses
3. **Document Processing**: < 30 seconds per document
4. **Accuracy**: > 90% correct entity extraction
5. **Adoption**: > 50% of users using AI features monthly
