"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import Link from "next/link";

interface FloatingNavProps {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactElement;
  }[];
  className?: string;
}

export function FloatingNav({ navItems, className }: FloatingNavProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setVisible(currentScrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't render on server to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed top-6 inset-x-0 mx-auto z-50 max-w-fit",
            className
          )}
        >
          <div className="relative glass rounded-full px-6 py-3 border border-stroke shadow-premium">
            <div className="flex items-center space-x-6">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.link}
                  className="relative group flex items-center space-x-2 text-sm text-text-muted hover:text-text transition-colors"
                >
                  {item.icon}
                  <span>{item.name}</span>
                  <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-accent-primary to-accent-secondary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
