"use client";
import { useEffect, useState } from "react";
import { addViewerNewDocs, loadViewerNewDocs } from "@/lib/storage";
import PdfEmbed from "@/components/PdfEmbed";
import OutlineSidebar from "@/components/OutlineSidebar";
import RecommendationPane from "@/components/RecommendationPane";
import { extractOutline, personaAnalyze, docUrl, deleteDocs, deleteDocsBeacon } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UploadCard from "@/components/upload-card";
import FilesList from "@/components/files-list";
import PersonaForm from "@/components/persona-form";
import ResultsPanel from "@/components/results-panel";
import { useLocalFiles } from "@/lib/hooks/useLocalFiles";
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";
import { Pointer } from "@/components/magicui/pointer";

export default function NewViewer() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileByName, setFileByName] = useState<Map<string, File>>(new Map());
  const [docNameToDocId, setDocNameToDocId] = useState<Map<string, string>>(new Map());
  const [docIdToUrl, setDocIdToUrl] = useState<Map<string, string>>(new Map());
  const [docIdToName, setDocIdToName] = useState<Map<string, string>>(new Map());
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentDocName, setCurrentDocName] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [outline, setOutline] = useState<any[]>([]);
  const [persona, setPersona] = useState("");
  const [job, setJob] = useState("");
  const [api, setApi] = useState<any>(null);
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [lastJumpPage, setLastJumpPage] = useState<number | null>(null);
  const [hits, setHits] = useState<any[]>([]);
  const [snippets, setSnippets] = useState<any[]>([]);
  const { files: localFiles, addMany: addLocalFiles, remove: removeLocalFile, clear: clearLocalFiles } = useLocalFiles();
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (api && pendingPage) {
      api.gotoLocation(pendingPage);
      setPendingPage(null);
    }
  }, [api, pendingPage]);

  // Restore previously uploaded docs for this session (treated like cache)
  useEffect(() => {
    const persisted = loadViewerNewDocs();
    if (!persisted || persisted.length === 0) return;
    
    // Verify which documents actually exist on the backend before restoring
    (async () => {
      const validDocs: { docId: string; name: string }[] = [];
      const nameToId = new Map<string, string>();
      const idToUrl = new Map<string, string>();
      const idToName = new Map<string, string>();
      
      for (const d of persisted) {
        try {
          // Check if document exists by trying to get its outline
          await extractOutline({ docId: d.docId });
          // If successful, document exists
          validDocs.push(d);
          nameToId.set(`${d.docId}.pdf`, d.docId);
          idToUrl.set(d.docId, docUrl(d.docId));
          idToName.set(d.docId, d.name);
        } catch (e) {
          // Document doesn't exist on backend, skip it
          console.log(`Document ${d.docId} no longer exists on backend, skipping`);
        }
      }
      
      // Update state with only valid documents
      setDocNameToDocId(nameToId);
      setDocIdToUrl(idToUrl);
      setDocIdToName(idToName);
      
      // Update localStorage to only contain valid documents
      if (validDocs.length !== persisted.length) {
        // Clear and re-add only valid docs
        const { clearViewerNewDocs, addViewerNewDocs } = await import("@/lib/storage");
        clearViewerNewDocs();
        if (validDocs.length > 0) {
          addViewerNewDocs(validDocs);
        }
      }

      // Also reconcile the local files UI with valid server docs
      try {
        const allowedNames = new Set(validDocs.map((d) => d.name));
        for (const lf of localFiles) {
          if (!allowedNames.has(lf.name)) removeLocalFile(lf.name);
        }
      } catch {}
    })();
  // include localFiles/removeLocalFile in deps to avoid stale closure; this still runs only once effectively
  }, [removeLocalFile, localFiles]);

  // On unload or navigation, delete uploaded PDFs on the server and clear local state
  useEffect(() => {
    const handler = () => {
      try {
        const docs = loadViewerNewDocs();
        const docIds = docs.map((d) => d.docId);
        if (docIds.length > 0) {
          console.log(`Deleting ${docIds.length} documents on unload:`, docIds);
          deleteDocsBeacon(docIds);
        }
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
      
      try {
        // Clear local UI caches so the page starts clean on next load
        clearLocalFiles();
        const { clearViewerNewDocs } = require("@/lib/storage");
        clearViewerNewDocs();
      } catch (e) {
        console.error("Error clearing local storage:", e);
      }
    };

    // Handle page hide (navigation, refresh, close)
    window.addEventListener("pagehide", handler);
    
    // Handle before unload (refresh, close)
    window.addEventListener("beforeunload", handler);
    
    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handler();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handler);
      window.removeEventListener("beforeunload", handler);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Enable analysis as long as there is at least one document; form will validate persona/job
  const canAnalyze = (files.length > 0 || loadViewerNewDocs().length > 0);

  const onPickFiles = (fl: FileList) => {
    const newFiles = Array.from(fl || []);
    // Accumulate files instead of replacing them
    const allFiles = [...files, ...newFiles];
    setFiles(allFiles);
    try { addLocalFiles(newFiles as File[]); } catch {}
    
    const map = new Map<string, File>();
    allFiles.forEach((f) => map.set(f.name, f));
    setFileByName(map);
    
    // Pre-index each new file to obtain its docId and a stable URL
    (async () => {
      const newDocNameToDocId = new Map(docNameToDocId);
      const newDocIdToUrl = new Map(docIdToUrl);
      const newDocIdToName = new Map(docIdToName);
      const added: { docId: string; name: string }[] = [];
      
      for (const f of newFiles) {
        try {
          const data = await extractOutline({ file: f });
          const docId = data.docId;
          const docName = `${docId}.pdf`;
          newDocNameToDocId.set(docName, docId);
          newDocIdToUrl.set(docId, (await import("@/lib/api")).docUrl(docId));
          newDocIdToName.set(docId, f.name);
          added.push({ docId, name: f.name });
        } catch (e) {
          // ignore indexing errors per-file
          console.error(`Failed to process file ${f.name}:`, e);
        }
      }
      
      setDocNameToDocId(newDocNameToDocId);
      setDocIdToUrl(newDocIdToUrl);
      setDocIdToName(newDocIdToName);
      
      if (added.length) {
        // Session-only: behave like cache (do not save to long-term library)
        addViewerNewDocs(added);
      }
    })();
  };
  const removeByName = async (name: string) => {
    try { removeLocalFile(name); } catch {}
    const entries = loadViewerNewDocs();
    const matching = entries.find((e) => e.name === name);
    if (matching) {
      try { await deleteDocs([matching.docId]); } catch {}
      const remaining = entries.filter((e) => e.name !== name);
      const { clearViewerNewDocs, addViewerNewDocs } = await import("@/lib/storage");
      clearViewerNewDocs();
      if (remaining.length) addViewerNewDocs(remaining);
      setDocIdToName((prev) => { const next = new Map(prev); next.delete(matching.docId); return next; });
    }
  };

  const openFile = async (f: File, page?: number) => {
    setCurrentFile(f);
    setCurrentDocName(f.name);
    const data = await extractOutline({ file: f });
    const docId = data.docId;
    const url = (await import("@/lib/api")).docUrl(docId);
    // Reset API to ensure jump waits for new viewer instance
    setApi(null);
    setPdfUrl(url);
    setDocNameToDocId((prev) => {
      const next = new Map(prev);
      next.set(`${docId}.pdf`, docId);
      return next;
    });
    setDocIdToUrl((prev) => {
      const next = new Map(prev);
      next.set(docId, url);
      return next;
    });
    setDocIdToName((prev) => {
      const next = new Map(prev);
      next.set(docId, f.name);
      return next;
    });
    setOutline(data.outline || []);
    if (page) {
      setPendingPage(page);
      setLastJumpPage(page);
    }
  };

  const openByDocName = async (docName: string, page?: number, highlightText?: string) => {
    // Prefer opening directly from an uploaded File if available
    const exactLocal = fileByName.get(docName);
    if (exactLocal) {
      await openFile(exactLocal, page);
      if (highlightText && api?.search) {
        try { api.search(highlightText); } catch {}
      }
      return;
    }
    // Try fuzzy match among local files
    for (const [localName, localFile] of fileByName.entries()) {
      if (
        localName.toLowerCase() === docName.toLowerCase() ||
        localName.toLowerCase().includes(docName.toLowerCase()) ||
        docName.toLowerCase().includes(localName.toLowerCase())
      ) {
        await openFile(localFile, page);
        if (highlightText && api?.search) {
          try { api.search(highlightText); } catch {}
        }
        return;
      }
    }
    let docId = docNameToDocId.get(docName);
    
    // If not found by exact name, try to find by original filename
    if (!docId) {
      // Check if any of our stored docs match the original filename
      const sessionDocs = loadViewerNewDocs();
      const matchingDoc = sessionDocs.find(d => d.name === docName);
      if (matchingDoc) {
        docId = matchingDoc.docId;
      }
    }
    
    // If still not found, try to find by partial name match
    if (!docId) {
      const sessionDocs = loadViewerNewDocs();
      const matchingDoc = sessionDocs.find(d => 
        docName.toLowerCase().includes(d.name.toLowerCase()) || 
        d.name.toLowerCase().includes(docName.toLowerCase())
      );
      if (matchingDoc) {
        docId = matchingDoc.docId;
        console.log(`Found document by partial match: ${docName} -> ${matchingDoc.name}`);
      }
    }
    
    // If still not found, try derive docId from name pattern "<docId>.pdf"
    if (!docId && docName.toLowerCase().endsWith(".pdf")) {
      docId = docName.slice(0, -4);
    }
    
    if (!docId) {
      console.log(`Could not resolve document: ${docName}`);
      console.log(`Available documents:`, Array.from(docNameToDocId.keys()));
      console.log(`Session docs:`, loadViewerNewDocs());
      // If we still cannot resolve, just jump in the current doc if possible
      if (page) {
        setLastJumpPage(page);
        api?.gotoLocation(page);
      }
      return;
    }
    
    const url = docIdToUrl.get(docId) || docUrl(docId);
    // Reset API to ensure jump waits for new viewer instance
    setApi(null);
    setPdfUrl(url);
    setCurrentFile(null);
    // Prefer the original uploaded file name if available
    const niceName = docIdToName.get(docId) || docName;
    setCurrentDocName(niceName);
    
    try {
      const data = await extractOutline({ docId });
      let items = data.outline || [];
      // Fallback: if no outline detected, derive a minimal outline from persona analysis for this doc
      if ((!items || items.length === 0) && (persona.trim() || job.trim())) {
        try {
          const res = await personaAnalyze({ persona, jobToBeDone: job || "", docIds: [docId] });
          const derived = (res.extracted_sections || []).map((s: any) => ({
            level: "H3",
            text: s.section_title,
            page: s.page_number,
          }));
          if (derived.length > 0) items = derived;
        } catch {}
      }
      setOutline(items);
    } catch (error) {
      console.error(`Failed to get outline for ${docName}:`, error);
      setOutline([]);
    }
    
    if (page) {
      setPendingPage(page);
      setLastJumpPage(page);
    }
    // If Adobe viewer APIs support text search, highlight the section title
    if (highlightText && api?.search) {
      try {
        api.search(highlightText);
      } catch {}
    }
  };

  const clearInvalidSession = () => {
    const { clearViewerNewDocs } = require("@/lib/storage");
    clearViewerNewDocs();
    setDocNameToDocId(new Map());
    setDocIdToUrl(new Map());
    setDocIdToName(new Map());
    setFiles([]);
    setFileByName(new Map());
    setHits([]);
    setSnippets([]);
    setOutline([]);
    setPdfUrl("");
    setCurrentFile(null);
    setCurrentDocName("");
  };

  const analyze = async (overridePersona?: string, overrideJob?: string) => {
    if (!canAnalyze) return;
    // Use all stored session docs if available
    const sessionDocs = loadViewerNewDocs();
    const docIds = sessionDocs.map((d) => d.docId);
    const personaVal = (overridePersona ?? persona).trim();
    const jobVal = (overrideJob ?? job).trim();
    
    console.log("Analyzing with:", {
      totalFiles: files.length,
      sessionDocs: sessionDocs.length,
      docIds: docIds.length,
      persona: personaVal,
      job: jobVal
    });
    
    try {
      const res = docIds.length > 0
        ? await personaAnalyze({ persona: personaVal, jobToBeDone: jobVal, docIds })
        : await personaAnalyze({ persona: personaVal, jobToBeDone: jobVal, files });
      
      console.log("Backend response:", res);
      
      // Handle the backend's actual output format
      const extractedSections = res.extracted_sections || [];
      const top3 = extractedSections.slice(0, 3);
      
      console.log("Top 3 sections:", top3);
      
      setHits(top3);
      setSnippets(res.subsection_analysis || []);
      
      // Open the top-ranked document if available
      if (top3[0]) {
        const topDoc = top3[0];
        // Use the document field from backend output
        const docName = topDoc.document;
        const pageNumber = topDoc.page_number;
        const sectionTitle = topDoc.section_title;
        
        console.log("Opening top document:", { docName, pageNumber, sectionTitle });
        
        await openByDocName(docName, pageNumber, sectionTitle);
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      // If documents not found, clear the invalid session
      if (error.message && error.message.includes("docId not found")) {
        console.log("Documents not found on backend, clearing invalid session");
        clearInvalidSession();
        // Retry with just the current files
        try {
          const res = await personaAnalyze({ persona, jobToBeDone: job, files });
          const extractedSections = res.extracted_sections || [];
          const top3 = extractedSections.slice(0, 3);
          setHits(top3);
          setSnippets(res.subsection_analysis || []);
          
          if (top3[0]) {
            const topDoc = top3[0];
            const docName = topDoc.document;
            const pageNumber = topDoc.page_number;
            const sectionTitle = topDoc.section_title;
            
            await openByDocName(docName, pageNumber, sectionTitle);
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      } else {
        console.error("Analysis failed:", error);
      }
    }
  };

  const uploadMore = () => {
    const input = document.getElementById("more-uploader") as HTMLInputElement | null;
    input?.click();
  };

  const onJumpRec = async (page: number, docName?: string, sectionTitle?: string) => {
    if (docName) {
      await openByDocName(docName, page, sectionTitle);
      return;
    }
    if (currentFile) {
      setPendingPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground viewer-cursor-none">
      <NavBar />
      <Pointer className="fill-blue-500" />
      {/* Viewer toolbar */}
      <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground">
            <span className="px-3 py-1.5 rounded-lg bg-muted text-foreground/80">
              {localFiles.length} PDF{localFiles.length !== 1 ? 's' : ''} uploaded
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              onHoverStart={() => setHover(true)}
              onHoverEnd={() => setHover(false)}
              onMouseMove={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              initial={{ scale: 1, boxShadow: "0 0 0 rgba(239,68,68,0)" }}
              whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(239,68,68,0.35)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="rounded-md"
            >
            <Button
              onClick={async () => {
                const docs = loadViewerNewDocs();
                const docIds = docs.map((d) => d.docId);
                if (docIds.length > 0) {
                  try {
                    await deleteDocs(docIds);
                    clearLocalFiles();
                    const { clearViewerNewDocs } = await import("@/lib/storage");
                    clearViewerNewDocs();
                    setFiles([]);
                    setFileByName(new Map());
                    setDocNameToDocId(new Map());
                    setDocIdToUrl(new Map());
                    setDocIdToName(new Map());
                    setHits([]);
                    setSnippets([]);
                    setOutline([]);
                    setPdfUrl("");
                    setCurrentFile(null);
                    setCurrentDocName("");
                    alert(`Cleaned up ${docIds.length} documents`);
                  } catch (e) {
                    console.error("Cleanup failed:", e);
                    alert("Cleanup failed. Check console for details.");
                  }
                } else {
                  alert("No documents to clean up");
                }
              }}
              className="relative overflow-hidden bg-background text-foreground border border-border hover:bg-background"
            >
              {/* cursor-following red highlight (hover-only) */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: hover ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  background: `radial-gradient(100px circle at ${mouse.x}px ${mouse.y}px, rgba(239,68,68,0.55), rgba(239,68,68,0.0) 60%)`,
                }}
              />
              <span className="relative z-10">Clean Up</span>
            </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Upload and Analysis Section */}
        <div className="mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Upload */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border-2 border-border shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
                <UploadCard onFiles={(fl) => onPickFiles(fl as FileList)} />
                <input 
                  id="more-uploader" 
                  type="file" 
                  className="hidden" 
                  accept="application/pdf" 
                  multiple 
                  onChange={(e) => e.target.files && onPickFiles(e.target.files)} 
                />
                <div className="mt-4">
                  <Button 
                    onClick={() => document.getElementById("more-uploader")?.click()}
                    className="w-full font-medium py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Upload More PDFs
                  </Button>
                </div>
              </div>
              
              <div className="bg-card rounded-2xl border-2 border-border shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Uploaded Files</h2>
                <FilesList 
                  files={localFiles as any} 
                  onRemove={(n: string) => removeByName(n)} 
                  onPreview={(name) => openByDocName(name)} 
                />
              </div>
            </div>

            {/* Right Column - Analysis Form */}
            <div className="bg-card rounded-2xl border-2 border-border shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Analysis Configuration</h2>
              <PersonaForm
                defaultPersona={persona}
                defaultJob={job}
                status={pdfUrl ? "idle" : (canAnalyze ? "idle" : "idle")}
                onRun={async (p, j) => {
                  setPersona(p); setJob(j);
                  // show animated loading state while we wait
                  (document.dispatchEvent as any)(new Event("persona-analysis-start"));
                  try {
                    await analyze(p, j);
                    // slight delay to let UI render recommendations before showing done
                    setTimeout(() => {
                      (document.dispatchEvent as any)(new Event("persona-analysis-done"));
                    }, 250);
                  } catch {
                    (document.dispatchEvent as any)(new Event("persona-analysis-done"));
                  }
                }}
                disabled={!canAnalyze}
              />
            </div>
          </div>
        </div>

        {/* Document Viewer Section */}
        <div className="grid lg:grid-cols-[280px_1fr_260px] gap-8 items-start">
          {/* Left Sidebar - Recommendations */}
          <div className="lg:sticky lg:top-24">
            <RecommendationPane
              sections={hits}
              snippets={snippets}
              onJump={(p, doc, q) => onJumpRec(p, doc || undefined, q)}
            />
          </div>

          {/* Center - PDF Viewer */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-border shadow-2xl overflow-hidden">
            <div className="border-b border-border bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-sm"></div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {currentDocName || "Document Viewer"}
                  </span>
                  {lastJumpPage && (
                    <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full font-medium shadow-sm">
                      Page {lastJumpPage}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button className="text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 border-0 p-2 rounded-lg cursor-pointer transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
            
            {pdfUrl ? (
              <div className="h-[85vh] relative">
                <PdfEmbed url={pdfUrl} onReady={setApi} className="w-full h-full" />
                {/* Professional overlay for branding */}
                <div className="absolute top-4 right-4 bg-black/10 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-gray-600 dark:text-gray-300 pointer-events-none">
                  Document Intelligence
                </div>
              </div>
            ) : (
              <div className="h-[85vh] grid place-items-center text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="space-y-6 max-w-md">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Ready to Analyze Documents</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Upload your PDFs above and run the analysis to view and explore your documents with AI-powered insights</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Powered by Adobe PDF Embed API</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Outline */}
          <div className="lg:sticky lg:top-24">
            <OutlineSidebar
              items={outline}
              onJump={(p) => {
                setLastJumpPage(p);
                api?.gotoLocation(p);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


