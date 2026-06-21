
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RotateCcw, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Language, translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
        <SheetHeader className="p-8">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-headline text-2xl font-black uppercase tracking-tight">{t.advanced_search}</SheetTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClear} className="text-primary gap-2 h-10 font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 rounded-xl">
                <RotateCcw className="w-4 h-4" />
                {t.reset}
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl glass border-foreground/5 text-muted-foreground hover:text-foreground transition-all">
                  <X className="w-5 h-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
          <SheetDescription className="text-muted-foreground font-medium italic mt-2">
            {t.filters_desc}
          </SheetDescription>
        </SheetHeader>
        
        <Separator className="bg-foreground/5" />

        <ScrollArea className="flex-1 px-8 py-6">
          <div className="space-y-10 pb-32">
            {/* Types section */}
            <div className="space-y-6">
              <h3 className="font-headline text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-foreground/5 px-4 py-2 rounded-lg inline-block">{t.pokemon_types}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TYPES.map(type => (
                  <div 
                    key={type} 
                    className={cn(
                      "flex items-center space-x-3 glass p-3 rounded-2xl border-foreground/5 hover:border-primary/30 transition-all cursor-pointer group",
                      selectedTypes.includes(type) && "border-primary/40 bg-primary/5"
                    )}
                    onClick={() => toggleType(type)}
                  >
                    <Checkbox 
                      id={`type-${type}`} 
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      className="border-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:text-black rounded-full w-5 h-5 transition-all group-hover:scale-110"
                    />
                    <Label htmlFor={`type-${type}`} className="capitalize text-[11px] font-black tracking-widest cursor-pointer group-hover:text-primary transition-colors flex-1">
                      {t[type as keyof typeof t] || type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight section */}
            <div className="space-y-6">
              <h3 className="font-headline text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-foreground/5 px-4 py-2 rounded-lg inline-block">{t.weight_class}</h3>
              <div className="space-y-3">
                {WEIGHTS.map(w => (
                  <div 
                    key={w.value} 
                    className={cn(
                      "flex items-center space-x-3 glass p-4 rounded-2xl border-foreground/5 hover:border-primary/30 transition-all cursor-pointer group",
                      selectedWeight === w.value && "border-primary/40 bg-primary/5"
                    )}
                    onClick={() => setSelectedWeight(selectedWeight === w.value ? null : w.value)}
                  >
                    <Checkbox 
                      id={`weight-${w.value}`} 
                      checked={selectedWeight === w.value}
                      onCheckedChange={() => setSelectedWeight(selectedWeight === w.value ? null : w.value)}
                      className="border-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:text-black rounded-full w-5 h-5"
                    />
                    <Label htmlFor={`weight-${w.value}`} className="text-[11px] font-black tracking-widest cursor-pointer group-hover:text-primary flex-1">
                      {w.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Height section */}
            <div className="space-y-6">
              <h3 className="font-headline text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-foreground/5 px-4 py-2 rounded-lg inline-block">{t.height_class}</h3>
              <div className="space-y-3">
                {HEIGHTS.map(h => (
                  <div 
                    key={h.value} 
                    className={cn(
                      "flex items-center space-x-3 glass p-4 rounded-2xl border-foreground/5 hover:border-primary/30 transition-all cursor-pointer group",
                      selectedHeight === h.value && "border-primary/40 bg-primary/5"
                    )}
                    onClick={() => setSelectedHeight(selectedHeight === h.value ? null : h.value)}
                  >
                    <Checkbox 
                      id={`height-${h.value}`} 
                      checked={selectedHeight === h.value}
                      onCheckedChange={() => setSelectedHeight(selectedHeight === h.value ? null : h.value)}
                      className="border-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:text-black rounded-full w-5 h-5"
                    />
                    <Label htmlFor={`height-${h.value}`} className="text-[11px] font-black tracking-widest cursor-pointer group-hover:text-primary flex-1">
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
