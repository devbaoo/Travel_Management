"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Sellers", "role", {
      type: Sequelize.ENUM("admin", "staff"),
      allowNull: false,
      defaultValue: "staff",
    });
  },

  async down(queryInterface, Sequelize) {
    // Nếu cần revert, phải xóa ENUM riêng trước khi drop cột (trong một số DB như PostgreSQL)
    await queryInterface.removeColumn("Sellers", "role");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Sellers_role";'
    ); // chỉ cần với PostgreSQL
  },
};
