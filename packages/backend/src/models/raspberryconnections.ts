import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface RaspberryConnectionsAttributes {
  raspberryID_A: number;
  raspberryID_B: number;
  signalStrength?: number | null;
  createdAt?: Date;
}
type RaspberryConnectionsCreation = Optional<RaspberryConnectionsAttributes, 'signalStrength' | 'createdAt'>;

export class RaspberryConnections extends Model<RaspberryConnectionsAttributes, RaspberryConnectionsCreation>
  implements RaspberryConnectionsAttributes {
  public raspberryID_A!: number;
  public raspberryID_B!: number;
  public signalStrength!: number | null;
  public readonly createdAt!: Date;
}

RaspberryConnections.init(
  {
    raspberryID_A: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    raspberryID_B: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    signalStrength: { type: DataTypes.INTEGER },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'RaspberryConnections', freezeTableName: true, timestamps: true, updatedAt: false }
);
