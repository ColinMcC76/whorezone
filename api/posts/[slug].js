const handler = require('../[...path].js');

module.exports = function postBySlug(req, res) {
  const slug = req.query && (Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug);
  if (slug && !String(req.url || '').includes(`/posts/${slug}`)) {
    req.url = `/api/posts/${encodeURIComponent(slug)}`;
  }
  return handler(req, res);
};
