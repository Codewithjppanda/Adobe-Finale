"use client";
import { ScrollArea } from "@/components/ui/scroll-area";

type Item = { level: string; text: string; page: number };

export default function OutlineSidebar({ items, onJump }: { items: Item[]; onJump?: (page: number) => void }) {
  return (
    <div className="bg-card rounded-2xl border-2 border-border shadow-lg overflow-hidden">
      <div className="border-b border-border bg-muted px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Document Outline</h3>
        <p className="text-sm text-foreground/80 mt-1">Navigate through document sections</p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-6">
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group border-2 border-transparent hover:border-white/80 hover:bg-white/5 cursor-pointer"
                  onClick={() => onJump?.(item.page)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium bg-blue-200 text-blue-900 group-hover:bg-blue-300 group-hover:text-blue-900 transition-colors duration-200">
                        {item.page}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground bg-muted px-2 py-1 rounded-full">
                          {item.level}
                        </span>
                      </div>
                  <p className="text-sm text-foreground leading-relaxed group-hover:text-foreground transition-colors duration-200">
                        {item.text}
                      </p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium mb-1">No Outline Available</h4>
              <p className="text-xs text-muted-foreground">Upload a document to see its structure</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


