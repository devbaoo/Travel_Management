import db from "../models";
import moment from "moment";
import { Op } from "sequelize";

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

    // // Tính lợi nhuận cho từng seller và sắp xếp theo lợi nhuận giảm dần
    // const topSellers = await db.Booking.findAll({
    //   attributes: [
    //     "sellerId",
    //     [db.sequelize.fn("SUM", db.sequelize.col("price")), "totalRevenue"],
    //     [
    //       db.sequelize.fn("SUM", db.sequelize.col("originalPrice")),
    //       "totalOriginalPrice",
    //     ],
    //     [
    //       db.sequelize.fn("SUM", db.sequelize.col("price")) -
    //         db.sequelize.fn("SUM", db.sequelize.col("originalPrice")),
    //       "profit",
    //     ],
    //   ],
    //   group: ["sellerId"], // Nhóm theo sellerId
    //   order: [
    //     [
    //       db.sequelize.fn("SUM", db.sequelize.col("price")) -
    //         db.sequelize.fn("SUM", db.sequelize.col("originalPrice")),
    //       "DESC",
    //     ], // Sắp xếp theo lợi nhuận (profit)
    //   ],
    //   limit: 5, // Lấy top 5 seller có lợi nhuận cao nhất
    //   include: [
    //     {
    //       model: db.Seller,
    //       as: "seller",
    //       attributes: ["fullName"], // Lấy tên của seller
    //     },
    //   ],
    //   raw: true, // Đảm bảo nhận kết quả là raw
    //   nest: true, // Cho phép kết quả có cấu trúc nested
    // });

    return {
      errCode: 0,
      data: {
        totalBookings,
        totalRevenue,
        totalOriginalPrice,
        profit,
        bookingsByDay,
        bookingsBySeller,
        // topSellers, // Top 5 sellers đạt nhiều lợi nhuận nhất
      },
    };
  } catch (err) {
    console.error("DashboardService Error:", err);
    return { errCode: 1, errMessage: "Server Error" };
  }
};

let getSellerDashboardData = async (sellerId) => {
  try {
    // Kiểm tra nếu sellerId không hợp lệ
    if (!sellerId) {
      return { errCode: 1, errMessage: "Missing sellerId" };
    }

    // Tổng số booking cho seller này
    const totalBookings = await db.Booking.count({
      where: { sellerId },
    });

    // Tổng doanh thu (price) cho seller này
    const totalRevenue = await db.Booking.sum("price", {
      where: { sellerId },
    });

    // Tổng giá nhập (originalPrice) cho seller này
    const totalOriginalPrice = await db.Booking.sum("originalPrice", {
      where: { sellerId },
    });

    // Tính lợi nhuận (doanh thu - giá nhập)
    const profit = totalRevenue - totalOriginalPrice;

    const startDate = moment().subtract(6, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    // Booking theo ngày cho seller này
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

export default {
  getDashboardData,
  getSellerDashboardData,
};
