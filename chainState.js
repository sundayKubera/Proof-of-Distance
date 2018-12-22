module.exports = (Storage, Bus) => {
	const ChainState = {
		state:Storage.getNameSpace('ChainState'),

		/**
		 * add transaction === update state
		 *
		 * @param {string} transaction
		 */
		addTransaction (transaction) {
			if (!Storage.call('Transaction.verify',transaction))	return false;

			transaction = Storage.call('Transaction.decode',transaction);

			if (!Storage.call(`${transaction.name}.verify`, transaction, this.state.block))	return false;

			Storage.call(`${transaction.name}.stateUpdate`, this.state, JSON.parse(transaction.data), transaction);
		},

		/**
		 * @param {string[]} transactions
		 */
		addTransactions (transactions) {
			for (let transaction of transactions)
				this.addTransaction(transaction);
		},

		/**
		 * @param {object} block
		 */
		addBlock (block) {
			Storage.set('ChainState.block',block);
			Storage.set('ChainState.index',block.index);
			this.addTransactions(block.txs);
		},

		/**
		 * @param {object[]} blocks
		 */
		addBlocks (blocks) {
			for (let block of blocks) 
				this.addBlock(block);
		},

		removeAll () {
			for (let key of Storage.getNameSpace('ChainState').keys())
				Storage.remove('ChainState.'+key);
		},
	};

	Bus.on('init', () => {
		Bus.on('Chain.onupdate', () => {
			ChainState.removeAll();
			ChainState.addBlocks(Storage.call('Chain.chain'));
		});
	});
};
module.version = 2;
