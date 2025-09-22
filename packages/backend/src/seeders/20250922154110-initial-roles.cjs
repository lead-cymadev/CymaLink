'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Rol', [
      {
        NombreRol: 'admin',
      },
      {
        NombreRol: 'usuario',
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Rol', null, {});
  }
};