"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PokemonDetails, fetchPokemonDetails, getTypeColorClass } from "@/lib/pokeapi";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="glass rounded-xl p-4 h-[280px] flex flex-col items-center justify-between animate-pulse">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-6 w-24 mt-4" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    );
  }

  if (!pokemon) return null;

  const artwork = pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default;

  return (
    <div 
      className="group relative glass rounded-xl p-4 h-[280px] flex flex-col items-center justify-between pokemon-card-tilt cursor-pointer overflow-hidden"
      onClick={() => onClick(pokemon)}
    >
      {/* Caught Toggle Overlay - small and subtle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCaught(pokemon.id);
        }}
        className={cn(
          "absolute top-3 right-3 z-10 p-1.5 rounded-full transition-all duration-300",
          isCaught ? "text-primary bg-primary/20" : "text-muted-foreground hover:text-primary hover:bg-white/10"
        )}
      >
        {isCaught ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>

      {/* ID Badge */}
      <span className="absolute top-4 left-4 font-headline text-xs font-bold text-muted-foreground/50">
        #{String(pokemon.id).padStart(3, '0')}
      </span>

      {/* Image with glow effect */}
      <div className="relative mt-4">
        <div className={cn(
          "absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity",
          getTypeColorClass(pokemon.types[0].type.name)
        )} />
        <Image 
          src={artwork} 
          alt={pokemon.name} 
          width={140} 
          height={140} 
          className="relative z-0 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl"
        />
      </div>

      <div className="w-full text-center mt-auto">
        <h3 className="font-headline text-lg font-bold capitalize tracking-wide text-white group-hover:text-primary transition-colors">
          {pokemon.name}
        </h3>
        <div className="flex gap-1.5 justify-center mt-2">
          {pokemon.types.map((t) => (
            <Badge 
              key={t.type.name} 
              variant="outline" 
              className={cn(
                "capitalize text-[10px] py-0 px-2 border-none font-bold text-white",
                getTypeColorClass(t.type.name)
              )}
            >
              {t.type.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
