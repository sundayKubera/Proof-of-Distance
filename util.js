const crypto = require('crypto');

/**
 * Convert Int in to Hex String
 *  just using it for "0"*64(can be removed)
 *
 * @param {int} int
 * @param {int} len : result string.length (default 8)
 * @return {string} : hex string
 */
function toHex(int, len=8) {
	let hex = int.toString(16);
	
	if (hex.length > len)
		throw `toHex : '${int}' too big (len=${len})`;

	while (hex.length < len)
		hex = "0"+hex;
	
	return hex;
};

module.exports.toHex = toHex;

/* checking functions */

	/**
	 * Convert Int in to Hex String
	 *  currently not using it(can be removed)
	 *
	 * @param {string} small_hash
	 * @param {string} big_hash
	 * @return {boolen} : is small_hash is smaller then big_hash
	 */
	function isHashSmallerThan(small_hash, big_hash) {
		return [small_hash,big_hash].sort()[0] == small_hash;
	};

	module.exports.isHashSmallerThan = isHashSmallerThan;

/* hasing functions */

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

