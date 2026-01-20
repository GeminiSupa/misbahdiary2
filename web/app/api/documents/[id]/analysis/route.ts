import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/documents/[id]/analysis
 * Get document analysis status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document with processing status
    // Note: AI columns may not be in TypeScript types, using type assertion
    // Cast supabase to any so we can select AI columns even if types are outdated
    const { data: documentData, error: docError } = await (supabase as any)
      .from('documents')
      .select(
        `
        id,
        file_name,
        ai_processed,
        ai_processing_status,
        ai_processed_at,
        ai_extracted_entities,
        ai_summary
      `,
      )
      .eq('id', documentId)
      .single();

    if (docError || !documentData) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = documentData as any;

    return NextResponse.json({
      status: document.ai_processing_status || 'pending',
      summary: document.ai_summary || undefined,
      entitiesExtracted: Array.isArray(document.ai_extracted_entities) 
        ? document.ai_extracted_entities.length 
        : 0,
      processedAt: document.ai_processed_at || undefined,
    });
  } catch (error) {
    console.error('Error fetching document analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
