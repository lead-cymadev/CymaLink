'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('User');

    if (!table.preferredLanguage) {
      await queryInterface.addColumn('User', 'preferredLanguage', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'es',
      });
    }

    if (!table.timezone) {
      await queryInterface.addColumn('User', 'timezone', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'UTC',
      });
    }

    if (!table.notifyByEmail) {
      await queryInterface.addColumn('User', 'notifyByEmail', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('User');

    if (table.notifyByEmail) {
      await queryInterface.removeColumn('User', 'notifyByEmail');
    }

    if (table.timezone) {
      await queryInterface.removeColumn('User', 'timezone');
    }

    if (table.preferredLanguage) {
      await queryInterface.removeColumn('User', 'preferredLanguage');
    }
  },
};
