"use client";

import { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { intelligentPokemonDiscovery } from "@/ai/flows/intelligent-pokemon-discovery-flow";
import { cn } from "@/lib/utils";

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onAiSuggest: (pokemonNames: string[]) => void;
  isLoading: boolean;
}

export function SearchPanel({ onSearch, onAiSuggest, isLoading }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiMode) {
      handleAiDiscovery();
    } else {
      onSearch(query);
    }
  };

  const handleAiDiscovery = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    try {
      const result = await intelligentPokemonDiscovery({ description: query });
      onAiSuggest(result.suggestedPokemon.map(p => p.name.toLowerCase()));
      setQuery(""); // Clear after AI discovery
    } catch (error) {
      console.error("AI Discovery failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <form onSubmit={handleSearch} className="relative group">
        <div className={cn(
          "glass flex items-center p-1 rounded-2xl transition-all duration-300 ring-primary/20",
          aiMode ? "ring-2 shadow-[0_0_25px_rgba(99,102,241,0.2)]" : "focus-within:ring-2"
        )}>
          <div className="pl-4 text-muted-foreground">
            {aiMode ? <Sparkles className="w-5 h-5 text-secondary" /> : <Search className="w-5 h-5" />}
          </div>
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={aiMode ? "Ask AI: 'a fast fire-type that can fly'..." : "Search by name, number or type..."}
            className="border-none focus-visible:ring-0 text-lg h-12 bg-transparent placeholder:text-muted-foreground/50"
          />
          <div className="flex items-center pr-1 gap-1">
             {query && (
               <Button 
                 type="button" 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => { setQuery(""); onSearch(""); }}
                 className="rounded-xl"
               >
                 <X className="w-4 h-4" />
               </Button>
             )}
             <Button 
               type="submit" 
               disabled={isLoading || aiLoading}
               className={cn(
                 "rounded-xl px-6 h-10 font-bold transition-all",
                 aiMode ? "bg-secondary hover:bg-secondary/80 text-white" : "bg-primary hover:bg-primary/80 text-black"
               )}
             >
               {aiLoading ? "Thinking..." : aiMode ? "Discover" : "Search"}
             </Button>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={() => setAiMode(false)}
          className={cn(
            "text-xs font-bold uppercase tracking-widest transition-all",
            !aiMode ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground hover:text-white"
          )}
        >
          Classic Search
        </button>
        <button 
          onClick={() => setAiMode(true)}
          className={cn(
            "text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
            aiMode ? "text-secondary border-b-2 border-secondary pb-1" : "text-muted-foreground hover:text-white"
          )}
        >
          <Sparkles className="w-3 h-3" />
          AI Discovery
        </button>
      </div>
    </div>
  );
}
