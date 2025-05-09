const PDFDocument = require("pdfkit");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const db = require("../models");

/**
 * Export booking as styled booking info PDF
 */
const exportBookingPdf = async (req, res, next) => {
  let booking;
  try {
    // 1) Lấy booking & seller trước
    const bookingId = req.params.id;
    booking = await db.Booking.findByPk(bookingId, {
      include: [{ model: db.Seller, as: "seller" }],
    });
    if (!booking || !booking.seller) {
      return res.status(404).json({ message: "Booking or Seller not found" });
    }
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

  // 2) Chỉ khi đã có booking, mới setup PDF
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=booking_${booking.id}.pdf`
  );
  const doc = new PDFDocument({ margin: 50 });

  // Bắt lỗi từ PDFDocument
  doc.on("error", (err) => {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).send("Error generating PDF");
    }
    doc.destroy();
  });

  // Pipe PDF stream vào HTTP response
  doc.pipe(res);

  try {
    // Helpers
    const formatDate = (dateInput) => {
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
        const date = new Date(Date.UTC(year, month - 1, day));

        return new Intl.DateTimeFormat("vi-VN", {
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

    const formatVND = (amount) =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(amount);

    // Colors (match logo)
    const bgDark = "#2E2E2E"; // deep grey background
    const goldPrimary = "#D4AF37"; // metallic gold
    const goldSecondary = "#FFD700"; // bright gold

    // Draw full-page background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(bgDark);
    doc.fillColor("#FFF");

    // Load fonts
    const regular = path.join(__dirname, "../fonts/Roboto-Regular.ttf");
    const bold = path.join(__dirname, "../fonts/Roboto-Bold.ttf");
    const scriptFont = path.join(__dirname, "../fonts/GreatVibes-Regular.ttf");
    doc.registerFont("Script", scriptFont);
    doc.registerFont("Regular", regular);
    doc.registerFont("Bold", bold);
    doc.registerFont(
      "Body",
      path.join(__dirname, "../fonts/OpenSans-Regular.ttf")
    );
    doc.registerFont(
      "Header",
      path.join(__dirname, "../fonts/Montserrat-Bold.ttf")
    );

    // Layout variables
    const leftX = doc.page.margins.left;
    const usableW = doc.page.width - leftX - doc.page.margins.right;
    const rightX = leftX + usableW / 2 + 20;

    // 1) Header: Logo & Seller info
    const logoPath = path.join(__dirname, "../assets/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, leftX, 35, { fit: [180, 80] });
    }
    doc
      .font("Header")
      .fontSize(12)
      .fillColor("#FFF")
      .text("Công ty TNHH Thương Mại Thành Phát Global", rightX, 20)
      .font("Body")
      .fontSize(12)
      .text(
        "Add: Ô 19 + 20, Lô 8, Đường Phan Đăng Lưu, Hồng Hải, TP Hạ Long, Quảng Ninh",
        rightX,
        doc.y + 4
      )
      .text("Hotline: 0979.754.556", rightX, doc.y + 2)
      .text("Email: info@thanhphatglobal.com", rightX, doc.y + 2);

    // Divider dưới header
    doc
      .moveTo(leftX, 130)
      .lineTo(doc.page.width - doc.page.margins.right, 130)
      .strokeColor("#FFF")
      .lineWidth(0.5)
      .stroke();

    // 2) Title
    const titleY = 140;
    doc
      .font("Header")
      .fontSize(32)
      .fillColor(goldPrimary)
      .text("Xác nhận dịch vụ", leftX, titleY, {
        width: usableW,
        align: "center",
      });

    // 2.1) Company & Customer info - moved below title, also centered
    doc
      .font("Body")
      .fontSize(18)
      .fillColor(goldPrimary)
      .font("Regular")
      .fontSize(13)
      .fillColor("#FFF")
      // .text(`Mã đặt phòng: #00${booking.id}`, leftX, doc.y + 4, {
      //   width: usableW,
      //   align: "center",
      // })
      .text(`Khách hàng: ${booking.customerName}`, leftX, doc.y + 6, {
        width: usableW,
        align: "center",
      })
      .text(`Số điện thoại: ${booking.phoneNumber}`, leftX, doc.y + 2, {
        width: usableW,
        align: "center",
      });

    // 3) Details list (except price)
    const detailsStartY = 240;
    const rowHeight = 32;
    const detailsWidth = usableW;
    const labelWidth = 140;
    const valueWidth = detailsWidth - labelWidth;
    const details = [
      ["Dịch vụ", booking.serviceRequest || "-"],
      ["Số khách", booking.guestCount || "-"],
      ["Số phòng", booking.roomCount || "-"],
      ["Hạng phòng", booking.roomClass || "-"],
      [
        "Ngày nhận phòng",
        booking.checkInDate ? formatDate(booking.checkInDate) : "-",
      ],
      [
        "Ngày trả phòng",
        booking.checkOutDate ? formatDate(booking.checkOutDate) : "-",
      ],
      ["Ghi chú", booking.note || "-"],
    ];

    // Table header
    let currentY = detailsStartY;
    doc
      .font("Header")
      .fontSize(18)
      .fillColor(goldPrimary)
      .text("Chi tiết dịch vụ", leftX, currentY, {
        width: detailsWidth,
        align: "center",
      });
    currentY += rowHeight + 12;

    details.forEach(([label, val]) => {
      // Đảm bảo val không phải null/undefined trước khi gọi toString
      const valStr = val !== null && val !== undefined ? val.toString() : "-";
      const labelTextHeight = doc.heightOfString(label, {
        width: labelWidth - 16,
        align: "left",
        font: "Bold",
        fontSize: 12,
      });

      const valueTextHeight = doc.heightOfString(valStr, {

        width: valueWidth - 16,
        align: "left",
        font: "Regular",
        fontSize: 12,
      });
      const contentHeight = Math.max(labelTextHeight, valueTextHeight) + 10;

      // Vertical & horizontal lines
      doc
        .strokeColor("#FFF")
        .lineWidth(0.5)
        .moveTo(leftX + labelWidth, currentY)
        .lineTo(leftX + labelWidth, currentY + contentHeight)
        .stroke()
        .moveTo(leftX, currentY + contentHeight)
        .lineTo(leftX + detailsWidth, currentY + contentHeight)
        .stroke();

      // Text label
      doc
        .font("Body")
        .fontSize(12)
        .fillColor("#FFF")
        .text(label, leftX + 8, currentY + 6, {
          width: labelWidth - 16,
        });

      // Text value
      doc
        .font("Body")
        .fontSize(12)
        .fillColor("#FFF")
        .text(valStr, leftX + labelWidth + 8, currentY + 6, {

          width: valueWidth - 16,
        });

      currentY += contentHeight;
    });

    // 4) Thành tiền
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
    currentY = priceBottomY + 10;

    // 5) Bank QR & "Xin cảm ơn!"
    const containerHeight = 240;
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
      const thankMsg = "Thank you and Best regards!";
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
    // Kết thúc PDF
    doc.end();
  } catch (err) {
    console.error("Unexpected error:", err);
    if (!doc._writableEnded) doc.destroy();
    next(err);
  }
};

module.exports = { exportBookingPdf };
