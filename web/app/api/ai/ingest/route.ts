import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { processDocument } from '@/lib/ai/document-ingestion';
import { extractTextFromFile, isFileTypeSupported } from '@/lib/ai/file-parser';

const DOCUMENT_BUCKET = "case_files";

/**
 * POST /api/ai/ingest
 * 
 * Document ingestion endpoint for processing documents with AI
 * 
 * Request body (JSON):
 * - document_id: string (UUID)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const documentId = body.document_id;

    if (!documentId) {
      return NextResponse.json(
        { error: 'document_id is required' },
        { status: 400 }
      );
    }

    // Verify document exists and user has access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        matter_id,
        file_name,
        storage_path,
        firm_id,
        matters!inner(firm_id)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this firm
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.firm_id !== document.firm_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Download document from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .download(document.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: 'Failed to download document from storage' },
        { status: 500 }
      );
    }

    // Check if file type is supported
    if (!isFileTypeSupported(document.file_name)) {
      return NextResponse.json(
        { 
          success: false,
          error: `File type not supported: ${document.file_name.split('.').pop()}. Supported types: PDF, DOCX, TXT, RTF, HTML`,
          document_id: documentId,
        },
        { status: 400 }
      );
    }

    // Extract text from file
    // For PDF/DOCX, we'll try to extract text, but it may require external services
    const file = new File([fileData], document.file_name, { type: fileData.type });
    let text = '';
    
    try {
      // Try to extract text (works for text files)
      const parsedDocument = await extractTextFromFile(file, document.file_name);
      text = parsedDocument.text;
    } catch (error) {
      // If extraction fails (e.g., PDF/DOCX), we'll process with empty text
      // The document will still be stored, but won't have AI analysis until text is available
      console.warn(`Could not extract text from ${document.file_name}:`, error);
      text = ''; // Continue with empty text - document metadata will still be processed
    }

    // Allow processing even with empty text (for metadata extraction)
    // Users can add text content later or use external services for PDF/DOCX
    if (!text || text.trim().length === 0) {
      console.warn(`No text extracted from ${document.file_name}. Processing with empty text.`);
      // Continue processing - will extract basic metadata only
    }

    // Process document (chunking, entity extraction, graph construction)
    const result = await processDocument(
      documentId,
      text || '', // Use empty string if text extraction failed
      document.file_name,
      document.firm_id
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Document processing failed',
          document_id: documentId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document processed successfully',
      document_id: documentId,
      status: 'completed',
      entities_extracted: result.entitiesExtracted || 0,
      note: text ? undefined : 'Text extraction may require additional libraries for this file type',
    });
  } catch (error) {
    console.error('Error in AI ingest endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
