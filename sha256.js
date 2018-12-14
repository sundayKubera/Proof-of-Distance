const crypto = require('crypto');

function sha256 (data) {
	let hash = crypto.createHash('sha256');
	hash.update(data);
	return hash.digest('hex');
};
	//sha256.sha256 = sha256;

	sha256.cmp = (hashA,hashB) => {
		if (hashA == hashB)	return 0;

		for (let i=0; i<64; i++) {
			if (hashA[i] > hashB[i])	return 1;
			if (hashA[i] < hashB[i])	return -1;
		}
		return 0;
	};

module.exports = sha256;