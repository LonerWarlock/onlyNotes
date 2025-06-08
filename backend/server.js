const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const File = require('./models/File');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Routes
app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.file) return res.status(400).send('No file uploaded');

  const uploadedFile = req.files.file;
  const file = new File({
    filename: uploadedFile.name,
    mimetype: uploadedFile.mimetype,
    data: uploadedFile.data,
  });

  await file.save();
  res.json({ id: file._id, filename: file.filename });
});

app.get('/files', async (req, res) => {
  const files = await File.find({}, { data: 0 }).sort({ createdAt: -1 });
  res.json(files);
});

app.get('/file/:id', async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send('File not found');

  res.contentType(file.mimetype);
  res.send(file.data);
});

// Exported for Electron
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server failed to start:', err);
  }
}

module.exports = startServer;

// Optional standalone start (for testing server independently)
if (require.main === module) {
  startServer();
}