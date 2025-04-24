import db from "../models/index";

let createBooking = async (data) => {
  try {
    if (!data.customerName || !data.checkInDate || !data.checkOutDate) {
      return { errCode: 1, errMessage: "Missing required fields" };
    }

    await db.Booking.create(data);

    return { errCode: 0, errMessage: "Create booking successfully" };
  } catch (error) {
    console.error("Create error:", error);
    throw error;
  }
};

let getAllBookings = async () => {
  try {
    let bookings = await db.Booking.findAll({
      include: [
        {
          model: db.Seller,
          as: "seller",
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return { errCode: 0, data: bookings };
  } catch (error) {
    throw error;
  }
};

let getBookingById = async (id) => {
  try {
    let booking = await db.Booking.findByPk(id, {
      include: [{ model: db.Seller, as: "seller" }],
    });

    if (!booking) return { errCode: 1, errMessage: "Booking not found" };

    return { errCode: 0, data: booking };
  } catch (error) {
    throw error;
  }
};

let updateBooking = async (id, data) => {
  try {
    const [updated] = await db.Booking.update(data, { where: { id } });

    if (!updated) return { errCode: 1, errMessage: "Booking not found" };

    return { errCode: 0, errMessage: "Update booking successfully" };
  } catch (error) {
    throw error;
  }
};

let deleteBooking = async (id) => {
  try {
    const deleted = await db.Booking.destroy({ where: { id } });

    if (!deleted) return { errCode: 1, errMessage: "Booking not found" };

    return { errCode: 0, errMessage: "Delete booking successfully" };
  } catch (error) {
    throw error;
  }
};
let getBookingBySeller = async (sellerId) => {
  try {
    if (!sellerId) {
      return { errCode: 1, errMessage: "Missing sellerId" };
    }

    const bookings = await db.Booking.findAll({
      where: { sellerId },
      include: [
        {
          model: db.Seller,
          as: "seller",
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return { errCode: 0, data: bookings };
  } catch (error) {
    console.error("Get bookings by seller error:", error);
    throw error;
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingBySeller,
};
