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
import { Footer } from "@/components/pokedex/Footer";
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
  Swords,
  Menu,
  X
} from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";

const PAGE_SIZE = 10;

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

      let matchedType: string | null = null;
      if (POKEMON_TYPES.includes(q)) {
        matchedType = q;
      } else {
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

  // Filtered List Logic
  const filteredList = useMemo(() => {
    let list = [...allPokemon];
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const id = p.url.split('/').filter(Boolean).pop() || '0';
        const nameMatch = p.name.includes(q);
        const idMatch = id === q || id.startsWith(q);
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
    if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === "id-desc") list = [...list].reverse();
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
    <main className="min-h-screen bg-background text-foreground relative transition-colors duration-500">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-full h-full bg-primary/10 rounded-full blur-[200px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 18, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[-10%] right-[-10%] w-full h-full bg-secondary/10 rounded-full blur-[200px]" 
        />
      </div>

      {/* Symmetric Modern Header */}
      <header className="relative z-50 nav-glass sticky top-0 px-4 md:px-12 py-4 md:py-5">
        <div className="container mx-auto flex items-center justify-between">
          
          {/* Navigation - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-2 bg-foreground/5 p-1 rounded-2xl border border-foreground/10 shadow-inner">
            <Button 
              variant="ghost"
              onClick={() => setActiveTab("pokedex")}
              className={cn(
                "rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 transition-all",
                activeTab === "pokedex" ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              <span>{t.infinite_dex}</span>
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setActiveTab("arena")}
              className={cn(
                "rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 transition-all",
                activeTab === "arena" ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Swords className="w-4 h-4 mr-2" />
              <span>{t.battle_arena}</span>
            </Button>
          </div>

          {/* Branding - Centered */}
          <div className="flex flex-col items-center gap-1">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-32 h-10 md:w-48 md:h-16 cursor-pointer"
              onClick={() => {
                setActiveTab("pokedex");
                handleClearFilters();
              }}
            >
              <Image 
                src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
                alt="Pokemon Logo"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
            <div className="text-center -mt-1 hidden md:block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black opacity-60">NEXUS</p>
            </div>
          </div>

          {/* Right: Utils (Desktop) / Hamburger (Mobile) */}
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCapturedOnly(!showCapturedOnly)}
                  className={cn(
                    "glass px-4 h-10 rounded-full flex items-center gap-2 border-foreground/10 transition-all",
                    showCapturedOnly ? "ring-2 ring-primary bg-primary/10" : ""
                  )}
                >
                   <div className={cn("w-2 h-2 rounded-full", showCapturedOnly ? "bg-primary animate-ping" : "bg-primary/40")} />
                   <span className="text-xs font-black uppercase tracking-tight">{caughtPokemon.size}</span>
                </motion.button>
                
                <div className="flex items-center gap-1 glass p-1 rounded-full border-foreground/10 bg-foreground/5">
                   <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-full w-9 h-9 hover:bg-foreground/10">
                     <Globe className="w-4 h-4" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-9 h-9 hover:bg-foreground/10">
                     {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                   </Button>
                </div>
             </div>

             {/* Hamburger Icon for Mobile */}
             <div className="md:hidden">
               <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                 <SheetTrigger asChild>
                   <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 glass border-foreground/10">
                     <Menu className="w-6 h-6" />
                   </Button>
                 </SheetTrigger>
                 <SheetContent side="right" className="glass w-[85vw] sm:w-[400px] border-l border-foreground/10 flex flex-col p-8">
                   <SheetHeader className="text-left mb-10">
                      <SheetTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Image 
                          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                          alt="PokeBall"
                          width={24}
                          height={24}
                          className="pixelated"
                        />
                        Menu
                      </SheetTitle>
                   </SheetHeader>

                   <div className="flex flex-col gap-12 flex-1">
                      {/* Nav Section */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{t.infinite_dex}</p>
                        <div className="flex flex-col gap-3">
                          <Button 
                            variant="ghost"
                            onClick={() => { setActiveTab("pokedex"); setIsMobileMenuOpen(false); }}
                            className={cn(
                              "justify-start h-14 rounded-2xl px-6 font-black uppercase text-xs tracking-widest border transition-all",
                              activeTab === "pokedex" ? "bg-primary text-black border-primary shadow-xl shadow-primary/20" : "glass border-foreground/5"
                            )}
                          >
                            <LayoutGrid className="w-5 h-5 mr-4" />
                            {t.infinite_dex}
                          </Button>
                          <Button 
                            variant="ghost"
                            onClick={() => { setActiveTab("arena"); setIsMobileMenuOpen(false); }}
                            className={cn(
                              "justify-start h-14 rounded-2xl px-6 font-black uppercase text-xs tracking-widest border transition-all",
                              activeTab === "arena" ? "bg-secondary text-white border-secondary shadow-xl shadow-secondary/20" : "glass border-foreground/5"
                            )}
                          >
                            <Swords className="w-5 h-5 mr-4" />
                            {t.battle_arena}
                          </Button>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{t.my_collection}</p>
                        <div 
                          className={cn(
                            "glass h-14 rounded-2xl px-6 flex items-center justify-between border-foreground/5 cursor-pointer",
                            showCapturedOnly ? "border-primary/40 bg-primary/5" : ""
                          )}
                          onClick={() => setShowCapturedOnly(!showCapturedOnly)}
                        >
                          <div className="flex items-center gap-4">
                            <Star className={cn("w-5 h-5", showCapturedOnly ? "text-primary fill-current" : "text-muted-foreground")} />
                            <span className="font-black uppercase text-xs tracking-widest">{t.captured}</span>
                          </div>
                          <span className="text-sm font-black text-primary">{caughtPokemon.size}</span>
                        </div>
                      </div>

                      {/* Settings Section */}
                      <div className="mt-auto pt-8 border-t border-foreground/10 space-y-6">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{t.advanced_search}</p>
                           <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                                className="rounded-xl w-12 h-12 glass border-foreground/10"
                              >
                                <Globe className="w-5 h-5" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="rounded-xl w-12 h-12 glass border-foreground/10"
                              >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                              </Button>
                           </div>
                        </div>
                      </div>
                   </div>
                 </SheetContent>
               </Sheet>
             </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <section className="relative z-10 container mx-auto px-6 md:px-12 py-10 md:py-16">
        <Tabs value={activeTab} className="space-y-16">
          <TabsContent value="pokedex" className="mt-0 space-y-16 outline-none">
            {/* Search Section */}
            <div className="max-w-3xl mx-auto w-full">
              <SearchPanel onSearch={handleSearch} onAiSuggest={handleAiSuggest} isLoading={loading} lang={lang} />
            </div>

            {/* Utility Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col lg:flex-row items-center justify-between gap-6 glass p-6 md:p-8 rounded-[3rem] border-foreground/10 shadow-2xl"
            >
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full lg:w-auto">
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
                     "rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 h-12 px-8 transition-all border border-foreground/5",
                     showCapturedOnly ? "bg-primary text-black shadow-xl shadow-primary/20" : "glass hover:bg-foreground/5"
                   )}
                 >
                   <Star className={cn("w-4 h-4", showCapturedOnly ? "fill-current" : "")} />
                   {t.my_collection}
                 </Button>
                 <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-4 bg-foreground/5 px-8 py-3 rounded-full border border-foreground/5">
                   {filtering ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : totalCount} {t.species}
                 </div>
              </div>

              <div className="flex items-center gap-5 w-full lg:w-auto justify-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest hidden sm:inline">{t.sort_by}</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-64 glass border-foreground/10 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:border-primary/50 transition-colors bg-foreground/5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-10 min-h-[400px]">
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

            {/* Pagination */}
            {!loading && !filtering && visiblePokemon.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 pt-16 pb-12">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={goToFirstPage} className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:border-primary transition-all bg-card/40"><ChevronsLeft className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={skipBackward} className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:border-primary transition-all font-black text-[10px] bg-card/40">-3</Button>
                  <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:border-primary transition-all bg-card/40"><ChevronLeft className="w-5 h-5" /></Button>
                </div>

                <div className="glass px-10 py-4 rounded-2xl font-black text-xs md:text-sm tracking-widest flex items-center gap-6 border-foreground/10 shadow-2xl min-w-[160px] justify-center uppercase bg-card/80">
                  <span className="text-primary">{t.page} {currentPage}</span>
                  <span className="opacity-30">/</span>
                  <span>{totalPages}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:border-primary transition-all bg-card/40"><ChevronRight className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={skipForward} className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:border-primary transition-all font-black text-[10px] bg-card/40">+3</Button>
                  <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={goToLastPage} className="rounded-2xl glass h-12 w-12 border-foreground/10 hover:border-primary transition-all bg-card/40"><ChevronsRight className="w-5 h-5" /></Button>
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

      {/* Footer */}
      <Footer lang={lang} />

      {/* Global Pokemon Detail View */}
      <PokemonDetailsView pokemon={selectedDetails} onClose={() => setSelectedDetails(null)} lang={lang} />
    </main>
  );
}
