"use client";
import NavBar from "@/components/NavBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecommendationPane from "@/components/RecommendationPane";
import TextSelectionRecommendations from "@/components/TextSelectionRecommendations";
import PdfEmbed from "@/components/PdfEmbed";
import OutlineSidebar from "@/components/OutlineSidebar";
import { extractOutline, personaAnalyze, docUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export default function Viewer() {
  const params = useParams<{ docId: string }>();
  const docId = (params?.docId as unknown as string) || "";
  const [outline, setOutline] = useState<any[]>([]);
  const [api, setApi] = useState<any>(null);
  const [persona, setPersona] = useState("");
  const [job, setJob] = useState("");
  const [hits, setHits] = useState<any[]>([]);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [showTextRecommendations, setShowTextRecommendations] = useState(false);

  useEffect(() => {
    (async () => {
      const o = await extractOutline({ docId });
      setOutline(o.outline || []);
    })();
  }, [docId]);

  const analyze = async () => {
    const res = await personaAnalyze({ persona, jobToBeDone: job, docIds: [docId] });
    setHits(res.extracted_sections || []);
    setSnippets(res.subsection_analysis || []);
    if (res.extracted_sections?.[0]) api?.gotoLocation(res.extracted_sections[0].page_number);
  };

  const handleTextSelection = (text: string) => {
    if (text.trim()) {
      setSelectedText(text);
      setShowTextRecommendations(true);
    }
  };

  const clearSelection = () => {
    setSelectedText("");
    setShowTextRecommendations(false);
    // Clear any text selection in the document
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleJumpToPage = (page: number, targetDocId?: string) => {
    if (targetDocId && targetDocId !== docId) {
      // Navigate to different document
      window.location.href = `/viewer/${targetDocId}`;
    } else {
      // Jump to page in current document
      api?.gotoLocation(page);
    }
  };

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-5 space-y-4 text-foreground">
        <div className="flex items-end gap-2">
          <Select defaultValue="culinary">
            <SelectTrigger className="w-56 rounded-xl">
              <SelectValue placeholder="Persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="culinary">Culinary Traveler</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Persona</label>
            <Input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="Investment Analyst" />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-xs text-muted-foreground">Job to be done</label>
            <Input value={job} onChange={(e) => setJob(e.target.value)} placeholder="Analyze revenue trends…" />
          </div>
          <Button onClick={analyze}>Find relevant</Button>
          <Button 
            className={`ml-2 ${showTextRecommendations ? "bg-primary text-primary-foreground" : "bg-transparent border border-border hover:bg-muted"}`}
            onClick={() => setShowTextRecommendations(!showTextRecommendations)}
          >
            {showTextRecommendations ? "Show Persona Analysis" : "Show Text Selection"}
          </Button>
          {showTextRecommendations && (
            <Button 
              className="ml-2 bg-transparent border border-border hover:bg-muted px-3 py-1 text-sm"
              onClick={clearSelection}
            >
              Clear Selection
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-[20rem_1fr_16rem]">
          {showTextRecommendations ? (
            <TextSelectionRecommendations
              selectedText={selectedText}
              currentDocId={docId}
              onJumpToPage={handleJumpToPage}
              onClearSelection={clearSelection}
              visible={showTextRecommendations}
            />
          ) : (
            <RecommendationPane sections={hits} snippets={snippets} onJump={(p)=>api?.gotoLocation(p)} />
          )}
          <section className="rounded-xl border border-border bg-card p-3">
            <div className="h-9 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="px-2">←</span>
              <span className="px-2">▭</span>
              <span className="px-2">1 / …</span>
            </div>
            <PdfEmbed 
              url={docUrl(docId)} 
              onReady={setApi} 
              onTextSelection={handleTextSelection}
            />
            {hits.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {hits.map((h, i) => (
                  <li key={i} className="flex gap-2 items-center">
                    <button
                      className="px-2 py-1 rounded bg-muted hover:bg-muted/80"
                      onClick={() => api?.gotoLocation(h.page_number)}
                    >
                      Go p.{h.page_number}
                    </button>
                    <span className="text-muted-foreground">#{h.importance_rank}</span>
                    <span className="font-medium">{h.section_title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <OutlineSidebar items={outline} onJump={(p)=>api?.gotoLocation(p)} />
        </div>
      </main>
    </>
  );
}


