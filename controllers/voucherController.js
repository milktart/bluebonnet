const db = require('../models');
const { Voucher, VoucherAttachment, Flight, User, TravelCompanion } = db;
const { Sequelize } = require('sequelize');

// Create a new voucher
exports.createVoucher = async (req, res) => {
  try {
    const {
      type,
      issuer,
      voucherNumber,
      associatedAccount,
      pinCode,
      currency,
      totalValue,
      expirationDate,
      notes,
      userId
    } = req.body;

    // Validate required fields
    if (!type || !issuer || !voucherNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, issuer, voucherNumber'
      });
    }

    // Certificate types (UPGRADE_CERT, COMPANION_CERT) don't require totalValue
    const certificateTypes = ['UPGRADE_CERT', 'COMPANION_CERT'];
    const valueRequiredTypes = ['TRAVEL_CREDIT', 'GIFT_CARD', 'MISC'];

    // Validate totalValue for types that require it
    if (valueRequiredTypes.includes(type) && !totalValue) {
      return res.status(400).json({
        success: false,
        message: `${type} requires a totalValue`
      });
    }

    // For owner-bound types, ensure userId is provided
    const ownerBoundTypes = ['TRAVEL_CREDIT', 'COMPANION_CERT', 'GIFT_CARD'];
    if (ownerBoundTypes.includes(type) && !userId) {
      return res.status(400).json({
        success: false,
        message: `${type} requires a userId (owner)`
      });
    }

    // Check if voucher number already exists
    const existingVoucher = await Voucher.findOne({
      where: { voucherNumber }
    });

    if (existingVoucher) {
      return res.status(409).json({
        success: false,
        message: 'Voucher number already exists'
      });
    }

    // Create the voucher
    const voucher = await Voucher.create({
      type,
      issuer,
      voucherNumber,
      associatedAccount,
      pinCode, // In production, this should be encrypted
      currency,
      totalValue,
      expirationDate,
      notes,
      userId: ownerBoundTypes.includes(type) ? userId : null,
      status: 'OPEN'
    });

    res.status(201).json({
      success: true,
      data: voucher,
      message: 'Voucher created successfully'
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating voucher',
      error: error.message
    });
  }
};

// Get all vouchers for a user
exports.getUserVouchers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type, includeExpired } = req.query;

    const where = {
      [Sequelize.Op.or]: [
        { userId: userId }, // Owner-bound vouchers
        { userId: null } // Non-owner-bound vouchers accessible to all users
      ]
    };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by type if provided
    if (type) {
      where.type = type;
    }

    // Filter out expired vouchers unless explicitly included
    if (includeExpired !== 'true') {
      where.expirationDate = {
        [Sequelize.Op.or]: [
          { [Sequelize.Op.gte]: new Date() },
          { [Sequelize.Op.is]: null }
        ]
      };
    }

    const vouchers = await Voucher.findAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: VoucherAttachment,
          as: 'attachments',
          attributes: ['id', 'flightId', 'attachmentValue', 'attachmentDate']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate remaining balance for each voucher
    const vouchersWithBalance = vouchers.map(voucher => {
      const voucherData = voucher.toJSON();
      voucherData.remainingBalance = voucher.getRemainingBalance();
      voucherData.daysUntilExpiration = voucher.getDaysUntilExpiration();
      voucherData.isExpired = voucher.getIsExpired();
      return voucherData;
    });

    res.json({
      success: true,
      data: vouchersWithBalance,
      count: vouchersWithBalance.length
    });
  } catch (error) {
    console.error('Error fetching user vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vouchers',
      error: error.message
    });
  }
};

// Get a single voucher by ID
exports.getVoucherById = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;

    const voucher = await Voucher.findByPk(voucherId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: VoucherAttachment,
          as: 'attachments',
          include: [
            {
              model: Flight,
              as: 'flight',
              attributes: ['id', 'flightNumber', 'airline', 'departureDateTime', 'arrivalDateTime']
            }
          ]
        },
        {
          model: Voucher,
          as: 'parentVoucher',
          attributes: ['id', 'voucherNumber', 'totalValue']
        },
        {
          model: Voucher,
          as: 'replacementVouchers',
          attributes: ['id', 'voucherNumber', 'totalValue', 'status']
        }
      ]
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check authorization: user must be owner or voucher must be non-owner-bound
    if (voucher.userId && voucher.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this voucher'
      });
    }

    const voucherData = voucher.toJSON();
    voucherData.remainingBalance = voucher.getRemainingBalance();
    voucherData.daysUntilExpiration = voucher.getDaysUntilExpiration();
    voucherData.isExpired = voucher.getIsExpired();

    res.json({
      success: true,
      data: voucherData
    });
  } catch (error) {
    console.error('Error fetching voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching voucher',
      error: error.message
    });
  }
};

// Update a voucher
exports.updateVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;
    const {
      status,
      associatedAccount,
      expirationDate,
      notes,
      usedAmount
    } = req.body;

    const voucher = await Voucher.findByPk(voucherId);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check authorization
    if (voucher.userId && voucher.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this voucher'
      });
    }

    // Update fields
    if (status) voucher.status = status;
    if (associatedAccount !== undefined) voucher.associatedAccount = associatedAccount;
    if (expirationDate !== undefined) voucher.expirationDate = expirationDate;
    if (notes !== undefined) voucher.notes = notes;
    if (usedAmount !== undefined) voucher.usedAmount = usedAmount;

    await voucher.save();

    res.json({
      success: true,
      data: voucher,
      message: 'Voucher updated successfully'
    });
  } catch (error) {
    console.error('Error updating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating voucher',
      error: error.message
    });
  }
};

// Delete a voucher
exports.deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;

    const voucher = await Voucher.findByPk(voucherId);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check authorization
    if (voucher.userId && voucher.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this voucher'
      });
    }

    await voucher.destroy();

    res.json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting voucher',
      error: error.message
    });
  }
};

// Reissue remaining balance (partial redemption)
exports.reissueRemainder = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.user.id;

    const voucher = await Voucher.findByPk(voucherId);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check authorization
    if (voucher.userId && voucher.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reissue this voucher'
      });
    }

    const remainingBalance = voucher.getRemainingBalance();

    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No remaining balance to reissue'
      });
    }

    // Create new voucher with remaining balance
    const newVoucher = await Voucher.create({
      type: voucher.type,
      issuer: voucher.issuer,
      voucherNumber: `${voucher.voucherNumber}-REISSUE-${Date.now()}`,
      associatedAccount: voucher.associatedAccount,
      pinCode: voucher.pinCode,
      currency: voucher.currency,
      totalValue: remainingBalance,
      usedAmount: 0,
      expirationDate: voucher.expirationDate,
      parentVoucherId: voucherId,
      userId: voucher.userId,
      status: 'OPEN',
      notes: `Reissued from voucher ${voucher.voucherNumber} (Remaining Balance)`
    });

    // Mark original as PARTIALLY_USED
    voucher.status = 'PARTIALLY_USED';
    await voucher.save();

    res.json({
      success: true,
      data: {
        originalVoucher: voucher,
        newVoucher: newVoucher
      },
      message: 'Voucher reissued successfully'
    });
  } catch (error) {
    console.error('Error reissuing voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Error reissuing voucher',
      error: error.message
    });
  }
};

// Get available vouchers for a specific flight
exports.getAvailableVouchersForFlight = async (req, res) => {
  try {
    const { flightId } = req.params;
    const userId = req.user.id;

    // Get flight details to check trip
    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    // Get available vouchers (OPEN or PARTIALLY_USED)
    const vouchers = await Voucher.findAll({
      where: {
        status: ['OPEN', 'PARTIALLY_USED'],
        [Sequelize.Op.or]: [
          { userId: userId },
          { userId: null }
        ]
      },
      include: [
        {
          model: VoucherAttachment,
          as: 'attachments',
          attributes: ['id', 'attachmentValue']
        }
      ]
    });

    // Calculate remaining balance and filter out expired
    const availableVouchers = vouchers
      .filter(v => !v.getIsExpired())
      .map(v => {
        const voucherData = v.toJSON();
        voucherData.remainingBalance = v.getRemainingBalance();
        voucherData.daysUntilExpiration = v.getDaysUntilExpiration();
        return voucherData;
      });

    res.json({
      success: true,
      data: availableVouchers,
      count: availableVouchers.length
    });
  } catch (error) {
    console.error('Error fetching available vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available vouchers',
      error: error.message
    });
  }
};
