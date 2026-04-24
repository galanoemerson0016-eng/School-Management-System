/**
 * FormEase G7 — Backend Server
 * =============================
 * Express server for serving the React frontend.
 * Runs on localhost:3001 when packaged, or dev server port when in development.
 */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'FormEase G7' });
});

// SPA fallback: redirect all non-API requests to index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Start server
const server = app.listen(PORT, 'localhost', () => {
  console.log(`[FormEase G7 Server] Running on http://localhost:${PORT}`);
  if (process.env.ELECTRON_MODE === '1') {
    console.log('[FormEase G7 Server] Electron mode enabled');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[FormEase G7 Server] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[FormEase G7 Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[FormEase G7 Server] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[FormEase G7 Server] Server closed');
    process.exit(0);
  });
});

module.exports = server;
