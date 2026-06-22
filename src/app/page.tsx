
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

const PAGE_SIZE = 12;

export default function Home() {
  const [mounted, setMounted] = useState(false);
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
  const [showCapturedOnly, setSelectedCapturedOnly] = useState(false);

  const [caughtPokemon, setCaughtPokemon] = useState<Set<number>>(new Set());
  const [selectedDetails, setSelectedDetails] = useState<PokemonDetails | null>(null);
  
  const [deepFilteredList, setDeepFilteredList] = useState<PokemonSummary[] | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = 'dark';
    }
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

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
      const candidates = baseFilteredList.slice(0, 100); 
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
    setSelectedCapturedOnly(false);
    setCurrentPage(1);
    setSortBy("id-asc");
    setDeepFilteredList(null);
  };

  const handleTabChange = (tab: "pokedex" | "battle" | "quiz") => {
    setSelectedDetails(null);
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const jumpToPage = (p: number) => {
    const target = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(target);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 300, behavior: 'auto' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-background text-foreground pb-32 md:pb-40 lg:pb-48 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 md:py-6 bg-card/80 backdrop-blur-3xl border-b border-border/50">
        <div className="container mx-auto max-w-[1800px] flex items-center justify-between">
          <div 
            className="relative w-32 md:w-40 h-10 cursor-pointer transform-gpu active:scale-95 transition-transform" 
            onClick={() => handleTabChange('pokedex')}
          >
            <Image 
              src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
              alt="Pokemon Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-2xl w-10 h-10 md:w-12 md:h-12 glass hover:bg-muted/50">
              <Globe className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleToggleTheme} className="rounded-2xl w-10 h-10 md:w-12 md:h-12 glass hover:bg-muted/50">
              {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-primary" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-secondary" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 md:px-12 max-w-[1800px] pt-24 md:pt-40">
        <AnimatePresence mode="wait">
          {activeTab === "pokedex" && (
            <motion.div key="dex" initial="hidden" animate="visible" variants={containerVariants} className="space-y-12 md:space-y-24">
              <div className="max-w-5xl mx-auto space-y-8 text-center">
                <motion.div variants={itemVariants} className="space-y-4">
                  <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/20 text-primary uppercase font-black text-[10px] tracking-[0.3em] bg-primary/5">
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Ultimate Experience
                  </Badge>
                  <h2 className="text-4xl md:text-9xl font-black tracking-tighter leading-[0.85] uppercase">
                    {t.looking_for} <br/> <span className="text-primary italic">{t.looking_for_span}</span>
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

              <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-6 glass p-6 md:p-8 rounded-[3.5rem] transform-gpu">
                <div className="flex flex-wrap gap-4">
                  <FiltersDrawer 
                    selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
                    selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
                    selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
                    onClear={handleClearFilters} lang={lang}
                    theme={theme} onToggleTheme={handleToggleTheme}
                  />
                  <Button 
                    onClick={() => setSelectedCapturedOnly(!showCapturedOnly)} 
                    className={cn(
                      "rounded-3xl font-black text-[10px] uppercase tracking-widest h-14 px-8 md:px-10 transition-all duration-300 transform-gpu",
                      showCapturedOnly 
                        ? "bg-primary text-black shadow-glow scale-105" 
                        : "glass text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Image 
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                      alt="Caught"
                      width={18}
                      height={18}
                      className={cn("mr-3 transition-transform duration-500", showCapturedOnly ? "rotate-[360deg]" : "grayscale opacity-30")}
                    />
                    {t.my_collection}
                  </Button>
                </div>
                <div className="flex items-center gap-6">
                  <AnimatePresence>
                    {filtering && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {lang === 'es' ? 'Analizando...' : 'Analyzing...'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 md:w-60 h-14 glass border-none rounded-3xl font-black text-[10px] uppercase tracking-widest px-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-none rounded-[2rem] overflow-hidden">
                      <SelectItem value="id-asc">{t.numerical_asc}</SelectItem>
                      <SelectItem value="id-desc">{t.numerical_desc}</SelectItem>
                      <SelectItem value="name-asc">{t.alpha_asc}</SelectItem>
                      <SelectItem value="name-desc">{t.alpha_desc}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {visiblePokemon.length === 0 && !loading && !filtering ? (
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-40 text-center space-y-10">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] glass flex items-center justify-center">
                    <SearchX className="w-12 h-12 md:w-14 md:h-14 opacity-20" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-6xl font-black uppercase tracking-tighter">{t.no_pokemon}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium opacity-60 italic">{t.no_pokemon_desc}</p>
                  </div>
                  <Button onClick={handleClearFilters} className="rounded-full h-16 px-12 font-black uppercase text-xs tracking-[0.3em] bg-primary text-black hover:scale-105 shadow-2xl transition-transform active:scale-95">
                    <RotateCcw className="w-5 h-5 mr-3" />
                    {t.clear_filters}
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 md:gap-16">
                  {visiblePokemon.map((p) => {
                    const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
                    return (
                      <motion.div key={p.name} variants={itemVariants} className="h-full transform-gpu">
                        <PokemonCard name={p.name} isCaught={caughtPokemon.has(id)} onToggleCaught={toggleCaught} onClick={setSelectedDetails} />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {visiblePokemon.length > 0 && (
                <motion.div variants={itemVariants} className="flex justify-center items-center gap-3 md:gap-5 py-24">
                   <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => jumpToPage(1)} className="rounded-2xl w-12 h-12 md:w-14 md:h-14 glass"><ChevronsLeft className="w-5 h-5 md:w-6 md:h-6" /></Button>
                   <Button variant="ghost" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl w-12 h-12 md:w-14 md:h-14 glass"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6" /></Button>
                   <div className="px-6 md:px-10 h-12 md:h-14 glass flex items-center rounded-3xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em]">
                    {t.page} <span className="text-primary mx-2 md:mx-3">{currentPage}</span> / {totalPages}
                   </div>
                   <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl w-12 h-12 md:w-14 md:h-14 glass"><ChevronRight className="w-5 h-5 md:w-6 md:h-6" /></Button>
                   <Button variant="ghost" size="icon" disabled={currentPage === totalPages} onClick={() => jumpToPage(totalPages)} className="rounded-2xl w-12 h-12 md:w-14 md:h-14 glass"><ChevronsRight className="w-5 h-5 md:w-6 md:h-6" /></Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "battle" && (
            <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6 transform-gpu">
              <BattleArena lang={lang} allPokemon={allPokemon} />
            </motion.div>
          )}

          {activeTab === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6 transform-gpu">
              <WhosThatPokemon lang={lang} allPokemon={allPokemon} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className={cn(
        "fixed bg-muted/90 backdrop-blur-3xl border-border flex items-center justify-around shadow-4xl transition-all duration-300 z-40 transform-gpu",
        "bottom-0 left-0 right-0 w-full h-20 md:h-24 border-t px-8 md:px-12",
        "lg:bottom-10 lg:left-1/2 lg:-translate-x-1/2 lg:w-fit lg:min-w-[600px] lg:px-16 lg:rounded-[3rem] lg:border lg:h-24"
      )}>
        <button 
          onClick={() => handleTabChange("pokedex")}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all group active:scale-95",
            activeTab === 'pokedex' ? "text-primary scale-110" : "text-muted-foreground opacity-40 hover:opacity-100"
          )}
        >
          <LayoutGrid className="w-6 h-6 md:w-7 md:h-7" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Dex</span>
        </button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTabChange("battle")}
          className={cn(
            "w-20 h-20 md:w-24 md:h-24 rounded-[2rem] md:rounded-[2.5rem] border-[4px] md:border-[6px] shadow-2xl transition-all flex items-center justify-center bg-card relative -top-6 md:-top-8 lg:top-0",
            activeTab === 'battle' ? "border-primary bg-primary/10 shadow-primary/30" : "border-border glass"
          )}
        >
          <Image 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
            alt="Battle"
            width={44}
            height={44}
            className={cn("pixelated", activeTab === 'battle' ? "animate-bounce" : "opacity-30 grayscale")}
          />
        </motion.button>

        <button 
          onClick={() => handleTabChange("quiz")}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-all group active:scale-95",
            activeTab === 'quiz' ? "text-secondary scale-110" : "text-muted-foreground opacity-40 hover:opacity-100"
          )}
        >
          <Gamepad2 className="w-6 h-6 md:w-7 md:h-7" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Quiz</span>
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
