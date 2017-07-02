'use strict';

// Required modules
const Mustache = require('mustache');
const request = require('request-promise');

// Templates file
const templates = require('./templates.json');

/**
 * Send webhooks to Discord.
 * @param {string[]} webhookUrls
 * @param {string} webhookBody JSON webhook body.
 * @return {Promise<undefined, Error>}
 */
function sendToDiscord (webhookUrls, webhookBody) {
  // Promises array
  let promises = [];

  // Strip @everyone and @here
  webhookBody = webhookBody.replace(/@everyone/gi, '[at]everyone');
  webhookBody = webhookBody.replace(/@here/gi, '[at]here');

  // Send the requests
  for (let url of webhookUrls) {
    promises.push(request({
      method: 'POST',
      url: url + '/slack',
      headers: { 'Content-Type': 'application/json' },
      body: webhookBody,
      json: false
    }));
  }

  // Return the promise
  return Promise.all(promises);
}

/**
 * Fire webhooks for a push event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.push = (req, res, next) => {
  // Generate the webhook body
  req.body.head_commit.sha = req.body.head_commit.id.substr(0, 7);
  let webhookBody = Mustache.render(templates.push, req.body);

  if (req.body.commits.length == 0) {
    res.send({
      message: 'OK',
      hint: 'Assuming a new branch was made, discarding.'
    });
    return
  }

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a ping event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.ping = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates['ping_' + req.hookType], req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a fork event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.fork = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates.fork, req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a watch event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.watch = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates.watch, req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a commit_comment event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.commit_comment = (req, res, next) => {
  // Generate the webhook body
  req.body.comment.sha = req.body.comment.commit_id.substr(0, 7);
  req.body.comment.message = req.body.comment.body.replace(/\r?\n|\r/g, " ").substr(0, 200).trim();
  if (req.body.comment.body.length > 200) {
    req.body.comment.message += "..."
  }
  let webhookBody = Mustache.render(templates.commit_comment, req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a create event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.create = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates['create_' + req.body.ref_type], req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a delete event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.delete = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates['delete_' + req.body.ref_type], req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a member event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.member = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates.member, req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a public event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.public = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates.public, req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a release event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.release = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates.release, req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};

/**
 * Fire webhooks for a status event.
 * @param {object} req
 * @param {object} res
 * @param {object} next
 */
exports.status = (req, res, next) => {
  // Generate the webhook body
  let webhookBody = Mustache.render(templates['status_' + req.body.state], req.body);

  // Send the webhooks
  sendToDiscord(req.hook.discordWebhooks, webhookBody).then(() => {
    res.send({
      message: 'OK',
      hint: 'Sent data successfully to ' + req.hook.discordWebhooks.length + ' hooks.'
    });
  }).catch(err => {
    console.error('Failed to run hook on ' + req.body.repository.full_name + ':');
    console.error(err);

    res.status(500).send({
      message: 'InternalServerError',
      error: err
    });
  });
};
