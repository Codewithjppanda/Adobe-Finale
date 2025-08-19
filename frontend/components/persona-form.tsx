"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  defaultPersona?: string;
  defaultJob?: string;
  onRun: (persona: string, job: string) => void;
  disabled?: boolean;
  status?: "idle" | "loading" | "done";
};

export default function PersonaForm({ defaultPersona = "", defaultJob = "", onRun, disabled, status = "idle" }: Props) {
  const [persona, setPersona] = useState(defaultPersona || "HR Manager");
  const [job, setJob] = useState(defaultJob || "Create and manage fillable forms for onboarding and compliance");
  const [internalStatus, setInternalStatus] = useState<"idle" | "loading" | "done">(status);

  // react to global events fired from the parent page
  useEffect(() => {
    const onStart = () => setInternalStatus("loading");
    const onDone = () => setInternalStatus("done");
    document.addEventListener("persona-analysis-start", onStart as any);
    document.addEventListener("persona-analysis-done", onDone as any);
    return () => {
      document.removeEventListener("persona-analysis-start", onStart as any);
      document.removeEventListener("persona-analysis-done", onDone as any);
    };
  }, []);
  useEffect(() => setInternalStatus(status), [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun(persona.trim(), job.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="persona" className="block text-sm font-medium mb-2">
            Persona
          </label>
          <Input
            id="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="e.g., Marketing Manager, Data Analyst, Student"
            className="w-full rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Describe who you are or who you're analyzing for
          </p>
        </div>

        <div>
          <label htmlFor="job" className="block text-sm font-medium mb-2">
            Job to be Done
          </label>
          <Input
            id="job"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="e.g., Create a marketing strategy, Analyze quarterly data, Research topic"
            className="w-full rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-1">
            What specific task or goal are you trying to accomplish?
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={disabled || internalStatus === "loading"}
        className="relative overflow-hidden w-full font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
      >
        {/* energetic glow while loading */}
        <AnimatePresence>
          {internalStatus === "loading" && (
            <motion.span
              key="glow"
              aria-hidden
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background:
                  "radial-gradient(120px 60px at 50% 50%, rgba(59,130,246,0.45), rgba(59,130,246,0.0) 60%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* icon + text */}
        <span className="relative z-10 inline-flex items-center">
          {internalStatus === "done" ? (
            <>
              <motion.svg
                className="w-5 h-5 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ scale: 0.6, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </motion.svg>
              Done
            </>
          ) : (
            <>
              <motion.svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={internalStatus === "loading" ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
                transition={internalStatus === "loading" ? { repeat: Infinity, duration: 0.8 } : {}}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </motion.svg>
              {internalStatus === "loading" ? "Analyzing..." : "Run AI Analysis"}
            </>
          )}
        </span>
      </Button>
    </form>
  );
}


