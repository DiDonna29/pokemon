
"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, RotateCcw, Search, Zap, Heart, Loader2, Sparkles } from "lucide-react";
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
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

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
      
      const dmgLabel = lang === 'es' ? 'DAÑO' : 'DMG';

      if (turn === 1) {
        const dmg = Math.max(10, Math.floor((atk1 * 2.5) / (def2 / 8 + 1)));
        currentHp2 = Math.max(0, currentHp2 - dmg);
        setHp2(currentHp2);
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p1.name.toUpperCase()} -> ${dmg} ${dmgLabel} -> ${p2.name.toUpperCase()}` 
        }, ...currentLogs];
        turn = 2;
      } else {
        const dmg = Math.max(10, Math.floor((atk2 * 2.5) / (def1 / 8 + 1)));
        currentHp1 = Math.max(0, currentHp1 - dmg);
        setHp1(currentHp1);
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p2.name.toUpperCase()} -> ${dmg} ${dmgLabel} -> ${p1.name.toUpperCase()}` 
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

  const getArtwork = (p: PokemonDetails) => {
    return p.sprites.other["official-artwork"].front_default || p.sprites.front_default || null;
  };

  return (
    <div className="space-y-8 md:space-y-12 max-w-7xl mx-auto px-4">
      <div className="flex flex-col items-center gap-6 md:gap-8 text-center">
        <div className="flex items-center justify-center">
           <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-16 h-16 md:w-24 md:h-24 drop-shadow-2xl"
          >
            <Image 
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
              alt="Pixel Ball Game Icon"
              fill
              className="object-contain"
              style={{ imageRendering: 'pixelated' }}
              priority
            />
          </motion.div>
        </div>

        <div className="space-y-2 md:space-y-4">
          <h2 className="text-3xl md:text-7xl font-headline font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent uppercase tracking-tighter">
            {t.battle_arena}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-sm md:text-xl px-4 italic opacity-80">
            {t.battle_desc}
          </p>
        </div>
      </div>

      <div className="relative min-h-[400px] md:min-h-[650px] w-full glass rounded-[2.5rem] md:rounded-[4rem] border-foreground/5 p-4 md:p-12 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px]" />
        </div>

        <AnimatePresence mode="wait">
          {isBattling || attackingPlayer !== null || (winner !== null && battleLogs.length > 0) ? (
            <motion.div 
              key="battle-stage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full h-full flex flex-row items-center justify-center gap-2 md:gap-12 relative z-10"
            >
              <div className="flex flex-col items-center gap-4 relative flex-1 min-w-0">
                <div className="w-full max-w-[140px] md:max-w-[280px] space-y-2 z-30">
                  <div className="flex justify-between text-[9px] md:text-sm font-black uppercase text-white drop-shadow-md tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="truncate">{p1?.name}</span>
                    <span>{hp1} HP</span>
                  </div>
                  <Progress value={(hp1 / (maxHp1 || 1)) * 100} className="h-1.5 md:h-3 bg-white/20" />
                </div>
                <motion.div
                  animate={attackingPlayer === 1 ? { x: [0, 60, 0], scale: [1, 1.1, 1] } : attackingPlayer === 2 ? { x: [0, -10, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative w-28 h-28 sm:w-48 sm:h-48 md:w-[350px] md:h-[350px]"
                >
                  {p1 && getArtwork(p1) ? (
                    <Image src={getArtwork(p1)!} alt={p1.name} fill className="object-contain drop-shadow-2xl animate-float" />
                  ) : <div className="w-full h-full" />}
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-4 z-20 shrink-0 min-w-[100px] md:min-w-[200px]">
                {winner ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="text-xl md:text-5xl font-black text-primary drop-shadow-2xl uppercase tracking-tighter animate-bounce text-center">
                      {t.winner}
                    </div>
                    <Button 
                      onClick={resetBattle} 
                      className="bg-primary text-black rounded-full px-6 md:px-10 h-10 md:h-14 font-black uppercase text-[10px] md:text-xs tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/40 border-none"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {lang === 'es' ? 'NUEVA BATALLA' : 'NEW BATTLE'}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-3xl md:text-9xl font-black text-primary drop-shadow-2xl">
                    VS
                  </motion.div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 relative flex-1 min-w-0">
                <div className="w-full max-w-[140px] md:max-w-[280px] space-y-2 z-30">
                   <div className="flex justify-between text-[9px] md:text-sm font-black uppercase text-white drop-shadow-md tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="truncate">{p2?.name}</span>
                    <span>{hp2} HP</span>
                  </div>
                  <Progress value={(hp2 / (maxHp2 || 1)) * 100} className="h-1.5 md:h-3 bg-white/20" />
                </div>
                <motion.div
                  animate={attackingPlayer === 2 ? { x: [0, -60, 0], scale: [1, 1.1, 1] } : attackingPlayer === 1 ? { x: [0, 10, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative w-28 h-28 sm:w-48 sm:h-48 md:w-[350px] md:h-[350px]"
                >
                  {p2 && getArtwork(p2) ? (
                    <Image src={getArtwork(p2)!} alt={p2.name} fill className="object-contain drop-shadow-2xl animate-float" />
                  ) : <div className="w-full h-full" />}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="prep-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-16 relative z-10 px-4"
            >
              <div className="w-full lg:flex-1 max-w-[450px] flex flex-col gap-4">
                 <Button 
                    variant="outline" onClick={() => setActiveSelector(1)}
                    className="w-full h-14 md:h-20 glass border-foreground/10 rounded-3xl flex items-center justify-between px-6 hover:bg-foreground/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <Search className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                      <span className="font-black uppercase text-sm md:text-lg tracking-widest truncate text-black dark:text-white">{p1 ? p1.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p1 ? (
                    <motion.div layoutId="p1-card" className="glass p-6 md:p-10 rounded-[3rem] border-foreground/5 text-center relative flex-1 min-h-[220px] flex flex-col justify-center">
                      <div className="relative w-32 h-32 md:w-52 md:h-52 mx-auto mb-6">
                        <Image src={getArtwork(p1)!} alt={p1.name} fill className="object-contain drop-shadow-2xl animate-float" />
                      </div>
                      <div className="space-y-4 max-w-[280px] mx-auto hidden md:block">
                        <StatBar label={t.hp} value={getStatValue(p1, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p1, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[150px] md:h-[400px] rounded-[3rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-50 overflow-hidden w-full">
                      {loading && activeSelector === 1 ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <div className="font-black uppercase text-xs tracking-widest">SLOT 01</div>}
                    </div>
                  )}
              </div>

              <div className="flex flex-col items-center gap-6 md:gap-8 shrink-0 min-w-[80px]">
                <div className="w-16 h-16 md:w-32 md:h-32 rounded-full glass border-primary/30 flex items-center justify-center relative">
                   <span className="text-xl md:text-5xl font-black text-primary">VS</span>
                   <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-primary rounded-full blur-3xl -z-10" />
                </div>
                
                <Button 
                  disabled={!p1 || !p2 || loading} onClick={simulateBattle}
                  className="w-full sm:w-64 h-14 md:h-20 rounded-2xl bg-primary text-black font-black text-lg md:text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter border-none"
                >
                  {t.start_battle}
                </Button>

                {(p1 || p2) && (
                  <Button variant="ghost" onClick={resetBattle} className="text-muted-foreground hover:text-primary font-black uppercase text-xs tracking-widest h-10 rounded-full border border-foreground/5 bg-foreground/5 px-8">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t.reset}
                  </Button>
                )}
              </div>

              <div className="w-full lg:flex-1 max-w-[450px] flex flex-col gap-4">
                  <Button 
                    variant="outline" onClick={() => setActiveSelector(2)}
                    className="w-full h-14 md:h-20 glass border-foreground/10 rounded-3xl flex items-center justify-between px-6 hover:bg-foreground/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <Search className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                      <span className="font-black uppercase text-sm md:text-lg tracking-widest truncate text-black dark:text-white">{p2 ? p2.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p2 ? (
                    <motion.div layoutId="p2-card" className="glass p-6 md:p-10 rounded-[3rem] border-foreground/5 text-center relative flex-1 min-h-[220px] flex flex-col justify-center">
                      <div className="relative w-32 h-32 md:w-52 md:h-52 mx-auto mb-6">
                        <Image src={getArtwork(p2)!} alt={p2.name} fill className="object-contain drop-shadow-2xl animate-float" />
                      </div>
                      <div className="space-y-4 max-w-[280px] mx-auto hidden md:block">
                        <StatBar label={t.hp} value={getStatValue(p2, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p2, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[150px] md:h-[400px] rounded-[3rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-50 overflow-hidden w-full">
                      {loading && activeSelector === 2 ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <div className="font-black uppercase text-xs tracking-widest">SLOT 02</div>}
                    </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {battleLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto w-full">
            <div className="glass rounded-[3rem] p-8 md:p-10 border-foreground/5 shadow-2xl flex flex-col">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                <h3 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter flex items-center gap-4">
                  <Swords className="w-8 h-8 text-primary" />
                  {t.battle_logs}
                </h3>
                {winner && (
                  <div className="flex items-center gap-4 text-black font-black uppercase text-xs md:text-sm tracking-widest bg-primary px-6 py-2 rounded-full shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    {t.victory_for} {(winner === 1 ? p1?.name : p2?.name)?.toUpperCase()}!
                  </div>
                )}
              </div>
              
              <div className="space-y-6 max-h-[350px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-foreground/10">
                {battleLogs.map((log, i) => (
                  <div key={i} className={cn(
                    "text-sm md:text-lg font-bold border-b border-foreground/5 pb-4 last:border-0 flex items-center gap-4",
                    i === 0 ? "text-primary" : "opacity-40"
                  )}>
                    <div className="flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-foreground/5 text-[10px] font-black">
                      <span className="opacity-50">{t.turn.charAt(0)}.</span>
                      <span>{log.turn}</span>
                    </div>
                    <span className="capitalize leading-tight">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PokemonSelectorModal isOpen={activeSelector !== null} onClose={() => setActiveSelector(null)} onSelect={(name) => activeSelector && handleSelectPokemon(activeSelector, name)} allPokemon={allPokemon} lang={lang} />
    </div>
  );
}

function StatBar({ label, value, max, icon, color }: { label: string, value: number, max: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2 opacity-70">
          {icon}
          {label}
        </div>
        <span>{value}</span>
      </div>
      <Progress value={(value / (max || 1)) * 100} className={cn("h-2 bg-foreground/5", color)} />
    </div>
  );
}
