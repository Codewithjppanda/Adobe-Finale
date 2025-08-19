"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onContinue: () => void;
};

export default function RefreshDialog({ onContinue }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      try {
        e.preventDefault();
        e.returnValue = "";
        setOpen(true);
      } catch {}
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-xl border">
        <h2 className="text-lg font-semibold">Reload this page?</h2>
        <p className="mt-2 text-sm opacity-70">
          Continuing will remove your uploaded PDFs for this session.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setOpen(false)} className="bg-white text-black border hover:bg-white/80">
            Cancel
          </Button>
          <Button onClick={onContinue}>Continue</Button>
        </div>
      </div>
    </div>
  );
}


