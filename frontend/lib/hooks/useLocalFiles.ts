"use client";
import { useCallback, useEffect, useState } from "react";

export type StoredFile = { name: string; size: number; lastModified: number };

const KEY = "viewer-local-files";

export function useLocalFiles() {
  const [files, setFiles] = useState<StoredFile[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setFiles(raw ? (JSON.parse(raw) as StoredFile[]) : []);
    } catch {
      setFiles([]);
    }
  }, []);

  const persist = useCallback((next: StoredFile[]) => {
    setFiles(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const addMany = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const toAdd = arr.map((f) => ({ name: f.name, size: f.size, lastModified: f.lastModified }));
    const map = new Map(files.map((f) => [f.name, f] as const));
    for (const f of toAdd) map.set(f.name, f);
    persist(Array.from(map.values()));
  }, [files, persist]);

  const remove = useCallback((name: string) => {
    persist(files.filter((f) => f.name !== name));
  }, [files, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { files, addMany, remove, clear };
}


