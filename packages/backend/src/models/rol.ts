import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RolAttributes {
  id: number;
  NombreRol: string;
  createdAt?: Date;
  updatedAt?: Date;
}
type RolCreationAttributes = Optional<RolAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Rol extends Model<RolAttributes, RolCreationAttributes> implements RolAttributes {
  public id!: number;
  public NombreRol!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Rol.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    NombreRol: { type: DataTypes.STRING, allowNull: false, unique: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'Rol', freezeTableName: true, timestamps: true }
);
