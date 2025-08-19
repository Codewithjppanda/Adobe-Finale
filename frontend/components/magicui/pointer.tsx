"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import clsx from "clsx";

type PointerProps = {
  className?: string;
  children?: React.ReactNode;
  size?: number;
};

// A lightweight pointer overlay inspired by Magic UI Pointer.
// Renders a fixed, pointer-events-none element that follows the cursor.
export function Pointer({ className = "", children, size = 28 }: PointerProps) {
  const [coords, setCoords] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70]"
      style={{ translateX: coords.x, translateY: coords.y }}
      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.4 }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        {children ? (
          children
        ) : (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={clsx("drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]", className)}
          >
            <path
              d="M4 3l15 8.5-6.4 1.9-2.1 6.6L4 3z"
              className={clsx("fill-blue-500", className)}
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </motion.div>
  );
}


