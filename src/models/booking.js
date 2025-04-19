"use strict";

module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customerName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING(15),
      },
      serviceRequest: {
        type: DataTypes.STRING(255),
      },
      guestCount: {
        type: DataTypes.INTEGER,
      },
      roomCount: {
        type: DataTypes.INTEGER,
      },
      roomClass: {
        type: DataTypes.STRING(50),
      },
      checkInDate: {
        type: DataTypes.DATE,
      },
      checkOutDate: {
        type: DataTypes.DATE,
      },
      price: {
        type: DataTypes.DECIMAL(18, 2),
      },
      note: {
        type: DataTypes.TEXT,
      },
      sellerId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Sellers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Bookings",
      timestamps: true,
      updatedAt: false,
    }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.Seller, {
      foreignKey: "sellerId",
      as: "seller",
    });
  };

  return Booking;
};
