
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
import { WhosThatPokemon } from "@/components/pokedex/WhosThatPokemon";
import { Footer } from "@/components/pokedex/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  Gamepad2,
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
  // Navigation State
  const [activeTab, setActiveTab] = useState<"pokedex" | "battle" | "quiz">("pokedex");
  const [lang, setLang] = useState<Language>('es');
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

  // Filtered List Logic
  const filteredList = useMemo(() => {
    let list = [...allPokemon];
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const id = p.url.split('/').filter(Boolean).pop() || '0';
        return p.name.includes(q) || id === q || id.startsWith(q);
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
  }, [allPokemon, searchQuery, aiSuggestions, typeFilteredNames, sortBy, showCapturedOnly, caughtPokemon]);

  useEffect(() => {
    const offset = (currentPage - 1) * PAGE_SIZE;
    const paginated = filteredList.slice(offset, offset + PAGE_SIZE);
    setVisiblePokemon(paginated);
    setTotalCount(filteredList.length);
  }, [filteredList, currentPage]);

  const toggleCaught = (id: number) => {
    const next = new Set(caughtPokemon);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCaughtPokemon(next);
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSearchQuery("");
    setAiSuggestions(null);
    setTypeFilteredNames(null);
    setShowCapturedOnly(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-[-10%] left-[-10%] w-full h-full bg-primary/20 rounded-full blur-[200px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.08, 0.05] }} transition={{ duration: 18, repeat: Infinity, delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-full h-full bg-secondary/20 rounded-full blur-[200px]" />
      </div>

      {/* Modern Header */}
      <header className="relative z-50 px-6 py-8 md:px-12">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter uppercase">{activeTab === 'pokedex' ? 'Master Dex' : activeTab === 'battle' ? t.battle_arena : t.quiz_title}</h1>
            <p className="text-xs text-muted-foreground font-bold tracking-[0.3em] uppercase opacity-60">PokeNexus Pro</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="rounded-xl glass w-11 h-11 border-foreground/5">
              <Globe className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-xl glass w-11 h-11 border-foreground/5">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === "pokedex" && (
            <motion.div key="dex" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center md:text-left">What Are You <span className="text-primary">Looking For?</span></h2>
                <SearchPanel onSearch={setSearchQuery} onAiSuggest={setAiSuggestions} isLoading={loading} lang={lang} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-6 glass p-6 rounded-[2.5rem] border-foreground/10">
                <div className="flex flex-wrap gap-4">
                  <FiltersDrawer 
                    selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes}
                    selectedWeight={selectedWeight} setSelectedWeight={setSelectedWeight}
                    selectedHeight={selectedHeight} setSelectedHeight={setSelectedHeight}
                    onClear={handleClearFilters} lang={lang}
                  />
                  <Button variant={showCapturedOnly ? "secondary" : "ghost"} size="sm" onClick={() => setShowCapturedOnly(!showCapturedOnly)} className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-6 glass">
                    <Star className={cn("w-4 h-4 mr-2", showCapturedOnly ? "fill-current" : "")} />
                    {t.my_collection}
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48 glass h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border-foreground/10">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
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

              {/* Pagination */}
              {visiblePokemon.length > 0 && (
                <div className="flex justify-center items-center gap-4 py-12">
                   <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-2xl glass h-12 w-12"><ChevronLeft /></Button>
                   <div className="glass px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">{t.page} {currentPage} / {totalPages}</div>
                   <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-2xl glass h-12 w-12"><ChevronRight /></Button>
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

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md h-20 glass rounded-[2.5rem] border-foreground/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-around px-4">
        <button 
          onClick={() => setActiveTab("pokedex")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300",
            activeTab === 'pokedex' ? "text-primary scale-110" : "text-muted-foreground opacity-40"
          )}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dex</span>
        </button>

        <div className="relative -top-8">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab("battle")}
            className={cn(
              "w-20 h-20 rounded-full border-4 shadow-2xl transition-all duration-500 flex items-center justify-center overflow-hidden",
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
          onClick={() => setActiveTab("quiz")}
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
      <PokemonDetailsView pokemon={selectedDetails} onClose={() => setSelectedDetails(null)} lang={lang} />
    </main>
  );
}
