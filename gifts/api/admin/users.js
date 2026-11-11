const { forward } = require('../_forward.js');
module.exports = function adminUsers(req, res) {
  return forward(req, res, '/api/admin/users');
};
