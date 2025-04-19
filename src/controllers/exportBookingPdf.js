const PDFDocument = require("pdfkit");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const db = require("../models");

/**
 * Export booking as styled booking info PDF
 */
const exportBookingPdf = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await db.Booking.findByPk(bookingId, {
      include: [{ model: db.Seller, as: "seller" }],
    });
    if (!booking || !booking.seller) {
      return res.status(404).json({ message: "Booking or Seller not found" });
    }

    // Helpers
    const formatDate = (dateInput) =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(dateInput));

    const formatVND = (amount) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(amount);

    // PDF setup
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=booking_${bookingId}.pdf`
    );
    doc.pipe(res);

    // Colors (match logo)
    const bgDark = "#2E2E2E"; // deep grey background
    const goldPrimary = "#D4AF37"; // metallic gold
    const goldSecondary = "#FFD700"; // bright gold

    // Draw full-page background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgDark);
    // Default text color on dark bg
    doc.fillColor("#FFF");

    // Load fonts
    const regular = path.join(__dirname, "../fonts/Roboto-Regular.ttf");
    const bold = path.join(__dirname, "../fonts/Roboto-Bold.ttf");
    const scriptFont = path.join(__dirname, "../fonts/GreatVibes-Regular.ttf");
    doc.registerFont("Script", scriptFont);
    doc.registerFont("Regular", regular);
    doc.registerFont("Bold", bold);

    // Layout variables
    const leftX = doc.page.margins.left;
    const usableW = doc.page.width - leftX - doc.page.margins.right;
    const rightX = leftX + usableW / 2 + 20;

    // 1) Header: Logo & Seller
    const logoPath = path.join(__dirname, "../assets/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, leftX, 35, { fit: [180, 80] });
    }
    // Seller info: all lines same font size
    doc
      .font("Bold")
      .fontSize(12)
      .fillColor("#FFF")
      .text(`Người bán: ${booking.seller.fullName}`, rightX, 50)
      .font("Regular")
      .fontSize(12)
      .text(`Email: ${booking.seller.email || "-"}`, rightX, doc.y + 4)
      .text(`Số điện thoại: ${booking.seller.phoneNumber}`, rightX, doc.y + 2);

    // Divider dưới header
    doc
      .moveTo(leftX, 130)
      .lineTo(doc.page.width - doc.page.margins.right, 130)
      .strokeColor("#FFF")
      .lineWidth(0.5)
      .stroke();

    // 2) Title: "Thông tin đặt phòng"
    const titleY = 140;
    doc
      .font("Bold")
      .fontSize(32)
      .fillColor(goldPrimary)
      .text("Xác nhận", leftX, titleY)
      .text("dịch vụ", leftX + 130, titleY + 40)
      .fillColor("#FFF");

    // Company & Customer
    doc
      .font("Bold")
      .fontSize(18)
      .fillColor(goldPrimary)
      .text("Thành Phát Global", rightX, titleY)
      .font("Regular")
      .fontSize(12)
      .fillColor("#FFF")
      .text(`Khách hàng: ${booking.customerName}`, rightX, doc.y + 6)
      .text(`Số điện thoại khách: ${booking.phoneNumber}`, rightX, doc.y + 4);

    // 3) Details list (except price)
    const detailsStartY = 270;
    const rowHeight = 32;
    const detailsWidth = usableW;
    const labelWidth = 140;
    const valueWidth = detailsWidth - labelWidth;
    const details = [
      ["Dịch vụ", booking.serviceRequest],
      ["Số khách", booking.guestCount],
      ["Số phòng", booking.roomCount],
      ["Hạng phòng", booking.roomClass],
      ["Ngày nhận phòng", formatDate(booking.checkInDate)],
      ["Ngày trả phòng", formatDate(booking.checkOutDate)],
      ["Ghi chú", booking.note || "-"],
    ];

    // Table header
    let currentY = detailsStartY;
    doc
      .font("Bold")
      .fontSize(18)
      .fillColor(goldPrimary)
      .text("Chi tiết dịch vụ", leftX, currentY, {
        width: detailsWidth,
        align: "center",
      });
    currentY += rowHeight + 12;

    // Draw table lines and content
    details.forEach(([label, val]) => {
      // vertical line
      doc
        .strokeColor("#FFF")
        .lineWidth(0.5)
        .moveTo(leftX + labelWidth, currentY)
        .lineTo(leftX + labelWidth, currentY + rowHeight)
        .stroke();
      // horizontal bottom line
      doc
        .strokeColor("#FFF")
        .lineWidth(0.5)
        .moveTo(leftX, currentY + rowHeight)
        .lineTo(leftX + detailsWidth, currentY + rowHeight)
        .stroke();

      doc
        .font("Bold")
        .fontSize(12)
        .fillColor("#FFF")
        .text(label, leftX + 8, currentY + 6);
      doc
        .font("Regular")
        .fontSize(12)
        .fillColor("#FFF")
        .text(val, leftX + labelWidth + 8, currentY + 6, {
          width: valueWidth - 16,
        });
      currentY += rowHeight;
    });

    // 4) "Thành tiền"
    doc
      .strokeColor("#FFF")
      .lineWidth(0.5)
      .moveTo(leftX, currentY)
      .lineTo(leftX + detailsWidth, currentY)
      .stroke();
    currentY += 6;
    doc
      .font("Bold")
      .fontSize(18)
      .fillColor(goldPrimary)
      .text(`Thành tiền: ${formatVND(booking.price)}`, leftX, currentY, {
        width: detailsWidth,
        align: "right",
      });
    const priceBottomY = currentY + rowHeight;
    doc
      .strokeColor("#FFF")
      .lineWidth(0.5)
      .moveTo(leftX, priceBottomY)
      .lineTo(leftX + detailsWidth, priceBottomY)
      .stroke();

    // 5) Bank QR & "Xin cảm ơn!"
    currentY = priceBottomY + 10;

    // Kích thước và vị trí container
    const containerHeight = 220;
    const containerWidth = usableW;
    const containerX = leftX;
    const containerY = currentY;

    // Vẽ background box với bo góc và viền vàng
    doc
      .roundedRect(containerX, containerY, containerWidth, containerHeight, 10)
      .fillAndStroke("#1F1F1F", goldSecondary) // nền xám đậm, viền vàng
      .fillColor("#FFF");

    // Tiêu đề nhỏ cho phần thanh toán
    doc
      .font("Bold")
      .fontSize(14)
      .text("THÔNG TIN THANH TOÁN", containerX + 20, containerY + 20);

    // Lấy QR
    if (booking.seller.qrCodeUrl) {
      const qrRes = await axios.get(booking.seller.qrCodeUrl, {
        responseType: "arraybuffer",
      });
      const qrBuffer = Buffer.from(qrRes.data, "binary");

      // Chèn QR vào bên trái
      const qrSize = 180;
      const qrX = containerX + 20;
      const qrY = containerY + 50;
      const cornerRadius = 12; // adjust this for more or less rounding

      // bắt đầu vùng cắt
      doc.save();
      doc
        .roundedRect(qrX, qrY, qrSize, qrSize, cornerRadius) // vẽ path hình chữ nhật bo góc
        .clip(); // chuyển sang chế độ cắt
      // vẽ ảnh trong vùng đã clip
      doc.image(qrBuffer, qrX, qrY, { fit: [qrSize, qrSize] });
      doc.restore();

      // "Xin cảm ơn!" canh phải, giữa theo chiều cao container
      const thankMsg =
        "Chân thành cảm ơn quý khách\nđã tin tưởng và sử dụng dịch vụ!";
      doc
        .font("Script")
        .fontSize(26)
        .fillColor(goldPrimary)
        .text(
          thankMsg,
          qrX + qrSize + 40,
          containerY + containerHeight / 2 - 30,
          {
            align: "center",
            lineGap: 4,
            width: containerWidth - qrSize - 60,
          }
        );
    }

    // End PDF
    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { exportBookingPdf };
