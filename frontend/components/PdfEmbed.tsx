"use client";
import { useEffect, useRef } from "react";

export default function PdfEmbed({ 
  url, 
  onReady, 
  onTextSelection,
  className = "" 
}: { 
  url: string; 
  onReady?: (api: any) => void; 
  onTextSelection?: (text: string) => void;
  className?: string 
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const AdobeDC = (window as any).AdobeDC;
      if (!AdobeDC || !ref.current) return;
      clearInterval(timer);

      const runtimeId = (window as any).__ADOBE_CLIENT_ID__ || process.env.NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID;
      const view = new AdobeDC.View({
        clientId: runtimeId,
        divId: ref.current.id,
      });

      view
        .previewFile(
          { content: { location: { url } }, metaData: { fileName: "Document.pdf" } },
          { embedMode: "SIZED_CONTAINER", showDownloadPDF: false, showPrintPDF: false }
        )
        .then((viewer: any) =>
          viewer
            .getAPIs()
            .then((apis: any) => {
              try { (apis as any)._view = view; } catch {}
              
              // Set up Adobe PDF text selection listener
              if (onTextSelection) {
                try {
                  console.log("🔧 Setting up Adobe PDF text selection listener...");
                  
                  // Method 1: Official Adobe PDF Embed API Selection Events
                  const registerAdobeSelectionEvents = () => {
                    try {
                      console.log("🔧 Registering official Adobe PDF selection events...");
                      
                      // Register the official PREVIEW_SELECTION_END event
                      view.registerCallback(
                        (window as any).AdobeDC?.View?.Enum?.CallbackType?.EVENT_LISTENER || "EVENT_LISTENER",
                        function(event: any) {
                          console.log("🎯 Adobe PDF event triggered:", event);
                          
                          if (event.type === "PREVIEW_SELECTION_END") {
                            console.log("✅ PREVIEW_SELECTION_END detected, getting selected content...");
                            
                            // Use the official getSelectedContent API with small delay to avoid race condition
                            setTimeout(() => {
                              apis.getSelectedContent()
                                .then((result: any) => {
                                  console.log("📄 getSelectedContent result:", result);
                                  const selectedText = result?.data || "";
                                  
                                  if (selectedText && selectedText.trim() && selectedText.length > 3) {
                                    console.log("✅ Adobe PDF official text extracted:", selectedText.trim().substring(0, 50));
                                    onTextSelection(selectedText.trim());
                                  } else {
                                    console.log("⚠️ No valid text content in selection:", result);
                                  }
                                })
                                .catch((error: any) => {
                                  console.log("❌ getSelectedContent failed:", error);
                                });
                            }, 100); // 100ms delay as recommended to avoid race condition
                          }
                        },
                        {
                          enableFilePreviewEvents: true,
                          listenOn: ["PREVIEW_SELECTION_END"]
                        }
                      );
                      
                      console.log("✅ Official Adobe PDF selection event registered: PREVIEW_SELECTION_END");
                      return true;
                      
                    } catch (e) {
                      console.log("❌ Official Adobe event registration failed:", e);
                      return false;
                    }
                  };

                  // Method 2: Polling fallback for Adobe PDF selections
                  let lastSelectedText = "";
                  const pollForSelection = () => {
                    try {
                      // Try multiple methods to get selected text
                      let selectedText = "";
                      
                      // Try window.getSelection first
                      const winSelection = window.getSelection();
                      if (winSelection && winSelection.toString().trim()) {
                        selectedText = winSelection.toString().trim();
                      }
                      
                      // Try to get selection from Adobe API if available
                      if (!selectedText && apis.getSelectedText) {
                        try {
                          selectedText = apis.getSelectedText() || "";
                        } catch (e) {
                          // Ignore
                        }
                      }
                      
                      // If we found new text, trigger the callback
                      if (selectedText && selectedText !== lastSelectedText && selectedText.length > 3) {
                        lastSelectedText = selectedText;
                        console.log("📡 Polling detected text selection:", selectedText.substring(0, 50));
                        onTextSelection(selectedText);
                      }
                    } catch (e) {
                      // Ignore polling errors
                    }
                  };

                  // Register Adobe events
                  const eventRegistered = registerAdobeSelectionEvents();
                  
                  // Start polling as fallback
                  const pollingInterval = setInterval(pollForSelection, 300);
                  console.log("📡 Started Adobe PDF selection polling");
                  
                  // Store cleanup function
                  (apis as any)._cleanupSelection = () => {
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                    }
                    // Clean up Adobe event if it was registered
                    if (eventRegistered) {
                      try {
                        apis.unregisterCallback?.("PREVIEW_SELECTION_END");
                      } catch {}
                    }
                  };
                  
                } catch (e) {
                  console.warn('Could not set up Adobe PDF text selection listener:', e);
                }
              }
              
              onReady?.(apis);
            })
            .catch(() => {})
        );
    }, 100);
    return () => clearInterval(timer);
  }, [url, onReady]);

  return <div id="adobe-dc-view" ref={ref} className={`w-full rounded-xl overflow-hidden cursor-text ${className}`} />;
}


