"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  PokemonSummary, 
  PokemonDetails, 
  fetchAllPokemon, 
  fetchPokemonByType 
} from "@/lib/pokeapi";
import { PokemonCard } from "@/components/pokedex/PokemonCard";
import { SearchPanel } from "@/components/pokedex/SearchPanel";
import { FiltersDrawer } from "@/components/pokedex/FiltersDrawer";
import { PokemonDetailsView } from "@/components/pokedex/PokemonDetails";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trophy, Globe, Sun, Moon, LayoutGrid, Info, ChevronLeft, ChevronRight, Loader2, Sparkles, Star } from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function Home() {
  // Localization & Theme State
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const t = translations[lang];

  // Data State
  const [allPokemon, setAllPokemon] = useState<PokemonSummary[]>([]);
  const [visiblePokemon, setVisiblePokemon] = useState<PokemonSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeFilteredNames, setTypeFilteredNames] = useState<Set<string> | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const [selectedHeight, setSelectedHeight] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("id-asc");
  const [showCapturedOnly, setShowCapturedOnly] = useState(false);

  // UX State
  const [caughtPokemon, setCaughtPokemon] = useState<Set<number>>(new Set());
  const [selectedDetails, setSelectedDetails] = useState<PokemonDetails | null>(null);
  
  // Apply Theme Class
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Initial Load: Fetch all pokemon names for searching
  useEffect(() => {
    async function loadInitial() {
      try {
        const fullList = await fetchAllPokemon();
        setAllPokemon(fullList);
      } catch (error) {
        console.error("Failed to load pokemon list", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Fetch names by type whenever selectedTypes changes
  useEffect(() => {
    async function updateTypeFilters() {
      if (selectedTypes.length === 0) {
        setTypeFilteredNames(null);
        return;
      }
      
      setFiltering(true);
      try {
        const results = await Promise.all(selectedTypes.map(type => fetchPokemonByType(type)));
        // Intersection of names if multiple types selected
        let intersectedNames: string[] = [];
        results.forEach((typeList, idx) => {
          const names = typeList.map(p => p.pokemon.name);
          if (idx === 0) intersectedNames = names;
          else intersectedNames = intersectedNames.filter(name => names.includes(name));
        });
        setTypeFilteredNames(new Set(intersectedNames));
      } catch (error) {
        console.error("Failed to filter by type", error);
      } finally {
        setFiltering(false);
      }
    }
    updateTypeFilters();
  }, [selectedTypes]);

  // Automatic Page Reset on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, aiSuggestions, selectedTypes, selectedWeight, selectedHeight, sortBy, showCapturedOnly]);

  // Computed Filtered List
  const filteredList = useMemo(() => {
    let list = [...allPokemon];

    // Filter by name (Partial match)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.includes(q));
    }

    // Filter by AI Suggestions
    if (aiSuggestions) {
      list = list.filter(p => aiSuggestions.includes(p.name.toLowerCase()));
    }

    // Filter by Types (from the type-specific API fetch)
    if (typeFilteredNames) {
      list = list.filter(p => typeFilteredNames.has(p.name));
    }

    // Filter by Captured
    if (showCapturedOnly) {
      list = list.filter(p => {
        const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
        return caughtPokemon.has(id);
      });
    }

    // Sorting
    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "id-desc") {
      list = [...list].reverse();
    }

    return list;
  }, [allPokemon, searchQuery, aiSuggestions, typeFilteredNames, sortBy, showCapturedOnly, caughtPokemon]);

  // Update visible list based on filtered list and pagination
  useEffect(() => {
    const offset = (currentPage - 1) * PAGE_SIZE;
    const paginated = filteredList.slice(offset, offset + PAGE_SIZE);
    setVisiblePokemon(paginated);
    setTotalCount(filteredList.length);
  }, [filteredList, currentPage]);

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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setAiSuggestions(null);
  }, []);

  const handleAiSuggest = useCallback((names: string[]) => {
    setAiSuggestions(names);
    setSearchQuery("");
  }, []);

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedWeight(null);
    setSelectedHeight(null);
    setSearchQuery("");
    setAiSuggestions(null);
    setTypeFilteredNames(null);
    setShowCapturedOnly(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

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
      <header className="relative z-50 glass border-b border-foreground/5 py-4 sticky top-0 backdrop-blur-2xl">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30"
            >
              <Trophy className="text-white w-7 h-7" />
            </motion.div>
            <div>
              <h1 className="font-headline text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">PokeNexus</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-70">{t.app_subtitle}</p>
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
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowCapturedOnly(!showCapturedOnly)}
               className={cn(
                 "glass px-5 py-2 rounded-full flex items-center gap-3 border-foreground/10 transition-all duration-300",
                 showCapturedOnly ? "ring-2 ring-primary bg-primary/10" : ""
               )}
             >
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shadow-sm",
                  showCapturedOnly ? "bg-primary animate-ping" : "bg-primary/50 animate-pulse"
                )} />
                <span className="text-xs font-black uppercase tracking-tight">{caughtPokemon.size} {t.captured}</span>
             </motion.button>
             
             <div className="flex items-center gap-1 glass p-1 rounded-full border-foreground/10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                  className="rounded-full w-8 h-8 hover:bg-secondary/10 hover:text-secondary"
                >
                  <Globe className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-full w-8 h-8 hover:bg-primary/10 hover:text-primary"
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
          className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-5 rounded-3xl mb-10 border-foreground/5"
        >
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <FiltersDrawer 
               selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
               selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
               selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
               onClear={handleClearFilters}
               lang={lang}
             />
             
             <div className="flex items-center gap-2">
               <Button 
                 variant={showCapturedOnly ? "secondary" : "ghost"}
                 size="sm"
                 onClick={() => setShowCapturedOnly(!showCapturedOnly)}
                 className={cn(
                   "rounded-xl font-bold text-xs gap-2 h-10 px-4 transition-all duration-300",
                   showCapturedOnly ? "bg-primary text-black" : "glass border-foreground/10"
                 )}
               >
                 {showCapturedOnly ? <Star className="w-3.5 h-3.5 fill-current" /> : <Star className="w-3.5 h-3.5" />}
                 {t.my_collection}
               </Button>
             </div>

             <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 bg-foreground/5 px-3 py-1.5 rounded-full">
               {filtering ? <Loader2 className="w-3 h-3 animate-spin" /> : totalCount} {t.species}
             </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{t.sort_by}</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 glass border-foreground/10 h-10 rounded-xl font-bold text-xs">
                <SelectValue placeholder="Numerical" />
              </SelectTrigger>
              <SelectContent className="glass border-foreground/10">
                <SelectItem value="id-asc" className="text-xs font-bold">{t.numerical_asc}</SelectItem>
                <SelectItem value="id-desc" className="text-xs font-bold">{t.numerical_desc}</SelectItem>
                <SelectItem value="name-asc" className="text-xs font-bold">{t.alpha_asc}</SelectItem>
                <SelectItem value="name-desc" className="text-xs font-bold">{t.alpha_desc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {!loading && !filtering && visiblePokemon.map((p) => {
              const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
              return (
                <motion.div 
                  key={`${p.name}`} 
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <PokemonCard 
                    name={p.name} 
                    isCaught={caughtPokemon.has(id)}
                    onToggleCaught={(id) => toggleCaught(id)}
                    onClick={(details) => setSelectedDetails(details)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Skeleton Loader */}
        {(loading || filtering) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div key={i} className="glass rounded-3xl p-6 h-[320px] flex flex-col items-center justify-between animate-pulse">
                <div className="h-40 w-40 bg-foreground/5 rounded-full" />
                <div className="h-6 w-32 bg-foreground/5 mt-4 rounded-lg" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-16 bg-foreground/5 rounded-full" />
                  <div className="h-5 w-16 bg-foreground/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !filtering && visiblePokemon.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-48 text-center"
          >
             <div className="w-28 h-28 bg-foreground/5 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <Info className="w-12 h-12 text-muted-foreground opacity-50" />
             </div>
             <h3 className="text-3xl font-headline font-black mb-3">{t.no_pokemon}</h3>
             <p className="text-muted-foreground max-w-sm font-medium leading-relaxed">{t.no_pokemon_desc}</p>
             <Button onClick={handleClearFilters} variant="link" className="text-primary mt-6 font-black text-sm uppercase tracking-widest">
               {t.clear_filters}
             </Button>
          </motion.div>
        )}

        {/* Pagination Controls */}
        {!loading && !filtering && visiblePokemon.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-20 flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <div className="glass px-8 py-3 rounded-2xl font-black text-sm tracking-tighter flex items-center gap-2 border-foreground/10">
                <span className="text-primary">{t.page} {currentPage}</span>
                <span className="opacity-30">{t.of}</span>
                <span>{totalPages}</span>
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:bg-secondary/10 hover:text-secondary transition-all active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
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
      <footer className="fixed bottom-0 left-0 w-full z-20 pointer-events-none pb-8">
         <div className="container mx-auto px-4 flex justify-center">
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="glass px-8 py-4 rounded-3xl flex items-center gap-6 border-foreground/10 shadow-2xl pointer-events-auto ring-1 ring-white/5"
            >
               <div className="flex items-center gap-3 pr-6 border-r border-foreground/10">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{t.infinite_dex}</span>
               </div>
               <p className="text-[10px] text-muted-foreground max-w-[220px] leading-tight font-medium">
                 {t.infinite_dex_desc}
               </p>
            </motion.div>
         </div>
      </footer>
    </main>
  );
}