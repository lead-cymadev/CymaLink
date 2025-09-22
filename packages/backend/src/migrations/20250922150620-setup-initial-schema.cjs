'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // El orden de creación es importante por las llaves foráneas

    await queryInterface.createTable('Rol', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      NombreRol: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      }
    });

    await queryInterface.createTable('Sites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ubicacion: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('Status', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: Sequelize.STRING
      }
    });

    await queryInterface.createTable('User', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      idRol: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rol',
          key: 'id'
        }
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    await queryInterface.createTable('Raspberry', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      macAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      ipAddress: {
        type: Sequelize.STRING
      },
      siteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Sites',
          key: 'id'
        }
      },
      statusId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Status',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('UserSites', {
      idUser: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      idSite: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'Sites',
          key: 'id'
        }
      }
    });

    await queryInterface.createTable('RaspberryConnections', {
      raspberryID_A: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'Raspberry',
          key: 'id'
        }
      },
      raspberryID_B: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'Raspberry',
          key: 'id'
        }
      },
      signalStrength: {
        type: Sequelize.INTEGER
      }
    });

    await queryInterface.createTable('SensorData', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      raspberryID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Raspberry',
          key: 'id'
        }
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      tipo: {
        type: Sequelize.STRING
      },
      valor: {
        type: Sequelize.STRING
      }
    });

    await queryInterface.createTable('StatusLog', {
       id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      raspberryID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Raspberry',
          key: 'id'
        }
      },
      statusID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Status',
          key: 'id'
        }
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      notas: {
        type: Sequelize.STRING
      }
    });

    await queryInterface.createTable('PasswordResetToken', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      token: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
       createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // El orden de borrado es el inverso a la creación
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