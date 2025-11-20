/* eslint-env browser */
/* global L, formatDateTime */
/* eslint-disable no-console, no-undef, no-continue, max-len */

/**
 * Maps Module - Consolidated map functionality
 * Combines map.js, trip-map.js, and trip-view-map.js
 * Provides map initialization, overview maps, and interactive animations
 */

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
        console.error('No map element found');
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

    // Add ArcGIS tiles
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '',
      }
    ).addTo(map);

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
            color: '#0d6efd',
          });
        }
      }
    }

    // NOTE: Transportation, hotels, and car rentals are intentionally excluded from the map
    // Only flights (travel segments) and events (location markers) are displayed

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

    // Apply darker colors to travel segments if isPast
    if (isPast) {
      travelSegments.forEach((segment) => {
        if (segment.type === 'flight') {
          segment.color = '#084298';
        }
      });
    }

    // Define marker colors (darker for past trips)
    // Only flights and events are displayed on the map
    const colorMap = isPast
      ? {
          flight: '#084298',
          event: '#dc3545',
        }
      : {
          flight: '#0d6efd',
          event: '#dc3545',
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

      console.log('Bounds:', bounds);
      console.log('Total coordinates:', allCoords.length);
      console.log('Max span:', maxSpan);

      // Determine maxZoom based on span
      let maxZoom;
      if (maxSpan > 150) {
        maxZoom = 2;
      } else if (maxSpan > 50) {
        maxZoom = 3;
      } else if (maxSpan > 20) {
        maxZoom = 4;
      } else if (maxSpan > 10) {
        maxZoom = 5;
      } else {
        maxZoom = 6;
      }

      console.log('Using maxZoom:', maxZoom);

      // Fit bounds accounting for primary sidebar on left
      map.fitBounds(bounds, {
        paddingTopLeft: [425, 1],
        paddingBottomRight: [0, 80],
        maxZoom: maxZoom + 0.5,
      });
    } else {
      // No locations - zoom in slightly more for better initial view
      map.setView([25, -50], 3);
    }

    // Return the map instance for external management
    return map;
  } catch (error) {
    console.error('Map error:', error);

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
      console.log(`Map element #${mapElementId} not found`);
      reject(new Error('Map element not found'));
      return;
    }

    console.log('Initializing overview map...');

    if (typeof initializeMap === 'undefined') {
      console.error('initializeMap function not found. maps.js may not be loaded.');
      mapEl.innerHTML =
        '<div class="alert alert-danger">Map library not loaded. Please refresh the page.</div>';
      reject(new Error('Map library not loaded'));
      return;
    }

    // Destroy existing map if it exists and is stored globally
    if (window.currentMap) {
      console.log('Destroying existing map instance...');
      try {
        // Remove all layers and controls
        if (typeof window.currentMap.remove === 'function') {
          window.currentMap.remove();
        }
        // Force clear any remaining references
        window.currentMap = null;
      } catch (e) {
        console.warn('Error destroying map:', e);
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
          console.log('Map initialized successfully');

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
          });

          resolve(map);
        })
        .catch((error) => {
          console.error('Map initialization failed:', error);
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
      console.error('Map initialization error:', e);
      mapEl.innerHTML = `<div class="alert alert-danger">Map error: ${e.message}</div>`;
      mapEl.id = originalId;
      reject(e);
    }
  });
}

/**
 * Setup timeline hover effects to highlight map segments
 * @param {Object} map - Leaflet map instance with segmentLayers
 */
function setupTimelineHoverEffects(map) {
  if (!map || !map.segmentLayers) {
    console.warn('Map or segment layers not available for hover effects');
    return;
  }

  // Setup individual timeline item hover effects
  const timelineItems = document.querySelectorAll('.timeline-item.has-marker');

  timelineItems.forEach((item) => {
    const marker = item.getAttribute('data-marker');

    item.addEventListener('mouseenter', function () {
      const segment = map.segmentLayers.find((s) => s.index === parseInt(marker, 10));
      if (segment && segment.polyline) {
        const coords = segment.polyline.getLatLngs();

        // Create glow effect with multiple layers
        if (!segment.glowLayer1) {
          segment.glowLayer1 = L.polyline(coords, {
            color: '#6ea8fe',
            weight: 8,
            opacity: 0.7,
            dashArray: '',
          }).addTo(map);
        }

        if (!segment.glowLayer2) {
          segment.glowLayer2 = L.polyline(coords, {
            color: '#cfe2ff',
            weight: 5,
            opacity: 0.9,
            dashArray: '',
          }).addTo(map);
        }

        segment.polyline.setStyle({
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          dashArray: '',
        });

        segment.glowLayer1.bringToFront();
        segment.glowLayer2.bringToFront();
        segment.polyline.bringToFront();
      }
    });

    item.addEventListener('mouseleave', function () {
      const segment = map.segmentLayers.find((s) => s.index === parseInt(marker, 10));
      if (segment && segment.polyline) {
        // Remove glow layers
        if (segment.glowLayer1) {
          map.removeLayer(segment.glowLayer1);
          segment.glowLayer1 = null;
        }
        if (segment.glowLayer2) {
          map.removeLayer(segment.glowLayer2);
          segment.glowLayer2 = null;
        }

        // Restore original style
        segment.polyline.setStyle({
          color: segment.originalColor,
          weight: segment.originalWeight,
          opacity: segment.originalOpacity,
          dashArray: segment.originalDashArray,
        });
      }
    });
  });

  // Setup trip header hover effects (for list view)
  const tripHeaders = document.querySelectorAll('.trip-header');

  tripHeaders.forEach((header) => {
    const tripId = header.getAttribute('data-trip-id');

    header.addEventListener('mouseenter', function (e) {
      e.stopPropagation();

      // Find all timeline items belonging to this trip
      const tripItems = document.querySelectorAll(
        `.timeline-item[data-trip-id="${tripId}"].has-marker`
      );

      tripItems.forEach((item) => {
        const marker = item.getAttribute('data-marker');
        if (marker) {
          const segment = map.segmentLayers.find((s) => s.index === parseInt(marker, 10));
          if (segment && segment.polyline) {
            const coords = segment.polyline.getLatLngs();

            if (!segment.glowLayer1) {
              segment.glowLayer1 = L.polyline(coords, {
                color: '#6ea8fe',
                weight: 8,
                opacity: 0.7,
                dashArray: '',
              }).addTo(map);
            }

            if (!segment.glowLayer2) {
              segment.glowLayer2 = L.polyline(coords, {
                color: '#cfe2ff',
                weight: 5,
                opacity: 0.9,
                dashArray: '',
              }).addTo(map);
            }

            segment.polyline.setStyle({
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              dashArray: '',
            });

            segment.glowLayer1.bringToFront();
            segment.glowLayer2.bringToFront();
            segment.polyline.bringToFront();
          }
        }
      });
    });

    header.addEventListener('mouseleave', function (e) {
      e.stopPropagation();

      // Find all timeline items belonging to this trip
      const tripItems = document.querySelectorAll(
        `.timeline-item[data-trip-id="${tripId}"].has-marker`
      );

      tripItems.forEach((item) => {
        const marker = item.getAttribute('data-marker');
        if (marker) {
          const segment = map.segmentLayers.find((s) => s.index === parseInt(marker, 10));
          if (segment && segment.polyline) {
            if (segment.glowLayer1) {
              map.removeLayer(segment.glowLayer1);
              segment.glowLayer1 = null;
            }
            if (segment.glowLayer2) {
              map.removeLayer(segment.glowLayer2);
              segment.glowLayer2 = null;
            }

            segment.polyline.setStyle({
              color: segment.originalColor,
              weight: segment.originalWeight,
              opacity: segment.originalOpacity,
              dashArray: segment.originalDashArray,
            });
          }
        }
      });
    });
  });
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
 * @param {number} markerId - ID of the marker to highlight
 * @param {string} type - Type of marker (flight, hotel, etc.)
 */
function highlightMapMarker(markerId, _type) {
  if (!window.currentMap) return;

  // Verify the map is still valid and in the DOM
  if (!window.currentMap._container || !window.currentMap._container.offsetParent) {
    console.warn('Map is not available or not in DOM');
    return;
  }

  // Initialize activeAnimations if not present
  if (!window.activeAnimations) {
    window.activeAnimations = {};
  }

  if (markerId && window.currentMap.segmentLayers) {
    const segment = window.currentMap.segmentLayers.find((s) => s.index === parseInt(markerId));
    if (segment) {
      if (window.activeAnimations[markerId]) {
        clearInterval(window.activeAnimations[markerId].interval);
        if (window.activeAnimations[markerId].marker) {
          try {
            window.currentMap.removeLayer(window.activeAnimations[markerId].marker);
          } catch (e) {
            console.warn('Error removing marker:', e);
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
        console.warn('Error creating marker animation:', e);
      }
    }
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
        console.warn('Error removing marker:', e);
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
