// src/models/index.ts

// 1. Importar todos los modelos
import '../models'

import { User } from '../models/User';
import { Rol } from '../models/Rol';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { Site } from '../models/Site';
import { Raspberry } from '../models/Raspberry';
import { Status } from '../models/Status';
import { SensorData } from '../models/SensorData';
import { StatusLog } from '../models/StatusLog';

// 2. Definir todas las asociaciones

// Un Rol tiene muchos Usuarios | Un Usuario pertenece a un Rol
Rol.hasMany(User, { foreignKey: 'idRol' });
User.belongsTo(Rol, { foreignKey: 'idRol' });

// Un Usuario tiene muchos Tokens | Un Token pertenece a un Usuario
User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Un Sitio tiene muchas Raspberries | Una Raspberry pertenece a un Sitio
Site.hasMany(Raspberry, { foreignKey: 'siteId' });
Raspberry.belongsTo(Site, { foreignKey: 'siteId' });

// Un Estado puede estar en muchas Raspberries | Una Raspberry tiene un Estado
Status.hasMany(Raspberry, { foreignKey: 'statusId' });
Raspberry.belongsTo(Status, { foreignKey: 'statusId' });

// Una Raspberry tiene muchos datos de sensores | Un dato de sensor pertenece a una Raspberry
Raspberry.hasMany(SensorData, { foreignKey: 'raspberryID' });
SensorData.belongsTo(Raspberry, { foreignKey: 'raspberryID' });

// Una Raspberry tiene muchos logs de estado | Un log de estado pertenece a una Raspberry
Raspberry.hasMany(StatusLog, { foreignKey: 'raspberryID' });
StatusLog.belongsTo(Raspberry, { foreignKey: 'raspberryID' });

// Un Estado puede estar en muchos logs | Un log de estado tiene un Estado
Status.hasMany(StatusLog, { foreignKey: 'statusID' });
StatusLog.belongsTo(Status, { foreignKey: 'statusID' });

// Un Usuario puede tener muchos Sitios | Un Sitio puede tener muchos Usuarios (Muchos a Muchos)
User.belongsToMany(Site, {
  through: 'UserSites',
  foreignKey: 'idUser',
  otherKey: 'idSite',
});
Site.belongsToMany(User, {
  through: 'UserSites',
  foreignKey: 'idSite',
  otherKey: 'idUser',
});

// Una Raspberry se conecta con muchas otras Raspberries (Muchos a Muchos)
Raspberry.belongsToMany(Raspberry, {
  through: 'RaspberryConnections',
  as: 'connectedTo', // Alias para la relación
  foreignKey: 'raspberryID_A',
  otherKey: 'raspberryID_B',
});


// 3. Exportar todos los modelos
export {
  User,
  Rol,
  PasswordResetToken,
  Site,
  Raspberry,
  Status,
  SensorData,
  StatusLog,
};