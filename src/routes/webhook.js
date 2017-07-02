'use strict';

// Required modules
const crypto = require('crypto');
const express = require('express');
const fire = require('../lib/fire.js');
const jsonfile = require('jsonfile');
const path = require('path');

// Create the router for the 'webhook' endpoint
const router = express.Router();

// Path to ../hooks.json
const PathToHooksJSON = path.join(__dirname, '..', 'hooks.json');

// Valid events
const events = [
  'push'
];

/*
 * POST /repository
 * Process an incoming webhook for a repository.
 */
router.post('/repository', (req, res, next) => {
  if (!req.get('X-Hub-Signature')) {
    return res.status(400).send({
      message: 'BadRequest',
      hint: 'No signature provided.'
    });
  }

  // Find the hook
  jsonfile.readFile(PathToHooksJSON, (err, hooks) => {
    if (err) {
      return next(err);
    }
    if (!Array.isArray(hooks.repositoryHooks)) {
      return next(new Error('invalid hooks.json JSON file (missing repositoryHooks)'));
    }

    // Find the hook
    for (let repoHook of hooks.repositoryHooks) {
      if (req.body.repository.full_name.toLowerCase() === repoHook.repositoryFullname.toLowerCase()) {
        req.hook = repoHook;
        req.hookType = 'repository';
        return next();
      }
    }

    // 404 error
    res.status(404).send({
      message: 'NotFound',
      hint: 'This hook does not exist.'
    });
  });
});

/*
 * POST /organization
 * Process an incoming webhook for an organization.
 */
router.post('/organization', (req, res, next) => {
  if (!req.get('X-Hub-Signature')) {
    return res.status(400).send({
      message: 'BadRequest',
      hint: 'No signature provided.'
    });
  }

  // Find the hook
  jsonfile.readFile(PathToHooksJSON, (err, hooks) => {
    if (err) {
      return next(err);
    }
    if (!Array.isArray(hooks.organizationHooks)) {
      return next(new Error('invalid hooks.json JSON file (missing organizationHooks)'));
    }

    // Find the hook
    for (let orgHook of hooks.organizationHooks) {
      if (
        (req.body.hasOwnProperty('repository') && req.body.repository.owner.name.toLowerCase() === orgHook.organization.toLowerCase()) ||
        (req.body.hasOwnProperty('organization') && req.body.organization.login.toLowerCase() === orgHook.organization.toLowerCase())
      ) {
        req.hook = orgHook;
        req.hookType = 'organization';
        return next();
      }
    }

    // 404 error
    res.status(404).send({
      message: 'NotFound',
      hint: 'This hook does not exist.'
    });
  });
});

/*
 * POST /webhook/*
 * Finish processing the incoming webhook.
 */
router.post(['/repository', '/organization'], (req, res, next) => {
  // Create a signature
  var sig = new Buffer('sha1=' + crypto.createHmac('sha1', req.hook.secret).update(req.rawBody).digest('hex'));

  // Compare the signature
  if (Buffer.compare(sig, new Buffer(req.get('X-Hub-Signature'))) !== 0) {
    // 403 on invalid signature
    return res.status(403).send({
      message: 'Forbidden',
      hint: 'The signature on the request was not signed with the prearranged secret.'
    });
  }

  // Check if it's an event we can process
  if (!fire.hasOwnProperty(req.get('X-GitHub-Event'))) {
    // This is the end of the processing, it was a valid request though.
    return res.status(200).send({
      message: 'OK',
      hint: 'This event is an event that will not be processed.'
    });
  }

  // Process the event
  fire[req.get('X-GitHub-Event')](req, res, next);
});

// Expose the router
module.exports = router;
