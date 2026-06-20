"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PokemonSummary, PokemonDetails, fetchPokemonList, fetchPokemonDetails } from "@/lib/pokeapi";
import { PokemonCard } from "@/components/pokedex/PokemonCard";
import { SearchPanel } from "@/components/pokedex/SearchPanel";
import { FiltersDrawer } from "@/components/pokedex/FiltersDrawer";
import { PokemonDetailsView } from "@/components/pokedex/PokemonDetails";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trophy, Github, LayoutGrid, Info } from "lucide-react";

const BATCH_SIZE = 24;

export default function Home() {
  // Data State
  const [allPokemon, setAllPokemon] = useState<PokemonSummary[]>([]);
  const [visiblePokemon, setVisiblePokemon] = useState<PokemonSummary[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const [selectedHeight, setSelectedHeight] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("id-asc");

  // UX State
  const [caughtPokemon, setCaughtPokemon] = useState<Set<number>>(new Set());
  const [selectedDetails, setSelectedDetails] = useState<PokemonDetails | null>(null);
  
  // Ref for observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !searchQuery && !aiSuggestions && selectedTypes.length === 0) {
        setOffset(prev => prev + BATCH_SIZE);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, searchQuery, aiSuggestions, selectedTypes.length]);

  // Load Initial List
  useEffect(() => {
    async function init() {
      setLoading(true);
      const list = await fetchPokemonList(BATCH_SIZE, offset);
      if (list.length === 0) setHasMore(false);
      setVisiblePokemon(prev => [...prev, ...list]);
      setLoading(false);
    }
    if (!searchQuery && !aiSuggestions && selectedTypes.length === 0) {
      init();
    }
  }, [offset, searchQuery, aiSuggestions, selectedTypes.length]);

  // Load Caught state from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("pokeNexus_caught");
    if (saved) {
      setCaughtPokemon(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleCaught = (id: number) => {
    const next = new Set(caughtPokemon);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCaughtPokemon(next);
    localStorage.setItem("pokeNexus_caught", JSON.stringify(Array.from(next)));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setAiSuggestions(null);
    if (!query) {
      setOffset(0);
      setVisiblePokemon([]);
    } else {
      // For a real app, we'd search against a full list. 
      // For this demo, let's just attempt to fetch the specific one if possible
      setVisiblePokemon([{ name: query.toLowerCase(), url: "" }]);
    }
  };

  const handleAiSuggest = (names: string[]) => {
    setAiSuggestions(names);
    setSearchQuery("");
    setVisiblePokemon(names.map(name => ({ name, url: "" })));
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedWeight(null);
    setSelectedHeight(null);
    setSearchQuery("");
    setAiSuggestions(null);
    setVisiblePokemon([]);
    setOffset(0);
  };

  return (
    <main className="min-h-screen bg-background text-foreground relative pb-20 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass border-b border-white/5 py-6 sticky top-0">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <Trophy className="text-black w-7 h-7" />
            </div>
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight text-white">PokeNexus</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">The Ultimate Digital Pokedex</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl px-4 w-full">
            <SearchPanel 
              onSearch={handleSearch} 
              onAiSuggest={handleAiSuggest}
              isLoading={loading}
            />
          </div>

          <div className="hidden lg:flex items-center gap-4">
             <div className="glass px-4 py-2 rounded-full flex items-center gap-2 border-white/10">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-bold">{caughtPokemon.size} Captured</span>
             </div>
             <Button variant="ghost" size="icon" className="rounded-full">
               <Github className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </header>

      {/* Toolbox Section */}
      <section className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-2xl mb-8 border-white/5">
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <FiltersDrawer 
               selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
               selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
               selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
               onClear={handleClearFilters}
             />
             <div className="text-sm text-muted-foreground hidden sm:block">
               Showing {visiblePokemon.length} species
             </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase text-muted-foreground">Sort By</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 glass border-white/10">
                <SelectValue placeholder="Numerical" />
              </SelectTrigger>
              <SelectContent className="glass border-white/10">
                <SelectItem value="id-asc">Lowest # First</SelectItem>
                <SelectItem value="id-desc">Highest # First</SelectItem>
                <SelectItem value="name-asc">Alphabetical A-Z</SelectItem>
                <SelectItem value="name-desc">Alphabetical Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visiblePokemon.map((p, idx) => (
            <div 
              key={`${p.name}-${idx}`} 
              ref={idx === visiblePokemon.length - 1 ? lastElementRef : null}
              className="animate-fade-in-up"
              style={{ animationDelay: `${(idx % 8) * 0.05}s` }}
            >
              <PokemonCard 
                name={p.name} 
                isCaught={caughtPokemon.has(idx + 1)} // Simplified indexing
                onToggleCaught={(id) => toggleCaught(id)}
                onClick={(details) => setSelectedDetails(details)}
              />
            </div>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 h-[280px] flex flex-col items-center justify-between animate-pulse">
                <div className="h-32 w-32 bg-white/5 rounded-full" />
                <div className="h-6 w-24 bg-white/5 mt-4" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-12 bg-white/5 rounded-full" />
                  <div className="h-5 w-12 bg-white/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {visiblePokemon.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-40 text-center">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Info className="w-10 h-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-headline font-bold mb-2">No Pokemon Found</h3>
             <p className="text-muted-foreground max-w-sm">Try adjusting your filters or checking your search query.</p>
             <Button onClick={handleClearFilters} variant="link" className="text-primary mt-4 font-bold">
               Clear all filters
             </Button>
          </div>
        )}
      </section>

      {/* Details Modal */}
      <PokemonDetailsView 
        pokemon={selectedDetails} 
        onClose={() => setSelectedDetails(null)} 
      />

      {/* Floating Info */}
      <footer className="fixed bottom-0 left-0 w-full z-20 pointer-events-none">
         <div className="container mx-auto px-4 pb-6 flex justify-center">
            <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4 border-white/10 shadow-2xl pointer-events-auto">
               <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Infinite Dex</span>
               </div>
               <p className="text-[10px] text-muted-foreground max-w-[200px] leading-tight">
                 Browse all 1000+ species via high-performance PokeAPI integration.
               </p>
            </div>
         </div>
      </footer>
    </main>
  );
}
