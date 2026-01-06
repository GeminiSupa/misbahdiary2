/**
 * File Parser Utilities (Vercel-Optimized)
 * Handles text file parsing - PDF/DOCX processing moved to API route
 */

export interface ParsedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
  };
}

/**
 * Extract text from a file (Vercel-friendly version)
 * For PDF/DOCX, we'll use an external service or API route
 */
export async function extractTextFromFile(file: File | Blob, fileName: string): Promise<ParsedDocument> {
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const fileType = file.type || getMimeType(fileExtension);

  try {
    let text = '';
    let pageCount: number | undefined;

    // Handle text files directly (lightweight)
    if (fileType.startsWith('text/') || fileExtension === 'txt') {
      text = await file.text();
    } else if (fileExtension === 'pdf' || fileExtension === 'docx') {
      // For PDF/DOCX, we'll need to process via API route
      // This prevents heavy dependencies in the main bundle
      throw new Error(
        `PDF and DOCX files need to be processed via the /api/ai/ingest endpoint. ` +
        `The file will be processed server-side.`
      );
    } else {
      // Try to read as text as fallback
      try {
        text = await file.text();
      } catch {
        throw new Error(`Unsupported file type: ${fileType || fileExtension}`);
      }
    }

    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const characterCount = text.length;

    return {
      text: text.trim(),
      metadata: {
        pageCount,
        wordCount,
        characterCount,
      },
    };
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    txt: 'text/plain',
    rtf: 'application/rtf',
    html: 'text/html',
    htm: 'text/html',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const supportedExtensions = ['pdf', 'docx', 'txt', 'rtf', 'html', 'htm'];
  return supportedExtensions.includes(extension);
}
