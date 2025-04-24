import db from "../models";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1d";

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
const comparePassword = (inputPassword, hashed) =>
  bcrypt.compare(inputPassword, hashed);

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const login = async ({ email, password }) => {
  try {
    const seller = await db.Seller.findOne({ where: { email } });
    if (!seller)
      return { errCode: 1, errMessage: "Email or password is incorrect" };

    const isMatch = await comparePassword(password, seller.password);
    if (!isMatch)
      return { errCode: 2, errMessage: "Email or password is incorrect" };

    const token = generateToken(seller);
    return {
      errCode: 0,
      data: {
        token,
        seller: {
          id: seller.id,
          fullName: seller.fullName,
          email: seller.email,
          role: seller.role,
        },
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { errCode: 3, errMessage: "Server Error" };
  }
};

export default { login };
