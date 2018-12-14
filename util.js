const sha256 = require('./sha256.js');

function toHex(int, len=8) {
	let hex = int.toString(16);
	
	if (hex.length > len)
		throw `toHex : '${int}' too big (len=${len})`;

	while (hex.length < len)
		hex = "0"+hex;
	
	return hex;
};

function isBlockValid (block) {
	return isBlockHashValid(block.hash, block.difficulty)
		&& block.hash === calcBlockHash(block)
		&& isMrklHashValid(block.mrkl_hash, block.txs);
};

function isBlockHashValid (hash, difficulty) {
	return hash.substr(0, difficulty) === toHex(0,difficulty)
};

function isMrklHashValid(mrkl_hash, txs) {
	return mrkl_hash === calcMrklHash(txs);
};

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

module.exports.toHex = toHex;
module.exports.sha256 = sha256;
module.exports.isBlockValid = isBlockValid;
module.exports.isBlockHashValid = isBlockHashValid;
module.exports.isMrklHashValid = isMrklHashValid;
module.exports.calcBlockHash = calcBlockHash;
module.exports.calcMrklHash = calcMrklHash;