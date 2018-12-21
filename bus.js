const EventEmitter = require('events');

class Bus extends EventEmitter {
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
}

module.exports = Bus;
module.exports.version = 1;
