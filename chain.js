const Block = require('./block.js');
const util = require('./util.js');

class Chain {

	constructor () {
		this.blocks = [];
	}

	get beforeBlock () {
		return this.blocks[this.blocks.length-2];
	}

	get topBlock () {
		return this.blocks[this.blocks.length-1];
	}

	addNewBlock (block) {
		if (this.blocks.length === 0 && block.index === 1) {
			this.blocks.push(block);
			return true;
		} else {
			if (this.topBlock.index+1 === block.index && this.topBlock.hash === block.prev_hash && Block.isBlockHeadValid(block)) {
				this.blocks.push(block);
				return true;
			}
		}
		return false;
	}

	replaceBlock (block) {
		if (this.topBlock.index == block.index && this.beforeBlock.hash === block.prev_hash && !util.isHashSmallerThan(this.topBlock.hash, block.hash)) {
			this.blocks.pop();
			this.blocks.push(block);
			return true;
		}
		return false;
	}

	newBlock (block) {
		if (!this.addNewBlock(block)) {
			if (!this.replaceBlock(block)) {
				return false;
			}
		}
		return true;
	}

	/*isOverLapAndContinuing (chain) {

	}

	isContinuing (chain) {
		return chain[0].index === this.topBlock.index+1 && this.topBlock.hash === chain[0].prev_hash;
	}

	isMyChain (chain) {
		if (chain[0].index !== 1)
			return this.blocks[chain[0].index-1].prev_hash === chain[0].prev_hash;
		return this.blocks[0].hash === chain[0].hash;
	}

	isChainValid (chain) {
		for (let block of chain) {
			if (!util.isBlockValid(block))
				return false;
		}
		return true;	
	}

	newChain (chain) {
		if (chain.length === 0)			return false;
		if (!this.isMyChain(chain))		return false;
		if (!this.isChainValid(chain))	return false;

		if (this.topBlock.index < chain[chain.length-1].index) {

			if (this.isContinuing(chain)) {
				this.blocks = this.blocks.concat(chain);
				return true;
			}

			if (this.isOverLapAndContinuing(chain)) {

			}
		}

	}*/
};

module.exports = Chain;