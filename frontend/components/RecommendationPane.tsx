"use client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Section = {
  section_title: string;
  page_number: number;
  importance_rank: number;
  document?: string;
};

type Snippet = { page_number: number; refined_text: string };

export default function RecommendationPane({
  sections,
  snippets,
  onJump,
}: {
  sections?: Section[];
  snippets?: Snippet[];
  onJump?: (page: number, document?: string, query?: string) => void;
}) {
  const getSnippet = (page: number) => snippets?.find((s) => s.page_number === page)?.refined_text;
  const list = (sections || []).slice(0, 3);
  
  return (
    <div className="bg-card rounded-2xl border-2 border-border shadow-lg overflow-hidden">
      <div className="border-b border-border bg-muted px-6 py-4">
        <h3 className="text-lg font-semibold text-black dark:text-foreground">Contextual Recommendations</h3>
        <p className="text-sm text-black/70 dark:text-foreground/80 mt-1">AI-powered insights from your documents</p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-6 space-y-4">
          {list.length > 0 ? (
            list.map((s, i) => (
              <Card key={i} className="rounded-xl border-2 border-border shadow-md hover:shadow-lg transition-all duration-200 p-4 space-y-3 bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight mb-2 text-black dark:text-foreground">
                      {s.section_title}
                    </h4>
                    {getSnippet(s.page_number) && (
                      <p className="text-xs text-black/80 dark:text-foreground/90 leading-relaxed line-clamp-3">
                        {getSnippet(s.page_number)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                      #{s.importance_rank}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      onClick={() => onJump?.(s.page_number, s.document, s.section_title)}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Page {s.page_number}
                    </button>
                  </div>
                </div>
                
                {s.document && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <svg className="w-3 h-3 text-foreground/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs text-foreground/90 truncate" title={s.document}>
                      {s.document}
                    </span>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium mb-1">No Recommendations Yet</h4>
              <p className="text-xs text-muted-foreground">Run analysis to get AI-powered insights</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

