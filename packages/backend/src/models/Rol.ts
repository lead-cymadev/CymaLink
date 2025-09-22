import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Rol extends Model {
  public id!: number;
  public NombreRol!: string;
}

Rol.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    NombreRol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'Rol',
    sequelize,
    timestamps: false,
  }
);