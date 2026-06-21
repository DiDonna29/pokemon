
"use client";

import { Language, translations } from "@/lib/i18n";
import { Instagram, Github, Linkedin, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface FooterProps {
  lang: Language;
}

export function Footer({ lang }: FooterProps) {
  const t = translations[lang];

  return (
    <footer className="relative z-10 nav-glass mt-20 border-t border-foreground/5 py-12">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Brand/Credits */}
          <div className="flex flex-col items-center lg:items-start gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center lg:text-left">
              <p className="text-sm font-medium text-muted-foreground italic order-2 sm:order-1">
                {t.developed_by} <span className="text-foreground font-black not-italic">John Di Donna</span> @2024
              </p>
              <div className="relative w-8 h-8 order-1 sm:order-2">
                <Image 
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                  alt="Pokeball Credits"
                  fill
                  className="object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40 text-center lg:text-left">
              © 2024 PokeNexus - {t.rights_reserved}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
             <SocialLink href="https://www.instagram.com/john.didonna/" icon={<Instagram className="w-5 h-5" />} label="Instagram" />
             <SocialLink href="https://github.com/DiDonna29" icon={<Github className="w-5 h-5" />} label="GitHub" />
             <SocialLink href="https://www.linkedin.com/in/john-di-donna-607263295/" icon={<Linkedin className="w-5 h-5" />} label="LinkedIn" />
             <SocialLink href="#" icon={<ExternalLink className="w-5 h-5" />} label={t.portfolio} />
          </div>
        </div>
        
        {/* Pokémon Logo Decorative Center */}
        <div className="mt-16 flex justify-center opacity-10 grayscale hover:grayscale-0 hover:opacity-30 transition-all duration-700">
          <div className="relative w-48 h-16 md:w-64 md:h-24 select-none pointer-events-none">
            <Image 
              src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
              alt="Pokemon Logo Decorative Footer"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <motion.a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="glass px-6 h-12 rounded-2xl flex items-center gap-3 border-foreground/5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
    >
      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
        {label}
      </span>
    </motion.a>
  );
}
