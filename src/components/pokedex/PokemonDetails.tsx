
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
}

export function PokemonDetailsView({ pokemon, onClose, lang }: PokemonDetailsViewProps) {
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
      case 'hp': return <Heart className="w-4 h-4" />;
      case 'attack': return <Swords className="w-4 h-4" />;
      case 'defense': return <Shield className="w-4 h-4" />;
      case 'special-attack': return <Target className="w-4 h-4" />;
      case 'special-defense': return <ShieldAlert className="w-4 h-4" />;
      case 'speed': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  const flavorText = species?.flavor_text_entries.find(e => e.language.name === (lang === 'en' ? 'en' : 'es'))?.flavor_text.replace(/\f/g, ' ') 
    || species?.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\f/g, ' ')
    || (loading ? t.thinking : "No data available.");

  return (
    <Dialog open={!!pokemon} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full md:max-w-6xl lg:max-w-7xl p-0 overflow-hidden border-none bg-background shadow-2xl rounded-none md:rounded-[3rem] h-[100dvh] md:h-[90vh] lg:h-[85vh] md:max-h-[900px] [&>button]:hidden">
        <AnimatePresence>
          {pokemon && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col md:flex-row h-full w-full relative overflow-hidden"
            >
              {/* Left Side: Information Section */}
              <div className="flex-1 order-2 md:order-1 bg-card flex flex-col h-full overflow-hidden">
                {/* Fixed Top Bar in the info section */}
                <div className="p-6 md:p-8 lg:p-12 pb-0">
                  <Button 
                    onClick={onClose}
                    className="glass h-10 md:h-12 px-5 md:px-8 rounded-2xl flex items-center gap-2 border-foreground/10 hover:bg-primary/20 hover:text-foreground text-foreground transition-all group mb-4 md:mb-8"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black uppercase text-[10px] md:text-xs tracking-widest">{t.go_back}</span>
                  </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 pb-12 scrollbar-thin scrollbar-thumb-foreground/10">
                  <div className="space-y-6 md:space-y-12">
                    <header className="space-y-2 md:space-y-4">
                      <div className="flex items-center gap-4">
                         <span className="text-primary font-black tracking-widest text-lg md:text-2xl">#{String(pokemon.id).padStart(3, '0')}</span>
                         <div className="h-px flex-1 bg-foreground/10" />
                      </div>
                      <DialogTitle className="text-3xl md:text-5xl lg:text-7xl font-headline font-black capitalize tracking-tighter leading-tight">
                        {pokemon.name}
                      </DialogTitle>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {pokemon.types.map(typeInfo => (
                          <Badge 
                            key={typeInfo.type.name} 
                            className={cn(
                              "px-5 md:px-8 py-1 md:py-2.5 rounded-full text-white font-black uppercase text-[9px] md:text-xs tracking-widest border-none shadow-lg",
                              getTypeColorClass(typeInfo.type.name)
                            )}
                          >
                            {t[typeInfo.type.name as keyof typeof t] || typeInfo.type.name}
                          </Badge>
                        ))}
                      </div>
                    </header>

                    <Tabs defaultValue="about" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 glass bg-foreground/5 h-12 md:h-16 p-1.5 md:p-2 rounded-2xl mb-6 md:mb-10">
                        <TabsTrigger value="about" className="rounded-xl font-black uppercase text-[9px] md:text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                          {t.about}
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="rounded-xl font-black uppercase text-[9px] md:text-xs tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                          {t.stats}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="about" className="space-y-6 md:space-y-10 outline-none">
                        <div className="relative">
                          <div className="absolute -left-4 md:-left-6 top-0 w-1 md:w-1.5 h-full bg-primary rounded-full opacity-20" />
                          <p className="text-muted-foreground leading-relaxed text-sm md:text-lg lg:text-xl font-medium pl-2 italic">
                            "{flavorText}"
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 md:gap-6">
                          <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 flex flex-col items-center gap-2 md:gap-5 border-foreground/5 group hover:border-primary/20 transition-all">
                            <div className="w-8 h-8 md:w-14 md:h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                              <Ruler className="w-4 h-4 md:w-7 md:h-7" />
                            </div>
                            <div className="text-center">
                              <div className="font-headline text-lg md:text-3xl lg:text-4xl font-black">{pokemon.height / 10}m</div>
                              <div className="text-muted-foreground text-[7px] md:text-[10px] uppercase font-black tracking-widest opacity-50 mt-1">{t.height}</div>
                            </div>
                          </div>
                          <div className="glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 flex flex-col items-center gap-2 md:gap-5 border-foreground/5 group hover:border-orange-500/20 transition-all">
                            <div className="w-8 h-8 md:w-14 md:h-14 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                              <Weight className="w-4 h-4 md:w-7 md:h-7" />
                            </div>
                            <div className="text-center">
                              <div className="font-headline text-lg md:text-3xl lg:text-4xl font-black">{pokemon.weight / 10}kg</div>
                              <div className="text-muted-foreground text-[7px] md:text-[10px] uppercase font-black tracking-widest opacity-50 mt-1">{t.weight}</div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="stats" className="space-y-4 md:space-y-8 outline-none">
                        {pokemon.stats.map((s, idx) => (
                          <motion.div 
                            key={s.stat.name} 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group space-y-1 md:space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-6 h-6 md:w-9 md:h-9 rounded-lg bg-foreground/5 flex items-center justify-center group-hover:text-primary transition-colors">
                                  {getStatIcon(s.stat.name)}
                                </div>
                                <span className="font-black uppercase text-[8px] md:text-xs tracking-widest text-muted-foreground">
                                  {t[s.stat.name as keyof typeof t] || s.stat.name.replace('-', ' ')}
                                </span>
                              </div>
                              <span className="font-headline font-black text-base md:text-2xl">{s.base_stat}</span>
                            </div>
                            <Progress 
                              value={(s.base_stat / 255) * 100} 
                              className="h-1.5 md:h-2.5 bg-foreground/5"
                            />
                          </motion.div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>

              {/* Right Side: Visual Section */}
              <div className={cn(
                "relative flex-1 min-h-[300px] md:min-h-0 flex flex-col items-center justify-center p-6 md:p-12 order-1 md:order-2 overflow-hidden",
                getTypeColorClass(mainType)
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-white/10" />
                
                {/* Dynamic Background Elements */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute w-[150%] h-[150%] bg-white/20 rounded-full blur-[120px] -z-10" 
                />
                
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 60, damping: 20 }}
                  className="relative z-10 w-full flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-white/30 blur-[60px] md:blur-[150px] rounded-full scale-110 md:scale-125 opacity-40" />
                  {artwork && (
                    <Image 
                      src={artwork} 
                      alt={pokemon.name} 
                      width={550} 
                      height={550} 
                      className="relative z-10 drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)] lg:drop-shadow-[0_80px_80px_rgba(0,0,0,0.6)] animate-float w-full max-w-[240px] md:max-w-[420px] lg:max-w-[500px] h-auto"
                      priority
                    />
                  )}
                </motion.div>

                <div className="absolute -bottom-12 -right-12 md:-bottom-24 md:-right-24 font-headline text-[10rem] md:text-[30rem] font-black text-white/5 select-none pointer-events-none uppercase tracking-tighter">
                  {pokemon.name.charAt(0)}
                </div>

                <div className="absolute bottom-4 left-4 md:bottom-10 md:left-10 hidden sm:flex items-center gap-3 md:gap-4 glass bg-white/10 border-none px-4 md:px-8 py-2 md:py-4 rounded-full text-white shadow-2xl backdrop-blur-3xl">
                  <Sparkles className="w-4 h-4 md:w-6 md:h-6 animate-pulse" />
                  <span className="font-black uppercase text-[8px] md:text-xs tracking-[0.2em]">{t.species} # {pokemon.id}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
