const sha256 = require('./sha256.js');

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
	function isBlockValid (block) {
		return isBlockHashValid(block.hash, block.difficulty)
			&& block.hash === calcBlockHash(block)
			&& isMrklHashValid(block.mrkl_hash, block.txs);
	};

	function isBlockHeadValid (block) {
		return isBlockHashValid(block.hash, block.difficulty)
			&& block.hash === calcBlockHash(block);
	};

	function isBlockHashValid (hash, difficulty) {
		return hash.substr(0, difficulty) === toHex(0,difficulty)
	};

	function isMrklHashValid(mrkl_hash, txs) {
		return mrkl_hash === calcMrklHash(txs);
	};

	function isHashSmallerThan(small_hash, big_hash) {
		return [small_hash,big_hash].sort()[0] == small_hash;
	};

	module.exports.isBlockValid = isBlockValid;
	module.exports.isBlockHashValid = isBlockHashValid;
	module.exports.isMrklHashValid = isMrklHashValid;
	module.exports.isHashSmallerThan = isHashSmallerThan;

/* hasing functions */
	function calcBlockHash (block) {
		let base = block.toArray().join("");
		return sha256(base);
	};

	function calcMrklHash (txs) {
		if (txs.length % 2 !== 0)	throw `calcMrklHash : txs.length is not even`;

		let hashes = txs.map(tx => sha256(tx));
		while (hashes.length > 1) {
			let nextHashBuffer = [];
			for (let i=0; i<hashes.length; i+=2)
				nextHashBuffer.push( sha256(hashes[i]+hashes[i+1]) );
			hashes = nextHashBuffer;
		}
		return hashes[0];
	};

	module.exports.sha256 = sha256;
	module.exports.calcBlockHash = calcBlockHash;
	module.exports.calcMrklHash = calcMrklHash;

/* encode('data array' => 'string') && decode('string' => 'data array') */
	function encode(array) {
		return [
			toHex(array.length),
			array.map(value => value+"" === value ? "c" : "i").join(""),	//data types
			array.filter(value => value+"" === value).map(string => toHex(string.length)).join(""),
			...array.map(value => value+"" !== value ? toHex(value) : value)
		].join("");
	};

	function decode(string, struct=false, types=false) {
		if (!struct) {
			let result = findOutStructure(string);
			struct = result.struct;
			string = result.string;
			types = result.types;
		}

		let decodedData = [];

		for (let start=0, i=0; i<struct.length; i++) {
			let part = string.substr(start, struct[i]);

			if (types && types[i] === "i")	part = parseInt(part, 16) || 0;

			decodedData.push( part );
			start += struct[i];
		}

		return decodedData;
	};

	function findOutStructure(string) {

		let length = parseInt(string.substr(0,8),16);
		string = string.substr(8);

		let	types = string.substr(0, length);
		string = string.substr(length);

		let struct = [];
		for (let i=0; i<types.length; i++) {
			if (types[i] === "i")	struct.push(8);
			else if (types[i] === "c") {
				struct.push( parseInt(string.substr(0,8),16) )
				string = string.substr(8);
			}
		}

		return { struct, string, types };
	}

	module.exports.encode = encode;
	module.exports.decode = decode;
