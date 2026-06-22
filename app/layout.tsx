import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'OdontoApp - Co-piloto Clínico de Odontologia',
  description: 'Prontuário Odontológico Inteligente, Odontograma FDI Interativo e Assistente Clínico Gemini Integrado.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased bg-slate-50">{children}</body>
    </html>
  );
}

