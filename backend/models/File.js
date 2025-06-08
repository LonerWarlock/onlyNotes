const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  mimetype: String,
  data: Buffer,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);
