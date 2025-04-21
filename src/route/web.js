import express from "express";
import sellerController from "../controllers/sellerController";
import bookingController from "../controllers/bookingController";
import exportBookingPdf from "../controllers/exportBookingPdf";
import exportBookingTxt from "../controllers/exportBookingTxt";
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
  // Booking API
  router.post("/api/create-booking", bookingController.createBooking);
  router.get("/api/get-all-bookings", bookingController.getAllBookings);
  router.get("/api/get-booking/:id", bookingController.getBookingById);
  router.put("/api/update-booking/:id", bookingController.updateBooking);
  router.delete("/api/delete-booking/:id", bookingController.deleteBooking);
  // Export API
  router.get("/api/bookings/:id/export", exportBookingPdf.exportBookingPdf);
  router.get("/api/bookings/:id/export-txt", exportBookingTxt.exportBookingTxt);

  return app.use("/", router);
};

module.exports = initWebRoutes;
