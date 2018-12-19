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
	state:new ChainState(),

	chainLength () { return this.chain.size(); },
	blocks () { return this.chain.blocks() },
	block (i) { return this.chain.block(i) },

	/**
	 * add Transactions to Transaction Pool
	 * 
	 * @param {string[]} transactions
	 * @param {boolean} updateMiner
	 * @result {boolean}
	 */
	addTransactions (transactions, updateMiner=true) {
		let isAdded = this.transactionPool.addTransactions(transactions);
		if (isAdded && updateMiner)
			this.updateMiner();
		return isAdded
	},

	/**
	 * remove Transactions from Transaction Pool
	 * 
	 * @param {string[]} transactions
	 * @param {boolean} updateMiner
	 * @result {boolean}
	 */
	removeTransactions (transactions, updateMiner=true) {
		let isRemoved = this.transactionPool.removeTransactions(transactions);
		if (isRemoved && updateMiner)
			this.updateMiner();
		return isRemoved;
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
			console.log('blockchain : chain-accepted', Mine.mining);

			this.state = new ChainState();
			this.state.addBlocks( this.blocks() );

			let isAdded = this.transactionPool.addTransactions(data.removedTransactions, false);
			let isRemoved = this.transactionPool.removeTransactions(data.addedTransactions, false);

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
		if (!this.AmIminer())
			this.makeGetMinerPermissionTransaction();

		let transaction = new Transaction.Transmission(util.zeros64, this.wallet.getAddress(), 100).sign(this.wallet)+"";
		let transactions = [transaction, ...this.transactionPool.transactions()].slice(0,100);

		if (this.chain.blocks().length == 0)	return Mine.mineGenesis(transactions);
		else									return Mine.mineNextBlock(this.chain.topBlock, transactions);
	},

	/**
	 * On Mine Callbacks
	 *  add block to chain
	 * 
	 * @param {object} block
	 */
	onMine (block) {
		console.log('blockchain : mine new block', block.txs.length);
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

	/**
	 * calculate Chain State
	 * 
	 * @return {object} : {[addr] : state}
	 */
	calcState () {
		return this.state.state;
	},

	/**
	 * make GetMinerPermisson Transaction(once)
	 * 
	 * @return {object} transaction
	 */
	makeGetMinerPermissionTransaction () {
		let transaction = new Transaction.GetMinerPermission().sign(this.wallet)+"";

		this.makeGetMinerPermissionTransaction = () => transaction;
		this.addTransactions([transaction]);
		return transaction;
	},

	/**
	 * is my GetMinerPermissonTransaction in current chain
	 * 
	 * @return {boolean}
	 */
	AmIminer () {
		let data = this.calcState()[ this.wallet.getAddress() ];
		return data && data.miner;
	}
};

	Mine.wallet = BlockChain.wallet;
	Mine.onMine = BlockChain.onMine.bind(BlockChain);
	

module.exports = BlockChain;
module.exports.version = 1;
