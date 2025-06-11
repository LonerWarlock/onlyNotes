const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
require('./passport-config');
require('dotenv').config();

const File = require('./models/File');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Sessions for Passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ------------------ AUTH ROUTES ------------------

// Register
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// ------------------ GOOGLE AUTH ROUTES ------------------

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile'],
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const script = `
      <script>
        window.opener.postMessage({ token: "${token}" }, "*");
        window.close();
      </script>
    `;
    res.send(script);
  }
);

// ------------------ AUTH MIDDLEWARE ------------------

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token provided');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).send('Invalid token');
  }
}

// ------------------ FILE ROUTES ------------------

app.post('/upload', authMiddleware, async (req, res) => {
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

app.get('/files', authMiddleware, async (req, res) => {
  const files = await File.find({}, { data: 0 }).sort({ createdAt: -1 });
  res.json(files);
});

app.get('/file/:id', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send('No token provided');

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(403).send('Invalid token');
  }

  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).send('File not found');

  res.contentType(file.mimetype);
  res.send(file.data);
});

// ------------------ START SERVER ------------------

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

if (require.main === module) {
  startServer();
}
