const crypto = require('crypto');

module.exports.zeros64 = new Array(64).fill(0).join("");

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

/**
 * Calc Vector from Hash String
 *
 * @param {stirng} hash		:  0000000000000000 00000000 00000000 00000000 00000000 00000000 00000000  <- hex string
 * @param {int[]} structure	: |       16       |   8    |   8    |   8    |   8    |   8    |   8    | <- like this
 * @return {int[]} : vector
 */
function Coord (hash, structure=false) {
	let coord = [];

	structure = structure || Coord.structure;

	for (let i=0, start=0; i<structure.length; i++) {
		let part = hash.substr(start, structure[i]);

		if (i > 0)	coord.push( parseInt(part, 16) || 0 );
		
		start += structure[i];
	}

	return coord.map(val => parseInt(val,16) || 0);
};
	Coord.structure = [8+8,8,8,8,8,8,8];	//skip first(zeros), sum = 64
	//Coord.structure = [4+12,12,12,12,12];

	/**
	 * Calc Distance**2 between two Vectors with no
	 *
	 * @param {int[]} coordA
	 * @param {int[]} coordV
	 * @return {int} : distance
	 */
	Coord.distance = function (coordA, coordB) {
		if (coordA.length != coordB.length)	return Infinity;

		var dist = 0;
		for (let i=0; i<coordA.length; i++)
			dist += (coordA[i]-coordB[i])*(coordA[i]-coordB[i]);
		return dist;
	};

module.exports.Coord = Coord;

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
