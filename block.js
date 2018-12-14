const util = require('./util.js'),
	toHex = util.toHex;

class Block {
	
	constructor (index, version, prev_hash, mrkl_hash, timestamp, difficulty, txs, nonce, hash) {

		this.hash = hash;

		this.index = index;
		this.version = version;

		this.prev_hash = prev_hash;
		this.mrkl_hash = mrkl_hash;

		this.timestamp = timestamp;
		this.difficulty = difficulty;

		this.txsLength = txs.length;
		this.txsSize = JSON.stringify(txs).length;

		this.nonce = nonce;

		this.txs = txs;
	}

	toArray () {
		return [
			toHex(this.index),
			toHex(this.version),

			this.prev_hash,
			this.mrkl_hash,

			toHex(this.timestamp),
			toHex(this.difficulty),

			toHex(this.txsLength),
			toHex(this.txsSize),
			
			toHex(this.nonce)
		];
	}

	toString () {
		return JSON.stringify(this);
	}
};

	Block.MineHelper = class BlockMineHelper extends Block {

		constructor (index, version, prev_hash, timestamp, difficulty, txs=[]) {
			super(index, version, prev_hash, util.calcMrklHash(txs), timestamp, difficulty, txs, 0, "");
		}

		mine (nonce) {
			this.nonce = nonce;

			let hash = util.calcBlockHash(this), t = this;
			if (util.isBlockHashValid(hash, this.difficulty))
				return new Block(t.index, t.version, t.prev_hash, t.mrkl_hash, t.timestamp, t.difficulty, t.txs, nonce, hash);
			return false;
		}

		toString () {
			return `<MineHelper ${JSON.stringify(this)}>`;
		}
	};

module.exports = Block;