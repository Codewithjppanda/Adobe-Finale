"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/90 backdrop-blur-xl border-b border-stroke shadow-sm" 
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="font-display font-bold text-xl text-text">
              Document Intelligence
            </Link>
            <nav className="hidden md:flex items-center space-x-8 text-sm text-text-muted font-ui">
              <a href="#features" className="hover:text-text transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-text transition-colors">How it Works</a>
              <a href="#showcase" className="hover:text-text transition-colors">Showcase</a>
              <a href="/docs" className="hover:text-text transition-colors">Docs</a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/reader">
              <Button className="font-ui bg-transparent hover:bg-muted">
                Reader
              </Button>
            </Link>
            <Link href="/viewer/new">
              <Button className="gradient-accent text-white font-ui font-medium">
                Get Started
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
