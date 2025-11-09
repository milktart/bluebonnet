const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

// API endpoint to fetch trip data (for async form refresh)
router.get('/trips/:id', async (req, res) => {
  try {
    const { Trip, Flight, Hotel, Transportation, CarRental, Event, TripCompanion, TravelCompanion } = require('../models');

    // Fetch the trip with all related data
    const trip = await Trip.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: Flight, as: 'flights', order: [['departureDateTime', 'ASC']] },
        { model: Hotel, as: 'hotels', order: [['checkInDateTime', 'ASC']] },
        { model: Transportation, as: 'transportation', order: [['departureDateTime', 'ASC']] },
        { model: CarRental, as: 'carRentals', order: [['pickupDateTime', 'ASC']] },
        { model: Event, as: 'events', order: [['startDateTime', 'ASC']] },
        {
          model: TripCompanion,
          as: 'tripCompanions',
          include: [
            {
              model: TravelCompanion,
              as: 'companion',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
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

    console.log('API /trips/:id/companions - Raw TripCompanion records:', companions.map(tc => ({
      id: tc.id,
      companionId: tc.companionId,
      companion: tc.companion ? { id: tc.companion.id, name: tc.companion.name, email: tc.companion.email } : 'NULL'
    })));

    // Transform to simpler format and sort: self first, then alphabetically by first name
    const companionList = companions
      .filter(tc => tc.companion !== null) // Filter out records with null companion
      .map(tc => ({
        id: tc.companion.id,
        name: tc.companion.name,
        email: tc.companion.email
      }));

    console.log('API /trips/:id/companions - Mapped companion list:', companionList);
    console.log('API /trips/:id/companions - Looking for self with email:', req.user.email);

    // Separate self and others, sort others by first name
    const selfCompanion = companionList.find(c => c.email === req.user.email);
    console.log('API /trips/:id/companions - Found self:', selfCompanion);

    const others = companionList
      .filter(c => c.email !== req.user.email)
      .sort((a, b) => {
        const firstNameA = a.name.split(' ')[0];
        const firstNameB = b.name.split(' ')[0];
        return firstNameA.localeCompare(firstNameB);
      });

    // Combine: self first, then others
    const sortedCompanionList = selfCompanion ? [selfCompanion, ...others] : others;

    console.log('API /trips/:id/companions - Final sorted list:', sortedCompanionList);

    res.json({
      success: true,
      data: sortedCompanionList
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error fetching trip companions'
    });
  }
});

// API endpoint to fetch item companions
router.get('/items/:itemType/:itemId/companions', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { ItemCompanion, TravelCompanion, Flight, Hotel, Transportation, CarRental, Event } = require('../models');

    // Fetch companions for this item
    const itemCompanions = await ItemCompanion.findAll({
      where: {
        itemType: itemType,
        itemId: itemId
      },
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    const companionList = itemCompanions.map(ic => ({
      id: ic.companion.id,
      name: ic.companion.name,
      email: ic.companion.email
    }));

    // Sort: self (current user) first, then alphabetically by first name
    const selfCompanion = companionList.find(c => c.email === req.user.email);
    const others = companionList
      .filter(c => c.email !== req.user.email)
      .sort((a, b) => {
        const firstNameA = a.name.split(' ')[0];
        const firstNameB = b.name.split(' ')[0];
        return firstNameA.localeCompare(firstNameB);
      });

    // Combine: self first, then others
    const sortedCompanionList = selfCompanion ? [selfCompanion, ...others] : others;

    res.json({
      success: true,
      data: sortedCompanionList
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error fetching item companions'
    });
  }
});

// API endpoint to update item companions
router.put('/items/:itemType/:itemId/companions', async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { companionIds } = req.body;
    const { ItemCompanion, Flight, Hotel, Transportation, CarRental, Event } = require('../models');

    // Validate input
    if (!Array.isArray(companionIds)) {
      return res.status(400).json({
        success: false,
        error: 'companionIds must be an array'
      });
    }

    // Get the item to verify it belongs to the user
    const itemModel = { flight: Flight, hotel: Hotel, transportation: Transportation, car_rental: CarRental, event: Event }[itemType];
    if (!itemModel) {
      return res.status(400).json({
        success: false,
        error: 'Invalid itemType'
      });
    }

    const item = await itemModel.findOne({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Get the item's trip and verify user owns it
    const { Trip } = require('../models');
    const trip = await Trip.findOne({
      where: { id: item.tripId, userId: req.user.id }
    });

    if (!trip) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to modify this item'
      });
    }

    // Get existing companions
    const existingCompanions = await ItemCompanion.findAll({
      where: { itemType, itemId }
    });

    const existingIds = existingCompanions.map(ic => ic.companionId);

    // Remove companions that are no longer in the list
    for (const existingId of existingIds) {
      if (!companionIds.includes(existingId)) {
        await ItemCompanion.destroy({
          where: { itemType, itemId, companionId: existingId }
        });
      }
    }

    // Add new companions that aren't already there
    for (const companionId of companionIds) {
      if (!existingIds.includes(companionId)) {
        await ItemCompanion.create({
          itemType,
          itemId,
          companionId,
          status: 'attending',
          addedBy: req.user.id,
          inheritedFromTrip: false
        });
      }
    }

    res.json({
      success: true,
      message: 'Item companions updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Error updating item companions'
    });
  }
});

module.exports = router;
