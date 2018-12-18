const Transaction = require('./transaction.js');

class ChainState {
	constructor () {
		this.state = {};
	}

	/**
	 * add transaction === update state
	 *
	 * @param {string} transaction
	 */
	addTransaction (transaction) {
		if (!Transaction.verify(transaction))	return false;

		transaction = Transaction.decode(transaction);

		ChainState.update(this.state, JSON.parse(transaction.data));

		console.log(this.state);
	}

	addTransactions (transactions) {
		for (let transaction of transactions)
			this.addTransaction(transaction);
	}

	addBlock (block) {
		this.addTransactions(block.txs);
	}

	addBlocks (blocks) {
		for (let block of blocks)
			this.addTransactions(block.txs);
	}
};
	ChainState.update = function (state, data) {
		if (ChainState.handlers[data.type])
			ChainState.handlers[data.type](state, data);
	};
		ChainState.handlers = {
			'create-address' (store, addr) {
				if (!store[addr])	store[addr] = {amount:0};
			},

			transmission (store, data) {
				this['create-address'](store, data.receiveAddr);
				this['create-address'](store, data.sendAddr);

				store[data.receiveAddr].amount += data.amount;
				store[data.sendAddr].amount -= data.amount;
			}
		};

module.exports = ChainState;
module.exports.version = 1;
