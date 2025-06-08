const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: true }
  });

  win.loadFile('public/index.html');
}

function startExpress() {
  const serverApp = express();
  const staticPath = path.join(__dirname, 'backend/files');

  serverApp.use('/files', express.static(staticPath));
  serverApp.get('/ping', (req, res) => res.send('pong'));

  serverApp.listen(3000, () => console.log('Backend running on port 3000'));
}

app.whenReady().then(() => {
  startExpress();
  createWindow();
});
