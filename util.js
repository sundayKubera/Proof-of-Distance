
function toHex(int, len=8) {
	let hex = int.toString(16);
	
	if (hex.length > len)
		throw `toHex : '${int}' too big (len=${len})`;

	while (hex.length < len)
		hex = "0"+hex;
	
	return hex;
};

function isBlockValid (block) {
	return block.hash == block.calcHash() && isHashValid (block.hash, block.difficulty);
};

function isHashValid (hash, difficulty) {
	return hash.substr(0, difficulty) === toHex(0,difficulty)
};

module.exports.toHex = toHex;
module.exports.isBlockValid = isBlockValid;
module.exports.isHashValid = isHashValid;