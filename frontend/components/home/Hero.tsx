"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { Play, FileText, Sparkles, Upload } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 bg-background overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-accent-secondary/5 opacity-50" />
      
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="space-y-6">
              <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight text-text tracking-tight">
                AI-Powered
                <br />
                <span className="gradient-text">
                  Document Analysis
                </span>
              </h1>
              
              <p className="font-ui text-xl text-text-muted leading-relaxed max-w-2xl">
                Transform your PDFs into actionable insights with intelligent cross-document analysis and contextual recommendations.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/viewer/new">
                <Button className="gradient-accent text-white font-ui font-medium px-8 py-4 text-lg">
                  <Upload className="w-5 h-5 mr-2" />
                  Start Analyzing
                </Button>
              </Link>
              
              <Button className="font-ui bg-transparent border border-border hover:bg-muted px-8 py-4 text-lg">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            {/* Trust indicators */}
            <motion.div 
              className="flex items-center gap-6 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-surface border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-medium">{i}</span>
                    </div>
                  ))}
                </div>
                <span>Trusted by 500+ professionals</span>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Glass mockup */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="relative z-10 glass rounded-2xl shadow-premium p-8 border border-stroke">
              <div className="space-y-6">
                {/* Mock browser chrome */}
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                
                {/* Mock UI */}
                <div className="space-y-4">
                  <div className="h-4 bg-surface rounded-md w-3/4"></div>
                  <div className="h-4 bg-surface rounded-md w-1/2"></div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-surface rounded-lg p-4 space-y-2">
                        <FileText className="w-5 h-5 text-accent-primary" />
                        <div className="h-2 bg-stroke rounded w-full"></div>
                        <div className="h-2 bg-stroke rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Floating elements */}
                <motion.div 
                  className="absolute -top-4 -right-4 bg-accent-primary text-white p-3 rounded-xl shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              </div>
            </div>
            
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-2xl blur-3xl -z-10" />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
