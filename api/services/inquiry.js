const handler = require('../[...path].js');

module.exports = function servicesInquiry(req, res) {
  if (!String(req.url || '').includes('/services/inquiry')) {
    req.url = '/api/services/inquiry';
  }
  return handler(req, res);
};
