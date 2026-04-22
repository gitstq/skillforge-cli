const { execSync } = require('child_process');
const result = execSync('node -e "import(\'./src/index.js\').then(m => console.log(JSON.stringify(Object.keys(m))))"', { cwd: __dirname, encoding: 'utf8' });
console.log(result);
