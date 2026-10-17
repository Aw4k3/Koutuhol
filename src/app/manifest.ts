import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'কৌতূহল (Koutuhol) — Stay Curious, Know More',
    short_name: 'কৌতূহল',
    description: 'Reel-style interactive MCQ learning platform for Bangladesh.',
    start_url: '/onboarding',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#10b981',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
    ],
  };
}