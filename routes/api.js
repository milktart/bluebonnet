const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

// API endpoint to fetch trip data (for async form refresh)
router.get('/trips/:id', async (req, res) => {
  try {
    const { Trip, Flight, Hotel, Transportation, CarRental, Event } = require('../models');

    // Fetch the trip with all related data
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Flight, as: 'flights', order: [['departureDateTime', 'ASC']] },
        { model: Hotel, as: 'hotels', order: [['checkInDateTime', 'ASC']] },
        { model: Transportation, as: 'transportation', order: [['departureDateTime', 'ASC']] },
        { model: CarRental, as: 'carRentals', order: [['pickupDateTime', 'ASC']] },
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] }
      ]
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Return the trip data as JSON
    res.json(trip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching trip data' });
  }
});

// API endpoint to fetch trip companions
router.get('/trips/:id/companions', async (req, res) => {
  try {
    const { Trip, TravelCompanion, TripCompanion } = require('../models');

    // Verify user owns the trip
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Fetch companions for this trip
    const companions = await TripCompanion.findAll({
      where: { tripId: req.params.id },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Transform to simpler format
    const companionList = companions.map(tc => ({
      id: tc.companion.id,
      name: tc.companion.name,
      email: tc.companion.email
    }));

    res.json({
      success: true,
      data: companionList
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error fetching trip companions'
    });
  }
});

module.exports = router;
