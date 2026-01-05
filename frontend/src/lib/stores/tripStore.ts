import { writable, type Writable } from 'svelte/store';

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  userId?: string;
  defaultCompanionEditPermission?: boolean;
}

export interface Flight {
  id: string;
  tripId: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDateTime: string;
  arrivalDateTime: string;
  originTimezone: string;
  destinationTimezone: string;
  notes?: string;
}

export interface Hotel {
  id: string;
  tripId: string;
  name: string;
  address: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  timezone: string;
  rate: number;
  roomType: string;
  numberOfRooms: number;
  numberOfGuests: number;
}

export interface TripStoreType {
  currentTrip: Trip | null;
  trips: Trip[];
  flights: Flight[];
  hotels: Hotel[];
  events: any[];
  carRentals: any[];
  transportation: any[];
  companions: any[];
  vouchers: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TripStoreType = {
  currentTrip: null,
  trips: [],
  flights: [],
  hotels: [],
  events: [],
  carRentals: [],
  transportation: [],
  companions: [],
  vouchers: [],
  loading: false,
  error: null,
};

export const tripStore: Writable<TripStoreType> = writable(initialState);

/**
 * Trip Store Actions
 */
export const tripStoreActions = {
  setCurrentTrip(trip: Trip | null) {
    tripStore.update(state => ({
      ...state,
      currentTrip: trip,
    }));
  },

  setTrips(trips: Trip[]) {
    tripStore.update(state => ({
      ...state,
      trips,
    }));
  },

  addTrip(trip: Trip) {
    tripStore.update(state => ({
      ...state,
      trips: [...state.trips, trip],
    }));
  },

  updateTrip(id: string, data: Partial<Trip>) {
    tripStore.update(state => ({
      ...state,
      trips: state.trips.map(t => t.id === id ? { ...t, ...data } : t),
      currentTrip: state.currentTrip?.id === id ? { ...state.currentTrip, ...data } : state.currentTrip,
    }));
  },

  deleteTrip(id: string) {
    tripStore.update(state => ({
      ...state,
      trips: state.trips.filter(t => t.id !== id),
      currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
    }));
  },

  setFlights(flights: Flight[]) {
    tripStore.update(state => ({
      ...state,
      flights,
    }));
  },

  addFlight(flight: Flight) {
    tripStore.update(state => ({
      ...state,
      flights: [...state.flights, flight],
    }));
  },

  updateFlight(id: string, data: Partial<Flight>) {
    tripStore.update(state => ({
      ...state,
      flights: state.flights.map(f => f.id === id ? { ...f, ...data } : f),
    }));
  },

  deleteFlight(id: string) {
    tripStore.update(state => ({
      ...state,
      flights: state.flights.filter(f => f.id !== id),
    }));
  },

  setHotels(hotels: Hotel[]) {
    tripStore.update(state => ({
      ...state,
      hotels,
    }));
  },

  addHotel(hotel: Hotel) {
    tripStore.update(state => ({
      ...state,
      hotels: [...state.hotels, hotel],
    }));
  },

  updateHotel(id: string, data: Partial<Hotel>) {
    tripStore.update(state => ({
      ...state,
      hotels: state.hotels.map(h => h.id === id ? { ...h, ...data } : h),
    }));
  },

  deleteHotel(id: string) {
    tripStore.update(state => ({
      ...state,
      hotels: state.hotels.filter(h => h.id !== id),
    }));
  },

  setEvents(events: any[]) {
    tripStore.update(state => ({
      ...state,
      events,
    }));
  },

  addEvent(event: any) {
    tripStore.update(state => ({
      ...state,
      events: [...state.events, event],
    }));
  },

  updateEvent(id: string, data: any) {
    tripStore.update(state => ({
      ...state,
      events: state.events.map(e => e.id === id ? { ...e, ...data } : e),
    }));
  },

  deleteEvent(id: string) {
    tripStore.update(state => ({
      ...state,
      events: state.events.filter(e => e.id !== id),
    }));
  },

  setCarRentals(carRentals: any[]) {
    tripStore.update(state => ({
      ...state,
      carRentals,
    }));
  },

  addCarRental(carRental: any) {
    tripStore.update(state => ({
      ...state,
      carRentals: [...state.carRentals, carRental],
    }));
  },

  updateCarRental(id: string, data: any) {
    tripStore.update(state => ({
      ...state,
      carRentals: state.carRentals.map(c => c.id === id ? { ...c, ...data } : c),
    }));
  },

  deleteCarRental(id: string) {
    tripStore.update(state => ({
      ...state,
      carRentals: state.carRentals.filter(c => c.id !== id),
    }));
  },

  setTransportation(transportation: any[]) {
    tripStore.update(state => ({
      ...state,
      transportation,
    }));
  },

  addTransportation(item: any) {
    tripStore.update(state => ({
      ...state,
      transportation: [...state.transportation, item],
    }));
  },

  updateTransportation(id: string, data: any) {
    tripStore.update(state => ({
      ...state,
      transportation: state.transportation.map(t => t.id === id ? { ...t, ...data } : t),
    }));
  },

  deleteTransportation(id: string) {
    tripStore.update(state => ({
      ...state,
      transportation: state.transportation.filter(t => t.id !== id),
    }));
  },

  setVouchers(vouchers: any[]) {
    tripStore.update(state => ({
      ...state,
      vouchers,
    }));
  },

  addVoucher(voucher: any) {
    tripStore.update(state => ({
      ...state,
      vouchers: [...state.vouchers, voucher],
    }));
  },

  deleteVoucher(id: string) {
    tripStore.update(state => ({
      ...state,
      vouchers: state.vouchers.filter(v => v.id !== id),
    }));
  },

  setLoading(loading: boolean) {
    tripStore.update(state => ({
      ...state,
      loading,
    }));
  },

  setError(error: string | null) {
    tripStore.update(state => ({
      ...state,
      error,
    }));
  },

  reset() {
    tripStore.set(initialState);
  },
};
