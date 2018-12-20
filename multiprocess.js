const { spawn } = require('child_process');

function spawnIndex (i) {
	const child = spawn('node', i==0 ? ['index.js'] : ['index.js',8000]);	

	child.stdout.on('data', (data) => console.log(`${i}: ${(data+"").substr(0, data.length-1)}`));
	child.stderr.on('data', (data) => console.error(`${i}: ${(data+"").substr(0, data.length-1)}`));
	child.on('close', (code) => console.log(`${i} exited with code ${code}`));
}

for (let i=0; i<2; i++)
	spawnIndex(i);