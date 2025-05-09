const PDFDocument = require("pdfkit");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const db = require("../models");
const { JSDOM } = require("jsdom");
const canvas = require("canvas");
const os = require("os");

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
    const formatDate = (dateInput) => {
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

    // 1) Header: Logo & Seller (Updated with new company info, moved further up)
    const logoPath = path.join(__dirname, "../assets/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, leftX, 35, { fit: [180, 80] });
    }
    // Updated company info, moved up further to 20
    doc
      .font("Header")
      .fontSize(12)
      .fillColor("#FFF")
      .text("CÔNG TY TNHH THƯƠNG MẠI THÀNH PHÁT GLOBAL", rightX, 20) // Moved up to 20
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

    // 2) Title: "Xác nhận dịch vụ" - center aligned, single line
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

    // Draw table lines and content
    details.forEach(([label, val]) => {
      // Đảm bảo val không phải null/undefined trước khi gọi toString
      const valStr = val !== null && val !== undefined ? String(val) : "-";

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

      // Lấy chiều cao lớn hơn giữa nhãn và giá trị, thêm padding
      const contentHeight = Math.max(labelTextHeight, valueTextHeight) + 10;

      // vertical line
      doc
        .strokeColor("#FFF")
        .lineWidth(0.5)
        .moveTo(leftX + labelWidth, currentY)
        .lineTo(leftX + labelWidth, currentY + contentHeight)
        .stroke();

      // horizontal bottom line
      doc
        .strokeColor("#FFF")
        .lineWidth(0.5)
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
      const qrX = containerX + 35;
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

      const thankX = qrX + qrSize + 40;
      const thankWidth = containerWidth - qrSize - 60;
      let currentTextY = containerY + 60;

      doc.font("Body").fontSize(15).fillColor("#FFF");

      const bankInfo = [
        `Ngân hàng: ${booking.seller.bank || "-"}`,
        `Chủ tài khoản: ${booking.seller.bankAccountName || "-"}`,
        `Số tài khoản: ${booking.seller.bankAccountNumber || "-"}`,
      ];

      bankInfo.forEach((line) => {
        doc.text(line, thankX, currentTextY, {
          align: "left",
          width: thankWidth,
        });
        currentTextY += 23;
      });
      currentTextY += 35;

      doc
        .font("Body")
        .fontSize(18)
        .fillColor(goldPrimary)
        .text("Thank you and Best regards!", thankX, currentTextY, {
          width: thankWidth,
        });
    }

    // End PDF
    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Export booking as styled booking info HTML or PNG
 * If format=png is specified in query, returns a PNG image
 * Otherwise returns HTML that can be printed or saved as image from browser
 */
const exportBookingImage = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const format = req.query.format?.toLowerCase();
    const isImageFormat = format === "png" || format === "jpg";

    const booking = await db.Booking.findByPk(bookingId, {
      include: [{ model: db.Seller, as: "seller" }],
    });
    if (!booking || !booking.seller) {
      return res.status(404).json({ message: "Booking or Seller not found" });
    }

    // Helpers
    const formatDate = (dateInput) => {
      try {
        const date = new Date(dateInput);

        return new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
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

    // Get QR code data
    let qrImageData = "";
    if (booking.seller.qrCodeUrl) {
      try {
        const qrRes = await axios.get(booking.seller.qrCodeUrl, {
          responseType: "arraybuffer",
        });
        const qrBuffer = Buffer.from(qrRes.data, "binary");
        qrImageData = `data:image/png;base64,${qrBuffer.toString("base64")}`;
      } catch (error) {
        console.error("Error fetching QR code:", error);
      }
    }

    // Get logo data
    let logoImageData = "";
    const logoPath = path.join(__dirname, "../assets/logo.png");
    if (fs.existsSync(logoPath)) {
      try {
        const logoBuffer = fs.readFileSync(logoPath);
        logoImageData = `data:image/png;base64,${logoBuffer.toString(
          "base64"
        )}`;
      } catch (error) {
        console.error("Error reading logo:", error);
      }
    }

    // Create details rows
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

    // Construct details HTML
    let detailsHtml = "";
    details.forEach(([label, value]) => {
      detailsHtml += `
        <tr>
          <td class="label">${label}</td>
          <td class="value">${value}</td>
        </tr>
      `;
    });

    // Build the HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Booking #${bookingId}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans:wght@400;700&display=swap');
          
          body {
            font-family: 'Open Sans', sans-serif;
            background-color: #2E2E2E;
            color: #FFFFFF;
            margin: 0;
            padding: 20px;
          }
          
          .container {
            width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #2E2E2E;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 1px solid #FFF;
            padding-bottom: 20px;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
          }
          
          .company-info {
            font-size: 12px;
            line-height: 1.5;
          }
          
          .title {
            font-family: 'Montserrat', sans-serif;
            font-weight: bold;
            font-size: 32px;
            color: #D4AF37;
            text-align: center;
            margin: 20px 0;
          }
          
          .customer-info {
            text-align: center;
            margin-bottom: 40px;
          }
          
          .section-title {
            font-family: 'Montserrat', sans-serif;
            font-weight: bold;
            font-size: 18px;
            color: #D4AF37;
            text-align: center;
            margin: 20px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          tr {
            border-bottom: 1px solid #FFF;
          }
          
          td {
            padding: 12px 8px;
          }
          
          .label {
            width: 140px;
            font-weight: bold;
            border-right: 1px solid #FFF;
          }
          
          .value {
            padding-left: 16px;
          }
          
          .total-price {
            font-weight: bold;
            font-size: 18px;
            color: #D4AF37;
            text-align: right;
            margin: 20px 0;
            padding: 10px 0;
            border-top: 1px solid #FFF;
            border-bottom: 1px solid #FFF;
          }
          
          .payment-info {
            background-color: #1F1F1F;
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            display: flex;
          }
          
          .payment-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 20px;
          }
          
          .qr-code {
            width: 180px;
            height: 180px;
            border-radius: 12px;
            object-fit: contain;
          }
          
          .bank-details {
            flex: 1;
            padding-left: 40px;
            display: flex;
            flex-direction: column;
          }
          
          .bank-info {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 35px;
          }
          
          .thank-you {
            font-size: 18px;
            color: #D4AF37;
            margin-top: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              ${
                logoImageData
                  ? `<img class="logo" src="${logoImageData}" alt="Logo">`
                  : ""
              }
            </div>
            <div class="company-info">
              <div>CÔNG TY TNHH THƯƠNG MẠI THÀNH PHÁT GLOBAL</div>
              <div>Add: Ô 19 + 20, Lô 8, Đường Phan Đăng Lưu, Hồng Hải, TP Hạ Long, Quảng Ninh</div>
              <div>Hotline: 0979.754.556</div>
              <div>Email: info@thanhphatglobal.com</div>
            </div>
          </div>
          
          <div class="title">Xác nhận dịch vụ</div>
          
          <div class="customer-info">
            <div>Khách hàng: ${booking.customerName}</div>
            <div>Số điện thoại: ${booking.phoneNumber}</div>
          </div>
          
          <div class="section-title">Chi tiết dịch vụ</div>
          
          <table>
            ${detailsHtml}
          </table>
          
          <div class="total-price">
            Thành tiền: ${formatVND(booking.price)}
          </div>
          
          <div class="payment-info">
            <div>
              <div class="payment-title">THÔNG TIN THANH TOÁN</div>
              ${
                qrImageData
                  ? `<img class="qr-code" src="${qrImageData}" alt="QR Code">`
                  : ""
              }
            </div>
            
            <div class="bank-details">
              <div class="bank-info">
                <div>Ngân hàng: ${booking.seller.bank || "-"}</div>
                <div>Chủ tài khoản: ${
                  booking.seller.bankAccountName || "-"
                }</div>
                <div>Số tài khoản: ${
                  booking.seller.bankAccountNumber || "-"
                }</div>
              </div>
              <div class="thank-you">Thank you and Best regards!</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // If PNG format is requested
    if (isImageFormat) {
      // Tạo file HTML tạm thời
      const tempHtmlPath = path.join(
        os.tmpdir(),
        `booking_${bookingId}_temp.html`
      );
      fs.writeFileSync(tempHtmlPath, html);

      // Tạo file ảnh từ HTML sử dụng canvas
      try {
        // Setup JSDOM with a virtual DOM
        const width = 900; // Tăng chiều rộng
        const height = 1300; // Tăng chiều cao

        const { window } = new JSDOM(html, {
          resources: "usable",
          url: `file://${tempHtmlPath}`,
          features: {
            FetchExternalResources: ["img"],
            ProcessExternalResources: ["img"],
          },
        });

        // Create canvas
        const canvasEl = canvas.createCanvas(width, height);
        const ctx = canvasEl.getContext("2d");

        // Fill background
        ctx.fillStyle = "#2E2E2E";
        ctx.fillRect(0, 0, width, height);

        // Tạo promise để load hình ảnh đồng bộ
        const loadImage = (src) => {
          return new Promise((resolve, reject) => {
            const img = new canvas.Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = src;
          });
        };

        // Cài đặt font mặc định
        const registerFont = () => {
          try {
            // Đăng ký font nếu có thể
            canvas.registerFont(
              path.join(__dirname, "../fonts/OpenSans-Regular.ttf"),
              {
                family: "Open Sans",
              }
            );
            canvas.registerFont(
              path.join(__dirname, "../fonts/Montserrat-Bold.ttf"),
              {
                family: "Montserrat",
                weight: "bold",
              }
            );
          } catch (err) {
            console.error("Font registration error:", err);
          }
        };

        try {
          registerFont();
        } catch (err) {
          console.log("Could not register fonts:", err);
        }

        // Căn giữa text
        const drawCenteredText = (text, x, y, maxWidth) => {
          const metrics = ctx.measureText(text);
          const textWidth = metrics.width;
          const startX = x + (maxWidth - textWidth) / 2;
          ctx.fillText(text, startX, y);
        };

        // Vẽ text dài có thể xuống dòng
        const drawWrappedText = (text, x, y, maxWidth, lineHeight) => {
          const words = text.split(" ");
          let line = "";
          let testLine = "";
          let lineArray = [];

          for (let n = 0; n < words.length; n++) {
            testLine += `${words[n]} `;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
              lineArray.push(line);
              line = `${words[n]} `;
              testLine = `${words[n]} `;
            } else {
              line = testLine;
            }
          }

          lineArray.push(line);

          for (let i = 0; i < lineArray.length; i++) {
            ctx.fillText(lineArray[i], x, y + i * lineHeight);
          }

          return lineArray.length * lineHeight;
        };

        // Render các phần tử theo thứ tự đồng bộ
        try {
          // Căn lề trái
          const leftMargin = 60;

          // Logo
          let logoImg = null;
          if (logoImageData) {
            try {
              logoImg = await loadImage(logoImageData);
              ctx.drawImage(logoImg, leftMargin, 40, 180, 80);
            } catch (err) {
              console.error("Error loading logo:", err);
            }
          }

          // Company info
          const rightColumnX = 300;
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "13px sans-serif";
          ctx.fillText(
            "CÔNG TY TNHH THƯƠNG MẠI THÀNH PHÁT GLOBAL",
            rightColumnX,
            50
          );
          ctx.fillText(
            "Add: Ô 19 + 20, Lô 8, Đường Phan Đăng Lưu, Hồng Hải, TP Hạ Long, Quảng Ninh",
            rightColumnX,
            70
          );
          ctx.fillText("Hotline: 0979.754.556", rightColumnX, 90);
          ctx.fillText("Email: info@thanhphatglobal.com", rightColumnX, 110);

          // Draw header line
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(leftMargin, 140);
          ctx.lineTo(width - leftMargin, 140);
          ctx.stroke();

          // Title
          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 32px sans-serif";
          drawCenteredText(
            "Xác nhận dịch vụ",
            leftMargin,
            180,
            width - 2 * leftMargin
          );

          // Customer info
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "15px sans-serif";
          drawCenteredText(
            `Khách hàng: ${booking.customerName}`,
            leftMargin,
            220,
            width - 2 * leftMargin
          );
          drawCenteredText(
            `Số điện thoại: ${booking.phoneNumber}`,
            leftMargin,
            245,
            width - 2 * leftMargin
          );

          // Section title
          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 20px sans-serif";
          drawCenteredText(
            "Chi tiết dịch vụ",
            leftMargin,
            290,
            width - 2 * leftMargin
          );

          // Details table
          const tableWidth = width - 2 * leftMargin;
          const labelColumnWidth = 180;
          const valueColumnStart = leftMargin + labelColumnWidth;
          const valueColumnWidth = tableWidth - labelColumnWidth;

          ctx.fillStyle = "#FFFFFF";
          let tableY = 330;
          const rowHeight = 45;

          // Table header
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 0.5;

          // Table border top
          ctx.beginPath();
          ctx.moveTo(leftMargin, tableY - 10);
          ctx.lineTo(leftMargin + tableWidth, tableY - 10);
          ctx.stroke();

          details.forEach(([label, value], index) => {
            // Label column
            ctx.font = "bold 15px sans-serif";
            ctx.fillText(label, leftMargin + 10, tableY + 18);

            // Value column
            ctx.font = "15px sans-serif";
            const valueText = String(value);
            const wrappedHeight = drawWrappedText(
              valueText,
              valueColumnStart + 10,
              tableY + 18,
              valueColumnWidth - 20,
              22
            );

            const rowHeightDynamic = Math.max(rowHeight, wrappedHeight + 15);

            // Vertical divider
            ctx.beginPath();
            ctx.moveTo(valueColumnStart, tableY - 10);
            ctx.lineTo(valueColumnStart, tableY + rowHeightDynamic);
            ctx.stroke();

            // Horizontal bottom line
            ctx.beginPath();
            ctx.moveTo(leftMargin, tableY + rowHeightDynamic);
            ctx.lineTo(leftMargin + tableWidth, tableY + rowHeightDynamic);
            ctx.stroke();

            tableY += rowHeightDynamic;
          });

          // Total price
          tableY += 20;
          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText(
            `Thành tiền: ${formatVND(booking.price)}`,
            leftMargin + tableWidth - 300,
            tableY
          );

          // Draw line under total price
          tableY += 20;
          ctx.strokeStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.moveTo(leftMargin, tableY);
          ctx.lineTo(leftMargin + tableWidth, tableY);
          ctx.stroke();

          // Payment info box
          const paymentBoxY = tableY + 30;
          const paymentBoxHeight = 260;
          ctx.fillStyle = "#1F1F1F";

          // Vẽ hình chữ nhật bo tròn góc
          ctx.beginPath();
          ctx.roundRect(
            leftMargin,
            paymentBoxY,
            tableWidth,
            paymentBoxHeight,
            10
          );
          ctx.fill();

          // Payment box border
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(
            leftMargin,
            paymentBoxY,
            tableWidth,
            paymentBoxHeight,
            10
          );
          ctx.stroke();

          // Payment title
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 16px sans-serif";
          ctx.fillText(
            "THÔNG TIN THANH TOÁN",
            leftMargin + 20,
            paymentBoxY + 30
          );

          // QR Code
          if (qrImageData) {
            try {
              const qrImg = await loadImage(qrImageData);
              const qrSize = 180;
              ctx.drawImage(
                qrImg,
                leftMargin + 20,
                paymentBoxY + 50,
                qrSize,
                qrSize
              );

              // Bank info
              const bankInfoX = leftMargin + qrSize + 50;
              ctx.fillStyle = "#FFFFFF";
              ctx.font = "16px sans-serif";
              ctx.fillText(
                `Ngân hàng: ${booking.seller.bank || "-"}`,
                bankInfoX,
                paymentBoxY + 70
              );
              ctx.fillText(
                `Chủ tài khoản: ${booking.seller.bankAccountName || "-"}`,
                bankInfoX,
                paymentBoxY + 100
              );
              ctx.fillText(
                `Số tài khoản: ${booking.seller.bankAccountNumber || "-"}`,
                bankInfoX,
                paymentBoxY + 130
              );

              // Thank you
              ctx.fillStyle = "#D4AF37";
              ctx.font = "bold 18px sans-serif";
              ctx.fillText(
                "Thank you and Best regards!",
                bankInfoX,
                paymentBoxY + 190
              );
            } catch (err) {
              console.error("Error loading QR code:", err);
            }
          } else {
            // Bank info (no QR)
            const bankInfoX = leftMargin + 30;
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "16px sans-serif";
            ctx.fillText(
              `Ngân hàng: ${booking.seller.bank || "-"}`,
              bankInfoX,
              paymentBoxY + 70
            );
            ctx.fillText(
              `Chủ tài khoản: ${booking.seller.bankAccountName || "-"}`,
              bankInfoX,
              paymentBoxY + 100
            );
            ctx.fillText(
              `Số tài khoản: ${booking.seller.bankAccountNumber || "-"}`,
              bankInfoX,
              paymentBoxY + 130
            );

            // Thank you
            ctx.fillStyle = "#D4AF37";
            ctx.font = "bold 18px sans-serif";
            ctx.fillText(
              "Thank you and Best regards!",
              bankInfoX,
              paymentBoxY + 190
            );
          }

          // Generate PNG buffer with high quality
          const pngOptions = { quality: 1, compressionLevel: 0 };
          const pngBuffer = canvasEl.toBuffer(
            format === "jpg" ? "image/jpeg" : "image/png",
            format === "jpg" ? { quality: 0.95 } : pngOptions
          );

          // Set headers and send PNG response
          res.setHeader(
            "Content-Type",
            format === "jpg" ? "image/jpeg" : "image/png"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=booking_${bookingId}.${format}`
          );
          res.send(pngBuffer);
        } catch (renderErr) {
          console.error("Error rendering image:", renderErr);
          throw renderErr;
        }

        // Clean up temporary file
        fs.unlink(tempHtmlPath, (err) => {
          if (err) console.error(`Error deleting temp HTML: ${err}`);
        });
      } catch (err) {
        console.error("Error generating image:", err);
        // Fallback to HTML if image generation fails
        res.setHeader("Content-Type", "text/html");
        res.setHeader(
          "Content-Disposition",
          `inline; filename=booking_${bookingId}.html`
        );
        res.send(html);
      }
    } else {
      // Set headers and send HTML response
      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=booking_${bookingId}.html`
      );
      res.send(html);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { exportBookingPdf, exportBookingImage };
