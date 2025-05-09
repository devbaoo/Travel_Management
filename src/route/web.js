import express from "express";
import sellerController from "../controllers/sellerController";
import bookingController from "../controllers/bookingController";
import exportBookingPdf from "../controllers/exportBookingPdf";
import exportBookingTxt from "../controllers/exportBookingTxt";
import dashboardController from "../controllers/dashboardController";
import authController from "../controllers/authController";
import multer from "multer";

let router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let initWebRoutes = (app) => {
  // Seller API
  router.post(
    "/api/create-seller",
    upload.single("qrCodeFile"),
    sellerController.createSeller
  );
  router.get("/api/get-all-sellers", sellerController.getAllSellers);
  router.get("/api/get-detail-seller/:id", sellerController.getDetailSeller);
  router.delete("/api/delete-seller/:id", sellerController.deleteSeller);
  router.put(
    "/api/update-seller/:id",
    upload.single("qrCodeFile"),
    sellerController.updateSeller
  );
  router.patch("/api/change-password/:id", sellerController.changePassword);

  // Booking API
  router.post("/api/create-booking", bookingController.createBooking);
  router.get("/api/get-all-bookings", bookingController.getAllBookings);
  router.get("/api/get-booking/:id", bookingController.getBookingById);
  router.put("/api/update-booking/:id", bookingController.updateBooking);
  router.delete("/api/delete-booking/:id", bookingController.deleteBooking);
  router.get(
    "/api/get-booking-by-seller/:sellerId",
    bookingController.getBookingBySeller
  );

  // Export API
  router.get("/api/bookings/:id/export", exportBookingPdf.exportBookingPdf);
  router.get(
    "/api/bookings/:id/export-image",
    exportBookingPdf.exportBookingImage
  );
  router.get("/api/bookings/:id/export-txt", exportBookingTxt.exportBookingTxt);

  // Dashboard API
  router.get("/api/get-dashboard", dashboardController.handleGetDashboard);
  router.get(
    "/api/get-seller-dashboard/:sellerId",
    dashboardController.handleGetSellerDashboard
  );
  router.get(
    "/api/get-revenue-by-seller",
    dashboardController.getRevenueBySellerByMonth
  );

  // Auth API
  router.post("/api/login", authController.handleLogin);

  return app.use("/", router);
};

module.exports = initWebRoutes;
