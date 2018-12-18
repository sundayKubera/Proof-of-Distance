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

