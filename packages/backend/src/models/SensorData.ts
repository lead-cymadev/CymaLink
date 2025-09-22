import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class SensorData extends Model {
  public id!: number;
  public raspberryID!: number;
  public timestamp!: Date; // Corregido el typo "timestap"
  public tipo?: string;
  public valor?: string;
}

SensorData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    raspberryID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timestamp: { // Corregido de "timestap"
      type: DataTypes.DATE, // TIMESTAMP se mapea a DATE en Sequelize
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    valor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'SensorData',
    sequelize,
    timestamps: false, // La tabla ya tiene un campo de timestamp
  }
);