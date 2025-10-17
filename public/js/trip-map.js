// Trip map initialization and interaction
// Shared map functionality for trip views

/**
 * Initialize overview map with trip data
 * @param {Object} tripData - Trip data object containing flights, hotels, etc.
 * @param {string} mapElementId - ID of the map container element (default: 'overviewMap')
 * @returns {Promise<Object>} - Promise resolving to initialized map instance
 */
function initOverviewMap(tripData, mapElementId = 'overviewMap') {
  return new Promise((resolve, reject) => {
    const mapEl = document.getElementById(mapElementId);
    if (!mapEl) {
      console.log(`Map element #${mapElementId} not found`);
      reject(new Error('Map element not found'));
      return;
    }

    console.log('Initializing overview map...');

    if (typeof initializeMap === 'undefined') {
      console.error('initializeMap function not found. map.js may not be loaded.');
      mapEl.innerHTML = '<div class="alert alert-danger">Map library not loaded. Please refresh the page.</div>';
      reject(new Error('Map library not loaded'));
      return;
    }

    // Temporarily change ID for map.js compatibility
    const originalId = mapEl.id;
    mapEl.id = 'map';

    try {
      initializeMap(tripData)
        .then((map) => {
          console.log('Map initialized successfully');

          // Single map size recalculation to fix tile rendering without disrupting bounds
          setTimeout(() => {
            if (map && typeof map.invalidateSize === 'function') {
              map.invalidateSize(false); // Use false to prevent bounds recalculation
            }
          }, 100);

          resolve(map);
        })
        .catch(error => {
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

  timelineItems.forEach(item => {
    const marker = item.getAttribute('data-marker');

    item.addEventListener('mouseenter', function() {
      const segment = map.segmentLayers.find(s => s.index === parseInt(marker));
      if (segment && segment.polyline) {
        const coords = segment.polyline.getLatLngs();

        // Create glow effect with multiple layers
        if (!segment.glowLayer1) {
          segment.glowLayer1 = L.polyline(coords, {
            color: '#6ea8fe',
            weight: 8,
            opacity: 0.7,
            dashArray: ''
          }).addTo(map);
        }

        if (!segment.glowLayer2) {
          segment.glowLayer2 = L.polyline(coords, {
            color: '#cfe2ff',
            weight: 5,
            opacity: 0.9,
            dashArray: ''
          }).addTo(map);
        }

        segment.polyline.setStyle({
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          dashArray: ''
        });

        segment.glowLayer1.bringToFront();
        segment.glowLayer2.bringToFront();
        segment.polyline.bringToFront();
      }
    });

    item.addEventListener('mouseleave', function() {
      const segment = map.segmentLayers.find(s => s.index === parseInt(marker));
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
          dashArray: segment.originalDashArray
        });
      }
    });
  });

  // Setup trip header hover effects (for list view)
  const tripHeaders = document.querySelectorAll('.trip-header');

  tripHeaders.forEach(header => {
    const tripId = header.getAttribute('data-trip-id');

    header.addEventListener('mouseenter', function(e) {
      e.stopPropagation();

      // Find all timeline items belonging to this trip
      const tripItems = document.querySelectorAll(`.timeline-item[data-trip-id="${tripId}"].has-marker`);

      tripItems.forEach(item => {
        const marker = item.getAttribute('data-marker');
        if (marker) {
          const segment = map.segmentLayers.find(s => s.index === parseInt(marker));
          if (segment && segment.polyline) {
            const coords = segment.polyline.getLatLngs();

            if (!segment.glowLayer1) {
              segment.glowLayer1 = L.polyline(coords, {
                color: '#6ea8fe',
                weight: 8,
                opacity: 0.7,
                dashArray: ''
              }).addTo(map);
            }

            if (!segment.glowLayer2) {
              segment.glowLayer2 = L.polyline(coords, {
                color: '#cfe2ff',
                weight: 5,
                opacity: 0.9,
                dashArray: ''
              }).addTo(map);
            }

            segment.polyline.setStyle({
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              dashArray: ''
            });

            segment.glowLayer1.bringToFront();
            segment.glowLayer2.bringToFront();
            segment.polyline.bringToFront();
          }
        }
      });
    });

    header.addEventListener('mouseleave', function(e) {
      e.stopPropagation();

      // Find all timeline items belonging to this trip
      const tripItems = document.querySelectorAll(`.timeline-item[data-trip-id="${tripId}"].has-marker`);

      tripItems.forEach(item => {
        const marker = item.getAttribute('data-marker');
        if (marker) {
          const segment = map.segmentLayers.find(s => s.index === parseInt(marker));
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
              dashArray: segment.originalDashArray
            });
          }
        }
      });
    });
  });
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initOverviewMap = initOverviewMap;
  window.setupTimelineHoverEffects = setupTimelineHoverEffects;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initOverviewMap,
    setupTimelineHoverEffects
  };
}
