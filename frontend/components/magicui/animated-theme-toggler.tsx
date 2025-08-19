"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function AnimatedThemeToggler({ className = "", size = "sm" }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Avoid hydration mismatches by rendering nothing until mounted on the client
  if (!mounted) return null;

  const isDark = (theme ?? resolvedTheme) === "dark" || resolvedTheme === "dark";

  // sizing map to control overall scale and thumb distance
  const sizing = {
    sm: { trackH: 32, trackW: 56, thumb: 24, offset: 14, icon: 12 },
    md: { trackH: 36, trackW: 64, thumb: 28, offset: 18, icon: 14 },
    lg: { trackH: 40, trackW: 72, thumb: 32, offset: 22, icon: 16 },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-pressed={isDark}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={clsx(
        "relative inline-flex items-center justify-center rounded-full",
        "border border-border overflow-hidden",
        // subtle glossy track similar to Magic UI
        "bg-gradient-to-b from-white to-slate-100 dark:from-slate-800 dark:to-slate-900",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50",
        "shadow-sm hover:shadow",
        className
      )}
      data-state={isDark ? "dark" : "light"}
      style={{ height: sizing.trackH, width: sizing.trackW }}
    >
      {/* track icons and halves */}
      <div className="absolute inset-0 grid grid-cols-2 select-none text-xs">
        <div className="flex items-center justify-center text-amber-500">
          <Sun size={sizing.icon} />
        </div>
        <div className="flex items-center justify-center text-sky-400">
          <Moon size={sizing.icon} />
        </div>
      </div>
      {/* thumb with animated position */}
      <motion.div
        className={clsx(
          "relative z-10 rounded-full",
          // luminous thumb colors per theme
          "bg-slate-900 dark:bg-white",
          // glow
          "shadow-[0_0_0_2px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.25)] dark:shadow-[0_0_0_2px_rgba(255,255,255,0.2),0_8px_16px_rgba(2,6,23,0.6)]"
        )}
        style={{ height: sizing.thumb, width: sizing.thumb }}
        initial={false}
        animate={{ x: isDark ? sizing.offset : -sizing.offset, rotate: isDark ? 180 : 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />
      {mounted && <span className="sr-only">Toggle theme</span>}
    </button>
  );
}


