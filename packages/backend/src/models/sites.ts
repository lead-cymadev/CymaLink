import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SitesAttributes {
  id: number;
  nombre: string;
  ubicacion?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
type SitesCreationAttributes = Optional<SitesAttributes, 'id' | 'ubicacion' | 'createdAt' | 'updatedAt'>;

export class Sites extends Model<SitesAttributes, SitesCreationAttributes> implements SitesAttributes {
  public id!: number;
  public nombre!: string;
  public ubicacion!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Sites.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    ubicacion: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'Sites', freezeTableName: true, timestamps: true }
);
