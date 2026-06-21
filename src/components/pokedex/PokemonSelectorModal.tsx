"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Search, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface PokemonSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  allPokemon: PokemonSummary[];
  lang: Language;
}

export function PokemonSelectorModal({ isOpen, onClose, onSelect, allPokemon, lang }: PokemonSelectorModalProps) {
  const t = translations[lang];
  const [search, setSearch] = useState("");

  // Clear search when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search) return allPokemon.slice(0, 100);
    return allPokemon
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 100);
  }, [search, allPokemon]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden flex flex-col border-none glass bg-background/95 backdrop-blur-2xl">
        <DialogHeader className="p-6 border-b border-foreground/5">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            {t.choose_your_fighter}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Selecciona un Pokémon de la lista para el combate.
          </DialogDescription>
          <div className="relative mt-4">
            <Input
              placeholder={t.search_pokemon}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-2xl glass border-foreground/10 focus:ring-primary/30 text-lg"
              autoFocus
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
            {search && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSearch("")} 
                className="absolute right-2 top-2 h-8 w-8 rounded-xl"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((pokemon, idx) => {
                const id = pokemon.url.split('/').filter(Boolean).pop();
                const artwork = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

                return (
                  <motion.button
                    key={pokemon.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onSelect(pokemon.name);
                      setSearch(""); // Explicitly clear search on select
                      onClose();
                    }}
                    className="group glass p-4 rounded-3xl border-foreground/5 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                      <Image
                        src={artwork}
                        alt={pokemon.name}
                        fill
                        className="object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                        sizes="(max-width: 768px) 64px, 80px"
                      />
                    </div>
                    <span className="font-bold text-xs capitalize truncate w-full text-center">
                      {pokemon.name}
                    </span>
                    <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">
                      #{String(id).padStart(3, '0')}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}