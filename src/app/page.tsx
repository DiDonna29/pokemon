
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

const POKEMON_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

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
  const [searchTypeFilteredNames, setSearchTypeFilteredNames] = useState<Set<string> | null>(null);
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

  // Detect if search query is a type (English or Spanish) and fetch
  useEffect(() => {
    async function checkSearchForType() {
      const q = searchQuery.toLowerCase().trim();
      if (!q) {
        setSearchTypeFilteredNames(null);
        return;
      }

      // Find the type key even if searched in Spanish
      let matchedType: string | null = null;
      
      // Check direct English match
      if (POKEMON_TYPES.includes(q)) {
        matchedType = q;
      } 
      // Check translations (Spanish or English)
      else {
        const currentTranslations = translations[lang];
        const esTranslations = translations.es;
        const enTranslations = translations.en;
        
        matchedType = POKEMON_TYPES.find(type => {
          const transCurrent = (currentTranslations as any)[type]?.toLowerCase();
          const transEs = (esTranslations as any)[type]?.toLowerCase();
          const transEn = (enTranslations as any)[type]?.toLowerCase();
          return transCurrent === q || transEs === q || transEn === q;
        }) || null;
      }

      if (matchedType) {
        setFiltering(true);
        try {
          const typeList = await fetchPokemonByType(matchedType);
          setSearchTypeFilteredNames(new Set(typeList.map(p => p.pokemon.name)));
        } catch (error) {
          console.error("Search type filter failed", error);
          setSearchTypeFilteredNames(null);
        } finally {
          setFiltering(false);
        }
      } else {
        setSearchTypeFilteredNames(null);
      }
    }
    
    checkSearchForType();
  }, [searchQuery, lang]);

  // Update Drawer Type Filters
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

  // Filtered List Logic (Supports Name, ID, Type, AI, Captured)
  const filteredList = useMemo(() => {
    let list = [...allPokemon];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        // Extract ID from URL
        const id = p.url.split('/').filter(Boolean).pop() || '0';
        
        // Match by Name
        const nameMatch = p.name.includes(q);
        // Match by ID
        const idMatch = id === q || id.startsWith(q);
        // Match by Type (if search query matched a type name in useEffect)
        const typeMatch = searchTypeFilteredNames?.has(p.name);
        
        return nameMatch || idMatch || typeMatch;
      });
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

    // Sorting
    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "id-desc") {
      list = [...list].reverse();
    }
    // id-asc is default (pokeapi list is already sorted by id)
    
    return list;
  }, [allPokemon, searchQuery, searchTypeFilteredNames, aiSuggestions, typeFilteredNames, sortBy, showCapturedOnly, caughtPokemon]);

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
    setSearchTypeFilteredNames(null);
    setShowCapturedOnly(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Pagination Handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const skipForward = () => setCurrentPage(p => Math.min(totalPages, p + 3));
  const skipBackward = () => setCurrentPage(p => Math.max(1, p - 3));

  return (
    <main className="min-h-[100dvh] bg-background text-foreground relative pb-20 overflow-x-hidden transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-secondary/10 rounded-full blur-[150px]" 
        />
      </div>

      {/* Modern Centered Header */}
      <header className="relative z-50 glass border-b border-foreground/5 py-4 sticky top-0 backdrop-blur-2xl px-4 md:px-8">
        <div className="container mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Navigation */}
          <div className="flex-1 flex justify-start">
            <div className="flex glass bg-foreground/5 p-1 rounded-2xl border border-foreground/10 shadow-sm overflow-hidden">
              <Button 
                variant="ghost"
                onClick={() => setActiveTab("pokedex")}
                className={cn(
                  "rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest h-9 px-3 md:px-6 transition-all",
                  activeTab === "pokedex" ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5 md:mr-2" />
                <span className="hidden md:inline">{t.infinite_dex}</span>
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setActiveTab("arena")}
                className={cn(
                  "rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest h-9 px-3 md:px-6 transition-all",
                  activeTab === "arena" ? "bg-secondary text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Swords className="w-3.5 h-3.5 md:mr-2" />
                <span className="hidden md:inline">{t.battle_arena}</span>
              </Button>
            </div>
          </div>

          {/* Center: Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20"
            >
              <Trophy className="text-white w-6 h-6 md:w-7 h-7" />
            </motion.div>
            <div className="hidden sm:block text-center">
              <h1 className="font-headline text-lg md:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent leading-none">PokeNexus</h1>
              <p className="text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-70 mt-1">{t.app_subtitle}</p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex-1 flex justify-end items-center gap-2">
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowCapturedOnly(!showCapturedOnly)}
               className={cn(
                 "glass px-3 md:px-5 py-2 rounded-full flex items-center gap-2 border-foreground/10 transition-all",
                 showCapturedOnly ? "ring-2 ring-primary bg-primary/10" : ""
               )}
             >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  showCapturedOnly ? "bg-primary animate-ping" : "bg-primary/50"
                )} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-tight">{caughtPokemon.size}</span>
             </motion.button>
             
             <div className="flex items-center gap-1 glass p-1 rounded-full border-foreground/10">
                <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-full w-8 h-8 md:w-9 md:h-9">
                  <Globe className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-8 h-8 md:w-9 md:h-9">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <section className="relative z-10 container mx-auto px-4 md:px-8 py-8 md:py-12">
        <Tabs value={activeTab} className="space-y-12">
          <TabsContent value="pokedex" className="mt-0 space-y-12 outline-none">
            {/* Search Section */}
            <div className="max-w-3xl mx-auto w-full">
              <SearchPanel onSearch={handleSearch} onAiSuggest={handleAiSuggest} isLoading={loading} lang={lang} />
            </div>

            {/* Utility Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col lg:flex-row items-center justify-between gap-4 glass p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] border-foreground/10 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full lg:w-auto">
                 <FiltersDrawer 
                   selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
                   selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
                   selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
                   onClear={handleClearFilters} lang={lang}
                 />
                 <Button 
                   variant={showCapturedOnly ? "secondary" : "ghost"} 
                   size="sm" 
                   onClick={() => setShowCapturedOnly(!showCapturedOnly)} 
                   className={cn(
                     "rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 h-11 px-6 transition-all",
                     showCapturedOnly ? "bg-primary text-black shadow-lg" : "glass border-foreground/10"
                   )}
                 >
                   <Star className={cn("w-3.5 h-3.5", showCapturedOnly ? "fill-current" : "")} />
                   {t.my_collection}
                 </Button>
                 <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-3 bg-foreground/5 px-6 py-2.5 rounded-full border border-foreground/5">
                   {filtering ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : totalCount} {t.species}
                 </div>
              </div>

              <div className="flex items-center gap-4 w-full lg:w-auto justify-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest hidden sm:inline">{t.sort_by}</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-56 glass border-foreground/10 h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Numerical" />
                  </SelectTrigger>
                  <SelectContent className="glass border-foreground/10">
                    <SelectItem value="id-asc" className="text-[10px] font-black uppercase tracking-widest">{t.numerical_asc}</SelectItem>
                    <SelectItem value="id-desc" className="text-[10px] font-black uppercase tracking-widest">{t.numerical_desc}</SelectItem>
                    <SelectItem value="name-asc" className="text-[10px] font-black uppercase tracking-widest">{t.alpha_asc}</SelectItem>
                    <SelectItem value="name-desc" className="text-[10px] font-black uppercase tracking-widest">{t.alpha_desc}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Grid of Pokemon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 min-h-[400px]">
              <AnimatePresence mode="popLayout">
                {!loading && !filtering && visiblePokemon.map((p) => {
                  const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
                  return (
                    <motion.div 
                      key={p.name} 
                      layout 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                    >
                      <PokemonCard name={p.name} isCaught={caughtPokemon.has(id)} onToggleCaught={toggleCaught} onClick={setSelectedDetails} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Enhanced Pagination */}
            {!loading && !filtering && visiblePokemon.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 pt-12 pb-8">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={goToFirstPage} className="rounded-2xl glass h-11 w-11 border-foreground/10 hover:border-primary transition-all"><ChevronsLeft className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={skipBackward} className="rounded-2xl glass h-11 w-11 border-foreground/10 hover:border-primary transition-all font-black text-[10px] tracking-tighter">-3</Button>
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl glass h-11 w-11 border-foreground/10 hover:border-primary transition-all"><ChevronLeft className="w-5 h-5" /></Button>
                </div>

                <div className="glass px-8 py-3 rounded-2xl font-black text-xs md:text-sm tracking-widest flex items-center gap-4 border-foreground/10 shadow-inner min-w-[140px] justify-center uppercase">
                  <span className="text-primary">{t.page} {currentPage}</span>
                  <span className="opacity-30">/</span>
                  <span>{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl glass h-11 w-11 border-foreground/10 hover:border-primary transition-all"><ChevronRight className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={skipForward} className="rounded-2xl glass h-11 w-11 border-foreground/10 hover:border-primary transition-all font-black text-[10px] tracking-tighter">+3</Button>
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={goToLastPage} className="rounded-2xl glass h-11 w-11 border-foreground/10 hover:border-primary transition-all"><ChevronsRight className="w-5 h-5" /></Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="arena" className="mt-0 outline-none">
            <div className="w-full">
              <BattleArena lang={lang} allPokemon={allPokemon} />
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Global Pokemon Detail View */}
      <PokemonDetailsView pokemon={selectedDetails} onClose={() => setSelectedDetails(null)} lang={lang} />
    </main>
  );
}
