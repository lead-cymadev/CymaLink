import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StatusAttributes {
  id: number;
  nombre: string;
  descripcion?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
type StatusCreationAttributes = Optional<StatusAttributes, 'id' | 'descripcion' | 'createdAt' | 'updatedAt'>;

export class Status extends Model<StatusAttributes, StatusCreationAttributes> implements StatusAttributes {
  public id!: number;
  public nombre!: string;
  public descripcion!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Status.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
    descripcion: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'Status', freezeTableName: true, timestamps: true }
);
