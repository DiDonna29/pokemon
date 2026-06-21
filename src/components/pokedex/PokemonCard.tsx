
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
      <div className="glass rounded-[2.5rem] p-6 h-[340px] flex flex-col items-center justify-between animate-pulse border-foreground/5">
        <Skeleton className="h-44 w-44 rounded-full" />
        <Skeleton className="h-7 w-36 mt-4 rounded-xl" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  if (!pokemon) return null;

  const artwork = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default || null;

  return (
    <motion.div 
      whileHover={{ y: -15, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group relative glass rounded-[3rem] p-8 h-[360px] flex flex-col items-center justify-between cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 border-foreground/10"
      onClick={() => onClick(pokemon)}
    >
      {/* Caught Toggle Overlay */}
      <motion.button
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.8 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCaught(pokemon.id);
        }}
        className={cn(
          "absolute top-6 right-6 z-10 p-3 rounded-2xl transition-all duration-300 backdrop-blur-md",
          isCaught ? "text-primary bg-primary/20 shadow-xl shadow-primary/30" : "text-muted-foreground hover:text-primary hover:bg-foreground/10"
        )}
      >
        {isCaught ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
      </motion.button>

      {/* ID Badge */}
      <span className="absolute top-8 left-8 font-headline text-xs font-black text-primary/40 uppercase tracking-widest">
        #{String(pokemon.id).padStart(3, '0')}
      </span>

      {/* Image with enhanced glow */}
      <div className="relative mt-4">
        <div className={cn(
          "absolute inset-0 blur-[80px] opacity-20 group-hover:opacity-60 transition-opacity duration-700 rounded-full",
          getTypeColorClass(pokemon.types[0].type.name)
        )} />
        {artwork ? (
          <Image 
            src={artwork} 
            alt={pokemon.name} 
            width={200} 
            height={200} 
            className="relative z-0 group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-[0_30px_30px_rgba(0,0,0,0.4)] animate-float"
            priority={pokemon.id < 50}
          />
        ) : (
          <div className="w-[200px] h-[200px] flex items-center justify-center text-muted-foreground/30 italic text-sm">
            No Image
          </div>
        )}
      </div>

      <div className="w-full text-center mt-auto z-10">
        <h3 className="font-headline text-2xl font-black capitalize tracking-tight group-hover:text-primary transition-colors duration-300 mb-3 drop-shadow-sm">
          {pokemon.name}
        </h3>
        <div className="flex gap-2 justify-center">
          {pokemon.types.map((t) => (
            <Badge 
              key={t.type.name} 
              variant="outline" 
              className={cn(
                "capitalize text-[10px] py-1 px-4 border-none font-black text-white shadow-xl tracking-widest transition-transform hover:scale-110",
                getTypeColorClass(t.type.name)
              )}
            >
              {t.type.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Background Graphic */}
      <div className="absolute -bottom-8 -right-8 font-headline text-[10rem] font-black text-foreground/[0.03] pointer-events-none select-none uppercase tracking-tighter group-hover:text-primary/[0.05] transition-colors">
        {pokemon.name.charAt(0)}
      </div>
    </motion.div>
  );
}
