"use client";

import React, { useMemo } from "react";
import clsx from "clsx";

type MarqueeProps = {
  className?: string;
  children: React.ReactNode;
  repeat?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  speed?: number; // seconds for one full loop
};

export function Marquee({
  className = "",
  children,
  repeat = 2,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  speed = 25,
}: MarqueeProps) {
  const items = useMemo(() => new Array(Math.max(1, repeat)).fill(0), [repeat]);

  const axisClass = vertical ? "flex-col" : "flex-row";
  const sizeClass = vertical ? "h-[200px]" : "w-full";
  const translateClass = vertical ? "marquee-y" : "marquee-x";
  const animationStyle: React.CSSProperties = {
    animation: `${vertical ? "marquee-y" : "marquee-x"} ${speed}s linear infinite`,
    animationDirection: reverse ? "reverse" : "normal",
  } as React.CSSProperties;

  return (
    <div
      className={clsx(
        "relative overflow-hidden",
        sizeClass,
        pauseOnHover && "[&:hover_*]:[animation-play-state:paused]",
        className
      )}
    >
      <div className={clsx("flex", axisClass)}>
        {/* two copies to enable seamless loop */}
        <div
          className={clsx(
            "flex gap-6 shrink-0 items-center",
            vertical ? "flex-col" : "flex-row",
            translateClass
          )}
          style={animationStyle}
        >
          {items.map((_, i) => (
            <div key={`a-${i}`} className="flex items-center gap-6">
              {children}
            </div>
          ))}
        </div>
        <div
          className={clsx(
            "flex gap-6 shrink-0 items-center",
            vertical ? "flex-col" : "flex-row",
            translateClass
          )}
          style={animationStyle}
          aria-hidden
        >
          {items.map((_, i) => (
            <div key={`b-${i}`} className="flex items-center gap-6">
              {children}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


