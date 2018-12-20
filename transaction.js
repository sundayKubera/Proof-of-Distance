const util = require("./util.js");

module.exports = (Storage,Bus) => {

	class Transaction {
		/**
		 * Create Basic Transaction Object
		 *
		 * @param {string} hash : hash of (address, publicKey, data, timestamp)
		 * @param {string} sign : wallet.getSign(hash)
		 * @param {string} address : wallet.getAddress()
		 * @param {string} publicKey : wallet.getPublicKey()
		 * @param {any} data : some data
		 * @param {int} timestamp : Generated time
		 */
		constructor (hash, sign, address, publicKey, data, timestamp) {
			this.hash = hash;
			this.sign = sign;
			this.address = address;
			this.publicKey = publicKey;
			this.data = data;
			this.timestamp = timestamp;
		}

		/**
		 * Convert Transaction Object into String
		 *  is Transaction.encode really need? yes it needs for compressing
		 *
		 * @return {string}
		 */
		toString () {
			return Transaction.encode(this);
		}
	};

	Storage.set('Transaction', Transaction);

	Bus.on('init', () => {

	});
};
module.exports.version = 2;