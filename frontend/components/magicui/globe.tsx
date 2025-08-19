"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

interface GlobeProps {
  className?: string;
  config?: any;
}

export function Globe({ className, config = {} }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    let phi = 0;
    let width = 0;
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);

    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // Major tech hubs for document intelligence
        { location: [37.7749, -122.4194], size: 0.03 }, // San Francisco
        { location: [40.7128, -74.0060], size: 0.03 }, // New York
        { location: [51.5074, -0.1278], size: 0.03 }, // London
        { location: [35.6762, 139.6503], size: 0.03 }, // Tokyo
        { location: [28.6139, 77.2090], size: 0.03 }, // Delhi
        { location: [-33.8688, 151.2093], size: 0.03 }, // Sydney
        { location: [55.7558, 37.6176], size: 0.03 }, // Moscow
        { location: [52.5200, 13.4050], size: 0.03 }, // Berlin
      ],
      onRender: (state) => {
        // Auto-rotate the globe
        phi += 0.005;
        state.phi = phi;
        // Add subtle vertical oscillation
        state.theta = Math.sin(phi * 0.5) * 0.1;
      },
      ...config,
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [mounted, config]);

  if (!mounted) {
    return (
      <div className={cn("aspect-square w-full max-w-[600px]", className)}>
        <div className="w-full h-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn("aspect-square w-full max-w-[600px]", className)}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          display: "block",
        }}
        className="rounded-full"
      />
    </div>
  );
}
