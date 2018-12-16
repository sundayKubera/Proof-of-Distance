const Block = require('./block.js');
const util = require('./util.js');

const Mine = {
	mineGenesis(trx) {
		return this.mineWithData(1, 1, util.toHex(0,64), 4, trx);
	},

	mineWithBlock(block, trx=[]) {
		return this.mineWithData(block.index+1, block.version, block.hash, block.difficulty, trx);
	},

	mineWithData(index, version, prev_hash, difficulty, trx=[]) {
		let miner = new Block.MineHelper(index, version, prev_hash, difficulty, trx);
		miner.timestamp = Date.now();

		for (let i=0; true; i++) {
			try {
				miner.nonce = i;

				let block = miner.mine();
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