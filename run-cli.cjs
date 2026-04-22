const { execSync } = require('child_process');
const cmd = process.argv.slice(2).join(' ');
execSync(`node src/cli.js ${cmd}`, { cwd: __dirname, stdio: 'inherit' });
