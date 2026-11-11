const { forward } = require('../_forward.js');
module.exports = function giftById(req, res) {
  const id = req.query && (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  if (id && !String(req.url || '').includes(`/gifts/${id}`)) {
    req.url = `/api/gifts/${encodeURIComponent(id)}`;
  }
  return forward(req, res);
};
