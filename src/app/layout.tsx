import type { Metadata } from 'next';
import { Inter, Hind_Siliguri } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali', 'latin'],
  variable: '--font-hind',
});

export const metadata: Metadata = {
  title: 'কৌতূহল (Koutuhol) — Stay Curious, Know More',
  description: 'Reel-style interactive MCQ learning platform for Bangladesh.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${inter.variable} ${hindSiliguri.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white font-sans"
      >
        {children}
      </body>
    </html>
  );
}