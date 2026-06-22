
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PokeNexus | Ultimate Pokédex',
  description: 'Gotta catch \'em all with PokeNexus - your ultimate Pokémon companion.',
  icons: {
    icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    apple: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary selection:text-primary-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
