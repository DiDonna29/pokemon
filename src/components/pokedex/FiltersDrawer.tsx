
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RotateCcw, X, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Language, translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Image from "next/image";

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

interface FiltersDrawerProps {
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedWeight: string | null;
  setSelectedWeight: (weight: string | null) => void;
  selectedHeight: string | null;
  setSelectedHeight: (height: string | null) => void;
  onClear: () => void;
  lang: Language;
}

export function FiltersDrawer({ 
  selectedTypes, setSelectedTypes, 
  selectedWeight, setSelectedWeight,
  selectedHeight, setSelectedHeight,
  onClear,
  lang
}: FiltersDrawerProps) {
  const t = translations[lang];
  const activeCount = selectedTypes.length + (selectedWeight ? 1 : 0) + (selectedHeight ? 1 : 0);

  const WEIGHTS = [
    { label: t.light_lt_10kg, value: "light" },
    { label: t.medium_10_100kg, value: "medium" },
    { label: t.heavy_gt_100kg, value: "heavy" },
  ];

  const HEIGHTS = [
    { label: t.small_lt_1m, value: "small" },
    { label: t.medium_1_2m, value: "medium" },
    { label: t.large_gt_2m, value: "large" },
  ];

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "relative glass border-foreground/10 hover:bg-foreground/5 transition-all duration-300 gap-2 h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest",
            activeCount > 0 ? "border-primary/40 bg-primary/5" : "text-black dark:text-white"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{t.filters}</span>
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black rounded-full text-[10px] flex items-center justify-center font-black shadow-lg">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="glass w-full sm:max-w-md border-l border-foreground/10 p-0 flex flex-col [&>button]:hidden">
        {/* Hidden titles for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>{t.filters}</SheetTitle>
          <SheetDescription>{t.filters_desc}</SheetDescription>
        </SheetHeader>

        {/* Fixed Header */}
        <div className="shrink-0 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-32 h-10">
              <Image 
                src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
                alt="Pokemon Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClear} 
                className="text-primary gap-2 h-10 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 rounded-xl"
              >
                <RotateCcw className="w-4 h-4" />
                {t.reset}
              </Button>
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl glass border-foreground/5 text-muted-foreground hover:text-foreground transition-all"
                >
                  <X className="w-5 h-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
          <p className="text-muted-foreground font-medium italic text-xs md:text-sm text-center opacity-60">
            {t.filters_desc}
          </p>
        </div>
        
        <Separator className="bg-foreground/5" />

        <ScrollArea className="flex-1 px-6 md:px-8 py-6">
          <div className="space-y-12 pb-32">
            {/* Types section */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <h3 className="font-headline text-[10px] font-black text-white bg-white/10 px-6 py-2 rounded-full uppercase tracking-[0.3em] inline-block">
                  {t.pokemon_types}
                </h3>
              </div>
              <div className="space-y-3">
                {TYPES.map(type => (
                  <div 
                    key={type} 
                    className={cn(
                      "flex items-center space-x-4 glass bg-black/40 p-4 rounded-3xl border-foreground/5 hover:border-primary/30 transition-all cursor-pointer group",
                      selectedTypes.includes(type) && "border-primary/40 bg-primary/10"
                    )}
                    onClick={() => toggleType(type)}
                  >
                    <Checkbox 
                      id={`type-${type}`} 
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      className="border-foreground/30 rounded-full w-6 h-6 data-[state=checked]:bg-primary data-[state=checked]:text-black transition-all"
                    />
                    <Label htmlFor={`type-${type}`} className="capitalize text-sm font-black tracking-widest cursor-pointer group-hover:text-primary transition-colors flex-1 text-white">
                      {t[type as keyof typeof t] || type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight section */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <h3 className="font-headline text-[10px] font-black text-white bg-white/10 px-6 py-2 rounded-full uppercase tracking-[0.3em] inline-block">
                  {t.weight_class}
                </h3>
              </div>
              <div className="space-y-3">
                {WEIGHTS.map(w => (
                  <div 
                    key={w.value} 
                    className={cn(
                      "flex items-center space-x-4 glass bg-black/40 p-5 rounded-3xl border-foreground/5 hover:border-primary/30 transition-all cursor-pointer group",
                      selectedWeight === w.value && "border-primary/40 bg-primary/10"
                    )}
                    onClick={() => setSelectedWeight(selectedWeight === w.value ? null : w.value)}
                  >
                    <Checkbox 
                      id={`weight-${w.value}`} 
                      checked={selectedWeight === w.value}
                      onCheckedChange={() => setSelectedWeight(selectedWeight === w.value ? null : w.value)}
                      className="border-foreground/30 rounded-full w-6 h-6 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor={`weight-${w.value}`} className="text-sm font-black tracking-widest cursor-pointer group-hover:text-primary flex-1 text-white">
                      {w.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Height section */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <h3 className="font-headline text-[10px] font-black text-white bg-white/10 px-6 py-2 rounded-full uppercase tracking-[0.3em] inline-block">
                  {t.height_class}
                </h3>
              </div>
              <div className="space-y-3">
                {HEIGHTS.map(h => (
                  <div 
                    key={h.value} 
                    className={cn(
                      "flex items-center space-x-4 glass bg-black/40 p-5 rounded-3xl border-foreground/5 hover:border-primary/30 transition-all cursor-pointer group",
                      selectedHeight === h.value && "border-primary/40 bg-primary/10"
                    )}
                    onClick={() => setSelectedHeight(selectedHeight === h.value ? null : h.value)}
                  >
                    <Checkbox 
                      id={`height-${h.value}`} 
                      checked={selectedHeight === h.value}
                      onCheckedChange={() => setSelectedHeight(selectedHeight === h.value ? null : h.value)}
                      className="border-foreground/30 rounded-full w-6 h-6 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor={`height-${h.value}`} className="text-sm font-black tracking-widest cursor-pointer group-hover:text-primary flex-1 text-white">
                      {h.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
