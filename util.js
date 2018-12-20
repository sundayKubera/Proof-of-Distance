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

/* encode & decode */

	/**
	 * Convert Object into String
	 *
	 * @param {object} object
	 * @param {string[]} properties : sequence of properties
	 * @return {string}
	 */
	function encode (object, properties=[]) {
		let encoded = [];

		for (let property of properties)
			encoded.push( object[property] );

		return JSON.stringify(encoded);
	};

	/**
	 * Convert String into Object
	 *
	 * @param {string} object : util.encode(...)
	 * @return {object} : instanceof CLASS
	 */
	function decode (array, CLASS=Object) {
		return new CLASS(...JSON.parse(array));
	};

module.exports.encode = encode;
module.exports.decode = decode;
module.exports.version = 1;
