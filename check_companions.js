const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'travel_planner',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    dialect: 'postgres',
    logging: false
  }
);

async function checkCompanions() {
  try {
    console.log(`\nConnecting to ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}...`);
    
    const result = await sequelize.query(
      'SELECT * FROM "TravelCompanions"',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n=== TravelCompanions table ===');
    if (result.length === 0) {
      console.log('❌ No companions found in database');
    } else {
      console.log(`✓ Found ${result.length} companions:`);
      console.table(result);
    }
    
    await sequelize.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkCompanions();
