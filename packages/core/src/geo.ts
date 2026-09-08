/** Afstand in kilometers tussen twee coördinaten (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Locatieprivacy: een woonadres wordt nooit exact getoond. We ronden af op een
 * raster van ±2 km zodat een kaart de buurt toont, niet het huis.
 */
export function coarsen(point: { lat: number; lng: number }, gridDeg = 0.02): { lat: number; lng: number } {
  return {
    lat: Math.round(point.lat / gridDeg) * gridDeg,
    lng: Math.round(point.lng / gridDeg) * gridDeg
  };
}

/**
 * Coördinaten van Nederlandse plaatsen voor ontwikkeling en seed-data. In
 * productie vervangt een geocoder (PDOK Locatieserver is gratis en Nederlands)
 * deze tabel; de interface blijft `geocode(place) → {lat,lng} | null`.
 */
export const PLACE_COORDS: Record<string, { lat: number; lng: number; province: string }> = {
  amsterdam: { lat: 52.3676, lng: 4.9041, province: 'Noord-Holland' },
  rotterdam: { lat: 51.9244, lng: 4.4777, province: 'Zuid-Holland' },
  'den haag': { lat: 52.0705, lng: 4.3007, province: 'Zuid-Holland' },
  utrecht: { lat: 52.0907, lng: 5.1214, province: 'Utrecht' },
  eindhoven: { lat: 51.4416, lng: 5.4697, province: 'Noord-Brabant' },
  groningen: { lat: 53.2194, lng: 6.5665, province: 'Groningen' },
  zwolle: { lat: 52.5168, lng: 6.0830, province: 'Overijssel' },
  kampen: { lat: 52.5550, lng: 5.9114, province: 'Overijssel' },
  almere: { lat: 52.3508, lng: 5.2647, province: 'Flevoland' },
  lelystad: { lat: 52.5185, lng: 5.4714, province: 'Flevoland' },
  emmeloord: { lat: 52.7108, lng: 5.7486, province: 'Flevoland' },
  deventer: { lat: 52.2660, lng: 6.1552, province: 'Overijssel' },
  apeldoorn: { lat: 52.2112, lng: 5.9699, province: 'Gelderland' },
  arnhem: { lat: 51.9851, lng: 5.8987, province: 'Gelderland' },
  nijmegen: { lat: 51.8126, lng: 5.8372, province: 'Gelderland' },
  haarlem: { lat: 52.3874, lng: 4.6462, province: 'Noord-Holland' },
  leeuwarden: { lat: 53.2012, lng: 5.7999, province: 'Friesland' },
  assen: { lat: 52.9925, lng: 6.5649, province: 'Drenthe' },
  maastricht: { lat: 50.8514, lng: 5.6910, province: 'Limburg' },
  middelburg: { lat: 51.4988, lng: 3.6136, province: 'Zeeland' },
  breda: { lat: 51.5719, lng: 4.7683, province: 'Noord-Brabant' },
  tilburg: { lat: 51.5555, lng: 5.0913, province: 'Noord-Brabant' },
  enschede: { lat: 52.2215, lng: 6.8937, province: 'Overijssel' },
  amersfoort: { lat: 52.1561, lng: 5.3878, province: 'Utrecht' },
  hilversum: { lat: 52.2292, lng: 5.1669, province: 'Noord-Holland' },
  alkmaar: { lat: 52.6324, lng: 4.7534, province: 'Noord-Holland' },
  dordrecht: { lat: 51.8133, lng: 4.6901, province: 'Zuid-Holland' },
  leiden: { lat: 52.1601, lng: 4.4970, province: 'Zuid-Holland' },
  'den bosch': { lat: 51.6978, lng: 5.3037, province: 'Noord-Brabant' },
  hoorn: { lat: 52.6425, lng: 5.0597, province: 'Noord-Holland' },
  meppel: { lat: 52.6957, lng: 6.1940, province: 'Drenthe' },
  hardenberg: { lat: 52.5758, lng: 6.6194, province: 'Overijssel' },
  urk: { lat: 52.6625, lng: 5.6011, province: 'Flevoland' },
  dronten: { lat: 52.5251, lng: 5.7181, province: 'Flevoland' },
  harderwijk: { lat: 52.3419, lng: 5.6208, province: 'Gelderland' },
  ede: { lat: 52.0402, lng: 5.6649, province: 'Gelderland' },
  zaandam: { lat: 52.4389, lng: 4.8266, province: 'Noord-Holland' },
  purmerend: { lat: 52.5050, lng: 4.9597, province: 'Noord-Holland' }
};

export function geocode(place: string): { lat: number; lng: number; province: string } | null {
  const key = place.trim().toLowerCase().replace(/^'s-hertogenbosch$/, 'den bosch').replace(/^'s-gravenhage$/, 'den haag');
  return PLACE_COORDS[key] ?? null;
}
