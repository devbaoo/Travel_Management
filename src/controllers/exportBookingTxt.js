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
        // Truy cập trực tiếp dữ liệu thô từ Sequelize
        let dateStr;

        // Kiểm tra nếu dateInput là đối tượng Sequelize có dataValues
        if (dateInput && dateInput.dataValues) {
          dateStr = dateInput.dataValues;
        } else {
          // Trích xuất ngày tháng từ chuỗi ISO
          dateStr = dateInput.toString();
        }

        // Trích xuất ngày, tháng, năm từ chuỗi ngày
        // Hỗ trợ nhiều định dạng ngày tháng có thể có
        let year, month, day;

        if (dateStr.includes("-")) {
          // Format: 2025-05-29 hoặc 2025-05-29T00:00:00.000Z
          const dateParts = dateStr.split("T")[0].split("-");
          year = parseInt(dateParts[0], 10);
          month = parseInt(dateParts[1], 10);
          day = parseInt(dateParts[2], 10);
        } else if (dateStr.includes("/")) {
          // Format: 29/05/2025
          const dateParts = dateStr.split("/");
          day = parseInt(dateParts[0], 10);
          month = parseInt(dateParts[1], 10);
          year = parseInt(dateParts[2], 10);
        } else {
          // Fallback: sử dụng Date constructor
          const dateObj = new Date(dateStr);
          year = dateObj.getFullYear();
          month = dateObj.getMonth() + 1; // getMonth() trả về 0-11
          day = dateObj.getDate();
        }

        // Tạo đối tượng Date mới, sử dụng giá trị UTC để tránh chênh lệch múi giờ
        const dateObj = new Date(Date.UTC(year, month - 1, day));

        return format(dateObj, "EEEE, dd/MM/yyyy", { locale: vi });
      } catch (error) {
        console.error("Date formatting error:", error);
        return dateInput ? dateInput.toString() : "-";
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
