// 1. Importar todos los modelos
import { User } from './User';
import { Rol } from './Rol';
import { PasswordResetToken } from './PasswordResetToken';
import { Site } from './Site';
import { Raspberry } from './Raspberry';
import { Status } from './Status';
import { SensorData } from './SensorData';
import { StatusLog } from './StatusLog';

// 2. Definir todas las asociaciones
console.log('Definiendo asociaciones de modelos...');

// --- Relaciones Uno a Muchos ---

// Rol <-> User
Rol.hasMany(User, { foreignKey: 'idRol' });
User.belongsTo(Rol, { foreignKey: 'idRol' });

// User <-> PasswordResetToken
User.hasMany(PasswordResetToken, { foreignKey: 'userId' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

// Site <-> Raspberry
Site.hasMany(Raspberry, { foreignKey: 'siteId' });
Raspberry.belongsTo(Site, { foreignKey: 'siteId' });

// Status <-> Raspberry (Para el estado actual)
Status.hasMany(Raspberry, { foreignKey: 'statusId' });
Raspberry.belongsTo(Status, { foreignKey: 'statusId' });

// Raspberry <-> SensorData
Raspberry.hasMany(SensorData, { foreignKey: 'raspberryID' });
SensorData.belongsTo(Raspberry, { foreignKey: 'raspberryID' });

// Raspberry <-> StatusLog
Raspberry.hasMany(StatusLog, { foreignKey: 'raspberryID' });
StatusLog.belongsTo(Raspberry, { foreignKey: 'raspberryID' });

// Status <-> StatusLog
Status.hasMany(StatusLog, { foreignKey: 'statusID' });
StatusLog.belongsTo(Status, { foreignKey: 'statusID' });

// --- Relaciones Muchos a Muchos ---

// User <-> Site (a través de la tabla UserSites)
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

// Raspberry <-> Raspberry (a través de RaspberryConnections para la red mesh)
Raspberry.belongsToMany(Raspberry, {
  through: 'RaspberryConnections',
  as: 'connectedDevices', // Alias para la relación
  foreignKey: 'raspberryID_A',
  otherKey: 'raspberryID_B',
});

console.log('Asociaciones definidas exitosamente.');

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