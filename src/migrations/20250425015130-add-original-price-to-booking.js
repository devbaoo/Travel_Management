"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Bookings", "originalPrice", {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Bookings", "originalPrice");
  },
};
