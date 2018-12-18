const util = require('./util.js');
const Wallet = require('./wallet.js');
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

		ChainState.update(this.state, JSON.parse(transaction.data), transaction);
	}

	/**
	 * @param {string[]} transactions
	 */
	addTransactions (transactions) {
		for (let transaction of transactions)
			this.addTransaction(transaction);
	}

	/**
	 * @param {object} block
	 */
	addBlock (block) {
		this.state.block = block;
		this.state.index = block.index;
		this.addTransactions(block.txs);
	}

	/**
	 * @param {object[]} blocks
	 */
	addBlocks (blocks) {
		for (let block of blocks) 
			this.addBlock(block);
	}
};
	/**
	 * calculate state from data
	 *
	 * @param {object} state : state to update
	 * @param {object} data : transaction's data
	 * @param {object} transaction
	 */
	ChainState.update = function (state, data, transaction) {
		if (ChainState.handlers[data.type])
			ChainState.handlers[data.type](state, data, transaction);
	};
		ChainState.handlers = {
			'create-address' (state, data, transaction) {
				if (!state[data.addr])	state[data.addr] = {amount:0};
			},

			transmission (state, data, transaction) {
				this['create-address'](state, {addr:data.receiveAddr});
				this['create-address'](state, {addr:data.sendAddr});

				if (data.sendAddr === util.zeros64) {
					if (Wallet.getAddressFromPublicKey(transaction.publicKey) !== data.receiveAddr)	return false;
				} else if (Wallet.getAddressFromPublicKey(transaction.publicKey) !== data.sendAddr)	return false;

				state[data.receiveAddr].amount += data.amount;
				state[data.sendAddr].amount -= data.amount;
			},

			'get-miner-permission' (state, dataObject, transaction) {
				this['create-address'](state, {addr:transaction.address});

				let sign = transaction.sign,
					data = Transaction.encode(transaction,true),
					publicKey = Wallet.publicKey2Pem(state.block.publicKey);

				if (!Wallet.verifySign(data, sign, publicKey))	return false;

				state[transaction.addr].miner = {
					when:state.index,
					blockHash:block.hash,
					transactionHash:transaction.hash,
					name:util.sha256(state.block.hash + transaction.hash),
				};
			},
		};

module.exports = ChainState;
module.exports.version = 1;
