const db = require('../models');
const { VoucherAttachment, Voucher, Flight, User, TravelCompanion } = db;

// Attach multiple vouchers to a flight
exports.attachMultipleVouchers = async (req, res) => {
  try {
    const { flightId } = req.params;
    const userId = req.user.id;
    const {
      attachments,
      notes
    } = req.body;

    // Validate required fields
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: attachments array'
      });
    }

    // Get flight and verify user access
    const flight = await Flight.findByPk(flightId, {
      include: [
        {
          model: db.Trip,
          as: 'trip',
          attributes: ['id', 'userId']
        }
      ]
    });

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    // Check if user owns the trip
    if (flight.trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this trip'
      });
    }

    // Certificate types
    const certificateTypes = ['UPGRADE_CERT', 'REGIONAL_UPGRADE_CERT', 'GLOBAL_UPGRADE_CERT', 'COMPANION_CERT'];
    const createdAttachments = [];

    // Process each attachment
    for (const attachment of attachments) {
      const { voucherId, travelerId, travelerType, attachmentValue } = attachment;

      // Validate required fields for this attachment
      if (!voucherId || !travelerId || !travelerType) {
        console.error('Missing required fields:', { voucherId, travelerId, travelerType });
        return res.status(400).json({
          success: false,
          message: `Each attachment must have voucherId, travelerId, and travelerType. Received: voucherId=${voucherId}, travelerId=${travelerId}, travelerType=${travelerType}`
        });
      }

      // Validate they're not the string "undefined"
      if (voucherId === 'undefined' || travelerId === 'undefined' || travelerType === 'undefined') {
        return res.status(400).json({
          success: false,
          message: `Invalid attachment data - received "undefined" as string. voucherId=${voucherId}, travelerId=${travelerId}, travelerType=${travelerType}`
        });
      }

      // Validate travelerType
      if (!['USER', 'COMPANION'].includes(travelerType)) {
        return res.status(400).json({
          success: false,
          message: 'travelerType must be either USER or COMPANION'
        });
      }

      // Validate traveler exists
      let traveler;
      if (travelerType === 'USER') {
        traveler = await User.findByPk(travelerId);
        if (!traveler) {
          return res.status(404).json({
            success: false,
            message: `Traveler (User) ${travelerId} not found`
          });
        }
      } else if (travelerType === 'COMPANION') {
        traveler = await TravelCompanion.findByPk(travelerId);
        if (!traveler) {
          return res.status(404).json({
            success: false,
            message: `Traveler (Companion) ${travelerId} not found`
          });
        }
      }

      // Get voucher and verify ownership/access
      const voucher = await Voucher.findByPk(voucherId);

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: `Voucher ${voucherId} not found`
        });
      }

      // Check voucher ownership
      if (voucher.userId && voucher.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: `Unauthorized: You do not own voucher ${voucherId}`
        });
      }

      // Validate voucher can be attached
      if (voucher.status === 'USED' || voucher.status === 'EXPIRED' || voucher.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: `Cannot attach voucher ${voucherId} with status: ${voucher.status}`
        });
      }

      if (voucher.getIsExpired()) {
        return res.status(400).json({
          success: false,
          message: `Voucher ${voucherId} is expired`
        });
      }

      // Validate attachment value
      if (!certificateTypes.includes(voucher.type)) {
        if (!attachmentValue || attachmentValue <= 0) {
          return res.status(400).json({
            success: false,
            message: `Attachment value must be greater than 0 for voucher ${voucherId}`
          });
        }

        const remainingBalance = voucher.getRemainingBalance();
        if (attachmentValue > remainingBalance) {
          return res.status(400).json({
            success: false,
            message: `Attachment value for voucher ${voucherId} exceeds remaining balance (${remainingBalance})`
          });
        }
      }

      // Create the attachment
      const newAttachment = await VoucherAttachment.create({
        voucherId,
        flightId,
        travelerId,
        travelerType,
        attachmentValue: attachmentValue || null,
        notes,
        attachmentDate: new Date()
      });

      // Update voucher based on type
      if (certificateTypes.includes(voucher.type)) {
        voucher.status = 'USED';
        await voucher.save();
      } else if (voucher.totalValue) {
        const newUsedAmount = parseFloat(voucher.usedAmount || 0) + parseFloat(attachmentValue);
        const remainingBalance = voucher.totalValue - newUsedAmount;

        // Check if this is a partial use (remaining balance > 0)
        if (remainingBalance > 0) {
          // Mark original voucher as fully used
          voucher.usedAmount = voucher.totalValue;
          voucher.status = 'USED';
          await voucher.save();

          // Create a new voucher with the remaining balance
          // The new voucher number will need to be provided by the user
          const newVoucher = await Voucher.create({
            type: voucher.type,
            issuer: voucher.issuer,
            voucherNumber: `${voucher.voucherNumber}-PARTIAL`, // Temporary, will be replaced by user input
            currency: voucher.currency,
            totalValue: remainingBalance,
            usedAmount: 0,
            status: 'OPEN',
            expirationDate: voucher.expirationDate,
            associatedAccount: voucher.associatedAccount,
            pinCode: voucher.pinCode,
            notes: `Partial split from ${voucher.voucherNumber}`,
            parentVoucherId: voucher.id, // Track parent voucher
            userId: userId
          });

          // Mark attachment with info about the new partial voucher
          newAttachment.notes = newAttachment.notes || '';
          if (newAttachment.notes) {
            newAttachment.notes += ` [New partial credit created: ${newVoucher.id}]`;
          } else {
            newAttachment.notes = `New partial credit created: ${newVoucher.id}`;
          }
          await newAttachment.save();
        } else {
          // Fully used
          voucher.usedAmount = newUsedAmount;
          voucher.status = 'USED';
          await voucher.save();
        }
      }

      createdAttachments.push(newAttachment);
    }

    // Fetch all created attachments with related data
    const populatedAttachments = await VoucherAttachment.findAll({
      where: {
        id: createdAttachments.map(a => a.id)
      },
      include: [
        {
          model: Voucher,
          as: 'voucher'
        },
        {
          model: Flight,
          as: 'flight',
          attributes: ['id', 'flightNumber', 'airline', 'departureDateTime', 'arrivalDateTime', 'origin', 'destination']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: populatedAttachments,
      message: `${populatedAttachments.length} voucher(s) attached to flight successfully`,
      partialVouchers: populatedAttachments
        .filter(att => att.notes && att.notes.includes('New partial credit created:'))
        .map(att => ({
          attachmentId: att.id,
          originalVoucherId: att.voucherId,
          notes: att.notes
        }))
    });
  } catch (error) {
    console.error('Error attaching multiple vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Error attaching vouchers',
      error: error.message
    });
  }
};

// Attach a voucher to a flight
exports.attachVoucher = async (req, res) => {
  try {
    const { flightId } = req.params;
    const userId = req.user.id;
    const {
      voucherId,
      travelerId,
      travelerType,
      attachmentValue,
      notes
    } = req.body;

    // Validate required fields
    if (!voucherId || !travelerId || !travelerType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: voucherId, travelerId, travelerType'
      });
    }

    // Validate travelerType
    if (!['USER', 'COMPANION'].includes(travelerType)) {
      return res.status(400).json({
        success: false,
        message: 'travelerType must be either USER or COMPANION'
      });
    }

    // Get flight and verify user access
    const flight = await Flight.findByPk(flightId, {
      include: [
        {
          model: db.Trip,
          as: 'trip',
          attributes: ['id', 'userId']
        }
      ]
    });

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    // Check if user owns the trip
    if (flight.trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this trip'
      });
    }

    // Get voucher and verify ownership/access
    const voucher = await Voucher.findByPk(voucherId);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check voucher ownership (for owner-bound vouchers)
    if (voucher.userId && voucher.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this voucher'
      });
    }

    // Validate voucher can be attached
    if (voucher.status === 'USED' || voucher.status === 'EXPIRED' || voucher.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot attach voucher with status: ${voucher.status}`
      });
    }

    if (voucher.getIsExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot attach expired voucher'
      });
    }

    // Certificate types (UPGRADE_CERT, REGIONAL_UPGRADE_CERT, GLOBAL_UPGRADE_CERT, COMPANION_CERT) don't require attachment value
    const certificateTypes = ['UPGRADE_CERT', 'REGIONAL_UPGRADE_CERT', 'GLOBAL_UPGRADE_CERT', 'COMPANION_CERT'];

    if (!certificateTypes.includes(voucher.type)) {
      // For credit/card types, validate attachment value
      if (!attachmentValue || attachmentValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Attachment value must be greater than 0 for this voucher type'
        });
      }

      const remainingBalance = voucher.getRemainingBalance();
      if (attachmentValue > remainingBalance) {
        return res.status(400).json({
          success: false,
          message: `Attachment value (${attachmentValue}) exceeds remaining balance (${remainingBalance})`
        });
      }
    }

    // Validate traveler exists
    let traveler;
    if (travelerType === 'USER') {
      traveler = await User.findByPk(travelerId);
      if (!traveler) {
        return res.status(404).json({
          success: false,
          message: 'Traveler (User) not found'
        });
      }
    } else if (travelerType === 'COMPANION') {
      traveler = await TravelCompanion.findByPk(travelerId);
      if (!traveler) {
        return res.status(404).json({
          success: false,
          message: 'Traveler (Companion) not found'
        });
      }
    }

    // Create the attachment
    const attachment = await VoucherAttachment.create({
      voucherId,
      flightId,
      travelerId,
      travelerType,
      attachmentValue,
      notes,
      attachmentDate: new Date()
    });

    // Update voucher based on type
    if (certificateTypes.includes(voucher.type)) {
      // For certificate types, mark as USED immediately when attached
      // Certificates can only be used once
      voucher.status = 'USED';
      await voucher.save();
    } else if (voucher.totalValue) {
      // For credit/card types, update usedAmount and check if fully used
      voucher.usedAmount = parseFloat(voucher.usedAmount || 0) + parseFloat(attachmentValue);

      // Update status if now fully used
      if (voucher.usedAmount >= voucher.totalValue) {
        voucher.status = 'USED';
      }

      await voucher.save();
    }

    // Fetch the attachment with related data
    const populatedAttachment = await VoucherAttachment.findByPk(attachment.id, {
      include: [
        {
          model: Voucher,
          as: 'voucher'
        },
        {
          model: Flight,
          as: 'flight',
          attributes: ['id', 'flightNumber', 'airline', 'departureDateTime', 'arrivalDateTime', 'origin', 'destination']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: populatedAttachment,
      message: 'Voucher attached to flight successfully'
    });
  } catch (error) {
    console.error('Error attaching voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Error attaching voucher',
      error: error.message
    });
  }
};

// Get attachments for a flight
exports.getFlightAttachments = async (req, res) => {
  try {
    const { flightId } = req.params;

    const attachments = await VoucherAttachment.findAll({
      where: { flightId },
      include: [
        {
          model: Voucher,
          as: 'voucher',
          attributes: ['id', 'type', 'issuer', 'voucherNumber', 'currency', 'totalValue', 'usedAmount', 'status']
        },
        {
          model: Flight,
          as: 'flight',
          attributes: ['id', 'flightNumber', 'airline', 'departureDateTime', 'arrivalDateTime', 'origin', 'destination']
        }
      ]
    });

    // Augment with traveler info
    const augmentedAttachments = await Promise.all(
      attachments.map(async (att) => {
        const attData = att.toJSON();

        if (att.travelerType === 'USER') {
          const user = await User.findByPk(att.travelerId, {
            attributes: ['id', 'firstName', 'lastName', 'email']
          });
          attData.traveler = user;
        } else if (att.travelerType === 'COMPANION') {
          const companion = await TravelCompanion.findByPk(att.travelerId, {
            attributes: ['id', 'name', 'email']
          });
          attData.traveler = companion;
        }

        return attData;
      })
    );

    res.json({
      success: true,
      data: augmentedAttachments,
      count: augmentedAttachments.length
    });
  } catch (error) {
    console.error('Error fetching flight attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flight attachments',
      error: error.message
    });
  }
};

// Update partial voucher number after split
exports.updatePartialVoucherNumber = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;
    const { newVoucherNumber } = req.body;

    if (!newVoucherNumber || !newVoucherNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New voucher number is required'
      });
    }

    const voucher = await Voucher.findByPk(voucherId);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Partial voucher not found'
      });
    }

    // Verify user ownership
    if (voucher.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this voucher'
      });
    }

    // Check if this is a partial voucher (has parentVoucherId and temporary number)
    if (!voucher.parentVoucherId || !voucher.voucherNumber.includes('-PARTIAL')) {
      return res.status(400).json({
        success: false,
        message: 'This is not a partial voucher that needs a new number'
      });
    }

    // Update the voucher number
    voucher.voucherNumber = newVoucherNumber.trim();
    await voucher.save();

    res.json({
      success: true,
      data: voucher,
      message: 'Partial voucher number updated successfully'
    });
  } catch (error) {
    console.error('Error updating partial voucher number:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating partial voucher number',
      error: error.message
    });
  }
};

// Remove a voucher attachment
exports.removeAttachment = async (req, res) => {
  try {
    const { flightId, attachmentId } = req.params;
    const userId = req.user.id;

    // Get attachment
    const attachment = await VoucherAttachment.findByPk(attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    if (attachment.flightId !== flightId) {
      return res.status(400).json({
        success: false,
        message: 'Attachment does not belong to this flight'
      });
    }

    // Get flight to verify user owns trip
    const flight = await Flight.findByPk(flightId, {
      include: [
        {
          model: db.Trip,
          as: 'trip',
          attributes: ['id', 'userId']
        }
      ]
    });

    if (flight.trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this trip'
      });
    }

    // Get voucher to update its used amount
    const voucher = await Voucher.findByPk(attachment.voucherId);
    const certificateTypes = ['UPGRADE_CERT', 'REGIONAL_UPGRADE_CERT', 'GLOBAL_UPGRADE_CERT', 'COMPANION_CERT'];

    // Remove attachment
    await attachment.destroy();

    // Update voucher based on type
    if (certificateTypes.includes(voucher.type)) {
      // For certificate types, mark back to OPEN when attachment is removed
      voucher.status = 'OPEN';
    } else {
      // For credit/card types, update used amount
      voucher.usedAmount = parseFloat(voucher.usedAmount) - parseFloat(attachment.attachmentValue);

      // Update status if no longer fully used
      if (voucher.status === 'USED' && voucher.usedAmount < voucher.totalValue) {
        voucher.status = 'OPEN';
      }
    }

    await voucher.save();

    res.json({
      success: true,
      message: 'Voucher attachment removed successfully'
    });
  } catch (error) {
    console.error('Error removing attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing attachment',
      error: error.message
    });
  }
};

// Update an attachment
exports.updateAttachment = async (req, res) => {
  try {
    const { flightId, attachmentId } = req.params;
    const userId = req.user.id;
    const { attachmentValue, notes } = req.body;

    const attachment = await VoucherAttachment.findByPk(attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    if (attachment.flightId !== flightId) {
      return res.status(400).json({
        success: false,
        message: 'Attachment does not belong to this flight'
      });
    }

    // Get flight to verify user owns trip
    const flight = await Flight.findByPk(flightId, {
      include: [
        {
          model: db.Trip,
          as: 'trip',
          attributes: ['id', 'userId']
        }
      ]
    });

    if (flight.trip.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this trip'
      });
    }

    const oldValue = parseFloat(attachment.attachmentValue);
    const newValue = attachmentValue ? parseFloat(attachmentValue) : oldValue;

    // Validate new value
    if (newValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Attachment value must be greater than 0'
      });
    }

    // Get voucher and validate new value doesn't exceed remaining balance
    const voucher = await Voucher.findByPk(attachment.voucherId);
    const remainingBalance = voucher.getRemainingBalance();
    const potentialUsed = parseFloat(voucher.usedAmount) - oldValue + newValue;

    if (potentialUsed > voucher.totalValue) {
      return res.status(400).json({
        success: false,
        message: `New attachment value would exceed voucher total value`
      });
    }

    // Update attachment
    attachment.attachmentValue = newValue;
    if (notes !== undefined) {
      attachment.notes = notes;
    }
    await attachment.save();

    // Update voucher used amount
    voucher.usedAmount = potentialUsed;
    if (voucher.usedAmount >= voucher.totalValue) {
      voucher.status = 'USED';
    } else if (voucher.status === 'USED') {
      voucher.status = 'OPEN';
    }
    await voucher.save();

    // Fetch updated attachment with relations
    const updatedAttachment = await VoucherAttachment.findByPk(attachmentId, {
      include: [
        {
          model: Voucher,
          as: 'voucher'
        },
        {
          model: Flight,
          as: 'flight',
          attributes: ['id', 'flightNumber', 'airline', 'departureDateTime', 'arrivalDateTime']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedAttachment,
      message: 'Attachment updated successfully'
    });
  } catch (error) {
    console.error('Error updating attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attachment',
      error: error.message
    });
  }
};
