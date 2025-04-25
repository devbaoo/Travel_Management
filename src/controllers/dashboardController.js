import dashboardService from "../services/dashboardService";

let handleGetDashboard = async (req, res) => {
  try {
    const result = await dashboardService.getDashboardData();
    return res.status(200).json(result);
  } catch (e) {
    console.error("DashboardController Error:", e);
    return res
      .status(500)
      .json({ errCode: -1, errMessage: "Internal server error" });
  }
};
let handleGetSellerDashboard = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const result = await dashboardService.getSellerDashboardData(sellerId);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Get Seller Dashboard Error:", e);
    return res
      .status(500)
      .json({ errCode: -1, errMessage: "Internal server error" });
  }
};

export default {
  handleGetDashboard,
  handleGetSellerDashboard,
};
