const Chain = require('./chain.js');
const Wallet = require('./wallet.js');
const Transaction = require('./transaction.js');
const TransactionPool = require('./transactionPool.js');
const ChainState = require('./chainState.js');
const Mine = require('./mine.js');
const util = require('./util.js');

const BlockChain = {
	transactionPool:new TransactionPool(),
	chain:new Chain(),
	wallet:new Wallet(),

	chainLength () { return this.chain.size(); },
	blocks () { return this.chain.blocks() },
	block (i) { return this.chain.block(i) },

	/**
	 * add Transactions to Transaction Pool
	 * 
	 * @param {object[]|string[]} transactions
	 */
	addTransactions (transactions) { this.transactionPool.addTransactions(transactions); },

	/**
	 * remove Transactions from Transaction Pool
	 * 
	 * @param {object[]|string[]} transactions
	 */
	removeTransactions (transactions) { this.transactionPool.removeTransactions(transactions); },

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
			this.transactionPool.addTransactions(data.removedTransactions);
			this.transactionPool.removeTransactions(data.addedTransactions);

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
		let transactions = [transaction, ...this.transactionPool.transactions()].slice(0,100);

		if (this.chain.size() == 0)	return Mine.mineGenesis(transactions);
		else						return Mine.mineNextBlock(this.chain.topBlock, transactions);
	},

	/**
	 * On Mine Callbacks
	 *  add block to chain
	 * 
	 * @param {object} block
	 */
	onMine (block) {
		if (this.newChain([block]))
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

	calcState () {
		let chainState = new ChainState();
		chainState.addBlocks( this.blocks() );
		return chainState.state;
	}
};

	Mine.wallet = BlockChain.wallet;
	Mine.onMine = BlockChain.onMine.bind(BlockChain);

module.exports = BlockChain;
module.exports.version = 1;
