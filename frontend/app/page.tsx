"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Upload, Sparkles, Zap, Brain, Search, Play, ArrowRight, CheckCircle } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/theme-toggle";

// Magic UI Components
import dynamic from "next/dynamic";
import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { RainbowButton } from "@/components/magicui/rainbow-button";
const Marquee = dynamic(() => import("@/components/magicui/marquee").then(m => m.Marquee), { ssr: false });
const OrbitingCircles = dynamic(() => import("@/components/magicui/orbiting-circles").then(m => m.OrbitingCircles), { ssr: false });
const Globe = dynamic(() => import("@/components/magicui/globe").then(m => m.Globe), { ssr: false, loading: () => <div className="w-[500px] h-[500px] rounded-full bg-accent-primary/10" /> });

// Aceternity UI Components
import { Spotlight } from "@/components/aceternity/spotlight";
const Meteors = dynamic(() => import("@/components/aceternity/meteors").then(m => m.Meteors), { ssr: false });
const FloatingNav = dynamic(() => import("@/components/aceternity/floating-navbar").then(m => m.FloatingNav), { ssr: false });

// Text animation component (existing)
import { TextGenerateEffect } from "@/components/text-generate-effect";

const navItems = [
  { name: "Features", link: "#features", icon: <Sparkles className="w-4 h-4" /> },
  { name: "How it Works", link: "#how-it-works", icon: <Brain className="w-4 h-4" /> },
  { name: "Showcase", link: "#showcase", icon: <FileText className="w-4 h-4" /> },
  { name: "Reader", link: "/reader", icon: <Search className="w-4 h-4" /> },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text font-ui overflow-x-hidden">
      {/* Floating Navigation */}
      <FloatingNav navItems={navItems} />

      {/* Header/Nav */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-stroke shadow-sm">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="font-display font-bold text-xl text-text">
                Document Intelligence
              </Link>
              <nav className="hidden md:flex items-center space-x-8 text-sm text-text-muted">
                <a href="#features" className="hover:text-text transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-text transition-colors">How it Works</a>
                <a href="#showcase" className="hover:text-text transition-colors">Showcase</a>
                <a href="/docs" className="hover:text-text transition-colors">Docs</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/reader">
                <Button className="
                  font-medium cursor-pointer 
                  bg-gray-100 hover:bg-gray-200 
                  dark:bg-gray-800/80 dark:hover:bg-gray-700/80 
                  border-2 border-gray-300 dark:border-gray-600 
                  text-gray-800 dark:text-gray-100 
                  backdrop-blur-sm
                  transition-all duration-200
                  hover:shadow-md
                  px-4 py-2
                ">
                  Text Selector
                </Button>
              </Link>
              
              <Link href="/viewer/new">
                <Button className="bg-gradient-to-r from-accent-primary to-accent-secondary text-black font-medium hover:shadow-lg transition-all cursor-pointer">
                  Persona Analyzer
                </Button>
              </Link>
              
              <ThemeToggle />
            </div>
          </div>
        </Container>
      </header>

      {/* Production-Ready Hero Section */}
      <section className="relative min-h-screen flex items-center bg-background overflow-hidden">
        <Spotlight className="top-40 left-0 md:left-60 md:-top-20" fill="rgb(139, 92, 246)" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <Meteors number={15} />
        
        <Container className="relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <motion.div 
              className="space-y-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
            <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-full text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4 text-accent-primary" />
                  <span>Powered by Gemini 2.5 Flash & Azure TTS</span>
                </motion.div>
                
                {/* Typewriter Hero Heading (large, light: purple • dark: silver) */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                <TextGenerateEffect
                    className="font-display block max-w-[22ch] md:max-w-[20ch] lg:max-w-[18ch] xl:max-w-[16ch] text-[34px] md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.15] md:leading-[1.12] lg:leading-[1.1] xl:leading-[1.08] mb-4"
                    spanClassName="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] dark:from-[#FAFAFA] dark:via-[#D1D5DB] dark:to-[#A3A3A3]"
                    words="Understand Your Documents Instantly"
                    durationPerCharMs={11}
                    delayMs={70}
                    groupByWords
                  />
                </motion.div>
                
                <motion.p
                  className="text-xl lg:text-2xl text-text-muted leading-relaxed max-w-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Transform your PDFs into actionable insights with intelligent cross-document analysis, contextual recommendations, and 2-speaker AI podcasts.
                </motion.p>
              </div>
              
              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <Link href="/reader">
                  <RainbowButton size="lg" className="px-10 py-5 text-lg">
                    <Upload className="w-6 h-6" />
                  Start Analyzing
                    <ArrowRight className="w-5 h-5" />
                  </RainbowButton>
                </Link>
              </motion.div>
              
              {/* Social Proof */}
              <motion.div 
                className="space-y-4 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary border-3 border-background flex items-center justify-center text-white text-sm font-bold">
                          {i}
                        </div>
                      ))}
                    </div>
                    <div className="text-text-muted">
                      <div className="font-semibold text-text">500+ professionals</div>
                      <div className="text-sm">already analyzing documents</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No setup required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>2-speaker podcasts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Cross-document analysis</span>
              </div>
            </div>
              </motion.div>
            </motion.div>
            
            {/* Right Side - Interactive Globe */}
            <motion.div 
              className="relative flex items-center justify-center will-change-transform"
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: 0.4, duration: 1, type: "spring", stiffness: 100 }}
            >
              {/* Globe Container */}
            <div className="relative">
                <Globe 
                  className="w-[420px] h-[420px] md:w-[480px] md:h-[480px] lg:w-[520px] lg:h-[520px] mx-auto" 
                  config={{
                    devicePixelRatio: 2,
                    phi: 0,
                    theta: 0.3,
                    dark: 1,
                    diffuse: 1.2,
                    mapSamples: 20000,
                    mapBrightness: 8,
                    baseColor: [0.1, 0.1, 0.1],
                    markerColor: [139/255, 92/255, 246/255],
                    glowColor: [139/255, 92/255, 246/255],
                  }}
                />
                
                {/* Floating Info Cards */}
                <motion.div
                  className="absolute top-16 -left-8 bg-surface/90 backdrop-blur-sm border border-stroke rounded-xl p-4 shadow-premium"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="font-semibold text-sm">10,847 PDFs</div>
                      <div className="text-xs text-text-muted">Processed today</div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  className="absolute bottom-16 -right-8 bg-surface/90 backdrop-blur-sm border border-stroke rounded-xl p-4 shadow-premium"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4, duration: 0.6 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-accent-secondary rounded-full animate-pulse"></div>
                    <div>
                      <div className="font-semibold text-sm">2.4M insights</div>
                      <div className="text-xs text-text-muted">Generated globally</div>
                    </div>
                      </div>
                </motion.div>
                
                <motion.div
                  className="absolute top-1/2 -right-16 bg-surface/90 backdrop-blur-sm border border-stroke rounded-xl p-4 shadow-premium"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-accent-primary rounded-full animate-pulse"></div>
                    <div>
                      <div className="font-semibold text-sm">127 countries</div>
                      <div className="text-xs text-text-muted">Using our platform</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/10 via-accent-secondary/10 to-accent-tertiary/10 rounded-full blur-3xl scale-150 -z-10" />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Features Section with Bento Grid */}
      <section id="features" className="py-20 bg-surface/50">
        <Container>
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <AnimatedGradientText 
              as="h2" 
              className="font-display text-4xl md:text-5xl font-bold mb-4"
            >
            Powerful Features
            </AnimatedGradientText>
            <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Everything you need to extract insights from your documents and make informed decisions
          </p>
          </motion.div>

          {/* Scrolling feature tags */}
          <div className="mb-16">
            <Marquee className="py-4" pauseOnHover speed={35}>
              {[
                "Bulk PDF Processing", "AI-Powered Analysis", "Cross-Document Linking",
                "Smart Outlines", "Contextual Search", "Real-time Processing",
                "Audio Podcasts", "Semantic Matching", "Instant Insights"
              ].map((feature, i) => (
                <div key={i} className="mx-4 px-6 py-3 rounded-full text-sm bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 text-text border border-accent-primary/20 whitespace-nowrap backdrop-blur-sm">
                  {feature}
                </div>
              ))}
            </Marquee>
          </div>

          {/* Bento Grid Features */}
          <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BentoCard className="col-span-1 md:col-span-2" gradient>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent-primary/20 rounded-lg">
                    <Upload className="w-6 h-6 text-accent-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-xl">Bulk PDF Processing</h3>
                </div>
                <p className="text-text-muted mb-4 flex-1">
                  Upload multiple PDFs simultaneously and process them in batches for efficient analysis with intelligent content extraction.
                </p>
                <div className="flex items-center gap-2 text-sm text-accent-primary">
                  <CheckCircle className="w-4 h-4" />
                  <span>Supports 100+ PDFs at once</span>
                </div>
              </div>
            </BentoCard>

            <BentoCard>
              <div className="flex flex-col h-full">
                <div className="p-2 bg-accent-secondary/20 rounded-lg w-fit mb-4">
                  <Brain className="w-6 h-6 text-accent-secondary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">AI Analysis</h3>
                <p className="text-text-muted text-sm flex-1">
                  Advanced ML algorithms provide contextual recommendations and insights.
                </p>
              </div>
            </BentoCard>

            <BentoCard>
              <div className="flex flex-col h-full">
                <div className="p-2 bg-accent-tertiary/20 rounded-lg w-fit mb-4">
                  <Search className="w-6 h-6 text-accent-tertiary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">Smart Search</h3>
                <p className="text-text-muted text-sm flex-1">
                  Find relevant sections across multiple documents with intelligent matching.
                </p>
              </div>
            </BentoCard>

            <BentoCard className="col-span-1 md:col-span-2" gradient>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent-secondary/20 rounded-lg">
                    <Sparkles className="w-6 h-6 text-accent-secondary" />
                  </div>
                  <h3 className="font-display font-semibold text-xl">2-Speaker Podcasts</h3>
                </div>
                <p className="text-text-muted mb-4 flex-1">
                  Generate professional audio podcasts with realistic dialogue between a host and analyst, powered by Azure TTS.
                </p>
                <div className="flex items-center gap-2 text-sm text-accent-secondary">
                  <CheckCircle className="w-4 h-4" />
                  <span>Professional male & female voices</span>
          </div>
        </div>
            </BentoCard>
          </BentoGrid>
        </Container>
      </section>

      {/* How It Works Timeline */}
      <section id="how-it-works" className="py-20 bg-background">
        <Container>
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto">
              Simple three-step process to transform your documents into actionable insights
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Documents",
                description: "Drag and drop your PDFs or use our bulk upload feature to add multiple documents at once.",
                icon: <Upload className="w-8 h-8" />,
                color: "accent-primary"
              },
              {
                step: "02",
                title: "Select Text",
                description: "Highlight any text in the PDF viewer and get instant contextual recommendations from related documents.",
                icon: <Search className="w-8 h-8" />,
                color: "accent-secondary"
              },
              {
                step: "03",
                title: "Get Insights",
                description: "Receive AI-powered analysis with relevant sections, insights, and even generate audio podcasts.",
                icon: <Sparkles className="w-8 h-8" />,
                color: "accent-tertiary"
              }
            ].map((step, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className={`w-20 h-20 bg-gradient-to-r from-${step.color} to-${step.color}/80 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  {step.icon}
                </div>
                <div className="text-sm font-mono text-text-muted mb-2">{step.step}</div>
                <h3 className="font-display text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-text-muted leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-20 bg-surface/50">
        <Container>
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto">
              Join thousands of professionals who rely on our platform for document intelligence
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div 
                key={i} 
                className="h-16 bg-surface border border-stroke rounded-xl flex items-center justify-center hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-text-muted font-medium text-sm">Company {i + 1}</span>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <Container className="relative z-10">
          <motion.div 
            className="text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Documents?
          </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start analyzing your PDFs with AI-powered insights and discover the hidden value in your documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/viewer/new">
                <Button className="bg-white text-accent-primary font-medium hover:bg-white/90 shadow-lg px-8 py-4 text-lg">
                  <Upload className="w-5 h-5 mr-2" />
              Start Free Analysis
                </Button>
            </Link>
                              <Button className="border-white/30 text-white hover:bg-white/10 font-medium px-8 py-4 text-lg border-2">
                <Play className="w-5 h-5 mr-2" />
              Schedule Demo
              </Button>
          </div>
          </motion.div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-surface py-16 border-t border-stroke">
        <Container>
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-display text-xl font-bold mb-4">Document Intelligence</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                AI-powered document analysis platform that transforms your PDFs into actionable insights.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#features" className="hover:text-text transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-text transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-text transition-colors">About</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><a href="#" className="hover:text-text transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-text transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-stroke pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-text-muted mb-4 md:mb-0">
              © 2024 Document Intelligence. All rights reserved.
            </div>
            <div className="text-sm text-text-muted">
              Hackathon demo • Powered by Gemini 2.5 Flash & Azure TTS
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}