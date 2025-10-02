import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface UserSitesAttributes {
  idUser: number;
  idSite: number;
  createdAt?: Date;
}

export class UserSites extends Model<UserSitesAttributes> implements UserSitesAttributes {
  public idUser!: number;
  public idSite!: number;
  public readonly createdAt!: Date;
}

UserSites.init(
  {
    idUser: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    idSite: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'UserSites', freezeTableName: true, timestamps: true, updatedAt: false }
);
