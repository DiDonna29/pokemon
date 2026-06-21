"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Eraser } from "lucide-react";
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

  const clearSearch = () => {
    setQuery("");
    onSearch("");
    onAiSuggest(null as any);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSearch} className="relative group">
        <motion.div 
          layout
          className={cn(
            "glass flex items-center p-1.5 rounded-2xl transition-all duration-500 border-2",
            aiMode 
              ? "border-secondary/30 ring-4 ring-secondary/10 shadow-2xl shadow-secondary/20 bg-secondary/5" 
              : "border-foreground/10 hover:border-primary/40 focus-within:border-primary/60 shadow-xl"
          )}
        >
          <div className="pl-4 text-muted-foreground group-focus-within:text-primary transition-colors">
            {aiMode ? <Sparkles className="w-6 h-6 text-secondary animate-pulse" /> : <Search className="w-6 h-6" />}
          </div>
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={aiMode ? t.ai_placeholder : t.search_placeholder}
            className={cn(
              "border-none focus-visible:ring-0 text-lg h-12 bg-transparent font-bold tracking-tight",
              "placeholder:text-muted-foreground/50 placeholder:font-medium",
              aiMode ? "text-secondary" : "text-foreground"
            )}
          />
          <div className="flex items-center pr-1 gap-2">
             {query && (
               <Button 
                 type="button" 
                 variant="ghost" 
                 size="icon" 
                 onClick={clearSearch}
                 className="rounded-xl w-10 h-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                 title={t.reset}
               >
                 <Eraser className="w-5 h-5" />
               </Button>
             )}
             {aiMode && (
               <Button 
                 type="submit" 
                 disabled={isLoading || aiLoading}
                 className="rounded-xl px-6 h-11 font-black uppercase text-[10px] tracking-widest bg-secondary hover:bg-secondary/90 text-white transition-all shadow-lg hover:shadow-secondary/30 active:scale-95"
               >
                 {aiLoading ? t.thinking : t.discover}
               </Button>
             )}
          </div>
        </motion.div>
      </form>

      <div className="flex items-center justify-center gap-8">
        <button 
          onClick={() => { setAiMode(false); setQuery(""); onAiSuggest(null as any); }}
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] transition-all relative pb-2 px-2",
            !aiMode ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground opacity-60"
          )}
        >
          {t.classic_search}
          {!aiMode && (
            <motion.div 
              layoutId="underline" 
              className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
            />
          )}
        </button>
        <button 
          onClick={() => { setAiMode(true); setQuery(""); onAiSuggest(null as any); }}
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 relative pb-2 px-2",
            aiMode ? "text-secondary scale-110" : "text-muted-foreground hover:text-foreground opacity-60"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t.ai_discovery}
          {aiMode && (
            <motion.div 
              layoutId="underline" 
              className="absolute bottom-0 left-0 w-full h-1 bg-secondary rounded-full shadow-[0_0_10px_rgba(var(--secondary),0.5)]" 
            />
          )}
        </button>
      </div>
    </div>
  );
}
