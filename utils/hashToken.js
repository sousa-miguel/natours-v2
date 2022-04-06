const crypto = require('crypto');

module.exports = (hash, token, digest) =>
  crypto.createHash(hash).update(token).digest(digest);
