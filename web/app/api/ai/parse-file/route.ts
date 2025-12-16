import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/ai/parse-file
 * 
 * Server-side file parsing endpoint for PDF/DOCX
 * This runs on Vercel serverless functions where we can use heavier libraries
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    let text = '';
    let metadata: { pageCount?: number; wordCount: number; characterCount: number } = {
      wordCount: 0,
      characterCount: 0,
    };

    // For now, we'll handle text files and return error for PDF/DOCX
    // PDF/DOCX parsing can be added later with a service like:
    // - Vercel Blob with text extraction
    // - External API service
    // - Or install pdf-parse/mammoth only in this API route (they'll be bundled separately)

    if (fileExtension === 'txt' || file.type.startsWith('text/')) {
      text = await file.text();
      metadata.wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      metadata.characterCount = text.length;
    } else if (fileExtension === 'pdf') {
      // PDF parsing - would need pdf-parse here
      // For now, return error suggesting to use text files
      return NextResponse.json(
        { 
          error: 'PDF parsing not yet implemented. Please convert to text file or use a PDF text extraction service.',
          supported_formats: ['txt', 'text files']
        },
        { status: 501 }
      );
    } else if (fileExtension === 'docx') {
      // DOCX parsing - would need mammoth here
      return NextResponse.json(
        { 
          error: 'DOCX parsing not yet implemented. Please convert to text file or use a DOCX text extraction service.',
          supported_formats: ['txt', 'text files']
        },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileExtension}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      metadata,
    });
  } catch (error) {
    console.error('Error parsing file:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
