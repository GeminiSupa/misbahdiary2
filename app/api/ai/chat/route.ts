import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AI_CONFIG, validateAIConfig } from '@/lib/ai/config';
import { generateRAGResponse, isLLMAvailable } from '@/lib/ai/llm';
import { retrieveRAGContext } from '@/lib/ai/rag-retrieval';
import type { AIQuery, AIResponse } from '@/lib/ai/types';

/**
 * POST /api/ai/chat
 * 
 * Main chat endpoint for AI RAG Assistant
 * 
 * Request body:
 * {
 *   query: string;
 *   matter_id?: string;
 *   context?: Record<string, any>;
 *   query_type?: 'chat' | 'analyze' | 'draft' | 'research';
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration
    const configValidation = validateAIConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        { error: 'AI configuration invalid', details: configValidation.errors },
        { status: 500 }
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile and firm
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, firm_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.firm_id) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body: AIQuery = await request.json();
    const { query, matter_id, context, query_type = 'chat' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Implement RAG logic
    let response: AIResponse;
    let contextChunks: string[] = [];
    let sources: AIResponse['sources'] = [];

    if (isLLMAvailable()) {
      try {
        // Retrieve relevant context using vector similarity search
        const ragContext = await retrieveRAGContext(query, profile.firm_id, {
          matterId: matter_id,
          maxChunks: AI_CONFIG.vector.top_k,
        });

        contextChunks = ragContext.chunks.map(c => c.text);
        sources = ragContext.chunks.map(c => c.source);

        // Generate response using LLM with retrieved context
        const systemPrompt = `You are an AI legal research assistant for a law firm. You help lawyers by:
- Analyzing legal documents and case files
- Finding relevant precedents and citations
- Answering questions about legal matters
- Providing insights based on case documents

Use the provided context from documents to answer questions accurately. If the context doesn't contain enough information, say so clearly. Always cite your sources when referencing specific documents or cases.

Be concise but thorough. Focus on actionable insights for legal practice.`;

        const llmResponse = await generateRAGResponse(
          query,
          contextChunks,
          systemPrompt
        );

        response = {
          response: llmResponse,
          sources,
          confidence: contextChunks.length > 0 ? 0.8 : 0.5,
        };
      } catch (error) {
        console.error('Error in RAG retrieval or LLM generation:', error);
        // Fallback response
        response = {
          response: `I encountered an error processing your query. Please try again. If the problem persists, check that your OpenAI API key is configured correctly.`,
          sources: [],
          confidence: 0.3,
        };
      }
    } else {
      // No LLM available - return informative message
      response = {
        response: `I understand you're asking: "${query}". To get AI-powered responses, please configure your OPENAI_API_KEY in the environment variables. The system is ready to process your query once the API key is set up.`,
        sources: [],
        confidence: 0.5,
      };
    }

    // Log query to history
    const { data: queryHistory, error: historyError } = await supabase
      .from('ai_query_history' as any)
      .insert({
        firm_id: profile.firm_id,
        user_id: user.id,
        matter_id: matter_id || null,
        query,
        response: response.response,
        sources: response.sources,
        query_type,
        metadata: context || {},
      })
      .select()
      .single();

    if (historyError) {
      console.error('Error logging query history:', historyError);
    }

    return NextResponse.json({
      ...response,
      query_id: queryHistory?.id,
    });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
