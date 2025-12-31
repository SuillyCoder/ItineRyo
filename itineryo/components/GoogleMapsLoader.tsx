'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
        onLoad={() => setIsLoaded(true)}
        onError={() => console.error('Failed to load Google Maps')}
      />
      {children}
    </>
  );
}