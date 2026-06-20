"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const WEIGHTS = [
  { label: "Light (< 10kg)", value: "light" },
  { label: "Medium (10kg - 100kg)", value: "medium" },
  { label: "Heavy (> 100kg)", value: "heavy" },
];

const HEIGHTS = [
  { label: "Small (< 1m)", value: "small" },
  { label: "Medium (1m - 2m)", value: "medium" },
  { label: "Large (> 2m)", value: "large" },
];

interface FiltersDrawerProps {
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedWeight: string | null;
  setSelectedWeight: (weight: string | null) => void;
  selectedHeight: string | null;
  setSelectedHeight: (height: string | null) => void;
  onClear: () => void;
}

export function FiltersDrawer({ 
  selectedTypes, setSelectedTypes, 
  selectedWeight, setSelectedWeight,
  selectedHeight, setSelectedHeight,
  onClear 
}: FiltersDrawerProps) {
  const activeCount = selectedTypes.length + (selectedWeight ? 1 : 0) + (selectedHeight ? 1 : 0);

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
        <Button variant="outline" className="relative glass border-white/10 hover:bg-white/10 gap-2 h-11">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="glass w-full sm:max-w-md border-l border-white/10 p-0 flex flex-col">
        <SheetHeader className="p-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-headline text-2xl font-bold text-white">Advanced Search</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClear} className="text-primary gap-2 h-8">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
          <SheetDescription className="text-muted-foreground">
            Filter the PokeNexus library by type, size and stats.
          </SheetDescription>
        </SheetHeader>
        
        <Separator className="bg-white/5" />

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Types section */}
            <div className="space-y-4">
              <h3 className="font-headline text-sm font-semibold text-white/70 uppercase tracking-widest">Pokemon Types</h3>
              <div className="grid grid-cols-2 gap-3">
                {TYPES.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type}`} 
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor={`type-${type}`} className="capitalize text-sm cursor-pointer hover:text-white transition-colors">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight section */}
            <div className="space-y-4">
              <h3 className="font-headline text-sm font-semibold text-white/70 uppercase tracking-widest">Weight Class</h3>
              <div className="space-y-3">
                {WEIGHTS.map(w => (
                  <div key={w.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`weight-${w.value}`} 
                      checked={selectedWeight === w.value}
                      onCheckedChange={() => setSelectedWeight(selectedWeight === w.value ? null : w.value)}
                      className="border-white/20 data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor={`weight-${w.value}`} className="text-sm cursor-pointer">
                      {w.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Height section */}
            <div className="space-y-4">
              <h3 className="font-headline text-sm font-semibold text-white/70 uppercase tracking-widest">Height Class</h3>
              <div className="space-y-3">
                {HEIGHTS.map(h => (
                  <div key={h.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`height-${h.value}`} 
                      checked={selectedHeight === h.value}
                      onCheckedChange={() => setSelectedHeight(selectedHeight === h.value ? null : h.value)}
                      className="border-white/20 data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor={`height-${h.value}`} className="text-sm cursor-pointer">
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
