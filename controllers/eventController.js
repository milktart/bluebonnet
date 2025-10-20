const { Event, Trip } = require('../models');
const {
  verifyTripOwnership,
  geocodeIfChanged,
  redirectAfterSuccess,
  redirectAfterError,
  verifyResourceOwnership,
  convertToUTC
} = require('./helpers/resourceController');

exports.createEvent = async (req, res) => {
  try {
    const { tripId } = req.params;
    let {
      name,
      startDateTime,
      endDateTime,
      location,
      timezone,
      contactPhone,
      contactEmail,
      // Support for separate date/time fields from dashboard form
      startDate,
      startTime,
      endDate,
      endTime,
      description
    } = req.body;

    // Convert separate date/time fields to datetime strings if provided
    if (startDate && startTime && !startDateTime) {
      startDateTime = `${startDate}T${startTime}`;
    }
    if (endDate && endTime && !endDateTime) {
      endDateTime = `${endDate}T${endTime}`;
    }

    // Set default timezone to UTC if not provided
    timezone = timezone || 'UTC';

    // Verify trip ownership if tripId provided
    if (tripId) {
      const trip = await verifyTripOwnership(tripId, req.user.id, Trip);
      if (!trip) {
        const isAsync = req.headers['x-async-request'] === 'true';
        if (isAsync) {
          return res.status(403).json({ success: false, error: 'Trip not found' });
        }
        return redirectAfterError(res, req, null, 'Trip not found');
      }
    }

    // Geocode location if provided
    const coords = location ? await geocodeIfChanged(location) : null;

    // If no endDateTime provided, default to startDateTime (for instant/point-in-time events)
    const finalEndDateTime = endDateTime ? convertToUTC(endDateTime, timezone) : convertToUTC(startDateTime, timezone);

    // Sanitize optional fields - convert empty strings to null to avoid validation errors
    const sanitizedContactEmail = contactEmail && contactEmail.trim() !== '' ? contactEmail : null;
    const sanitizedContactPhone = contactPhone && contactPhone.trim() !== '' ? contactPhone : null;
    const sanitizedDescription = description && description.trim() !== '' ? description : null;

    await Event.create({
      userId: req.user.id,
      tripId: tripId || null,
      name,
      startDateTime: convertToUTC(startDateTime, timezone),
      endDateTime: finalEndDateTime,
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone: sanitizedContactPhone,
      contactEmail: sanitizedContactEmail,
      description: sanitizedDescription
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Event added successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'events', 'Event added successfully');
  } catch (error) {
    console.error('ERROR in createEvent:', error);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: error.message || 'Error adding event' });
    }
    redirectAfterError(res, req, req.params.tripId, 'Error adding event');
  }
};

exports.updateEvent = async (req, res) => {
  try {
    let {
      name,
      startDateTime,
      endDateTime,
      location,
      timezone,
      contactPhone,
      contactEmail,
      description,
      // Support for separate date/time fields from sidebar form
      startDate,
      startTime,
      endDate,
      endTime
    } = req.body;

    // Convert separate date/time fields to datetime strings if provided
    if (startDate && startTime && !startDateTime) {
      startDateTime = `${startDate}T${startTime}`;
    }
    if (endDate && endTime && !endDateTime) {
      endDateTime = `${endDate}T${endTime}`;
    }

    // Set default timezone to UTC if not provided
    timezone = timezone || 'UTC';

    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify event exists
    if (!event) {
      const isAsync = req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
      if (isAsync) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    // Verify ownership
    if (!verifyResourceOwnership(event, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    // Geocode location if changed
    const coords = await geocodeIfChanged(
      location,
      event.location,
      location ? { lat: event.lat, lng: event.lng } : null
    );

    // If no endDateTime provided, default to startDateTime (for instant/point-in-time events)
    const finalEndDateTime = endDateTime ? convertToUTC(endDateTime, timezone) : convertToUTC(startDateTime, timezone);

    // Sanitize optional fields - convert empty strings to null to avoid validation errors
    const sanitizedContactEmail = contactEmail && contactEmail.trim() !== '' ? contactEmail : null;
    const sanitizedContactPhone = contactPhone && contactPhone.trim() !== '' ? contactPhone : null;
    const sanitizedDescription = description && description.trim() !== '' ? description : null;

    await event.update({
      name,
      startDateTime: convertToUTC(startDateTime, timezone),
      endDateTime: finalEndDateTime,
      location,
      timezone,
      lat: coords?.lat,
      lng: coords?.lng,
      contactPhone: sanitizedContactPhone,
      contactEmail: sanitizedContactEmail,
      description: sanitizedDescription
    });

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
    if (isAsync) {
      return res.json({ success: true, message: 'Event updated successfully' });
    }

    redirectAfterSuccess(res, req, event.tripId, 'events', 'Event updated successfully');
  } catch (error) {
    console.error('ERROR in updateEvent:', error);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    const isAsync = req.headers['x-async-request'] === 'true' || req.get('content-type') === 'application/json';
    if (isAsync) {
      return res.status(500).json({ success: false, error: error.message || 'Error updating event' });
    }
    req.flash('error_msg', 'Error updating event');
    res.redirect('back');
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    // Find event with trip
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    // Verify ownership
    if (!verifyResourceOwnership(event, req.user.id)) {
      const isAsync = req.headers['x-async-request'] === 'true';
      if (isAsync) {
        return res.status(403).json({ success: false, error: 'Event not found' });
      }
      return redirectAfterError(res, req, null, 'Event not found');
    }

    const tripId = event.tripId;
    await event.destroy();

    // Check if this is an async request
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.json({ success: true, message: 'Event deleted successfully' });
    }

    redirectAfterSuccess(res, req, tripId, 'events', 'Event deleted successfully');
  } catch (error) {
    console.error(error);
    const isAsync = req.headers['x-async-request'] === 'true';
    if (isAsync) {
      return res.status(500).json({ success: false, error: 'Error deleting event' });
    }
    req.flash('error_msg', 'Error deleting event');
    res.redirect('back');
  }
};

exports.getEventSidebar = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!event || event.userId !== req.user.id) {
      return res.status(404).send('<p class="text-red-600">Event not found</p>');
    }

    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    const formatTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const startDate = formatDate(event.startDateTime);
    const startTime = formatTime(event.startDateTime);
    const endDate = formatDate(event.endDateTime);
    const endTime = formatTime(event.endDateTime);

    let dateTimeString = `${startDate} ${startTime}`;
    if (endDate && endTime && endDate !== startDate) {
      dateTimeString += ` - ${endDate} ${endTime}`;
    } else if (endDate && endTime && startTime !== endTime) {
      dateTimeString += ` - ${endTime}`;
    }

    res.render('partials/event-sidebar', {
      event,
      dateTime: dateTimeString,
      startDate,
      startTime,
      endDate,
      endTime
    });
  } catch (error) {
    console.error('ERROR fetching event sidebar:', error);
    res.status(500).send('<p class="text-red-600">Error loading event details</p>');
  }
};

exports.getEventEditForm = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: Trip, as: 'trip', required: false }]
    });

    if (!event || event.userId !== req.user.id) {
      return res.status(404).send('<p class="text-red-600">Event not found</p>');
    }

    // Format dates for input fields (YYYY-MM-DD format)
    const formatDateForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatTimeForInput = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const startDate = formatDateForInput(event.startDateTime);
    const startTime = formatTimeForInput(event.startDateTime);
    const endDate = formatDateForInput(event.endDateTime);
    const endTime = formatTimeForInput(event.endDateTime);

    res.render('partials/event-edit-form', {
      event,
      startDate,
      startTime,
      endDate,
      endTime
    });
  } catch (error) {
    console.error('ERROR fetching event edit form:', error);
    res.status(500).send('<p class="text-red-600">Error loading edit form</p>');
  }
};