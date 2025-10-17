/**
 * Trip View - Sidebar Controls
 * Manages secondary sidebar visibility and add item menu
 */

function closeSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
}

function openSecondarySidebar() {
  const sidebar = document.getElementById('secondary-sidebar');
  if (sidebar) {
    sidebar.classList.add('open');
  }
}

// Backward compatibility
function closeEditSidebar() {
  closeSecondarySidebar();
}

function openEditSidebar() {
  openSecondarySidebar();
}

function showAddItemMenu() {
  closeSecondarySidebar();
}

function editItem(type, id) {
  openEditSidebar();

  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  switch (type) {
    case 'flight':
      const flight = tripData.flights.find(f => f.id === id);
      if (flight) {
        formContainer.innerHTML = createFlightEditForm(flight);
        initFlightDateTimePickers();
        initAirportSearch();
      }
      break;
    case 'hotel':
      const hotel = tripData.hotels.find(h => h.id === id);
      if (hotel) {
        formContainer.innerHTML = createHotelEditForm(hotel);
        initFlightDateTimePickers();
      }
      break;
    case 'transportation':
      const transport = tripData.transportation.find(t => t.id === id);
      if (transport) {
        formContainer.innerHTML = createTransportationEditForm(transport);
        initFlightDateTimePickers();
      }
      break;
    case 'car-rental':
      const rental = tripData.carRentals.find(c => c.id === id);
      if (rental) {
        formContainer.innerHTML = createCarRentalEditForm(rental);
        initFlightDateTimePickers();
      }
      break;
    case 'event':
      const event = tripData.events.find(e => e.id === id);
      if (event) {
        formContainer.innerHTML = createEventEditForm(event);
        initFlightDateTimePickers();
      }
      break;
  }
}

function showAddForm(type) {
  const formContainer = document.getElementById('secondary-sidebar-content');
  if (!formContainer) return;

  closeEditSidebar();
  openEditSidebar();

  switch (type) {
    case 'flight':
      formContainer.innerHTML = createFlightAddForm();
      initFlightDateTimePickers();
      initAirportSearch();
      break;
    case 'hotel':
      formContainer.innerHTML = createHotelAddForm();
      initFlightDateTimePickers();
      break;
    case 'transportation':
      formContainer.innerHTML = createTransportationAddForm();
      initFlightDateTimePickers();
      initAirportSearch();
      break;
    case 'carRental':
    case 'car-rental':
      formContainer.innerHTML = createCarRentalAddForm();
      initFlightDateTimePickers();
      break;
    case 'event':
      formContainer.innerHTML = createEventAddForm();
      initFlightDateTimePickers();
      break;
  }
}
