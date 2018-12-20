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

		/**
		 * Convert Transaction Object into String
		 *
		 * @param {object} transaction
		 * @param {boolen} isForHash : default true
		 * @return {string}
		 */
		static encode (transaction,isForHash=false) {
			return util.encode(transaction, isForHash ? Transaction.hash_properties : Transaction.transaction_properties);
		};
		
		/**
		 * Convert String into Transaction Object
		 *
		 * @param {string} transaction : Transaction.encode(...)
		 * @return {object} : instanceof Transaction
		 */
		static decode (transaction) { return util.decode(transaction, Transaction); };

		/**
		 * Check if Transaction Valid
		 *  check hash & sign & address
		 *
		 * @param {string} transaction
		 * @return {boolen}
		 */
		static verify (transaction) {
			let tx = Transaction.decode(transaction);

			if (util.sha256(Transaction.encode(tx, true)) !== tx.hash)							return false;	//it attacked by someone!!!
			if (!Storage.call('Wallet.verifySign', tx.hash, tx.sign, tx.publicKey))				return false;	//it is fake!!!
			if (tx.address !== Storage.call('Wallet.getAddressFromPublicKey', tx.publicKey))	return false;	//it is fake!!!

			return true;
		};
	};
		Transaction.transaction_properties = "hash,sign,address,publicKey,data,timestamp".split(",");
		Transaction.hash_properties = "address,publicKey,data,timestamp".split(",");
	
	class TransactionBuilder {
		/**
		 * Create Basic Transaction Builder Object
		 */
		constructor () { this.data = {}; }

		/**
		 * Sign on this Transaction
		 *
		 * @param {object} wallet : needs to sign
		 * @return {object} : Transaction Object
		 */
		sign (wallet) {
			let transaction_json = Storage.call('Transaction.encode',{
				address:	Storage.get('Wallet.address'),
				publicKey:	Storage.get('Wallet.publicKey'),
				data:		JSON.stringify(this.data),
				timestamp:	Date.now()
			}, true);
			
			let hash = util.sha256(transaction_json);
			let sign = wallet.getSign(hash);

			return Storage.call('Transaction.create', hash, sign, ...JSON.parse(transaction_json));
		}

		/**
		 * verify Transaction( to use in verify accepted transactions )
		 *
		 * @param {object} transaction : to verify
		 * @param {object} block : to use in verify
		 * @return {boolean}
		 */
		static verify (transaction, block) {
			return Storage.call('Transaction.verify',transaction);
		}
	};

	Bus.on('init', () => {
		Storage.set('Transaction', Transaction);
		Storage.set('Transaction.create', (...args) => new Transaction(...args));
		Storage.set('Transaction.verify', Transaction.verify);
		Storage.set('Transaction.encode', Transaction.encode);
		Storage.set('Transaction.decode', Transaction.decode);

		Storage.set('Transaction.Builder', TransactionBuilder);
		Storage.set('Transaction.Builder.verify', TransactionBuilder.verify);
	});
};
module.exports.version = 2;