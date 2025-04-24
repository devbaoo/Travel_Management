"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Sellers", "email", {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn("Sellers", "password", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sellers", "password");

    // Nếu muốn khôi phục trạng thái ban đầu
    await queryInterface.changeColumn("Sellers", "email", {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: false,
    });
  },
};
