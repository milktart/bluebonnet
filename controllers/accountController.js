const bcrypt = require('bcrypt');
const { Sequelize, Op } = require('sequelize');
const logger = require('../utils/logger');
const { User, TravelCompanion, Voucher, Trip, Flight, Hotel, Transportation, CarRental, Event, sequelize } = require('../models');
const versionInfo = require('../utils/version');
const importPreviewProcessor = require('../utils/importPreviewProcessor');

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({
        where: {
          email: email.toLowerCase(),
          id: { [require('sequelize').Op.ne]: userId },
        },
      });

      if (existingUser) {
        req.flash('error_msg', 'Email address is already taken by another user');
        return res.redirect('/account');
      }
    }

    // Update user profile
    await User.update(
      {
        firstName,
        lastName,
        email: email.toLowerCase(),
      },
      {
        where: { id: userId },
      }
    );

    // Update the user object in session
    req.user.firstName = firstName;
    req.user.lastName = lastName;
    req.user.email = email.toLowerCase();

    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/account');
  } catch (error) {
    logger.error('Profile update error:', error);
    req.flash('error_msg', 'An error occurred while updating your profile');
    res.redirect('/account');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Verify current password
    const user = await User.findByPk(userId);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      req.flash('error_msg', 'Current password is incorrect');
      return res.redirect('/account');
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      req.flash('error_msg', 'New passwords do not match');
      return res.redirect('/account');
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await User.update(
      {
        password: hashedNewPassword,
      },
      {
        where: { id: userId },
      }
    );

    req.flash('success_msg', 'Password changed successfully');
    res.redirect('/account');
  } catch (error) {
    logger.error('Password change error:', error);
    req.flash('error_msg', 'An error occurred while changing your password');
    res.redirect('/account');
  }
};

exports.getAccountSettingsSidebar = async (req, res) => {
  try {
    // Get all companion profiles where this user is linked
    // Exclude profiles created by the user themselves (prevent self-removal)
    const companionProfiles = await TravelCompanion.findAll({
      where: {
        userId: req.user.id,
        createdBy: { [Op.ne]: req.user.id }, // Exclude self-created profiles
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.render('partials/account-forms', {
      user: req.user,
      companionProfiles,
      isSidebarRequest: true,
      layout: false, // Don't use main layout, just render the partial
    });
  } catch (error) {
    logger.error('Error loading account settings sidebar:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading account settings. Please try again.</p></div>'
      );
  }
};

exports.getCompanionsSidebar = async (req, res) => {
  try {
    // Simply render the companions sidebar partial
    // The partial will load companion data via JavaScript API calls
    res.render('partials/account-companions-sidebar', {
      user: req.user,
      layout: false, // Don't use main layout, just render the partial
    });
  } catch (error) {
    logger.error('Error loading companions sidebar:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading companions. Please try again.</p></div>'
      );
  }
};

exports.revokeCompanionAccess = async (req, res) => {
  try {
    const { companionId } = req.params;
    const isAjax = req.get('X-Sidebar-Request') === 'true' || req.xhr;

    // Find and update the companion to unlink this user
    const companion = await TravelCompanion.findOne({
      where: {
        id: companionId,
        userId: req.user.id,
      },
    });

    if (!companion) {
      const errorMsg = 'Companion access not found';
      if (isAjax) {
        return res.status(404).json({ success: false, error: errorMsg });
      }
      req.flash('error_msg', errorMsg);
      return res.redirect('/account');
    }

    await companion.update({ userId: null });

    const successMsg = 'Companion access revoked successfully';
    if (isAjax) {
      return res.json({ success: true, message: successMsg });
    }

    req.flash('success_msg', successMsg);
    res.redirect('/account');
  } catch (error) {
    logger.error('Error revoking companion access:', error);
    const errorMsg = 'Error revoking companion access';
    if (req.get('X-Sidebar-Request') === 'true' || req.xhr) {
      return res.status(500).json({ success: false, error: errorMsg });
    }
    req.flash('error_msg', errorMsg);
    res.redirect('/account');
  }
};

exports.getVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    const where = {
      [Sequelize.Op.or]: [{ userId }, { userId: null }],
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const vouchers = await Voucher.findAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate remaining balance and expiration info for each voucher
    const vouchersWithInfo = vouchers.map((v) => {
      const vData = v.toJSON();
      vData.remainingBalance = v.getRemainingBalance();
      vData.daysUntilExpiration = v.getDaysUntilExpiration();
      vData.isExpired = v.getIsExpired();
      vData.usagePercent = Math.round((v.usedAmount / v.totalValue) * 100);
      return vData;
    });

    res.render('account/vouchers', {
      title: 'Travel Vouchers & Credits',
      user: req.user,
      vouchers: vouchersWithInfo,
    });
  } catch (error) {
    logger.error('Error loading vouchers:', error);
    req.flash('error_msg', 'Error loading vouchers');
    res.redirect('/account');
  }
};

exports.getVouchersSidebar = async (req, res) => {
  try {
    const userId = req.user.id;

    const vouchers = await Voucher.findAll({
      where: {
        [Sequelize.Op.or]: [{ userId }, { userId: null }],
      },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Calculate remaining balance and expiration info for each voucher
    const vouchersWithInfo = vouchers.map((v) => {
      const vData = v.toJSON();
      vData.remainingBalance = v.getRemainingBalance();
      vData.daysUntilExpiration = v.getDaysUntilExpiration();
      vData.isExpired = v.getIsExpired();
      vData.usagePercent = v.totalValue
        ? Math.round(((v.usedAmount || 0) / v.totalValue) * 100)
        : 0;
      return vData;
    });

    // Separate open and closed vouchers
    const openVouchers = vouchersWithInfo.filter(
      (v) => v.status === 'OPEN' || v.status === 'PARTIALLY_USED'
    );
    const closedVouchers = vouchersWithInfo.filter(
      (v) =>
        v.status === 'USED' ||
        v.status === 'EXPIRED' ||
        v.status === 'TRANSFERRED' ||
        v.status === 'CANCELLED'
    );

    res.render('partials/vouchers-sidebar', {
      openVouchers,
      closedVouchers,
      user: req.user,
      isSidebarRequest: true,
      layout: false,
    });
  } catch (error) {
    logger.error('Error loading vouchers sidebar:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading vouchers. Please try again.</p></div>'
      );
  }
};

exports.getVoucherDetails = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;

    const voucher = await Voucher.findByPk(voucherId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!voucher) {
      return res
        .status(404)
        .send('<div class="p-4"><p class="text-red-600">Voucher not found</p></div>');
    }

    // Check authorization: user must be owner or voucher must be non-owner-bound
    if (voucher.userId && voucher.userId !== userId) {
      return res
        .status(403)
        .send(
          '<div class="p-4"><p class="text-red-600">Unauthorized to access this voucher</p></div>'
        );
    }

    // Calculate values
    const voucherData = voucher.toJSON();
    voucherData.remainingBalance = voucher.getRemainingBalance();
    voucherData.daysUntilExpiration = voucher.getDaysUntilExpiration();
    voucherData.isExpired = voucher.getIsExpired();
    voucherData.usagePercent = voucher.totalValue
      ? Math.round(((voucher.usedAmount || 0) / voucher.totalValue) * 100)
      : 0;

    res.render('partials/voucher-details-tertiary', {
      voucher: voucherData,
      layout: false,
    });
  } catch (error) {
    logger.error('Error loading voucher details:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading voucher details. Please try again.</p></div>'
      );
  }
};

exports.exportAccountData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all user data
    const trips = await Trip.findAll({
      where: { userId },
      include: [
        { model: Flight, as: 'flights' },
        { model: Hotel, as: 'hotels' },
        { model: Transportation, as: 'transportation' },
        { model: CarRental, as: 'carRentals' },
        { model: Event, as: 'events' },
      ],
    });

    const standaloneFlights = await Flight.findAll({
      where: { tripId: null, userId },
    });

    const standaloneHotels = await Hotel.findAll({
      where: { tripId: null, userId },
    });

    const standaloneTransportation = await Transportation.findAll({
      where: { tripId: null, userId },
    });

    const standaloneCarRentals = await CarRental.findAll({
      where: { tripId: null, userId },
    });

    const standaloneEvents = await Event.findAll({
      where: { tripId: null, userId },
    });

    const vouchers = await Voucher.findAll({
      where: { userId },
    });

    const companions = await TravelCompanion.findAll({
      where: { createdBy: userId },
    });

    // Compile all data
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      },
      trips,
      standaloneFlights,
      standaloneHotels,
      standaloneTransportation,
      standaloneCarRentals,
      standaloneEvents,
      vouchers,
      companions,
    };

    // Send as JSON file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="travel-planner-export-${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting account data:', error);
    res.status(500).json({ success: false, error: 'Error exporting account data' });
  }
};

exports.importAccountData = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      req.flash('error_msg', 'No file uploaded');
      return res.redirect('/account');
    }

    // Parse the JSON file
    let importData;
    try {
      importData = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (parseError) {
      req.flash('error_msg', 'Invalid JSON file format');
      return res.redirect('/account');
    }

    // Validate version
    if (importData.version !== '1.0') {
      req.flash('error_msg', 'Incompatible export file version');
      return res.redirect('/account');
    }

    // Track created IDs for mapping relationships
    const idMappings = {};

    // Import trips and related items
    if (importData.trips && Array.isArray(importData.trips)) {
      for (const tripData of importData.trips) {
        const { flights, hotels, transportation, carRentals, events, ...tripFields } = tripData;

        // Create trip with new ID
        const newTrip = await Trip.create({
          ...tripFields,
          userId,
          id: undefined, // Sequelize will generate new UUID
        });

        idMappings[tripData.id] = newTrip.id;

        // Import trip items
        if (flights && Array.isArray(flights)) {
          for (const flight of flights) {
            await Flight.create({
              ...flight,
              tripId: newTrip.id,
              userId,
              id: undefined,
            });
          }
        }

        if (hotels && Array.isArray(hotels)) {
          for (const hotel of hotels) {
            await Hotel.create({
              ...hotel,
              tripId: newTrip.id,
              userId,
              id: undefined,
            });
          }
        }

        if (transportation && Array.isArray(transportation)) {
          for (const trans of transportation) {
            await Transportation.create({
              ...trans,
              tripId: newTrip.id,
              userId,
              id: undefined,
            });
          }
        }

        if (carRentals && Array.isArray(carRentals)) {
          for (const carRental of carRentals) {
            await CarRental.create({
              ...carRental,
              tripId: newTrip.id,
              userId,
              id: undefined,
            });
          }
        }

        if (events && Array.isArray(events)) {
          for (const event of events) {
            await Event.create({
              ...event,
              tripId: newTrip.id,
              userId,
              id: undefined,
            });
          }
        }
      }
    }

    // Import standalone items
    if (importData.standaloneFlights && Array.isArray(importData.standaloneFlights)) {
      for (const flight of importData.standaloneFlights) {
        await Flight.create({
          ...flight,
          userId,
          tripId: null,
          id: undefined,
        });
      }
    }

    if (importData.standaloneHotels && Array.isArray(importData.standaloneHotels)) {
      for (const hotel of importData.standaloneHotels) {
        await Hotel.create({
          ...hotel,
          userId,
          tripId: null,
          id: undefined,
        });
      }
    }

    if (importData.standaloneTransportation && Array.isArray(importData.standaloneTransportation)) {
      for (const trans of importData.standaloneTransportation) {
        await Transportation.create({
          ...trans,
          userId,
          tripId: null,
          id: undefined,
        });
      }
    }

    if (importData.standaloneCarRentals && Array.isArray(importData.standaloneCarRentals)) {
      for (const carRental of importData.standaloneCarRentals) {
        await CarRental.create({
          ...carRental,
          userId,
          tripId: null,
          id: undefined,
        });
      }
    }

    if (importData.standaloneEvents && Array.isArray(importData.standaloneEvents)) {
      for (const event of importData.standaloneEvents) {
        await Event.create({
          ...event,
          userId,
          tripId: null,
          id: undefined,
        });
      }
    }

    // Import vouchers
    if (importData.vouchers && Array.isArray(importData.vouchers)) {
      for (const voucher of importData.vouchers) {
        await Voucher.create({
          ...voucher,
          userId,
          id: undefined,
        });
      }
    }

    // Import companions
    if (importData.companions && Array.isArray(importData.companions)) {
      for (const companion of importData.companions) {
        await TravelCompanion.create({
          ...companion,
          createdBy: userId,
          id: undefined,
        });
      }
    }

    req.flash(
      'success_msg',
      'Account data imported successfully! All trips, items, vouchers, and companions have been restored.'
    );
    res.redirect('/account');
  } catch (error) {
    logger.error('Error importing account data:', error);
    req.flash('error_msg', 'An error occurred while importing data');
    res.redirect('/account');
  }
};

exports.getDataManagement = async (req, res) => {
  try {
    res.render('account/data-management', {
      title: 'Manage Account Data',
      user: req.user,
    });
  } catch (error) {
    logger.error('Error loading data management page:', error);
    req.flash('error_msg', 'Error loading data management');
    res.redirect('/trips');
  }
};

exports.getDataManagementSidebar = async (req, res) => {
  try {
    res.render('partials/data-management-sidebar', {
      user: req.user,
      layout: false,
    });
  } catch (error) {
    logger.error('Error loading data management sidebar:', error);
    res
      .status(500)
      .send(
        '<div class="p-4"><p class="text-red-600">Error loading data management. Please try again.</p></div>'
      );
  }
};

exports.previewImportData = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Parse the JSON file
    let importData;
    try {
      importData = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (parseError) {
      logger.error('JSON parse error:', parseError);
      return res.status(400).json({ success: false, error: 'Invalid JSON file format' });
    }

    // Validate version
    if (importData.version !== '1.0') {
      return res
        .status(400)
        .json({ success: false, error: 'Incompatible export file version' });
    }

    // Fetch all user's current data for duplicate detection
    const currentTrips = await Trip.findAll({
      where: { userId },
      include: [
        { model: Flight, as: 'flights' },
        { model: Hotel, as: 'hotels' },
        { model: Transportation, as: 'transportation' },
        { model: CarRental, as: 'carRentals' },
        { model: Event, as: 'events' },
      ],
    });

    const allFlights = await Flight.findAll({ where: { userId } });
    const allHotels = await Hotel.findAll({ where: { userId } });
    const allTransportation = await Transportation.findAll({ where: { userId } });
    const allCarRentals = await CarRental.findAll({ where: { userId } });
    const allEvents = await Event.findAll({ where: { userId } });
    const allVouchers = await Voucher.findAll({ where: { userId } });
    const allCompanions = await TravelCompanion.findAll({
      where: { createdBy: userId },
    });

    // Structure current data for preview processor
    const currentUserData = {
      trips: currentTrips,
      allFlights,
      allHotels,
      allTransportation,
      allCarRentals,
      allEvents,
      vouchers: allVouchers,
      companions: allCompanions,
    };

    // Generate preview with duplicate detection
    const preview = importPreviewProcessor.generatePreviewData(importData, currentUserData);

    res.json({ success: true, preview });
  } catch (error) {
    logger.error('Error previewing import data:', error);
    res.status(500).json({ success: false, error: 'Error processing file' });
  }
};

exports.importSelectedData = async (req, res) => {
  let transaction;
  try {
    const userId = req.user.id;
    const { importData, selectedItemIds } = req.body;

    if (!importData || !selectedItemIds || !Array.isArray(selectedItemIds)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid request parameters' });
    }

    logger.info('Import request received:', {
      selectedItemIds: selectedItemIds.length,
      trips: importData.trips?.length || 0,
      standaloneFlights: importData.standaloneFlights?.length || 0,
      standaloneHotels: importData.standaloneHotels?.length || 0,
      previewItems: importData.previewItems?.length || 0,
    });

    // Start transaction for atomicity
    transaction = await sequelize.transaction();

    const stats = {
      trips: 0,
      flights: 0,
      hotels: 0,
      transportation: 0,
      carRentals: 0,
      events: 0,
      vouchers: 0,
      companions: 0,
    };

    // Import trips first and track which ones were imported
    // NOTE: Frontend already filtered to ONLY include selected items, so we can import all of them
    if (importData.trips && Array.isArray(importData.trips)) {
      logger.info(`Processing ${importData.trips.length} trips for import`);
      for (const tripData of importData.trips) {
        // Since frontend already filtered, just import all trips provided
        logger.info(`Importing trip: ${tripData.id} (${tripData.name})`);

        // Create trip with new ID and user ID
        const newTrip = await Trip.create(
          {
            ...tripData,
            userId,
            id: undefined, // Generate new UUID
          },
          { transaction }
        );

        stats.trips++;

        // Import all children of this trip (frontend already filtered to selected items)
        if (tripData.flights && Array.isArray(tripData.flights)) {
          for (const flight of tripData.flights) {
            await Flight.create(
              {
                ...flight,
                tripId: newTrip.id,
                userId,
                id: undefined,
              },
              { transaction }
            );
            stats.flights++;
          }
        }

        if (tripData.hotels && Array.isArray(tripData.hotels)) {
          for (const hotel of tripData.hotels) {
            await Hotel.create(
              {
                ...hotel,
                tripId: newTrip.id,
                userId,
                id: undefined,
              },
              { transaction }
            );
            stats.hotels++;
          }
        }

        if (tripData.transportation && Array.isArray(tripData.transportation)) {
          for (const trans of tripData.transportation) {
            await Transportation.create(
              {
                ...trans,
                tripId: newTrip.id,
                userId,
                id: undefined,
              },
              { transaction }
            );
            stats.transportation++;
          }
        }

        if (tripData.carRentals && Array.isArray(tripData.carRentals)) {
          for (const carRental of tripData.carRentals) {
            await CarRental.create(
              {
                ...carRental,
                tripId: newTrip.id,
                userId,
                id: undefined,
              },
              { transaction }
            );
            stats.carRentals++;
          }
        }

        if (tripData.events && Array.isArray(tripData.events)) {
          for (const event of tripData.events) {
            await Event.create(
              {
                ...event,
                tripId: newTrip.id,
                userId,
                id: undefined,
              },
              { transaction }
            );
            stats.events++;
          }
        }
      }
    }

    // Import standalone items (frontend already filtered to selected items)
    if (importData.standaloneFlights && Array.isArray(importData.standaloneFlights)) {
      for (const flight of importData.standaloneFlights) {
        await Flight.create(
          {
            ...flight,
            userId,
            tripId: null,
            id: undefined,
          },
          { transaction }
        );
        stats.flights++;
      }
    }

    if (importData.standaloneHotels && Array.isArray(importData.standaloneHotels)) {
      for (const hotel of importData.standaloneHotels) {
        await Hotel.create(
          {
            ...hotel,
            userId,
            tripId: null,
            id: undefined,
          },
          { transaction }
        );
        stats.hotels++;
      }
    }

    if (
      importData.standaloneTransportation &&
      Array.isArray(importData.standaloneTransportation)
    ) {
      for (const trans of importData.standaloneTransportation) {
        await Transportation.create(
          {
            ...trans,
            userId,
            tripId: null,
            id: undefined,
          },
          { transaction }
        );
        stats.transportation++;
      }
    }

    if (
      importData.standaloneCarRentals &&
      Array.isArray(importData.standaloneCarRentals)
    ) {
      for (const carRental of importData.standaloneCarRentals) {
        await CarRental.create(
          {
            ...carRental,
            userId,
            tripId: null,
            id: undefined,
          },
          { transaction }
        );
        stats.carRentals++;
      }
    }

    if (importData.standaloneEvents && Array.isArray(importData.standaloneEvents)) {
      for (const event of importData.standaloneEvents) {
        await Event.create(
          {
            ...event,
            userId,
            tripId: null,
            id: undefined,
          },
          { transaction }
        );
        stats.events++;
      }
    }

    // Import vouchers (frontend already filtered to selected items)
    if (importData.vouchers && Array.isArray(importData.vouchers)) {
      for (const voucher of importData.vouchers) {
        // Don't include parentVoucherId since parent vouchers won't exist in new database
        const { parentVoucherId, ...voucherData } = voucher;

        await Voucher.create(
          {
            ...voucherData,
            userId,
            id: undefined,
            parentVoucherId: null, // Clear parent reference on import
          },
          { transaction }
        );
        stats.vouchers++;
      }
    }

    // Import companions (frontend already filtered to selected items)
    if (importData.companions && Array.isArray(importData.companions)) {
      for (const companion of importData.companions) {
        // Don't include userId from imported companion (it references old database)
        const { userId: importedUserId, ...companionData } = companion;

        await TravelCompanion.create(
          {
            ...companionData,
            createdBy: userId,
            id: undefined,
            userId: null, // Clear user link on import
          },
          { transaction }
        );
        stats.companions++;
      }
    }

    // Commit transaction
    await transaction.commit();

    logger.info(`User ${userId} imported data:`, stats);
    res.json({
      success: true,
      message: 'Data imported successfully',
      stats,
    });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    logger.error('Error importing selected data:', error);
    res.status(500).json({ success: false, error: 'Error importing data' });
  }
};
