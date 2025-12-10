/**
 * Trips List Page - UI and Interactions
 * Handles tabs, accordions, map animations, and sidebar controls
 * Phase 4 - Frontend Modernization: ES6 Module Pattern
 */

// Map state
let mapInitialized = false;
let currentMap = null;
const markers = {};
const activeAnimations = {};
let activeTripAnimation = null;
let originalMapBounds = null;
let originalMapZoom = null;
let currentTripMarker = null;

// Tab management
const TAB_CONFIG = {
  upcoming: { tab: 'upcoming-tab', content: 'upcoming-content' },
  past: { tab: 'past-tab', content: 'past-content' },
  settings: { tab: 'settings-tab', content: 'settings-content' },
};

// Update map with new trip data
function updateMapData(newData, isPast = false) {
  if (!currentMap || !mapInitialized) {
    return;
  }

  // Stop any ongoing animations
  stopTripAnimation();

  // Reinitialize the map with new data
  if (typeof initOverviewMap !== 'undefined') {
    initOverviewMap(newData, 'tripMap', isPast)
      .then((map) => {
        currentMap = map;
      })
      .catch((error) => {
        // Map update failed silently
      });
  }
}

function switchTab(activeTab) {
  console.log('[switchTab] Switching to tab:', activeTab);
  Object.keys(TAB_CONFIG).forEach((tab) => {
    const { tab: tabId, content: contentId } = TAB_CONFIG[tab];
    const tabElement = document.getElementById(tabId);
    const contentElement = document.getElementById(contentId);

    console.log(
      `[switchTab] Processing ${tab}: tabElement=${!!tabElement}, contentElement=${!!contentElement}`
    );

    // Skip if elements don't exist (e.g., when there are no trips)
    if (!tabElement || !contentElement) {
      console.log(`[switchTab] Skipping ${tab} - elements don't exist`);
      return;
    }

    if (tab === activeTab) {
      console.log(`[switchTab] Showing ${tab}`);
      tabElement.className =
        'py-3 px-4 border-b-2 border-blue-500 font-medium text-sm text-blue-600 bg-blue-50 rounded-t-lg transition-all duration-200';
      contentElement.classList.remove('hidden');
    } else {
      console.log(`[switchTab] Hiding ${tab}`);
      tabElement.className =
        'py-3 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg transition-all duration-200';
      contentElement.classList.add('hidden');
    }
  });
  console.log('[switchTab] Tab switch complete');
}

export function showUpcomingTrips() {
  switchTab('upcoming');
  // Close secondary sidebar if open
  const secondarySidebar = document.getElementById('secondary-sidebar');
  if (secondarySidebar && secondarySidebar.classList.contains('open')) {
    console.log('[showUpcomingTrips] Closing secondary sidebar');
    if (typeof window.closeSecondarySidebar === 'function') {
      window.closeSecondarySidebar();
    } else {
      console.warn('[showUpcomingTrips] closeSecondarySidebar function not found');
    }
  }
  // Update map to show upcoming trips data (flights and events)
  if (typeof upcomingTripsData !== 'undefined') {
    updateMapData(upcomingTripsData);
  }
}

export function showPastTrips() {
  switchTab('past');
  // Close secondary sidebar if open
  const secondarySidebar = document.getElementById('secondary-sidebar');
  if (secondarySidebar && secondarySidebar.classList.contains('open')) {
    console.log('[showPastTrips] Closing secondary sidebar');
    if (typeof window.closeSecondarySidebar === 'function') {
      window.closeSecondarySidebar();
    } else {
      console.warn('[showPastTrips] closeSecondarySidebar function not found');
    }
  }
  // Update map to show past trips data (flights only) with darker colors
  if (typeof pastTripsData !== 'undefined') {
    updateMapData(pastTripsData, true);
  }
}

export function showSettings() {
  switchTab('settings');
}

// Accordion functionality
export function toggleAccordion(contentId) {
  const content = document.getElementById(contentId);
  const arrow = content.previousElementSibling.querySelector('.accordion-arrow');

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    arrow.style.transform = 'rotate(180deg)';

    // Load trip items via AJAX if not already loaded
    if (typeof loadTripItemsIfNeeded === 'function') {
      loadTripItemsIfNeeded(contentId);
    }
  } else {
    content.classList.add('hidden');
    arrow.style.transform = 'rotate(0deg)';
  }
}

// Note: openSecondarySidebar(), closeSecondarySidebar(), showCreateTripForm(),
// and showCreateEventForm() are now defined in dashboard.ejs before the onclick
// handlers to avoid ReferenceError

// Backward compatibility
function toggleNewTripSidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

// Logout confirmation
function confirmLogout() {
  if (confirm('Are you sure you want to sign out?')) {
    window.location.href = '/auth/logout';
  }
}

// NOTE: calculateDistance, getPointAtDistance, highlightMapMarker, and unhighlightMapMarker
// are now provided by maps.js. They are exported globally as window functions.
// Do not redefine them here - use the ones from maps.js for consistency.

// Get trip bounds from visible items
function getTripBounds(tripIndex, prefix = 'upcoming') {
  const accordionContent = document.getElementById(`${prefix}-${tripIndex}`);
  if (!accordionContent) return null;

  const tripItems = accordionContent.querySelectorAll('.trip-item');
  const allCoords = [];

  if (!currentMap || !currentMap.segmentLayers || currentMap.segmentLayers.length === 0) {
    return null;
  }

  // Get all markers that belong to this trip (have data-marker attribute)
  const tripMarkers = [];
  tripItems.forEach((item) => {
    const marker = item.getAttribute('data-marker');
    if (marker) {
      tripMarkers.push(parseInt(marker));
    }
  });

  if (tripMarkers.length === 0) return null;

  // Find segments by their index matching the markers
  // But account for potential reindexing by checking segment count
  tripMarkers.forEach((markerNum) => {
    // Segments are indexed starting from 1, find segment with matching index
    const segment = currentMap.segmentLayers.find((s) => s.index === markerNum);

    if (segment && segment.polyline) {
      const coords = segment.polyline.getLatLngs();
      coords.forEach((coord) => {
        allCoords.push([coord.lat, coord.lng]);
      });
    }
  });

  // If we couldn't find by marker index, collect from first N segments
  if (allCoords.length === 0 && tripMarkers.length > 0) {
    const minMarker = Math.min(...tripMarkers);
    const maxMarker = Math.max(...tripMarkers);

    currentMap.segmentLayers.forEach((segment) => {
      if (segment.index >= minMarker && segment.index <= maxMarker && segment.polyline) {
        const coords = segment.polyline.getLatLngs();
        coords.forEach((coord) => {
          allCoords.push([coord.lat, coord.lng]);
        });
      }
    });
  }

  if (allCoords.length === 0) return null;
  return L.latLngBounds(allCoords);
}

// Zoom to trip bounds
function zoomToTripBounds(tripIndex, prefix = 'upcoming') {
  if (
    !currentMap ||
    !currentMap._loaded ||
    !currentMap._container ||
    !currentMap._container.parentNode
  )
    return;

  if (!originalMapBounds && !originalMapZoom) {
    try {
      originalMapBounds = currentMap.getBounds();
      originalMapZoom = currentMap.getZoom();
    } catch (e) {
      // Map not ready yet, will try again on next hover
      return;
    }
  }

  const bounds = getTripBounds(tripIndex, prefix);
  if (!bounds) return;

  // Calculate the span to determine appropriate maxZoom for this trip
  const latSpan = bounds.getNorth() - bounds.getSouth();
  const lngSpan = bounds.getEast() - bounds.getWest();
  const maxSpan = Math.max(latSpan, lngSpan);

  // Adjust maxZoom based on trip span to avoid over-zooming on small areas
  // Very large span (>20 degrees): maxZoom 5
  // Large span (>10 degrees): maxZoom 6
  // Medium span (>5 degrees): maxZoom 7
  // Small span (>1 degree): maxZoom 8
  // Very small span: maxZoom 9
  let maxZoom;
  if (maxSpan > 20) {
    maxZoom = 5;
  } else if (maxSpan > 10) {
    maxZoom = 6;
  } else if (maxSpan > 5) {
    maxZoom = 7;
  } else if (maxSpan > 1) {
    maxZoom = 8;
  } else {
    maxZoom = 9;
  }

  const paddingOptions = {
    paddingTopLeft: [425, 50],
    paddingBottomRight: [0, 0],
    maxZoom,
    duration: 0.5,
    easeLinearity: 0.1,
  };

  try {
    currentMap.fitBounds(bounds, paddingOptions);
  } catch (e) {
    console.warn('Failed to fit bounds:', e);
  }
}

// Restore original map view
function restoreOriginalZoom() {
  if (
    !currentMap ||
    !currentMap._loaded ||
    !currentMap._container ||
    !currentMap._container.parentNode ||
    !originalMapBounds ||
    originalMapZoom === null
  )
    return;

  try {
    currentMap.fitBounds(originalMapBounds, {
      maxZoom: originalMapZoom,
      duration: 0.5,
      easeLinearity: 0.1,
    });
  } catch (e) {
    console.warn('Failed to restore original zoom:', e);
  }

  originalMapBounds = null;
  originalMapZoom = null;
}

// Animate trip segments sequentially
function animateTripSegments(tripIndex, prefix = 'upcoming') {
  if (
    !currentMap ||
    !currentMap._loaded ||
    !currentMap._container ||
    !currentMap._container.parentNode
  )
    return;

  if (activeTripAnimation) {
    clearInterval(activeTripAnimation);
    activeTripAnimation = null;
  }

  const accordionContent = document.getElementById(`${prefix}-${tripIndex}`);
  if (!accordionContent) return;

  const tripItems = accordionContent.querySelectorAll('.trip-item');
  const segments = [];

  tripItems.forEach((item) => {
    const markerId = item.getAttribute('data-marker');
    if (markerId) {
      const segment = currentMap.segmentLayers.find((s) => s.index === parseInt(markerId));
      if (segment) {
        segments.push({ markerId, segment });
      }
    }
  });

  if (segments.length === 0) return;

  let totalDistance = 0;
  segments.forEach((item) => {
    const startPoint = item.segment.polyline.getLatLngs()[0];
    const endPoint =
      item.segment.polyline.getLatLngs()[item.segment.polyline.getLatLngs().length - 1];
    const distance = calculateDistance(
      [startPoint.lat, startPoint.lng],
      [endPoint.lat, endPoint.lng]
    );
    totalDistance += distance;
  });

  let currentZoom = 10; // default zoom
  try {
    currentZoom = currentMap.getZoom();
  } catch (e) {
    console.warn('Failed to get zoom level:', e);
  }
  const zoomFactor = Math.max(0.75, 2 ** (4 - currentZoom));
  const totalDurationMs = (totalDistance / 6000) * 5000 * zoomFactor;
  const frameTime = 50;
  const globalSpeed = 1 / (totalDurationMs / frameTime);

  let globalProgress = 0;
  let currentSegmentIndex = 0;
  let movingMarker = null;

  const animationInterval = setInterval(() => {
    globalProgress += globalSpeed;

    let distanceSoFar = 0;

    for (let i = 0; i < segments.length; i++) {
      const item = segments[i];
      const startPoint = item.segment.polyline.getLatLngs()[0];
      const endPoint =
        item.segment.polyline.getLatLngs()[item.segment.polyline.getLatLngs().length - 1];
      const distance = calculateDistance(
        [startPoint.lat, startPoint.lng],
        [endPoint.lat, endPoint.lng]
      );
      const segmentProgress = distance / totalDistance;

      if (globalProgress <= distanceSoFar + segmentProgress) {
        if (currentSegmentIndex !== i || !movingMarker) {
          if (movingMarker) {
            currentMap.removeLayer(movingMarker);
          }

          currentSegmentIndex = i;

          movingMarker = L.marker(startPoint, {
            icon: L.divIcon({
              className: 'moving-dot-marker',
              html: `<div style="
                width: 12px;
                height: 12px;
                background: ${item.segment.originalColor};
                border-radius: 50%;
                box-shadow: 0 0 10px ${item.segment.originalColor}, 0 0 20px ${item.segment.originalColor}, inset 0 0 5px rgba(255,255,255,0.5);
                border: 2px solid white;
              "></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            }),
          });

          // Add marker with error handling
          try {
            movingMarker.addTo(currentMap);
            currentTripMarker = movingMarker;
          } catch (e) {
            // Map not ready yet, marker won't be added
          }
        }

        const progressWithinSegment = (globalProgress - distanceSoFar) / segmentProgress;
        const newPos = getPointAtDistance(
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng],
          progressWithinSegment
        );

        movingMarker.setLatLng(L.latLng(newPos[0], newPos[1]));
        break;
      }

      distanceSoFar += segmentProgress;
    }

    if (globalProgress >= 1) {
      clearInterval(animationInterval);
      if (movingMarker) {
        currentMap.removeLayer(movingMarker);
        movingMarker = null;
        currentTripMarker = null;
      }
      activeTripAnimation = null;
    }
  }, frameTime);

  activeTripAnimation = animationInterval;
}

// Stop trip animation
function stopTripAnimation() {
  if (activeTripAnimation) {
    clearInterval(activeTripAnimation);
    activeTripAnimation = null;
  }

  if (currentTripMarker) {
    currentMap.removeLayer(currentTripMarker);
    currentTripMarker = null;
  }

  Object.keys(activeAnimations).forEach((markerId) => {
    if (activeAnimations[markerId]) {
      clearInterval(activeAnimations[markerId].interval);
      if (activeAnimations[markerId].marker) {
        currentMap.removeLayer(activeAnimations[markerId].marker);
      }
      delete activeAnimations[markerId];
    }
  });

  restoreOriginalZoom();
}

// Handle browser back/forward navigation
window.addEventListener('popstate', function () {
  const path = window.location.pathname;

  if (path === '/') {
    showUpcomingTrips();
  } else if (path === '/trips/past') {
    showPastTrips();
  } else if (path === '/manage') {
    showSettings();
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  if (typeof L === 'undefined') {
    const mapEl = document.getElementById('tripMap');
    if (mapEl) {
      mapEl.innerHTML =
        '<div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">Map library not loaded.</div>';
    }
    return;
  }

  setTimeout(() => {
    if (!mapInitialized && typeof initOverviewMap !== 'undefined') {
      // Initialize with upcoming trips data since the upcoming tab is shown by default
      initOverviewMap(upcomingTripsData)
        .then((map) => {
          mapInitialized = true;
          currentMap = map;

          // Setup accordion hover handlers
          const accordionContainers = document.querySelectorAll('.accordion-button-container');
          accordionContainers.forEach((container, index) => {
            const accordionContent = container.querySelector('[class*="accordion-content"]');
            if (accordionContent && accordionContent.id) {
              // Extract prefix (upcoming or past) and trip index
              let tripIndex = '';
              let prefix = 'upcoming';

              if (accordionContent.id.startsWith('upcoming-')) {
                tripIndex = accordionContent.id.replace('upcoming-', '');
                prefix = 'upcoming';
              } else if (accordionContent.id.startsWith('past-')) {
                tripIndex = accordionContent.id.replace('past-', '');
                prefix = 'past';
              }

              if (tripIndex) {
                container.addEventListener('mouseenter', async () => {
                  const accordionId = `${prefix}-${tripIndex}`;
                  const accordionContent = document.getElementById(accordionId);

                  // Load items if not already loaded
                  if (accordionContent && accordionContent.getAttribute('data-loaded') !== 'true') {
                    if (typeof loadTripItemsIfNeeded === 'function') {
                      await loadTripItemsIfNeeded(accordionId);
                    }
                  }

                  // Now animate
                  zoomToTripBounds(tripIndex, prefix);
                  animateTripSegments(tripIndex, prefix);
                });

                container.addEventListener('mouseleave', () => {
                  stopTripAnimation();
                });
              }
            }
          });
        })
        .catch((error) => {
          const mapEl = document.getElementById('tripMap');
          if (mapEl) {
            mapEl.innerHTML = `<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">Map failed to load: ${
              error.message
            }</div>`;
          }
        });
    }
  }, 500);
});

// Expose functions globally for inline scripts and initialization
window.showUpcomingTrips = showUpcomingTrips;
window.showPastTrips = showPastTrips;
window.showSettings = showSettings;
window.toggleAccordion = toggleAccordion;
