'use strict';

// Required modules
const express = require('express');

// Create the ExpressJS application
const app = express();

// Configure the application
app.disable('x-powered-by');

// Middleware
app.use(require('helmet')({
  hsts: false // Handle this with your proxy, god damn it!
}));
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    req.rawBody = '';

    req.on('data', chunk => { 
      req.rawBody += chunk;
    });

    req.on('end', () => {
      if (req.get('Content-Type').toLowerCase().indexOf('application/json') > -1) {
        try {
          req.body = JSON.parse(req.rawBody);
        } catch (err) {
          return next(err);
        }
      }
      
      next();
    });
  } else {
    // Keep going
    next();
  }
});

// ----- ROUTES ------
app.use('/register', require('./routes/register.js'));
app.use('/hooks', require('./routes/hooks.js'));
app.use('/webhook', require('./routes/webhook.js'));
// ----- END ROUTES ------

// 404 handler
app.use((req, res, next) => {
  if (!res.headersSent) {
    res.status(404).send({
      message: 'NotFound',
      hint: 'Please read the documentation at https://github.com/deansheather/git-to-discord to find out how to link your GitHub repository/organization to Discord.'
    });
  }
});

// 500 handler
app.use((err, req, res, next) => {
  console.error('An internal server error occurred:');
  console.error(err);

  if (!res.headersSent) {
    res.status(500).send({
      message: 'InternalServerError'
    });
  }
});

// Listen on NODE_PORT or 3000
const server = app.listen(process.env['NODE_PORT'] || 3000, () => {
  let address = server.address();
  console.log('Express server listening at ' + address.address + ':' + address.port + '.');
});

// Expose the server for unit testing
module.exports = server;
