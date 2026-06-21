
"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, RotateCcw, Search, Zap, Heart, Shield, Trophy, Loader2, Sparkles } from "lucide-react";
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
  const [battleLogs, setBattleLogs] = useState<{turn: number, message: string}[]>([]);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  
  const [hp1, setHp1] = useState(0);
  const [hp2, setHp2] = useState(0);
  const [maxHp1, setMaxHp1] = useState(0);
  const [maxHp2, setMaxHp2] = useState(0);

  const fireVictoryConfetti = useCallback(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
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
    
    while (currentHp1 > 0 && currentHp2 > 0 && turnCount < 30) {
      setAttackingPlayer(turn as 1 | 2);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (turn === 1) {
        const dmg = Math.max(10, Math.floor((atk1 * 2.5) / (def2 / 8 + 1)));
        currentHp2 = Math.max(0, currentHp2 - dmg);
        setHp2(currentHp2);
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p1.name.toUpperCase()} ${t.took_damage} ${dmg} ${t.damage} -> ${p2.name.toUpperCase()}` 
        }, ...currentLogs];
        turn = 2;
      } else {
        const dmg = Math.max(10, Math.floor((atk2 * 2.5) / (def1 / 8 + 1)));
        currentHp1 = Math.max(0, currentHp1 - dmg);
        setHp1(currentHp1);
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p2.name.toUpperCase()} ${t.took_damage} ${dmg} ${t.damage} -> ${p1.name.toUpperCase()}` 
        }, ...currentLogs];
        turn = 1;
      }
      
      setBattleLogs([...currentLogs]);
      turnCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setAttackingPlayer(null);
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
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-headline font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          {t.battle_arena}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
          {t.battle_desc}
        </p>
      </div>

      <div className="relative min-h-[600px] w-full glass rounded-[3rem] border-foreground/5 p-8 flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background to-transparent" />
        </div>

        <AnimatePresence mode="wait">
          {isBattling ? (
            <motion.div 
              key="battle-stage"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full h-full flex items-center justify-around gap-4 relative z-10"
            >
              <div className="flex flex-col items-center gap-8 relative">
                <div className="absolute -top-20 w-48 space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-white drop-shadow-md">
                    <span>{p1?.name}</span>
                    <span>{hp1} HP</span>
                  </div>
                  <Progress value={(hp1 / (maxHp1 || 1)) * 100} className="h-2 bg-white/20" />
                </div>
                <motion.div
                  animate={attackingPlayer === 1 ? { x: [0, 150, 0], scale: [1, 1.2, 1] } : attackingPlayer === 2 ? { x: [0, -20, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Image 
                    src={p1!.sprites.other["official-artwork"].front_default} 
                    alt={p1!.name} 
                    width={350} 
                    height={350} 
                    className="drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] animate-float"
                  />
                </motion.div>
                <div className="w-48 h-6 bg-black/20 rounded-[100%] blur-md" />
              </div>

              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-6xl font-black text-primary drop-shadow-2xl z-20"
              >
                VS
              </motion.div>

              <div className="flex flex-col items-center gap-8 relative">
                <div className="absolute -top-20 w-48 space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase text-white drop-shadow-md">
                    <span>{p2?.name}</span>
                    <span>{hp2} HP</span>
                  </div>
                  <Progress value={(hp2 / (maxHp2 || 1)) * 100} className="h-2 bg-white/20" />
                </div>
                <motion.div
                  animate={attackingPlayer === 2 ? { x: [0, -150, 0], scale: [1, 1.2, 1] } : attackingPlayer === 1 ? { x: [0, 20, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <Image 
                    src={p2!.sprites.other["official-artwork"].front_default} 
                    alt={p2!.name} 
                    width={350} 
                    height={350} 
                    className="drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] animate-float"
                  />
                </motion.div>
                <div className="w-48 h-6 bg-black/20 rounded-[100%] blur-md" />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="prep-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col lg:flex-row items-center justify-around gap-12 relative z-10"
            >
              <div className="w-full max-w-sm space-y-6">
                 <Button 
                    variant="outline" 
                    onClick={() => setActiveSelector(1)}
                    className="w-full h-16 glass border-primary/20 rounded-2xl flex items-center justify-between px-6 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-bold capitalize text-lg">{p1 ? p1.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p1 ? (
                    <motion.div 
                      layoutId="p1-card"
                      className={cn(
                        "glass p-8 rounded-[3rem] border-primary/20 text-center relative",
                        winner === 1 ? "ring-4 ring-primary bg-primary/10" : ""
                      )}
                    >
                      {winner === 1 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black px-6 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"><Trophy className="w-4 h-4"/> {t.winner}</div>}
                      <Image 
                        src={p1.sprites.other["official-artwork"].front_default} 
                        alt={p1.name} 
                        width={220} 
                        height={220} 
                        className="drop-shadow-2xl mb-6 mx-auto animate-float"
                      />
                      <div className="space-y-4">
                        <StatBar label={t.hp} value={getStatValue(p1, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p1, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                        <StatBar label={t.speed} value={getStatValue(p1, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[400px] rounded-[3rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4">
                      {loading && activeSelector === 1 ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <div className="font-black uppercase text-xs tracking-widest opacity-20">Slot 1</div>}
                    </div>
                  )}
              </div>

              <div className="flex flex-col items-center gap-8 py-10">
                <div className="w-32 h-32 rounded-full glass border-primary/30 flex items-center justify-center relative">
                   <span className="text-4xl font-black text-primary">VS</span>
                   <motion.div 
                     animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
                     transition={{ duration: 2, repeat: Infinity }}
                     className="absolute inset-0 bg-primary rounded-full blur-2xl -z-10"
                   />
                </div>
                
                <Button 
                  disabled={!p1 || !p2 || loading} 
                  onClick={simulateBattle}
                  className="w-56 h-16 rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent text-white font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform"
                >
                  {t.start_battle}
                </Button>

                {(p1 || p2) && (
                  <Button variant="ghost" onClick={resetBattle} className="text-muted-foreground hover:text-primary gap-2">
                    <RotateCcw className="w-4 h-4" />
                    {t.reset}
                  </Button>
                )}
              </div>

              <div className="w-full max-w-sm space-y-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSelector(2)}
                    className="w-full h-16 glass border-secondary/20 rounded-2xl flex items-center justify-between px-6 hover:bg-secondary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                      <span className="font-bold capitalize text-lg">{p2 ? p2.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p2 ? (
                    <motion.div 
                      layoutId="p2-card"
                      className={cn(
                        "glass p-8 rounded-[3rem] border-secondary/20 text-center relative",
                        winner === 2 ? "ring-4 ring-secondary bg-secondary/10" : ""
                      )}
                    >
                      {winner === 2 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white px-6 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl"><Trophy className="w-4 h-4"/> {t.winner}</div>}
                      <Image 
                        src={p2.sprites.other["official-artwork"].front_default} 
                        alt={p2.name} 
                        width={220} 
                        height={220} 
                        className="drop-shadow-2xl mb-6 mx-auto animate-float"
                      />
                      <div className="space-y-4">
                        <StatBar label={t.hp} value={getStatValue(p2, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p2, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                        <StatBar label={t.speed} value={getStatValue(p2, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[400px] rounded-[3rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4">
                      {loading && activeSelector === 2 ? <Loader2 className="w-10 h-10 animate-spin text-secondary" /> : <div className="font-black uppercase text-xs tracking-widest opacity-20">Slot 2</div>}
                    </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {battleLogs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] p-8 max-w-4xl mx-auto border-foreground/5"
          >
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <Swords className="w-6 h-6 text-primary" />
                {t.battle_logs}
              </h3>
              {winner && (
                <div className="flex items-center gap-2 text-primary font-black animate-pulse">
                  <Sparkles className="w-5 h-5" />
                  {t.victory_for} {(winner === 1 ? p1?.name : p2?.name)?.toUpperCase()}!
                </div>
              )}
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto overflow-x-hidden pr-4 scrollbar-thin scrollbar-thumb-foreground/10">
              {battleLogs.map((log, i) => (
                <div key={i} className={cn(
                  "text-sm font-bold border-b border-foreground/5 pb-3 last:border-0 flex items-center gap-4 transition-all",
                  i === 0 ? "text-primary scale-105 origin-left" : "opacity-50"
                )}>
                  <span className="text-[10px] font-black opacity-30 w-10 shrink-0">TURN {log.turn}</span>
                  <span className="capitalize truncate">{log.message}</span>
                </div>
              ))}
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

function StatBar({ label, value, max, icon, color }: { label: string, value: number, max: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-1.5 opacity-60">
          {icon}
          {label}
        </div>
        <span>{value}</span>
      </div>
      <Progress value={(value / (max || 1)) * 100} className={cn("h-1.5 bg-foreground/5", color)} />
    </div>
  );
}
