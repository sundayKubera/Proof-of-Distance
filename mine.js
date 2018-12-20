module.exports = (Storage,Bus) => {
	const Mine = {
		miningLoop () {

		},
	};

	Bus.on('init', () => {
		setInterval(Mine.miningLoop.bind(Mine,10));
	});
};
module.exports.version = 2;