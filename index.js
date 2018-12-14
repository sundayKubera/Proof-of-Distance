const sha256 = require('./sha256.js');
const coord = require('./coord.js');
const Block = require('./block.js');
const util = require('./util.js');

function mineGenesis(trx) {
	return mineWithData(1, 1, util.toHex(0,64), 5, trx);
};

function mineWithData(index, version, prev_hash, difficulty, trx=[]) {
	let miner = new Block.MineHelper(index, version, prev_hash, Math.floor(Date.now()/1000), difficulty, trx);

	for (let i=0; true; i++) {
		try {
			let block = miner.mine(i);
			if (block)
				return block;
		} catch (e) {
			return false;
		}
	}
	return false;
};

function mineWithBlock(block, trx=[]) {
	return mineWithData(block.index+1, block.version, block.hash, block.difficulty, trx);
};

let blocks = [mineGenesis(["trx : 1", "trx : 2"])];
console.log(blocks[0]);

blocks.push( mineWithBlock(blocks[0], ["trx : 3", "trx : 4"]) );
console.log(blocks[1]);

blocks.push( mineWithBlock(blocks[1], ["trx : 5", "trx : 6"]) );
console.log(blocks[2]);
