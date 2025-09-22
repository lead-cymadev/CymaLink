import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export class User extends Model {
  public id!: number;
  public nombre!: string;
  public email!: string;
  public password!: string;
  public idRol!: number;
  public activo!: boolean;
}

User.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idRol: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'User',
    sequelize,
    timestamps: true, // Asumiendo que quieres createdAt y updatedAt
  }
);