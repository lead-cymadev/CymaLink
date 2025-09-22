import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class Site extends Model {
  public id!: number;
  public nombre!: string;
  public ubicacion!: string;
}

Site.init(
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
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'Sites',
    sequelize,
    timestamps: true,
  }
);