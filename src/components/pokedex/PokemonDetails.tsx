
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  PokemonDetails, 
  PokemonSpecies, 
  fetchPokemonSpecies, 
  getTypeColorClass 
} from "@/lib/pokeapi";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Ruler, Weight, Shield, Swords, Zap, Heart, ShieldAlert, Target, Sparkles, ArrowLeft } from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface PokemonDetailsViewProps {
  pokemon: PokemonDetails | null;
  onClose: () => void;
  lang: Language;
  isCaught: boolean;
  onToggleCaught: (id: number) => void;
}

export function PokemonDetailsView({ pokemon, onClose, lang, isCaught, onToggleCaught }: PokemonDetailsViewProps) {
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    if (pokemon) {
      setLoading(true);
      setSpecies(null);
      fetchPokemonSpecies(pokemon.species.url).then(data => {
        setSpecies(data);
        setLoading(false);
      });
    }
  }, [pokemon]);

  if (!pokemon) return null;

  const artwork = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default;
  const mainType = pokemon.types[0].type.name;

  const getStatIcon = (name: string) => {
    switch (name) {
      case 'hp': return <Heart className="w-3 h-3" />;
      case 'attack': return <Swords className="w-3 h-3" />;
      case 'defense': return <Shield className="w-3 h-3" />;
      case 'special-attack': return <Target className="w-3 h-3" />;
      case 'special-defense': return <ShieldAlert className="w-3 h-3" />;
      case 'speed': return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  const flavorText = species?.flavor_text_entries.find(e => e.language.name === (lang === 'en' ? 'en' : 'es'))?.flavor_text.replace(/\f/g, ' ') 
    || species?.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\f/g, ' ')
    || (loading ? t.thinking : "No data available.");

  return (
    <Dialog open={!!pokemon} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] md:max-w-xl lg:max-w-2xl p-0 overflow-hidden border-none bg-background shadow-2xl rounded-none md:rounded-[3rem] h-[100dvh] md:h-[90vh] md:max-h-[850px] [&>button]:hidden z-[110]">
        <AnimatePresence>
          {pokemon && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="flex flex-col h-full w-full relative overflow-hidden"
            >
              {/* Top Section: Visual & Header */}
              <div className={cn(
                "relative h-[35%] md:h-[40%] flex flex-col items-center justify-center p-6",
                getTypeColorClass(mainType)
              )}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
                
                {/* Floating Header */}
                <div className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between z-50">
                  <Button 
                    onClick={onClose}
                    className="glass h-11 w-11 md:w-auto md:px-6 rounded-2xl flex items-center justify-center gap-2 border-white/20 text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden md:block font-black uppercase text-[10px] tracking-widest">{t.go_back}</span>
                  </Button>

                  <Button
                    onClick={() => onToggleCaught(pokemon.id)}
                    className={cn(
                      "glass h-11 w-11 rounded-2xl flex items-center justify-center border-white/20 transition-all duration-300",
                      isCaught ? "bg-primary/40 border-primary/50" : "bg-white/10"
                    )}
                  >
                    <Image 
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                      alt="Caught"
                      width={24}
                      height={24}
                      className={cn("pixelated", isCaught ? "" : "grayscale opacity-40")}
                    />
                  </Button>
                </div>

                <div className="relative z-10 w-full flex items-center justify-center h-full pt-12">
                   <div className="absolute inset-0 bg-white/20 blur-[80px] rounded-full scale-75 opacity-40" />
                   {artwork && (
                    <Image 
                      src={artwork} 
                      alt={pokemon.name} 
                      width={380} 
                      height={380} 
                      className="relative z-10 drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] animate-float w-auto h-full max-h-[180px] md:max-h-[280px]"
                      priority
                    />
                  )}
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 font-headline font-black text-6xl md:text-8xl uppercase tracking-tighter opacity-20 whitespace-nowrap overflow-hidden pointer-events-none">
                  {pokemon.name}
                </div>
              </div>

              {/* Bottom Section: Info Panel */}
              <div className="flex-1 bg-card rounded-t-[3rem] -mt-10 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
                <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mt-4 shrink-0" />
                
                <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-32 scrollbar-none">
                  <header className="py-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-3xl md:text-4xl font-headline font-black capitalize tracking-tighter">
                        {pokemon.name}
                      </DialogTitle>
                      <span className="text-muted-foreground font-black tracking-widest text-lg opacity-40">#{String(pokemon.id).padStart(3, '0')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pokemon.types.map(typeInfo => (
                        <Badge 
                          key={typeInfo.type.name} 
                          className={cn(
                            "px-5 py-1.5 rounded-full text-white font-black uppercase text-[10px] tracking-widest border-none shadow-lg",
                            getTypeColorClass(typeInfo.type.name)
                          )}
                        >
                          {t[typeInfo.type.name as keyof typeof t] || typeInfo.type.name}
                        </Badge>
                      ))}
                    </div>
                  </header>

                  <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-foreground/5 h-12 p-1.5 rounded-2xl mb-8">
                      <TabsTrigger value="about" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                        {t.about}
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                        {t.stats}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="about" className="space-y-8 outline-none pb-8">
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base font-medium italic border-l-4 border-primary/20 pl-4 py-2">
                        "{flavorText}"
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass bg-foreground/5 rounded-3xl p-6 flex flex-col items-center gap-3 border-foreground/5">
                          <Ruler className="w-5 h-5 text-blue-500" />
                          <div className="text-center">
                            <div className="text-xl md:text-2xl font-black">{pokemon.height / 10}m</div>
                            <div className="text-muted-foreground text-[9px] uppercase font-black tracking-widest opacity-50">{t.height}</div>
                          </div>
                        </div>
                        <div className="glass bg-foreground/5 rounded-3xl p-6 flex flex-col items-center gap-3 border-foreground/5">
                          <Weight className="w-5 h-5 text-orange-500" />
                          <div className="text-center">
                            <div className="text-xl md:text-2xl font-black">{pokemon.weight / 10}kg</div>
                            <div className="text-muted-foreground text-[9px] uppercase font-black tracking-widest opacity-50">{t.weight}</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-4 outline-none pb-8">
                      {pokemon.stats.map((s, idx) => (
                        <motion.div 
                          key={s.stat.name} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {getStatIcon(s.stat.name)}
                              {t[s.stat.name as keyof typeof t] || s.stat.name.replace('-', ' ')}
                            </div>
                            <span className="text-foreground">{s.base_stat}</span>
                          </div>
                          <div className="relative h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(s.base_stat / 255) * 100}%` }}
                               transition={{ duration: 1, ease: "easeOut" }}
                               className={cn(
                                 "absolute h-full rounded-full",
                                 s.base_stat > 100 ? "bg-green-500" : s.base_stat > 60 ? "bg-yellow-500" : "bg-red-500"
                               )}
                             />
                          </div>
                        </motion.div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
