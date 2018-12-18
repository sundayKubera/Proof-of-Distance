const Wallet = require('./wallet.js');
const util = require('./util.js');

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
	 *  is Transaction.encode really need?
	 *
	 * @return {string}
	 */
	toString () {
		return JSON.stringify(Transaction.encode(this,true));
	}
};
	/* encode & decode */
		/**
		 * Convert Transaction Object into Array
		 *
		 * @param {object} transaction
		 * @param {boolen} isNotForHash : default true
		 * @return {string}
		 */
		Transaction.encode = function (transaction,isNotForHash=false) {//Object => Array
			if (isNotForHash)
				return [transaction.hash, transaction.sign, transaction.address, transaction.publicKey, transaction.data, transaction.timestamp];
			return [transaction.address, transaction.publicKey, transaction.data, transaction.timestamp];
		};
		/**
		 * Convert Array into Transaction Object
		 *
		 * @param {string} transaction : Transaction.encode(...)
		 * @return {object} : instanceof Transaction
		 */
		Transaction.decode = function (transaction) {//(Array | String) => Object
			if (transaction+"" === transaction)
				transaction = JSON.parse(transaction);
			return new Transaction( ...transaction );
		};

	/* check */
		/**
		 * Check if Transaction Valid
		 *  check hash & sign & address
		 *
		 * @param {object|array|string} transaction
		 * @return {boolen}
		 */
		Transaction.verify = function (transaction) {
			let tx = transaction;

			if (tx+"" === tx)			tx = JSON.parse(tx);
			if (tx instanceof Array)	tx = Transaction.decode(tx);

			if (util.sha256(JSON.stringify(Transaction.encode(tx, false))) !== tx.hash)		return false;	//it attacked by someone!!!
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
		let data_json = JSON.stringify(this.data);
		let transaction_json = Transaction.encode({
			address:	wallet.getAddress(),
			publicKey:	wallet.getPublicKey(),
			data:		data_json,
			timestamp:	Date.now()
		}, false);
		let hash = util.sha256(JSON.stringify(transaction_json));
		let sign = wallet.getSign(hash);

		transaction_json.unshift( sign );
		transaction_json.unshift( hash );
		return new Transaction(...transaction_json);
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
		this.data.type = "transmission";
		this.data.receiveAddr = receiveAddr;
		this.data.sendAddr = sendAddr;
		this.data.amount = amount;
	}
}

module.exports = Transaction;
module.exports.Builder = TransactionBuilder;
module.exports.Builder.Transmission = TransmissionBuilder;

module.exports.version = 1;
