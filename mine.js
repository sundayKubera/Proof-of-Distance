const Block = require('./block.js');
const util = require('./util.js');

const Mine = {
	wallet : null,

	mineGenesis(trx) {
		return this.mineWithData(0, 1, util.toHex(0,64), trx);
	},

	mineWithBlock(block, trx=[]) {
		return this.mineWithData(block.index+1, block.version, block.hash, trx);
	},

	mineWithData(index, version, prev_hash, trx=[]) {
		let miner = new Block.Miner(index, version, prev_hash, trx);

		for (let i=0; true; i++) {
			try {
				let block = miner.mine(i, this.wallet);
				if (block)
					return block;
			} catch (e) {
				throw e;
				return false;
			}
		}
		return false;
	},
};

module.exports = Mine;