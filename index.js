const sha256 = require('./sha256.js');
const coord = require('./coord.js');
const Block = require('./block.js');
const Chain = require('./chain.js');
const Wallet = require('./wallet.js');
const util = require('./util.js');

function mineGenesis(trx) {
	return mineWithData(1, 1, util.toHex(0,64), 4, trx);
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

let chain = new Chain();

let block = mineGenesis(["block the genesis","trx : 1", "trx : 2","padding"]);
console.log( chain.newBlock(block), block );

let blockA = mineWithBlock(block, ["block A","trx : 3", "trx : 4","padding"]);
console.log( chain.newBlock(blockA), blockA );

let blockB = mineWithBlock(block, ["block B","trx : 5", "trx : 6","padding"]);
console.log( chain.newBlock(blockB), blockB );

let blockC = mineWithBlock(chain.topBlock, ["block C","trx : 7", "trx : 8","padding"]);
console.log( chain.newBlock(blockC), blockC );

console.log( chain.blocks );
console.log( chain.blocks[0].hash );
console.log( coord(chain.blocks[0].hash) );