"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Sellers", "bank", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("Sellers", "bankAccountName", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("Sellers", "bankAccountNumber", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Sellers", "bank");
    await queryInterface.removeColumn("Sellers", "bankAccountName");
    await queryInterface.removeColumn("Sellers", "bankAccountNumber");
  },
};
