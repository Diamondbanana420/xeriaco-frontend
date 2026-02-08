const fs = require('fs');
const path = require('path');

console.log('🔍 Validating XeriaCO Frontend Build...');

const distPath = path.join(__dirname, 'dist');
const requiredFiles = ['index.html'];

// Check if dist exists
if (!fs.existsSync(distPath)) {
  console.error('❌ FATAL: dist directory not found');
  console.log('📋 Available files:', fs.readdirSync(__dirname));
  process.exit(1);
}

console.log('✅ dist directory exists');
console.log('📁 dist contents:', fs.readdirSync(distPath));

// Check required files
for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ FATAL: Required file missing: ${file}`);
    process.exit(1);
  }
  
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    console.error(`❌ FATAL: Required file is empty: ${file}`);
    process.exit(1);
  }
  
  console.log(`✅ ${file} - ${stats.size} bytes`);
}

// Check index.html content
const indexPath = path.join(distPath, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('<div id="root">')) {
  console.error('❌ FATAL: index.html missing React root element');
  process.exit(1);
}

if (!indexContent.includes('.js')) {
  console.error('❌ FATAL: index.html missing JavaScript bundle');
  process.exit(1);
}

console.log('✅ index.html structure valid');
console.log('🎉 Build validation passed! Frontend ready to serve.');

module.exports = true;