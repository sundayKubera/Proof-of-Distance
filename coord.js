function Coord (hash, structure=false) {
	let coord = [];

	structure = structure || Coord.structure;

	for (let start=0, i=0; i<structure.length; i++) {
		let part = hash.substr(start, structure[i]);
		start += structure[i];

		if (i > 0)	//skip first(zeros)
			coord.push( parseInt(part, 16) || 0 );
	}

	return coord;
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