import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { log } from "../colors/theme";

dotenv.config();

let sequelize: Sequelize;

if (process.env.DB_EXTERNAL_URL) {
  // Conexión a DB externa (Heroku, AWS, etc.)
  sequelize = new Sequelize(process.env.DB_EXTERNAL_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  // Conexión a DB local
  sequelize = new Sequelize(
    process.env.DB_DATABASE as string,
    process.env.DB_USERNAME as string,
    process.env.DB_PASSWORD as string,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      dialect: "postgres",
      logging: false,
    }
  );
}

// Función para probar conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    log.success("✅ Conectado a PostgreSQL");
    return true;
  } catch (error) {
    log.error("❌ Error al conectar:", error);
    return false;
  }
};

// Exportamos sequelize para usar en modelos
export default sequelize;
