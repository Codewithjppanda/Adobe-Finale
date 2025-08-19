"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PdfEmbed from "@/components/PdfEmbed";
import { docUrl, extractOutline, searchIngest, searchQuery, clearAllStorage } from "@/lib/api";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import RelatedPanel from "@/components/RelatedPanel";
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Search } from "lucide-react";

type Match = { 
  docId: string; 
  filename: string; 
  page: number; 
  title: string; 
  snippet: string; 
  score: number;
  pdf_name?: string;
  section_heading?: string;
  section_content?: string;
  section_id?: string;
};

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

type DocumentItem = {
  name: string;
  docId: string;
  type: "bulk" | "fresh";
  status: UploadStatus;
  error?: string;
};

export default function ReaderPage() {
  const [currentDocId, setCurrentDocId] = useState<string>("");
  const [api, setApi] = useState<any>(null);
  const [library, setLibrary] = useState<DocumentItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selection, setSelection] = useState<string>("");
  const [bulkUploadStatus, setBulkUploadStatus] = useState<UploadStatus>("idle");
  const [freshUploadStatus, setFreshUploadStatus] = useState<UploadStatus>("idle");
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const freshFileInputRef = useRef<HTMLInputElement>(null);
  
  // Enhanced selection feedback states
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found" | "no-results">("idle");
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Refresh functionality state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Debug state for selection detection


  // Refresh functionality - clear all storage and reset
  const onRefresh = async () => {
    if (isRefreshing) return;
    
    const confirmRefresh = window.confirm(
      "This will delete all uploaded PDFs (bulk, fresh, and viewer) and reset the semantic index. Are you sure?"
    );
    
    if (!confirmRefresh) return;
    
    setIsRefreshing(true);
    try {
      const result = await clearAllStorage();
      console.log("Storage cleared:", result);
      
      // Reset all local state
      setLibrary([]);
      setMatches([]);
      setSelection("");
      setCurrentDocId("");
      setBulkUploadStatus("idle");
      setFreshUploadStatus("idle");
      setProcessingFiles([]);
      setSearchStatus("idle");
      setIsSearching(false);
      
      // Clear file inputs
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
      if (freshFileInputRef.current) freshFileInputRef.current.value = "";
      
      alert(`Successfully cleared ${result.files_removed} files and reset the system!`);
      
    } catch (error) {
      console.error("Error during refresh:", error);
      alert("Failed to clear storage. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Bulk PDF upload for indexing
  const onBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setBulkUploadStatus("uploading");
    setProcessingFiles(files.map(f => f.name));
    
    try {
      // First, ingest into semantic index with bulk storage type
      await searchIngest({ files, storage_type: "bulk" });
      setBulkUploadStatus("processing");
      
      // Process each file to get proper docId and add to library
      const newDocuments: DocumentItem[] = [];
      for (const file of files) {
        try {
          const result = await extractOutline({ file, storage_type: "bulk" });
          newDocuments.push({
            name: file.name,
            docId: result.docId,
            type: "bulk",
            status: "success"
          });
        } catch (error) {
          newDocuments.push({
            name: file.name,
            docId: `error-${Date.now()}-${Math.random()}`, // Ensure unique ID even for errors
            type: "bulk",
            status: "error",
            error: "Failed to process"
          });
        }
      }
      
      // Filter out any potential duplicates before adding to library
      setLibrary(prev => {
        const existingKeys = new Set(prev.map(d => `${d.type}-${d.docId}`));
        const filteredNew = newDocuments.filter(d => !existingKeys.has(`${d.type}-${d.docId}`));
        return [...filteredNew, ...prev];
      });
      setBulkUploadStatus("success");
      
      // Auto-reset status after 2 seconds
      setTimeout(() => setBulkUploadStatus("idle"), 2000);
      
    } catch (error) {
      setBulkUploadStatus("error");
      setTimeout(() => setBulkUploadStatus("idle"), 3000);
    } finally {
      setProcessingFiles([]);
    }
  };

  // Fresh PDF upload for immediate reading
  const onFreshUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const file = files[0]; // Only take the first file for fresh upload
    setFreshUploadStatus("uploading");
    
    try {
      // Ingest into semantic index with fresh storage type
      await searchIngest({ files: [file], storage_type: "fresh" });
      setFreshUploadStatus("processing");
      
      // Extract to get proper docId and set as current document
      const result = await extractOutline({ file, storage_type: "fresh" });
      setCurrentDocId(result.docId);
      
      // Add to library
      const newDoc: DocumentItem = {
        name: file.name,
        docId: result.docId,
        type: "fresh",
        status: "success"
      };
      
      // Filter out any potential duplicates before adding to library
      setLibrary(prev => {
        const existingKeys = new Set(prev.map(d => `${d.type}-${d.docId}`));
        const uniqueKey = `${newDoc.type}-${newDoc.docId}`;
        if (existingKeys.has(uniqueKey)) {
          return prev; // Don't add if duplicate
        }
        return [newDoc, ...prev];
      });
      setFreshUploadStatus("success");
      
      // Auto-reset status after 2 seconds
      setTimeout(() => setFreshUploadStatus("idle"), 2000);
      
    } catch (error) {
      setFreshUploadStatus("error");
      setTimeout(() => setFreshUploadStatus("idle"), 3000);
    }
  };



  // Text selection handler function (moved outside useEffect for reusability)
  const handleTextSelection = async (selectedText: string) => {
    try {
      const expanded = selectedText.trim();
      
      // Clear previous search timer
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
      
      setSelection(expanded);
      
      // If selection is too short, clear results
      if (!expanded || expanded.length < 3) {
        setMatches([]);
        setSearchStatus("idle");
        return;
      }
      
      // Show immediate feedback that search is triggered
      setIsSearching(true);
      setSearchStatus("searching");
      setLastSearchTime(new Date());
      
      console.log(`🎯 Text selected: "${expanded.substring(0, 100)}..."`);
      
      // Fast debounce for immediate response
      const timer = setTimeout(async () => {
        try {
          const startTime = Date.now();
          console.log(`🔍 Searching for: "${expanded.substring(0, 100)}..."`);
          
          const res = await searchQuery({ text: expanded, k: 5 });
          const searchTime = Date.now() - startTime;
          
          const matches = res.matches || [];
          setMatches(matches);
          
          console.log(`✅ Search completed in ${searchTime}ms, found ${matches.length} matches`);
          
          // Show results status with timing
          if (matches.length > 0) {
            setSearchStatus("found");
            console.log("📄 Matches:", matches.map(m => ({
              pdf: m.pdf_name || m.filename,
              section: m.section_heading || m.title,
              score: m.score
            })));
          } else {
            setSearchStatus("no-results");
            console.log("❌ No semantic matches found");
          }
          
          // Auto-reset status after showing feedback
          setTimeout(() => {
            setSearchStatus("idle");
          }, 3000);
          
        } catch (error) {
          console.error("❌ Search failed:", error);
          setMatches([]);
          setSearchStatus("no-results");
          setTimeout(() => setSearchStatus("idle"), 3000);
        } finally {
          setIsSearching(false);
        }
      }, 150); // Reduced to 150ms for faster response
      
      setSearchDebounceTimer(timer);
      
    } catch (e) {
      console.error("Selection handler error:", e);
      setIsSearching(false);
      setSearchStatus("idle");
    }
  };

  // Simple fallback text selection detector (PdfEmbed handles the main detection)
  useEffect(() => {
    console.log("🎯 PDF text selection now handled by PdfEmbed component");
    
    // Keep a simple fallback for non-PDF text selection
    const handleFallbackSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";
      
      if (selectedText && selectedText.length > 3) {
        const timestamp = new Date().toLocaleTimeString();
        console.log("🔄 Fallback selection detected:", selectedText.substring(0, 50));
      }
    };
    
    document.addEventListener('selectionchange', handleFallbackSelection);
    
      return () => {
      document.removeEventListener('selectionchange', handleFallbackSelection);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold">Document Intelligence</Link>
            <span className="text-muted-foreground">/ Reader</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Bulk Upload */}
            <div className="flex items-center gap-2">
              <input 
                ref={bulkFileInputRef} 
                type="file" 
                accept="application/pdf" 
                multiple 
                className="hidden" 
                onChange={onBulkUpload} 
              />
              <Button 
                className="border border-border bg-background text-foreground hover:bg-muted rounded-xl gap-2" 
                onClick={() => bulkFileInputRef.current?.click()} 
                disabled={bulkUploadStatus !== "idle"}
              >
                <Upload className="w-4 h-4" />
                <AnimatePresence mode="wait">
                  {bulkUploadStatus === "idle" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="idle"
                    >
                      Bulk Upload
                    </motion.span>
                  )}
                  {bulkUploadStatus === "uploading" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="uploading"
                    >
                      Uploading...
                    </motion.span>
                  )}
                  {bulkUploadStatus === "processing" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="processing"
                    >
                      Processing...
                    </motion.span>
                  )}
                  {bulkUploadStatus === "success" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="success"
                      className="text-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </motion.span>
                  )}
                  {bulkUploadStatus === "error" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="error"
                      className="text-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>

            {/* Fresh Upload */}
          <div className="flex items-center gap-2">
              <input 
                ref={freshFileInputRef} 
                type="file" 
                accept="application/pdf" 
                className="hidden" 
                onChange={onFreshUpload} 
              />
              <Button 
                className="rounded-xl gap-2" 
                onClick={() => freshFileInputRef.current?.click()} 
                disabled={freshUploadStatus !== "idle"}
              >
                <FileText className="w-4 h-4" />
                <AnimatePresence mode="wait">
                  {freshUploadStatus === "idle" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="idle"
                    >
                      Upload & Read
                    </motion.span>
                  )}
                  {freshUploadStatus === "uploading" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="uploading"
                    >
                      Uploading...
                    </motion.span>
                  )}
                  {freshUploadStatus === "processing" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="processing"
                    >
                      Processing...
                    </motion.span>
                  )}
                  {freshUploadStatus === "success" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="success"
                      className="text-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </motion.span>
                  )}
                  {freshUploadStatus === "error" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key="error"
                      className="text-red-600"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
            
            {/* Refresh Button */}
            <Button
              className="border border-border bg-background text-foreground hover:bg-muted rounded-xl gap-2 h-8 px-3 text-xs"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Clearing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Upload Progress Animation */}
        <AnimatePresence>
          {(bulkUploadStatus === "uploading" || bulkUploadStatus === "processing") && processingFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t bg-muted/30 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="text-sm font-medium mb-2">
                  Processing {processingFiles.length} file(s)...
                </div>
                <div className="space-y-1">
                  {processingFiles.map((filename, index) => (
                    <motion.div
                      key={filename}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      {filename}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[16rem_1fr_20rem]">
        <aside className="space-y-3">
          <h3 className="text-sm font-semibold">Library</h3>
          <div className="space-y-2 text-sm">
            <AnimatePresence>
              {library.map((d, index) => (
                <motion.div
                  key={`${d.type}-${d.docId || d.name}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-2 rounded-lg border transition-colors ${
                    currentDocId === d.docId ? 'bg-accent' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {d.status === "success" && <CheckCircle className="w-3 h-3 text-green-600" />}
                      {d.status === "error" && <AlertCircle className="w-3 h-3 text-red-600" />}
                      {d.status === "processing" && <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />}
                      {d.status === "uploading" && <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />}
                    </div>
                    <button 
                      className="flex-1 text-left truncate hover:text-foreground"
                      onClick={() => d.docId && setCurrentDocId(d.docId)}
                      disabled={!d.docId}
                    >
                      {d.name}
                    </button>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      d.type === "fresh" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {d.type}
                    </span>
                  </div>
                  {d.error && (
                    <div className="mt-1 text-xs text-red-600">
                      {d.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {library.length === 0 && (
              <div className="text-muted-foreground p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Upload PDFs to build your library</p>
                <p className="text-xs mt-1">Use "Bulk Upload" for reference docs or "Upload & Read" for immediate reading</p>
              </div>
            )}
          </div>

        </aside>

        <section className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-border shadow-2xl overflow-hidden">
          {currentDocId ? (
            <div className="h-[85vh] relative">
              <PdfEmbed 
                url={docUrl(currentDocId)} 
                onReady={setApi}
                onTextSelection={(text) => {
                  console.log("🎯 PDF Text Selection detected:", text);
                  handleTextSelection(text);
                }}
                className="w-full h-full"
              />
              {/* Professional overlay for branding */}
              <div className="absolute top-4 right-4 bg-black/10 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 pointer-events-none">
                Document Intelligence
              </div>
            </div>
          ) : (
            <div className="h-[85vh] grid place-items-center text-muted-foreground bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Ready to analyze documents</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Upload a PDF using the buttons above to start reading and discovering insights</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-3">
          
          {/* Find Relevant Content Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Button 
              className="border border-border bg-background text-foreground hover:bg-muted h-8 px-3 text-xs w-full gap-2 hover:scale-105 transition-transform"
              onClick={() => {
                // Try to get selection from Adobe PDF API directly
                console.log("🔍 Finding relevant content using Adobe API...");
                
                if (api) {
                  try {
                    if ((api as any).getSelectedContent) {
                      (api as any).getSelectedContent()
                        .then((result: any) => {
                          console.log("✅ Adobe getSelectedContent result:", result);
                          const text = result?.data || "";
                          if (text && text.trim()) {
                            handleTextSelection(text.trim());
                          } else {
                            // Fallback: use sample search if no selection
                            handleTextSelection("appetizer cheese mozzarella");
                          }
                        })
                        .catch((error: any) => {
                          console.log("❌ Adobe API failed:", error);
                          // Fallback to sample search
                          handleTextSelection("appetizer cheese mozzarella");
                        });
                    } else {
                      console.log("⚠️ getSelectedContent not available");
                      handleTextSelection("appetizer cheese mozzarella");
                    }
                  } catch (e) {
                    console.log("⚠️ Error:", e);
                    handleTextSelection("appetizer cheese mozzarella");
                  }
                } else {
                  handleTextSelection("appetizer cheese mozzarella");
                }
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
              >
                <Search className="w-3 h-3" />
              </motion.div>
              Find Relevant Content
            </Button>
          </motion.div>
          
          {/* Selection Status Banner */}
          <AnimatePresence>
            {selection && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="p-3 rounded-lg border bg-blue-50 border-blue-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-blue-900">
                    Selected: "{selection.substring(0, 50)}{selection.length > 50 ? '...' : ''}"
                  </span>
                </div>
                
                <AnimatePresence mode="wait">
                  {searchStatus === "searching" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key="searching"
                      className="flex items-center gap-2 text-blue-600"
                    >
                      <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Searching for related sections...</span>
                    </motion.div>
                  )}
                  
                  {searchStatus === "found" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key="found"
                      className="flex items-center gap-2 text-green-600"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-xs">Found {matches.length} related section{matches.length !== 1 ? 's' : ''}</span>
                    </motion.div>
                  )}
                  
                  {searchStatus === "no-results" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key="no-results"
                      className="flex items-center gap-2 text-orange-600"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">No related sections found</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <RelatedPanel
            matches={matches}
            selection={selection}
            isSearching={isSearching}
            searchStatus={searchStatus}
            onOpen={(m) => {
              setCurrentDocId(m.docId);
              setTimeout(() => api?.gotoLocation?.(m.page), 150);
            }}
          />
        </aside>
      </main>
    </div>
  );
}


