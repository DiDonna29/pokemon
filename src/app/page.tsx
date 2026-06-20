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
import { BattleArena } from "@/components/pokedex/BattleArena";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Globe, Sun, Moon, LayoutGrid, Info, ChevronLeft, ChevronRight, Loader2, Sparkles, Star, Swords } from "lucide-react";
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

  // Initial Load
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

  // Update Type Filters
  useEffect(() => {
    async function updateTypeFilters() {
      if (selectedTypes.length === 0) {
        setTypeFilteredNames(null);
        return;
      }
      
      setFiltering(true);
      try {
        const results = await Promise.all(selectedTypes.map(type => fetchPokemonByType(type)));
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

  // Page Reset
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, aiSuggestions, selectedTypes, selectedWeight, selectedHeight, sortBy, showCapturedOnly]);

  // Filtered List
  const filteredList = useMemo(() => {
    let list = [...allPokemon];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.includes(q));
    }
    if (aiSuggestions) {
      list = list.filter(p => aiSuggestions.includes(p.name.toLowerCase()));
    }
    if (typeFilteredNames) {
      list = list.filter(p => typeFilteredNames.has(p.name));
    }
    if (showCapturedOnly) {
      list = list.filter(p => {
        const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
        return caughtPokemon.has(id);
      });
    }
    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "id-desc") {
      list = [...list].reverse();
    }
    return list;
  }, [allPokemon, searchQuery, aiSuggestions, typeFilteredNames, sortBy, showCapturedOnly, caughtPokemon]);

  useEffect(() => {
    const offset = (currentPage - 1) * PAGE_SIZE;
    const paginated = filteredList.slice(offset, offset + PAGE_SIZE);
    setVisiblePokemon(paginated);
    setTotalCount(filteredList.length);
  }, [filteredList, currentPage]);

  useEffect(() => {
    const saved = localStorage.getItem("pokeNexus_caught");
    if (saved) setCaughtPokemon(new Set(JSON.parse(saved)));
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
                <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-full w-8 h-8">
                  <Globe className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-8 h-8">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Tabs */}
      <section className="relative z-10 container mx-auto px-4 py-8">
        <Tabs defaultValue="pokedex" className="space-y-10">
          <div className="flex justify-center">
            <TabsList className="glass bg-foreground/5 h-14 p-1 rounded-3xl w-full max-w-lg border border-foreground/5 shadow-lg">
              <TabsTrigger value="pokedex" className="flex-1 rounded-2xl font-black uppercase text-xs tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-black transition-all h-full">
                <LayoutGrid className="w-4 h-4" />
                {t.infinite_dex}
              </TabsTrigger>
              <TabsTrigger value="arena" className="flex-1 rounded-2xl font-black uppercase text-xs tracking-widest gap-2 data-[state=active]:bg-secondary data-[state=active]:text-white transition-all h-full">
                <Swords className="w-4 h-4" />
                {t.battle_arena}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pokedex" className="mt-0 space-y-10 outline-none">
            <div className="max-w-xl mx-auto">
              <SearchPanel onSearch={handleSearch} onAiSuggest={handleAiSuggest} isLoading={loading} lang={lang} />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-5 rounded-[2.5rem] border-foreground/5"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                 <FiltersDrawer 
                   selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
                   selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
                   selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
                   onClear={handleClearFilters} lang={lang}
                 />
                 <Button variant={showCapturedOnly ? "secondary" : "ghost"} size="sm" onClick={() => setShowCapturedOnly(!showCapturedOnly)} className={cn("rounded-xl font-bold text-xs gap-2 h-10 px-4 transition-all duration-300", showCapturedOnly ? "bg-primary text-black" : "glass border-foreground/10")}>
                   {showCapturedOnly ? <Star className="w-3.5 h-3.5 fill-current" /> : <Star className="w-3.5 h-3.5" />}
                   {t.my_collection}
                 </Button>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 min-h-[400px]">
              <AnimatePresence mode="popLayout">
                {!loading && !filtering && visiblePokemon.map((p) => {
                  const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
                  return (
                    <motion.div key={p.name} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                      <PokemonCard name={p.name} isCaught={caughtPokemon.has(id)} onToggleCaught={toggleCaught} onClick={setSelectedDetails} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {!loading && !filtering && visiblePokemon.length > 0 && (
              <div className="flex justify-center gap-4 pt-10">
                <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl glass h-12 w-12 border-foreground/10"><ChevronLeft className="w-6 h-6" /></Button>
                <div className="glass px-8 py-3 rounded-2xl font-black text-sm tracking-tighter flex items-center gap-2 border-foreground/10">
                  <span className="text-primary">{t.page} {currentPage}</span>
                  <span className="opacity-30">{t.of}</span>
                  <span>{totalPages}</span>
                </div>
                <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl glass h-12 w-12 border-foreground/10"><ChevronRight className="w-6 h-6" /></Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="arena" className="mt-0 outline-none">
            <BattleArena lang={lang} />
          </TabsContent>
        </Tabs>
      </section>

      <PokemonDetailsView pokemon={selectedDetails} onClose={() => setSelectedDetails(null)} lang={lang} />
    </main>
  );
}