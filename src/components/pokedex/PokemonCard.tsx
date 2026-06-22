
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PokemonDetails, fetchPokemonDetails, getTypeColorClass } from "@/lib/pokeapi";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="glass rounded-[4rem] p-10 h-[500px] flex flex-col items-center justify-between">
        <Skeleton className="h-64 w-64 rounded-full bg-foreground/5" />
        <div className="space-y-4 w-full">
          <Skeleton className="h-10 w-3/4 mx-auto rounded-2xl bg-foreground/5" />
          <div className="flex gap-3 justify-center">
            <Skeleton className="h-7 w-20 rounded-full bg-foreground/5" />
            <Skeleton className="h-7 w-20 rounded-full bg-foreground/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!pokemon) return null;

  const artwork = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default || null;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group relative glass-card rounded-[4rem] p-8 md:p-10 h-[500px] flex flex-col items-center justify-between cursor-pointer overflow-hidden transform-gpu"
      onClick={() => onClick(pokemon)}
    >
      <div className="absolute top-8 left-8 flex flex-col items-start gap-1 z-20">
        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em]">Entry</span>
        <span className="font-headline text-2xl font-black text-primary/60 tracking-tighter italic">
          #{String(pokemon.id).padStart(3, '0')}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCaught(pokemon.id);
        }}
        className={cn(
          "absolute top-8 right-8 z-30 w-12 h-12 md:w-14 md:h-14 rounded-3xl flex items-center justify-center transition-all duration-300 transform-gpu",
          isCaught ? "bg-primary shadow-glow" : "glass hover:bg-foreground/10"
        )}
      >
        <Image 
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
          alt="Caught"
          width={28}
          height={28}
          className={cn("transition-all duration-700 transform-gpu", isCaught ? "rotate-[360deg] grayscale-0" : "grayscale opacity-30")}
        />
      </motion.button>

      <div className="relative mt-12 flex-1 flex items-center justify-center w-full transform-gpu">
        <div className={cn(
          "absolute inset-0 blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 rounded-full scale-125 transform-gpu",
          getTypeColorClass(pokemon.types[0].type.name)
        )} />
        {artwork && (
          <Image 
            src={artwork} 
            alt={pokemon.name} 
            width={350} 
            height={350} 
            className="relative z-10 drop-shadow-2xl group-hover:scale-105 transition-transform duration-500 animate-float-hero w-auto h-full max-h-[250px] transform-gpu"
            priority={pokemon.id < 20}
          />
        )}
      </div>

      <div className="w-full text-center mt-auto z-10">
        <h3 className={cn(
          "font-black capitalize tracking-tighter group-hover:text-primary mb-5 transition-all duration-300 leading-tight",
          pokemon.name.length > 10 ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"
        )}>
          {pokemon.name}
        </h3>
        <div className="flex gap-3 justify-center">
          {pokemon.types.map((t) => (
            <Badge 
              key={t.type.name} 
              className={cn(
                "capitalize text-[10px] py-2 px-6 rounded-full border-none font-black text-white shadow-lg tracking-[0.2em]",
                getTypeColorClass(t.type.name)
              )}
            >
              {t.type.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-16 -right-16 text-[18rem] font-black text-foreground/[0.02] pointer-events-none select-none uppercase tracking-tighter leading-none">
        {pokemon.name.charAt(0)}
      </div>
    </motion.div>
  );
}
