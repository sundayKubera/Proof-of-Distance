const EventEmitter = require('events');

class Bus extends EventEmitter {
	constructor () {
		super();
	}

	request (name, ...args) {
		return new Promise((resolve, reject) => {
			this.emit(name, {resolve, reject}, ...args);
		});
	}

	onRequest (name, listener) {
		return this.on(name, (response, ...args) => {
			try {
				response.resolve(listener(...args));
			} catch (error) {
				response.reject(error);
			}
		});
	}
}

module.exports = Bus;
module.exports.version = 1;
