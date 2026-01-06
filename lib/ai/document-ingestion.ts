/**
 * Document Ingestion Service
 * Processes uploaded documents with AI-powered extraction
 * Extracts text, chunks, entities, and generates embeddings
 */

import { processDocumentText, extractBasicEntities, type ProcessedDocument } from './document-processor';
import { createKGNode, createKGEdge, normalizeEntityLabel } from './graph-utils';
import { extractTextFromFile } from './file-parser';
import { extractEntitiesWithNLP, extractRelationshipsWithNLP } from './nlp-extraction';
import { generateEmbeddingsBatch, areEmbeddingsAvailable } from './embeddings';
import { generateRAGResponse } from './llm';
import { 
  saveDocumentEmbeddings, 
  saveKGNode, 
  findKGNode, 
  saveKGEdge,
  updateDocumentProcessingStatus 
} from './supabase-helpers';
import type { ExtractedEntity } from './types';

/**
 * Process a document (text extraction, chunking, entity extraction, embeddings)
 * Uses NLP for enhanced entity extraction and generates embeddings if API key is available
 */
export async function processDocument(
  documentId: string,
  text: string,
  fileName: string,
  firmId: string,
  options?: {
    useNLP?: boolean;
    generateEmbeddings?: boolean;
  }
): Promise<{
  success: boolean;
  error?: string;
  processed?: ProcessedDocument;
  entitiesExtracted?: number;
}> {
  try {
    // Update status to processing
    await updateDocumentProcessingStatus(documentId, 'processing');

    // Process document text
    const processed = processDocumentText(text, fileName);
    
    // Extract entities - use NLP if available, otherwise fallback to rule-based
    let entities: ExtractedEntity[] = [];
    const useNLP = options?.useNLP !== false && areEmbeddingsAvailable(); // Use NLP if embeddings are available
    
    if (useNLP) {
      try {
        entities = await extractEntitiesWithNLP(text, {
          fileName,
        });
      } catch (error) {
        console.warn('NLP extraction failed, falling back to rule-based:', error);
        // Fallback to basic extraction
        const basicEntities = extractBasicEntities(text);
        entities = Object.entries(basicEntities).flatMap(([type, values]) =>
          values.map(value => ({
            type: type as any,
            label: value,
            text: value,
            confidence: 0.5,
            properties: {},
          }))
        );
      }
    } else {
      // Rule-based extraction
      const basicEntities = extractBasicEntities(text);
      entities = Object.entries(basicEntities).flatMap(([type, values]) =>
        values.map(value => ({
          type: type as any,
          label: value,
          text: value,
          confidence: 0.5,
          properties: {},
        }))
      );
    }
    
    // Generate embeddings if API key is available
    const generateEmbeddings = options?.generateEmbeddings !== false && areEmbeddingsAvailable();
    let embeddings: number[][] = [];
    
    if (generateEmbeddings) {
      try {
        const chunkTexts = processed.chunks.map(chunk => chunk.text);
        embeddings = await generateEmbeddingsBatch(chunkTexts);
      } catch (error) {
        console.warn('Embedding generation failed:', error);
        // Continue without embeddings
      }
    }
    
    // Save document chunks with embeddings
    const chunks = processed.chunks.map((chunk, index) => ({
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.text,
      embedding: embeddings[index],
      metadata: chunk.metadata,
    }));

    const saveResult = await saveDocumentEmbeddings(documentId, chunks);
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to save document embeddings');
    }

    // Create knowledge graph nodes from extracted entities
    const createdNodes: Array<{ id: string; label: string; type: string }> = [];
    const entityMap = new Map<string, string>(); // label -> node_id

    for (const entity of entities) {
      const normalizedLabel = normalizeEntityLabel(entity.label, entity.type);
      
      // Check if node already exists
      const existing = await findKGNode(firmId, entity.type, normalizedLabel);
      
      if (existing?.data) {
        entityMap.set(entity.label, existing.data.id);
        continue;
      }

      // Create new node
      const node = createKGNode(firmId, entity.type, normalizedLabel, {
        confidence: entity.confidence,
        ...entity.properties,
        extracted_from: documentId,
      });

      const result = await saveKGNode(node);
      if (result.data) {
        createdNodes.push({
          id: result.data.id,
          label: normalizedLabel,
          type: entity.type,
        });
        entityMap.set(entity.label, result.data.id);
      }
    }

    // Extract relationships using NLP if available
    let relationships: Array<{
      source: string;
      target: string;
      type: 'cites' | 'references' | 'relates_to' | 'opposes' | 'represents' | 'filed_in';
      confidence: number;
    }> = [];

    if (useNLP && entities.length >= 2) {
      try {
        relationships = await extractRelationshipsWithNLP(text, entities);
      } catch (error) {
        console.warn('NLP relationship extraction failed:', error);
      }
    }

    // Create relationships in knowledge graph
    for (const rel of relationships) {
      const sourceId = entityMap.get(rel.source);
      const targetId = entityMap.get(rel.target);
      
      if (sourceId && targetId && sourceId !== targetId) {
        await saveKGEdge(createKGEdge(
          firmId,
          sourceId,
          targetId,
          rel.type,
          {
            extracted_from: documentId,
            confidence: rel.confidence,
          },
          rel.confidence
        ));
      }
    }

    // Generate summary using LLM if available, otherwise use simple truncation
    let summary = processed.text.slice(0, 200).trim() + (processed.text.length > 200 ? '...' : '');
    
    if (areEmbeddingsAvailable()) {
      try {
        const summaryPrompt = `Summarize the following legal document in 2-3 sentences, focusing on key legal points, parties, and outcomes:\n\n${text.slice(0, 4000)}`;
        summary = await generateRAGResponse(summaryPrompt, []);
      } catch (error) {
        console.warn('LLM summary generation failed:', error);
        // Use fallback summary
      }
    }

    // Update document status
    await updateDocumentProcessingStatus(documentId, 'completed', {
      extracted_entities: entities.map(e => ({
        type: e.type,
        label: e.label,
        confidence: e.confidence,
      })),
      summary,
    });

    return {
      success: true,
      processed,
      entitiesExtracted: entities.length,
    };
  } catch (error) {
    console.error('Error processing document:', error);
    await updateDocumentProcessingStatus(documentId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Re-export extractTextFromFile from file-parser
export { extractTextFromFile } from './file-parser';
