const util = require("./util.js");

function Coord (hash, structure=false) {
	let coord = [];

	structure = structure || Coord.structure;

	coord = util.decode(hash, structure);
	coord.shift();//drop first(zeros)

	return coord.map(val => parseInt(val,16) || 0);
};
	Coord.structure = [8+8,8,8,8,8,8,8];	//skip first(zeros), sum = 64
	//Coord.structure = [4+12,12,12,12,12];

	Coord.distance = function (coordA, coordB) {
		if (coordA.length != coordB.length)	return Infinity;

		var dist = 0;
		for (let i=0; i<coordA.length; i++)
			dist += (coordA[i]-coordB[i])*(coordA[i]-coordB[i]);
		return dist;
	};

module.exports = Coord;
module.exports.version = 1;