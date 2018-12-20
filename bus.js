const EventEmitter = require('events');

class Bus extends EventEmitter {
	constructor (nameSpace="") {
		super();
		this.nameSpace = nameSpace+":"
	}


	/**
	 * emit that needs Return
	 *
	 * @param {string|sybole} name
	 * @param {...anything} args
	 * @return {object} : promise
	 */
	call (name, ...args) {
		return new Promise((resolve, reject) => {
			this.emit(this.nameSpace+name, {resolve, reject}, ...args);
		});
	}

	/**
	 * on that makes Return
	 *
	 * @param {string|sybole} name
	 * @param {function} listener
	 * @return {object} : self
	 */
	onCall (name, listener, once=false) {
		return this[once ? "once" : "on"](this.nameSpace+name, listener.listener = (response, ...args) => {
			try {
				response.resolve(listener(...args));
			} catch (error) {
				console.error(error);
				response.resolve(false);
				//response.reject(error);
			}
		});
	}
	onceCall (name, listener) { return this.onCall(this.nameSpace+name, listener, true); }

	/**
	 * off that makes Return
	 *
	 * @param {string|sybole} name
	 * @param {function} listener
	 * @return {object} : self
	 */
	offCall (name, listener) { return this.off(this.nameSpace+name, listener.listener); }

	/**
	 * create view of nameSpace
	 *
	 * @return {object} : instance of Bus
	 */
	getNameSpace (nameSpace='global') {
		let result = Object.create(this);
		result.nameSpace = this.nameSpace+nameSpace+":";

		if (nameSpace == 'global')
			result.nameSpace = ":";

		return result;
	}
}

module.exports = Bus;
module.exports.version = 1;
