"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">Document in intelligence</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="opacity-80 hover:opacity-100">Home</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}


