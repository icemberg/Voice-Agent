const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();

app.use(express.json({
    limit: '2mb'
}));

// Serve the processed index.html (injected with API keys at Docker build time)
// Falls back gracefully if the public/ directory doesn't exist locally.
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

module.exports = app;
