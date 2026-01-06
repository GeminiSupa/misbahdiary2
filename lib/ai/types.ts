/**
 * Type definitions for AI RAG Assistant system
 */

export type NodeType = 
  | 'case'
  | 'statute'
  | 'precedent'
  | 'party'
  | 'judge'
  | 'court'
  | 'lawyer'
  | 'document'
  | 'hearing'
  | 'citation'
  | 'legal_concept';

export type RelationshipType =
  | 'cites'
  | 'references'
  | 'relates_to'
  | 'opposes'
  | 'represents'
  | 'presided_over'
  | 'filed_in'
  | 'similar_to'
  | 'contradicts'
  | 'supports';

export interface KnowledgeGraphNode {
  id: string;
  firm_id: string;
  node_type: NodeType;
  label: string;
  properties: Record<string, any>;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeGraphEdge {
  id: string;
  firm_id: string;
  source_id: string;
  target_id: string;
  relationship_type: RelationshipType;
  properties: Record<string, any>;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentEmbedding {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AIQuery {
  query: string;
  matter_id?: string;
  context?: Record<string, any>;
  query_type?: 'chat' | 'analyze' | 'draft' | 'research';
}

export interface AIResponse {
  response: string;
  sources: AISource[];
  confidence?: number;
  query_id?: string;
}

export interface AISource {
  id: string;
  type: 'document' | 'legal_resource' | 'knowledge_node';
  title: string;
  snippet?: string;
  relevance_score?: number;
}

export interface DocumentAnalysis {
  summary: string;
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  similar_cases?: SimilarCase[];
  key_points: string[];
  recommendations?: string[];
}

export interface ExtractedEntity {
  id?: string;
  type: NodeType;
  label: string;
  text: string;
  confidence: number;
  properties: Record<string, any>;
}

export interface ExtractedRelationship {
  id?: string;
  source: string;
  target: string;
  type: RelationshipType;
  confidence: number;
  properties: Record<string, any>;
}

export interface SimilarCase {
  id: string;
  title: string;
  citation: string;
  similarity_score: number;
  relevant_sections: string[];
}

export interface DocumentProcessingStatus {
  document_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  extracted_entities?: ExtractedEntity[];
  summary?: string;
}

export interface LegalResource {
  id: string;
  title: string;
  resource_type: 'case_law' | 'statute' | 'regulation' | 'precedent';
  jurisdiction?: string;
  citation: string;
  content: string;
  summary?: string;
  metadata: Record<string, any>;
  source_url?: string;
}

export interface AIQueryHistory {
  id: string;
  firm_id: string;
  user_id?: string;
  matter_id?: string;
  query: string;
  response?: string;
  sources: AISource[];
  query_type: 'chat' | 'analyze' | 'draft' | 'research';
  metadata: Record<string, any>;
  created_at: string;
}

export interface TemplateDraftRequest {
  template_type: string;
  matter_id: string;
  variables?: Record<string, any>;
  include_citations?: boolean;
  style?: 'formal' | 'informal' | 'brief';
}

export interface TemplateDraft {
  content: string;
  citations: string[];
  variables_used: Record<string, any>;
  suggestions?: string[];
}
