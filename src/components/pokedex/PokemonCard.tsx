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
      <div className="glass rounded-[4rem] p-10 h-[450px] flex flex-col items-center justify-between animate-pulse">
        <Skeleton className="h-56 w-56 rounded-full bg-foreground/5" />
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
      whileHover={{ y: -15, scale: 1.02 }}
      className="group relative glass-card rounded-[4rem] p-10 h-[450px] flex flex-col items-center justify-between cursor-pointer overflow-hidden transition-all duration-700"
      onClick={() => onClick(pokemon)}
    >
      <div className="absolute top-10 left-10 flex flex-col items-start gap-1 z-20">
        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em]">Entry</span>
        <span className="font-headline text-2xl font-black text-primary/60 tracking-tighter italic">
          #{String(pokemon.id).padStart(3, '0')}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.25, rotate: 15 }}
        whileTap={{ scale: 0.85 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCaught(pokemon.id);
        }}
        className={cn(
          "absolute top-10 right-10 z-30 w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-1000",
          isCaught ? "bg-primary shadow-[0_15px_30px_-5px_rgba(var(--primary),0.5)]" : "glass hover:bg-foreground/10"
        )}
      >
        <Image 
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
          alt="Caught"
          width={28}
          height={28}
          className={cn("transition-all duration-1000", isCaught ? "rotate-[360deg] grayscale-0" : "grayscale opacity-30")}
        />
      </motion.button>

      <div className="relative mt-12 flex-1 flex items-center justify-center w-full">
        <div className={cn(
          "absolute inset-0 blur-[100px] opacity-10 group-hover:opacity-40 transition-opacity duration-1000 rounded-full scale-125",
          getTypeColorClass(pokemon.types[0].type.name)
        )} />
        {artwork && (
          <Image 
            src={artwork} 
            alt={pokemon.name} 
            width={300} 
            height={300} 
            className="relative z-10 drop-shadow-[0_60px_60px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform duration-1000 animate-float-hero w-auto h-full max-h-[220px]"
            priority={pokemon.id < 30}
          />
        )}
      </div>

      <div className="w-full text-center mt-auto z-10">
        <h3 className="text-4xl md:text-5xl font-black capitalize tracking-tighter group-hover:text-primary mb-5 group-hover:italic transition-all duration-700">
          {pokemon.name}
        </h3>
        <div className="flex gap-3 justify-center">
          {pokemon.types.map((t) => (
            <Badge 
              key={t.type.name} 
              className={cn(
                "capitalize text-[10px] py-2 px-6 rounded-full border-none font-black text-white shadow-2xl tracking-[0.2em]",
                getTypeColorClass(t.type.name)
              )}
            >
              {t.type.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-16 -right-16 text-[18rem] font-black text-foreground/[0.02] pointer-events-none select-none uppercase tracking-tighter group-hover:text-primary/[0.05] transition-colors duration-1000 leading-none">
        {pokemon.name.charAt(0)}
      </div>
    </motion.div>
  );
}