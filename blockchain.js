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

				if (transaction === "padding")						continue;
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

				if (Mine.mining)
					this.updateMiner();
				return true;
			}
			return false;
		},

		updateMiner () {
			let transaction = new Transaction.Builder.Transmission(util.toHex(0,64), this.wallet.getAddress(), 100).sign(this.wallet)+"";

			let transactions = [transaction, ...this.transactions];
			if (transactions.length % 2 === 1) {
				if (transactions.length > 1)	transactions.pop();
				else							transactions.push("padding");
			}

			console.log("updateMiner");
			if (this.chain.blocks.length == 0)	return Mine.mineGenesis(transactions);
			else								return Mine.mineNextBlock(this.chain.topBlock, transactions);
		},

		onMine (block) {
			this.newChain([block]);
			this.onOnMine(block);
		},
		onOnMine () {},

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
