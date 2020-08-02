const { spawn } = require('child_process');

const child = spawn('./node_modules/http-server/bin/http-server');

child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  console.log(chunk);
});

// since these are streams, you can pipe them elsewhere
// child.stderr.pipe(dest);

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});