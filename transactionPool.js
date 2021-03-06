module.exports = (Storage,Bus) => {

	const TransactionPool = {
		pool:[],

		/**
		 * add Transactions to Transaction Pool
		 * 
		 * @param {string[]} transactions
		 * @result {boolean}
		 */
		addTransactions (transactions) {
			let beforeSize = this.pool.length;
			for (let transaction of transactions) {
				if (transaction === "padding")							continue;
				if (this.pool.indexOf(transaction) >= 0)				continue;
				if (!Storage.call('Transaction.verify',transaction))	continue;
				if (Storage.call('Transaction.Transmisson.isPublishTransaction', transaction)) continue;

				this.pool.push(transaction);
			}

			if (beforeSize !== this.pool.length)
				Bus.emit('TransactionPool.onupdate');
			return beforeSize !== this.pool.length
		},

		/**
		 * remove Transactions from Transaction Pool
		 * 
		 * @param {string[]} transactions
		 * @result {boolean}
		 */
		removeTransactions (transactions) {
			let beforeSize = this.pool.length;
			this.pool = this.pool.filter(transaction => transactions.indexOf(transaction) < 0);

			if (beforeSize !== this.pool.length)
				Bus.emit('TransactionPool.onupdate');
			return beforeSize !== this.pool.length;
		},
	};
		
	class TransactionRequest {
		static async make (...args) { return []; }
		static handler (addr, msg) { Bus.emit('Protocol.send', addr, 'Transaction.Response'); }
	};
	class TransactionResponse {
		constructor (transactions) { this.transactions = transactions; }
		static async make () { return [Storage.call('TransactionPool.transactions')];  }
		static handler (addr, msg) { Storage.call('TransactionPool.addTransactions', msg.transactions); }
	};
	class TransactionBroadCast {
		constructor (transactions) { this.transactions = transactions; }
		static async make (transactions) { return [transactions];  }
		static handler (addr, msg) { Storage.call('TransactionPool.addTransactions', msg.transactions); }
	};

	Storage.set('TransactionPool.transactions', () => [...TransactionPool.pool]);
	Storage.set('TransactionPool.addTransactions', TransactionPool.addTransactions.bind(TransactionPool));
	Storage.set('TransactionPool.removeTransactions', TransactionPool.removeTransactions.bind(TransactionPool));

	Bus.once('init', () => {
		//Transaction
			Storage.call('Protocol.register','Transaction.Request', TransactionRequest);
			Storage.call('Protocol.register','Transaction.Response', TransactionResponse);
			Storage.call('Protocol.register','Transaction.BroadCast', TransactionBroadCast);
	});
};
module.exports.version = 2;