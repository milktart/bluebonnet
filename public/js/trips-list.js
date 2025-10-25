/**
 * Trips List Page - UI and Interactions
 * Handles tabs, accordions, map animations, and sidebar controls
 */

// Map state
let mapInitialized = false;
let currentMap = null;
let markers = {};
const activeAnimations = {};
let activeTripAnimation = null;
let originalMapBounds = null;
let originalMapZoom = null;
let currentTripMarker = null;

// Tab management
const TAB_CONFIG = {
  upcoming: { tab: 'upcoming-tab', content: 'upcoming-content' },
  past: { tab: 'past-tab', content: 'past-content' },
  settings: { tab: 'settings-tab', content: 'settings-content' }
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
      .catch(error => {
        // Map update failed silently
      });
  }
}

function switchTab(activeTab) {
  Object.keys(TAB_CONFIG).forEach(tab => {
    const { tab: tabId, content: contentId } = TAB_CONFIG[tab];
    const tabElement = document.getElementById(tabId);
    const contentElement = document.getElementById(contentId);

    if (tab === activeTab) {
      tabElement.className = 'py-3 px-4 border-b-2 border-blue-500 font-medium text-sm text-blue-600 bg-blue-50 rounded-t-lg transition-all duration-200';
      contentElement.classList.remove('hidden');
    } else {
      tabElement.className = 'py-3 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg transition-all duration-200';
      contentElement.classList.add('hidden');
    }
  });
}

function showUpcomingTrips() {
  switchTab('upcoming');
  // Update map to show upcoming trips data (flights and events)
  if (typeof upcomingTripsData !== 'undefined') {
    updateMapData(upcomingTripsData);
  }
}

function showPastTrips() {
  switchTab('past');
  // Update map to show past trips data (flights only) with darker colors
  if (typeof pastTripsData !== 'undefined') {
    updateMapData(pastTripsData, true);
  }
}

function showSettings() {
  switchTab('settings');
}

// Accordion functionality
function toggleAccordion(contentId) {
  const content = document.getElementById(contentId);
  const arrow = content.previousElementSibling.querySelector('.accordion-arrow');

  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    arrow.style.transform = 'rotate(180deg)';
  } else {
    content.classList.add('hidden');
    arrow.style.transform = 'rotate(0deg)';
  }
}

// Secondary Sidebar Controls
function openSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.add('open');
  }
}

function closeSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
}

// Show create trip form in secondary sidebar
function showCreateTripForm() {
  const content = document.getElementById('secondary-sidebar-content');
  const form = document.getElementById('create-trip-form');
  if (content && form) {
    // Clear any previous content from secondary-sidebar-content
    content.innerHTML = '';
    // Hide the form initially
    form.style.display = 'none';
    // Move form content into secondary-sidebar-content
    const formContent = form.innerHTML;
    content.innerHTML = formContent;
    // Reset form fields
    const formElement = content.querySelector('form');
    if (formElement) {
      formElement.reset();
    }
    openSecondarySidebar();
  }
}

// Show create event form in secondary sidebar
function showCreateEventForm() {
  const content = document.getElementById('secondary-sidebar-content');
  const form = document.getElementById('create-event-form');
  if (content && form) {
    // Clear any previous content from secondary-sidebar-content
    content.innerHTML = '';
    // Hide the form initially
    form.style.display = 'none';
    // Move form content into secondary-sidebar-content
    const formContent = form.innerHTML;
    content.innerHTML = formContent;
    // Reset form fields
    const formElement = content.querySelector('form');
    if (formElement) {
      formElement.reset();
    }
    openSecondarySidebar();
  }
}

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

// Map distance calculation
function calculateDistance(from, to) {
  const R = 6371;
  const dLat = (to[0] - from[0]) * Math.PI / 180;
  const dLng = (to[1] - from[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from[0] * Math.PI / 180) * Math.cos(to[0] * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get point at distance along a line
function getPointAtDistance(from, to, percent) {
  const lat = from[0] + (to[0] - from[0]) * percent;
  const lng = from[1] + (to[1] - from[1]) * percent;
  return [lat, lng];
}

// Highlight map marker with animation
function highlightMapMarker(markerId, type) {
  if (!currentMap) return;

  if (markerId && currentMap.segmentLayers) {
    const segment = currentMap.segmentLayers.find(s => s.index === parseInt(markerId));
    if (segment) {
      if (activeAnimations[markerId]) {
        clearInterval(activeAnimations[markerId].interval);
        if (activeAnimations[markerId].marker) {
          currentMap.removeLayer(activeAnimations[markerId].marker);
        }
      }

      const startPoint = segment.polyline.getLatLngs()[0];
      const endPoint = segment.polyline.getLatLngs()[segment.polyline.getLatLngs().length - 1];

      const distance = calculateDistance(
        [startPoint.lat, startPoint.lng],
        [endPoint.lat, endPoint.lng]
      );

      const currentZoom = currentMap.getZoom();
      const zoomFactor = Math.max(0.75, Math.pow(2, 4 - currentZoom));
      const durationMs = (distance / 6000) * 5000 * zoomFactor;
      const frameTime = 50;
      const animationSpeed = frameTime / durationMs;

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
          iconAnchor: [8, 8]
        })
      }).addTo(currentMap);

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

      activeAnimations[markerId] = {
        marker: movingMarker,
        interval: animationInterval
      };
    }
  }
}

// Remove highlight animation
function unhighlightMapMarker(markerId) {
  if (!currentMap) return;

  if (activeAnimations[markerId]) {
    clearInterval(activeAnimations[markerId].interval);
    if (activeAnimations[markerId].marker) {
      currentMap.removeLayer(activeAnimations[markerId].marker);
    }
    delete activeAnimations[markerId];
  }
}

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
  tripItems.forEach(item => {
    const marker = item.getAttribute('data-marker');
    if (marker) {
      tripMarkers.push(parseInt(marker));
    }
  });

  if (tripMarkers.length === 0) return null;

  // Find segments by their index matching the markers
  // But account for potential reindexing by checking segment count
  tripMarkers.forEach(markerNum => {
    // Segments are indexed starting from 1, find segment with matching index
    const segment = currentMap.segmentLayers.find(s => s.index === markerNum);

    if (segment && segment.polyline) {
      const coords = segment.polyline.getLatLngs();
      coords.forEach(coord => {
        allCoords.push([coord.lat, coord.lng]);
      });
    }
  });

  // If we couldn't find by marker index, collect from first N segments
  if (allCoords.length === 0 && tripMarkers.length > 0) {
    const minMarker = Math.min(...tripMarkers);
    const maxMarker = Math.max(...tripMarkers);

    currentMap.segmentLayers.forEach(segment => {
      if (segment.index >= minMarker && segment.index <= maxMarker && segment.polyline) {
        const coords = segment.polyline.getLatLngs();
        coords.forEach(coord => {
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
  if (!currentMap) return;

  if (!originalMapBounds && !originalMapZoom) {
    originalMapBounds = currentMap.getBounds();
    originalMapZoom = currentMap.getZoom();
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
    maxZoom: maxZoom,
    duration: 0.5
  };

  currentMap.fitBounds(bounds, paddingOptions);
}

// Restore original map view
function restoreOriginalZoom() {
  if (!currentMap || !originalMapBounds || originalMapZoom === null) return;

  currentMap.fitBounds(originalMapBounds, {
    maxZoom: originalMapZoom,
    duration: 0.5
  });

  originalMapBounds = null;
  originalMapZoom = null;
}

// Animate trip segments sequentially
function animateTripSegments(tripIndex, prefix = 'upcoming') {
  if (!currentMap) return;

  if (activeTripAnimation) {
    clearInterval(activeTripAnimation);
    activeTripAnimation = null;
  }

  const accordionContent = document.getElementById(`${prefix}-${tripIndex}`);
  if (!accordionContent) return;

  const tripItems = accordionContent.querySelectorAll('.trip-item');
  const segments = [];

  tripItems.forEach(item => {
    const markerId = item.getAttribute('data-marker');
    if (markerId) {
      const segment = currentMap.segmentLayers.find(s => s.index === parseInt(markerId));
      if (segment) {
        segments.push({ markerId, segment });
      }
    }
  });

  if (segments.length === 0) return;

  let totalDistance = 0;
  segments.forEach(item => {
    const startPoint = item.segment.polyline.getLatLngs()[0];
    const endPoint = item.segment.polyline.getLatLngs()[item.segment.polyline.getLatLngs().length - 1];
    const distance = calculateDistance(
      [startPoint.lat, startPoint.lng],
      [endPoint.lat, endPoint.lng]
    );
    totalDistance += distance;
  });

  const currentZoom = currentMap.getZoom();
  const zoomFactor = Math.max(0.75, Math.pow(2, 4 - currentZoom));
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
      const endPoint = item.segment.polyline.getLatLngs()[item.segment.polyline.getLatLngs().length - 1];
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
              iconAnchor: [8, 8]
            })
          }).addTo(currentMap);

          currentTripMarker = movingMarker;
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

  Object.keys(activeAnimations).forEach(markerId => {
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  if (typeof L === 'undefined') {
    const mapEl = document.getElementById('tripMap');
    if (mapEl) {
      mapEl.innerHTML = '<div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">Map library not loaded.</div>';
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
          const accordionButtons = document.querySelectorAll('.w-full.py-4.px-5');
          accordionButtons.forEach((button, index) => {
            const accordionContent = button.nextElementSibling;
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
                button.addEventListener('mouseenter', () => {
                  zoomToTripBounds(tripIndex, prefix);
                  animateTripSegments(tripIndex, prefix);
                });

                button.addEventListener('mouseleave', () => {
                  stopTripAnimation();
                });
              }
            }
          });
        })
        .catch(error => {
          const mapEl = document.getElementById('tripMap');
          if (mapEl) {
            mapEl.innerHTML = '<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">Map failed to load: ' + error.message + '</div>';
          }
        });
    }
  }, 500);
});
