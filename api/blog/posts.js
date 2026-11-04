const handler = require('../[...path].js');

module.exports = function blogPosts(req, res) {
  if (!String(req.url || '').includes('/blog/posts')) req.url = '/api/blog/posts';
  return handler(req, res);
};
