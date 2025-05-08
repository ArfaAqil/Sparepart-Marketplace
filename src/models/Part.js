const { Schema, model } = require('mongoose');
const PartSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  seller: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = model('Part', PartSchema);
