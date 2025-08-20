"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { generateInsights, generateAudio } from "@/lib/api";
import { ExternalLink, BookOpen, Zap, Volume2, Play, Pause, Lightbulb, X } from "lucide-react";

type Match = { 
  docId: string; 
  filename: string; 
  page: number; 
  title: string; 
  snippet: string; 
  score: number;
  pdf_name?: string;
  section_heading?: string;
  section_content?: string;
  section_id?: string;
  relevance_reason?: string;
};

export default function RelatedPanel({
  matches,
  onOpen,
  selection,
  isSearching = false,
  searchStatus = "idle",
}: {
  matches: Match[];
  selection: string;
  isSearching?: boolean;
  searchStatus?: "idle" | "searching" | "found" | "no-results";
  onOpen: (m: Match) => void;
}) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [showInsightCard, setShowInsightCard] = useState(false);
  // Clear insights and related state when selection changes
  useEffect(() => {
    setInsights([]);
    setCurrentInsightIndex(0);
    setShowInsightCard(false);
    setAudioUrl(null);
    setAudioElement(null);
    setIsPlaying(false);
  }, [selection]);

  const onInsights = async () => {
    setLoading(true);
    try {
      const res = await generateInsights({ selection, matches });
      setInsights(res.insights || []);
      setCurrentInsightIndex(0);
    } catch (error) {
      console.error("Failed to generate insights:", error);
      setInsights(["Failed to generate insights. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  // Function to categorize insight type based on content
  const getInsightType = (insight: string) => {
    if (insight.includes('💡') || insight.toLowerCase().includes('did you know')) {
      return { type: 'Did You Know', icon: '💡', color: 'bg-blue-50 border-blue-200 text-blue-800' };
    } else if (insight.includes('📝') || insight.toLowerCase().includes('example')) {
      return { type: 'Example', icon: '📝', color: 'bg-green-50 border-green-200 text-green-800' };
    } else if (insight.includes('⚖️') || insight.toLowerCase().includes('contradiction') || insight.toLowerCase().includes('counterpoint')) {
      return { type: 'Counterpoint', icon: '⚖️', color: 'bg-red-50 border-red-200 text-red-800' };
    } else if (insight.includes('🔑') || insight.toLowerCase().includes('key takeaway')) {
      return { type: 'Key Takeaway', icon: '🔑', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' };
    } else if (insight.includes('🔗') || insight.toLowerCase().includes('inspiration')) {
      return { type: 'Inspiration', icon: '🔗', color: 'bg-purple-50 border-purple-200 text-purple-800' };
    } else {
      return { type: 'Insight', icon: '✨', color: 'bg-gray-50 border-gray-200 text-gray-800' };
    }
  };

  const handleBulbClick = () => {
    if (insights.length > 0) {
      setShowInsightCard(true);
    } else {
      onInsights();
    }
  };

  const nextInsight = () => {
    setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentInsightIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const onGenerateAudio = async () => {
    setAudioLoading(true);
    try {
      const res = await generateAudio({ 
        selection, 
        matches, 
        insights,
        voice: "en-US-AriaNeural"
      });
      
      if (res.audio_url) {
        setAudioUrl(`http://localhost:8000${res.audio_url}`);
      } else if (res.script) {
        // Show the script if available
        console.log("📝 Podcast Script:", res.script);
        alert(`🎙️ Podcast Script Ready!\n\n${res.script?.substring(0, 500)}...`);
      } else if (res.error) {
        console.error("Audio generation error:", res.error);
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
    } finally {
      setAudioLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioUrl) return;

    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = (error) => {
        console.error("Audio error:", error);
        setIsPlaying(false);
      };
      setAudioElement(audio);
      
      // Handle the play promise
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio play failed:", error);
          setIsPlaying(false);
        });
      }
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        // Handle the play promise for existing audio element
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio play failed:", error);
            setIsPlaying(false);
          });
        }
      }
    }
  };

  return (
    <div className="space-y-3 relative overflow-visible">
      <div className="flex items-center justify-between relative overflow-visible">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Related Sections</h3>
          
          {/* Real-time status indicator */}
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"
              />
            )}
            

          </AnimatePresence>
        </div>
        <div className="flex gap-2 relative overflow-visible">
          {/* Beautiful Blinking Bulb */}
          <motion.div
            className="relative overflow-visible"
            animate={insights.length > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ 
              duration: 2, 
              repeat: insights.length > 0 ? Infinity : 0,
              ease: "easeInOut" 
            }}
          >
            <Button 
              className={`rounded-full w-10 h-10 p-0 relative overflow-hidden ${
                insights.length > 0 
                  ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-lg" 
                  : "hover:bg-yellow-50"
              }`}
              onClick={handleBulbClick} 
              disabled={!selection || matches.length === 0 || loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-4 h-4" />
                </motion.div>
              ) : (
                <Lightbulb className={`w-5 h-5 ${insights.length > 0 ? "text-yellow-900" : ""}`} />
              )}
              
              {/* Glowing effect when insights are available */}
              {insights.length > 0 && (
                <motion.div
                  className="absolute inset-0 bg-yellow-300 rounded-full"
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ zIndex: -1 }}
                />
              )}
            </Button>
            
            {/* Insight count badge */}
            {insights.length > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                {insights.length}
              </motion.div>
            )}
            

          </motion.div>
          
          {/* Audio Controls */}
          {insights.length > 0 && !audioUrl && (
            <Button 
              className="rounded-lg gap-1 bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/50 px-3 py-1 text-sm text-blue-800 dark:text-blue-200" 
              onClick={onGenerateAudio} 
              disabled={audioLoading}
            >
              <Volume2 className="w-3 h-3" />
              {audioLoading ? "Generating…" : "Podcast"}
            </Button>
          )}
          
          {audioUrl && (
            <Button 
              className="rounded-lg gap-1 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800/50 px-3 py-1 text-sm text-green-800 dark:text-green-200" 
              onClick={toggleAudio}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? "Pause" : "Play"}
        </Button>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {isSearching 
          ? "Searching for related content..." 
          : "Select any text in the PDF to see semantic matches across your library."
        }
      </div>
      
      <AnimatePresence mode="wait">
        {matches.length > 0 ? (
          <motion.ul 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence>
        {matches.map((m, i) => (
                <motion.li 
                  key={`${m.section_id || m.docId}-${i}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  className="group relative"
                >
                  <motion.div 
                    className="p-3 rounded-lg border hover:border-accent transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => onOpen(m)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    {/* Background gradient based on relevance */}
                    <div 
                      className="absolute inset-0 opacity-[0.02] pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${
                          m.score > 0.8 ? '#22c55e' : m.score > 0.6 ? '#f59e0b' : '#ef4444'
                        }, transparent)`
                      }}
                    />
                    
                    <div className="flex items-start justify-between gap-3 mb-2 relative">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate" title={m.section_heading || m.title || m.filename}>
                          {m.section_heading || m.title || m.filename}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <span className="truncate">{m.pdf_name || m.filename}</span>
                          <span>•</span>
                          <span>Page {m.page}</span>
                          <span>•</span>
                          <motion.span 
                            className="font-mono"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 + 0.3 }}
                          >
                            {(m.score * 100).toFixed(0)}%
                          </motion.span>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                      >
                        <Button 
                          className="rounded-lg gap-1 bg-muted/50 hover:bg-muted px-3 py-1 text-sm border border-border" 
                          onClick={(e) => { e.stopPropagation(); onOpen(m); }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </Button>
                      </motion.div>
            </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed relative">
                      {m.snippet}
                    </p>
                    {m.relevance_reason && (
                      <motion.p 
                        className="text-xs mt-2 text-muted-foreground italic flex items-center gap-1"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                      >
                        <span className="text-[10px]">💡</span>
                        {m.relevance_reason}
                      </motion.p>
                    )}
                    
                    {/* Enhanced relevance indicator */}
                    <motion.div 
                      className="absolute top-2 right-2 w-2 h-2 rounded-full shadow-sm"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 + 0.4, type: "spring" }}
                      style={{
                        backgroundColor: m.score > 0.8 ? '#22c55e' : m.score > 0.6 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-sm text-muted-foreground text-center py-8"
          >
            <motion.div 
              className="flex flex-col items-center gap-3"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                ) : (
                  <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {isSearching ? "Searching..." : 
                   searchStatus === "no-results" ? "No matches found" : 
                   "No matches yet"}
                </p>
                <p className="text-xs mt-1">
                  {isSearching ? "Looking for related content..." :
                   searchStatus === "no-results" ? "Try selecting different text" :
                   "Select text in the PDF to find related content"}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Beautiful Insight Card Modal */}
      <AnimatePresence>
        {showInsightCard && insights.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInsightCard(false)}
            />
            
            {/* Insight Card */}
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {(() => {
                const currentInsight = insights[currentInsightIndex];
                const insightData = getInsightType(currentInsight);
                
                return (
                  <div className={`p-6 rounded-2xl border-2 shadow-2xl ${insightData.color} backdrop-blur-md`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{insightData.icon}</span>
                        <h3 className="font-bold text-lg">{insightData.type}</h3>
                      </div>
                      <Button
                        className="h-8 w-8 p-0 hover:bg-black/10 bg-transparent"
                        onClick={() => setShowInsightCard(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Insight Content */}
                    <motion.div
                      key={currentInsightIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6"
                    >
                      <p className="text-sm leading-relaxed">
                        {currentInsight.replace(/^[🔑💡⚖️📝🔗✨]\s*/, '').replace(/\*\*/g, '')}
                      </p>
                    </motion.div>
                    
                    {/* Navigation */}
                    {insights.length > 1 && (
                      <div className="flex items-center justify-between">
                        <Button
                          onClick={prevInsight}
                          className="bg-white/50 hover:bg-white/70 bg-transparent border border-current hover:bg-white/70 px-3 py-1 text-sm"
                        >
                          ← Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {insights.map((_, index) => (
                            <motion.div
                              key={index}
                              className={`w-2 h-2 rounded-full ${
                                index === currentInsightIndex ? 'bg-current' : 'bg-current/30'
                              }`}
                              animate={{ scale: index === currentInsightIndex ? 1.2 : 1 }}
                            />
                          ))}
                        </div>
                        
                        <Button
                          onClick={nextInsight}
                          className="bg-white/50 hover:bg-white/70 bg-transparent border border-current hover:bg-white/70 px-3 py-1 text-sm"
                        >
                          Next →
                        </Button>
        </div>
      )}
                    
                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-current/20">
                      <p className="text-xs opacity-70 text-center">
                        Insight {currentInsightIndex + 1} of {insights.length} • Powered by Gemini 2.5 Flash
                      </p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


