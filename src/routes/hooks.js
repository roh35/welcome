'use strict';

// Required modules
const express = require('express');
const jsonfile = require('jsonfile');
const path = require('path');

// Create the router for the 'hooks' endpoint
const router = express.Router();

// Regexes
const UUIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WebhookRegex = /^https:\/\/canary\.discordapp\.com\/api\/webhooks\/[0-9]{16,21}\/[a-z0-9_.-]{68}$/i;

// Path to ../hooks.json
const PathToHooksJSON = path.join(__dirname, '..', 'hooks.json');

/*
 * PARAM hook_id
 * Authenticate the request and fetch the hook information.
 */
router.param('hook_id', (req, res, next, hook_id) => {
  if (!UUIDRegex.test(hook_id)) {
    // Invalid UUID, guaranteed 404
    return next();
  }

  // Secret (authorization) header
  var secret = req.get('Authorization');

  if (!secret) {
    return res.status(401).send({
      message: 'Unauthorized',
      hint: 'Make sure you include the secret in the "Authorization" header.'
    });
  }

  // Find the hook
  jsonfile.readFile(PathToHooksJSON, (err, hooks) => {
    if (err) {
      return next(err);
    }
    if (!Array.isArray(hooks.repositoryHooks) || !Array.isArray(hooks.organizationHooks)) {
      return next(new Error('invalid hooks.json JSON file'));
    }

    // Check if it's a repository hook
    for (let repoHook of hooks.repositoryHooks) {
      if (hook_id === repoHook.id) {
        if (secret === repoHook.secret) {
          req.hook = repoHook;
          req.hookType = 'repository';
          return next();
        } else {
          return res.status(403).send({
            message: 'Forbidden',
            hint: 'The secret key you provided was invalid for this hook.'
          });
        }
      }
    }

    // Check if it's a organization hook
    for (let orgHook of hooks.organizationHooks) {
      if (hook_id === orgHook.id) {
        if (secret === orgHook.secret) {
          req.hook = orgHook;
          req.hookType = 'organization';
          return next();
        } else {
          return res.status(403).send({
            message: 'Forbidden',
            hint: 'The secret key you provided was invalid for this hook.'
          });
        }
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
 * GET /hooks/:hook_id
 * Return information about the hook.
 */
router.get('/:hook_id', (req, res, next) => {
  req.hook.type = req.hookType;
  res.send(req.hook);
});

/*
 * DELETE /hooks/:hook_id
 * Delete the webhook.
 */
router.delete('/:hook_id', (req, res, next) => {
  // Find the hook
  jsonfile.readFile(PathToHooksJSON, (err, hooks) => {
    // Find and delete the hook
    for (var i = 0; i < hooks[req.hookType + 'Hooks'].length; i++) {
      if (req.hook.id === hooks[req.hookType + 'Hooks'][i].id) {
        hooks[req.hookType + 'Hooks'].splice(i, 1);
        break;
      }
    }

    // Save the hooks file
    jsonfile.writeFile(PathToHooksJSON, hooks, err => {
      if (err) {
        return next(err);
      }

      // Send the data
      res.status(200).send({
        message: 'OK',
        hint: 'Successfully deleted the specified hook.'
      });
    });
  });
});

// Expose the router
module.exports = router;
