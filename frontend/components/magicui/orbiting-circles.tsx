"use client";

import { motion } from "framer-motion";
import { cn } from "@/src/lib/utils";

interface OrbitingCirclesProps {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
}

export function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <div
          className={cn("absolute inset-0 rounded-full border border-stroke/20", className)}
          style={{
            width: `${radius * 2}px`,
            height: `${radius * 2}px`,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      
      <motion.div
        className={cn("absolute flex items-center justify-center", className)}
        style={{
          width: `${radius * 2}px`,
          height: `${radius * 2}px`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          rotate: reverse ? -360 : 360,
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          delay,
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ transformOrigin: `0 ${radius}px` }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}
