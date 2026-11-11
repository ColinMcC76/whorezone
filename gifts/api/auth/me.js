const { forward } = require('../_forward.js');
module.exports = function authMe(req, res) {
  return forward(req, res, '/api/auth/me');
};
