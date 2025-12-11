/* eslint-env browser */
/* global L, formatDateTime */
/* eslint-disable no-console, no-undef, no-continue, max-len */

/**
 * Maps Module - Consolidated map functionality
 * Combines map.js, trip-map.js, and trip-view-map.js
 * Provides map initialization, overview maps, and interactive animations
 */

// Default map tile URL (can be overridden by setting window.MAP_TILE_URL)
const DEFAULT_MAP_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

// ============================================================================
// CORE MAP INITIALIZATION (from map.js)
// ============================================================================

/**
 * Initialize map with trip data
 * @param {Object} tripData - Trip data object containing flights, hotels, transportation, etc.
 * @param {boolean} isPast - Whether this is a past trip (applies darker colors)
 * @returns {Promise<Object>} Leaflet map instance
 */
async function initializeMap(tripData, isPast = false) {
  try {
    // Find map element
    const mapEl = document.getElementById('map');
    if (!mapEl) {
      const tripMap = document.getElementById('tripMap');
      if (tripMap) {
        tripMap.id = 'map';
      } else {
        return;
      }
    }

    // Ensure map element is clean and empty
    mapEl._leaflet_id = null; // Clear any Leaflet ID
    mapEl.innerHTML = '';

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'alert alert-info position-fixed top-50 start-50 translate-middle';
    loadingDiv.style.zIndex = '9999';
    loadingDiv.innerHTML = '<i class="bi bi-hourglass-split"></i> Loading map...';
    document.body.appendChild(loadingDiv);

    // Initialize map
    const map = L.map('map', {
      center: [25, 0],
      zoom: 1,
      minZoom: 1,
      zoomSnap: 0.5,
      zoomControl: false, // Disable default zoom control
      scrollWheelZoom: true,
      attributionControl: false,
    });

    // Add zoom control to bottom right
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Add map tiles (configurable via MAP_TILE_URL global variable)
    const tileUrl =
      typeof window !== 'undefined' && window.MAP_TILE_URL
        ? window.MAP_TILE_URL
        : DEFAULT_MAP_TILE_URL;
    L.tileLayer(tileUrl, {
      attribution: '',
    }).addTo(map);

    const allLocations = [];
    const travelSegments = []; // Store actual travel segments
    const allCoords = [];

    // Process FLIGHTS - these create travel segments
    if (tripData.flights && Array.isArray(tripData.flights)) {
      for (const flight of tripData.flights) {
        if (!flight.origin || !flight.destination) continue;

        // Use stored coordinates from database
        const originLat = parseFloat(flight.originLat);
        const originLng = parseFloat(flight.originLng);
        const destLat = parseFloat(flight.destinationLat);
        const destLng = parseFloat(flight.destinationLng);

        if (!isNaN(originLat) && !isNaN(originLng)) {
          allLocations.push({
            name: flight.origin,
            type: 'flight',
            details: `${flight.airline} ${flight.flightNumber}`,
            time: new Date(flight.departureDateTime),
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
            time: new Date(flight.arrivalDateTime),
            lat: destLat,
            lng: destLng,
          });
          allCoords.push([destLat, destLng]);
        }

        // Add travel segment if both coords are valid
        if (!isNaN(originLat) && !isNaN(originLng) && !isNaN(destLat) && !isNaN(destLng)) {
          travelSegments.push({
            type: 'flight',
            from: [originLat, originLng],
            to: [destLat, destLng],
            time: new Date(flight.departureDateTime),
            color: window.getItemHexColor ? window.getItemHexColor('flight') : '#a68900',
            itemType: 'flight',
            itemId: flight.id,
          });
        }
      }
    }

    // Process HOTELS (location markers only)
    if (tripData.hotels && Array.isArray(tripData.hotels)) {
      for (const hotel of tripData.hotels) {
        if (!hotel.address) continue;

        // Use stored coordinates from database
        const lat = parseFloat(hotel.lat);
        const lng = parseFloat(hotel.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
          allLocations.push({
            name: hotel.hotelName,
            type: 'hotel',
            details: hotel.address,
            time: new Date(hotel.checkInDateTime),
            lat,
            lng,
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Process CAR RENTALS (location markers only)
    if (tripData.carRentals && Array.isArray(tripData.carRentals)) {
      for (const carRental of tripData.carRentals) {
        if (!carRental.pickupLocation) continue;

        // Use stored coordinates from database
        const lat = parseFloat(carRental.pickupLat);
        const lng = parseFloat(carRental.pickupLng);

        if (!isNaN(lat) && !isNaN(lng)) {
          allLocations.push({
            name: carRental.company,
            type: 'carRental',
            details: carRental.pickupLocation,
            time: new Date(carRental.pickupDateTime),
            lat,
            lng,
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Process TRANSPORTATION - these create travel segments (like flights)
    if (tripData.transportation && Array.isArray(tripData.transportation)) {
      for (let i = 0; i < tripData.transportation.length; i++) {
        const transportation = tripData.transportation[i];

        if (!transportation.origin || !transportation.destination) {
          continue;
        }

        // Use stored coordinates from database
        const originLat = parseFloat(transportation.originLat);
        const originLng = parseFloat(transportation.originLng);
        const destLat = parseFloat(transportation.destinationLat);
        const destLng = parseFloat(transportation.destinationLng);

        if (!isNaN(originLat) && !isNaN(originLng)) {
          allLocations.push({
            name: transportation.method,
            type: 'transportation',
            details: transportation.origin,
            time: new Date(transportation.departureDateTime),
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
            time: new Date(transportation.arrivalDateTime),
            lat: destLat,
            lng: destLng,
          });
          allCoords.push([destLat, destLng]);
        }

        // Add travel segment if both coords are valid
        if (!isNaN(originLat) && !isNaN(originLng) && !isNaN(destLat) && !isNaN(destLng)) {
          travelSegments.push({
            type: 'transportation',
            from: [originLat, originLng],
            to: [destLat, destLng],
            time: new Date(transportation.departureDateTime),
            color: window.getItemHexColor ? window.getItemHexColor('transportation') : '#0066cc',
            itemType: 'transportation',
            itemId: transportation.id,
          });
        }
      }
    }

    // Process EVENTS (points only)
    if (tripData.events && Array.isArray(tripData.events)) {
      for (const event of tripData.events) {
        if (!event.location) continue;

        // Use stored coordinates from database
        const lat = parseFloat(event.lat);
        const lng = parseFloat(event.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
          allLocations.push({
            name: event.name,
            type: 'event',
            details: event.location,
            time: new Date(event.startDateTime),
            lat,
            lng,
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Sort travel segments by time
    travelSegments.sort((a, b) => a.time - b.time);

    // Apply darker opacity to travel segments if isPast (reuse the color but adjust rendering)
    // The colors are now pulled from centralized configuration
    if (isPast) {
      travelSegments.forEach((segment) => {
        // Segments keep their color from above, but will be rendered with opacity adjustment in CSS
      });
    }

    // Define marker colors using centralized color system
    const colorMap = {
      flight: window.getItemHexColor ? window.getItemHexColor('flight') : '#a68900',
      event: window.getItemHexColor ? window.getItemHexColor('event') : '#d6006a',
      hotel: window.getItemHexColor ? window.getItemHexColor('hotel') : '#7c2d8f',
      carRental: window.getItemHexColor ? window.getItemHexColor('carRental') : '#d35a2f',
      transportation: window.getItemHexColor ? window.getItemHexColor('transportation') : '#0066cc',
    };

    // Store markers to add after polylines for proper z-ordering

    // Draw individual travel segment lines and store references
    const segmentLayers = [];
    if (travelSegments.length > 0) {
      travelSegments.forEach((segment, index) => {
        // Create a glowing effect with multiple layered polylines
        const glowLayers = [];

        // Outermost glow layer (thickest, most transparent blue)
        const glowOuter = L.polyline([segment.from, segment.to], {
          color: segment.color,
          weight: 6,
          opacity: 0.2,
          className: `segment-${index + 1}-glow-outer`,
          smoothFactor: 1,
        }).addTo(map);
        glowLayers.push(glowOuter);

        // Middle glow layer (medium thickness, more transparent blue)
        const glowMiddle = L.polyline([segment.from, segment.to], {
          color: segment.color,
          weight: 4,
          opacity: 0.35,
          className: `segment-${index + 1}-glow-middle`,
          smoothFactor: 1,
        }).addTo(map);
        glowLayers.push(glowMiddle);

        // Core line - solid white center
        const polyline = L.polyline([segment.from, segment.to], {
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          className: `segment-${index + 1}`,
          smoothFactor: 1,
        }).addTo(map);
        glowLayers.push(polyline);

        segmentLayers.push({
          index: index + 1,
          polyline,
          glowLayers,
          originalColor: segment.color,
          originalWeight: 2,
          originalOpacity: 1,
          // Store item type and ID for sidebar matching
          itemType: segment.itemType,
          itemId: segment.itemId,
        });
      });
    }

    // Store segment layers on the map object for external access
    map.segmentLayers = segmentLayers;

    // Now add all markers on top of polylines for proper z-ordering
    allLocations.forEach((location) => {
      const color = colorMap[location.type] || '#6c757d';

      const marker = L.circleMarker([location.lat, location.lng], {
        radius: 4,
        fillColor: color,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 200px;">
          <strong>${location.name}</strong><br>
          <em>${location.type}</em><br>
          ${location.details}<br>
          <small>${formatDateTime(location.time)}</small>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Remove loading
    loadingDiv.remove();

    // Fit bounds
    if (allCoords.length > 0) {
      // Calculate bounds from all coordinates
      const bounds = L.latLngBounds(allCoords);

      // Calculate the span to determine appropriate zoom
      const latSpan = bounds.getNorth() - bounds.getSouth();
      const lngSpan = bounds.getEast() - bounds.getWest();
      const maxSpan = Math.max(latSpan, lngSpan);

      // Determine maxZoom based on span - balanced view showing all items with good detail
      let maxZoom;
      if (maxSpan > 150) {
        maxZoom = 1.75;
      } else if (maxSpan > 50) {
        maxZoom = 2.75;
      } else if (maxSpan > 20) {
        maxZoom = 3.75;
      } else if (maxSpan > 10) {
        maxZoom = 4.75;
      } else {
        maxZoom = 5.75;
      }

      // Fit bounds accounting for primary sidebar on left
      map.fitBounds(bounds, {
        paddingTopLeft: [425, 1],
        paddingBottomRight: [0, 80],
        maxZoom,
      });
    } else {
      // No locations - zoom in slightly more for better initial view
      map.setView([25, -50], 3);
    }

    // Return the map instance for external management
    return map;
  } catch (error) {
    // Remove loading if present
    const loading = document.querySelector('.alert.alert-info');
    if (loading) loading.remove();

    // Show error
    const mapEl = document.getElementById('map') || document.getElementById('tripMap');
    if (mapEl) {
      mapEl.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-circle"></i>
          <strong>Map Error:</strong> ${error.message}<br>
          <small>Try refreshing the page. If the problem persists, check that locations have specific addresses with cities.</small>
        </div>
      `;
    }
    throw error; // Re-throw to be caught by caller
  }
}

// ============================================================================
// OVERVIEW MAP FUNCTIONALITY (from trip-map.js)
// ============================================================================

/**
 * Initialize overview map with trip data
 * @param {Object} tripData - Trip data object containing flights, hotels, etc.
 * @param {string} mapElementId - ID of the map container element (default: 'tripMap')
 * @param {boolean} isPast - Whether this is a past trips view (applies darker colors)
 * @returns {Promise<Object>} - Promise resolving to initialized map instance
 */
function initOverviewMap(tripData, mapElementId = 'tripMap', isPast = false) {
  return new Promise((resolve, reject) => {
    const mapEl = document.getElementById(mapElementId);
    if (!mapEl) {
      reject(new Error('Map element not found'));
      return;
    }

    if (typeof initializeMap === 'undefined') {
      mapEl.innerHTML =
        '<div class="alert alert-danger">Map library not loaded. Please refresh the page.</div>';
      reject(new Error('Map library not loaded'));
      return;
    }

    // Destroy existing map if it exists and is stored globally
    if (window.currentMap) {
      try {
        // Remove all layers and controls
        if (typeof window.currentMap.remove === 'function') {
          window.currentMap.remove();
        }
        // Force clear any remaining references
        window.currentMap = null;
      } catch (e) {
        window.currentMap = null;
      }
    }

    // Clear the map container completely
    mapEl.innerHTML = '';

    // Also clear any animation intervals that might be running
    if (window.activeAnimations) {
      Object.values(window.activeAnimations).forEach((animation) => {
        if (animation.interval) {
          clearInterval(animation.interval);
        }
      });
      window.activeAnimations = {};
    }

    // Temporarily change ID for map.js compatibility
    const originalId = mapEl.id;
    mapEl.id = 'map';

    try {
      initializeMap(tripData, isPast)
        .then((map) => {
          // Wait for map to be fully ready before setting as currentMap
          map.whenReady(() => {
            window.currentMap = map;

            // Force map to recalculate size after a delay to ensure proper rendering
            setTimeout(() => {
              try {
                if (map._container) {
                  map.invalidateSize(false);
                }
              } catch (e) {
                // Silently ignore if map isn't ready
              }
            }, 500);

            // Resolve after map is fully ready and configured
            resolve(map);
          });
        })
        .catch((error) => {
          mapEl.innerHTML = `<div class="alert alert-danger">Map failed to load: ${error.message}</div>`;
          reject(error);
        })
        .finally(() => {
          // Restore original ID
          if (document.getElementById('map')) {
            document.getElementById('map').id = originalId;
          }
        });
    } catch (e) {
      mapEl.innerHTML = `<div class="alert alert-danger">Map error: ${e.message}</div>`;
      mapEl.id = originalId;
      reject(e);
    }
  });
}

/**
 * DEPRECATED: setupTimelineHoverEffects was replaced by better implementations
 *
 * This function has been replaced by:
 * - dashboard-sidebar-content.ejs: highlightItemOnMap() and setupTripHover()
 * - These use stable itemType/itemId lookup instead of volatile segment indices
 *
 * This stub exists only for backward compatibility with old code that may call it.
 * Remove this after verifying no other code relies on it.
 */
function setupTimelineHoverEffects(map) {
  // No-op: hover effects are now handled by dashboard-sidebar-content.ejs
}

// ============================================================================
// INTERACTIVE MAP ANIMATIONS (from trip-view-map.js)
// ============================================================================

/**
 * Calculate distance between two coordinates
 * @param {Array} from - [lat, lng]
 * @param {Array} to - [lat, lng]
 * @returns {number} Distance in kilometers
 */
function calculateDistance(from, to) {
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

/**
 * Get point at a percentage along a line
 * @param {Array} from - [lat, lng]
 * @param {Array} to - [lat, lng]
 * @param {number} percent - Percentage (0-1)
 * @returns {Array} [lat, lng]
 */
function getPointAtDistance(from, to, percent) {
  const lat = from[0] + (to[0] - from[0]) * percent;
  const lng = from[1] + (to[1] - from[1]) * percent;
  return [lat, lng];
}

/**
 * Highlight a map marker with animation
 * Can be called with either:
 * - highlightMapMarker(segmentIndex) - for backward compatibility
 * - highlightMapMarker(itemType, itemId) - for stable item identification
 * @param {number|string} markerIdOrItemType - Segment index OR item type (flight, hotel, etc.)
 * @param {string} itemIdParam - Item ID (optional, only used if markerIdOrItemType is itemType)
 */
function highlightMapMarker(markerIdOrItemType, itemIdParam) {
  if (!window.currentMap) return;

  // Verify the map is still valid and in the DOM
  if (!window.currentMap._container || !window.currentMap._container.offsetParent) {
    return;
  }

  // Initialize activeAnimations if not present
  if (!window.activeAnimations) {
    window.activeAnimations = {};
  }

  let segment = null;
  let markerId = null;

  if (!window.currentMap.segmentLayers) return;

  // Determine how we're being called
  if (typeof markerIdOrItemType === 'string' && itemIdParam) {
    // Called with (itemType, itemId) - preferred method for stable identification
    const itemType = markerIdOrItemType;
    const itemId = itemIdParam;

    // Find segment by item type and ID (stable identifier)
    segment = window.currentMap.segmentLayers.find(
      (s) => s.itemType === itemType && s.itemId === itemId
    );

    if (segment) {
      markerId = `${itemType}-${itemId}`;
    }
  } else {
    // Called with (segmentIndex) - backward compatibility
    markerId = markerIdOrItemType;
    segment = window.currentMap.segmentLayers.find((s) => s.index === parseInt(markerId));
  }

  if (!segment) {
    return;
  }

  if (window.activeAnimations[markerId]) {
    clearInterval(window.activeAnimations[markerId].interval);
    if (window.activeAnimations[markerId].marker) {
      try {
        window.currentMap.removeLayer(window.activeAnimations[markerId].marker);
      } catch (e) {
        // Silently handle marker removal errors
      }
    }
  }

  const startPoint = segment.polyline.getLatLngs()[0];
  const endPoint = segment.polyline.getLatLngs()[segment.polyline.getLatLngs().length - 1];

  const distance = calculateDistance(
    [startPoint.lat, startPoint.lng],
    [endPoint.lat, endPoint.lng]
  );

  const currentZoom = window.currentMap.getZoom();
  const zoomFactor = Math.max(0.75, 2 ** (4 - currentZoom));
  const durationMs = (distance / 6000) * 5000 * zoomFactor;
  const frameTime = 50;
  const animationSpeed = frameTime / durationMs;

  try {
    const movingMarker = L.marker(startPoint, {
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
    }).addTo(window.currentMap);

    let progress = 0;

    const animationInterval = setInterval(() => {
      progress += animationSpeed;

      if (progress >= 1) {
        progress = 0;
      }

      const newPos = getPointAtDistance(
        [startPoint.lat, startPoint.lng],
        [endPoint.lat, endPoint.lng],
        progress
      );

      movingMarker.setLatLng(L.latLng(newPos[0], newPos[1]));
    }, frameTime);

    window.activeAnimations[markerId] = {
      marker: movingMarker,
      interval: animationInterval,
    };
  } catch (e) {
    // Silently handle animation errors
  }
}

/**
 * Remove highlight from a map marker
 * @param {number} markerId - ID of the marker to unhighlight
 */
function unhighlightMapMarker(markerId) {
  if (!window.currentMap) return;

  // Verify the map is still valid
  if (!window.currentMap._container || !window.currentMap._container.offsetParent) {
    return;
  }

  if (!window.activeAnimations) {
    window.activeAnimations = {};
  }

  if (window.activeAnimations[markerId]) {
    clearInterval(window.activeAnimations[markerId].interval);
    if (window.activeAnimations[markerId].marker) {
      try {
        window.currentMap.removeLayer(window.activeAnimations[markerId].marker);
      } catch (e) {
        // Silently handle marker removal errors
      }
    }
    delete window.activeAnimations[markerId];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initializeMap = initializeMap;
  window.initOverviewMap = initOverviewMap;
  window.setupTimelineHoverEffects = setupTimelineHoverEffects;
  window.highlightMapMarker = highlightMapMarker;
  window.unhighlightMapMarker = unhighlightMapMarker;
  window.calculateDistance = calculateDistance;
  window.getPointAtDistance = getPointAtDistance;
}

// Export for modules
/* eslint-disable no-undef */
if (typeof module !== 'undefined' && module.exports) {
  /* eslint-enable no-undef */
  module.exports = {
    /* eslint-enable no-undef */
    initializeMap,
    /* eslint-enable no-undef */
    initOverviewMap,
    /* eslint-enable no-undef */
    setupTimelineHoverEffects,
    /* eslint-enable no-undef */
    highlightMapMarker,
    /* eslint-enable no-undef */
    unhighlightMapMarker,
    /* eslint-enable no-undef */
    calculateDistance,
    /* eslint-enable no-undef */
    getPointAtDistance,
    /* eslint-enable no-undef */
  };
  /* eslint-enable no-undef */
}
/* eslint-enable no-undef */
