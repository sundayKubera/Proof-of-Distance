const sha256 = require('./sha256.js');
const util = require('./util.js'),
	toHex = util.toHex;

class Block {

/*
	this.hash = "";

	this.index = 1;			//int
	this.version = 1;		//int
	this.prev_hash = "";	//prev blocks hash
	//this.mrkl_root = "";	//
	this.timestamp = 0;		//block created time
	this.difficulty = 8;	//count of zeros
	this.nonce = 0;			//what ever intz

	//this.txs = [];
	//this.mrkl_tree = [];
*/
	constructor (index, version, prev_hash, timestamp, difficulty, nonce, hash) {

		this.hash = hash;

		this.index = index;
		this.version = version;
		this.prev_hash = prev_hash;
		this.timestamp = timestamp;
		this.difficulty = difficulty;
		this.nonce = nonce;
	}

	calcHash () {
		let base = [toHex(this.index), toHex(this.version), this.prev_hash, toHex(this.timestamp), toHex(this.difficulty), toHex(this.nonce) ].join("");
		return sha256(base);
	}
};

	Block.Miner = class BlockMiner {

		constructor (index, version, prev_hash, timestamp, difficulty) {

			this.index = index;
			this.version = version;
			this.prev_hash = prev_hash;
			this.timestamp = timestamp;
			this.difficulty = difficulty;

			this.set = [
				toHex(this.index),
				toHex(this.version),
				this.prev_hash,
				toHex(this.timestamp),
				toHex(this.difficulty),
			].join("");

		}

		mine (nonce) {
			let hash = sha256(this.set+toHex(nonce));
			
			if (util.isHashValid(hash, this.difficulty))
				return new Block(this.index, this.version, this.prev_hash, this.timestamp, this.difficulty, nonce, hash);
			return false;
		}
	};


module.exports = Block;