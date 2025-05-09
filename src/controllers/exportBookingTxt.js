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
        const date = new Date(dateInput);

        return new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh", // 👉 fix múi giờ cho đúng
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(date);
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
