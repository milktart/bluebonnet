module.exports = (sequelize, DataTypes) => {
  const VoucherAttachment = sequelize.define(
    'VoucherAttachment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      voucherId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vouchers',
          key: 'id',
        },
      },
      flightId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'flights',
          key: 'id',
        },
      },
      travelerId: {
        type: DataTypes.UUID,
        allowNull: false, // References either a User or TravelCompanion
      },
      travelerType: {
        type: DataTypes.ENUM('USER', 'COMPANION'),
        allowNull: false, // Discriminator to know which table travelerId references
      },
      attachmentValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Null for certificate types (upgrade, companion) that don't have monetary values
      },
      attachmentDate: {
        type: DataTypes.DATE,
        allowNull: true, // Date when voucher was actually redeemed
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true, // e.g., "Outbound leg only", "Confirmation #ABC123"
      },
    },
    {
      tableName: 'voucher_attachments',
      timestamps: true,
      indexes: [
        {
          fields: ['voucherId'],
        },
        {
          fields: ['flightId'],
        },
        {
          fields: ['travelerId', 'travelerType'],
        },
      ],
    }
  );

  VoucherAttachment.associate = (models) => {
    // Attachment belongs to a voucher
    VoucherAttachment.belongsTo(models.Voucher, {
      foreignKey: 'voucherId',
      as: 'voucher',
    });

    // Attachment belongs to a flight
    VoucherAttachment.belongsTo(models.Flight, {
      foreignKey: 'flightId',
      as: 'flight',
    });

    // Note: We'll handle the polymorphic relationship manually in the controller
    // since travelerId can reference either User or TravelCompanion
  };

  return VoucherAttachment;
};
