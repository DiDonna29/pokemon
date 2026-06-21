"use client";

import { useEffect, useState, useMemo } from "react";
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
import { WhosThatPokemon } from "@/components/pokedex/WhosThatPokemon";
import { Footer } from "@/components/pokedex/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  SearchX
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

  const filteredList = useMemo(() => {
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
  }, [allPokemon, searchQuery, aiSuggestions, typeFilteredNames, sortBy, showCapturedOnly, caughtPokemon]);

  useEffect(() => {
    const offset = (currentPage - 1) * PAGE_SIZE;
    const paginated = filteredList.slice(offset, offset + PAGE_SIZE);
    setVisiblePokemon(paginated);
    setTotalCount(filteredList.length);
  }, [filteredList, currentPage]);

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
    setShowCapturedOnly(false);
    setCurrentPage(1);
    setSortBy("id-asc");
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

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-32 md:pb-40">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-[-10%] left-[-10%] w-full h-full bg-primary/20 rounded-full blur-[200px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.08, 0.05] }} transition={{ duration: 18, repeat: Infinity, delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-full h-full bg-secondary/20 rounded-full blur-[200px]" />
      </div>

      <header className="relative z-[100] px-6 py-6 md:py-8 border-b border-foreground/5 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-10 md:w-36 md:h-12 cursor-pointer" onClick={() => handleTabChange('pokedex')}>
              <Image 
                src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
                alt="Pokemon Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col border-l border-foreground/10 pl-4">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">pokenexus</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-xl glass w-10 h-10 md:w-11 md:h-11 border-foreground/5 text-black dark:text-white hover:bg-foreground/10">
              <Globe className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-xl glass w-10 h-10 md:w-11 md:h-11 border-foreground/5 text-black dark:text-white hover:bg-foreground/10">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 md:px-12 max-w-7xl relative z-10 pt-10">
        <AnimatePresence mode="wait">
          {activeTab === "pokedex" && (
            <motion.div key="dex" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-center md:text-left leading-tight">
                  {t.looking_for} <span className="text-primary">{t.looking_for_span}</span>
                </h2>
                <SearchPanel 
                  onSearch={setSearchQuery} 
                  onAiSuggest={setAiSuggestions} 
                  isLoading={loading} 
                  lang={lang} 
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-6 glass p-6 rounded-[2.5rem] border-foreground/10">
                <div className="flex flex-wrap gap-4">
                  <FiltersDrawer 
                    selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
                    selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
                    selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
                    onClear={handleClearFilters} lang={lang}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowCapturedOnly(!showCapturedOnly)} 
                    className={cn(
                      "rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-6 glass transition-all border",
                      showCapturedOnly 
                        ? "bg-primary shadow-lg border-primary text-black hover:bg-primary/90" 
                        : "text-black dark:text-white hover:bg-foreground/10 border-foreground/5"
                    )}
                  >
                    <div className="relative w-4 h-4 mr-2">
                       <Image 
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                        alt="Caught Icon"
                        fill
                        className={cn("object-contain", showCapturedOnly ? "" : "grayscale opacity-40")}
                      />
                    </div>
                    {t.my_collection}
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 glass h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border-foreground/10 text-black dark:text-white hover:bg-foreground/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-foreground/10">
                      <SelectItem value="id-asc">{t.numerical_asc}</SelectItem>
                      <SelectItem value="id-desc">{t.numerical_desc}</SelectItem>
                      <SelectItem value="name-asc">{t.alpha_asc}</SelectItem>
                      <SelectItem value="name-desc">{t.alpha_desc}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {visiblePokemon.length === 0 && !loading && !filtering ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="p-8 rounded-full bg-foreground/5 mb-4">
                    <SearchX className="w-16 h-16 text-muted-foreground opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight">{t.no_pokemon}</h3>
                    <p className="text-muted-foreground">{t.no_pokemon_desc}</p>
                  </div>
                  <Button onClick={handleClearFilters} className="rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest bg-primary text-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t.clear_filters}
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                  <AnimatePresence mode="popLayout">
                    {!loading && !filtering && visiblePokemon.map((p) => {
                      const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
                      return (
                        <motion.div key={p.name} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <PokemonCard name={p.name} isCaught={caughtPokemon.has(id)} onToggleCaught={toggleCaught} onClick={setSelectedDetails} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {visiblePokemon.length > 0 && (
                <div className="flex flex-wrap justify-center items-center gap-2 py-12">
                   <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => jumpToPage(1)} className="rounded-xl glass h-10 w-10 text-black dark:text-white hover:bg-foreground/10"><ChevronsLeft className="w-4 h-4" /></Button>
                   <Button variant="outline" size="icon" disabled={currentPage <= 3} onClick={() => jumpToPage(currentPage - 3)} className="rounded-xl glass h-10 w-10 flex items-center justify-center font-black text-[10px] text-black dark:text-white hover:bg-foreground/10">-3</Button>
                   <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-xl glass h-10 w-10 text-black dark:text-white hover:bg-foreground/10"><ChevronLeft className="w-4 h-4" /></Button>
                   
                   <div className="glass px-6 h-10 flex items-center rounded-xl font-black text-[10px] uppercase tracking-widest min-w-[120px] justify-center text-black dark:text-white">
                    {t.page} {currentPage} / {totalPages}
                   </div>
                   
                   <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-xl glass h-10 w-10 text-black dark:text-white hover:bg-foreground/10"><ChevronRight className="w-4 h-4" /></Button>
                   <Button variant="outline" size="icon" disabled={currentPage >= totalPages - 2} onClick={() => jumpToPage(currentPage + 3)} className="rounded-xl glass h-10 w-10 flex items-center justify-center font-black text-[10px] text-black dark:text-white hover:bg-foreground/10">+3</Button>
                   <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => jumpToPage(totalPages)} className="rounded-xl glass h-10 w-10 text-black dark:text-white hover:bg-foreground/10"><ChevronsRight className="w-4 h-4" /></Button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "battle" && (
            <motion.div key="battle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <BattleArena lang={lang} allPokemon={allPokemon} />
            </motion.div>
          )}

          {activeTab === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <WhosThatPokemon lang={lang} allPokemon={allPokemon} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[120] w-full md:w-[90%] md:max-w-md h-20 glass md:rounded-[2.5rem] border-t md:border border-foreground/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-around px-4">
        <button 
          onClick={() => handleTabChange("pokedex")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            activeTab === 'pokedex' ? "text-primary scale-110" : "text-muted-foreground opacity-40"
          )}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dex</span>
        </button>

        <div className="relative -top-4 md:-top-8">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTabChange("battle")}
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-full border-4 shadow-2xl transition-all duration-500 flex items-center justify-center overflow-hidden bg-background",
              activeTab === 'battle' ? "border-primary bg-primary/20 scale-110" : "border-foreground/10 glass"
            )}
          >
            <Image 
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
              alt="Battle"
              width={50}
              height={50}
              className={cn("pixelated", activeTab === 'battle' ? "animate-bounce" : "opacity-40 grayscale")}
            />
          </motion.button>
        </div>

        <button 
          onClick={() => handleTabChange("quiz")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            activeTab === 'quiz' ? "text-secondary scale-110" : "text-muted-foreground opacity-40"
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
