/**
 * Sequelize Models Type Declarations
 */

import { Sequelize } from 'sequelize';

declare const db: {
  sequelize: Sequelize;
  [key: string]: any;
};

export default db;
