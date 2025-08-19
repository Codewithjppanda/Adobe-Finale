"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

type RainbowButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
};

/**
 * Lightweight Rainbow Button inspired by Magic UI
 * Docs reference: https://magicui.design/docs/components/rainbow-button
 */
export function RainbowButton({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}: RainbowButtonProps) {
  const padClasses =
    size === "sm"
      ? "px-4 py-2 text-sm"
      : size === "lg"
      ? "px-8 py-4 text-base"
      : size === "icon"
      ? "p-2 text-sm"
      : "px-5 py-2.5 text-sm";

  const innerSurface =
    variant === "outline"
      ? "bg-transparent text-foreground backdrop-blur border border-white/25 dark:border-white/15"
      : "bg-white text-neutral-900";

  return (
    <button
      {...props}
      className={cn(
        "relative inline-block rounded-full overflow-hidden select-none align-middle",
        "p-[2px]",
        "[background:linear-gradient(110deg,var(--c1),var(--c2),var(--c3),var(--c4),var(--c1))]",
        "[--c1:#8B5CF6] [--c2:#22D3EE] [--c3:#60A5FA] [--c4:#A78BFA]",
        "bg-[length:200%_200%] animate-gradient cursor-pointer"
      )}
    >
      <span
        className={cn(
          "relative z-10 inline-flex items-center justify-center gap-2 rounded-full",
          "transition-transform active:scale-[0.98]",
          innerSurface,
          padClasses,
          className
        )}
      >
        {children}
      </span>
      {/* subtle rainbow glow below */}
      <span
        aria-hidden
        className="pointer-events-none absolute -z-10 inset-0 rounded-full blur-2xl opacity-40
                   [background:radial-gradient(60%_60%_at_50%_100%,var(--c2),transparent)]"
      />
    </button>
  );
}


