const path = require("path");
const db = require("../models");
const { format } = require("date-fns");
const { vi } = require("date-fns/locale");

const exportBookingTxt = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await db.Booking.findByPk(bookingId, {
      include: [{ model: db.Seller, as: "seller" }],
    });

    if (!booking || !booking.seller) {
      return res.status(404).json({ message: "Booking or Seller not found" });
    }

    const formatVNDate = (dateInput) => {
      try {
        // Kiểm tra null/undefined trước khi xử lý
        if (!dateInput) {
          return "-";
        }

        // Truy cập trực tiếp dữ liệu thô từ Sequelize
        let dateStr;

        // Kiểm tra nếu dateInput là đối tượng Sequelize có dataValues
        if (
          dateInput &&
          typeof dateInput === "object" &&
          "dataValues" in dateInput
        ) {
          dateStr = dateInput.dataValues;
        } else {
          // Trích xuất ngày tháng từ chuỗi ISO
          dateStr = String(dateInput);
        }

        // Kiểm tra chuỗi ngày có hợp lệ không
        if (!dateStr) {
          return "-";
        }

        // Tạo date object và đặt giờ là 12 để tránh vấn đề với múi giờ
        const dateObj = new Date(dateStr);
        // Để chắc chắn không bị chênh lệch ngày do múi giờ
        dateObj.setHours(12, 0, 0, 0);

        return format(dateObj, "EEEE, dd/MM/yyyy", { locale: vi });
      } catch (error) {
        console.error("Date formatting error:", error);
        return "-";
      }
    };

    const formatCurrency = (amount) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(amount);

    const seller = booking.seller;

    // Tạo nội dung file txt với icons
    const content = `
=== 🏨 THÔNG TIN KHÁCH HÀNG ===
👤 Họ tên: ${booking.customerName || "-"}
📞 SĐT: ${booking.phoneNumber || "-"}
🛎 Dịch vụ: ${booking.serviceRequest || "-"}
👥 Số khách: ${booking.guestCount || "-"}
🛏 Số phòng: ${booking.roomCount || "-"}
🏷 Hạng phòng: ${booking.roomClass || "-"}
📅 Ngày nhận phòng: ${
      booking.checkInDate ? formatVNDate(booking.checkInDate) : "-"
    }
📅 Ngày trả phòng: ${
      booking.checkOutDate ? formatVNDate(booking.checkOutDate) : "-"
    }
📝 Ghi chú: ${booking.note || "-"}
💰 Thành tiền: ${booking.price ? formatCurrency(booking.price) : "-"}
`.trim();

    // Set headers & trả về file
    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=booking_${bookingId}.txt`
    );

    res.send(content);
  } catch (error) {
    console.error("TXT Export Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  exportBookingTxt,
};
