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
const getRevenueBySellerByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    const result = await dashboardService.getRevenueBySellerByMonth(
      month,
      year
    );
    if (result.errCode !== 0) {
      return res.status(400).json({ message: result.errMessage });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error("Revenue by Seller by Month API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default {
  handleGetDashboard,
  handleGetSellerDashboard,
  getRevenueBySellerByMonth,
};
