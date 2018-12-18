const crypto = require('crypto');

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

	function isHashSmallerThan(small_hash, big_hash) {
		return [small_hash,big_hash].sort()[0] == small_hash;
	};

	module.exports.isHashSmallerThan = isHashSmallerThan;

/* hasing functions */

	function sha256 (data) {
		let hash = crypto.createHash('sha256');
		hash.update(data);
		return hash.digest('hex');
	};

	module.exports.sha256 = sha256;

