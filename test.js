const hash = require('./sha256.js');
const coord = require('./coord.js');

function randomNameDistanceTest () {

	let randoms = new Array(500).fill(0).map(e => Math.random()*1000+""),
		hashes = randoms.map(random => hash(random)),
		coords = hashes.map(hash => coord(hash)),
		dists = [];

	for (let i=0; i<coords.length; i++) {
		for (let j=i+1; j<coords.length; j++){
			let distance = coord.distance(coords[i], coords[j]);
			dists.push(distance);
		}
	}

	let distSorted = [...dists].sort(),
		distMax = distSorted[0],
		distMean = distSorted[Math.floor(dists.length/2)],
		distMin = distSorted[dists.length-1],
		distAverage = 0;

	for (let dist of dists)
		distAverage += dist;

	distAverage = distAverage/dists.length;

	console.log('Max : \t\t',distMax);
	console.log('Mean : \t\t',distMean);
	console.log('Min : \t\t',distMin);
	console.log('Average : \t',distAverage);

};

function miningTimeTest () {// about 8zero to 10zero is good enough
	const minute = 1000*60;

	let startTime = Date.now(),
		buffer = ["ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"];

	for (let i=0; true; i++) {
		let currentTime = Date.now();
		buffer = [[buffer[0], hash(startTime+""+i)].sort()[0]];

		if (currentTime > startTime + minute ) {
			console.log(buffer[0]);
			break;
		}
	}

	setTimeout(miningTimeTest,minute/6);
};