"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  PokemonSummary, 
  PokemonDetails, 
  fetchAllPokemon, 
  fetchPokemonByType,
  fetchPokemonDetails
} from "@/lib/pokeapi";
import { PokemonCard } from "@/components/pokedex/PokemonCard";
import { SearchPanel } from "@/components/pokedex/SearchPanel";
import { FiltersDrawer } from "@/components/pokedex/FiltersDrawer";
import { PokemonDetailsView } from "@/components/pokedex/PokemonDetails";
import { BattleArena } from "@/components/pokedex/BattleArena";
import { WhosThatPokemon } from "@/components/pokedex/WhosThatPokemon";
import { Footer } from "@/components/pokedex/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Sun, 
  Moon, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  Gamepad2,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  SearchX,
  Loader2,
  Sparkles
} from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

const PAGE_SIZE = 15;

export default function Home() {
  const [activeTab, setActiveTab] = useState<"pokedex" | "battle" | "quiz">("pokedex");
  const [lang, setLang] = useState<Language>('es');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const t = translations[lang];

  const [allPokemon, setAllPokemon] = useState<PokemonSummary[]>([]);
  const [visiblePokemon, setVisiblePokemon] = useState<PokemonSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeFilteredNames, setTypeFilteredNames] = useState<Set<string> | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const [selectedHeight, setSelectedHeight] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("id-asc");
  const [showCapturedOnly, setShowCapturedOnly] = useState(false);

  const [caughtPokemon, setCaughtPokemon] = useState<Set<number>>(new Set());
  const [selectedDetails, setSelectedDetails] = useState<PokemonDetails | null>(null);
  
  const [deepFilteredList, setDeepFilteredList] = useState<PokemonSummary[] | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true);
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

  const baseFilteredList = useMemo(() => {
    let list = [...allPokemon];
    
    if (aiSuggestions !== null) {
      list = list.filter(p => aiSuggestions.includes(p.name.toLowerCase()));
    } else if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const id = p.url.split('/').filter(Boolean).pop() || '0';
        return p.name.includes(q) || id === q || id.startsWith(q);
      });
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

    return list;
  }, [allPokemon, searchQuery, aiSuggestions, typeFilteredNames, showCapturedOnly, caughtPokemon]);

  useEffect(() => {
    async function applyDeepFilters() {
      if (!selectedWeight && !selectedHeight) {
        setDeepFilteredList(null);
        return;
      }
      
      setFiltering(true);
      const candidates = baseFilteredList.slice(0, 150); 
      const results: PokemonSummary[] = [];
      
      try {
        for (const p of candidates) {
          const details = await fetchPokemonDetails(p.name);
          if (details) {
            let match = true;
            if (selectedWeight) {
              const w = details.weight / 10;
              if (selectedWeight === 'light' && w >= 10) match = false;
              if (selectedWeight === 'medium' && (w < 10 || w > 100)) match = false;
              if (selectedWeight === 'heavy' && w <= 100) match = false;
            }
            if (selectedHeight) {
              const h = details.height / 10;
              if (selectedHeight === 'small' && h >= 1) match = false;
              if (selectedHeight === 'medium' && (h < 1 || h > 2)) match = false;
              if (selectedHeight === 'large' && h <= 2) match = false;
            }
            if (match) results.push(p);
          }
        }
        setDeepFilteredList(results);
      } catch (error) {
        console.error("Deep filtering failed", error);
      } finally {
        setFiltering(false);
      }
    }
    applyDeepFilters();
  }, [baseFilteredList, selectedWeight, selectedHeight]);

  const finalFilteredList = useMemo(() => {
    let list = deepFilteredList !== null ? [...deepFilteredList] : [...baseFilteredList];
    
    if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === "id-desc") {
      list.sort((a, b) => {
        const idA = parseInt(a.url.split('/').filter(Boolean).pop() || '0');
        const idB = parseInt(b.url.split('/').filter(Boolean).pop() || '0');
        return idB - idA;
      });
    } else {
      list.sort((a, b) => {
        const idA = parseInt(a.url.split('/').filter(Boolean).pop() || '0');
        const idB = parseInt(b.url.split('/').filter(Boolean).pop() || '0');
        return idA - idB;
      });
    }

    return list;
  }, [baseFilteredList, deepFilteredList, sortBy]);

  useEffect(() => {
    const offset = (currentPage - 1) * PAGE_SIZE;
    const paginated = finalFilteredList.slice(offset, offset + PAGE_SIZE);
    setVisiblePokemon(paginated);
    setTotalCount(finalFilteredList.length);
  }, [finalFilteredList, currentPage]);

  const toggleCaught = (id: number) => {
    setCaughtPokemon(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSearchQuery("");
    setAiSuggestions(null);
    setTypeFilteredNames(null);
    setSelectedWeight(null);
    setSelectedHeight(null);
    setShowCapturedOnly(false);
    setCurrentPage(1);
    setSortBy("id-asc");
    setDeepFilteredList(null);
  };

  const handleTabChange = (tab: "pokedex" | "battle" | "quiz") => {
    setSelectedDetails(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const jumpToPage = (p: number) => {
    const target = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(target);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } }
  };

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-700 pb-32 md:pb-40">
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 bg-background/60 backdrop-blur-3xl border-b border-foreground/5">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative w-32 h-10 cursor-pointer" 
            onClick={() => handleTabChange('pokedex')}
          >
            <Image 
              src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
              alt="Pokemon Logo"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-full w-10 h-10 hover:bg-foreground/5">
              <Globe className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-10 h-10 hover:bg-foreground/5">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 md:px-12 max-w-7xl pt-32">
        <AnimatePresence mode="wait">
          {activeTab === "pokedex" && (
            <motion.div key="dex" initial="hidden" animate="visible" variants={containerVariants} className="space-y-16">
              <div className="max-w-4xl mx-auto space-y-8 text-center md:text-left">
                <motion.div variants={itemVariants} className="space-y-4">
                  <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 text-primary uppercase font-black text-[10px] tracking-widest">
                    <Sparkles className="w-3 h-3 mr-2" />
                    Ultimate Experience
                  </Badge>
                  <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
                    {t.looking_for} <br/> <span className="text-primary">{t.looking_for_span}</span>
                  </h2>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <SearchPanel 
                    onSearch={setSearchQuery} 
                    onAiSuggest={setAiSuggestions} 
                    isLoading={loading || filtering} 
                    lang={lang} 
                  />
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-6 glass p-6 rounded-[3rem]">
                <div className="flex flex-wrap gap-3">
                  <FiltersDrawer 
                    selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
                    selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
                    selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
                    onClear={handleClearFilters} lang={lang}
                  />
                  <Button 
                    onClick={() => setShowCapturedOnly(!showCapturedOnly)} 
                    className={cn(
                      "rounded-full font-black text-[10px] uppercase tracking-widest h-12 px-8 transition-all duration-500",
                      showCapturedOnly 
                        ? "bg-primary text-black shadow-2xl shadow-primary/30 scale-105" 
                        : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                    )}
                  >
                    <Image 
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                      alt="Caught"
                      width={16}
                      height={16}
                      className={cn("mr-2", showCapturedOnly ? "" : "grayscale opacity-40")}
                    />
                    {t.my_collection}
                  </Button>
                </div>
                <div className="flex items-center gap-6">
                  {filtering && (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {lang === 'es' ? 'Sincronizando...' : 'Syncing...'}
                    </div>
                  )}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-52 h-12 bg-foreground/5 border-none rounded-full font-black text-[10px] uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-none rounded-2xl">
                      <SelectItem value="id-asc">{t.numerical_asc}</SelectItem>
                      <SelectItem value="id-desc">{t.numerical_desc}</SelectItem>
                      <SelectItem value="name-asc">{t.alpha_asc}</SelectItem>
                      <SelectItem value="name-desc">{t.alpha_desc}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {visiblePokemon.length === 0 && !loading && !filtering ? (
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-32 text-center space-y-8">
                  <div className="w-32 h-32 rounded-full bg-foreground/5 flex items-center justify-center">
                    <SearchX className="w-12 h-12 opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">{t.no_pokemon}</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">{t.no_pokemon_desc}</p>
                  </div>
                  <Button onClick={handleClearFilters} className="rounded-full h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-black hover:scale-105 shadow-xl shadow-primary/20">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t.clear_filters}
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                  <AnimatePresence mode="popLayout">
                    {visiblePokemon.map((p) => {
                      const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
                      return (
                        <motion.div key={p.name} layout variants={itemVariants}>
                          <PokemonCard name={p.name} isCaught={caughtPokemon.has(id)} onToggleCaught={toggleCaught} onClick={setSelectedDetails} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {visiblePokemon.length > 0 && (
                <motion.div variants={itemVariants} className="flex justify-center items-center gap-4 py-16">
                   <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => jumpToPage(1)} className="rounded-full w-12 h-12"><ChevronsLeft className="w-5 h-5" /></Button>
                   <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-full w-12 h-12"><ChevronLeft className="w-5 h-5" /></Button>
                   <div className="px-8 h-12 glass flex items-center rounded-full font-black text-[10px] uppercase tracking-[0.2em]">
                    {t.page} {currentPage} / {totalPages}
                   </div>
                   <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-full w-12 h-12"><ChevronRight className="w-5 h-5" /></Button>
                   <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => jumpToPage(totalPages)} className="rounded-full w-12 h-12"><ChevronsRight className="w-5 h-5" /></Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "battle" && (
            <motion.div key="battle" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="pt-8">
              <BattleArena lang={lang} allPokemon={allPokemon} />
            </motion.div>
          )}

          {activeTab === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="pt-8">
              <WhosThatPokemon lang={lang} allPokemon={allPokemon} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] w-[90%] max-w-md h-20 glass rounded-full flex items-center justify-around px-8 shadow-2xl">
        <button 
          onClick={() => handleTabChange("pokedex")}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all",
            activeTab === 'pokedex' ? "text-primary scale-110" : "text-muted-foreground opacity-50 hover:opacity-100"
          )}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dex</span>
        </button>

        <motion.button 
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleTabChange("battle")}
          className={cn(
            "w-20 h-20 rounded-full border-4 shadow-2xl transition-all flex items-center justify-center bg-background relative -top-6",
            activeTab === 'battle' ? "border-primary bg-primary/10" : "border-foreground/10 glass"
          )}
        >
          <Image 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
            alt="Battle"
            width={44}
            height={44}
            className={cn("pixelated", activeTab === 'battle' ? "animate-bounce" : "opacity-40 grayscale")}
          />
        </motion.button>

        <button 
          onClick={() => handleTabChange("quiz")}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all",
            activeTab === 'quiz' ? "text-secondary scale-110" : "text-muted-foreground opacity-50 hover:opacity-100"
          )}
        >
          <Gamepad2 className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Quiz</span>
        </button>
      </nav>

      <Footer lang={lang} />

      <PokemonDetailsView 
        pokemon={selectedDetails} 
        onClose={() => setSelectedDetails(null)} 
        lang={lang} 
        isCaught={selectedDetails ? caughtPokemon.has(selectedDetails.id) : false}
        onToggleCaught={toggleCaught}
      />
    </main>
  );
}
