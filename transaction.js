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
		toString () { return Transaction.encode(this); }

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
		constructor () { this.data = {name:this.name}; }

		/**
		 * Sign on this Transaction
		 *
		 * @param {object} wallet : needs to sign
		 * @return {object} : Transaction Object
		 */
		sign () {
			let transaction_json = Storage.call('Transaction.encode',{
				address:	Storage.get('Wallet.address'),
				publicKey:	Storage.get('Wallet.publicKey'),
				data:		JSON.stringify(this.data),
				timestamp:	Date.now()
			}, true);
			
			let hash = util.sha256(transaction_json);
			let sign = wallet.getSign(hash);

			return Storage.call('Transaction.create', hash, sign, ...JSON.parse(transaction_json))+"";
		}

		/**
		 * verify Transaction( to use in verify accepted transactions )
		 *
		 * @param {object} transaction : to verify
		 * @param {object} block : to use in verify
		 * @return {boolean}
		 */
		static verify (transaction, block) { return Storage.call('Transaction.verify',transaction); }


		/**
		 * register TransactionBuilder Class
		 *
		 * @param {string} name
		 * @param {function} CLASS
		 */
		static register (name, CLASS) {
			CLASS.prototype.name = `Transaction.${name}`;
			Storage.set(`Transaction.${name}`, CLASS);
			Storage.set(`Transaction.${name}.verify`, CLASS.verify);
			Storage.set(`Transaction.${name}.create`, (...args) => new CLASS(...args).sign());
		}
	};

	class TransmissionBuilder extends TransactionBuilder {
		/**
		 * Create Basic TransmissonTransaction Builder Object
		 *  it needs to sign by sendAddr
		 *  but it can sign by reciveAddr when sendAddr is "0"*64
		 *
		 * @param {string} sendAddr
		 * @param {string} receiveAddr
		 * @param {int} amount
		 */
		constructor (sendAddr, 	receiveAddr, amount) {
			super();
			this.data.receiveAddr = receiveAddr;
			this.data.sendAddr = sendAddr;
			this.data.amount = amount;
		}

		/**
		 * verify Transaction Data
		 *
		 * @param {object} transaction : to verify
		 * @return {boolean}
		 */
		static verify (transaction) {
			if (transaction.data.sendAddr === util.zeros64) {
				if (transaction.address !== transaction.data.receiveAddr)	return false;
			} else if (transaction.address !== transaction.data.sendAddr)	return false;
			return true;
		}
	};

	class MinerPermissionBuilder extends TransactionBuilder {
		constructor () {
			super();
		}

		/**
		 * verify Transaction
		 *
		 * @param {object} transaction : to verify
		 * @return {boolean}
		 */
		static verify (transaction, block) {
			let sign = transaction.sign,
				data = Transaction.encode(transaction,true);

			return Storage.call('Wallet.verifySign', data, sign, block.publicKey);
		}
	};

	Storage.set('Transaction', Transaction);
	Storage.set('Transaction.create', (...args) => new Transaction(...args));
	Storage.set('Transaction.verify', Transaction.verify);
	Storage.set('Transaction.encode', Transaction.encode);
	Storage.set('Transaction.decode', Transaction.decode);

	Storage.set('Transaction.Builder.register', TransactionBuilder.register);

	Bus.on('init', () => {
		Storage.call('Transaction.Builder.register', 'Builder', TransactionBuilder);
		Storage.call('Transaction.Builder.register', 'Transmisson', TransmissionBuilder);
		Storage.call('Transaction.Builder.register', 'MinerPermission', MinerPermissionBuilder);
	});
};
module.exports.version = 2;