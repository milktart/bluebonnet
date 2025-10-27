const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Trip = require('./Trip')(sequelize, Sequelize);
db.Flight = require('./Flight')(sequelize, Sequelize);
db.Hotel = require('./Hotel')(sequelize, Sequelize);
db.Transportation = require('./Transportation')(sequelize, Sequelize);
db.CarRental = require('./CarRental')(sequelize, Sequelize);
db.Event = require('./Event')(sequelize, Sequelize);
db.TravelCompanion = require('./TravelCompanion')(sequelize, Sequelize);
db.TripCompanion = require('./TripCompanion')(sequelize, Sequelize);
db.Voucher = require('./Voucher')(sequelize, Sequelize);
db.VoucherAttachment = require('./VoucherAttachment')(sequelize, Sequelize);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;