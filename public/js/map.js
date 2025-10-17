// Map functionality for trip map view
// Coordinates are now stored in the database, so no geocoding needed
// Note: formatDateTime is defined in datetime-formatter.js

async function initializeMap(tripData) {
  try {
    // Find map element
    const mapEl = document.getElementById('map');
    if (!mapEl) {
      const overviewMap = document.getElementById('overviewMap');
      if (overviewMap) {
        overviewMap.id = 'map';
      } else {
        console.error('No map element found');
        return;
      }
    }

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
      zoomSnap: .25,
      zoomControl: false, // Disable default zoom control
      scrollWheelZoom: true,
      attributionControl: false
    });

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Add ArcGIS tiles
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: ''
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
            lng: originLng
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
            lng: destLng
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
            color: '#0d6efd'
          });
        }
      }
    }

    // Process TRANSPORTATION - these create travel segments
    if (tripData.transportation && Array.isArray(tripData.transportation)) {
      for (const transport of tripData.transportation) {
        if (!transport.origin || !transport.destination) continue;

        // Use stored coordinates from database
        const originLat = parseFloat(transport.originLat);
        const originLng = parseFloat(transport.originLng);
        const destLat = parseFloat(transport.destinationLat);
        const destLng = parseFloat(transport.destinationLng);

        if (!isNaN(originLat) && !isNaN(originLng)) {
          allLocations.push({
            name: transport.origin,
            type: 'transportation',
            details: `${transport.method} ${transport.journeyNumber || ''}`,
            time: new Date(transport.departureDateTime),
            lat: originLat,
            lng: originLng
          });
          allCoords.push([originLat, originLng]);
        }

        if (!isNaN(destLat) && !isNaN(destLng)) {
          allLocations.push({
            name: transport.destination,
            type: 'transportation',
            details: `${transport.method} ${transport.journeyNumber || ''}`,
            time: new Date(transport.arrivalDateTime),
            lat: destLat,
            lng: destLng
          });
          allCoords.push([destLat, destLng]);
        }

        // Add travel segment if both coords are valid
        if (!isNaN(originLat) && !isNaN(originLng) && !isNaN(destLat) && !isNaN(destLng)) {
          travelSegments.push({
            type: 'transportation',
            from: [originLat, originLng],
            to: [destLat, destLng],
            time: new Date(transport.departureDateTime),
            color: '#fd7e14'
          });
        }
      }
    }

    // Process HOTELS (points only)
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
            lat: lat,
            lng: lng
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Process CAR RENTALS (points only)
    if (tripData.carRentals && Array.isArray(tripData.carRentals)) {
      for (const rental of tripData.carRentals) {
        if (!rental.pickupLocation) continue;

        // Use stored coordinates from database
        const pickupLat = parseFloat(rental.pickupLat);
        const pickupLng = parseFloat(rental.pickupLng);

        if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
          allLocations.push({
            name: 'Car Pick-up',
            type: 'carRental',
            details: `${rental.company}`,
            time: new Date(rental.pickupDateTime),
            lat: pickupLat,
            lng: pickupLng
          });
          allCoords.push([pickupLat, pickupLng]);
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
            lat: lat,
            lng: lng
          });
          allCoords.push([lat, lng]);
        }
      }
    }

    // Sort travel segments by time
    travelSegments.sort((a, b) => a.time - b.time);

    // Define marker colors
    const colorMap = {
      flight: '#0d6efd',
      hotel: '#198754',
      transportation: '#fd7e14',
      carRental: '#6c757d',
      event: '#dc3545'
    };

    // Store markers to add after polylines for proper z-ordering
    const markersToAdd = [];

    // Draw individual travel segment lines and store references
    const segmentLayers = [];
    if (travelSegments.length > 0) {
      travelSegments.forEach((segment, index) => {
        // Create a glowing effect with multiple layered polylines
        // Outer glow layers (blue, semi-transparent) to inner solid white line

        const glowLayers = [];

        // Outermost glow layer (thickest, most transparent blue)
        const glowOuter = L.polyline([segment.from, segment.to], {
          color: segment.color,
          weight: 6,
          opacity: 0.2,
          className: `segment-${index + 1}-glow-outer`,
          smoothFactor: 1
        }).addTo(map);
        glowLayers.push(glowOuter);

        // Middle glow layer (medium thickness, more transparent blue)
        const glowMiddle = L.polyline([segment.from, segment.to], {
          color: segment.color,
          weight: 4,
          opacity: 0.35,
          className: `segment-${index + 1}-glow-middle`,
          smoothFactor: 1
        }).addTo(map);
        glowLayers.push(glowMiddle);

        // Core line - solid white center
        const polyline = L.polyline([segment.from, segment.to], {
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          className: `segment-${index + 1}`,
          smoothFactor: 1
        }).addTo(map);
        glowLayers.push(polyline);

        segmentLayers.push({
          index: index + 1,
          polyline: polyline,
          glowLayers: glowLayers,
          originalColor: segment.color,
          originalWeight: 2,
          originalOpacity: 1
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
        fillOpacity: 0.8
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
      // Very large span (>150 degrees): maxZoom 2 (global view)
      // Large span (>50 degrees): maxZoom 3 (continental view)
      // Medium span (>20 degrees): maxZoom 4
      // Small span (>10 degrees): maxZoom 5
      // Very small span: maxZoom 6
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
      // paddingTopLeft: [top, left] - tells Leaflet to avoid the left side
      // paddingBottomRight: [bottom, right]
      map.fitBounds(bounds, {
        paddingTopLeft: [425, 50],
        paddingBottomRight: [0, 0],
        maxZoom: maxZoom + 0.5
      });
    } else {
      const alert = document.createElement('div');
      alert.className = 'alert alert-warning mt-3';
      alert.innerHTML = '<i class="bi bi-exclamation-triangle"></i> No locations to display. Add some items to see them on the map.';
      document.getElementById('map').parentElement.insertBefore(alert, document.getElementById('map'));
    }

    // Return the map instance for external management
    return map;

  } catch (error) {
    console.error('Map error:', error);

    // Remove loading if present
    const loading = document.querySelector('.alert.alert-info');
    if (loading) loading.remove();

    // Show error
    const mapEl = document.getElementById('map') || document.getElementById('overviewMap');
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

// Export
if (typeof window !== 'undefined') {
  window.initializeMap = initializeMap;
}
