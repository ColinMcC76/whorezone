const { forward } = require('../_forward.js');
module.exports = function authRegister(req, res) {
  return forward(req, res, '/api/auth/register');
};
