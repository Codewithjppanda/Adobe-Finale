"use client";

import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid auto-rows-[220px] grid-cols-3 gap-4", className)}>
      {children}
    </div>
  );
}

export function BentoCard({ children, className, gradient = false, hover = true }: BentoCardProps) {
  return (
    <motion.div
      className={cn(
        "group/bento row-span-1 rounded-xl border border-stroke bg-surface p-4 shadow-sm transition-all hover:shadow-premium",
        gradient && "bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10",
        hover && "hover:-translate-y-1 hover:border-accent-primary/30",
        className
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
