// Test script to verify project structure
const fs = require('fs');
const path = require('path');

console.log('=== Even Browser Project Structure Test ===');

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✓ package.json exists');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`  - Electron version: ${packageData.dependencies.electron}`);
} else {
  console.log('✗ package.json missing');
}

// Check main files
const mainFiles = ['main.js', 'preload.js'];
mainFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`✗ ${file} missing`);
  }
});

// Check src directory structure
const srcDirs = [
  'src/ui',
  'src/pages',
  'src/extensions',
  'src/db',
  'assets/icons'
];

srcDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✓ ${dir} directory exists`);
  } else {
    console.log(`✗ ${dir} directory missing`);
  }
});

// Check UI files
const uiFiles = [
  'src/ui/index.html',
  'src/ui/styles.css',
  'src/ui/animations.css',
  'src/ui/browser.js'
];

uiFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`✗ ${file} missing`);
  }
});

// Check pages
const pageFiles = [
  'src/pages/welcome.html'
];

pageFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`✗ ${file} missing`);
  }
});

// Check extensions
const extensionFiles = [
  'src/extensions/whitelist.json',
  'src/extensions/manager.js'
];

extensionFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`✗ ${file} missing`);
  }
});

console.log('=== Test Complete ===');
