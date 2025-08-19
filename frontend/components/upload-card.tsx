"use client";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onFiles: (files: FileList | File[]) => void;
  accept?: string;
  title?: string;
  subtitle?: string;
};

export default function UploadCard({ onFiles, accept = "application/pdf", title = "Upload PDFs", subtitle = "Drag & drop or click to browse" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsOver(false);
      const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type === "application/pdf");
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const onBrowse = () => inputRef.current?.click();

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
        isOver 
          ? "border-blue-400 bg-blue-500/10" 
          : "border-border hover:border-ring bg-muted/30"
      }`}
    >
      <div className="p-8 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
        </div>
        
        <div className="space-y-3">
          <input 
            ref={inputRef} 
            type="file" 
            className="hidden" 
            accept={accept} 
            multiple 
            onChange={(e) => e.target.files && onFiles(e.target.files)} 
          />
          <Button 
            onClick={onBrowse} 
            className="font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Choose Files
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Supports multiple PDF files • Max 50MB per file
          </p>
        </div>
      </div>
      
      {isOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-400 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-500 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-blue-700">Drop files here</p>
          </div>
        </div>
      )}
    </div>
  );
}


