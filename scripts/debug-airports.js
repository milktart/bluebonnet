#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Airport Debugging Script
 * Checks airport database status and tests search functionality
 */

const { Airport } = require('../models');
const airportService = require('../services/airportService');

async function debugAirports() {
  try {
    console.log('\n=== AIRPORT DEBUG DIAGNOSTICS ===\n');

    // 1. Check database connection
    console.log('1. Checking database connection...');
    const count = await Airport.count();
    console.log(`   ✓ Database connected`);
    console.log(`   → Airports in database: ${count}`);

    if (count === 0) {
      console.log('\n   ❌ ERROR: No airports in database!');
      console.log('   → Run: docker compose exec app node scripts/seed-airports.js');
      process.exit(1);
    }

    // 2. Test direct database query
    console.log('\n2. Testing direct database query...');
    const sampleAirport = await Airport.findOne({ where: { iata: 'LAX' } });
    if (sampleAirport) {
      console.log('   ✓ Found LAX:', sampleAirport.toJSON());
    } else {
      console.log('   ⚠ LAX not found in database');
    }

    // 3. Test airportService.searchAirports()
    console.log('\n3. Testing airportService.searchAirports()...');
    const searchResults = await airportService.searchAirports('LAX', 5);
    console.log(`   → Search results (${searchResults.length} found):`);
    searchResults.forEach((airport) => {
      console.log(`      - ${airport.iata} - ${airport.city}, ${airport.country}`);
    });

    // 4. Test airportService.getAirportByCode()
    console.log('\n4. Testing airportService.getAirportByCode()...');
    const jfk = await airportService.getAirportByCode('JFK');
    if (jfk) {
      console.log('   ✓ Found JFK:', jfk.toJSON());
    } else {
      console.log('   ⚠ JFK not found');
    }

    // 5. Test search endpoint response format
    console.log('\n5. Testing search result formatting...');
    const results = searchResults.map((airport) => ({
      iata: airport.iata,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      timezone: airport.timezone,
      label: `${airport.iata} - ${airport.city}, ${airport.country}`,
      value: airport.iata,
    }));
    console.log('   → Formatted results:');
    console.log(JSON.stringify(results, null, 2));

    console.log('\n=== ALL CHECKS PASSED ✓ ===\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugAirports();
