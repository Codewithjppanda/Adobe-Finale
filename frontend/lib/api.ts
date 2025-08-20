// Use relative URLs so API calls work both in development and Docker
// In development, this will call localhost:3000/v1/... which gets proxied to localhost:8000
// In Docker, this will call localhost:8080/v1/... which gets proxied to localhost:8000
const API = "";

export async function extractOutline(params: { 
  file?: File; 
  docId?: string; 
  storage_type?: "bulk" | "fresh" | "viewer" 
}) {
  const fd = new FormData();
  if (params.file) fd.append("file", params.file);
  if (params.docId) fd.append("docId", params.docId);
  if (params.storage_type) fd.append("storage_type", params.storage_type);
  const res = await fetch(`${API}/v1/outline`, { method: "POST", body: fd, cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    docId: string;
    title: string;
    outline: { level: string; text: string; page: number }[];
  }>;
}

export async function personaAnalyze(payload: {
  persona: string;
  jobToBeDone: string;
  files?: File[];
  docIds?: string[];
}) {
  const fd = new FormData();
  fd.append("persona", payload.persona);
  fd.append("jobToBeDone", payload.jobToBeDone);
  payload.files?.forEach((f) => fd.append("files", f));
  payload.docIds?.forEach((id) => fd.append("docIds", id));
  const res = await fetch(`${API}/v1/persona/analyze`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const docUrl = (docId: string) => `${API}/v1/files/${docId}`;


export async function deleteDocs(docIds: string[]) {
  const res = await fetch(`${API}/v1/files`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docIds }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function deleteDocsBeacon(docIds: string[]) {
  try {
    const data = JSON.stringify({ docIds });
    const blob = new Blob([data], { type: "application/json" });
    // Use POST /files/delete for beacon compatibility
    (navigator as any).sendBeacon?.(`${API}/v1/files/delete`, blob);
  } catch {}
}


export async function searchIngest(payload: { 
  files?: File[]; 
  docIds?: string[];
  storage_type?: "bulk" | "fresh" | "viewer";
}) {
  const fd = new FormData();
  payload.files?.forEach((f) => fd.append("files", f));
  payload.docIds?.forEach((id) => fd.append("docIds", id));
  if (payload.storage_type) fd.append("storage_type", payload.storage_type);
  const res = await fetch(`${API}/v1/search/ingest`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ ingested: number }>;
}

export async function searchQuery(params: { text: string; k?: number }) {
  const fd = new FormData();
  fd.append("text", params.text);
  if (params.k) fd.append("k", String(params.k));
  const res = await fetch(`${API}/v1/search/query`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ 
    matches: { 
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
    relevance_reason?: string;
    }[] 
  }>;
}

export async function generateInsights(payload: { 
  selection: string; 
  matches: { 
    docId: string; 
    filename: string; 
    page: number; 
    title: string; 
    snippet: string; 
    score: number;
    pdf_name?: string;
    section_heading?: string;
    section_content?: string;
    relevance_reason?: string;
  }[] 
}) {
  const res = await fetch(`${API}/v1/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ insights: string[] }>;
}

export async function getTextSelectionRecommendations(payload: {
  selected_text: string;
  current_doc_id: string;
  max_recommendations?: number;
}) {
  const res = await fetch(`${API}/v1/recommendations/text-selection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    recommendations: Array<{
      docId: string;
      filename: string;
      page: number;
      title: string;
      snippet: string;
      relevance_score: number;
      reasoning: string;
    }>;
    selected_text: string;
    total_found: number;
  }>;
}

export async function generateAudio(payload: { 
  selection: string; 
  matches: { 
    docId: string; 
    filename: string; 
    page: number; 
    title: string; 
    snippet: string; 
    score: number;
    pdf_name?: string;
    section_heading?: string;
    section_content?: string;
    relevance_reason?: string;
  }[]; 
  insights: string[];
  voice?: string;
}) {
  const res = await fetch(`${API}/v1/audio/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    audio_url: string | null;
    script?: string;
    duration_estimate?: number;
    error?: string;
    speakers?: number;
  }>;
}

export async function generateSimpleAudio(payload: { 
  text: string; 
  voice?: string;
}) {
  const res = await fetch(`${API}/v1/audio/simple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    audio_url: string | null;
    duration_estimate?: number;
    error?: string;
    demo?: boolean;
    message?: string;
  }>;
}

export async function clearAllStorage() {
  const res = await fetch(`${API}/v1/storage/clear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    message: string;
    files_removed: number;
    storage_cleared: any;
    index_reset: boolean;
  }>;
}


