
"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Swords, RotateCcw, Search, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsHit(null);
      setAttackingPlayer(null);
      await new Promise(resolve => setTimeout(resolve, 400));
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
    <div className="space-y-8 md:space-y-16 max-w-7xl mx-auto px-4 md:px-12 pb-32">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Badge variant="outline" className="px-6 py-2.5 rounded-full border-primary/20 text-primary uppercase font-black text-[10px] tracking-[0.4em] bg-primary/5">
            Battle Arena 2.0
          </Badge>
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-4xl md:text-7xl font-headline font-black uppercase tracking-tighter leading-none text-foreground">
            {t.battle_arena}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-base md:text-xl opacity-40 italic">
            {t.battle_desc}
          </p>
        </div>
      </div>

      <div className="relative min-h-[500px] md:h-[70vh] w-full glass rounded-[3rem] border-foreground/[0.03] flex flex-col items-center justify-center overflow-visible md:overflow-hidden shadow-4xl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3rem]">
          <AnimatePresence mode="wait">
            {attackingPlayer && (
              <motion.div 
                key={attackingPlayer}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.15, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className={cn(
                  "absolute inset-0 blur-[120px]",
                  attackingPlayer === 1 ? "bg-primary" : "bg-secondary"
                )}
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {isBattling || attackingPlayer !== null || winner !== null ? (
            <motion.div 
              key="battle-stage"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col md:flex-row items-center justify-around gap-4 relative z-10 px-4 md:px-8 py-8 md:py-0"
            >
              {/* Player 1 Slot */}
              <div className="flex flex-col items-center justify-center gap-4 flex-1 w-full order-2 md:order-1 h-full max-h-full overflow-hidden">
                <div className="w-full max-w-xs space-y-2 shrink-0">
                  <div className="flex justify-between items-end px-1">
                    <span className="font-black uppercase text-xs md:text-base tracking-tighter truncate">{p1?.name}</span>
                    <span className="font-black text-sm md:text-lg text-primary">{hp1} HP</span>
                  </div>
                  <Progress value={(hp1 / maxHp1) * 100} className="h-2 rounded-full overflow-hidden" />
                </div>

                <motion.div
                  animate={
                    attackingPlayer === 1 
                      ? { x: [0, 80, 0], scale: [1, 1.1, 1] } 
                      : isHit === 1 
                      ? { x: [0, -5, 5, -5, 5, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] }
                      : {}
                  }
                  transition={{ duration: attackingPlayer === 1 ? 0.3 : 0.1 }}
                  className="relative w-full h-full min-h-[200px] md:max-h-[50vh] flex items-center justify-center"
                >
                  {p1 && getArtwork(p1) && (
                    <Image src={getArtwork(p1)!} alt={p1.name} fill className="object-contain drop-shadow-2xl animate-float-hero" priority />
                  )}
                </motion.div>
              </div>

              {/* VS Slot */}
              <div className="flex flex-col items-center justify-center gap-4 z-20 shrink-0 order-1 md:order-2 h-auto">
                {winner ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="text-3xl md:text-6xl font-black text-primary drop-shadow-glow uppercase tracking-tighter text-center italic leading-none">
                      {t.winner}
                    </div>
                    <Button onClick={resetBattle} size="sm" className="bg-primary text-black rounded-full px-8 h-10 font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95">
                      {lang === 'es' ? 'OTRA VEZ' : 'AGAIN'}
                    </Button>
                  </motion.div>
                ) : (
                  <div className="text-4xl md:text-8xl font-black text-foreground/10 italic select-none">VS</div>
                )}
              </div>

              {/* Player 2 Slot */}
              <div className="flex flex-col items-center justify-center gap-4 flex-1 w-full order-3 h-full max-h-full overflow-hidden">
                <div className="w-full max-w-xs space-y-2 shrink-0">
                  <div className="flex justify-between items-end px-1">
                    <span className="font-black uppercase text-xs md:text-base tracking-tighter truncate">{p2?.name}</span>
                    <span className="font-black text-sm md:text-lg text-secondary">{hp2} HP</span>
                  </div>
                  <Progress value={(hp2 / maxHp2) * 100} className="h-2 rounded-full overflow-hidden" />
                </div>

                <motion.div
                  animate={
                    attackingPlayer === 2 
                      ? { x: [0, -80, 0], scale: [1, 1.1, 1] } 
                      : isHit === 2 
                      ? { x: [0, 5, -5, 5, -5, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] }
                      : {}
                  }
                  transition={{ duration: attackingPlayer === 2 ? 0.3 : 0.1 }}
                  className="relative w-full h-full min-h-[200px] md:max-h-[50vh] flex items-center justify-center"
                >
                  {p2 && getArtwork(p2) && (
                    <Image src={getArtwork(p2)!} alt={p2.name} fill className="object-contain drop-shadow-2xl animate-float-hero" priority />
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* Prep Stage */
            <motion.div 
              key="prep-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 px-4 py-8 overflow-y-auto md:overflow-visible scrollbar-none"
            >
              {/* Slot 1 */}
              <div className="flex-1 w-full max-w-xs flex flex-col gap-3">
                 <div className="flex items-center justify-between px-2">
                    <span className="font-black text-[10px] uppercase tracking-[0.4em] opacity-30">Slot 1</span>
                    <Badge variant="outline" className="text-[9px] border-primary/20 bg-primary/5 text-primary">PLAYER</Badge>
                 </div>
                <Button variant="outline" onClick={() => setActiveSelector(1)} className="h-12 glass border-foreground/10 rounded-2xl flex items-center justify-between px-6 hover:bg-foreground/5 overflow-hidden">
                  <span className="font-black uppercase text-xs tracking-tighter truncate text-black dark:text-white">
                    {p1 ? p1.name : t.select_pokemon}
                  </span>
                  <Search className="w-4 h-4 opacity-30 text-black dark:text-white" />
                </Button>
                <div className="glass aspect-square rounded-[2rem] border-dashed border-foreground/5 flex items-center justify-center overflow-hidden relative shadow-inner">
                  {p1 ? (
                    <Image src={getArtwork(p1)!} alt={p1.name} fill className="object-contain p-6 drop-shadow-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-10">
                       <Sparkles className="w-10 h-10" />
                    </div>
                  )}
                </div>
              </div>

              {/* VS & Action */}
              <div className="flex flex-col items-center gap-6 shrink-0 py-4 md:py-0">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl glass border-primary/20 flex items-center justify-center shadow-xl">
                   <span className="text-xl md:text-2xl font-black text-primary italic">VS</span>
                </div>
                <Button 
                  disabled={!p1 || !p2 || loading} 
                  onClick={simulateBattle} 
                  className="bg-primary text-black font-black px-12 h-14 rounded-full shadow-glow hover:scale-105 transition-all uppercase text-xs tracking-widest active:scale-95 disabled:opacity-20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.start_battle}
                </Button>
              </div>

              {/* Slot 2 */}
              <div className="flex-1 w-full max-w-xs flex flex-col gap-3">
                 <div className="flex items-center justify-between px-2">
                    <Badge variant="outline" className="text-[9px] border-secondary/20 bg-secondary/5 text-secondary">CPU</Badge>
                    <span className="font-black text-[10px] uppercase tracking-[0.4em] opacity-30">Slot 2</span>
                 </div>
                <Button variant="outline" onClick={() => setActiveSelector(2)} className="h-12 glass border-foreground/10 rounded-2xl flex items-center justify-between px-6 hover:bg-foreground/5 overflow-hidden">
                  <span className="font-black uppercase text-xs tracking-tighter truncate text-black dark:text-white">
                    {p2 ? p2.name : t.select_pokemon}
                  </span>
                  <Search className="w-4 h-4 opacity-30 text-black dark:text-white" />
                </Button>
                <div className="glass aspect-square rounded-[2rem] border-dashed border-foreground/5 flex items-center justify-center overflow-hidden relative shadow-inner">
                  {p2 ? (
                    <Image src={getArtwork(p2)!} alt={p2.name} fill className="object-contain p-6 drop-shadow-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-10">
                       <Sparkles className="w-10 h-10" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {battleLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
            <div className="glass rounded-[2.5rem] p-6 md:p-10 border-foreground/[0.03] shadow-xl overflow-hidden">
              <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-4 mb-6">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                {t.battle_logs}
              </h3>
              <div className="space-y-4 max-h-40 overflow-y-auto pr-2 scrollbar-none">
                {battleLogs.map((log, i) => (
                  <div key={i} className={cn("text-sm md:text-base font-bold pb-4 border-b border-foreground/5 flex gap-4", i === 0 ? "text-primary" : "opacity-30")}>
                    <span className="opacity-20 shrink-0">T.{log.turn}</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PokemonSelectorModal 
        isOpen={activeSelector !== null} onClose={() => setActiveSelector(null)} 
        onSelect={(name) => activeSelector && handleSelectPokemon(activeSelector, name)} 
        allPokemon={allPokemon} lang={lang} 
      />
    </div>
  );
}
