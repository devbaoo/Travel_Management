import db from "../models";
import moment from "moment-timezone"; // <-- đổi import
import { Op } from "sequelize";

// Thiết timezone mặc định
moment.tz.setDefault("Asia/Ho_Chi_Minh");

let getDashboardData = async () => {
  try {
    // Tổng số booking
    const totalBookings = await db.Booking.count();

    // Tổng doanh thu (price)
    const totalRevenue = await db.Booking.sum("price");

    // Tổng giá nhập (originalPrice)
    const totalOriginalPrice = await db.Booking.sum("originalPrice");

    // Tính lợi nhuận (doanh thu - giá nhập)
    const profit = totalRevenue - totalOriginalPrice;

    // Dùng giờ Việt Nam để tính 7 ngày gần nhất
    const startDate = moment().subtract(6, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    // Booking theo ngày
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

    // Booking theo seller
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
        totalOriginalPrice,
        profit,
        bookingsByDay,
        bookingsBySeller,
      },
    };
  } catch (err) {
    console.error("DashboardService Error:", err);
    return { errCode: 1, errMessage: "Server Error" };
  }
};

let getSellerDashboardData = async (sellerId) => {
  try {
    if (!sellerId) {
      return { errCode: 1, errMessage: "Missing sellerId" };
    }

    const totalBookings = await db.Booking.count({ where: { sellerId } });
    const totalRevenue = await db.Booking.sum("price", { where: { sellerId } });
    const totalOriginalPrice = await db.Booking.sum("originalPrice", {
      where: { sellerId },
    });
    const profit = totalRevenue - totalOriginalPrice;

    // Dùng giờ Việt Nam để tính 7 ngày gần nhất
    const startDate = moment().subtract(6, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    const bookingsByDay = await db.Booking.findAll({
      attributes: [
        [db.sequelize.fn("DATE", db.sequelize.col("checkInDate")), "date"],
        [db.sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        sellerId,
        checkInDate: { [Op.between]: [startDate, endDate] },
      },
      group: [db.sequelize.fn("DATE", db.sequelize.col("checkInDate"))],
      raw: true,
    });

    return {
      errCode: 0,
      data: {
        totalBookings,
        totalRevenue,
        totalOriginalPrice,
        profit,
        bookingsByDay,
      },
    };
  } catch (err) {
    console.error("Get seller dashboard data error:", err);
    return { errCode: 1, errMessage: "Server Error" };
  }
};

let getRevenueBySellerByMonth = async (month, year) => {
  try {
    // parse inputs
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(m) || isNaN(y) || m < 1 || m > 12) {
      return { errCode: 1, errMessage: "Missing or invalid month or year" };
    }

    // Dùng giờ Việt Nam để xác định đầu/tháng
    const startDate = moment
      .tz({ year: y, month: m - 1, day: 1 }, "Asia/Ho_Chi_Minh")
      .startOf("month")
      .toDate();
    const endDate = moment
      .tz({ year: y, month: m - 1, day: 1 }, "Asia/Ho_Chi_Minh")
      .endOf("month")
      .toDate();

    const sellers = await db.Seller.findAll({
      attributes: ["id", "fullName"],
      raw: true,
    });

    const sellerStats = await Promise.all(
      sellers.map(async (seller) => {
        const totalRevenue = await db.Booking.sum("price", {
          where: {
            sellerId: seller.id,
            createdAt: { [Op.between]: [startDate, endDate] },
          },
        });

        const totalOriginalPrice = await db.Booking.sum("originalPrice", {
          where: {
            sellerId: seller.id,
            createdAt: { [Op.between]: [startDate, endDate] },
          },
        });

        const profit = (totalRevenue || 0) - (totalOriginalPrice || 0);

        return {
          sellerId: seller.id,
          sellerName: seller.fullName,
          totalRevenue: totalRevenue || 0,
          totalOriginalPrice: totalOriginalPrice || 0,
          profit,
        };
      })
    );

    // Sort by profit descending
    sellerStats.sort((a, b) => b.profit - a.profit);

    return { errCode: 0, data: sellerStats };
  } catch (error) {
    console.error("Get revenue by seller by month error:", error);
    return { errCode: 1, errMessage: "Server Error" };
  }
};

export default {
  getDashboardData,
  getSellerDashboardData,
  getRevenueBySellerByMonth,
};
