/**
 * Knowledge Graph Utilities
 * Helper functions for working with knowledge graph nodes and edges
 * (without requiring external graph database APIs)
 */

import type { KnowledgeGraphNode, KnowledgeGraphEdge, NodeType, RelationshipType } from './types';

/**
 * Create a knowledge graph node
 */
export function createKGNode(
  firmId: string,
  nodeType: NodeType,
  label: string,
  properties: Record<string, any> = {}
): Omit<KnowledgeGraphNode, 'id' | 'created_at' | 'updated_at'> {
  return {
    firm_id: firmId,
    node_type: nodeType,
    label: label.trim(),
    properties: {
      ...properties,
      created_by: 'system',
    },
  };
}

/**
 * Create a knowledge graph edge
 */
export function createKGEdge(
  firmId: string,
  sourceId: string,
  targetId: string,
  relationshipType: RelationshipType,
  properties: Record<string, any> = {},
  weight: number = 1.0
): Omit<KnowledgeGraphEdge, 'id' | 'created_at' | 'updated_at'> {
  if (sourceId === targetId) {
    throw new Error('Source and target nodes cannot be the same');
  }

  return {
    firm_id: firmId,
    source_id: sourceId,
    target_id: targetId,
    relationship_type: relationshipType,
    properties: {
      ...properties,
      created_by: 'system',
    },
    weight,
  };
}

/**
 * Extract potential entities from text for graph construction
 * This is a simple rule-based approach - can be enhanced with NLP/AI later
 */
export function extractPotentialEntities(text: string): Array<{
  type: NodeType;
  label: string;
  confidence: number;
  context?: string;
}> {
  const entities: Array<{
    type: NodeType;
    label: string;
    confidence: number;
    context?: string;
  }> = [];

  // Extract case citations (e.g., "Smith v. Jones", "123 U.S. 456")
  const casePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+v\.\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
  let match;
  while ((match = casePattern.exec(text)) !== null) {
    entities.push({
      type: 'case',
      label: match[0],
      confidence: 0.8,
      context: text.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50),
    });
  }

  // Extract court names
  const courtPattern = /(?:Supreme Court|Court of Appeals|District Court|High Court|Federal Court)\s+(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?/gi;
  while ((match = courtPattern.exec(text)) !== null) {
    entities.push({
      type: 'court',
      label: match[0],
      confidence: 0.7,
    });
  }

  // Extract judge names (patterns like "Judge Smith", "Justice Jones")
  const judgePattern = /(?:Judge|Justice|Hon\.|Honorable)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi;
  while ((match = judgePattern.exec(text)) !== null) {
    entities.push({
      type: 'judge',
      label: match[1],
      confidence: 0.7,
    });
  }

  // Extract party names (after "Plaintiff", "Defendant", "Appellant", etc.)
  const partyPattern = /(?:Plaintiff|Defendant|Appellant|Respondent|Petitioner|Respondent):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
  while ((match = partyPattern.exec(text)) !== null) {
    entities.push({
      type: 'party',
      label: match[1],
      confidence: 0.6,
    });
  }

  // Extract statute citations
  const statutePattern = /(\d+\s+[A-Z][a-z]+\s+Code|Section\s+\d+)/gi;
  while ((match = statutePattern.exec(text)) !== null) {
    entities.push({
      type: 'statute',
      label: match[0],
      confidence: 0.7,
    });
  }

  return entities;
}

/**
 * Suggest relationships between entities
 */
export function suggestRelationships(
  entities: Array<{ type: NodeType; label: string }>,
  text: string
): Array<{
  source: string;
  target: string;
  type: RelationshipType;
  confidence: number;
}> {
  const relationships: Array<{
    source: string;
    target: string;
    type: RelationshipType;
    confidence: number;
  }> = [];

  // Find cases that cite other cases
  const cases = entities.filter(e => e.type === 'case');
  for (let i = 0; i < cases.length; i++) {
    for (let j = i + 1; j < cases.length; j++) {
      // Check if they appear near each other in text
      const sourceIndex = text.indexOf(cases[i].label);
      const targetIndex = text.indexOf(cases[j].label);
      if (sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) < 200) {
        relationships.push({
          source: cases[i].label,
          target: cases[j].label,
          type: 'cites',
          confidence: 0.6,
        });
      }
    }
  }

  // Find parties represented by lawyers
  const parties = entities.filter(e => e.type === 'party');
  const lawyers = entities.filter(e => e.type === 'lawyer');
  for (const party of parties) {
    for (const lawyer of lawyers) {
      if (text.includes(`${lawyer.label} represents ${party.label}`) ||
          text.includes(`${party.label} represented by ${lawyer.label}`)) {
        relationships.push({
          source: party.label,
          target: lawyer.label,
          type: 'represents',
          confidence: 0.7,
        });
      }
    }
  }

  // Find cases filed in courts
  for (const caseEntity of cases) {
    const courts = entities.filter(e => e.type === 'court');
    for (const court of courts) {
      if (text.includes(`${caseEntity.label} filed in ${court.label}`) ||
          text.includes(`${court.label} heard ${caseEntity.label}`)) {
        relationships.push({
          source: caseEntity.label,
          target: court.label,
          type: 'filed_in',
          confidence: 0.7,
        });
      }
    }
  }

  return relationships;
}

/**
 * Normalize entity label (remove duplicates, standardize format)
 */
export function normalizeEntityLabel(label: string, type: NodeType): string {
  let normalized = label.trim();
  
  // Remove common prefixes
  normalized = normalized.replace(/^(?:Case|Matter|Document):\s*/i, '');
  
  // Standardize case citations
  if (type === 'case') {
    normalized = normalized.replace(/\s+v\.\s+/gi, ' v. ');
    normalized = normalized.replace(/\s+/g, ' ');
  }
  
  // Capitalize properly
  if (type === 'court' || type === 'judge') {
    normalized = normalized
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return normalized;
}

/**
 * Check if two entities are likely the same
 */
export function areEntitiesSimilar(
  entity1: { label: string; type: NodeType },
  entity2: { label: string; type: NodeType }
): boolean {
  if (entity1.type !== entity2.type) return false;
  
  const label1 = normalizeEntityLabel(entity1.label, entity1.type).toLowerCase();
  const label2 = normalizeEntityLabel(entity2.label, entity2.type).toLowerCase();
  
  // Exact match
  if (label1 === label2) return true;
  
  // Check if one contains the other (for abbreviations)
  if (label1.includes(label2) || label2.includes(label1)) {
    // Only consider similar if the shorter is at least 60% of the longer
    const shorter = label1.length < label2.length ? label1 : label2;
    const longer = label1.length >= label2.length ? label1 : label2;
    return shorter.length / longer.length >= 0.6;
  }
  
  return false;
}
