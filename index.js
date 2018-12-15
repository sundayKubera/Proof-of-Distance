const Block = require('./block.js');
const Chain = require('./chain.js');
const Wallet = require('./wallet.js');
const Transaction = require('./transaction.js');
const util = require('./util.js');

function mineGenesis(trx) {
	return mineWithData(1, 1, util.toHex(0,64), 4, trx);
};

function mineWithData(index, version, prev_hash, difficulty, trx=[]) {
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
};

function mineWithBlock(block, trx=[]) {
	return mineWithData(block.index+1, block.version, block.hash, block.difficulty, trx);
};
