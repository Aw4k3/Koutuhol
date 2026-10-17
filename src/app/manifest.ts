import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'কৌতূহল (Koutuhol) — Stay Curious, Know More',
    short_name: 'কৌতূহল',
    description: 'Reel-style interactive MCQ learning platform for Bangladesh.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#10b981',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}