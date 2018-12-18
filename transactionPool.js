const Transaction = require('./transaction.js');

class TransactionPool {

	constructor () {
		this.pool = [];
	}

	transactions () { return [...this.pool]; }
	size () { return this.pool.length; }

	/**
	 * add Transactions to Transaction Pool
	 * 
	 * @param {string[]} transactions
	 */
	addTransactions (transactions) {
		for (let transaction of transactions) {
			if (transaction === "padding")				continue;
			if (this.pool.indexOf(transaction) >= 0)	continue;
			if (!Transaction.verify(transaction))		continue;

			this.pool.push(transaction);
		}
	}

	/**
	 * remove Transactions from Transaction Pool
	 * 
	 * @param {string[]} transactions
	 */
	removeTransactions (transactions) {
		this.pool = this.pool.filter(transaction => transactions.indexOf(transaction) < 0);
	}
};

module.exports = TransactionPool;
module.exports.version = 1;
