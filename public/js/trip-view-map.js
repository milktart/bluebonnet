/**
 * Trip View - Map Interactions
 * Handles map animations and marker highlights
 *
 * Note: activeAnimations, currentMap, and mapInitialized are declared globally in view.ejs
 */

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

function getPointAtDistance(from, to, percent) {
  const lat = from[0] + (to[0] - from[0]) * percent;
  const lng = from[1] + (to[1] - from[1]) * percent;
  return [lat, lng];
}

function highlightMapMarker(markerId, type) {
  if (!currentMap) return;

  // Verify the map is still valid and in the DOM
  if (!currentMap._container || !currentMap._container.offsetParent) {
    console.warn('Map is not available or not in DOM');
    return;
  }

  if (markerId && currentMap.segmentLayers) {
    const segment = currentMap.segmentLayers.find(s => s.index === parseInt(markerId));
    if (segment) {
      if (activeAnimations[markerId]) {
        clearInterval(activeAnimations[markerId].interval);
        if (activeAnimations[markerId].marker) {
          try {
            currentMap.removeLayer(activeAnimations[markerId].marker);
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

      const currentZoom = currentMap.getZoom();
      const zoomFactor = Math.max(0.75, Math.pow(2, 4 - currentZoom));
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
      } catch (e) {
        console.warn('Error creating marker animation:', e);
      }
    }
  }
}

function unhighlightMapMarker(markerId) {
  if (!currentMap) return;

  // Verify the map is still valid
  if (!currentMap._container || !currentMap._container.offsetParent) {
    return;
  }

  if (activeAnimations[markerId]) {
    clearInterval(activeAnimations[markerId].interval);
    if (activeAnimations[markerId].marker) {
      try {
        currentMap.removeLayer(activeAnimations[markerId].marker);
      } catch (e) {
        console.warn('Error removing marker:', e);
      }
    }
    delete activeAnimations[markerId];
  }
}
