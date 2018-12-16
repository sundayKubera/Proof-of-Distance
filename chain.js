const Block = require('./block.js');
const util = require('./util.js');

class Chain {

	constructor () {
		this.blocks = [];
	}

	block (i) {
		return this.blocks[i-1];
	}

	isChainValid (chain) {
		for (let block of chain) {
			if (!util.isBlockValid(block))
				return false;
		}
		return true;	
	}
	
	isSameChain (chain) {
		if (chain[0].index === 1)	return chain[0].hash === this.block(1).hash;
		else				return chain[0].prev_hash === this.block(chain[0].index).prev_hash;
	}
	
	isBetterChain (chain) {
		let score = 0;
		for (let newBlock of chain) {
			let block = this.block(newBlock.index);
			
			if (!block) {
				score++;
				continue;
			} else if (block.hash === newBlock.hash) {
				continue;
			} else {
				let isNewBlockBig = util.isHashSmallerThan(block.hash, newBlock.hash);
				score += isNewBlockBig ? -1 : 1;
			}
		}
		return score > 0;
	}
	
	replaceChain (chain) {
		this.blocks = [...chain];
	}
	
	newChain (chain) {
		if (!this.isChainValid(chain))	return false;
		if (!this.isSameChain(chain))	return false;
		if (!this.isBetterChain(chain))	return false;
		this.replaceChain(chain);
		return true;
	}
};

module.exports = Chain;

module.exports.version = 1;
