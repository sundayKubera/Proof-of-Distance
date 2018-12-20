const crypto = require('crypto');

/**
 * Hash a String
 *
 * @param {string} data
 * @return {string} : hash
 */
function sha256 (data) {
	let hash = crypto.createHash('sha256');
	hash.update(data);
	return hash.digest('hex');
};

module.exports.sha256 = sha256;