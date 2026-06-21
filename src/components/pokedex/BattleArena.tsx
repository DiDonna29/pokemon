"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
    
    while (currentHp1 > 0 && currentHp2 > 0 && turnCount < 40) {
      setAttackingPlayer(turn as 1 | 2);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const dmgLabel = lang === 'es' ? 'DAÑO' : 'DMG';

      if (turn === 1) {
        const dmg = Math.max(12, Math.floor((atk1 * 3) / (def2 / 10 + 1)));
        currentHp2 = Math.max(0, currentHp2 - dmg);
        setHp2(currentHp2);
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p1.name.toUpperCase()} -> ${dmg} ${dmgLabel} -> ${p2.name.toUpperCase()}` 
        }, ...currentLogs];
        turn = 2;
      } else {
        const dmg = Math.max(12, Math.floor((atk2 * 3) / (def1 / 10 + 1)));
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
    
    await new Promise(resolve => setTimeout(resolve, 400));
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
    <div className="space-y-16 md:space-y-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-center gap-10 text-center">
        <div className="flex items-center justify-center relative">
           <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
          >
            <Image 
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
              alt="Battle Arena Icon"
              fill
              className="object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </motion.div>
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-primary/20 rounded-full blur-3xl -z-10" />
        </div>

        <div className="space-y-6">
          <h2 className="text-5xl md:text-9xl font-headline font-black uppercase tracking-tighter leading-none">
            {t.battle_arena}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg md:text-2xl px-4 italic opacity-60 leading-relaxed">
            {t.battle_desc}
          </p>
        </div>
      </div>

      <div className="relative min-h-[500px] md:min-h-[750px] w-full glass rounded-[4rem] border-foreground/[0.03] p-6 md:p-16 flex flex-col items-center justify-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-full blur-[150px]" />
        </div>

        <AnimatePresence mode="wait">
          {isBattling || attackingPlayer !== null || (winner !== null && battleLogs.length > 0) ? (
            <motion.div 
              key="battle-stage"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -30 }}
              className="w-full h-full flex flex-row items-center justify-center gap-4 md:gap-20 relative z-10"
            >
              {/* Player 1 */}
              <div className="flex flex-col items-center gap-8 relative flex-1 min-w-0">
                <div className="w-full max-w-[180px] md:max-w-[320px] space-y-4 z-30">
                  <div className="flex justify-between items-center text-[10px] md:text-base font-black uppercase text-white tracking-[0.2em] glass bg-black/60 px-5 py-2.5 rounded-full backdrop-blur-xl border-white/20">
                    <span className="truncate">{p1?.name}</span>
                    <span className="text-primary">{hp1} HP</span>
                  </div>
                  <Progress value={(hp1 / (maxHp1 || 1)) * 100} className="h-2.5 md:h-4 bg-white/10 rounded-full" />
                </div>
                <motion.div
                  animate={attackingPlayer === 1 ? { x: [0, 80, 0], scale: [1, 1.15, 1] } : attackingPlayer === 2 ? { x: [0, -15, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative w-36 h-36 sm:w-60 sm:h-60 md:w-[450px] md:h-[450px]"
                >
                  {p1 && getArtwork(p1) ? (
                    <Image src={getArtwork(p1)!} alt={p1.name} fill className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)] animate-float-hero" />
                  ) : <div className="w-full h-full" />}
                </motion.div>
              </div>

              {/* VS / Winner */}
              <div className="flex flex-col items-center gap-10 z-20 shrink-0 min-w-[120px] md:min-w-[250px]">
                {winner ? (
                  <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="flex flex-col items-center gap-8">
                    <div className="text-3xl md:text-7xl font-black text-primary drop-shadow-[0_0_30px_rgba(var(--primary),0.5)] uppercase tracking-tighter animate-bounce text-center leading-none">
                      {t.winner}
                    </div>
                    <Button 
                      onClick={resetBattle} 
                      className="bg-primary text-black rounded-3xl px-10 md:px-14 h-12 md:h-16 font-black uppercase text-xs md:text-sm tracking-[0.3em] hover:scale-110 transition-all shadow-2xl shadow-primary/40 border-none active:scale-95"
                    >
                      <RotateCcw className="w-5 h-5 mr-3" />
                      {lang === 'es' ? 'OTRA BATALLA' : 'NEW BATTLE'}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
                    className="text-5xl md:text-[10rem] font-black text-white/10 italic select-none"
                  >
                    VS
                  </motion.div>
                )}
              </div>

              {/* Player 2 */}
              <div className="flex flex-col items-center gap-8 relative flex-1 min-w-0">
                <div className="w-full max-w-[180px] md:max-w-[320px] space-y-4 z-30">
                   <div className="flex justify-between items-center text-[10px] md:text-base font-black uppercase text-white tracking-[0.2em] glass bg-black/60 px-5 py-2.5 rounded-full backdrop-blur-xl border-white/20">
                    <span className="truncate">{p2?.name}</span>
                    <span className="text-secondary">{hp2} HP</span>
                  </div>
                  <Progress value={(hp2 / (maxHp2 || 1)) * 100} className="h-2.5 md:h-4 bg-white/10 rounded-full" />
                </div>
                <motion.div
                  animate={attackingPlayer === 2 ? { x: [0, -80, 0], scale: [1, 1.15, 1] } : attackingPlayer === 1 ? { x: [0, 15, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative w-36 h-36 sm:w-60 sm:h-60 md:w-[450px] md:h-[450px]"
                >
                  {p2 && getArtwork(p2) ? (
                    <Image src={getArtwork(p2)!} alt={p2.name} fill className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)] animate-float-hero" />
                  ) : <div className="w-full h-full" />}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="prep-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-24 relative z-10 px-6"
            >
              {/* Slot 1 Selection */}
              <div className="w-full lg:flex-1 max-w-[500px] flex flex-col gap-6">
                 <Button 
                    variant="outline" onClick={() => setActiveSelector(1)}
                    className="w-full h-20 glass border-foreground/10 rounded-[2rem] flex items-center justify-between px-8 hover:bg-foreground/5 transition-all group active:scale-95"
                  >
                    <div className="flex items-center gap-5">
                      <Search className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-black uppercase text-base md:text-xl tracking-[0.15em] truncate text-foreground">{p1 ? p1.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p1 ? (
                    <motion.div layoutId="p1-card" className="glass p-10 rounded-[4rem] border-foreground/[0.05] text-center relative flex-1 min-h-[300px] flex flex-col justify-center group overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[80px]" />
                      <div className="relative w-40 h-40 md:w-64 md:h-64 mx-auto mb-10">
                        <Image src={getArtwork(p1)!} alt={p1.name} fill className="object-contain drop-shadow-2xl animate-float-hero" />
                      </div>
                      <div className="space-y-6 max-w-[320px] mx-auto hidden md:block relative z-10">
                        <StatBar label={t.hp} value={getStatValue(p1, 'hp')} max={255} icon={<Heart className="w-3.5 h-3.5" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p1, 'attack')} max={255} icon={<Swords className="w-3.5 h-3.5" />} color="bg-orange-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[200px] md:h-[450px] rounded-[4rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-6 opacity-40 overflow-hidden w-full group">
                      {loading && activeSelector === 1 ? <Loader2 className="w-12 h-12 animate-spin text-primary" /> : <div className="font-black uppercase text-sm tracking-[0.4em] group-hover:tracking-[0.6em] transition-all">SLOT 01</div>}
                    </div>
                  )}
              </div>

              {/* Action Center */}
              <div className="flex flex-col items-center gap-10 md:gap-14 shrink-0 min-w-[120px]">
                <div className="w-24 h-24 md:w-40 md:h-40 rounded-[2.5rem] glass border-primary/20 flex items-center justify-center relative shadow-2xl">
                   <span className="text-3xl md:text-7xl font-black text-primary italic">VS</span>
                   <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-primary/30 rounded-full blur-[80px] -z-10" />
                </div>
                
                <Button 
                  disabled={!p1 || !p2 || loading} onClick={simulateBattle}
                  className="w-full sm:w-72 h-16 md:h-24 rounded-3xl bg-primary text-black font-black text-xl md:text-4xl shadow-[0_25px_50px_-12px_rgba(var(--primary),0.5)] hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter border-none"
                >
                  {t.start_battle}
                </Button>

                {(p1 || p2) && (
                  <Button variant="ghost" onClick={resetBattle} className="text-muted-foreground hover:text-primary font-black uppercase text-xs tracking-[0.3em] h-12 rounded-full glass border-white/10 px-10">
                    <RotateCcw className="w-4 h-4 mr-3" />
                    {t.reset}
                  </Button>
                )}
              </div>

              {/* Slot 2 Selection */}
              <div className="w-full lg:flex-1 max-w-[500px] flex flex-col gap-6">
                  <Button 
                    variant="outline" onClick={() => setActiveSelector(2)}
                    className="w-full h-20 glass border-foreground/10 rounded-[2rem] flex items-center justify-between px-8 hover:bg-foreground/5 transition-all group active:scale-95"
                  >
                    <div className="flex items-center gap-5">
                      <Search className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-black uppercase text-base md:text-xl tracking-[0.15em] truncate text-foreground">{p2 ? p2.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p2 ? (
                    <motion.div layoutId="p2-card" className="glass p-10 rounded-[4rem] border-foreground/[0.05] text-center relative flex-1 min-h-[300px] flex flex-col justify-center group overflow-hidden">
                      <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[80px]" />
                      <div className="relative w-40 h-40 md:w-64 md:h-64 mx-auto mb-10">
                        <Image src={getArtwork(p2)!} alt={p2.name} fill className="object-contain drop-shadow-2xl animate-float-hero" />
                      </div>
                      <div className="space-y-6 max-w-[320px] mx-auto hidden md:block relative z-10">
                        <StatBar label={t.hp} value={getStatValue(p2, 'hp')} max={255} icon={<Heart className="w-3.5 h-3.5" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p2, 'attack')} max={255} icon={<Swords className="w-3.5 h-3.5" />} color="bg-orange-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[200px] md:h-[450px] rounded-[4rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-6 opacity-40 overflow-hidden w-full group">
                      {loading && activeSelector === 2 ? <Loader2 className="w-12 h-12 animate-spin text-primary" /> : <div className="font-black uppercase text-sm tracking-[0.4em] group-hover:tracking-[0.6em] transition-all">SLOT 02</div>}
                    </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {battleLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto w-full pb-20">
            <div className="glass rounded-[4rem] p-10 md:p-16 border-foreground/[0.03] shadow-3xl flex flex-col overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-5 select-none pointer-events-none">
                <Swords className="w-40 h-40" />
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-16 relative z-10">
                <h3 className="text-3xl md:text-5xl font-headline font-black uppercase tracking-tighter flex items-center gap-6">
                  <span className="w-3 h-12 bg-primary rounded-full" />
                  {t.battle_logs}
                </h3>
                {winner && (
                  <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-5 text-black font-black uppercase text-xs md:text-sm tracking-[0.2em] bg-primary px-10 py-3.5 rounded-full shadow-2xl">
                    <Sparkles className="w-5 h-5" />
                    {t.victory_for} {(winner === 1 ? p1?.name : p2?.name)?.toUpperCase()}!
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-6 scrollbar-thin scrollbar-thumb-foreground/10 relative z-10">
                {battleLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className={cn(
                      "text-base md:text-xl font-bold border-b border-foreground/[0.03] pb-6 last:border-0 flex items-center gap-6",
                      i === 0 ? "text-primary scale-105 origin-left" : "opacity-30"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center shrink-0 w-12 h-12 rounded-2xl bg-foreground/[0.05] text-[10px] font-black">
                      <span className="opacity-40">{t.turn.charAt(0)}.</span>
                      <span>{log.turn}</span>
                    </div>
                    <span className="capitalize leading-tight tracking-tight">{log.message}</span>
                  </motion.div>
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
    <div className="space-y-3">
      <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
        <div className="flex items-center gap-3 opacity-60">
          {icon}
          {label}
        </div>
        <span className="text-foreground">{value}</span>
      </div>
      <Progress value={(value / (max || 1)) * 100} className={cn("h-2.5 bg-foreground/5 rounded-full", color)} />
    </div>
  );
}