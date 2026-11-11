const { forward } = require('../_forward.js');
module.exports = function authLogin(req, res) {
  return forward(req, res, '/api/auth/login');
};
