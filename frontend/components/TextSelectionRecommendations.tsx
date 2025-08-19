"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { getTextSelectionRecommendations } from "@/lib/api";

type Recommendation = {
  docId: string;
  filename: string;
  page: number;
  title: string;
  snippet: string;
  relevance_score: number;
  reasoning: string;
};

interface TextSelectionRecommendationsProps {
  selectedText: string;
  currentDocId: string;
  onJumpToPage: (page: number, docId?: string) => void;
  onClearSelection?: () => void;
  visible: boolean;
}

export default function TextSelectionRecommendations({
  selectedText,
  currentDocId,
  onJumpToPage,
  onClearSelection,
  visible,
}: TextSelectionRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedText.trim() && visible) {
      fetchRecommendations();
    }
  }, [selectedText, currentDocId, visible]);

  const fetchRecommendations = async () => {
    if (!selectedText.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getTextSelectionRecommendations({
        selected_text: selectedText,
        current_doc_id: currentDocId,
        max_recommendations: 5,
      });
      
      setRecommendations(result.recommendations);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to fetch recommendations. Please try again.");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !selectedText.trim()) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl border-2 border-border shadow-lg overflow-hidden">
              <div className="border-b border-border bg-muted px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-foreground">
                Text Selection Recommendations
              </h3>
              <p className="text-sm text-black/70 dark:text-foreground/80 mt-1">
                AI-powered insights based on your selection
              </p>
            </div>
            {onClearSelection && (
              <Button 
                onClick={onClearSelection}
                className="text-xs bg-transparent border border-border hover:bg-muted px-3 py-1"
              >
                Clear Selection
              </Button>
            )}
          </div>
          <div className="mt-2 p-2 bg-background rounded border text-xs">
            <span className="font-medium">Selected:</span> "{selectedText.substring(0, 100)}
            {selectedText.length > 100 ? "..." : ""}"
          </div>
        </div>
      
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-muted-foreground">Analyzing your selection...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium mb-1 text-destructive">Error</h4>
              <p className="text-xs text-muted-foreground mb-3">{error}</p>
              <Button onClick={fetchRecommendations} className="bg-transparent border border-border hover:bg-muted px-3 py-1 text-sm">
                Retry
              </Button>
            </div>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <Card key={i} className="rounded-xl border-2 border-border shadow-md hover:shadow-lg transition-all duration-200 p-4 space-y-3 bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight mb-2 text-black dark:text-foreground">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-black/80 dark:text-foreground/90 leading-relaxed line-clamp-3 mb-2">
                      {rec.snippet}
                    </p>
                    {rec.reasoning && (
                      <p className="text-xs text-muted-foreground italic">
                        {rec.reasoning}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                      {Math.round(rec.relevance_score * 100)}%
                    </span>
                    <Button
                      onClick={() => onJumpToPage(rec.page, rec.docId)}
                      className="text-xs bg-transparent border border-border hover:bg-muted px-3 py-1"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Page {rec.page}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <svg className="w-3 h-3 text-foreground/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs text-foreground/90 truncate" title={rec.filename}>
                    {rec.filename}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium mb-1">No Recommendations Found</h4>
              <p className="text-xs text-muted-foreground">Try selecting different text or check your document library</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
