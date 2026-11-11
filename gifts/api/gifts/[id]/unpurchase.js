const { forward } = require('../../_forward.js');
module.exports = function giftUnpurchase(req, res) {
  const id = req.query && (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id);
  if (id) req.url = `/api/gifts/${encodeURIComponent(id)}/unpurchase`;
  return forward(req, res);
};
