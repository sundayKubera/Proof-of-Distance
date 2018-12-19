const Block = require('./block.js');
const util = require('./util.js');

const Mine = {
	wallet:null,
	mining:false,
	data:{nonce:0, miner:null, end:false, block:null},

	startMine () { this.mining = true; },
	stopMine () { this.mining = false; },
	isMining () { return this.mining; },

	/**
	 * Mining Loop
	 *  random mining
	 */
	mineLoop () {
		for (let i=0; this.mining && !this.data.end && i < 1000; i++) {
			try {
				let block = this.data.miner.mine(this.data.nonce, this.wallet);
				if (block) {
					this.data.end = true;
					this.data.block = block;
					this.onMine(this.data.block);
				}
				this.data.nonce = Math.floor(Math.random()*10000);
			} catch (e) {
				console.error(e);
			}
		}
		
		setTimeout(this.mineLoop.bind(this),10);
	},

	/**
	 * Mining start
	 * 
	 * @param {int} index
	 * @param {int} version
	 * @param {string} prev_hash
	 * @param {object[]|string[]} txs
	 */
	mine (index, version, prev_hash, txs=[]) {
		this.data = {
			nonce:0, end:false, block:null,
			miner:new Block.Miner(index, version, prev_hash, txs)
		};

		this.data.miner.mine(this.data.nonce, this.wallet);
		this.startMine();
	},

	/**
	 * Mine Genesis Block
	 * 
	 * @param {object[]|string[]} txs
	 */
	mineGenesis(txs) {
		console.log("mine : mineGenesis");
		return this.mine(0, 1, util.zeros64, txs);
	},

	/**
	 * Mine Next Block
	 * 
	 * @param {object} block
	 * @param {object[]|string[]} txs
	 */
	mineNextBlock(block, txs=[]) {
		console.log("mine : mineNextBlock", block.index+1, txs.length);
		return this.mine(block.index+1, block.version, block.hash, txs);
	},

	/**
	 * On Mine Callback
	 * 
	 * @param {object} block
	 */
	onMine (block) {},
};

Mine.mineLoop();

module.exports = Mine;
module.exports.version = 1;
