const handler = require('./[...path].js');

function forward(req, res, forcePath) {
  if (forcePath && !String(req.url || '').includes(forcePath.replace(/^\/api/, ''))) {
    req.url = forcePath;
  }
  return handler(req, res);
}

module.exports = { forward, handler };
