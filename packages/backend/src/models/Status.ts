import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Status extends Model {
  public id!: number;
  public nombre!: string;
  public descripcion?: string;
}

Status.init(
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
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'Status',
    sequelize,
    timestamps: false,
  }
);