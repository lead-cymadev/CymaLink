import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StatusLogAttributes {
  id: number;
  raspberryID: number;
  statusID: number;
  timestamp: Date;
  notas?: string | null;
}
type StatusLogCreationAttributes = Optional<StatusLogAttributes, 'id' | 'notas'>;

export class StatusLog extends Model<StatusLogAttributes, StatusLogCreationAttributes>
  implements StatusLogAttributes {
  public id!: number;
  public raspberryID!: number;
  public statusID!: number;
  public timestamp!: Date;
  public notas!: string | null;
}

StatusLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    raspberryID: { type: DataTypes.INTEGER, allowNull: false },
    statusID: { type: DataTypes.INTEGER, allowNull: false },
    timestamp: { type: DataTypes.DATE, allowNull: false },
    notas: { type: DataTypes.STRING }
  },
  { sequelize, tableName: 'StatusLog', freezeTableName: true, timestamps: false }
);
