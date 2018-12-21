const { spawn } = require('child_process');

function spawnIndex (i) {
	const child = spawn('node', i==0 ? ['index.js'] : ['index.js',8000]);	

	const tabs = new Array(i).fill('\t\t    ').join('');

	child.stdout.on('data', (data) =>{
		data = (data+"").substr(0,data.length-1).replace(/\n/gi,`\n${i}${tabs}`);
		console.log(`${i}:${tabs}${data}`)
	});
	child.stderr.on('data', (data) => {
		console.error(`${i}:\t${(data+"").substr(0,data.length-1).replace(/\n/gi,`\n${i}\t`)}`)
	});
	child.on('close', (code) => console.log(`${i} exited with code ${code}`));
};

spawnIndex(0);

setTimeout(e => {
	for (let i=1; i<9; i++)
		spawnIndex(i);
},1000);