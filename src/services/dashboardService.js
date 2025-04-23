import db from "../models";
import moment from "moment";
import { Op } from "sequelize";

let getDashboardData = async () => {
  try {
    const totalBookings = await db.Booking.count();
    const totalRevenue = await db.Booking.sum("price");

    const startDate = moment().subtract(6, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    const bookingsByDay = await db.Booking.findAll({
      attributes: [
        [db.sequelize.fn("DATE", db.sequelize.col("checkInDate")), "date"],
        [db.sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        checkInDate: { [Op.between]: [startDate, endDate] },
      },
      group: [db.sequelize.fn("DATE", db.sequelize.col("checkInDate"))],
      raw: true,
    });

    const bookingsBySeller = await db.Booking.findAll({
      attributes: ["sellerId", [db.sequelize.fn("COUNT", "*"), "count"]],
      include: [{ model: db.Seller, as: "seller", attributes: ["fullName"] }],
      group: ["sellerId", "seller.id"],
      raw: true,
      nest: true,
    });

    return {
      errCode: 0,
      data: {
        totalBookings,
        totalRevenue,
        bookingsByDay,
        bookingsBySeller,
      },
    };
  } catch (err) {
    console.error("DashboardService Error:", err);
    return { errCode: 1, errMessage: "Server Error" };
  }
};

export default {
  getDashboardData,
};
