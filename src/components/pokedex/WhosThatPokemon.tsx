"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, RotateCcw, CheckCircle2, AlertCircle, Lightbulb, Eye, Sparkles } from "lucide-react";
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
  const [isRevealing, setIsRevealing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [hintType, setHintType] = useState<'none' | 'letter' | 'types'>('none');
  const [attempts, setAttempts] = useState(0);

  const loadRandomPokemon = useCallback(async () => {
    setLoading(true);
    setIsRevealed(false);
    setIsRevealing(false);
    setGuess("");
    setMessage(null);
    setStatus('idle');
    setHintType('none');
    setAttempts(0);
    
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
    if (!currentPokemon || isRevealed || isRevealing) return;
    
    const similarity = calculateSimilarity(guess, currentPokemon.name);
    
    if (similarity >= 0.75) {
      setIsRevealed(true);
      setStatus('correct');
      setMessage(`${t.correct_guess}${currentPokemon.name.toUpperCase()}!`);
      setAttempts(0);
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF0000', '#3B4CCA', '#FFFFFF']
      });
    } else {
      setStatus('wrong');
      setMessage(t.incorrect_guess);
      setAttempts(prev => prev + 1);
    }
  };

  const handleReveal = () => {
    if (!currentPokemon || isRevealed || isRevealing) return;
    
    setIsRevealing(true);
    setMessage(null);
    
    // Cinematic Suspense
    setTimeout(() => {
      setIsRevealed(true);
      setIsRevealing(false);
      setStatus('correct');
      setMessage(`${t.revealed_msg}${currentPokemon.name.toUpperCase()}`);
      
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF0000', '#3B4CCA', '#FFFFFF']
      });
    }, 1500);
  };

  const getHint = () => {
    if (!currentPokemon) return;
    if (hintType === 'none') setHintType('letter');
    else if (hintType === 'letter') setHintType('types');
  };

  const artwork = currentPokemon?.sprites.other["official-artwork"].front_default || currentPokemon?.sprites.front_default;

  return (
    <div className="flex flex-col items-center gap-16 max-w-5xl mx-auto py-16 px-6">
      <div className="text-center space-y-6">
        <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/20 text-primary uppercase font-black text-[10px] tracking-[0.3em] bg-primary/5">
          Ultimate Quiz Challenge
        </Badge>
        <h2 className="text-5xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground to-secondary uppercase tracking-tighter leading-none">
          {t.quiz_title}
        </h2>
        <p className="text-muted-foreground font-medium italic text-xl md:text-3xl opacity-60 leading-tight">{t.quiz_desc}</p>
      </div>

      <div className="relative w-full aspect-square max-w-xl glass rounded-[4rem] border-foreground/[0.03] p-12 md:p-20 flex items-center justify-center overflow-hidden shadow-3xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10 group-hover:opacity-60 transition-opacity duration-1000" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-dashed border-foreground/5 rounded-full -m-10 opacity-20" />
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
              <Loader2 className="w-16 h-16 animate-spin text-primary opacity-40" />
              <span className="font-black uppercase tracking-[0.4em] text-[10px] opacity-20">{t.thinking}</span>
            </motion.div>
          ) : (
            artwork && (
              <motion.div 
                key={currentPokemon?.id} 
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }} 
                animate={{ 
                  scale: isRevealing ? [1, 1.08, 1] : 1,
                  rotate: isRevealing ? [0, -3, 3, -3, 3, 0] : 0,
                  opacity: 1,
                }}
                transition={{
                  scale: isRevealing ? { duration: 0.15, repeat: Infinity } : { type: 'spring', damping: 15, stiffness: 100 },
                  rotate: isRevealing ? { duration: 0.08, repeat: Infinity } : { type: 'spring', damping: 15, stiffness: 100 }
                }}
                className={cn(
                  "relative w-full h-full",
                  !isRevealed && !isRevealing && "animate-pulsate-glow"
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-white rounded-full blur-[120px] opacity-0 transition-opacity duration-500",
                  isRevealing && "opacity-80 animate-pulse"
                )} />
                <Image 
                  src={artwork}
                  alt="Quiz Pokemon"
                  fill
                  className={cn(
                    "object-contain transition-all duration-1000 ease-out",
                    !isRevealed && !isRevealing && "brightness-0",
                    isRevealing && "brightness-0 blur-[4px] opacity-80",
                    isRevealed && "drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] brightness-100 scale-110"
                  )}
                  priority
                />
              </motion.div>
            )
          )}
        </AnimatePresence>

        {!isRevealed && !isRevealing && !loading && (
          <div className="absolute top-10 left-10 text-primary/10 select-none pointer-events-none">
            <HelpCircle className="w-20 h-20 md:w-32 md:h-32" />
          </div>
        )}
      </div>

      <div className="w-full max-w-xl space-y-8">
        <div className="flex flex-col sm:flex-row gap-5">
          <Input 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            placeholder={t.guess_placeholder}
            disabled={isRevealed || isRevealing || loading}
            className="h-16 rounded-[2rem] glass border-foreground/10 text-xl font-black px-8 focus:ring-4 focus:ring-primary/20 text-foreground placeholder:opacity-30"
          />
          <Button 
            onClick={handleGuess}
            disabled={isRevealed || isRevealing || loading || !guess}
            className="h-16 px-12 rounded-[2rem] bg-primary text-black font-black uppercase tracking-[0.2em] hover:scale-110 active:scale-95 transition-all w-full sm:w-auto shadow-2xl shadow-primary/30"
          >
            {t.check_guess}
          </Button>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} className="space-y-4">
              <div className={cn(
                "p-6 rounded-[2.5rem] border flex items-center gap-6 font-black uppercase text-xs tracking-[0.2em] shadow-xl backdrop-blur-xl",
                status === 'correct' ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500"
              )}>
                {status === 'correct' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                <span className="flex-1 leading-relaxed">{message}</span>
              </div>

              {!isRevealed && status === 'wrong' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={getHint}
                    className="w-full h-14 rounded-2xl glass border-foreground/5 font-black uppercase text-[10px] tracking-[0.3em] gap-3 text-foreground hover:bg-foreground/10"
                  >
                    <Lightbulb className="w-4 h-4 text-primary" />
                    {t.get_hint}
                  </Button>
                  
                  {attempts >= 3 && (
                    <Button 
                      variant="outline" 
                      onClick={handleReveal}
                      disabled={isRevealing}
                      className="w-full h-14 rounded-2xl glass border-primary/20 font-black uppercase text-[10px] tracking-[0.3em] gap-3 text-primary hover:bg-primary/10 shadow-lg shadow-primary/5"
                    >
                      <Eye className="w-4 h-4" />
                      {t.reveal_name}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hintType !== 'none' && !isRevealed && !isRevealing && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass p-6 rounded-[2.5rem] border-primary/20 text-center shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary leading-loose">
                {hintType === 'letter' ? (
                  <>{t.hint_first_letter} <span className="text-3xl ml-4 italic underline decoration-primary/40 underline-offset-8">{currentPokemon?.name.charAt(0).toUpperCase()}</span></>
                ) : (
                  <>{t.hint_types} <span className="ml-4 capitalize bg-foreground/5 px-6 py-2 rounded-full">{currentPokemon?.types.map(t => t.type.name).join(' · ')}</span></>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button 
          variant="outline" 
          onClick={loadRandomPokemon}
          disabled={isRevealing}
          className="w-full h-16 rounded-[2rem] glass border-foreground/5 hover:bg-foreground/10 text-foreground font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-5 transition-all group overflow-hidden relative active:scale-95"
        >
          <Sparkles className="w-5 h-5 text-secondary transition-transform group-hover:scale-125 group-hover:rotate-12" />
          {t.next_pokemon}
          <motion.div className="absolute inset-0 bg-secondary/5 -z-10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
        </Button>
      </div>
    </div>
  );
}