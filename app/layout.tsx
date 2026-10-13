import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'AniStreamJD',
    template: '%s | AniStreamJD',
  },
  description: 'La mejor plataforma de anime creada por Jared Ortiz',
  manifest: '/manifest.webmanifest',
  themeColor: '#ea580c',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AniStreamJD',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192.svg',
  },
  openGraph: {
    title: 'AniStreamJD - Ver Anime Online',
    description: 'Disfruta de tus animes favoritos gratis y sin interrupciones.',
    images: [
      {
        url: 'https://i.imgur.com/5pZik7z.png',
        width: 1200,
        height: 630,
        alt: 'AniStream Preview',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AniStreamJD',
    description: 'Created by Jared Ortiz',
    images: ['https://i.imgur.com/5pZik7z.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}