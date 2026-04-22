const { execSync } = require('child_process');
execSync('node --experimental-vm-modules node_modules/jest/bin/jest.js --no-cache', { 
  cwd: __dirname, 
  stdio: 'inherit' 
});
