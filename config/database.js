require('dotenv').config();

// Database configuration defaults
const DB_HOST_DEFAULT = 'localhost';
const DB_PORT_DEFAULT = 5432;
const POOL_ACQUIRE_TIMEOUT = parseInt(process.env.POOL_ACQUIRE_TIMEOUT, 10) || 30000;
const POOL_IDLE_TIMEOUT = parseInt(process.env.POOL_IDLE_TIMEOUT, 10) || 10000;

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'dev_travel_planner',
    host: process.env.DB_HOST || DB_HOST_DEFAULT,
    port: process.env.DB_PORT || DB_PORT_DEFAULT,
    dialect: 'postgres',
    logging: false, // Set to console.log for debugging
    timezone: '+00:00',
    dialectOptions: {
      timezone: 'Etc/GMT-0',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: POOL_ACQUIRE_TIMEOUT,
      idle: POOL_IDLE_TIMEOUT,
    },
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'test_travel_planner',
    host: process.env.DB_HOST || DB_HOST_DEFAULT,
    port: process.env.DB_PORT || DB_PORT_DEFAULT,
    dialect: 'postgres',
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
      timezone: 'Etc/GMT-0',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    pool: {
      max: 5,
      min: 0,
      acquire: POOL_ACQUIRE_TIMEOUT,
      idle: POOL_IDLE_TIMEOUT,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || DB_PORT_DEFAULT,
    dialect: 'postgres',
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
      timezone: 'Etc/GMT-0',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // Only require SSL if host is not localhost (for Docker deployments)
      ...(process.env.DB_HOST &&
      process.env.DB_HOST !== 'postgres' &&
      process.env.DB_HOST !== 'localhost'
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {}),
    },
    pool: {
      max: 10,
      min: 2,
      acquire: POOL_ACQUIRE_TIMEOUT,
      idle: POOL_IDLE_TIMEOUT,
    },
  },
  prod: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || DB_PORT_DEFAULT,
    dialect: 'postgres',
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
      timezone: 'Etc/GMT-0',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // Only require SSL if host is not localhost (for Docker deployments)
      ...(process.env.DB_HOST &&
      process.env.DB_HOST !== 'postgres' &&
      process.env.DB_HOST !== 'localhost'
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {}),
    },
    pool: {
      max: 10,
      min: 2,
      acquire: POOL_ACQUIRE_TIMEOUT,
      idle: POOL_IDLE_TIMEOUT,
    },
  },
};
