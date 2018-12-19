const Wallet = require('./wallet.js');
const util = require('./util.js');

class Transaction {
	/**
	 * Create Basic Transaction Object
	 *  todo : have to add 'node registration transaction'
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
	/* encode & decode */
		Transaction.transaction_properties = "hash,sign,address,publicKey,data,timestamp".split(",");
		Transaction.hash_properties = "address,publicKey,data,timestamp".split(",");

		/**
		 * Convert Transaction Object into String
		 *
		 * @param {object} transaction
		 * @param {boolen} isForHash : default true
		 * @return {string}
		 */
		Transaction.encode = function (transaction,isForHash=false) { return util.encode(transaction, isForHash ? Transaction.hash_properties : Transaction.transaction_properties); };
		
		/**
		 * Convert String into Transaction Object
		 *
		 * @param {string} transaction : Transaction.encode(...)
		 * @return {object} : instanceof Transaction
		 */
		Transaction.decode = function (transaction) { return util.decode(transaction, Transaction); };

	/* check */
		/**
		 * Check if Transaction Valid
		 *  check hash & sign & address
		 *
		 * @param {string} transaction
		 * @return {boolen}
		 */
		Transaction.verify = function (transaction) {
			let tx = Transaction.decode(transaction);

			if (util.sha256(Transaction.encode(tx, true)) !== tx.hash)		return false;	//it attacked by someone!!!
			if (!Wallet.verifySign(tx.hash, tx.sign, Wallet.publicKey2Pem(tx.publicKey)))	return false;	//it is fake!!!
			if (Wallet.getAddressFromPublicKey(tx.publicKey) !== tx.address)				return false;	//it is fake!!!

			return true;
		};

class TransactionBuilder {
	/**
	 * Create Basic Transaction Builder Object
	 *
	 */
	constructor () {
		this.data = {};
	}

	/**
	 * Sign on this Transaction
	 *
	 * @param {object} wallet : needs to sign
	 * @return {object} : Transaction Object
	 */
	sign (wallet) {
		let transaction_json = Transaction.encode({
			address:	wallet.getAddress(),
			publicKey:	wallet.getPublicKey(),
			data:		JSON.stringify(this.data),
			timestamp:	Date.now()
		}, true);
		
		let hash = util.sha256(transaction_json);
		let sign = wallet.getSign(hash);

		return new Transaction(hash, sign, ...JSON.parse(transaction_json));
	}


	/**
	 * verify Transaction( to use in verify accepted transactions )
	 *
	 * @param {object} transaction : to verify
	 * @param {object} block : to use in verify
	 * @return {boolean}
	 */
	static verify (transaction, block) {
		return Transaction.verify(transaction);
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
		this.data.type = 'transmission';
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
}

class GetMinerPermissionBuilder extends TransactionBuilder {
	constructor () {
		super();
		this.data.type = 'get-miner-permission';
	}

	/**
	 * verify Transaction
	 *
	 * @param {object} transaction : to verify
	 * @return {boolean}
	 */
	static verify (transaction, block) {
		let sign = transaction.sign,
			data = Transaction.encode(transaction,true),
			publicKey = Wallet.publicKey2Pem(block.publicKey);

		return Wallet.verifySign(data, sign, publicKey);
	}
};

module.exports = Transaction;
module.exports.Builder = TransactionBuilder;
module.exports.Transmission = TransmissionBuilder;
module.exports.GetMinerPermission = GetMinerPermissionBuilder;

module.exports.version = 1;
