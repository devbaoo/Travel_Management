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
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      qrCodeUrl: {
        type: DataTypes.STRING(255),
      },
      bank: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bankAccountName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      bankAccountNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      role: {
        type: DataTypes.ENUM("admin", "staff"), // hoặc: "admin", "staff", "manager"
        allowNull: false,
        defaultValue: "staff", // mặc định là nhân viên
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
