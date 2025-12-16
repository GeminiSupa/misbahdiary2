"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentAnalysisCardProps {
  documentId: string;
  fileName: string;
  className?: string;
}

interface AnalysisData {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: string;
  entitiesExtracted?: number;
  processedAt?: string;
  error?: string;
}

export function DocumentAnalysisCard({ documentId, fileName, className }: DocumentAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadAnalysisStatus();
  }, [documentId]);

  const loadAnalysisStatus = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/analysis`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessDocument = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_id: documentId }),
      });

      if (response.ok) {
        // Reload analysis status
        await loadAnalysisStatus();
      } else {
        console.error('Failed to process document');
      }
    } catch (error) {
      console.error('Error processing document:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading analysis...</span>
        </div>
      </Card>
    );
  }

  const statusConfig = {
    pending: { icon: FileText, color: "text-muted-foreground", label: "Not Processed" },
    processing: { icon: Loader2, color: "text-primary", label: "Processing...", spinning: true },
    completed: { icon: CheckCircle, color: "text-green-600", label: "Analyzed" },
    failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  };

  const status = analysis?.status || 'pending';
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">AI Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.color, config.spinning && "animate-spin")} />
          <span className={cn("text-xs", config.color)}>{config.label}</span>
        </div>
      </div>

      {status === 'pending' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Process this document to extract entities, create summaries, and enable AI-powered search.
          </p>
          <Button
            onClick={handleProcessDocument}
            disabled={isProcessing}
            size="sm"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3 w-3" />
                Process Document
              </>
            )}
          </Button>
        </div>
      )}

      {status === 'processing' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Document is being processed. This may take a few moments...
          </p>
        </div>
      )}

      {status === 'completed' && analysis && (
        <div className="space-y-3">
          {analysis.summary && (
            <div>
              <p className="text-xs font-semibold mb-1">Summary</p>
              <p className="text-xs text-muted-foreground line-clamp-3">{analysis.summary}</p>
            </div>
          )}
          {analysis.entitiesExtracted !== undefined && (
            <div>
              <p className="text-xs font-semibold mb-1">Entities Extracted</p>
              <p className="text-xs text-muted-foreground">{analysis.entitiesExtracted} entities found</p>
            </div>
          )}
          {analysis.processedAt && (
            <p className="text-xs text-muted-foreground">
              Processed {new Date(analysis.processedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">
            {analysis?.error || 'Processing failed. Please try again.'}
          </p>
          <Button
            onClick={handleProcessDocument}
            disabled={isProcessing}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Retry Processing
          </Button>
        </div>
      )}
    </Card>
  );
}
