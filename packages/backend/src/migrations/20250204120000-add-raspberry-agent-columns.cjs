'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Raspberry');

    if (!table.hostname) {
      await queryInterface.addColumn('Raspberry', 'hostname', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.tailscaleIp) {
      await queryInterface.addColumn('Raspberry', 'tailscaleIp', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.tipo) {
      await queryInterface.addColumn('Raspberry', 'tipo', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Raspberry');

    if (table.tipo) {
      await queryInterface.removeColumn('Raspberry', 'tipo');
    }

    if (table.tailscaleIp) {
      await queryInterface.removeColumn('Raspberry', 'tailscaleIp');
    }

    if (table.hostname) {
      await queryInterface.removeColumn('Raspberry', 'hostname');
    }
  },
};
