"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, HelpCircle, RotateCcw, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface WhosThatPokemonProps {
  lang: Language;
  allPokemon: PokemonSummary[];
}

export function WhosThatPokemon({ lang, allPokemon }: WhosThatPokemonProps) {
  const t = translations[lang];
  const [currentPokemon, setCurrentPokemon] = useState<PokemonDetails | null>(null);
  const [guess, setGuess] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [hintType, setHintType] = useState<'none' | 'letter' | 'types'>('none');

  const loadRandomPokemon = useCallback(async () => {
    setLoading(true);
    setIsRevealed(false);
    setGuess("");
    setMessage(null);
    setStatus('idle');
    setHintType('none');
    
    try {
      const randomIndex = Math.floor(Math.random() * Math.min(allPokemon.length, 1010));
      const randomPokemon = allPokemon[randomIndex];
      const details = await fetchPokemonDetails(randomPokemon.name);
      setCurrentPokemon(details);
    } catch (error) {
      console.error("Failed to load quiz pokemon", error);
    } finally {
      setLoading(false);
    }
  }, [allPokemon]);

  useEffect(() => {
    if (allPokemon.length > 0 && !currentPokemon) {
      loadRandomPokemon();
    }
  }, [allPokemon, currentPokemon, loadRandomPokemon]);

  const calculateSimilarity = (str1: string, str2: string) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1;
    
    let matches = 0;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length;
  };

  const handleGuess = () => {
    if (!currentPokemon || isRevealed) return;
    
    const similarity = calculateSimilarity(guess, currentPokemon.name);
    
    if (similarity >= 0.7) {
      setIsRevealed(true);
      setStatus('correct');
      setMessage(`${t.correct_guess}${currentPokemon.name.toUpperCase()}!`);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF0000', '#3B4CCA']
      });
    } else {
      setStatus('wrong');
      setMessage(t.incorrect_guess);
    }
  };

  const getHint = () => {
    if (!currentPokemon) return;
    if (hintType === 'none') setHintType('letter');
    else if (hintType === 'letter') setHintType('types');
  };

  const artwork = currentPokemon?.sprites.other["official-artwork"].front_default || currentPokemon?.sprites.front_default;

  return (
    <div className="flex flex-col items-center gap-10 max-w-4xl mx-auto py-10 px-6">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary uppercase tracking-tighter">
          {t.quiz_title}
        </h2>
        <p className="text-muted-foreground font-medium italic text-lg">{t.quiz_desc}</p>
      </div>

      <div className="relative w-full aspect-square max-w-md glass rounded-[3rem] md:rounded-[4rem] border-foreground/5 p-8 md:p-12 flex items-center justify-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 -z-10" />
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <RotateCcw className="w-12 h-12 animate-spin text-primary" />
            </motion.div>
          ) : (
            artwork && (
              <motion.div key={currentPokemon?.id} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full h-full">
                <Image 
                  src={artwork}
                  alt="Quiz Pokemon"
                  fill
                  className={cn(
                    "object-contain transition-all duration-700 animate-float",
                    !isRevealed ? "brightness-0" : "drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                  )}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>

        {!isRevealed && !loading && (
          <div className="absolute top-6 left-6 text-primary/20">
            <HelpCircle className="w-12 h-12 md:w-16 md:h-16" />
          </div>
        )}
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            placeholder={t.guess_placeholder}
            disabled={isRevealed || loading}
            className="h-14 rounded-2xl glass border-foreground/10 text-lg font-bold px-6 focus:ring-primary/40 text-black dark:text-white"
          />
          <Button 
            onClick={handleGuess}
            disabled={isRevealed || loading || !guess}
            className="h-14 px-8 rounded-2xl bg-primary text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full sm:w-auto hover:bg-primary/90"
          >
            {t.check_guess}
          </Button>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="space-y-3">
              <div className={cn(
                "p-4 rounded-2xl border flex items-center gap-4 font-black uppercase text-[10px] tracking-widest",
                status === 'correct' ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500"
              )}>
                {status === 'correct' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message}
              </div>

              {!isRevealed && status === 'wrong' && (
                <Button 
                  variant="ghost" 
                  onClick={getHint}
                  className="w-full h-12 rounded-xl glass border-foreground/5 font-black uppercase text-[10px] tracking-widest gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all"
                >
                  <Lightbulb className="w-4 h-4" />
                  {t.get_hint}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hintType !== 'none' && !isRevealed && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-4 rounded-2xl border-primary/20 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-primary">
                {hintType === 'letter' ? (
                  <>{t.hint_first_letter} <span className="text-xl ml-2">{currentPokemon?.name.charAt(0).toUpperCase()}</span></>
                ) : (
                  <>{t.hint_types} <span className="ml-2 capitalize">{currentPokemon?.types.map(t => t.type.name).join(', ')}</span></>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          variant="outline" 
          onClick={loadRandomPokemon}
          className="w-full h-14 rounded-2xl glass border-foreground/5 hover:bg-foreground/20 text-black dark:text-white font-black uppercase text-xs tracking-widest flex items-center gap-3 transition-all"
        >
          <Sparkles className="w-5 h-5 text-secondary" />
          {t.next_pokemon}
        </Button>
      </div>
    </div>
  );
}
