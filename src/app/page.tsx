
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PokemonSummary, PokemonDetails, fetchPokemonList } from "@/lib/pokeapi";
import { PokemonCard } from "@/components/pokedex/PokemonCard";
import { SearchPanel } from "@/components/pokedex/SearchPanel";
import { FiltersDrawer } from "@/components/pokedex/FiltersDrawer";
import { PokemonDetailsView } from "@/components/pokedex/PokemonDetails";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trophy, Github, LayoutGrid, Info, Sun, Moon, Globe } from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

const BATCH_SIZE = 24;

export default function Home() {
  // Localization & Theme State
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const t = translations[lang];

  // Data State
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
  
  // Apply Theme Class
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

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
    <main className="min-h-screen bg-background text-foreground relative pb-20 overflow-x-hidden transition-colors duration-500">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px]" 
        />
      </div>

      {/* Header */}
      <header className="relative z-50 glass border-b border-foreground/5 py-4 sticky top-0 backdrop-blur-xl">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <Trophy className="text-black w-7 h-7" />
            </motion.div>
            <div>
              <h1 className="font-headline text-2xl font-bold tracking-tight">PokeNexus</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t.app_subtitle}</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl w-full">
            <SearchPanel 
              onSearch={handleSearch} 
              onAiSuggest={handleAiSuggest}
              isLoading={loading}
              lang={lang}
            />
          </div>

          <div className="flex items-center gap-3">
             <div className="glass px-4 py-2 rounded-full flex items-center gap-2 border-foreground/10">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-bold">{caughtPokemon.size} {t.captured}</span>
             </div>
             
             <div className="flex items-center gap-1 glass p-1 rounded-full border-foreground/10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                  className="rounded-full w-8 h-8"
                >
                  <Globe className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-full w-8 h-8"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Grid Section */}
      <section className="relative z-10 container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-2xl mb-8 border-foreground/5 shadow-sm"
        >
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <FiltersDrawer 
               selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
               selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
               selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
               onClear={handleClearFilters}
               lang={lang}
             />
             <div className="text-sm text-muted-foreground hidden sm:block">
               {visiblePokemon.length} {t.species}
             </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">{t.sort_by}</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 glass border-foreground/10 h-10">
                <SelectValue placeholder="Numerical" />
              </SelectTrigger>
              <SelectContent className="glass border-foreground/10">
                <SelectItem value="id-asc">{t.numerical_asc}</SelectItem>
                <SelectItem value="id-desc">{t.numerical_desc}</SelectItem>
                <SelectItem value="name-asc">{t.alpha_asc}</SelectItem>
                <SelectItem value="name-desc">{t.alpha_desc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {visiblePokemon.map((p, idx) => (
              <motion.div 
                key={`${p.name}-${idx}`} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: (idx % 8) * 0.05 }}
                ref={idx === visiblePokemon.length - 1 ? lastElementRef : null}
              >
                <PokemonCard 
                  name={p.name} 
                  isCaught={caughtPokemon.has(idx + 1)}
                  onToggleCaught={(id) => toggleCaught(id)}
                  onClick={(details) => setSelectedDetails(details)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 h-[280px] flex flex-col items-center justify-between animate-pulse">
                <div className="h-32 w-32 bg-foreground/5 rounded-full" />
                <div className="h-6 w-24 bg-foreground/5 mt-4" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-12 bg-foreground/5 rounded-full" />
                  <div className="h-5 w-12 bg-foreground/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {visiblePokemon.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-40 text-center"
          >
             <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mb-6">
                <Info className="w-10 h-10 text-muted-foreground" />
             </div>
             <h3 className="text-2xl font-headline font-bold mb-2">{t.no_pokemon}</h3>
             <p className="text-muted-foreground max-w-sm">{t.no_pokemon_desc}</p>
             <Button onClick={handleClearFilters} variant="link" className="text-primary mt-4 font-bold">
               {t.clear_filters}
             </Button>
          </motion.div>
        )}
      </section>

      {/* Details Modal */}
      <PokemonDetailsView 
        pokemon={selectedDetails} 
        onClose={() => setSelectedDetails(null)} 
        lang={lang}
      />

      {/* Floating Footer Info */}
      <footer className="fixed bottom-0 left-0 w-full z-20 pointer-events-none pb-6">
         <div className="container mx-auto px-4 flex justify-center">
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="glass px-6 py-3 rounded-2xl flex items-center gap-4 border-foreground/10 shadow-2xl pointer-events-auto"
            >
               <div className="flex items-center gap-2 pr-4 border-r border-foreground/10">
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">{t.infinite_dex}</span>
               </div>
               <p className="text-[10px] text-muted-foreground max-w-[200px] leading-tight">
                 {t.infinite_dex_desc}
               </p>
            </motion.div>
         </div>
      </footer>
    </main>
  );
}
