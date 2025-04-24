import authService from "../services/authService";

const handleRegister = async (req, res) => {
  const result = await authService.register(req.body);
  res.status(result.errCode === 0 ? 200 : 400).json(result);
};

const handleLogin = async (req, res) => {
  const result = await authService.login(req.body);
  res.status(result.errCode === 0 ? 200 : 401).json(result);
};

export default { handleRegister, handleLogin };
