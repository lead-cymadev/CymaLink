require('dotenv').config();

module.exports = {
  development: {
    // Le decimos que use la variable de entorno que contiene la URL completa
    use_env_variable: 'DB_EXTERNAL_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  production: {
    use_env_variable: 'DB_EXTERNAL_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};