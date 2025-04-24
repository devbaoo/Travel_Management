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
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const register = async (data) => {
  try {
    if (!data.email || !data.password) {
      return { errCode: 4, errMessage: "Email and password are required" };
    }

    const existingUser = await db.Seller.findOne({
      where: { email: data.email },
    });
    if (existingUser) return { errCode: 1, errMessage: "Email already exists" };

    const hashedPassword = await hashPassword(data.password);
    const newSeller = await db.Seller.create({
      ...data,
      password: hashedPassword,
    });

    return {
      errCode: 0,
      data: {
        id: newSeller.id,
        fullName: newSeller.fullName,
        email: newSeller.email,
      },
    };
  } catch (error) {
    console.error("Register error:", error);
    return { errCode: 2, errMessage: "Server Error" };
  }
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
        },
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { errCode: 3, errMessage: "Server Error" };
  }
};

export default { register, login };
