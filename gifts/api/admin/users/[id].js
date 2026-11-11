const { forward } = require('../../_forward.js');
module.exports = function adminUserById(req, res) {
  const id = req.query && (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  if (id) req.url = `/api/admin/users/${encodeURIComponent(id)}`;
  return forward(req, res);
};
