const authService = require('../services/authService');
exports.register = async (req, res, next) => {
  try {
    const payload = await authService.register(req.body);
    res.status(201).json(payload);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const payload = await authService.login(req.body);
    res.json(payload);
  } catch (err) { next(err); }
};

exports.profile = (req, res) => {
  res.json({ user: req.user });
};
