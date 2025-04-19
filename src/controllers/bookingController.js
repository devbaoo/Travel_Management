import bookingService from "../services/bookingService.js";

let createBooking = async (req, res) => {
  try {
    let response = await bookingService.createBooking(req.body);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

let getAllBookings = async (req, res) => {
  try {
    let response = await bookingService.getAllBookings();
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

let getBookingById = async (req, res) => {
  try {
    let response = await bookingService.getBookingById(req.params.id);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

let updateBooking = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    let response = await bookingService.updateBooking(id, data);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

let deleteBooking = async (req, res) => {
  try {
    let response = await bookingService.deleteBooking(req.params.id);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

export default {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
