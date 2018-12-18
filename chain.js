const Block = require('./block.js');
const util = require('./util.js');

class Chain {

	/**
	 * Create Simple Chain
	 *
	 */
	constructor () {
		this.chain = [];
	}

	/**
	 * Get Block[i]
	 * 
	 * @param {int} i : index
	 * @return {object} : block
	 */
	block (i) { return this.chain[i]; }
	blocks () { return [...this.chain]; }
	size () { return this.chain.length; }

	/**
	 * Get Top Block
	 * 
	 * @return {object} : block
	 */
	get topBlock () { return this.chain[this.chain.length-1]; }

	/**
	 * Check if chain Valid
	 * 
	 * @param {object[]} chain
	 * @return {boolean}
	 */
	isChainValid (chain) {
		let i = 0, prev_hash = "";
		for (let block of chain) {
			if (block.txs.length == 0 && !Block.isBlockHeadValid(block))	return false;
			if (block.txs.length && !Block.isBlockValid(block))				return false;
			if (i > 0 && block.prev_hash !== prev_hash)						return false;
			prev_hash = block.hash;
			i++;
		}
		return true;	
	}

	/**
	 * Check if new chain is completely same with my chain
	 *  not checking transactions, just checking hash
	 * 
	 * @param {object[]} chain
	 * @return {boolean}
	 */
	isCompleteSameChain (chain) {
		return chain.map(block => block.hash).join() === this.chain.map(block => block.hash).join();
	}
	
	/**
	 * Check new chain has more transaction data then my chain
	 *  new chain is completely same with my chain
	 * 
	 * @param {object[]} chain
	 * @return {boolean}
	 */
	itHasMoreTransactionData (chain) {
		for (let block of chain) {
			if (block.txs.length > 0 && this.block(block.index).txs.length === 0) {
				if (!Block.isBlockValid(block))	return false;
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Check if new chain is not unrelated to my chain
	 *  not checking transactions, just checking hash
	 * 
	 * @param {object[]} chain
	 * @return {boolean}
	 */
	isSameOriginChain (chain) {
		if (this.chain.length === 0)	return true;
		else if (chain[0].index === 0)	return chain[0].hash === this.block(0).hash;
		else							return chain[0].prev_hash === this.block(chain[0].index-1).hash;
	}

	/**
	 * Check if new chain is longer & closer then my chain
	 *  closer : distance between block hash and wallet address
	 * 
	 * @param {object[]} chain
	 * @return {boolean}
	 */
	isBetterChain (chain) {
		if (this.chain.length === 0)					return true;
		if (chain[0].index === this.topBlock.index+1)	return true;

		let longerLength = Math.max(chain.length, this.chain.length);
		let newChainScore = this.scoreChain(chain);
		let currChainScore = this.scoreChain(this.chain);

		if (newChainScore < currChainScore)												return true;
		else if (newChainScore == currChainScore && chain.length > this.chain.length)	return true;
		return false;
	}

	/**
	 * Calculate chain's score(lower score wins)
	 *  closer chain got lower score
	 * 
	 * @param {object[]} chain
	 * @param {int} longerLength : if Chain is shorter then Score is lower, so add Average Score
	 * @return {double}
	 */
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
	
	/**
	 * Replace My chain to New chain
	 *  calculate transaction change
	 * 
	 * @param {object[]} chain
	 * @return {object} : transaction changes
	 *  @return {string[]} removedTransactions
	 *  @return {string[]} addedTransactions
	 */
	replaceChain (chain) {
		let removedTransactions = [],
			addedTransactions = [];

		for (let block of chain) {
			if (this.chain[block.index])
				removedTransactions = removedTransactions.concat(this.chain[block.index].txs.map(v => v+""));
			addedTransactions = addedTransactions.concat(block.txs.map(v => v+""));

			this.chain[block.index] = block;
		}

		return {
			removedTransactions:removedTransactions.filter(transaction => addedTransactions.indexOf(transaction) < 0),
			addedTransactions:addedTransactions.filter(transaction => removedTransactions.indexOf(transaction) < 0)
		};
	}
	
	/**
	 * New chain Recived
	 *  if it's better then My chain then replace to it
	 * 
	 * @param {string|string[]|object[]} chain
	 * @return {boolean|object} : false | transaction changes
	 */
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
