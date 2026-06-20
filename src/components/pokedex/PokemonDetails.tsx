
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
import { Ruler, Weight, Shield, Swords, Zap, Heart, ShieldAlert, Target } from "lucide-react";
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
      fetchPokemonSpecies(pokemon.species.url).then(data => {
        setSpecies(data);
        setLoading(false);
      });
    }
  }, [pokemon]);

  if (!pokemon) return null;

  const artwork = pokemon.sprites.other["official-artwork"].front_default;
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

  const currentLangCode = lang === 'en' ? 'en' : 'es';
  const flavorText = species?.flavor_text_entries.find(e => e.language.name === currentLangCode)?.flavor_text.replace(/\f/g, ' ') 
    || species?.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\f/g, ' ')
    || "No data available.";

  return (
    <Dialog open={!!pokemon} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-background shadow-2xl rounded-3xl">
        <AnimatePresence>
          {pokemon && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              {/* Header with Type Background */}
              <div className={cn(
                "relative h-64 w-full flex flex-col items-center justify-center p-6 overflow-hidden",
                getTypeColorClass(mainType)
              )}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-24 -mb-24 blur-3xl" />
                
                <div className="z-10 flex flex-col items-center">
                  <span className="text-white/60 font-headline font-bold text-xl mb-2">#{String(pokemon.id).padStart(3, '0')}</span>
                  <DialogTitle className="text-white font-headline font-bold text-5xl capitalize tracking-tight drop-shadow-lg">
                    {pokemon.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {flavorText}
                  </DialogDescription>
                  <div className="flex gap-2 mt-4">
                    {pokemon.types.map(t => (
                      <Badge key={t.type.name} variant="secondary" className="glass bg-white/20 border-none px-4 py-1 text-white capitalize text-sm font-bold">
                        {t.type.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -bottom-24 z-20"
                >
                  <Image src={artwork} alt={pokemon.name} width={260} height={260} className="drop-shadow-2xl animate-float" />
                </motion.div>
              </div>

              {/* Content Area */}
              <div className="px-8 pt-28 pb-10 bg-card">
                <Tabs defaultValue="about" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 glass bg-foreground/5 h-12 p-1 rounded-2xl">
                    <TabsTrigger value="about" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                      {t.about}
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-black transition-all">
                      {t.stats}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="about" className="mt-8 space-y-6">
                    <p className="text-muted-foreground leading-relaxed text-lg italic text-center px-4">
                      "{flavorText}"
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="glass rounded-2xl p-6 flex flex-col items-center gap-3 border-foreground/5">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                          <Ruler className="w-6 h-6" />
                        </div>
                        <span className="font-headline text-2xl font-bold">{pokemon.height / 10}m</span>
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{t.height}</span>
                      </div>
                      <div className="glass rounded-2xl p-6 flex flex-col items-center gap-3 border-foreground/5">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                          <Weight className="w-6 h-6" />
                        </div>
                        <span className="font-headline text-2xl font-bold">{pokemon.weight / 10}kg</span>
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{t.weight}</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="mt-8 space-y-5">
                    {pokemon.stats.map((s, idx) => (
                      <motion.div 
                        key={s.stat.name} 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 capitalize font-bold text-muted-foreground group-hover:text-primary transition-colors">
                            {getStatIcon(s.stat.name)}
                            {s.stat.name.replace('-', ' ')}
                          </div>
                          <span className="font-headline font-bold">{s.base_stat}</span>
                        </div>
                        <Progress 
                          value={(s.base_stat / 255) * 100} 
                          className="h-2 bg-foreground/5"
                        />
                      </motion.div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
