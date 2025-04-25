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

    const formatVNDate = (date) =>
      format(new Date(date), "EEEE, dd/MM/yyyy", { locale: vi });

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
👤 Họ tên: ${booking.customerName}
📞 SĐT: ${booking.phoneNumber}
🛎 Dịch vụ: ${booking.serviceRequest}
👥 Số khách: ${booking.guestCount}
🛏 Số phòng: ${booking.roomCount}
🏷 Hạng phòng: ${booking.roomClass}
📅 Ngày nhận phòng: ${formatVNDate(booking.checkInDate)}
📅 Ngày trả phòng: ${formatVNDate(booking.checkOutDate)}
📝 Ghi chú: ${booking.note || "-"}
💰 Thành tiền: ${formatCurrency(booking.price)}
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
