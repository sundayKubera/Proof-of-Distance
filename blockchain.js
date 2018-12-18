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

	/**
	 * add Transactions to Transaction Pool
	 * 
	 * @param {object[]|string[]} transactions
	 */
	addTransactions (transactions) {
		for (let transaction of transactions) {
			transaction = transaction+"";

			if (transaction === "padding")						continue;
			if (!Transaction.verify(transaction))				continue;
			if (this.transactions.indexOf(transaction) >= 0)	continue;

			this.transactions.push(transaction);
		}
	},

	/**
	 * remove Transactions from Transaction Pool
	 * 
	 * @param {object[]|string[]} transactions
	 */
	removeTransactions (transactions) {
		this.transactions = this.transactions.filter(transaction => transactions.indexOf(transaction+"") < 0);
	},

	/**
	 * New chain Recived
	 *  if New chain accepted
	 *   sync Transaction Pool
	 *   update Miner data
	 * 
	 * @param {object[]} chain
	 * @return {boolean} : is accepted ??
	 */
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

	/**
	 * update Miner data when Chain change 
	 *  make publish transaction
	 */
	updateMiner () {
		let transaction = new Transaction.Builder.Transmission(util.zeros64, this.wallet.getAddress(), 100).sign(this.wallet)+"";
		let transactions = [transaction, ...this.transactions];

		console.log("updateMiner");
		if (this.chain.blocks.length == 0)	return Mine.mineGenesis(transactions);
		else								return Mine.mineNextBlock(this.chain.topBlock, transactions);
	},

	/**
	 * On Mine Callbacks
	 *  add block to chain
	 * 
	 * @param {object} block
	 */
	onMine (block) {
		this.newChain([block]);
		this.onOnMine(block);
	},
	onOnMine () {},

	/**
	 * get Wallet info
	 * 
	 * @param {boolean} private : i need PrivateKey right now
	 * @return {object}
	 *  @return {string} addr : wallet address
	 *  @return {string} public : wallet public key
	 *  @return {string} private(optional) : wallet private key
	 */
	walletInfo (private=false) {
		if (private) {
			return {
				addr:this.wallet.getAddress(),
				public:this.wallet.getPublicKey(),
				private:this.wallet.getPrivateKey()
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
