"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PokemonDetails, fetchPokemonDetails, getTypeColorClass } from "@/lib/pokeapi";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PokemonCardProps {
  name: string;
  isCaught: boolean;
  onToggleCaught: (id: number) => void;
  onClick: (pokemon: PokemonDetails) => void;
}

export function PokemonCard({ name, isCaught, onToggleCaught, onClick }: PokemonCardProps) {
  const [pokemon, setPokemon] = useState<PokemonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const details = await fetchPokemonDetails(name);
      setPokemon(details);
      setLoading(false);
    }
    load();
  }, [name]);

  if (loading) {
    return (
      <div className="glass rounded-3xl p-6 h-[320px] flex flex-col items-center justify-between animate-pulse">
        <Skeleton className="h-40 w-40 rounded-full" />
        <Skeleton className="h-6 w-32 mt-4 rounded-lg" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (!pokemon) return null;

  const artwork = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default || null;

  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative glass rounded-[2.5rem] p-6 h-[320px] flex flex-col items-center justify-between cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-foreground/5"
      onClick={() => onClick(pokemon)}
    >
      {/* Caught Toggle Overlay */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.8 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCaught(pokemon.id);
        }}
        className={cn(
          "absolute top-5 right-5 z-10 p-2.5 rounded-2xl transition-all duration-300",
          isCaught ? "text-primary bg-primary/20 shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-primary hover:bg-foreground/5"
        )}
      >
        {isCaught ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </motion.button>

      {/* ID Badge */}
      <span className="absolute top-6 left-6 font-headline text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
        #{String(pokemon.id).padStart(3, '0')}
      </span>

      {/* Image with glow effect */}
      <div className="relative mt-2">
        <div className={cn(
          "absolute inset-0 blur-[60px] opacity-10 group-hover:opacity-40 transition-opacity duration-700 rounded-full",
          getTypeColorClass(pokemon.types[0].type.name)
        )} />
        {artwork ? (
          <Image 
            src={artwork} 
            alt={pokemon.name} 
            width={180} 
            height={180} 
            className="relative z-0 group-hover:scale-115 transition-transform duration-700 ease-out drop-shadow-[0_25px_25px_rgba(0,0,0,0.3)] animate-float"
          />
        ) : (
          <div className="w-[180px] h-[180px] flex items-center justify-center text-muted-foreground/20 italic text-xs">
            No Image
          </div>
        )}
      </div>

      <div className="w-full text-center mt-auto">
        <h3 className="font-headline text-xl font-black capitalize tracking-tight group-hover:text-primary transition-colors duration-300 mb-2">
          {pokemon.name}
        </h3>
        <div className="flex gap-2 justify-center">
          {pokemon.types.map((t) => (
            <Badge 
              key={t.type.name} 
              variant="outline" 
              className={cn(
                "capitalize text-[9px] py-0.5 px-3 border-none font-black text-white shadow-lg tracking-widest",
                getTypeColorClass(t.type.name)
              )}
            >
              {t.type.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Subtle Background Text */}
      <div className="absolute -bottom-4 -right-4 font-headline text-8xl font-black text-foreground/5 pointer-events-none select-none uppercase tracking-tighter">
        {pokemon.name.charAt(0)}
      </div>
    </motion.div>
  );
}
