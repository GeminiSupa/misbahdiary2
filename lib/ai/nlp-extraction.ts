/**
 * NLP-Enhanced Entity Extraction
 * Uses LLM to extract entities with better accuracy than rule-based methods
 */

import { generateChatCompletion, type ChatMessage } from './llm';
import { extractPotentialEntities, normalizeEntityLabel } from './graph-utils';
import type { NodeType, ExtractedEntity } from './types';

/**
 * Extract entities using NLP (LLM-based)
 */
export async function extractEntitiesWithNLP(
  text: string,
  documentContext?: {
    matterId?: string;
    fileName?: string;
    documentType?: string;
  }
): Promise<ExtractedEntity[]> {
  try {
    // First, do rule-based extraction for quick results
    const ruleBasedEntities = extractPotentialEntities(text);

    // Then enhance with LLM extraction
    const llmEntities = await extractEntitiesWithLLM(text, documentContext);

    // Combine and deduplicate
    const allEntities = [...ruleBasedEntities, ...llmEntities];
    const uniqueEntities = deduplicateEntities(allEntities);

    return uniqueEntities.map(entity => ({
      type: entity.type,
      label: entity.label,
      text: entity.label,
      confidence: entity.confidence,
      properties: entity.properties || {},
    }));
  } catch (error) {
    console.error('Error in NLP entity extraction:', error);
    // Fallback to rule-based if LLM fails
    const ruleBased = extractPotentialEntities(text);
    return ruleBased.map(e => ({
      type: e.type,
      label: e.label,
      text: e.label,
      confidence: e.confidence * 0.8, // Lower confidence for fallback
      properties: {},
    }));
  }
}

/**
 * Extract entities using LLM
 */
async function extractEntitiesWithLLM(
  text: string,
  documentContext?: {
    matterId?: string;
    fileName?: string;
    documentType?: string;
  }
): Promise<Array<{
  type: NodeType;
  label: string;
  confidence: number;
  properties?: Record<string, any>;
}>> {
  // Truncate text if too long (to save tokens)
  const maxTextLength = 8000;
  const truncatedText = text.length > maxTextLength 
    ? text.slice(0, maxTextLength) + '...'
    : text;

  const prompt = `Extract legal entities from the following text. Identify:
1. Case names (e.g., "Smith v. Jones")
2. Court names
3. Judge names
4. Party names (plaintiffs, defendants, appellants, etc.)
5. Statute citations
6. Legal concepts or precedents
7. Dates (especially important legal dates)
8. Case numbers or docket numbers

Return a JSON array of entities with this structure:
[
  {
    "type": "case" | "court" | "judge" | "party" | "statute" | "legal_concept" | "citation",
    "label": "Entity name",
    "confidence": 0.0-1.0,
    "properties": {
      "context": "surrounding text",
      "position": "where in document"
    }
  }
]

Text to analyze:
${truncatedText}

${documentContext?.fileName ? `Document: ${documentContext.fileName}\n` : ''}
Return only valid JSON, no other text.`;

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a legal entity extraction system. Extract entities accurately and return only valid JSON.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  try {
    const response = await generateChatCompletion(messages, {
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 2000,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const entities = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize entities
    return entities
      .filter((e: any) => e.type && e.label)
      .map((e: any) => ({
        type: normalizeEntityType(e.type),
        label: normalizeEntityLabel(e.label, normalizeEntityType(e.type)),
        confidence: Math.min(1.0, Math.max(0.0, e.confidence || 0.7)),
        properties: e.properties || {},
      }));
  } catch (error) {
    console.error('Error parsing LLM entity extraction:', error);
    return [];
  }
}

/**
 * Normalize entity type to match our NodeType
 */
function normalizeEntityType(type: string): NodeType {
  const typeMap: Record<string, NodeType> = {
    case: 'case',
    court: 'court',
    judge: 'judge',
    party: 'party',
    statute: 'statute',
    legal_concept: 'legal_concept',
    citation: 'citation',
    precedent: 'precedent',
    lawyer: 'lawyer',
    document: 'document',
    hearing: 'hearing',
  };

  return typeMap[type.toLowerCase()] || 'legal_concept';
}

/**
 * Deduplicate entities
 */
function deduplicateEntities(
  entities: Array<{
    type: NodeType;
    label: string;
    confidence: number;
    properties?: Record<string, any>;
  }>
): Array<{
  type: NodeType;
  label: string;
  confidence: number;
  properties?: Record<string, any>;
}> {
  const seen = new Map<string, {
    type: NodeType;
    label: string;
    confidence: number;
    properties?: Record<string, any>;
  }>();

  for (const entity of entities) {
    const key = `${entity.type}:${entity.label.toLowerCase()}`;
    const existing = seen.get(key);

    if (!existing || entity.confidence > existing.confidence) {
      seen.set(key, entity);
    }
  }

  return Array.from(seen.values());
}

/**
 * Extract relationships between entities using NLP
 */
export async function extractRelationshipsWithNLP(
  text: string,
  entities: ExtractedEntity[]
): Promise<Array<{
  source: string;
  target: string;
  type: 'cites' | 'references' | 'relates_to' | 'opposes' | 'represents' | 'filed_in';
  confidence: number;
}>> {
  if (entities.length < 2) {
    return [];
  }

  try {
    const entityList = entities
      .slice(0, 20) // Limit to avoid token limits
      .map((e, i) => `${i + 1}. ${e.label} (${e.type})`)
      .join('\n');

    const prompt = `Identify relationships between these legal entities in the text:

Entities:
${entityList}

Text:
${text.slice(0, 6000)}

Return a JSON array of relationships:
[
  {
    "source": "Entity 1 name",
    "target": "Entity 2 name",
    "type": "cites" | "references" | "relates_to" | "opposes" | "represents" | "filed_in",
    "confidence": 0.0-1.0
  }
]

Return only valid JSON, no other text.`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a legal relationship extraction system. Extract relationships accurately and return only valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await generateChatCompletion(messages, {
      temperature: 0.3,
      max_tokens: 1500,
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const relationships = JSON.parse(jsonMatch[0]);
    
    return relationships
      .filter((r: any) => r.source && r.target && r.type)
      .map((r: any) => ({
        source: r.source,
        target: r.target,
        type: r.type,
        confidence: Math.min(1.0, Math.max(0.0, r.confidence || 0.6)),
      }));
  } catch (error) {
    console.error('Error in NLP relationship extraction:', error);
    return [];
  }
}
