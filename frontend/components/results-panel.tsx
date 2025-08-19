"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Section = { document: string; section_title: string; page_number: number; importance_rank?: number };

type Props = {
  sections: Section[];
  snippets: any[];
  onJump: (page: number, doc?: string, title?: string) => void;
};

export default function ResultsPanel({ sections, snippets, onJump }: Props) {
  const [tab, setTab] = useState<"summary" | "insights" | "citations">("summary");

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-3 flex gap-2">
        {(["summary", "insights", "citations"] as const).map((t) => (
          <Button
            key={t}
            className={`bg-background text-foreground border border-border hover:bg-muted ${tab === t ? "ring-1 ring-ring/40" : ""}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="grid gap-2">
          {sections.slice(0, 3).map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-3">
              <div className="text-sm font-medium">{s.section_title}</div>
              <div className="text-xs text-muted-foreground">{s.document} — p.{s.page_number}</div>
              <div className="mt-2">
                <Button onClick={() => onJump(s.page_number, s.document, s.section_title)}>Open</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "insights" && (
        <div className="text-sm text-muted-foreground">{snippets?.length ? `${snippets.length} insight snippets` : "No insights yet"}</div>
      )}

      {tab === "citations" && (
        <div className="text-sm text-muted-foreground">Citations view (mock)</div>
      )}
    </div>
  );
}


