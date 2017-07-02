# Git-to-Discord
A simple Node.js webserver to process incoming GitHub webhooks and send the data to Discord through their incoming webhooks.

**WARNING!**
Discord incoming webhooks are currently only in the canary build of the API.
The code in this repository may break at any time.

The whole idea behind this code is to make a public webserver to process any incoming webhooks from GitHub.
This means that `/register` is an open endpoint by default, and anyone can make their webhooks come through your instance.
However, the code will check for duplicate repositories (but not organizations), so no one can re-register a repository.

### Installation
Pull the code, run `npm install` in the directory, copy `src/hooks.json.default` to `src/hooks.json`, and run `node app.js` in the `src` directory.
If you would like to change the default port, use the `NODE_PORT` variable.

### Setting up webhooks
1. Open some sort of request making client like [Postman](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop) or `cURL`
2. Send a POST request to `/register/repository` or `/register/organization`
    - For a repository webhook, send the following data: `{ "repository": "username/repository-name", "discordWebhooks": ["array of valid Discord webhooks without /slack"] }`
    - For a organization webhook, send the following data: `{ "organization": "username", "discordWebhooks": ["array of valid Discord webhooks without /slack"] }`
3. Record the data it returns, you need this information for later (and to view/delete the webhook at a later date)
4. Depending on the hook type you created, you need to go to the repository or organization webhook settings page on GitHub
    - For a repository webhook, navigate to repository settings and then the *Webhooks* submenu
    - For an organization webook, navigate to organization settings and then the *Webhooks* submenu
5. Once you're on the webhooks page, click the **Add webhook** button at the top right of the *Webhooks* settings area
6. Set the *Payload URL* to `https://path.to.server/webhook/repository` or `https://path.to.server/webhook/organization` depending on the webhook type decided in step two
7. Ensure the *Content type* is set to `application/json`
8. Set the *Secret* to the secret returned by the `/register` endpoint in step three
9. Pick which events you would like to send, unsupported events will not crash the server
10. Make sure the *Active* checkbox is checked, and click the *Add webhook* button
11. If you've set things up successfully, a message should be sent to all of the Discord webhooks

### License
A copy of the MIT license can be found in `LICENSE`.
