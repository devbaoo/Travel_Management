import sellerService from "../services/sellerService";

let createSeller = async (req, res) => {
  try {
    let response = await sellerService.createSeller(req.body, req.file);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

let getAllSellers = async (req, res) => {
  try {
    let response = await sellerService.getAllSellers();
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

let getDetailSeller = async (req, res) => {
  try {
    let response = await sellerService.getDetailSeller(req.params.id);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};

let deleteSeller = async (req, res) => {
  try {
    let response = await sellerService.deleteSeller(req.params.id);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};
let updateSeller = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const file = req.file;
    let response = await sellerService.updateSeller(id, data, file);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Internal Server Error",
    });
  }
};
let changePassword = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    let response = await sellerService.changePassword(id, data);
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
  createSeller,
  getAllSellers,
  getDetailSeller,
  deleteSeller,
  updateSeller,
  changePassword,
};
