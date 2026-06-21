
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
import { 
  Trophy, 
  Globe, 
  Sun, 
  Moon, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Loader2, 
  Star, 
  Swords 
} from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function Home() {
  // Localization & Theme State
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState("pokedex");
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

  // Pagination Handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const skipForward = () => setCurrentPage(p => Math.min(totalPages, p + 3));
  const skipBackward = () => setCurrentPage(p => Math.max(1, p - 3));

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

      {/* Header with Centered Layout */}
      <header className="relative z-50 glass border-b border-foreground/5 py-4 sticky top-0 backdrop-blur-2xl">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          
          {/* Left: Navigation Buttons */}
          <div className="flex-1 flex justify-start">
            <div className="hidden md:flex glass bg-foreground/5 p-1 rounded-2xl border border-foreground/10 shadow-sm">
              <Button 
                variant={activeTab === "pokedex" ? "secondary" : "ghost"} 
                onClick={() => setActiveTab("pokedex")}
                className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-6", activeTab === "pokedex" ? "bg-primary text-black" : "")}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                {t.infinite_dex}
              </Button>
              <Button 
                variant={activeTab === "arena" ? "secondary" : "ghost"} 
                onClick={() => setActiveTab("arena")}
                className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest h-9 px-6", activeTab === "arena" ? "bg-secondary text-white" : "")}
              >
                <Swords className="w-3.5 h-3.5 mr-2" />
                {t.battle_arena}
              </Button>
            </div>
          </div>

          {/* Center: Logo + Title */}
          <div className="flex items-center gap-3 justify-center">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30"
            >
              <Trophy className="text-white w-6 h-6 sm:w-7 sm:h-7" />
            </motion.div>
            <div className="hidden sm:block text-center">
              <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent leading-none">PokeNexus</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-70 mt-1">{t.app_subtitle}</p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3">
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowCapturedOnly(!showCapturedOnly)}
               className={cn(
                 "glass px-3 sm:px-5 py-2 rounded-full flex items-center gap-2 sm:gap-3 border-foreground/10 transition-all duration-300",
                 showCapturedOnly ? "ring-2 ring-primary bg-primary/10" : ""
               )}
             >
                <div className={cn(
                  "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full",
                  showCapturedOnly ? "bg-primary animate-ping" : "bg-primary/50"
                )} />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight">{caughtPokemon.size}</span>
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

      {/* Content */}
      <section className="relative z-10 container mx-auto px-4 py-8">
        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden justify-center mb-8">
          <div className="glass bg-foreground/5 p-1 rounded-2xl border border-foreground/5 flex w-full max-w-sm shadow-xl">
            <Button 
              variant={activeTab === "pokedex" ? "secondary" : "ghost"} 
              onClick={() => setActiveTab("pokedex")}
              className={cn("flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-9", activeTab === "pokedex" ? "bg-primary text-black" : "")}
            >
              {t.infinite_dex}
            </Button>
            <Button 
              variant={activeTab === "arena" ? "secondary" : "ghost"} 
              onClick={() => setActiveTab("arena")}
              className={cn("flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-9", activeTab === "arena" ? "bg-secondary text-white" : "")}
            >
              {t.battle_arena}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} className="space-y-10">
          <TabsContent value="pokedex" className="mt-0 space-y-10 outline-none">
            <div className="max-w-xl mx-auto">
              <SearchPanel onSearch={handleSearch} onAiSuggest={handleAiSuggest} isLoading={loading} lang={lang} />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 glass p-5 rounded-[2.5rem] border-foreground/10 shadow-lg"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                 <FiltersDrawer 
                   selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
                   selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
                   selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
                   onClear={handleClearFilters} lang={lang}
                 />
                 <Button variant={showCapturedOnly ? "secondary" : "ghost"} size="sm" onClick={() => setShowCapturedOnly(!showCapturedOnly)} className={cn("rounded-xl font-bold text-xs gap-2 h-10 px-4 transition-all duration-300", showCapturedOnly ? "bg-primary text-black shadow-lg" : "glass border-foreground/10 hover:bg-foreground/5")}>
                   {showCapturedOnly ? <Star className="w-3.5 h-3.5 fill-current" /> : <Star className="w-3.5 h-3.5" />}
                   {t.my_collection}
                 </Button>
                 <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 bg-foreground/5 px-4 py-2 rounded-full border border-foreground/5">
                   {filtering ? <Loader2 className="w-3 h-3 animate-spin" /> : totalCount} {t.species}
                 </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t.sort_by}</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 glass border-foreground/10 h-10 rounded-xl font-bold text-xs shadow-sm hover:border-primary/50 transition-colors">
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
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 pt-10">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={goToFirstPage} className="rounded-xl glass h-10 w-10 border-foreground/10 hover:border-primary transition-colors" title={lang === 'en' ? 'First Page' : 'Primera Página'}><ChevronsLeft className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={skipBackward} className="rounded-xl glass h-10 w-10 border-foreground/10 hover:border-primary transition-colors font-bold text-[10px]" title={lang === 'en' ? 'Back 3' : 'Retroceder 3'}>-3</Button>
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl glass h-10 w-10 border-foreground/10 hover:border-primary transition-colors"><ChevronLeft className="w-5 h-5" /></Button>
                </div>

                <div className="glass px-6 py-2 rounded-xl font-black text-xs sm:text-sm tracking-tighter flex items-center gap-2 border-foreground/10 shadow-inner min-w-[120px] justify-center">
                  <span className="text-primary">{t.page} {currentPage}</span>
                  <span className="opacity-30">{t.of}</span>
                  <span>{totalPages}</span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl glass h-10 w-10 border-foreground/10 hover:border-primary transition-colors"><ChevronRight className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={skipForward} className="rounded-xl glass h-10 w-10 border-foreground/10 hover:border-primary transition-colors font-bold text-[10px]" title={lang === 'en' ? 'Forward 3' : 'Adelantar 3'}>+3</Button>
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={goToLastPage} className="rounded-xl glass h-10 w-10 border-foreground/10 hover:border-primary transition-colors" title={lang === 'en' ? 'Last Page' : 'Última Página'}><ChevronsRight className="w-5 h-5" /></Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="arena" className="mt-0 outline-none">
            <BattleArena lang={lang} allPokemon={allPokemon} />
          </TabsContent>
        </Tabs>
      </section>

      <PokemonDetailsView pokemon={selectedDetails} onClose={() => setSelectedDetails(null)} lang={lang} />
    </main>
  );
}
