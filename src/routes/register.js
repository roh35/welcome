'use strict';

// Required modules
const express = require('express');
const jsonfile = require('jsonfile');
const path = require('path');
const uuid = require('node-uuid');

// Create the router for the 'register' endpoint
const router = express.Router();

// Regexes
const RepositoryRegex = /^([a-z0-9._-]{0,38})\/([a-z0-9](?:-?[a-z0-9._-]){0,38})$/i;
const UsernameRegex = /^([a-z0-9]{0,38})$/i;
const WebhookRegex = /^https:\/\/canary\.discordapp\.com\/api\/webhooks\/[0-9]{16,21}\/[a-z0-9_.-]{68}$/i;

// Path to ../hooks.json
const PathToHooksJSON = path.join(__dirname, '..', 'hooks.json');

/*
 * POST /register/repository
 * Create a webhook listener for the specified repository.
 */
router.post('/repository', (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).send({
      message: 'BadRequest'
    });
  }

  // Find inconsistencies with the input
  let errors = [];
  if (!req.body.hasOwnProperty('repository') || typeof req.body.repository !== 'string' || !RepositoryRegex.test(req.body.repository)) {
    errors.push('"repository" must be a string in the following format: username/repository-name');
  }
  if (!req.body.hasOwnProperty('discordWebhooks') || !Array.isArray(req.body.discordWebhooks) || req.body.discordWebhooks.length === 0 || req.body.discordWebhooks.length > 5) {
    errors.push('"discordWebhooks" must be a an array of 1-5 unique and valid Discord webhook strings (without /slack)');
  }
  if (req.body.discordWebhooks.map(val => WebhookRegex.test(val)).indexOf(false) > -1) {
    errors.push('"discordWebhooks" must be a an array of 1-5 unique and valid Discord webhook strings (without /slack)');
  }

  // ... and return them
  if (errors.length > 0) {
    return res.status(400).send({
      message: 'BadRequest',
      errors: errors
    });
  }

  // Check for duplicates
  jsonfile.readFile(PathToHooksJSON, (err, hooks) => {
    if (err) {
      return next(err);
    }
    if (!Array.isArray(hooks.repositoryHooks)) {
      return next(new Error('invalid hooks.json JSON file (missing repositoryHooks)'));
    }

    // Iterate through current hooks to check for duplicates
    for (let hook of hooks.repositoryHooks) {
      if (hook.repositoryFullname.toLowerCase() === req.body.repository.toLowerCase()) {
        return res.status(403).send({
          message: 'Forbidden',
          hint: 'That repository is already registered as a webhook here, under /hooks/' + hook.id
        });
      }
    }

    // Check for duplicated webhook strings
    let hookUrls = req.body.discordWebhooks.slice(0),
        len = hookUrls.length;

    for (var i = 0; i < len; i++) {
      let hook = hookUrls.splice(0);
      if (hookUrls.indexOf(hook) > -1) {
        // Duplicated webhook string, remove from source array
        req.body.discordWebhooks.splice(req.body.discordWebhooks.indexOf(hook), 1);
      }
    }

    // Create the webhook
    var newHook = {
      id: uuid.v4(),
      secret: uuid.v4(),
      repositoryFullname: req.body.repository,
      discordWebhooks: req.body.discordWebhooks
    };

    hooks.repositoryHooks.push(newHook);

    // Save the hooks file
    jsonfile.writeFile(PathToHooksJSON, hooks, err => {
      if (err) {
        return next(err);
      }

      // Send the data
      res.status(201).send(newHook);
    });
  });
});

/*
 * POST /register/organization
 * Create a webhook listener for the specified organization or user.
 */
router.post('/organization', (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).send({
      message: 'BadRequest'
    });
  }

  // Find inconsistencies with the input
  let errors = [];
  if (!req.body.hasOwnProperty('organization') || typeof req.body.organization !== 'string' || !UsernameRegex.test(req.body.organization)) {
    errors.push('"organization" must be a valid GitHub username string');
  }
  if (!req.body.hasOwnProperty('discordWebhooks') || !Array.isArray(req.body.discordWebhooks) || req.body.discordWebhooks.length === 0 || req.body.discordWebhooks.length > 5) {
    errors.push('"discordWebhooks" must be a an array of 1-5 unique and valid Discord webhook strings (without /slack)');
  }
  if (req.body.discordWebhooks.map(val => WebhookRegex.test(val)).indexOf(false) > -1) {
    errors.push('"discordWebhooks" must be a an array of 1-5 unique and valid Discord webhook strings (without /slack)');
  }

  // ... and return them
  if (errors.length > 0) {
    return res.status(400).send({
      message: 'BadRequest',
      errors: errors
    });
  }

  // Check for duplicates
  jsonfile.readFile(PathToHooksJSON, (err, hooks) => {
    if (err) {
      return next(err);
    }
    if (!Array.isArray(hooks.organizationHooks)) {
      return next(new Error('invalid hooks.json JSON file (missing organizationHooks)'));
    }

    // Iterate through current hooks to check for duplicates
    for (let hook of hooks.organizationHooks) {
      if (hook.organization.toLowerCase() === req.body.organization.toLowerCase()) {
        return res.status(403).send({
          message: 'Forbidden',
          hint: 'That repository is already registered as a webhook here, under /hooks/' + hook.id
        });
      }
    }

    // Check for duplicated webhook strings
    let hookUrls = req.body.discordWebhooks.slice(0),
        len = hookUrls.length;

    for (var i = 0; i < len; i++) {
      let hook = hookUrls.splice(0);
      if (hookUrls.indexOf(hook) > -1) {
        // Duplicated webhook string, remove from source array
        req.body.discordWebhooks.splice(req.body.discordWebhooks.indexOf(hook), 1);
      }
    }

    // Create the webhook
    var newHook = {
      id: uuid.v4(),
      secret: uuid.v4(),
      organization: req.body.organization,
      discordWebhooks: req.body.discordWebhooks
    };

    hooks.organizationHooks.push(newHook);

    // Save the hooks file
    jsonfile.writeFile(PathToHooksJSON, hooks, err => {
      if (err) {
        return next(err);
      }

      // Send the data
      res.status(201).send(newHook);
    });
  });
});

// Expose the router
module.exports = router;
