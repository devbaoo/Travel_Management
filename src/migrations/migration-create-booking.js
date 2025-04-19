"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Bookings", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customerName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.STRING(15),
      },
      serviceRequest: {
        type: Sequelize.STRING(255),
      },
      guestCount: {
        type: Sequelize.INTEGER,
      },
      roomCount: {
        type: Sequelize.INTEGER,
      },
      roomClass: {
        type: Sequelize.STRING(50),
      },
      checkInDate: {
        type: Sequelize.DATE,
      },
      checkOutDate: {
        type: Sequelize.DATE,
      },
      price: {
        type: Sequelize.DECIMAL(18, 2),
      },
      note: {
        type: Sequelize.TEXT,
      },
      sellerId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Sellers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Bookings");
  },
};
