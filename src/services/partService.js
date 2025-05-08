const Part = require('../models/Part');

exports.list = async ({ page = 1, limit = 10, search = '' }) => {
  const query = search ? { name: new RegExp(search, 'i') } : {};
  const parts = await Part.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('seller', 'name email');
  const total = await Part.countDocuments(query);
  return { parts, total };
};

exports.create = async (data) => {
  const part = await Part.create(data);
  return part;
};

exports.getById = async (id) => {
  const part = await Part.findById(id).populate('seller', 'name email');
  if (!part) throw new Error('Not Found');
  return part;
};

exports.update = async (id, data) => {
  const part = await Part.findByIdAndUpdate(id, data, { new: true });
  if (!part) throw new Error('Not Found');
  return part;
};

exports.remove = async (id) => {
  await Part.findByIdAndDelete(id);
};
