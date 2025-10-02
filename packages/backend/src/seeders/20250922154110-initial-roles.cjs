'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();

    // Roles
    await queryInterface.bulkInsert('Rol', [
      { NombreRol: 'admin',    createdAt: now, updatedAt: now },
      { NombreRol: 'usuario',  createdAt: now, updatedAt: now }
    ], {});

    // Estados básicos (opcional pero útil para probar)
    await queryInterface.bulkInsert('Status', [
      { nombre: 'ONLINE',  descripcion: 'Operativo',        createdAt: now, updatedAt: now },
      { nombre: 'OFFLINE', descripcion: 'Sin comunicación', createdAt: now, updatedAt: now },
      { nombre: 'ALERT',   descripcion: 'Atención requerida', createdAt: now, updatedAt: now }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Status', null, {});
    await queryInterface.bulkDelete('Rol', null, {});
  }
};
