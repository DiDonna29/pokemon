
"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Swords, RotateCcw, Search, Zap, Heart, Loader2, Sparkles, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { hidePortableIndicator } from "@/lib/utils"; // If exists, else ignored
import { cn } from "@/lib/utils";
import { PokemonSelectorModal } from "./PokemonSelectorModal";
import confetti from "canvas-confetti";

interface BattleArenaProps {
  lang: Language;
  allPokemon: PokemonSummary[];
}

export function BattleArena({ lang, allPokemon }: BattleArenaProps) {
  const t = translations[lang];
  
  const [activeSelector, setActiveSelector] = useState<1 | 2 | null>(null);

  const [p1, setP1] = useState<PokemonDetails | null>(null);
  const [p2, setP2] = useState<PokemonDetails | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isBattling, setIsBattling] = useState(false);
  const [attackingPlayer, setAttackingPlayer] = useState<1 | 2 | null>(null);
  const [isHit, setIsHit] = useState<1 | 2 | null>(null);
  const [battleLogs, setBattleLogs] = useState<{turn: number, message: string}[]>([]);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  
  const [hp1, setHp1] = useState(0);
  const [hp2, setHp2] = useState(0);
  const [maxHp1, setMaxHp1] = useState(0);
  const [maxHp2, setMaxHp2] = useState(0);

  const fireVictoryConfetti = useCallback(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 70 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 } });
    }, 200);
  }, []);

  const handleSelectPokemon = async (player: 1 | 2, name: string) => {
    setLoading(true);
    try {
      const details = await fetchPokemonDetails(name.toLowerCase());
      if (details) {
        if (player === 1) {
          setP1(details);
          const hp = getStatValue(details, 'hp');
          setHp1(hp);
          setMaxHp1(hp);
        } else {
          setP2(details);
          const hp = getStatValue(details, 'hp');
          setHp2(hp);
          setMaxHp2(hp);
        }
        setWinner(null);
        setBattleLogs([]);
      }
    } catch (error) {
      console.error("Failed to fetch pokemon for battle", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateBattle = async () => {
    if (!p1 || !p2) return;
    
    setIsBattling(true);
    setWinner(null);
    setBattleLogs([]);
    
    let currentHp1 = maxHp1;
    let currentHp2 = maxHp2;
    
    const atk1 = getStatValue(p1, 'attack');
    const def1 = getStatValue(p1, 'defense');
    const spd1 = getStatValue(p1, 'speed');
    
    const atk2 = getStatValue(p2, 'attack');
    const def2 = getStatValue(p2, 'defense');
    const spd2 = getStatValue(p2, 'speed');
    
    let currentLogs: {turn: number, message: string}[] = [];
    let turnCount = 1;
    let turn = spd1 >= spd2 ? 1 : 2;
    
    while (currentHp1 > 0 && currentHp2 > 0 && turnCount < 50) {
      setAttackingPlayer(turn as 1 | 2);
      
      // Delay for "wind up"
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dmgLabel = lang === 'es' ? 'DAÑO' : 'DMG';

      if (turn === 1) {
        setIsHit(2);
        const dmg = Math.max(12, Math.floor((atk1 * 4) / (def2 / 10 + 1)) + Math.floor(Math.random() * 10));
        currentHp2 = Math.max(0, currentHp2 - dmg);
        setHp2(currentHp2);
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p1.name.toUpperCase()} lanza un ataque devastador (-${dmg} ${dmgLabel})` 
        }, ...currentLogs];
        turn = 2;
      } else {
        setIsHit(1);
        const dmg = Math.max(12, Math.floor((atk2 * 4) / (def1 / 10 + 1)) + Math.floor(Math.random() * 10));
        currentHp1 = Math.max(0, currentHp1 - dmg);
        setHp1(currentHp1);
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p2.name.toUpperCase()} contraataca con fuerza (-${dmg} ${dmgLabel})` 
        }, ...currentLogs];
        turn = 1;
      }
      
      setBattleLogs([...currentLogs]);
      
      // Impact duration
      await new Promise(resolve => setTimeout(resolve, 400));
      setIsHit(null);
      setAttackingPlayer(null);
      
      // Recovery delay
      await new Promise(resolve => setTimeout(resolve, 300));
      turnCount++;
    }
    
    setIsBattling(false);
    
    if (currentHp1 <= 0) {
      setWinner(2);
      fireVictoryConfetti();
    } else if (currentHp2 <= 0) {
      setWinner(1);
      fireVictoryConfetti();
    }
  };

  function getStatValue(p: PokemonDetails, name: string) {
    return p.stats.find(s => s.stat.name === name)?.base_stat || 0;
  }

  const resetBattle = () => {
    setP1(null);
    setP2(null);
    setHp1(0);
    setHp2(0);
    setWinner(null);
    setBattleLogs([]);
    setIsBattling(false);
    setIsHit(null);
    setAttackingPlayer(null);
  };

  const getArtwork = (p: PokemonDetails) => {
    return p.sprites.other["official-artwork"].front_default || p.sprites.front_default || null;
  };

  return (
    <div className="space-y-16 md:space-y-32 max-w-7xl mx-auto px-4 md:px-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col items-center gap-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative inline-block"
        >
          <Badge variant="outline" className="px-6 py-2.5 rounded-full border-primary/20 text-primary uppercase font-black text-[10px] tracking-[0.4em] bg-primary/5">
            Battle Simulation 2.0
          </Badge>
        </motion.div>

        <div className="space-y-6">
          <h2 className="text-6xl md:text-[10rem] font-headline font-black uppercase tracking-tighter leading-[0.8]">
            {t.battle_arena}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg md:text-2xl px-4 italic opacity-40 leading-relaxed">
            {t.battle_desc}
          </p>
        </div>
      </div>

      {/* Main Arena Stage */}
      <div className="relative min-h-[600px] md:min-h-[850px] w-full glass rounded-[4rem] border-foreground/[0.03] flex flex-col items-center justify-center overflow-hidden shadow-[0_64px_128px_-16px_rgba(0,0,0,0.2)]">
        
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence mode="wait">
            {attackingPlayer && (
              <motion.div 
                key={attackingPlayer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "absolute inset-0 blur-[150px]",
                  attackingPlayer === 1 ? "bg-primary" : "bg-secondary"
                )}
              />
            )}
          </AnimatePresence>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-full blur-[200px]" />
        </div>

        <AnimatePresence mode="wait">
          {isBattling || attackingPlayer !== null || winner !== null ? (
            <motion.div 
              key="battle-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col md:flex-row items-center justify-around gap-12 md:gap-8 relative z-10 px-6 py-20"
            >
              {/* Player 1 Battle Slot */}
              <div className="flex flex-col items-center gap-10 relative flex-1 w-full md:w-auto">
                <motion.div 
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="w-full max-w-[340px] space-y-5 z-30"
                >
                  <div className="flex justify-between items-end px-2">
                    <span className="font-black uppercase text-xl tracking-tighter truncate max-w-[180px]">{p1?.name}</span>
                    <span className="font-black text-2xl text-primary">{hp1} <span className="text-[10px] opacity-40">HP</span></span>
                  </div>
                  <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden border border-foreground/5">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: `${(hp1 / maxHp1) * 100}%` }}
                      className={cn(
                        "h-full transition-colors duration-500",
                        (hp1 / maxHp1) < 0.2 ? "bg-destructive" : (hp1 / maxHp1) < 0.5 ? "bg-orange-500" : "bg-primary"
                      )}
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={
                    attackingPlayer === 1 
                      ? { x: [0, 150, 0], scale: [1, 1.2, 1], rotate: [0, 5, 0] } 
                      : isHit === 1 
                      ? { x: [0, -10, 10, -10, 10, 0], filter: ["brightness(1)", "brightness(2.5)", "brightness(1)"] }
                      : { scale: 1, x: 0 }
                  }
                  transition={{ 
                    duration: attackingPlayer === 1 ? 0.4 : 0.1, 
                    type: attackingPlayer === 1 ? "spring" : "keyframes",
                    stiffness: 300 
                  }}
                  className="relative w-48 h-48 sm:w-72 sm:h-72 lg:w-[480px] lg:h-[480px]"
                >
                  {p1 && getArtwork(p1) && (
                    <Image 
                      src={getArtwork(p1)!} 
                      alt={p1.name} 
                      fill 
                      className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] animate-float-hero" 
                      priority
                    />
                  )}
                </motion.div>
              </div>

              {/* Central VS / Winner Action */}
              <div className="flex flex-col items-center gap-12 z-20 shrink-0">
                {winner ? (
                  <motion.div 
                    initial={{ scale: 0, rotate: -15 }} 
                    animate={{ scale: 1, rotate: 0 }} 
                    className="flex flex-col items-center gap-10"
                  >
                    <div className="relative">
                      <Trophy className="w-24 h-24 md:w-40 md:h-40 text-primary opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />
                      <div className="text-4xl md:text-8xl font-black text-primary drop-shadow-[0_0_40px_rgba(var(--primary),0.6)] uppercase tracking-tighter text-center leading-none">
                        {t.winner}
                      </div>
                    </div>
                    <Button 
                      onClick={resetBattle} 
                      className="bg-primary text-black rounded-full px-14 h-16 font-black uppercase text-sm tracking-[0.3em] hover:scale-110 shadow-2xl shadow-primary/40 active:scale-95 transition-all border-none"
                    >
                      <RotateCcw className="w-5 h-5 mr-3" />
                      {lang === 'es' ? 'OTRA VEZ' : 'AGAIN'}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }} 
                    className="text-7xl md:text-[12rem] font-black text-foreground/5 italic select-none"
                  >
                    VS
                  </motion.div>
                )}
              </div>

              {/* Player 2 Battle Slot */}
              <div className="flex flex-col items-center gap-10 relative flex-1 w-full md:w-auto">
                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="w-full max-w-[340px] space-y-5 z-30"
                >
                  <div className="flex justify-between items-end px-2">
                    <span className="font-black uppercase text-xl tracking-tighter truncate max-w-[180px]">{p2?.name}</span>
                    <span className="font-black text-2xl text-secondary">{hp2} <span className="text-[10px] opacity-40">HP</span></span>
                  </div>
                  <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden border border-foreground/5">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: `${(hp2 / maxHp2) * 100}%` }}
                      className={cn(
                        "h-full transition-colors duration-500",
                        (hp2 / maxHp2) < 0.2 ? "bg-destructive" : (hp2 / maxHp2) < 0.5 ? "bg-orange-500" : "bg-secondary"
                      )}
                    />
                  </div>
                </motion.div>

                <motion.div
                  animate={
                    attackingPlayer === 2 
                      ? { x: [0, -150, 0], scale: [1, 1.2, 1], rotate: [0, -5, 0] } 
                      : isHit === 2 
                      ? { x: [0, 10, -10, 10, -10, 0], filter: ["brightness(1)", "brightness(2.5)", "brightness(1)"] }
                      : { scale: 1, x: 0 }
                  }
                  transition={{ 
                    duration: attackingPlayer === 2 ? 0.4 : 0.1, 
                    type: attackingPlayer === 2 ? "spring" : "keyframes",
                    stiffness: 300 
                  }}
                  className="relative w-48 h-48 sm:w-72 sm:h-72 lg:w-[480px] lg:h-[480px]"
                >
                  {p2 && getArtwork(p2) && (
                    <Image 
                      src={getArtwork(p2)!} 
                      alt={p2.name} 
                      fill 
                      className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] animate-float-hero" 
                      priority
                    />
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* Preparation Stage */
            <motion.div 
              key="prep-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 relative z-10 px-8 py-20"
            >
              <div className="w-full lg:flex-1 max-w-[480px] flex flex-col gap-8">
                 <Button 
                    variant="outline" onClick={() => setActiveSelector(1)}
                    className="w-full h-24 glass border-foreground/10 rounded-[2.5rem] flex items-center justify-between px-10 hover:bg-foreground/5 group"
                  >
                    <div className="flex items-center gap-6">
                      <Search className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-black uppercase text-xl md:text-2xl tracking-tighter truncate text-foreground">{p1 ? p1.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p1 ? (
                    <div className="glass p-12 rounded-[4rem] border-foreground/5 text-center relative flex-1 min-h-[350px] flex flex-col justify-center group overflow-hidden">
                      <div className="relative w-48 h-48 md:w-72 md:h-72 mx-auto">
                        <Image src={getArtwork(p1)!} alt={p1.name} fill className="object-contain drop-shadow-2xl animate-float-hero" />
                      </div>
                    </div>
                  ) : (
                    <div className="glass h-[250px] md:h-[500px] rounded-[4rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-6 opacity-30 w-full">
                       <div className="font-black uppercase text-xs tracking-[0.5em]">Slot 01</div>
                    </div>
                  )}
              </div>

              <div className="flex flex-col items-center gap-14">
                <div className="w-28 h-28 md:w-44 md:h-44 rounded-[3rem] glass border-primary/20 flex items-center justify-center relative shadow-3xl">
                   <span className="text-4xl md:text-8xl font-black text-primary italic">VS</span>
                   <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] -z-10" />
                </div>
                
                <Button 
                  disabled={!p1 || !p2 || loading} onClick={simulateBattle}
                  className="w-full sm:w-80 h-20 md:h-28 rounded-full bg-primary text-black font-black text-2xl md:text-5xl shadow-[0_32px_64px_-12px_rgba(var(--primary),0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter border-none"
                >
                  {t.start_battle}
                </Button>
              </div>

              <div className="w-full lg:flex-1 max-w-[480px] flex flex-col gap-8">
                  <Button 
                    variant="outline" onClick={() => setActiveSelector(2)}
                    className="w-full h-24 glass border-foreground/10 rounded-[2.5rem] flex items-center justify-between px-10 hover:bg-foreground/5 group"
                  >
                    <div className="flex items-center gap-6">
                      <Search className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-black uppercase text-xl md:text-2xl tracking-tighter truncate text-foreground">{p2 ? p2.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p2 ? (
                    <div className="glass p-12 rounded-[4rem] border-foreground/5 text-center relative flex-1 min-h-[350px] flex flex-col justify-center group overflow-hidden">
                      <div className="relative w-48 h-48 md:w-72 md:h-72 mx-auto">
                        <Image src={getArtwork(p2)!} alt={p2.name} fill className="object-contain drop-shadow-2xl animate-float-hero" />
                      </div>
                    </div>
                  ) : (
                    <div className="glass h-[250px] md:h-[500px] rounded-[4rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-6 opacity-30 w-full">
                       <div className="font-black uppercase text-xs tracking-[0.5em]">Slot 02</div>
                    </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Battle Logs Section */}
      <AnimatePresence>
        {battleLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto w-full">
            <div className="glass rounded-[3.5rem] p-10 md:p-20 border-foreground/[0.03] shadow-4xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] select-none pointer-events-none">
                <Swords className="w-64 h-64" />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-10 mb-20 relative z-10">
                <h3 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter flex items-center gap-8">
                  <span className="w-4 h-16 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
                  {t.battle_logs}
                </h3>
              </div>
              
              <div className="space-y-8 max-h-[600px] overflow-y-auto pr-8 scrollbar-none relative z-10">
                {battleLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className={cn(
                      "text-xl md:text-3xl font-black border-b border-foreground/[0.05] pb-8 last:border-0 flex items-center gap-10",
                      i === 0 ? "text-primary scale-105 origin-left" : "opacity-20"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-3xl bg-foreground/[0.05] text-xs font-black">
                      <span className="opacity-30">T.</span>
                      <span>{log.turn}</span>
                    </div>
                    <span className="capitalize leading-tight tracking-tight italic">{log.message}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PokemonSelectorModal 
        isOpen={activeSelector !== null} 
        onClose={() => setActiveSelector(null)} 
        onSelect={(name) => activeSelector && handleSelectPokemon(activeSelector, name)} 
        allPokemon={allPokemon} 
        lang={lang} 
      />
    </div>
  );
}

