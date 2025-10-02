// src/models/index.ts
import sequelize from '../config/database';

// Importa todas las clases (asegura que .init ya corrió)
export * from './rol';
export * from './sites';
export * from './status';
export * from './user';
export * from './raspberry';
export * from './usersites';
export * from './raspberryconnections';
export * from './sensordata';
export * from './statuslog';
export * from './passwordresettoken';

import { initModels } from './init-models';

// Ejecuta asociaciones una sola vez
initModels(sequelize);
