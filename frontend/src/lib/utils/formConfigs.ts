export interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface FormConfig {
  title: string;
  fields: FormField[];
}

export function getFormConfigs(isEditing: boolean): Record<string, FormConfig> {
  return {
    trip: {
      title: isEditing ? 'Edit Trip' : 'Add Trip',
      fields: [
        { name: 'name', label: 'Trip Name', type: 'text', required: true, placeholder: 'Summer Vacation' },
        {
          name: 'purpose',
          label: 'Purpose',
          type: 'select',
          options: [
            { value: 'leisure', label: 'Leisure' },
            { value: 'business', label: 'Business' },
            { value: 'family', label: 'Family' },
            { value: 'romantic', label: 'Romantic' },
            { value: 'adventure', label: 'Adventure' }
          ],
          required: true
        },
        { name: 'departureDate', label: 'Departure Date', type: 'date', required: true },
        { name: 'returnDate', label: 'Return Date', type: 'date', required: true },
        { name: 'isTentative', label: 'Tentative', type: 'checkbox' },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    },
    flight: {
      title: isEditing ? 'Edit Flight' : 'Add Flight',
      fields: [
        { name: 'isTentative', label: 'Tentative', type: 'checkbox' },
        { name: 'flightNumber', label: 'Flight Number', type: 'text', required: true, placeholder: 'KL668' },
        { name: 'airline', label: 'Airline', type: 'text', readonly: true },
        { name: 'origin', label: 'Origin', type: 'airport', required: true, placeholder: 'AUS' },
        { name: 'destination', label: 'Destination', type: 'airport', required: true, placeholder: 'AMS' },
        { name: 'departureDate', label: 'Departure Date', type: 'date', required: true },
        { name: 'departureTime', label: 'Departure Time', type: 'time', required: true, placeholder: 'HH:MM' },
        { name: 'arrivalDate', label: 'Arrival Date', type: 'date', required: true },
        { name: 'arrivalTime', label: 'Arrival Time', type: 'time', required: true, placeholder: 'HH:MM' },
        { name: 'pnr', label: 'PNR', type: 'text', placeholder: 'ABC123D' },
        { name: 'seat', label: 'Seat', type: 'text', placeholder: '4A' }
      ]
    },
    hotel: {
      title: isEditing ? 'Edit Hotel' : 'Add Hotel',
      fields: [
        { name: 'isTentative', label: 'Tentative', type: 'checkbox' },
        { name: 'name', label: 'Hotel Name', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'text', required: true },
        { name: 'checkInDate', label: 'Check In Date', type: 'date', required: true },
        { name: 'checkInTime', label: 'Check In Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'checkOutDate', label: 'Check Out Date', type: 'date', required: true },
        { name: 'checkOutTime', label: 'Check Out Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'confirmationNumber', label: 'Confirmation Number', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    },
    transportation: {
      title: isEditing ? 'Edit Transportation' : 'Add Transportation',
      fields: [
        { name: 'isTentative', label: 'Tentative', type: 'checkbox' },
        {
          name: 'method',
          label: 'Method',
          type: 'select',
          options: [
            { value: 'train', label: 'Train' },
            { value: 'bus', label: 'Bus' },
            { value: 'ferry', label: 'Ferry' },
            { value: 'shuttle', label: 'Shuttle' },
            { value: 'taxi', label: 'Taxi' },
            { value: 'rideshare', label: 'Rideshare' },
            { value: 'subway', label: 'Subway' },
            { value: 'metro', label: 'Metro' },
            { value: 'tram', label: 'Tram' },
            { value: 'other', label: 'Other' }
          ],
          required: true
        },
        { name: 'origin', label: 'From', type: 'text', required: true },
        { name: 'destination', label: 'To', type: 'text', required: true },
        { name: 'departureDate', label: 'Departure Date', type: 'date', required: true },
        { name: 'departureTime', label: 'Departure Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'arrivalDate', label: 'Arrival Date', type: 'date', required: true },
        { name: 'arrivalTime', label: 'Arrival Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'bookingReference', label: 'Booking Reference', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    },
    carRental: {
      title: isEditing ? 'Edit Car Rental' : 'Add Car Rental',
      fields: [
        { name: 'isTentative', label: 'Tentative', type: 'checkbox' },
        { name: 'company', label: 'Company', type: 'text', required: true },
        { name: 'pickupLocation', label: 'Pickup Location', type: 'text', required: true },
        { name: 'pickupDate', label: 'Pickup Date', type: 'date', required: true },
        { name: 'pickupTime', label: 'Pickup Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'dropoffLocation', label: 'Dropoff Location', type: 'text', required: true },
        { name: 'dropoffDate', label: 'Dropoff Date', type: 'date', required: true },
        { name: 'dropoffTime', label: 'Dropoff Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'confirmationNumber', label: 'Confirmation Number', type: 'text' },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    },
    event: {
      title: isEditing ? 'Edit Event' : 'Add Event',
      fields: [
        { name: 'name', label: 'Event Name', type: 'text', required: true },
        { name: 'location', label: 'Location', type: 'text', required: true },
        { name: 'startDate', label: 'Start Date', type: 'date', required: true },
        { name: 'endDate', label: 'End Date', type: 'date' },
        { name: 'allDay', label: 'All Day Event', type: 'checkbox' },
        { name: 'startTime', label: 'Start Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'endTime', label: 'End Time', type: 'time', placeholder: 'HH:MM' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'ticketNumber', label: 'Ticket Number', type: 'text' },
        { name: 'isTentative', label: 'Tentative', type: 'checkbox' },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    }
  };
}
