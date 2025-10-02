import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SensorDataAttributes {
  id: number;
  raspberryID: number;
  timestamp: Date;
  tipo: string;
  valor: string;
}
type SensorDataCreationAttributes = Optional<SensorDataAttributes, 'id'>;

export class SensorData extends Model<SensorDataAttributes, SensorDataCreationAttributes>
  implements SensorDataAttributes {
  public id!: number;
  public raspberryID!: number;
  public timestamp!: Date;
  public tipo!: string;
  public valor!: string;
}

SensorData.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    raspberryID: { type: DataTypes.INTEGER, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    valor: { type: DataTypes.STRING, allowNull: false }
  },
  { sequelize, tableName: 'SensorData', freezeTableName: true, timestamps: false }
);
