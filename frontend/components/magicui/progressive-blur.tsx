"use client";

import React from "react";
import clsx from "clsx";

type Props = {
  className?: string;
  height?: string; // e.g. "40%" or "120px"
  position?: "top" | "bottom" | "both";
  blurLevels?: number[];
  children?: React.ReactNode;
};

export function ProgressiveBlur({
  className,
  height = "30%",
  position = "bottom",
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
  children,
}: Props) {
  const gradientStops = blurLevels
    .map((b, i) => `${Math.min(100, (i / (blurLevels.length - 1)) * 100)}% ${b}px`)
    .join(", ");

  const common = "pointer-events-none absolute left-0 right-0";

  return (
    <div className={clsx("absolute inset-0", className)} aria-hidden>
      {(position === "top" || position === "both") && (
        <div
          className={clsx(common, "top-0")}
          style={{
            height,
            maskImage: `linear-gradient(to bottom, black, transparent)`,
            WebkitMaskImage: `linear-gradient(to bottom, black, transparent)`,
            backdropFilter: `blur(${blurLevels[0]}px)`,
          }}
        />
      )}
      {(position === "bottom" || position === "both") && (
        <div
          className={clsx(common, "bottom-0")}
          style={{
            height,
            maskImage: `linear-gradient(to top, black, transparent)`,
            WebkitMaskImage: `linear-gradient(to top, black, transparent)`,
            backdropFilter: `blur(${blurLevels[0]}px)`,
          }}
        />
      )}
      {children}
    </div>
  );
}


