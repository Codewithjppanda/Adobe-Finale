"use client";

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

type Props = {
  words: string;
  className?: string;
  durationPerCharMs?: number; // speed
  delayMs?: number; // initial delay
  spanClassName?: string; // extra classes for each animated span (useful for gradient text)
  groupByWords?: boolean; // if true, prevents breaking inside words
};

// Simple text generate effect inspired by Aceternity UI's Text Generate Effect.
// Reference: https://ui.aceternity.com/components/text-generate-effect
export function TextGenerateEffect({
  words,
  className = "",
  durationPerCharMs = 10,
  delayMs = 150,
  spanClassName = "",
  groupByWords = true,
}: Props) {
  const tokens = React.useMemo(() => (groupByWords ? words.split(/(\s+)/) : words.split("")), [words, groupByWords]);
  const prefersReduced = useReducedMotion();

  return (
    <p className={"whitespace-pre-wrap " + className} aria-label={words}>
      {(() => {
        let idx = 0; // running index across all characters
        return tokens.map((token, tIndex) => {
          // whitespace token → render as-is (keeps natural line breaks between words)
          if (groupByWords && /\s+/.test(token)) {
            // increment index to keep timing consistent
            idx += token.length;
            return <span key={"ws-" + tIndex}>{token}</span>;
          }

          // word token → animate per character but keep word unbreakable
          const chars = token.split("");
          return (
            <span key={"w-" + tIndex} style={{ display: "inline-block" }}>
              {chars.map((ch, i) => {
                const myIndex = idx++;
                return (
                  <motion.span
                    key={i}
                    className={spanClassName}
                    initial={{ opacity: 0, filter: prefersReduced ? "none" : "blur(6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ delay: (delayMs + myIndex * durationPerCharMs) / 1000, duration: 0.18 }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
            </span>
          );
        });
      })()}
    </p>
  );
}


