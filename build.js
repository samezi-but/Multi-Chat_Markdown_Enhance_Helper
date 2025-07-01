#!/usr/bin/env node

/**
 * Multi-Chat Markdown Enhance Helper - Build Script
 * Builds the Chrome extension for distribution
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = './';
const RELEASE_DIR = './release';
const EXCLUDE_PATTERNS = [
  /^\.git/,
  /^node_modules/,
  /^release/,
  /^build\.js$/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /\.md$/,
  /^CLAUDE\.md$/,
  /^LICENSE$/,
  /^\.gitignore$/,
  /^userscripts/,
  /^icons\/create_icons\.py$/
];

const INCLUDE_FILES = [
  'manifest.json',
  'content.js',
  'popup.html',
  'popup.js',
  'popup.css',
  '_locales',
  'icons'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Utility functions
function shouldExcludeFile(filePath) {
  const relativePath = path.relative(SOURCE_DIR, filePath);
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath));
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFileSync(src, dest) {
  ensureDirectoryExists(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    logWarning(`Source directory does not exist: ${src}`);
    return;
  }

  ensureDirectoryExists(dest);
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (shouldExcludeFile(srcPath)) {
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function cleanReleaseDirectory() {
  logStep('CLEAN', 'Cleaning release directory...');
  
  if (fs.existsSync(RELEASE_DIR)) {
    fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
    logSuccess('Release directory cleaned');
  } else {
    logSuccess('Release directory already clean');
  }
}

function copyFiles() {
  logStep('COPY', 'Copying files to release directory...');
  
  ensureDirectoryExists(RELEASE_DIR);
  
  let copiedCount = 0;
  
  for (const file of INCLUDE_FILES) {
    const srcPath = path.join(SOURCE_DIR, file);
    const destPath = path.join(RELEASE_DIR, file);
    
    if (!fs.existsSync(srcPath)) {
      logWarning(`Source file/directory does not exist: ${srcPath}`);
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
      copiedCount++;
      logSuccess(`Copied directory: ${file}`);
    } else {
      copyFileSync(srcPath, destPath);
      copiedCount++;
      logSuccess(`Copied file: ${file}`);
    }
  }
  
  logSuccess(`Total ${copiedCount} items copied`);
}

function validateManifest() {
  logStep('VALIDATE', 'Validating manifest.json...');
  
  const manifestPath = path.join(RELEASE_DIR, 'manifest.json');
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Required fields validation
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      logError(`Missing required fields in manifest: ${missingFields.join(', ')}`);
      return false;
    }
    
    logSuccess(`Manifest validated - Version: ${manifest.version}`);
    logSuccess(`Extension name: ${manifest.name}`);
    
    return true;
  } catch (error) {
    logError(`Invalid manifest.json: ${error.message}`);
    return false;
  }
}

function generateReleaseInfo() {
  logStep('INFO', 'Generating release information...');
  
  const manifestPath = path.join(RELEASE_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const releaseInfo = {
    name: manifest.name,
    version: manifest.version,
    build_date: new Date().toISOString(),
    build_files: INCLUDE_FILES,
    description: manifest.description
  };
  
  const releaseInfoPath = path.join(RELEASE_DIR, 'release-info.json');
  fs.writeFileSync(releaseInfoPath, JSON.stringify(releaseInfo, null, 2));
  
  logSuccess('Release information generated');
}

function showSummary() {
  logStep('SUMMARY', 'Build completed successfully!');
  
  const manifestPath = path.join(RELEASE_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  log('\n' + '='.repeat(50), 'bright');
  log('BUILD SUMMARY', 'bright');
  log('='.repeat(50), 'bright');
  log(`Extension: ${manifest.name}`, 'blue');
  log(`Version: ${manifest.version}`, 'blue');
  log(`Release Directory: ${RELEASE_DIR}`, 'blue');
  log(`Build Time: ${new Date().toLocaleString()}`, 'blue');
  log('='.repeat(50), 'bright');
  
  log('\nNext steps:', 'bright');
  log('1. Test the extension by loading the release folder in Chrome', 'yellow');
  log('2. Create a ZIP file for Chrome Web Store submission', 'yellow');
  log('3. Submit to Chrome Web Store', 'yellow');
}

// Main build process
function main() {
  try {
    log('\n🚀 Multi-Chat Markdown Enhance Helper - Build Script', 'bright');
    log('Starting build process...\n', 'cyan');
    
    cleanReleaseDirectory();
    copyFiles();
    
    if (!validateManifest()) {
      process.exit(1);
    }
    
    generateReleaseInfo();
    showSummary();
    
    log('\n✨ Build completed successfully!', 'green');
    
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the build
if (require.main === module) {
  main();
}

module.exports = {
  main,
  cleanReleaseDirectory,
  copyFiles,
  validateManifest
};