const Wallet = require('./wallet.js');
const util = require('./util.js');

class Transaction {
	constructor (hash, sign, address, publicKey, data, timestamp) {
		this.hash = hash;
		this.sign = sign;
		this.address = address;
		this.publicKey = publicKey;
		this.data = data;
		this.timestamp = timestamp;
	}

	toString () {
		return JSON.stringify(Transaction.encode(this,true));
	}
};
	/* encode & decode */
		Transaction.encode = function (transaction,include_hash=false) {//Object => Array
			if (include_hash)
				return [transaction.hash, transaction.sign, transaction.address, transaction.publicKey, transaction.data, transaction.timestamp];
			return [transaction.address, transaction.publicKey, transaction.data, transaction.timestamp];
		};
		Transaction.decode = function (transaction) {//(Array | String) => Object
			if (transaction+"" === transaction)
				transaction = JSON.parse(transaction);
			return new Transaction( ...transaction );
		};

	/* check */
		Transaction.verify = function (transaction) {
			let tx = transaction;

			if (tx+"" === tx)
				tx = Transaction.decode(JSON.parse(transaction));

			if (util.sha256(JSON.stringify(Transaction.encode(tx, false))) !== tx.hash)
																							return false;	//it attacked by someone!!!
			if (!Wallet.verifySign(tx.hash, tx.sign, Wallet.publicKey2Pem(tx.publicKey)))	return false;	//it is fake!!!
			if (Wallet.getAddressFromPublicKey(tx.publicKey) !== tx.address)				return false;	//it is fake!!!

			return true;
		};

class TransactionBuilder {
	constructor () {
		this.data = {};
	}

	sign (wallet) {
		let data_json = JSON.stringify(this.data);
		let transaction_json = Transaction.encode({
			//sign:		wallet.getSign(data_json),
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
