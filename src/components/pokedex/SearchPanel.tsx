"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Eraser } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { intelligentPokemonDiscovery } from "@/ai/flows/intelligent-pokemon-discovery-flow";
import { cn } from "@/lib/utils";
import { Language, translations } from "@/lib/i18n";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onAiSuggest: (pokemonNames: string[] | null) => void;
  isLoading: boolean;
  lang: Language;
}

export function SearchPanel({ onSearch, onAiSuggest, isLoading, lang }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();
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
      if (result && result.suggestedPokemon && result.suggestedPokemon.length > 0) {
        onAiSuggest(result.suggestedPokemon.map(p => p.name.toLowerCase()));
      } else {
        onAiSuggest([]); // No results found, trigger empty state
      }
    } catch (error) {
      console.error("AI Discovery failed:", error);
      toast({
        variant: "destructive",
        title: lang === 'es' ? "Error de IA" : "AI Error",
        description: lang === 'es' 
          ? "No se pudo conectar con el servicio de IA o no se encontraron resultados." 
          : "Could not connect to AI service or no results found.",
      });
      onAiSuggest(null); // Reset to all pokemon on error
    } finally {
      setAiLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
    onAiSuggest(null);
  };

  const toggleAiMode = (enabled: boolean) => {
    setAiMode(enabled);
    setQuery("");
    onAiSuggest(null);
    onSearch("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      <form onSubmit={handleSearch} className="relative group">
        <motion.div 
          layout
          className={cn(
            "glass flex items-center p-2 rounded-[2.5rem] transition-all duration-1000 border-2",
            aiMode 
              ? "border-secondary/40 ring-[12px] ring-secondary/5 shadow-[0_40px_80px_-20px_rgba(var(--secondary),0.3)] bg-secondary/[0.03]" 
              : "border-foreground/10 hover:border-primary/40 focus-within:border-primary/60 shadow-2xl"
          )}
        >
          <div className="pl-6 text-muted-foreground group-focus-within:text-primary transition-colors">
            {aiMode ? <Sparkles className="w-8 h-8 text-secondary animate-pulse" /> : <Search className="w-8 h-8" />}
          </div>
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={aiMode ? t.ai_placeholder : t.search_placeholder}
            className={cn(
              "border-none focus-visible:ring-0 text-xl h-16 bg-transparent font-black tracking-tight",
              "placeholder:text-muted-foreground/30 placeholder:font-medium",
              aiMode ? "text-secondary" : "text-foreground"
            )}
          />
          <div className="flex items-center pr-2 gap-3">
             {query && (
               <Button 
                 type="button" 
                 variant="ghost" 
                 size="icon" 
                 onClick={clearSearch}
                 className="rounded-2xl w-12 h-12 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                 title={t.reset}
               >
                 <Eraser className="w-6 h-6" />
               </Button>
             )}
             {aiMode && (
               <Button 
                 type="submit" 
                 disabled={isLoading || aiLoading}
                 className="rounded-2xl px-10 h-14 font-black uppercase text-[11px] tracking-[0.3em] bg-secondary hover:bg-secondary/90 text-white transition-all shadow-xl hover:shadow-secondary/40 active:scale-95"
               >
                 {aiLoading ? t.thinking : t.discover}
               </Button>
             )}
          </div>
        </motion.div>
      </form>

      <div className="flex items-center justify-center gap-12">
        <button 
          onClick={() => toggleAiMode(false)}
          className={cn(
            "text-[11px] font-black uppercase tracking-[0.4em] transition-all relative pb-3 px-3",
            !aiMode ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground opacity-40"
          )}
        >
          {t.classic_search}
          {!aiMode && (
            <motion.div 
              layoutId="underline" 
              className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full shadow-[0_10px_20px_rgba(var(--primary),0.6)]" 
            />
          )}
        </button>
        <button 
          onClick={() => toggleAiMode(true)}
          className={cn(
            "text-[11px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-3 relative pb-3 px-3",
            aiMode ? "text-secondary scale-110" : "text-muted-foreground hover:text-foreground opacity-40"
          )}
        >
          <Sparkles className="w-4 h-4" />
          {t.ai_discovery}
          {aiMode && (
            <motion.div 
              layoutId="underline" 
              className="absolute bottom-0 left-0 w-full h-1 bg-secondary rounded-full shadow-[0_10px_20px_rgba(var(--secondary),0.6)]" 
            />
          )}
        </button>
      </div>
    </div>
  );
}