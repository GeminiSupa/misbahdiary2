/**
 * Document Processing Utilities
 * Handles text extraction, chunking, and basic processing without requiring AI APIs
 */

export interface DocumentChunk {
  text: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  metadata: {
    pageNumber?: number;
    section?: string;
    type?: 'paragraph' | 'heading' | 'list' | 'table' | 'other';
  };
}

export interface ProcessedDocument {
  text: string;
  chunks: DocumentChunk[];
  metadata: {
    fileName: string;
    fileType: string;
    pageCount?: number;
    wordCount: number;
    characterCount: number;
  };
}

/**
 * Intelligent text chunking for legal documents
 * Splits text into semantically meaningful chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): DocumentChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: DocumentChunk[] = [];
  const sentences = splitIntoSentences(text);
  
  let currentChunk: string[] = [];
  let currentLength = 0;
  let chunkIndex = 0;
  let startChar = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceLength = sentence.length;

    // If adding this sentence would exceed chunk size, save current chunk
    if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      chunks.push({
        text: chunkText,
        chunkIndex: chunkIndex++,
        startChar,
        endChar: startChar + chunkText.length,
        metadata: {
          type: detectChunkType(chunkText),
        },
      });

      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, chunkOverlap);
      currentChunk = overlapText.length > 0 ? [overlapText] : [];
      currentLength = currentChunk.join(' ').length;
      startChar = chunks[chunks.length - 1].endChar - overlapText.length;
    }

    currentChunk.push(sentence);
    currentLength += sentenceLength + 1; // +1 for space
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ');
    chunks.push({
      text: chunkText,
      chunkIndex: chunkIndex,
      startChar,
      endChar: startChar + chunkText.length,
      metadata: {
        type: detectChunkType(chunkText),
      },
    });
  }

  return chunks;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Simple sentence splitting - can be enhanced with NLP libraries
  const sentenceEndings = /[.!?]+[\s\n]+/g;
  const sentences = text.split(sentenceEndings).filter(s => s.trim().length > 0);
  
  // Handle edge cases
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Get overlap text from previous chunk
 */
function getOverlapText(chunks: string[], overlapSize: number): string {
  if (chunks.length === 0) return '';
  
  const text = chunks.join(' ');
  if (text.length <= overlapSize) return text;
  
  // Get last N characters, but try to end at sentence boundary
  const overlap = text.slice(-overlapSize);
  const lastSentenceEnd = Math.max(
    overlap.lastIndexOf('.'),
    overlap.lastIndexOf('!'),
    overlap.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > overlapSize * 0.5) {
    return overlap.slice(lastSentenceEnd + 1).trim();
  }
  
  return overlap.trim();
}

/**
 * Detect chunk type based on content
 */
function detectChunkType(text: string): DocumentChunk['metadata']['type'] {
  const trimmed = text.trim();
  
  // Heading detection (short, all caps, or ends with colon)
  if (trimmed.length < 100 && (trimmed === trimmed.toUpperCase() || trimmed.endsWith(':'))) {
    return 'heading';
  }
  
  // List detection
  if (/^[\s]*[-*•]\s/.test(trimmed) || /^[\s]*\d+[\.)]\s/.test(trimmed)) {
    return 'list';
  }
  
  // Table detection (multiple tabs or consistent spacing)
  if (trimmed.split('\n').length > 2 && /\t/.test(trimmed)) {
    return 'table';
  }
  
  return 'paragraph';
}

/**
 * Extract basic metadata from text
 */
export function extractTextMetadata(text: string, fileName: string): ProcessedDocument['metadata'] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const characters = text.length;
  
  // Estimate page count (assuming ~500 words per page)
  const estimatedPages = Math.ceil(words.length / 500);
  
  // Detect file type from extension
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'txt';
  const fileType = getFileType(fileExtension);
  
  return {
    fileName,
    fileType,
    pageCount: estimatedPages,
    wordCount: words.length,
    characterCount: characters,
  };
}

/**
 * Get file type category
 */
function getFileType(extension: string): string {
  const typeMap: Record<string, string> = {
    pdf: 'pdf',
    doc: 'word',
    docx: 'word',
    txt: 'text',
    rtf: 'word',
    html: 'html',
    htm: 'html',
  };
  
  return typeMap[extension] || 'unknown';
}

/**
 * Extract basic entities from text (without AI)
 * This is a simple pattern-based extraction - can be enhanced with NLP later
 */
export function extractBasicEntities(text: string): {
  dates: string[];
  citations: string[];
  caseNumbers: string[];
  amounts: string[];
} {
  const entities = {
    dates: extractDates(text),
    citations: extractCitations(text),
    caseNumbers: extractCaseNumbers(text),
    amounts: extractAmounts(text),
  };
  
  return entities;
}

/**
 * Extract dates from text
 */
function extractDates(text: string): string[] {
  // Common date patterns
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{4}/g, // MM/DD/YYYY
    /\d{1,2}-\d{1,2}-\d{4}/g,   // MM-DD-YYYY
    /\d{4}-\d{2}-\d{2}/g,       // YYYY-MM-DD
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
  ];
  
  const dates: string[] = [];
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  });
  
  return [...new Set(dates)]; // Remove duplicates
}

/**
 * Extract legal citations
 */
function extractCitations(text: string): string[] {
  // Common citation patterns
  const citationPatterns = [
    /\d+\s+[A-Z][a-z]+\s+\d+/g, // e.g., "123 U.S. 456"
    /[A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+/gi, // e.g., "Smith v. Jones"
    /\[.*?\]\s+\d{4}/g, // e.g., "[2024] 1 AC 123"
  ];
  
  const citations: string[] = [];
  citationPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      citations.push(...matches);
    }
  });
  
  return [...new Set(citations)];
}

/**
 * Extract case numbers
 */
function extractCaseNumbers(text: string): string[] {
  // Common case number patterns
  const patterns = [
    /Case\s+No\.?\s*:?\s*[A-Z0-9-]+/gi,
    /Docket\s+No\.?\s*:?\s*[A-Z0-9-]+/gi,
    /[A-Z]{2,}-\d{4}-\d{6}/g, // e.g., "CV-2024-123456"
  ];
  
  const caseNumbers: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      caseNumbers.push(...matches.map(m => m.replace(/Case\s+No\.?\s*:?\s*/i, '').replace(/Docket\s+No\.?\s*:?\s*/i, '').trim()));
    }
  });
  
  return [...new Set(caseNumbers)];
}

/**
 * Extract monetary amounts
 */
function extractAmounts(text: string): string[] {
  // Currency amount patterns
  const patterns = [
    /\$[\d,]+\.?\d*/g,
    /USD\s*[\d,]+\.?\d*/gi,
    /[\d,]+\.?\d*\s*(?:dollars?|USD)/gi,
  ];
  
  const amounts: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      amounts.push(...matches);
    }
  });
  
  return [...new Set(amounts)];
}

/**
 * Process document text (main entry point)
 */
export function processDocumentText(
  text: string,
  fileName: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): ProcessedDocument {
  const metadata = extractTextMetadata(text, fileName);
  const chunks = chunkText(text, chunkSize, chunkOverlap);
  
  return {
    text,
    chunks,
    metadata,
  };
}
