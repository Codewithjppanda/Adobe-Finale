"use client";

import { useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";

interface MeteorsProps {
  number?: number;
  className?: string;
}

interface MeteorData {
  left: number;
  animationDelay: number;
  animationDuration: number;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const [meteorsData, setMeteorsData] = useState<MeteorData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Generate random meteor data only on client side
    const data = Array.from({ length: number }, () => ({
      left: Math.floor(Math.random() * (400 - -400) + -400),
      animationDelay: Math.random() * (0.8 - 0.2) + 0.2,
      animationDuration: Math.floor(Math.random() * (10 - 2) + 2),
    }));
    
    setMeteorsData(data);
    setMounted(true);
  }, [number]);

  // Don't render anything on server side to avoid hydration mismatch
  if (!mounted) {
    return null;
  }
  
  return (
    <>
      {meteorsData.map((meteor, idx) => (
        <span
          key={idx}
          className={cn(
            "absolute top-1/2 left-1/2 h-0.5 w-0.5 rotate-[215deg] animate-meteor-effect rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: meteor.left + "px",
            animationDelay: meteor.animationDelay + "s",
            animationDuration: meteor.animationDuration + "s",
          }}
        />
      ))}
    </>
  );
}
