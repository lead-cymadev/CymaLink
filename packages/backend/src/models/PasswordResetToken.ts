import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class PasswordResetToken extends Model {
  public id!: number;
  public userId!: number;
  public token!: string;
  public expiresAt!: Date;
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATEONLY, // DATE se mapea a DATEONLY
      allowNull: false,
    },
  },
  {
    tableName: 'PasswordResetToken',
    sequelize,
    timestamps: true,
  }
);