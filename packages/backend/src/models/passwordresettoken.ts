import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PasswordResetTokenAttributes {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
type PasswordResetTokenCreation = Optional<PasswordResetTokenAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class PasswordResetToken extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreation>
  implements PasswordResetTokenAttributes {
  public id!: number;
  public userId!: number;
  public token!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PasswordResetToken.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'PasswordResetToken', freezeTableName: true, timestamps: true }
);
