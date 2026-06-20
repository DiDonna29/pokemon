"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { intelligentPokemonDiscovery } from "@/ai/flows/intelligent-pokemon-discovery-flow";
import { cn } from "@/lib/utils";
import { Language, translations } from "@/lib/i18n";
import { motion } from "framer-motion";

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onAiSuggest: (pokemonNames: string[]) => void;
  isLoading: boolean;
  lang: Language;
}

export function SearchPanel({ onSearch, onAiSuggest, isLoading, lang }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const t = translations[lang];

  // Automatic search for classic mode
  useEffect(() => {
    if (!aiMode) {
      onSearch(query);
    }
  }, [query, aiMode, onSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiMode) {
      handleAiDiscovery();
    }
  };

  const handleAiDiscovery = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    try {
      const result = await intelligentPokemonDiscovery({ description: query });
      onAiSuggest(result.suggestedPokemon.map(p => p.name.toLowerCase()));
      setQuery("");
    } catch (error) {
      console.error("AI Discovery failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <motion.div 
          layout
          className={cn(
            "glass flex items-center p-1 rounded-2xl transition-all duration-300 ring-primary/20",
            aiMode ? "ring-2 shadow-2xl shadow-secondary/10" : "focus-within:ring-2"
          )}
        >
          <div className="pl-4 text-muted-foreground">
            {aiMode ? <Sparkles className="w-5 h-5 text-secondary animate-pulse" /> : <Search className="w-5 h-5" />}
          </div>
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={aiMode ? t.ai_placeholder : t.search_placeholder}
            className="border-none focus-visible:ring-0 text-md h-10 bg-transparent placeholder:text-muted-foreground/40"
          />
          <div className="flex items-center pr-1 gap-1">
             {query && (
               <Button 
                 type="button" 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => { setQuery(""); onSearch(""); }}
                 className="rounded-xl w-8 h-8"
               >
                 <X className="w-4 h-4" />
               </Button>
             )}
             {aiMode && (
               <Button 
                 type="submit" 
                 disabled={isLoading || aiLoading}
                 className="rounded-xl px-5 h-9 font-bold bg-secondary hover:bg-secondary/90 text-white transition-all"
               >
                 {aiLoading ? t.thinking : t.discover}
               </Button>
             )}
          </div>
        </motion.div>
      </form>

      <div className="flex items-center justify-center gap-6">
        <button 
          onClick={() => { setAiMode(false); setQuery(""); }}
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest transition-all relative pb-1",
            !aiMode ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.classic_search}
          {!aiMode && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => { setAiMode(true); setQuery(""); }}
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 relative pb-1",
            aiMode ? "text-secondary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-3 h-3" />
          {t.ai_discovery}
          {aiMode && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary" />}
        </button>
      </div>
    </div>
  );
}
