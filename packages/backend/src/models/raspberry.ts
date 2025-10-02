import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RaspberryAttributes {
  id: number;
  nombre: string;
  macAddress: string;
  ipAddress?: string | null;
  siteId: number;
  statusId: number;
  createdAt?: Date;
  updatedAt?: Date;
}
type RaspberryCreationAttributes = Optional<RaspberryAttributes, 'id' | 'ipAddress' | 'createdAt' | 'updatedAt'>;

export class Raspberry extends Model<RaspberryAttributes, RaspberryCreationAttributes> implements RaspberryAttributes {
  public id!: number;
  public nombre!: string;
  public macAddress!: string;
  public ipAddress!: string | null;
  public siteId!: number;
  public statusId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Raspberry.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    macAddress: { type: DataTypes.STRING, allowNull: false, unique: true },
    ipAddress: { type: DataTypes.STRING },
    siteId: { type: DataTypes.INTEGER, allowNull: false },
    statusId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'Raspberry', freezeTableName: true, timestamps: true }
);
