"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  PokemonDetails, 
  PokemonSpecies, 
  fetchPokemonSpecies, 
  getTypeColorClass 
} from "@/lib/pokeapi";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Ruler, Weight, Shield, Swords, Zap, Heart, ShieldAlert, Target, Sparkles } from "lucide-react";
import { Language, translations } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

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
      <DialogContent className="max-w-full md:max-w-5xl p-0 overflow-hidden border-none bg-background shadow-2xl rounded-none md:rounded-[3rem] h-[100dvh] md:h-auto md:max-h-[90vh]">
        <AnimatePresence>
          {pokemon && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden"
            >
              {/* Left Side: Information */}
              <div className="flex-1 p-6 md:p-12 order-2 md:order-1 bg-card">
                <div className="space-y-8">
                  <header>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-muted-foreground font-black tracking-widest text-lg">#{String(pokemon.id).padStart(3, '0')}</span>
                       <div className="h-px flex-1 bg-foreground/5" />
                    </div>
                    <DialogTitle className="text-5xl md:text-7xl font-headline font-black capitalize tracking-tighter mb-4">
                      {pokemon.name}
                    </DialogTitle>
                    <div className="flex flex-wrap gap-2">
                      {pokemon.types.map(typeInfo => (
                        <Badge 
                          key={typeInfo.type.name} 
                          className={cn(
                            "px-6 py-2 rounded-full text-white font-black uppercase text-xs tracking-widest border-none shadow-lg",
                            getTypeColorClass(typeInfo.type.name)
                          )}
                        >
                          {t[typeInfo.type.name as keyof typeof t] || typeInfo.type.name}
                        </Badge>
                      ))}
                    </div>
                  </header>

                  <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 glass bg-foreground/5 h-14 p-1.5 rounded-2xl mb-8">
                      <TabsTrigger value="about" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                        {t.about}
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                        {t.stats}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="about" className="space-y-8 outline-none">
                      <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-full bg-primary/20 rounded-full" />
                        <p className="text-muted-foreground leading-relaxed text-xl font-medium pl-4 italic">
                          "{flavorText}"
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass rounded-[2rem] p-8 flex flex-col items-center gap-4 border-foreground/5 group hover:border-primary/20 transition-all">
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Ruler className="w-7 h-7" />
                          </div>
                          <div className="text-center">
                            <div className="font-headline text-3xl font-black">{pokemon.height / 10}m</div>
                            <div className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-50">{t.height}</div>
                          </div>
                        </div>
                        <div className="glass rounded-[2rem] p-8 flex flex-col items-center gap-4 border-foreground/5 group hover:border-orange-500/20 transition-all">
                          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                            <Weight className="w-7 h-7" />
                          </div>
                          <div className="text-center">
                            <div className="font-headline text-3xl font-black">{pokemon.weight / 10}kg</div>
                            <div className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-50">{t.weight}</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-6 outline-none">
                      {pokemon.stats.map((s, idx) => (
                        <motion.div 
                          key={s.stat.name} 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center group-hover:text-primary transition-colors">
                                {getStatIcon(s.stat.name)}
                              </div>
                              <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">
                                {t[s.stat.name as keyof typeof t] || s.stat.name.replace('-', ' ')}
                              </span>
                            </div>
                            <span className="font-headline font-black text-xl">{s.base_stat}</span>
                          </div>
                          <Progress 
                            value={(s.base_stat / 255) * 100} 
                            className="h-2.5 bg-foreground/5"
                          />
                        </motion.div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Right Side: Giant Visual */}
              <div className={cn(
                "relative flex-1 min-h-[400px] md:min-h-0 flex flex-col items-center justify-center p-12 order-1 md:order-2 overflow-hidden",
                getTypeColorClass(mainType)
              )}>
                {/* Dynamic Backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-white/10" />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 20, repeat: Infinity }}
                  className="absolute w-[150%] h-[150%] bg-white/20 rounded-full blur-[120px] -z-10" 
                />
                
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="relative z-10 w-full max-w-[400px]"
                >
                  <div className="absolute inset-0 bg-white/30 blur-[100px] rounded-full scale-110 opacity-50" />
                  {artwork && (
                    <Image 
                      src={artwork} 
                      alt={pokemon.name} 
                      width={500} 
                      height={500} 
                      className="relative z-10 drop-shadow-[0_45px_45px_rgba(0,0,0,0.5)] animate-float w-full h-auto"
                      priority
                    />
                  )}
                </motion.div>

                {/* Big Floating Character */}
                <div className="absolute bottom-[-10%] right-[-10%] font-headline text-[25rem] font-black text-white/10 select-none pointer-events-none uppercase tracking-tighter">
                  {pokemon.name.charAt(0)}
                </div>

                <div className="absolute bottom-8 left-8 flex items-center gap-3 glass bg-white/20 border-none px-6 py-3 rounded-2xl text-white">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="font-black uppercase text-[10px] tracking-widest">{t.species} # {pokemon.id}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
