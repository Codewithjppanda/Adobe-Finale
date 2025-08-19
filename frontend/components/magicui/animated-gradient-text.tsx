"use client";

import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function AnimatedGradientText({ 
  children, 
  className, 
  as: Component = "span" 
}: AnimatedGradientTextProps) {
  return (
    <motion.div
      className={cn("relative inline-block", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Component className="relative z-10 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
        {children}
      </Component>
      
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 via-accent-secondary/20 to-accent-tertiary/20 blur-xl -z-10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
