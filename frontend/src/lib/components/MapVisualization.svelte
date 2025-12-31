<script lang="ts">
  import { onMount } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import type { Trip, Flight, Hotel, Event, Transportation, CarRental } from '$lib/types';

  export let tripData: {
    flights?: Flight[];
    hotels?: Hotel[];
    events?: Event[];
    transportation?: Transportation[];
    carRentals?: CarRental[];
  } = {};

  // Full trip data including trip metadata (needed to know which items belong to which trip)
  export let fullTripData: any = null;

  export let isPast: boolean = false;
  export let highlightedTripId: string | null = null;
  export let highlightedItemType: string | null = null;
  export let highlightedItemId: string | null = null;

  let mapContainer: HTMLDivElement;
  let mapInstance: any;
  let leafletLoaded = false;
  let segmentLayers: any[] = [];
  let activeAnimations: any = {};

  const DEFAULT_MAP_TILE_URL =
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

  // Helper: Calculate distance between two coordinates
  function calculateDistance(from: [number, number], to: [number, number]): number {
    const R = 6371;
    const dLat = ((to[0] - from[0]) * Math.PI) / 180;
    const dLng = ((to[1] - from[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from[0] * Math.PI) / 180) *
        Math.cos((to[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Helper: Get point at a percentage along a line
  function getPointAtDistance(from: [number, number], to: [number, number], percent: number): [number, number] {
    const lat = from[0] + (to[0] - from[0]) * percent;
    const lng = from[1] + (to[1] - from[1]) * percent;
    return [lat, lng];
  }

  // Helper: Calculate a point along a great circle arc (spherical interpolation)
  function slerp(from: [number, number], to: [number, number], t: number): [number, number] {
    const φ1 = (from[0] * Math.PI) / 180;
    const λ1 = (from[1] * Math.PI) / 180;
    const φ2 = (to[0] * Math.PI) / 180;
    const λ2 = (to[1] * Math.PI) / 180;

    // Calculate angular distance between the two points
    const Δσ = Math.acos(
      Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
    );

    if (Δσ < 0.00001) {
      // Points are nearly the same, use linear interpolation
      return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
    }

    const a = Math.sin((1 - t) * Δσ) / Math.sin(Δσ);
    const b = Math.sin(t * Δσ) / Math.sin(Δσ);

    const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
    const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
    const z = a * Math.sin(φ1) + b * Math.sin(φ2);

    const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
    let λ = Math.atan2(y, x);

    let resultLat = (φ * 180) / Math.PI;
    let resultLng = (λ * 180) / Math.PI;

    // Normalize longitude back to [-180, 180] range
    while (resultLng > 180) resultLng -= 360;
    while (resultLng < -180) resultLng += 360;

    return [resultLat, resultLng];
  }

  // Helper: Generate a smooth arc path between two coordinates for great circle visualization
  function generateGreatCircleArc(from: [number, number], to: [number, number], steps: number = 300): [number, number][] {
    const arc: [number, number][] = [];

    // Convert to radians
    const lat1 = (from[0] * Math.PI) / 180;
    const lon1 = (from[1] * Math.PI) / 180;
    const lat2 = (to[0] * Math.PI) / 180;
    const lon2 = (to[1] * Math.PI) / 180;

    // Calculate angular distance
    const dLon = lon2 - lon1;
    const a = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const d = Math.acos(Math.max(-1, Math.min(1, a))); // Clamp to avoid numerical errors

    if (d < 0.00001) {
      // Points are very close, just use start and end
      arc.push(from, to);
      return arc;
    }

    let lastLon = from[1]; // Track previous longitude to detect jumps

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Use vector interpolation for better antimeridian handling
      const A = Math.sin((1 - t) * d) / Math.sin(d);
      const B = Math.sin(t * d) / Math.sin(d);

      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);

      const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
      let lon = Math.atan2(y, x);

      let resultLat = (lat * 180) / Math.PI;
      let resultLon = (lon * 180) / Math.PI;

      // Fix antimeridian discontinuity: if we jump more than 180°, adjust
      const lonDiff = resultLon - lastLon;
      if (lonDiff > 180) {
        resultLon -= 360;
      } else if (lonDiff < -180) {
        resultLon += 360;
      }

      lastLon = resultLon;
      arc.push([resultLat, resultLon]);
    }

    return arc;
  }

  // Highlight a map marker with animation - returns a promise that resolves when animation completes
  export function highlightMapMarker(itemType: string, itemId: string): Promise<void> {
    return new Promise((resolve) => {
      highlightMapMarkerInternal(itemType, itemId, resolve);
    });
  }

  async function highlightMapMarkerInternal(itemType: string, itemId: string, onComplete: () => void) {
    if (!mapInstance || !mapInstance._container || !mapInstance._container.offsetParent) return;

    const L = (await import('leaflet')).default;

    // Find segment by item type and ID
    const segment = segmentLayers.find((s) => s.itemType === itemType && s.itemId === itemId);
    if (!segment) return;

    const markerId = `${itemType}-${itemId}`;

    // Clear existing animation if one is running
    if (activeAnimations[markerId]) {
      clearInterval(activeAnimations[markerId].interval);
      if (activeAnimations[markerId].marker) {
        try {
          mapInstance.removeLayer(activeAnimations[markerId].marker);
        } catch (e) {
          // Silently handle marker removal errors
        }
      }
    }

    // Get the polyline coordinates (these are already the curved arc path)
    const coords = segment.polyline.getLatLngs();
    if (coords.length === 0) return;

    const startPoint = coords[0];
    const endPoint = coords[coords.length - 1];

    const distance = calculateDistance(
      [startPoint.lat, startPoint.lng],
      [endPoint.lat, endPoint.lng]
    );

    const currentZoom = mapInstance.getZoom();
    const zoomFactor = Math.max(0.75, 2 ** (4 - currentZoom));
    const durationMs = (distance / 6000) * 3000 * zoomFactor;
    const frameTime = 50;
    const animationSpeed = frameTime / durationMs;

    try {
      const movingMarker = L.marker([startPoint.lat, startPoint.lng], {
        icon: L.divIcon({
          className: 'moving-dot-marker',
          html: `<div style="
            width: 12px;
            height: 12px;
            background: ${segment.originalColor};
            border-radius: 50%;
            box-shadow: 0 0 10px ${segment.originalColor}, 0 0 20px ${segment.originalColor}, inset 0 0 5px rgba(255,255,255,0.5);
            border: 2px solid white;
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(mapInstance);

      let progress = 0;

      const animationInterval = setInterval(() => {
        progress += animationSpeed;

        if (progress >= 1) {
          // Animation complete - stop the interval
          clearInterval(animationInterval);
          // Remove the marker
          try {
            mapInstance.removeLayer(movingMarker);
          } catch (e) {
            // Silently handle marker removal errors
          }
          // Clean up from activeAnimations
          delete activeAnimations[markerId];
          // Call the completion callback
          onComplete();
          return;
        }

        // Get point along the actual arc path by interpolating within the coords array
        const arcIndex = progress * (coords.length - 1);
        const baseIndex = Math.floor(arcIndex);
        const nextIndex = Math.min(baseIndex + 1, coords.length - 1);
        const lerpT = arcIndex - baseIndex;

        // Linear interpolation between the two closest points on the arc
        const currentCoord = coords[baseIndex];
        const nextCoord = coords[nextIndex];
        const newLat = currentCoord.lat + (nextCoord.lat - currentCoord.lat) * lerpT;
        const newLng = currentCoord.lng + (nextCoord.lng - currentCoord.lng) * lerpT;

        movingMarker.setLatLng(L.latLng(newLat, newLng));
      }, frameTime);

      activeAnimations[markerId] = {
        marker: movingMarker,
        interval: animationInterval,
      };

    } catch (e) {
      console.error('[MapVisualization] Error creating animation:', e);
    }
  }

  // Unhighlight a map marker
  export async function unhighlightMapMarker(markerId: string) {
    if (!mapInstance || !mapInstance._container || !mapInstance._container.offsetParent) return;

    if (activeAnimations[markerId]) {
      clearInterval(activeAnimations[markerId].interval);
      if (activeAnimations[markerId].marker) {
        try {
          mapInstance.removeLayer(activeAnimations[markerId].marker);
        } catch (e) {
          // Silently handle marker removal errors
        }
      }
      delete activeAnimations[markerId];
    }
  }

  // Clear all active animations
  export function clearAllAnimations() {
    Object.keys(activeAnimations).forEach((markerId) => {
      unhighlightMapMarker(markerId);
    });
  }

  // Highlight all travel segments and markers for a specific trip, sequentially in chronological order
  async function highlightTripOnMap(tripId: string) {
    if (!mapInstance || !segmentLayers || segmentLayers.length === 0) return;

    // Clear any existing animations first
    clearAllAnimations();

    // Find all segments belonging to this trip, filtered by tripId
    const tripSegments = segmentLayers.filter(segment => segment.tripId === tripId);

    if (tripSegments.length === 0) {
      return;
    }

    // Sort segments by sortDate in chronological order (earliest first)
    tripSegments.sort((a, b) => {
      const timeA = a.sortDate?.getTime() || 0;
      const timeB = b.sortDate?.getTime() || 0;
      return timeA - timeB;
    });


    // Animate segments one at a time sequentially (not in parallel)
    for (const segment of tripSegments) {
      await new Promise((resolve) => {
        highlightMapMarkerInternal(segment.itemType, segment.itemId, resolve);
      });
    }
  }

  // Export mapInstance for external access
  export function getMapInstance() {
    return mapInstance;
  }

  // Reactive update: populate map when tripData changes
  $: if (leafletLoaded && mapInstance && tripData && hasAnyItems(tripData)) {
    populateMapWithData().catch(err => console.error('[MapVisualization DEBUG] populateMapWithData error:', err));
  }

  // Reactive update: highlight trip items when highlightedTripId changes
  $: if (leafletLoaded && mapInstance && highlightedTripId && !highlightedItemId) {
    highlightTripOnMap(highlightedTripId).catch(err => console.error('[MapVisualization DEBUG] highlightTripOnMap error:', err));
  } else if (!highlightedTripId && !highlightedItemId && leafletLoaded && mapInstance) {
    clearAllAnimations();
  }

  // Reactive update: highlight individual item when highlightedItemId changes
  $: if (leafletLoaded && mapInstance && highlightedItemId && highlightedItemType) {
    clearAllAnimations();
    highlightMapMarker(highlightedItemType, highlightedItemId).catch(err => console.error('[MapVisualization DEBUG] highlightMapMarker error:', err));
  }

  // Populate existing map instance with data
  async function populateMapWithData() {
    if (!mapInstance || !tripData) return;

    const L = (await import('leaflet')).default;

    // Clear existing segment layers
    segmentLayers = [];

    // Clear existing animations
    Object.keys(activeAnimations).forEach((markerId) => {
      if (activeAnimations[markerId].interval) {
        clearInterval(activeAnimations[markerId].interval);
      }
      if (activeAnimations[markerId].marker) {
        try {
          mapInstance.removeLayer(activeAnimations[markerId].marker);
        } catch (e) {
          // Silently ignore
        }
      }
    });
    activeAnimations = {};

    // Remove existing markers and layers (but keep the map container)
    mapInstance.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstance.removeLayer(layer);
      }
    });

    const allLocations: any[] = [];
    const travelSegments: any[] = [];
    const allCoords: any[] = [];

    // Process flights (same as before)
    if (tripData.flights && Array.isArray(tripData.flights)) {
      for (const flight of tripData.flights) {
        if (!flight.origin || !flight.destination) continue;

        const originLat = parseFloat(flight.originLat);
        const originLng = parseFloat(flight.originLng);
        const destLat = parseFloat(flight.destinationLat);
        const destLng = parseFloat(flight.destinationLng);

        if (!isNaN(originLat) && !isNaN(originLng)) {
          allLocations.push({
            name: flight.origin,
            type: 'flight',
            details: `${flight.airline} ${flight.flightNumber}`,
            lat: originLat,
            lng: originLng,
          });
          allCoords.push([originLat, originLng]);
        }

        if (!isNaN(destLat) && !isNaN(destLng)) {
          allLocations.push({
            name: flight.destination,
            type: 'flight',
            details: `${flight.airline} ${flight.flightNumber}`,
            lat: destLat,
            lng: destLng,
          });
          allCoords.push([destLat, destLng]);
        }

        if (!isNaN(originLat) && !isNaN(originLng) && !isNaN(destLat) && !isNaN(destLng)) {
          travelSegments.push({
            type: 'flight',
            from: [originLat, originLng],
            to: [destLat, destLng],
            color: '#a68900',
            itemType: 'flight',
            itemId: flight.id,
            tripId: flight.tripId || null,
            sortDate: new Date(flight.departureDateTime || 0),
          });
        }
      }
    }

    // Process hotels (same logic as before)
    if (tripData.hotels && Array.isArray(tripData.hotels)) {
      for (const hotel of tripData.hotels) {
        if (!hotel.address) continue;

        const lat = parseFloat(hotel.lat);
        const lng = parseFloat(hotel.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
          allLocations.push({
            name: hotel.hotelName,
            type: 'hotel',
            details: hotel.address,
            lat,
            lng,
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Process events
    if (tripData.events && Array.isArray(tripData.events)) {
      for (const event of tripData.events) {
        if (!event.location) continue;

        const lat = parseFloat(event.lat);
        const lng = parseFloat(event.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
          allLocations.push({
            name: event.name,
            type: 'event',
            details: event.location,
            lat,
            lng,
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Process transportation
    if (tripData.transportation && Array.isArray(tripData.transportation)) {
      for (const transportation of tripData.transportation) {
        if (!transportation.origin || !transportation.destination) continue;

        const originLat = parseFloat(transportation.originLat);
        const originLng = parseFloat(transportation.originLng);
        const destLat = parseFloat(transportation.destinationLat);
        const destLng = parseFloat(transportation.destinationLng);

        if (!isNaN(originLat) && !isNaN(originLng)) {
          allLocations.push({
            name: transportation.method,
            type: 'transportation',
            details: transportation.origin,
            lat: originLat,
            lng: originLng,
          });
          allCoords.push([originLat, originLng]);
        }

        if (!isNaN(destLat) && !isNaN(destLng)) {
          allLocations.push({
            name: transportation.method,
            type: 'transportation',
            details: transportation.destination,
            lat: destLat,
            lng: destLng,
          });
          allCoords.push([destLat, destLng]);
        }

        if (!isNaN(originLat) && !isNaN(originLng) && !isNaN(destLat) && !isNaN(destLng)) {
          travelSegments.push({
            type: 'transportation',
            from: [originLat, originLng],
            to: [destLat, destLng],
            color: '#0066cc',
            itemType: 'transportation',
            itemId: transportation.id,
            tripId: transportation.tripId || null,
            sortDate: new Date(transportation.departureDateTime || 0),
          });
        }
      }
    }

    // Process car rentals
    if (tripData.carRentals && Array.isArray(tripData.carRentals)) {
      for (const carRental of tripData.carRentals) {
        if (!carRental.pickupLocation) continue;

        const lat = parseFloat(carRental.pickupLat);
        const lng = parseFloat(carRental.pickupLng);

        if (!isNaN(lat) && !isNaN(lng)) {
          allLocations.push({
            name: carRental.company,
            type: 'carRental',
            details: carRental.pickupLocation,
            lat,
            lng,
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Draw travel segments
    const colorMap: { [key: string]: string } = {
      flight: '#a68900',
      event: '#d6006a',
      hotel: '#7c2d8f',
      carRental: '#d35a2f',
      transportation: '#0066cc',
    };

    travelSegments.forEach((segment, index) => {
      // Generate curved great circle arc
      const arcPath = generateGreatCircleArc(segment.from, segment.to);

      // Create glow layers with curved path
      const glowOuter = L.polyline(arcPath, {
        color: segment.color,
        weight: 6,
        opacity: 0.2,
        smooth: true,
        noClip: true,
      }).addTo(mapInstance);

      const glowMiddle = L.polyline(arcPath, {
        color: segment.color,
        weight: 4,
        opacity: 0.35,
        smooth: true,
        noClip: true,
      }).addTo(mapInstance);

      // Core line with white center
      const polyline = L.polyline(arcPath, {
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        smooth: true,
        noClip: true,
      }).addTo(mapInstance);

      // Store segment layer for highlighting
      segmentLayers.push({
        index: index + 1,
        polyline,
        glowLayers: [glowOuter, glowMiddle, polyline],
        originalColor: segment.color,
        originalWeight: 2,
        originalOpacity: 1,
        itemType: segment.itemType,
        itemId: segment.itemId,
        tripId: segment.tripId,
        sortDate: segment.sortDate,
      });
    });

    // Add location markers
    allLocations.forEach((location) => {
      const color = colorMap[location.type] || '#6c757d';

      const marker = L.circleMarker([location.lat, location.lng], {
        radius: 4,
        fillColor: color,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(mapInstance);

      const popupContent = `
        <div style="min-width: 200px;">
          <strong>${location.name}</strong><br>
          <em>${location.type}</em><br>
          ${location.details}
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Fit bounds with custom center
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);

      // Determine maxZoom based on span - prioritize showing all items with good visibility
      const latSpan = bounds.getNorth() - bounds.getSouth();
      const lngSpan = bounds.getEast() - bounds.getWest();
      const maxSpan = Math.max(latSpan, lngSpan);

      let maxZoom;
      if (maxSpan > 300) {
        // World-wide trips - keep zoomed out for full visibility
        maxZoom = 1.5;
      } else if (maxSpan > 150) {
        // Spanning half the world (e.g., LA to Seoul)
        maxZoom = 1.75;
      } else if (maxSpan > 100) {
        // Very spread out
        maxZoom = 2;
      } else if (maxSpan > 50) {
        // Continental level spread
        maxZoom = 2.5;
      } else if (maxSpan > 20) {
        // Regional spread
        maxZoom = 3;
      } else if (maxSpan > 10) {
        // Local spread
        maxZoom = 3.5;
      } else {
        // Very local (same city or nearby)
        maxZoom = 4;
      }

      // First, fit to bounds normally to establish the zoom level
      mapInstance.fitBounds(bounds, { maxZoom, animate: false });

      // Now get the current bounds after fitting
      const currentBounds = mapInstance.getBounds();
      const currentCenter = currentBounds.getCenter();
      const boundsWidth = currentBounds.getEast() - currentBounds.getWest();
      const boundsHeight = currentBounds.getNorth() - currentBounds.getSouth();

      // Calculate new center offset to push map left by ~13.5% of the bounds width
      const newCenter = L.latLng(
        currentCenter.lat,
        currentCenter.lng - (boundsWidth * 0.135)
      );

      mapInstance.setView(newCenter, mapInstance.getZoom(), { animate: false });
    }

  }

  function hasAnyItems(data: any): boolean {
    if (!data) return false;
    return (
      (data.flights?.length > 0) ||
      (data.hotels?.length > 0) ||
      (data.events?.length > 0) ||
      (data.transportation?.length > 0) ||
      (data.carRentals?.length > 0)
    );
  }


  onMount(async () => {

    if (!mapContainer) {
      console.error('[MapVisualization DEBUG] mapContainer is null!');
      return () => {
        if (mapInstance) mapInstance.remove();
      };
    }

    // Initialize the map container (empty state)
    try {
      const L = (await import('leaflet')).default;
      mapInstance = L.map(mapContainer, {
        center: [0, 0],
        zoom: 2,
        minZoom: 1,
        zoomSnap: 0.5,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false,
        worldCopyJump: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

      const tileUrl = window.MAP_TILE_URL || DEFAULT_MAP_TILE_URL;
      L.tileLayer(tileUrl, { attribution: '', maxZoom: 18, minZoom: 1 }).addTo(mapInstance);

    } catch (error) {
      console.error('[MapVisualization DEBUG] Error initializing empty map:', error);
    }

    leafletLoaded = true;

    return () => {
      // Cleanup
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  });
</script>

<div bind:this={mapContainer} style="width: 100%; height: 100%; position: absolute;"></div>

<style>
  :global(.leaflet-container) {
    font-family: inherit;
  }
</style>
