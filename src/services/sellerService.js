import db from "../models/index";
import { uploadImage } from "./imageService";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

const createSeller = async (data, file) => {
  try {
    const { fullName, phoneNumber, email, password } = data;

    if (!fullName || !phoneNumber || !email || !password) {
      return {
        errCode: 1,
        errMessage: "Missing required fields",
      };
    }

    const existingSeller = await db.Seller.findOne({ where: { email } });
    if (existingSeller) {
      return {
        errCode: 2,
        errMessage: "Email already exists",
      };
    }

    let qrCodeUrl;
    try {
      qrCodeUrl = await uploadImage(file);
    } catch (error) {
      console.error("QR upload error:", error);
      return {
        errCode: 3,
        errMessage: "Failed to upload QR code",
      };
    }

    const hashedPassword = await hashPassword(password);

    const newSeller = await db.Seller.create({
      fullName,
      phoneNumber,
      email,
      password: hashedPassword,
      qrCodeUrl,
    });

    return {
      errCode: 0,
      errMessage: "Seller created successfully",
      data: {
        id: newSeller.id,
        fullName: newSeller.fullName,
        email: newSeller.email,
        phoneNumber: newSeller.phoneNumber,
        qrCodeUrl: newSeller.qrCodeUrl,
      },
    };
  } catch (error) {
    console.error("Create seller error:", error);
    return {
      errCode: 500,
      errMessage: "Internal server error",
    };
  }
};

let getAllSellers = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      let sellers = await db.Seller.findAll({
        attributes: ["id", "fullName", "phoneNumber", "email", "qrCodeUrl"],
      });
      resolve({
        errCode: 0,
        errMessage: "OK",
        sellers,
      });
    } catch (e) {
      reject(e);
    }
  });
};
let getDetailSeller = async (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let seller = await db.Seller.findOne({
        where: { id: id },
        attributes: ["id", "fullName", "phoneNumber", "email", "qrCodeUrl"],
      });
      if (seller) {
        resolve({
          errCode: 0,
          errMessage: "OK",
          seller,
        });
      } else {
        resolve({
          errCode: 1,
          errMessage: "Seller not found",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};
let deleteSeller = async (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let seller = await db.Seller.findOne({
        where: { id: id },
      });
      if (seller) {
        await db.Seller.destroy({
          where: { id: id },
        });
        resolve({
          errCode: 0,
          errMessage: "Delete seller successfully",
        });
      } else {
        resolve({
          errCode: 1,
          errMessage: "Seller not found",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};
let updateSeller = async (id, data, file) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Kiểm tra các trường cần thiết
      if (!id || !data.fullName || !data.phoneNumber) {
        resolve({
          errCode: 1,
          errMessage: "Missing required fields",
        });
        return;
      }

      // Tìm seller hiện tại
      const existingSeller = await db.Seller.findByPk(id);
      if (!existingSeller) {
        resolve({
          errCode: 3,
          errMessage: "Seller not found",
        });
        return;
      }

      // Nếu có file ảnh QR code mới, upload
      let qrCodeUrl = existingSeller.qrCodeUrl;
      if (file) {
        try {
          qrCodeUrl = await uploadImage(file); // Upload ảnh mới
        } catch (error) {
          console.error("Lỗi upload QR:", error);
          resolve({
            errCode: 2,
            errMessage: "Lỗi khi upload QR code",
          });
          return;
        }
      }

      // Cập nhật seller
      await db.Seller.update(
        {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          email: data.email || null,
          qrCodeUrl: qrCodeUrl,
        },
        { where: { id: id } }
      );

      resolve({
        errCode: 0,
        errMessage: "Update seller successfully",
      });
    } catch (e) {
      reject(e);
    }
  });
};

export default {
  createSeller,
  getAllSellers,
  getDetailSeller,
  deleteSeller,
  updateSeller,
};
