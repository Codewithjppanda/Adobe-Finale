"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_0%,_oklch(90%_0.06_28/.8),_transparent_60%)]" />
      <div className="mx-auto max-w-5xl px-4 py-14 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Welcome to Document Intelligence
        </h1>
        <p className="mt-3 text-base opacity-70">
          Explore your documents and discover vaiuble insights
        </p>
        <div className="mt-6">
          <Button asChild className="rounded-xl h-11 px-6 text-base">
            <Link href="/viewer/new">Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}


