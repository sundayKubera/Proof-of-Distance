const Block = require('./block.js');
const util = require('./util.js');

class Chain {

	constructor () {
		this.blocks = [];
	}

	get topBlock () {
		return this.blocks[this.blocks.length-1];
	}

	block (i) {
		return this.blocks[i];
	}

	isChainValid (chain) {
		let i = 0, prev_hash = "";
		for (let block of chain) {
			if (!Block.isBlockHeadValid(block))			return false;
			if (i > 0 && block.prev_hash !== prev_hash)	return false;
			prev_hash = block.hash;
			i++;
		}
		return true;	
	}

	isCompleteSameChain (chain) {
		return chain.map(block => block.hash).join() === this.blocks.map(block => block.hash).join();
	}
	
	isSameOriginChain (chain) {
		if (this.blocks.length === 0)	return true;
		else if (chain[0].index === 0)	return chain[0].hash === this.block(0).hash;
		else							return chain[0].prev_hash === this.block(chain[0].index-1).hash;
	}

	itHasMoreTransactionData (chain) {
		for (let block of chain) {
			if (block.txs.length > this.block(block.index).txs.length) {
				if (!Block.isBlockValid(block))	return false;
				return true;
			}
		}
		return false;
	}

	isBetterChain (chain) {
		if (this.blocks.length === 0)					return true;
		if (chain[0].index === this.topBlock.index+1)	return true;

		let longerLength = Math.max(chain.length, this.blocks.length);
		let newChainScore = this.scoreChain(chain);
		let currChainScore = this.scoreChain(this.blocks);

		if (newChainScore < currChainScore)												return true;
		else if (newChainScore == currChainScore && chain.length > this.blocks.length)	return true;
		return false;
	}

	scoreChain (chain, longerLength=0) {
		let resultScore = 0;

		for (let block of chain) {
			let score = block.hash.length - block.hash.replace(/^0*/i,"").length;
			resultScore += score;
		}

		if (chain.length < longerLength)
			resultScore += resultScore/chain.length * (longerLength-chain.length);

		return resultScore;
	}
	
	replaceChain (chain) {
		let removedTransactions = [],
			addedTransactions = [];

		for (let block of chain) {
			if (this.blocks[block.index])
				removedTransactions = removedTransactions.concat(this.blocks[block.index].txs.map(v => v+""));
			addedTransactions = addedTransactions.concat(block.txs.map(v => v+""));

			this.blocks[block.index] = block;
		}

		return {
			removedTransactions:removedTransactions.filter(transaction => addedTransactions.indexOf(transaction) < 0),
			addedTransactions:addedTransactions.filter(transaction => removedTransactions.indexOf(transaction) < 0)
		};
	}
	
	newChain (chain) {
		if (typeof chain === "string")		chain = JSON.parse(chain);
		if (!(chain[0] instanceof Block))	chain = chain.map(block => Block.encode(block));

		if (chain.length === 0)				return false;

		if (this.isCompleteSameChain(chain)) {
			if (this.itHasMoreTransactionData(chain))
				return this.replaceChain(chain);
			return false;
		}

		if (!this.isChainValid(chain))		return false;
		if (!this.isSameOriginChain(chain))	return false;
		if (!this.isBetterChain(chain))		return false;
		return this.replaceChain(chain);
	}
};

module.exports = Chain;

module.exports.version = 1;
