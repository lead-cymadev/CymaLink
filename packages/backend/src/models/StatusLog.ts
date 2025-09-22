import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class StatusLog extends Model {
  public id!: number;
  public raspberryID!: number;
  public statusID!: number;
  public timestamp!: Date; // Corregido el typo "timestap"
  public notas!: string;
}

StatusLog.init(
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
    statusID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timestamp: { // Corregido de "timestap"
      type: DataTypes.DATE,
      allowNull: false,
    },
    notas: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'StatusLog',
    sequelize,
    timestamps: false, // La tabla ya tiene un campo de timestamp
  }
);