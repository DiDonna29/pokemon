"use client";

import { useState, useMemo, useEffect } from "react";
import { PokemonDetails, fetchPokemonDetails, PokemonSummary } from "@/lib/pokeapi";
import { Language, translations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Swords, RotateCcw, Search, Zap, Heart, Shield, Trophy, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BattleArenaProps {
  lang: Language;
  allPokemon: PokemonSummary[];
}

export function BattleArena({ lang, allPokemon }: BattleArenaProps) {
  const t = translations[lang];
  
  const [p1Search, setP1Search] = useState("");
  const [p2Search, setP2Search] = useState("");
  
  const [p1Suggestions, setP1Suggestions] = useState<PokemonSummary[]>([]);
  const [p2Suggestions, setP2Suggestions] = useState<PokemonSummary[]>([]);

  const [p1, setP1] = useState<PokemonDetails | null>(null);
  const [p2, setP2] = useState<PokemonDetails | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [battleLogs, setBattleLogs] = useState<{turn: number, message: string}[]>([]);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  // Filter suggestions for Player 1
  useEffect(() => {
    if (p1Search.length > 1) {
      const filtered = allPokemon.filter(p => p.name.includes(p1Search.toLowerCase())).slice(0, 5);
      setP1Suggestions(filtered);
    } else {
      setP1Suggestions([]);
    }
  }, [p1Search, allPokemon]);

  // Filter suggestions for Player 2
  useEffect(() => {
    if (p2Search.length > 1) {
      const filtered = allPokemon.filter(p => p.name.includes(p2Search.toLowerCase())).slice(0, 5);
      setP2Suggestions(filtered);
    } else {
      setP2Suggestions([]);
    }
  }, [p2Search, allPokemon]);

  const handleSelectPokemon = async (player: 1 | 2, name: string) => {
    setLoading(true);
    if (player === 1) {
      setP1Search(name);
      setP1Suggestions([]);
    } else {
      setP2Search(name);
      setP2Suggestions([]);
    }

    try {
      const details = await fetchPokemonDetails(name.toLowerCase());
      if (details) {
        if (player === 1) setP1(details);
        else setP2(details);
      }
    } catch (error) {
      console.error("Failed to fetch pokemon for battle", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateBattle = () => {
    if (!p1 || !p2) return;
    
    setWinner(null);
    setBattleLogs([]);
    
    let hp1 = p1.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
    let hp2 = p2.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
    
    const atk1 = p1.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
    const def1 = p1.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
    const spd1 = p1.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    
    const atk2 = p2.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
    const def2 = p2.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
    const spd2 = p2.stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
    
    let logs: {turn: number, message: string}[] = [];
    let turnCount = 1;
    
    let currentTurn = spd1 >= spd2 ? 1 : 2;
    
    while (hp1 > 0 && hp2 > 0 && turnCount < 50) {
      if (currentTurn === 1) {
        const dmg = Math.max(5, Math.floor((atk1 * 2) / (def2 / 20 + 1)));
        hp2 -= dmg;
        logs.push({ turn: turnCount, message: `${p1.name.toUpperCase()} ${t.turn} ${turnCount}: ${dmg} damage to ${p2.name.toUpperCase()}` });
        currentTurn = 2;
      } else {
        const dmg = Math.max(5, Math.floor((atk2 * 2) / (def1 / 20 + 1)));
        hp1 -= dmg;
        logs.push({ turn: turnCount, message: `${p2.name.toUpperCase()} ${t.turn} ${turnCount}: ${dmg} damage to ${p1.name.toUpperCase()}` });
        currentTurn = 1;
      }
      turnCount++;
    }
    
    setBattleLogs(logs);
    if (hp1 <= 0) setWinner(2);
    else if (hp2 <= 0) setWinner(1);
  };

  const getStat = (p: PokemonDetails, name: string) => p.stats.find(s => s.stat.name === name)?.base_stat || 0;

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
        <div className="space-y-6 relative">
          <div className="relative group">
            <Input 
              placeholder={t.select_pokemon} 
              value={p1Search} 
              onChange={(e) => setP1Search(e.target.value)}
              className="glass border-foreground/10 rounded-xl pl-10 h-12 focus:ring-primary/50"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
            
            <AnimatePresence>
              {p1Suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 glass rounded-2xl border-foreground/5 shadow-2xl overflow-hidden"
                >
                  {p1Suggestions.map(suggest => (
                    <button
                      key={suggest.name}
                      onClick={() => handleSelectPokemon(1, suggest.name)}
                      className="w-full px-5 py-3 text-left hover:bg-primary/10 hover:text-primary font-bold capitalize transition-colors border-b border-foreground/5 last:border-0"
                    >
                      {suggest.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence mode="wait">
            {p1 ? (
              <motion.div 
                key={p1.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "glass p-6 rounded-[2.5rem] border-primary/20 relative overflow-hidden",
                  winner === 1 ? "ring-4 ring-primary bg-primary/5 shadow-2xl shadow-primary/20" : ""
                )}
              >
                {winner === 1 && <div className="absolute top-4 left-4 bg-primary text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Trophy className="w-3 h-3"/> {t.winner}</div>}
                <div className="flex flex-col items-center text-center">
                  <Image 
                    src={p1.sprites.other["official-artwork"].front_default} 
                    alt={p1.name} 
                    width={180} 
                    height={180} 
                    className="drop-shadow-2xl mb-4 animate-float"
                  />
                  <h3 className="text-2xl font-black capitalize mb-6">{p1.name}</h3>
                  
                  <div className="w-full space-y-4">
                    <StatBar label={t.hp} value={getStat(p1, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                    <StatBar label={t.attack} value={getStat(p1, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                    <StatBar label={t.defense} value={getStat(p1, 'defense')} max={255} icon={<Shield className="w-3 h-3" />} color="bg-blue-500" />
                    <StatBar label={t.speed} value={getStat(p1, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass h-[400px] rounded-[2.5rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4">
                {loading ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <div className="font-black uppercase text-xs tracking-widest opacity-30">Slot 1 Empty</div>}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* VS Controls */}
        <div className="flex flex-col items-center justify-center gap-8 py-10 lg:py-40">
          <div className="w-24 h-24 rounded-full glass border-primary/30 flex items-center justify-center relative">
             <span className="text-3xl font-black text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">{t.vs}</span>
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-primary rounded-full blur-xl -z-10"
             />
          </div>
          
          <Button 
            disabled={!p1 || !p2 || loading} 
            onClick={simulateBattle}
            className="w-full max-w-[200px] h-14 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            {t.start_battle}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => { setP1(null); setP2(null); setWinner(null); setBattleLogs([]); setP1Search(""); setP2Search(""); }}
            className="text-muted-foreground hover:text-primary gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t.reset}
          </Button>
        </div>

        {/* Player 2 Selection */}
        <div className="space-y-6 relative">
          <div className="relative group">
            <Input 
              placeholder={t.select_pokemon} 
              value={p2Search} 
              onChange={(e) => setP2Search(e.target.value)}
              className="glass border-foreground/10 rounded-xl pl-10 h-12 focus:ring-secondary/50"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
            
            <AnimatePresence>
              {p2Suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 glass rounded-2xl border-foreground/5 shadow-2xl overflow-hidden"
                >
                  {p2Suggestions.map(suggest => (
                    <button
                      key={suggest.name}
                      onClick={() => handleSelectPokemon(2, suggest.name)}
                      className="w-full px-5 py-3 text-left hover:bg-secondary/10 hover:text-secondary font-bold capitalize transition-colors border-b border-foreground/5 last:border-0"
                    >
                      {suggest.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence mode="wait">
            {p2 ? (
              <motion.div 
                key={p2.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "glass p-6 rounded-[2.5rem] border-secondary/20 relative overflow-hidden",
                  winner === 2 ? "ring-4 ring-secondary bg-secondary/5 shadow-2xl shadow-secondary/20" : ""
                )}
              >
                {winner === 2 && <div className="absolute top-4 right-4 bg-secondary text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Trophy className="w-3 h-3"/> {t.winner}</div>}
                <div className="flex flex-col items-center text-center">
                  <Image 
                    src={p2.sprites.other["official-artwork"].front_default} 
                    alt={p2.name} 
                    width={180} 
                    height={180} 
                    className="drop-shadow-2xl mb-4 animate-float"
                  />
                  <h3 className="text-2xl font-black capitalize mb-6">{p2.name}</h3>
                  
                  <div className="w-full space-y-4">
                    <StatBar label={t.hp} value={getStat(p2, 'hp')} max={255} icon={<Heart className="w-3 h-3" />} color="bg-red-500" />
                    <StatBar label={t.attack} value={getStat(p2, 'attack')} max={255} icon={<Swords className="w-3 h-3" />} color="bg-orange-500" />
                    <StatBar label={t.defense} value={getStat(p2, 'defense')} max={255} icon={<Shield className="w-3 h-3" />} color="bg-blue-500" />
                    <StatBar label={t.speed} value={getStat(p2, 'speed')} max={255} icon={<Zap className="w-3 h-3" />} color="bg-yellow-500" />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass h-[400px] rounded-[2.5rem] border-dashed border-foreground/10 flex flex-col items-center justify-center text-muted-foreground gap-4">
                {loading ? <Loader2 className="w-10 h-10 animate-spin text-secondary" /> : <div className="font-black uppercase text-xs tracking-widest opacity-30">Slot 2 Empty</div>}
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
                  <span>{log.message}</span>
                </div>
              ))}
              <div className="pt-4 text-center font-black text-xl text-primary animate-pulse">
                {t.victory_for} {winner === 1 ? p1?.name : p2?.name}!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
