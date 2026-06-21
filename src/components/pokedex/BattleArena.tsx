"use client";

import { useState } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, RotateCcw, Search, Zap, Heart, Shield, Trophy, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PokemonSelectorModal } from "./PokemonSelectorModal";

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

  const handleSelectPokemon = async (player: 1 | 2, name: string) => {
    setLoading(true);
    try {
      const details = await fetchPokemonDetails(name.toLowerCase());
      if (details) {
        if (player === 1) setP1(details);
        else setP2(details);
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
    
    let hp1 = getStatValue(p1, 'hp');
    let hp2 = getStatValue(p2, 'hp');
    
    const atk1 = getStatValue(p1, 'attack');
    const def1 = getStatValue(p1, 'defense');
    const spd1 = getStatValue(p1, 'speed');
    
    const atk2 = getStatValue(p2, 'attack');
    const def2 = getStatValue(p2, 'defense');
    const spd2 = getStatValue(p2, 'speed');
    
    let currentLogs: {turn: number, message: string}[] = [];
    let turnCount = 1;
    let turn = spd1 >= spd2 ? 1 : 2;
    
    while (hp1 > 0 && hp2 > 0 && turnCount < 20) {
      setAttackingPlayer(turn as 1 | 2);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (turn === 1) {
        const dmg = Math.max(10, Math.floor((atk1 * 2) / (def2 / 10 + 1)));
        hp2 -= dmg;
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p1.name.toUpperCase()} -> ${t.took_damage} ${dmg} ${t.damage} -> ${p2.name.toUpperCase()}` 
        }, ...currentLogs];
        turn = 2;
      } else {
        const dmg = Math.max(10, Math.floor((atk2 * 2) / (def1 / 10 + 1)));
        hp1 -= dmg;
        currentLogs = [{ 
          turn: turnCount, 
          message: `${p2.name.toUpperCase()} -> ${t.took_damage} ${dmg} ${t.damage} -> ${p1.name.toUpperCase()}` 
        }, ...currentLogs];
        turn = 1;
      }
      
      setBattleLogs([...currentLogs]);
      turnCount++;
    }
    
    setAttackingPlayer(null);
    setIsBattling(false);
    if (hp1 <= 0) setWinner(2);
    else if (hp2 <= 0) setWinner(1);
  };

  const getStatValue = (p: PokemonDetails, name: string) => p.stats.find(s => s.stat.name === name)?.base_stat || 0;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Player 1 Selection */}
        <div className="space-y-6">
          <Button 
            variant="outline" 
            disabled={isBattling}
            onClick={() => setActiveSelector(1)}
            className="w-full h-14 glass border-foreground/10 rounded-2xl flex items-center justify-between px-6 hover:bg-primary/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-bold capitalize">{p1 ? p1.name : t.select_pokemon}</span>
            </div>
            {p1 && <div className="text-[10px] font-black opacity-30">#{String(p1.id).padStart(3, '0')}</div>}
          </Button>
          
          <AnimatePresence mode="wait">
            {p1 ? (
              <motion.div 
                key={p1.id}
                animate={attackingPlayer === 1 ? { x: [0, 50, 0], scale: [1, 1.1, 1] } : attackingPlayer === 2 ? { x: [0, -10, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                transition={{ duration: 0.3 }}
                className={cn(
                  "glass p-6 rounded-[2.5rem] border-primary/20 relative overflow-hidden transition-all duration-300",
                  winner === 1 ? "ring-4 ring-primary bg-primary/5 shadow-2xl shadow-primary/20" : "",
                  attackingPlayer === 1 ? "border-primary shadow-xl" : ""
                )}
              >
                {winner === 1 && <div className="absolute top-4 left-4 bg-primary text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Trophy className="w-3 h-3"/> {t.winner}</div>}
                <div className="flex flex-col items-center text-center">
                  <Image 
                    src={p1.sprites.other["official-artwork"].front_default} 
                    alt={p1.name} 
                    width={180} 
                    height={180} 
                    className={cn(
                      "drop-shadow-2xl mb-4 transition-transform",
                      attackingPlayer === 1 ? "animate-pulse scale-110" : "animate-float"
                    )}
                  />
                  <h3 className="text-2xl font-black capitalize mb-6">{p1.name}</h3>
                  
                  <div className="w-full space-y-4">
                    <StatBar label={t.hp} value={getStatValue(p1, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                    <StatBar label={t.attack} value={getStatValue(p1, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                    <StatBar label={t.defense} value={getStatValue(p1, 'defense')} max={255} icon={<Shield className="w-3 h-3" />} color="bg-blue-500" />
                    <StatBar label={t.speed} value={getStatValue(p1, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass h-[400px] rounded-[2.5rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4">
                {loading && activeSelector === 1 ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <div className="font-black uppercase text-xs tracking-widest opacity-30">Slot 1 Empty</div>}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* VS Controls */}
        <div className="flex flex-col items-center justify-center gap-8 py-10 lg:py-40">
          <div className="w-24 h-24 rounded-full glass border-primary/30 flex items-center justify-center relative">
             <span className={cn("text-3xl font-black transition-all", isBattling ? "text-secondary animate-bounce scale-125" : "text-primary")}>{t.vs}</span>
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-primary rounded-full blur-xl -z-10"
             />
          </div>
          
          <Button 
            disabled={!p1 || !p2 || loading || isBattling} 
            onClick={simulateBattle}
            className="w-full max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            {isBattling ? t.thinking : t.start_battle}
          </Button>

          <Button 
            variant="ghost" 
            disabled={isBattling}
            onClick={() => { setP1(null); setP2(null); setWinner(null); setBattleLogs([]); }}
            className="text-muted-foreground hover:text-primary gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t.reset}
          </Button>
        </div>

        {/* Player 2 Selection */}
        <div className="space-y-6">
          <Button 
            variant="outline" 
            disabled={isBattling}
            onClick={() => setActiveSelector(2)}
            className="w-full h-14 glass border-foreground/10 rounded-2xl flex items-center justify-between px-6 hover:bg-secondary/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
              <span className="font-bold capitalize">{p2 ? p2.name : t.select_pokemon}</span>
            </div>
            {p2 && <div className="text-[10px] font-black opacity-30">#{String(p2.id).padStart(3, '0')}</div>}
          </Button>
          
          <AnimatePresence mode="wait">
            {p2 ? (
              <motion.div 
                key={p2.id}
                animate={attackingPlayer === 2 ? { x: [0, -50, 0], scale: [1, 1.1, 1] } : attackingPlayer === 1 ? { x: [0, 10, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
                transition={{ duration: 0.3 }}
                className={cn(
                  "glass p-6 rounded-[2.5rem] border-secondary/20 relative overflow-hidden transition-all duration-300",
                  winner === 2 ? "ring-4 ring-secondary bg-secondary/5 shadow-2xl shadow-secondary/20" : "",
                  attackingPlayer === 2 ? "border-secondary shadow-xl" : ""
                )}
              >
                {winner === 2 && <div className="absolute top-4 right-4 bg-secondary text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Trophy className="w-3 h-3"/> {t.winner}</div>}
                <div className="flex flex-col items-center text-center">
                  <Image 
                    src={p2.sprites.other["official-artwork"].front_default} 
                    alt={p2.name} 
                    width={180} 
                    height={180} 
                    className={cn(
                      "drop-shadow-2xl mb-4 transition-transform",
                      attackingPlayer === 2 ? "animate-pulse scale-110" : "animate-float"
                    )}
                  />
                  <h3 className="text-2xl font-black capitalize mb-6">{p2.name}</h3>
                  
                  <div className="w-full space-y-4">
                    <StatBar label={t.hp} value={getStatValue(p2, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                    <StatBar label={t.attack} value={getStatValue(p2, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                    <StatBar label={t.defense} value={getStatValue(p2, 'defense')} max={255} icon={<Shield className="w-3 h-3" />} color="bg-blue-500" />
                    <StatBar label={t.speed} value={getStatValue(p2, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass h-[400px] rounded-[2.5rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4">
                {loading && activeSelector === 2 ? <Loader2 className="w-10 h-10 animate-spin text-secondary" /> : <div className="font-black uppercase text-xs tracking-widest opacity-30">Slot 2 Empty</div>}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Battle Logs */}
      <AnimatePresence>
        {battleLogs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 max-w-4xl mx-auto border-foreground/5 shadow-inner"
          >
            <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
              <Swords className="w-5 h-5 text-primary" />
              {t.battle_logs}
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-foreground/10">
              {battleLogs.map((log, i) => (
                <div key={i} className="text-sm font-medium border-b border-foreground/5 pb-2 last:border-0 opacity-80 flex gap-4">
                  <span className="text-[10px] font-black opacity-30 w-8">{log.turn}</span>
                  <span className={cn(log.message.includes('->') ? "text-primary" : "")}>{log.message}</span>
                </div>
              ))}
              {!isBattling && winner && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="pt-4 text-center font-black text-2xl text-primary animate-pulse"
                >
                  {t.victory_for} {(winner === 1 ? p1?.name : p2?.name)?.toUpperCase()}!
                </motion.div>
              )}
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
      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-1.5 opacity-60">
          {icon}
          {label}
        </div>
        <span>{value}</span>
      </div>
      <Progress value={(value / max) * 100} className={cn("h-1.5 bg-foreground/5", color)} />
    </div>
  );
}
