const Block = require('./block.js');
const util = require('./util.js');

const Mine = {
	wallet:null,
	mining:false,
	data:{nonce:0, miner:null, end:false, block:null},

	mineStart () {
		if (!this.mining)
			this.mineLoop(this.mining = true);
	},
	mineStop () { this.mining = false; },
	isMining () { return this.mining; },

	mineLoop () {
		if (this.data.end) {
			try {
				let block = this.data.miner.mine(this.data.nonce++, this.wallet);
				if (block) {
					this.data.block = block;
					this.data.end = true;
					this.onMine(this.data.block);
				}
			} catch (e) {}
		}
		
		setTimeout(this.mineLoop.bind(this),10);
	},

	mine (index, version, prev_hash, trx=[]) {
		this.data = {
			nonce:0, end:false, block:null,
			miner:new Block.Miner(index, version, prev_hash, trx)
		};
		this.mineStart();
	},

	mineGenesis(trx) {
		return this.mine(0, 1, util.toHex(0,64), trx);
	},

	mineNextBlock(block, trx=[]) {
		return this.mine(block.index+1, block.version, block.hash, trx);
	},

	onMine () {},
};

module.exports = Mine;