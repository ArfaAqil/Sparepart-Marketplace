const partService = require('../services/partService');
exports.list = async (req, res, next) => {
  try {
    const result = await partService.list(req.query);
    res.json(result);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const part = await partService.create({ ...req.body, seller: req.user.id });
    res.status(201).json(part);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const part = await partService.getById(req.params.id);
    res.json(part);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const part = await partService.update(req.params.id, req.body);
    res.json(part);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await partService.remove(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
