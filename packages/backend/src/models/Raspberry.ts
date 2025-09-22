import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Raspberry extends Model {
  public id!: number;
  public nombre!: string;
  public macAddress!: string;
  public ipAddress!: string;
  public siteId!: number;
  public statusId!: number;
}

Raspberry.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    macAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    siteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'Raspberry',
    sequelize,
    timestamps: true,
  }
);