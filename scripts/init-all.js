const { exec } = require('child_process');
const path = require('path');

// Change to backend directory
const backendDir = path.join(__dirname, '..');

console.log('🚀 Initializing backend...');

// Function to execute command
const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Executing: ${command}`);
    
    const child = exec(command, { cwd: backendDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`⚠️ Stderr: ${stderr}`);
      }
      
      if (stdout) {
        console.log(`✅ Output: ${stdout}`);
      }
      
      resolve(stdout);
    });
    
    // Stream output in real-time
    child.stdout?.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr?.on('data', (data) => {
      process.stderr.write(data);
    });
  });
};

// Main initialization function
const initAll = async () => {
  try {
    console.log('📦 Installing dependencies...');
    // await executeCommand('npm install');
    
    console.log('\n🔧 Initializing settings...');
    await executeCommand('node scripts/init-settings.js');
    
    console.log('\n👤 Creating admin user...');
    await executeCommand('node scripts/create-admin.js');
    
    console.log('\n✅ All initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: cd ../react-material-admin && npm start');
    console.log('3. Login with admin credentials:');
    console.log('   - Phone: +77771111');
    console.log('   - Password: Admin123!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization
initAll();