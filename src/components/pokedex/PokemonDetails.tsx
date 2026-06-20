"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  PokemonDetails, 
  PokemonSpecies, 
  fetchPokemonSpecies, 
  getTypeColorClass 
} from "@/lib/pokeapi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Ruler, Weight, Shield, Swords, Zap, Heart, ShieldAlert, Target } from "lucide-react";

interface PokemonDetailsViewProps {
  pokemon: PokemonDetails | null;
  onClose: () => void;
}

export function PokemonDetailsView({ pokemon, onClose }: PokemonDetailsViewProps) {
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [loading, setLoading] = useState(false);

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

  const flavorText = species?.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') || "No data available.";

  return (
    <Dialog open={!!pokemon} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-background shadow-2xl rounded-2xl">
        {/* Header with Type Background */}
        <div className={cn(
          "relative h-64 w-full flex flex-col items-center justify-center p-6 overflow-hidden",
          getTypeColorClass(mainType)
        )}>
          {/* Animated decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-24 -mb-24 blur-3xl" />
          
          <div className="z-10 flex flex-col items-center">
            <span className="text-white/60 font-headline font-bold text-xl mb-2">#{String(pokemon.id).padStart(3, '0')}</span>
            <h2 className="text-white font-headline font-bold text-5xl capitalize tracking-tight drop-shadow-lg">{pokemon.name}</h2>
            <div className="flex gap-2 mt-4">
              {pokemon.types.map(t => (
                <Badge key={t.type.name} variant="secondary" className="glass bg-white/20 border-none px-4 py-1 text-white capitalize text-sm font-bold">
                  {t.type.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-24 z-20 transition-transform duration-700 hover:scale-110">
            <Image src={artwork} alt={pokemon.name} width={280} height={280} className="drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 pt-24 pb-10 bg-card">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass bg-background/40 h-12 p-1 rounded-xl">
              <TabsTrigger value="about" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-black">About</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-black">Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="mt-8 space-y-6">
              <p className="text-muted-foreground leading-relaxed text-lg italic text-center">
                "{flavorText}"
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="glass rounded-2xl p-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Ruler className="w-6 h-6" />
                  </div>
                  <span className="text-white font-headline text-2xl font-bold">{pokemon.height / 10}m</span>
                  <span className="text-muted-foreground text-xs uppercase font-bold tracking-widest">Height</span>
                </div>
                <div className="glass rounded-2xl p-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Weight className="w-6 h-6" />
                  </div>
                  <span className="text-white font-headline text-2xl font-bold">{pokemon.weight / 10}kg</span>
                  <span className="text-muted-foreground text-xs uppercase font-bold tracking-widest">Weight</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-8 space-y-5">
              {pokemon.stats.map(s => (
                <div key={s.stat.name} className="group flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 capitalize font-bold text-white/70 group-hover:text-primary transition-colors">
                      {getStatIcon(s.stat.name)}
                      {s.stat.name.replace('-', ' ')}
                    </div>
                    <span className="font-headline font-bold text-white">{s.base_stat}</span>
                  </div>
                  <Progress 
                    value={(s.base_stat / 255) * 100} 
                    className="h-2 bg-white/5"
                    indicatorClassName={cn("bg-primary shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000")} 
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
