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
      <div className="glass rounded-[3rem] p-8 h-[380px] flex flex-col items-center justify-between animate-pulse">
        <Skeleton className="h-48 w-48 rounded-full bg-foreground/5" />
        <div className="space-y-3 w-full">
          <Skeleton className="h-8 w-3/4 mx-auto rounded-xl bg-foreground/5" />
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-6 w-16 rounded-full bg-foreground/5" />
            <Skeleton className="h-6 w-16 rounded-full bg-foreground/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!pokemon) return null;

  const artwork = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default || null;

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group relative glass rounded-[3.5rem] p-8 h-[380px] flex flex-col items-center justify-between cursor-pointer overflow-hidden spring-hover"
      onClick={() => onClick(pokemon)}
    >
      <div className="absolute top-8 left-8 flex flex-col items-start gap-1">
        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em]">Pokedex</span>
        <span className="font-headline text-xl font-black text-primary/60 tracking-tighter">
          #{String(pokemon.id).padStart(3, '0')}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.2, rotate: 12 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCaught(pokemon.id);
        }}
        className={cn(
          "absolute top-8 right-8 z-20 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          isCaught ? "bg-primary shadow-xl shadow-primary/40" : "bg-foreground/5 hover:bg-foreground/10"
        )}
      >
        <Image 
          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
          alt="Caught"
          width={24}
          height={24}
          className={cn("transition-all duration-500", isCaught ? "grayscale-0" : "grayscale opacity-30")}
        />
      </motion.button>

      <div className="relative mt-8">
        <div className={cn(
          "absolute inset-0 blur-[100px] opacity-10 group-hover:opacity-40 transition-opacity duration-1000 rounded-full",
          getTypeColorClass(pokemon.types[0].type.name)
        )} />
        {artwork && (
          <Image 
            src={artwork} 
            alt={pokemon.name} 
            width={220} 
            height={220} 
            className="relative z-10 drop-shadow-[0_40px_40px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform duration-700 animate-float-premium"
            priority={pokemon.id < 50}
          />
        )}
      </div>

      <div className="w-full text-center mt-auto">
        <h3 className="text-3xl font-black capitalize tracking-tighter group-hover:text-primary mb-4">
          {pokemon.name}
        </h3>
        <div className="flex gap-2 justify-center">
          {pokemon.types.map((t) => (
            <Badge 
              key={t.type.name} 
              className={cn(
                "capitalize text-[9px] py-1.5 px-5 rounded-full border-none font-black text-white shadow-xl tracking-widest",
                getTypeColorClass(t.type.name)
              )}
            >
              {t.type.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 text-[12rem] font-black text-foreground/[0.02] pointer-events-none select-none uppercase tracking-tighter group-hover:text-primary/[0.04] transition-colors duration-1000">
        {pokemon.name.charAt(0)}
      </div>
    </motion.div>
  );
}