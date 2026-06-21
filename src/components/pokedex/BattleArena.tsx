
"use client";

import { useState, useEffect, useCallback } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, RotateCcw, Search, Zap, Heart, Trophy, Loader2, Sparkles } from "lucide-react";
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
    <div className="space-y-8 md:space-y-12">
      <div className="flex flex-col items-center gap-6 md:gap-8 text-center">
        <div className="flex items-center justify-center">
           <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-16 h-16 md:w-20 md:h-20 drop-shadow-2xl"
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
          <h2 className="text-3xl md:text-6xl font-headline font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent uppercase tracking-tighter">
            {t.battle_arena}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-sm md:text-lg px-4 italic">
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="w-full flex flex-row items-center justify-around gap-2 md:gap-4 relative z-10 px-2"
            >
              {/* Player 1 Battle View */}
              <div className="flex flex-col items-center gap-4 md:gap-8 relative flex-1 min-w-0">
                <div className="w-full max-w-[140px] md:max-w-none md:absolute md:-top-24 md:w-56 space-y-2 z-30">
                  <div className="flex justify-between text-[9px] md:text-[11px] font-black uppercase text-white drop-shadow-md tracking-widest bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                    <span className="truncate">{p1?.name}</span>
                    <span>{hp1} HP</span>
                  </div>
                  <Progress value={(hp1 / (maxHp1 || 1)) * 100} className="h-1.5 md:h-2.5 bg-white/20" />
                </div>
                <motion.div
                  animate={attackingPlayer === 1 ? { x: [0, 50, 0], scale: [1, 1.1, 1] } : attackingPlayer === 2 ? { x: [0, -5, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-[350px] md:h-[350px]"
                >
                  {p1 && getArtwork(p1) ? (
                    <Image 
                      src={getArtwork(p1)!} 
                      alt={p1.name} 
                      fill
                      className="object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] animate-float"
                    />
                  ) : <div className="w-full h-full" />}
                </motion.div>
                <div className="w-20 md:w-48 h-2 md:h-6 bg-black/20 rounded-[100%] blur-md" />
              </div>

              {/* VS Divider / Winner Controls */}
              <div className="flex flex-col items-center gap-4 z-20 shrink-0 min-w-[80px] md:min-w-[200px]">
                {winner ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-2 md:gap-4"
                  >
                    <div className="text-xl md:text-6xl font-black text-primary drop-shadow-2xl uppercase tracking-tighter animate-bounce text-center">
                      {t.winner}!
                    </div>
                    <Button 
                      onClick={resetBattle} 
                      className="bg-primary text-black rounded-full px-4 md:px-12 h-10 md:h-16 font-black uppercase text-[8px] md:text-sm tracking-[0.2em] hover:bg-primary/90 hover:scale-105 transition-all shadow-2xl shadow-primary/40 border-none"
                    >
                      <RotateCcw className="w-3 h-3 mr-2" />
                      <span className="truncate">{lang === 'es' ? 'NUEVA BATALLA' : 'NEW BATTLE'}</span>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-2xl md:text-8xl font-black text-primary drop-shadow-2xl my-2 md:my-0"
                  >
                    VS
                  </motion.div>
                )}
              </div>

              {/* Player 2 Battle View */}
              <div className="flex flex-col items-center gap-4 md:gap-8 relative flex-1 min-w-0">
                <div className="w-full max-w-[140px] md:max-w-none md:absolute md:-top-24 md:w-56 space-y-2 z-30">
                   <div className="flex justify-between text-[9px] md:text-[11px] font-black uppercase text-white drop-shadow-md tracking-widest bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                    <span className="truncate">{p2?.name}</span>
                    <span>{hp2} HP</span>
                  </div>
                  <Progress value={(hp2 / (maxHp2 || 1)) * 100} className="h-1.5 md:h-2.5 bg-white/20" />
                </div>
                <motion.div
                  animate={attackingPlayer === 2 ? { x: [0, -50, 0], scale: [1, 1.1, 1] } : attackingPlayer === 1 ? { x: [0, 5, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-[350px] md:h-[350px]"
                >
                  {p2 && getArtwork(p2) ? (
                    <Image 
                      src={getArtwork(p2)!} 
                      alt={p2.name} 
                      fill
                      className="object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] animate-float"
                    />
                  ) : <div className="w-full h-full" />}
                </motion.div>
                <div className="w-20 md:w-48 h-2 md:h-6 bg-black/20 rounded-[100%] blur-md" />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="prep-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col lg:flex-row items-center justify-around gap-6 md:gap-12 relative z-10"
            >
              {/* Player 1 Selection */}
              <div className="w-full max-lg:space-y-4">
                 <Button 
                    variant="outline" 
                    onClick={() => setActiveSelector(1)}
                    className="w-full h-14 md:h-16 glass border-primary/20 rounded-2xl md:rounded-3xl flex items-center justify-between px-6 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-black uppercase text-xs md:text-sm tracking-widest truncate max-w-[120px] md:max-w-none">{p1 ? p1.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p1 ? (
                    <motion.div 
                      layoutId="p1-card"
                      className={cn(
                        "glass p-4 md:p-10 rounded-[2rem] md:rounded-[4rem] border-primary/20 text-center relative mt-2 md:mt-4",
                        winner === 1 ? "ring-4 ring-primary bg-primary/10 shadow-2xl shadow-primary/20" : ""
                      )}
                    >
                      {winner === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black px-4 md:px-8 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl"><Trophy className="w-3 h-3 md:w-4 md:h-4"/> {t.winner}</div>}
                      <div className="relative w-24 h-24 sm:w-40 sm:h-40 md:w-56 md:h-56 mx-auto mb-4 md:mb-6">
                        {getArtwork(p1) ? (
                          <Image 
                            src={getArtwork(p1)!} 
                            alt={p1.name} 
                            fill
                            className="object-contain drop-shadow-2xl animate-float"
                          />
                        ) : <div className="w-full h-full" />}
                      </div>
                      <div className="space-y-2 md:space-y-4 max-w-[240px] mx-auto hidden md:block">
                        <StatBar label={t.hp} value={getStatValue(p1, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p1, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                        <StatBar label={t.speed} value={getStatValue(p1, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[150px] md:h-[400px] rounded-[2rem] md:rounded-[3rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-2 md:gap-4 mt-2 md:mt-4">
                      {loading && activeSelector === 1 ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <div className="font-black uppercase text-[8px] md:text-[10px] tracking-widest opacity-20">Slot 1</div>}
                    </div>
                  )}
              </div>

              {/* Combat Controls */}
              <div className="flex flex-col items-center gap-4 md:gap-8 py-4 md:py-10">
                <div className="w-16 h-16 md:w-36 md:h-36 rounded-full glass border-primary/30 flex items-center justify-center relative">
                   <span className="text-xl md:text-5xl font-black text-primary">VS</span>
                   <motion.div 
                     animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
                     transition={{ duration: 2, repeat: Infinity }}
                     className="absolute inset-0 bg-primary rounded-full blur-2xl md:blur-3xl -z-10"
                   />
                </div>
                
                <Button 
                  disabled={!p1 || !p2 || loading} 
                  onClick={simulateBattle}
                  className="w-full sm:w-64 h-14 md:h-20 rounded-2xl md:rounded-[2.5rem] bg-gradient-to-r from-primary via-secondary to-accent text-white font-black text-lg md:text-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter"
                >
                  {t.start_battle}
                </Button>

                {(p1 || p2) && (
                  <Button variant="ghost" onClick={resetBattle} className="text-muted-foreground hover:text-primary gap-2 font-black uppercase text-[8px] md:text-[10px] tracking-widest bg-foreground/5 px-4 md:px-6 h-8 md:h-10 rounded-full border border-foreground/5">
                    <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
                    {t.reset}
                  </Button>
                )}
              </div>

              {/* Player 2 Selection */}
              <div className="w-full max-lg:space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSelector(2)}
                    className="w-full h-14 md:h-16 glass border-secondary/20 rounded-2xl md:rounded-3xl flex items-center justify-between px-6 hover:bg-secondary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                      <span className="font-black uppercase text-xs md:text-sm tracking-widest truncate max-w-[120px] md:max-w-none">{p2 ? p2.name : t.select_pokemon}</span>
                    </div>
                  </Button>
                  
                  {p2 ? (
                    <motion.div 
                      layoutId="p2-card"
                      className={cn(
                        "glass p-4 md:p-10 rounded-[2rem] md:rounded-[4rem] border-secondary/20 text-center relative mt-2 md:mt-4",
                        winner === 2 ? "ring-4 ring-secondary bg-secondary/10 shadow-2xl shadow-secondary/20" : ""
                      )}
                    >
                      {winner === 2 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white px-4 md:px-8 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl"><Trophy className="w-3 h-3 md:w-4 md:h-4"/> {t.winner}</div>}
                      <div className="relative w-24 h-24 sm:w-40 sm:h-40 md:w-56 md:h-56 mx-auto mb-4 md:mb-6">
                        {getArtwork(p2) ? (
                          <Image 
                            src={getArtwork(p2)!} 
                            alt={p2.name} 
                            fill
                            className="object-contain drop-shadow-2xl animate-float"
                          />
                        ) : <div className="w-full h-full" />}
                      </div>
                      <div className="space-y-2 md:space-y-4 max-w-[240px] mx-auto hidden md:block">
                        <StatBar label={t.hp} value={getStatValue(p2, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                        <StatBar label={t.attack} value={getStatValue(p2, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                        <StatBar label={t.speed} value={getStatValue(p2, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="glass h-[150px] md:h-[400px] rounded-[2rem] md:rounded-[3rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-2 md:gap-4 mt-2 md:mt-4">
                      {loading && activeSelector === 2 ? <Loader2 className="w-8 h-8 animate-spin text-secondary" /> : <div className="font-black uppercase text-[8px] md:text-[10px] tracking-widest opacity-20">Slot 2</div>}
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
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 max-w-4xl mx-auto border-foreground/5 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
               <h3 className="text-xl md:text-2xl font-headline font-black uppercase tracking-tighter flex items-center gap-4">
                <Swords className="w-7 h-7 text-primary" />
                {t.battle_logs}
              </h3>
              {winner && (
                <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] md:text-sm tracking-widest animate-pulse bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                  {t.victory_for} {(winner === 1 ? p1?.name : p2?.name)?.toUpperCase()}!
                </div>
              )}
            </div>
            
            <div className="space-y-4 max-h-[250px] md:max-h-[350px] overflow-y-auto overflow-x-hidden pr-4 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
              {battleLogs.map((log, i) => (
                <div key={i} className={cn(
                  "text-sm font-bold border-b border-foreground/5 pb-4 last:border-0 flex items-center gap-4 transition-all duration-500",
                  i === 0 ? "text-primary scale-[1.02] origin-left" : "opacity-40"
                )}>
                  <div className="flex flex-col items-center justify-center shrink-0 w-12 h-12 rounded-xl bg-foreground/5 text-[9px] font-black text-muted-foreground">
                    <span className="opacity-50">{t.turn.charAt(0)}.</span>
                    <span>{log.turn}</span>
                  </div>
                  <span className="capitalize leading-tight">{log.message}</span>
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
    <div className="space-y-2">
      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2 opacity-60">
          {icon}
          {label}
        </div>
        <span>{value}</span>
      </div>
      <Progress value={(value / (max || 1)) * 100} className={cn("h-2 bg-foreground/5", color)} />
    </div>
  );
}
