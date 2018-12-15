const util = require('./util.js');

class Block {

	constructor (hash, index, version, prev_hash, mrkl_hash, timestamp, difficulty, txsLength, txsSize, nonce, txs=false) {

		this.hash = hash;

		this.index = index;
		this.version = version;

		this.prev_hash = prev_hash;
		this.mrkl_hash = mrkl_hash;

		this.timestamp = timestamp;
		this.difficulty = difficulty;

		this.txsLength = txsLength;
		this.txsSize = txsSize;

		this.nonce = nonce;

		this.txs = [];

		if (txs !== false) {
			if (!this.setTransactions(txs))
				throw new Error(`Block : unValidBlock : 'transactions' or 'mrkl hash' is not valid`);
		}

		if (!Block.isBlockHeadValid(this)) {
			throw new Error(`Block : unValidBlock : 'block head' is not valid`);
		}
	}

	setTransactions (txs) {
		if (txs.length !== this.txsLength)					return false;
		if (JSON.stringify(txs).length !== this.txsSize)	return false;
		if (!Block.isMrklHashValid(this.mrkl_hash, txs))	return false;
		this.txs = txs;
		return true;
	}

	toString (include_txs=false) {
		return JSON.stringify(Block.encode(this,include_txs));
	}
};
	/* encode & decode */
		Block.encode = function (block,include_txs=false) {//Object => Array
			let result = [block.hash, block.index, block.version, block.prev_hash, block.mrkl_hash, block.timestamp, block.difficulty, block.txsLength, block.txsSize, block.nonce];
			if (include_txs)
				result.push(block.txs);
			return result;
		};
		Block.decode = function (block) {//(Array | String) => Object
			if (block+"" === block)
				block = JSON.parse(block);
			return new Block(...block);
		};

	/* hash functions */
		Block.calcBlockHash = function (block) {//block = Object
			let blockdata = Block.encode(block);
			blockdata.shift();
			return util.sha256( JSON.stringify(blockdata) );
		};

		Block.calcMrklHash = function (txs) {
			if (txs.length % 2 !== 0)	throw `calcMrklHash : txs.length is not even`;

			let hashes = txs.map(tx => util.sha256(tx));
			while (hashes.length > 1) {
				let nextHashBuffer = [];
				for (let i=0; i<hashes.length; i+=2)
					nextHashBuffer.push( util.sha256(hashes[i]+hashes[i+1]) );
				hashes = nextHashBuffer;
			}
			return hashes[0];
		};

	/* check functions */
		Block.isBlockValid = function (block) {
			return Block.isBlockHeadValid(block)
				&& Block.isMrklHashValid(block.mrkl_hash, block.txs);
		};

		Block.isBlockHeadValid = function (block) {
			return Block.isBlockDifficultyValid(block.hash, block.difficulty)
				&& block.hash === Block.calcBlockHash(block);
		};

		Block.isBlockDifficultyValid = function (hash, difficulty) {
			return (hash+"").substr(0, difficulty) === util.toHex(0,difficulty)
		};

		Block.isMrklHashValid = function(mrkl_hash, txs) {
			return mrkl_hash === Block.calcMrklHash(txs);
		};


	Block.MineHelper = class BlockMineHelper {

		constructor (index, version, prev_hash, difficulty, txs=[]) {

			this.hash = "";

			this.index = index;
			this.version = version;

			this.prev_hash = prev_hash;
			this.mrkl_hash = Block.calcMrklHash(txs);

			this.timestamp = Date.now();
			this.difficulty = difficulty;

			this.txsLength = txs.length;
			this.txsSize = JSON.stringify(txs).length;

			this.nonce = 0;
			this.txs = txs;
		}

		mine () {
			this.hash = Block.calcBlockHash(this);

			let t = this;
			if (Block.isBlockDifficultyValid(this.hash, this.difficulty)) {
				return new Block(t.hash, t.index, t.version, t.prev_hash, t.mrkl_hash, t.timestamp, t.difficulty, t.txsLength, t.txsSize, t.nonce, t.txs);
			}
			return false;
		}
	};

module.exports = Block;

module.exports.version = 1;
