type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

type NearbyPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
};

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function geocode(address: string): Promise<GeocodeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    if (!response.ok) return null;

    const data = await response.json();
    const result = (data as { results?: Array<{ geometry?: { location?: { lat: number; lng: number } }; formatted_address?: string }> }).results?.[0];
    if (!result?.geometry?.location) return null;

    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address ?? address,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    if (!response.ok) return null;

    const data = await response.json();
    const result = (data as { results?: Array<{ formatted_address?: string }> }).results?.[0];
    return result?.formatted_address ?? null;
  } catch {
    return null;
  }
}

export function getStaticMapUrl(
  lat: number,
  lng: number,
  options: { width?: number; height?: number; zoom?: number } = {},
): string | null {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const { width = 600, height = 400, zoom = 15 } = options;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function searchNearby(
  lat: number,
  lng: number,
  type: string = "restaurant",
  radius: number = 5000,
): Promise<NearbyPlace[]> {
  if (!GOOGLE_MAPS_API_KEY) return [];

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`,
    );
    if (!response.ok) return [];

    const data = await response.json();
    type NearbyResponse = { results?: Array<{ name?: string; vicinity?: string; geometry?: { location?: { lat: number; lng: number } } }> };
    const results = (data as NearbyResponse).results ?? [];

    return results
      .filter((r) => r.geometry?.location)
      .map((r) => ({
        name: r.name ?? "",
        address: r.vicinity ?? "",
        lat: r.geometry!.location!.lat,
        lng: r.geometry!.location!.lng,
        distance: calculateDistance(lat, lng, r.geometry!.location!.lat, r.geometry!.location!.lng),
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  } catch {
    return [];
  }
}
