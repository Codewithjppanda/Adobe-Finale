export type LibraryDoc = { docId: string; name: string };

const KEY = "docLibrary";
const VIEWER_NEW_KEY = "viewerNewDocs";

export function loadLibrary(): LibraryDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LibraryDoc[]) : [];
  } catch {
    return [];
  }
}

export function saveDoc(entry: LibraryDoc) {
  if (typeof window === "undefined") return;
  const lib = loadLibrary();
  if (!lib.find((d) => d.docId === entry.docId)) {
    lib.push(entry);
    localStorage.setItem(KEY, JSON.stringify(lib));
  }
}

export function saveMany(entries: LibraryDoc[]) {
  if (typeof window === "undefined") return;
  const existing = loadLibrary();
  const map = new Map(existing.map((e) => [e.docId, e] as const));
  for (const e of entries) map.set(e.docId, e);
  localStorage.setItem(KEY, JSON.stringify(Array.from(map.values())));
}

// Session storage for Viewer New flow
export function loadViewerNewDocs(): LibraryDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VIEWER_NEW_KEY);
    return raw ? (JSON.parse(raw) as LibraryDoc[]) : [];
  } catch {
    return [];
  }
}

export function addViewerNewDocs(entries: LibraryDoc[]) {
  if (typeof window === "undefined") return;
  const existing = loadViewerNewDocs();
  const map = new Map(existing.map((e) => [e.docId, e] as const));
  for (const e of entries) map.set(e.docId, e);
  localStorage.setItem(VIEWER_NEW_KEY, JSON.stringify(Array.from(map.values())));
}

export function clearViewerNewDocs() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(VIEWER_NEW_KEY);
  } catch {}
}

