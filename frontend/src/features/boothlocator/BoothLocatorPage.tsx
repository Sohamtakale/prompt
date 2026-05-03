import { useEffect, useRef, useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

declare global {
  interface Window {
    google: typeof google;
    initBoothMap: () => void;
  }
}

export default function BoothLocatorPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [keyError, setKeyError] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      // Fetch API key from backend — keeps it out of the client bundle
      let mapsKey: string;
      try {
        const res = await fetch(`${BASE_URL}/api/maps-config`);
        if (!res.ok) throw new Error('maps-config fetch failed');
        const data = await res.json() as { api_key: string };
        mapsKey = data.api_key;
      } catch {
        if (!cancelled) setKeyError(true);
        return;
      }

      if (cancelled) return;

      if (document.getElementById('google-maps-script')) {
        if (window.google) initMap();
        return;
      }

      window.initBoothMap = initMap;
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places&callback=initBoothMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    loadMap();

    return () => {
      cancelled = true;
      window.initBoothMap = () => {};
    };
  }, []);

  function initMap() {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
      ],
    });

    setMapInstance(map);
    setMapLoaded(true);

    if (inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' },
        fields: ['geometry', 'name', 'formatted_address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        map.panTo(place.geometry.location);
        map.setZoom(14);
        searchNearbyBooths(map, place.geometry.location);
      });
    }
  }

  function searchNearbyBooths(map: google.maps.Map, location: google.maps.LatLng) {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    setStatus('Searching for nearby polling booths…');

    const service = new window.google.maps.places.PlacesService(map);
    const queries = ['polling booth', 'polling station', 'government school', 'community hall'];

    const searchQuery = (query: string) =>
      new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        service.textSearch(
          { query, location, radius: 5000, region: 'in' },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              resolve(results.slice(0, 5));
            } else {
              resolve([]);
            }
          },
        );
      });

    Promise.all(queries.map(searchQuery)).then((allResults) => {
      let found = 0;
      allResults.flat().forEach((place) => {
        if (!place.geometry?.location) return;
        const marker = new window.google.maps.Marker({
          map,
          position: place.geometry.location,
          title: place.name,
          icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="font-family:sans-serif;max-width:200px">
            <strong>${place.name}</strong><br/>
            <span style="color:#666;font-size:12px">${place.formatted_address ?? ''}</span>
          </div>`,
        });

        marker.addListener('click', () => infoWindow.open(map, marker));
        markersRef.current.push(marker);
        found++;
      });

      setStatus(
        found > 0
          ? `Found ${found} nearby locations. Results are indicative — verify with ECI.`
          : 'No polling booths found nearby. Try a different location.',
      );
    });
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapInstance) return;
        const loc = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapInstance.panTo(loc);
        mapInstance.setZoom(14);

        new window.google.maps.Marker({
          map: mapInstance,
          position: loc,
          title: 'Your location',
          icon: { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' },
        });

        searchNearbyBooths(mapInstance, loc);
      },
      () => setStatus('Unable to get your location. Please search manually.'),
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="text-center mb-10 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text mb-4 drop-shadow-xl">
          Polling Booth Locator
        </h1>
        <p className="text-text-secondary text-xl max-w-2xl mx-auto font-light">
          Find polling booths near your area. Search by address or use your current location.
        </p>
      </header>

      {/* Search bar */}
      <div className="flex gap-3 mb-4 animate-fade-in-up stagger-1">
        <div className="flex-1 relative">
          <label htmlFor="booth-search" className="sr-only">Search address in India</label>
          <input
            ref={inputRef}
            id="booth-search"
            type="text"
            placeholder="Search your area, city or address…"
            disabled={!mapLoaded}
            className="w-full px-4 py-3 rounded-xl border border-surface-overlay bg-surface-card text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleLocateMe}
          disabled={!mapLoaded}
          className="px-4 py-3 rounded-xl btn-outline font-semibold text-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label="Use my current location"
        >
          📍 Use My Location
        </button>
      </div>

      {/* Status message */}
      {status && (
        <p className="text-sm text-text-muted mb-3 px-1" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full rounded-2xl overflow-hidden shadow-lg border border-surface-overlay"
        style={{ height: '480px' }}
        aria-label="Google Map showing polling booths"
        role="region"
      >
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            <div className="text-center">
              {keyError ? (
                <p className="text-red-400">Map service unavailable. Please try again later.</p>
              ) : (
                <>
                  <div className="spinner mx-auto mb-3" />
                  <p>Loading map…</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-text-muted text-center">
        ⚠️ Results are indicative. Always verify your official polling booth via the{' '}
        <a
          href="https://voterportal.eci.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          ECI Voter Portal
        </a>.
      </p>
    </div>
  );
}
