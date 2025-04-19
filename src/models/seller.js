"use strict";

module.exports = (sequelize, DataTypes) => {
  const Seller = sequelize.define(
    "Seller",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING(15),
      },
      email: {
        type: DataTypes.STRING(100),
      },
      qrCodeUrl: {
        type: DataTypes.STRING(255),
      },
    },
    {
      tableName: "Sellers",
      timestamps: false,
    }
  );

  Seller.associate = (models) => {
    Seller.hasMany(models.Booking, {
      foreignKey: "sellerId",
      as: "bookings",
    });
  };

  return Seller;
};
