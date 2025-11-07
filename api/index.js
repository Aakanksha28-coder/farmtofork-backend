// Vercel serverless entrypoint that wraps the Express app
const app = require('../server/server');
const serverless = require('serverless-http');
module.exports = serverless(app);