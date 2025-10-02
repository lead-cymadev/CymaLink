'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, BOOLEAN, DATE } = Sequelize;

    await queryInterface.createTable('Rol', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      NombreRol: { type: STRING, allowNull: false, unique: true },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('Sites', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      nombre: { type: STRING, allowNull: false },
      ubicacion: { type: STRING },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('Status', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      nombre: { type: STRING, allowNull: false, unique: true },
      descripcion: { type: STRING },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('User', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      nombre: { type: STRING, allowNull: false },
      email: { type: STRING, allowNull: false, unique: true },
      password: { type: STRING, allowNull: false },
      idRol: {
        type: INTEGER, allowNull: false,
        references: { model: 'Rol', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      activo: { type: BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('Raspberry', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      nombre: { type: STRING, allowNull: false },
      macAddress: { type: STRING, allowNull: false, unique: true },
      ipAddress: { type: STRING },
      siteId: {
        type: INTEGER, allowNull: false,
        references: { model: 'Sites', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      statusId: {
        type: INTEGER, allowNull: false,
        references: { model: 'Status', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('UserSites', {
      idUser: {
        type: INTEGER, allowNull: false, primaryKey: true,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      idSite: {
        type: INTEGER, allowNull: false, primaryKey: true,
        references: { model: 'Sites', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('RaspberryConnections', {
      raspberryID_A: {
        type: INTEGER, allowNull: false, primaryKey: true,
        references: { model: 'Raspberry', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      raspberryID_B: {
        type: INTEGER, allowNull: false, primaryKey: true,
        references: { model: 'Raspberry', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      signalStrength: { type: INTEGER },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('SensorData', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      raspberryID: {
        type: INTEGER, allowNull: false,
        references: { model: 'Raspberry', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      timestamp: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      tipo: { type: STRING, allowNull: false },
      valor: { type: STRING, allowNull: false }
    });

    await queryInterface.createTable('StatusLog', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      raspberryID: {
        type: INTEGER, allowNull: false,
        references: { model: 'Raspberry', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      statusID: {
        type: INTEGER, allowNull: false,
        references: { model: 'Status', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      timestamp: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      notas: { type: STRING }
    });

    await queryInterface.createTable('PasswordResetToken', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: INTEGER },
      userId: {
        type: INTEGER, allowNull: false,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      token: { type: STRING, allowNull: false, unique: true },
      expiresAt: { type: DATE, allowNull: false },
      createdAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: DATE, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addIndex('Raspberry', ['siteId', 'statusId']);
    await queryInterface.addIndex('SensorData', ['raspberryID', { name: 'sensor_data_ts_desc', attribute: 'timestamp', order: 'DESC' }]);
    await queryInterface.addIndex('SensorData', ['raspberryID', 'tipo', { name: 'sensor_data_ts2_desc', attribute: 'timestamp', order: 'DESC' }]);
    await queryInterface.addIndex('StatusLog', ['raspberryID', { name: 'statuslog_ts_desc', attribute: 'timestamp', order: 'DESC' }]);

    await queryInterface.sequelize.query(`
      ALTER TABLE "RaspberryConnections"
      ADD CONSTRAINT raspberry_conn_no_self CHECK ("raspberryID_A" <> "raspberryID_B");
    `);

    // PostgreSQL: índice único de par no ordenado (A,B) ~ (B,A)
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'raspberry_conn_pair_uniq'
          ) THEN
            CREATE UNIQUE INDEX raspberry_conn_pair_uniq ON "RaspberryConnections"
            (
              LEAST("raspberryID_A","raspberryID_B"),
              GREATEST("raspberryID_A","raspberryID_B")
            );
          END IF;
        END $$;
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PasswordResetToken');
    await queryInterface.dropTable('StatusLog');
    await queryInterface.dropTable('SensorData');
    await queryInterface.dropTable('RaspberryConnections');
    await queryInterface.dropTable('UserSites');
    await queryInterface.dropTable('Raspberry');
    await queryInterface.dropTable('User');
    await queryInterface.dropTable('Status');
    await queryInterface.dropTable('Sites');
    await queryInterface.dropTable('Rol');
  }
};
