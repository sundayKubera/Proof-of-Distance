const Chain = require('./chain.js');
const Wallet = require('./wallet.js');
const Transaction = require('./transaction.js');
const Mine = require('./mine.js');
const util = require('./util.js');

	const BlockChain = {
		transactions:[],
		chain:new Chain(),
		wallet:new Wallet(),

		chainLength () { return this.chain.blocks.length; },
		blocks () { return this.chain.blocks },
		block (i) { return this.chain.blocks[i] },

		addTransactions (transactions) {
			for (let transaction of transactions) {
				transaction = transaction+"";

				if (!Transaction.verify(transaction))				continue;
				if (this.transactions.indexOf(transaction) >= 0)	continue;

				this.transactions.push(transaction);
			}
		},

		removeTransactions (transactions) {
			this.transactions = this.transactions.filter(transaction => transactions.indexOf(transaction) < 0);
		},

		newChain (chain) {
			let data = this.chain.newChain(chain);

			if (data) {
				this.addTransactions(data.removedTransactions);
				this.removeTransactions(data.addedTransactions);
			}
		},

		updateMiner () {
			let transaction = new Transaction.Builder.Transmission(util.toHex(0,64), this.wallet.getAddress(), 100).sign(this.wallet);
			if (this.chain.length == 0)	return Mine.mineGenesis([transaction, ...this.transactions]);
			else						return Mine.mineNextBlock(this.chain.topBlock, [transaction, ...this.transactions]);
		},
		
		onMine (block) {
			this.newChain([block]);
			this.updateMiner();
		},

		walletInfo (private=false) {
			if (private) {
				return {
					addr:this.wallet.getAddress(),
					public:this.wallet.getPublicKey(),
					private:this.wallet.save()
				};
			}

			return {
				addr:this.wallet.getAddress(),
				public:this.wallet.getPublicKey()
			};
		},

	};

	Mine.wallet = BlockChain.wallet;
	Mine.onMine = BlockChain.onMine.bind(BlockChain);

module.exports = BlockChain;
module.exports.version = 1;
