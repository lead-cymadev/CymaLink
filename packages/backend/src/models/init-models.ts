// src/models/initModels.ts
import { Sequelize } from 'sequelize';
import { Rol } from './rol';
import { Sites } from './sites';
import { Status } from './status';
import { User } from './user';
import { Raspberry } from './raspberry';
import { UserSites } from './usersites';
import { RaspberryConnections } from './raspberryconnections';
import { SensorData } from './sensordata';
import { StatusLog } from './statuslog';
import { PasswordResetToken } from './passwordresettoken';

export function initModels(sequelize: Sequelize) {
  // 1) Rol ↔ User
  User.belongsTo(Rol, { foreignKey: 'idRol', as: 'rol' });
  Rol.hasMany(User, { foreignKey: 'idRol', as: 'users' });

  // 2) Sites ↔ Raspberry
  Sites.hasMany(Raspberry, { foreignKey: 'siteId', as: 'raspberries' });
  Raspberry.belongsTo(Sites, { foreignKey: 'siteId', as: 'site' });

  // 3) Status ↔ Raspberry / StatusLog
  Status.hasMany(Raspberry, { foreignKey: 'statusId', as: 'raspberries' });
  Raspberry.belongsTo(Status, { foreignKey: 'statusId', as: 'status' }); // ← usa 'status' (minúsculas)
  Status.hasMany(StatusLog, { foreignKey: 'statusID', as: 'logs' });
  StatusLog.belongsTo(Status, { foreignKey: 'statusID', as: 'status' });

  // 4) User ↔ Sites (N-M)
  User.belongsToMany(Sites, { through: UserSites, foreignKey: 'idUser', otherKey: 'idSite', as: 'sites' });
  Sites.belongsToMany(User, { through: UserSites, foreignKey: 'idSite', otherKey: 'idUser', as: 'users' }); // ← usa 'users'

  // 5) Raspberry ↔ SensorData / StatusLog
  Raspberry.hasMany(SensorData, { foreignKey: 'raspberryID', as: 'sensors' });
  SensorData.belongsTo(Raspberry, { foreignKey: 'raspberryID', as: 'raspberry' });
  Raspberry.hasMany(StatusLog, { foreignKey: 'raspberryID', as: 'statusLogs' });
  StatusLog.belongsTo(Raspberry, { foreignKey: 'raspberryID', as: 'raspberry' });

  // 6) Raspberry ↔ Raspberry (autorrelación)
  Raspberry.belongsToMany(Raspberry, {
    through: RaspberryConnections,
    as: 'conectadosCon',
    foreignKey: 'raspberryID_A',
    otherKey: 'raspberryID_B',
  });

  // 7) User ↔ PasswordResetToken
  User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens' });
  PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  return { Rol, Sites, Status, User, Raspberry, UserSites, RaspberryConnections, SensorData, StatusLog, PasswordResetToken };
}
